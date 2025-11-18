import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { sql } from '@/lib/db';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6302', {
  maxRetriesPerRequest: null,
});

const ABANDONMENT_THRESHOLD_MINUTES = 15;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

/**
 * Detect and create abandoned cart records
 */
async function detectAbandonedCarts() {
  console.log('[Worker] Starting abandoned cart detection...');

  try {
    // Find cart sessions that:
    // 1. Are active (not already abandoned)
    // 2. Have items in cart
    // 3. Haven't been updated in 15+ minutes
    const idleCarts = await sql`
      SELECT
        cs.id,
        cs.session_id,
        cs.user_id,
        cs.email,
        cs.phone,
        cs.cart_data,
        cs.total_value,
        cs.item_count,
        cs.last_activity_at,
        cs.source,
        cs.utm_source,
        cs.utm_medium,
        cs.utm_campaign,
        cs.device_type
      FROM cart_sessions cs
      WHERE cs.status = 'active'
      AND cs.item_count > 0
      AND cs.last_activity_at < NOW() - INTERVAL '${ABANDONMENT_THRESHOLD_MINUTES} minutes'
      AND NOT EXISTS (
        SELECT 1 FROM abandoned_carts ac
        WHERE ac.session_id = cs.session_id
      )
    `;

    console.log(`[Worker] Found ${idleCarts.length} idle carts`);

    if (idleCarts.length === 0) {
      return { processed: 0, created: 0 };
    }

    let created = 0;

    for (const cart of idleCarts) {
      try {
        // Extract product info from cart_data for email display
        const cartData = cart.cart_data as any;
        const productImages: string[] = [];
        const productNames: string[] = [];

        // Get product details
        if (cartData.items && Array.isArray(cartData.items)) {
          for (const item of cartData.items) {
            productNames.push(item.productName || 'Unknown Product');

            // Fetch product image if we have product ID
            if (item.productId) {
              const product = await sql`
                SELECT image_url FROM products WHERE id = ${parseInt(item.productId)} LIMIT 1
              `;
              if (product[0]?.image_url) {
                productImages.push(product[0].image_url);
              }
            }
          }
        }

        // Generate recovery token (JWT with 7-day expiration)
        const recoveryToken = jwt.sign(
          {
            sessionId: cart.session_id,
            email: cart.email,
            cartValue: cart.total_value,
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Determine abandonment stage based on cart data
        let abandonmentStage = 'cart';
        if (cartData.checkoutStarted) {
          abandonmentStage = 'checkout_started';
        }
        if (cartData.shippingCompleted) {
          abandonmentStage = 'checkout_shipping';
        }
        if (cartData.paymentStarted) {
          abandonmentStage = 'checkout_payment';
        }

        // Create abandoned cart record
        await sql`
          INSERT INTO abandoned_carts (
            session_id,
            user_id,
            email,
            phone,
            cart_data,
            total_value,
            item_count,
            product_images,
            product_names,
            status,
            abandonment_stage,
            abandoned_at,
            recovery_token,
            recovery_token_expires_at,
            source,
            utm_source,
            utm_medium,
            utm_campaign,
            device_type
          ) VALUES (
            ${cart.session_id},
            ${cart.user_id},
            ${cart.email},
            ${cart.phone},
            ${JSON.stringify(cart.cart_data)}::jsonb,
            ${cart.total_value},
            ${cart.item_count},
            ${JSON.stringify(productImages)}::jsonb,
            ${JSON.stringify(productNames)}::jsonb,
            'abandoned',
            ${abandonmentStage},
            ${cart.last_activity_at},
            ${recoveryToken},
            NOW() + INTERVAL '7 days',
            ${cart.source},
            ${cart.utm_source},
            ${cart.utm_medium},
            ${cart.utm_campaign},
            ${cart.device_type}
          )
          ON CONFLICT (session_id) DO NOTHING
        `;

        // Update cart_sessions to mark as abandoned
        await sql`
          UPDATE cart_sessions
          SET
            status = 'abandoned',
            abandoned_at = ${cart.last_activity_at},
            recovery_token = ${recoveryToken},
            recovery_token_expires_at = NOW() + INTERVAL '7 days',
            updated_at = NOW()
          WHERE session_id = ${cart.session_id}
        `;

        created++;
        console.log(`[Worker] Created abandoned cart: ${cart.session_id} (value: $${cart.total_value / 100})`);
      } catch (error) {
        console.error(`[Worker] Error processing cart ${cart.session_id}:`, error);
      }
    }

    console.log(`[Worker] Completed: ${created}/${idleCarts.length} abandoned carts created`);

    return {
      processed: idleCarts.length,
      created,
    };
  } catch (error) {
    console.error('[Worker] Error in detectAbandonedCarts:', error);
    throw error;
  }
}

/**
 * Create and start the worker
 */
export function createAbandonedCartWorker() {
  const worker = new Worker(
    'abandoned-carts',
    async (job) => {
      console.log(`[Worker] Processing job ${job.id}: ${job.name}`);

      if (job.name === 'detect-abandoned-carts') {
        return await detectAbandonedCarts();
      }

      throw new Error(`Unknown job type: ${job.name}`);
    },
    {
      connection: redisConnection,
      concurrency: 1, // Process one job at a time
      limiter: {
        max: 10, // Max 10 jobs per duration
        duration: 60000, // 1 minute
      },
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error);
  });

  worker.on('error', (error) => {
    console.error('[Worker] Worker error:', error);
  });

  console.log('[Worker] Abandoned cart worker started');

  return worker;
}

// Auto-start worker if this file is run directly
if (require.main === module) {
  createAbandonedCartWorker();
  console.log('[Worker] Running in standalone mode. Press Ctrl+C to stop.');
}
