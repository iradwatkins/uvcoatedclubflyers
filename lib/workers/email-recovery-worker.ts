import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { sql } from '@/lib/db';
import nodemailer from 'nodemailer';
import {
  generateEmail1,
  generateEmail2,
  generateEmail3,
} from '@/lib/email-templates/abandoned-cart';
import { addTrackingPixelToEmail } from '@/lib/email-templates/tracking';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6302', {
  maxRetriesPerRequest: null,
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Generate a unique discount code
 */
function generateDiscountCode(prefix: string = 'SAVE'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Send Email 1: Gentle Reminder (1 hour after abandonment)
 */
async function sendEmail1() {
  console.log('[Email Worker] Checking for Email 1 candidates...');

  try {
    // Find abandoned carts that:
    // 1. Are in 'abandoned' status
    // 2. Have email address
    // 3. Were abandoned 1+ hours ago
    // 4. Haven't sent first email yet
    const carts = await sql`
      SELECT
        ac.id,
        ac.session_id,
        ac.email,
        ac.cart_data,
        ac.total_value,
        ac.item_count,
        ac.product_names,
        ac.product_images,
        ac.recovery_token,
        ac.abandoned_at,
        u.name as customer_name
      FROM abandoned_carts ac
      LEFT JOIN users u ON ac.user_id = u.id
      WHERE ac.status = 'abandoned'
      AND ac.email IS NOT NULL
      AND ac.abandoned_at < NOW() - INTERVAL '1 hour'
      AND ac.first_email_sent_at IS NULL
      LIMIT 50
    `;

    console.log(`[Email Worker] Found ${carts.length} carts for Email 1`);

    let sent = 0;

    for (const cart of carts) {
      try {
        const cartData = cart.cart_data as any;
        const productNames = cart.product_names as string[];
        const productImages = cart.product_images as string[];

        // Build products array
        const products =
          cartData.items?.map((item: any, index: number) => ({
            name: item.productName || productNames[index] || 'Product',
            imageUrl: productImages[index],
            quantity: item.quantity,
            price: item.price,
          })) || [];

        // Build recovery URL
        const recoveryUrl = `${BASE_URL}/cart/recover?token=${cart.recovery_token}`;

        // Generate email
        let { subject, html, text } = generateEmail1({
          customerName: cart.customer_name,
          email: cart.email,
          products,
          cartTotal: cart.total_value,
          recoveryUrl,
        });

        // Add tracking pixel
        html = addTrackingPixelToEmail(html, cart.id);

        // Send email
        await transporter.sendMail({
          from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.SMTP_FROM}>`,
          to: cart.email,
          subject,
          text,
          html,
          headers: {
            'X-Cart-ID': cart.id.toString(),
            'X-Email-Type': 'abandoned-cart-1',
          },
        });

        // Update abandoned cart record
        await sql`
          UPDATE abandoned_carts
          SET
            status = 'email_sent_1',
            first_email_sent_at = NOW(),
            updated_at = NOW()
          WHERE id = ${cart.id}
        `;

        sent++;
        console.log(`[Email Worker] Sent Email 1 to ${cart.email} (Cart: ${cart.session_id})`);
      } catch (error) {
        console.error(`[Email Worker] Error sending Email 1 to cart ${cart.id}:`, error);
      }
    }

    return { processed: carts.length, sent };
  } catch (error) {
    console.error('[Email Worker] Error in sendEmail1:', error);
    throw error;
  }
}

/**
 * Send Email 2: 5% Discount (24 hours after Email 1)
 */
async function sendEmail2() {
  console.log('[Email Worker] Checking for Email 2 candidates...');

  try {
    const carts = await sql`
      SELECT
        ac.id,
        ac.session_id,
        ac.email,
        ac.cart_data,
        ac.total_value,
        ac.item_count,
        ac.product_names,
        ac.product_images,
        ac.recovery_token,
        ac.first_email_sent_at,
        u.name as customer_name
      FROM abandoned_carts ac
      LEFT JOIN users u ON ac.user_id = u.id
      WHERE ac.status = 'email_sent_1'
      AND ac.email IS NOT NULL
      AND ac.first_email_sent_at < NOW() - INTERVAL '24 hours'
      AND ac.second_email_sent_at IS NULL
      LIMIT 50
    `;

    console.log(`[Email Worker] Found ${carts.length} carts for Email 2`);

    let sent = 0;

    for (const cart of carts) {
      try {
        const cartData = cart.cart_data as any;
        const productNames = cart.product_names as string[];
        const productImages = cart.product_images as string[];

        const products =
          cartData.items?.map((item: any, index: number) => ({
            name: item.productName || productNames[index] || 'Product',
            imageUrl: productImages[index],
            quantity: item.quantity,
            price: item.price,
          })) || [];

        // Generate discount code
        const discountCode = generateDiscountCode('SAVE5');
        const discountPercent = 5;

        const recoveryUrl = `${BASE_URL}/cart/recover?token=${cart.recovery_token}`;

        let { subject, html, text } = generateEmail2({
          customerName: cart.customer_name,
          email: cart.email,
          products,
          cartTotal: cart.total_value,
          recoveryUrl,
          discountCode,
          discountPercent,
          expiresInHours: 48,
        });

        // Add tracking pixel
        html = addTrackingPixelToEmail(html, cart.id);

        await transporter.sendMail({
          from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.SMTP_FROM}>`,
          to: cart.email,
          subject,
          text,
          html,
          headers: {
            'X-Cart-ID': cart.id.toString(),
            'X-Email-Type': 'abandoned-cart-2',
          },
        });

        // Update record with discount info
        await sql`
          UPDATE abandoned_carts
          SET
            status = 'email_sent_2',
            second_email_sent_at = NOW(),
            recovery_discount_code = ${discountCode},
            recovery_discount_percent = ${discountPercent},
            updated_at = NOW()
          WHERE id = ${cart.id}
        `;

        sent++;
        console.log(`[Email Worker] Sent Email 2 to ${cart.email} (Code: ${discountCode})`);
      } catch (error) {
        console.error(`[Email Worker] Error sending Email 2 to cart ${cart.id}:`, error);
      }
    }

    return { processed: carts.length, sent };
  } catch (error) {
    console.error('[Email Worker] Error in sendEmail2:', error);
    throw error;
  }
}

/**
 * Send Email 3: 10% Discount - Final Offer (72 hours after Email 2)
 */
async function sendEmail3() {
  console.log('[Email Worker] Checking for Email 3 candidates...');

  try {
    const carts = await sql`
      SELECT
        ac.id,
        ac.session_id,
        ac.email,
        ac.cart_data,
        ac.total_value,
        ac.item_count,
        ac.product_names,
        ac.product_images,
        ac.recovery_token,
        ac.second_email_sent_at,
        u.name as customer_name
      FROM abandoned_carts ac
      LEFT JOIN users u ON ac.user_id = u.id
      WHERE ac.status = 'email_sent_2'
      AND ac.email IS NOT NULL
      AND ac.second_email_sent_at < NOW() - INTERVAL '72 hours'
      AND ac.third_email_sent_at IS NULL
      LIMIT 50
    `;

    console.log(`[Email Worker] Found ${carts.length} carts for Email 3`);

    let sent = 0;

    for (const cart of carts) {
      try {
        const cartData = cart.cart_data as any;
        const productNames = cart.product_names as string[];
        const productImages = cart.product_images as string[];

        const products =
          cartData.items?.map((item: any, index: number) => ({
            name: item.productName || productNames[index] || 'Product',
            imageUrl: productImages[index],
            quantity: item.quantity,
            price: item.price,
          })) || [];

        // Generate final discount code
        const discountCode = generateDiscountCode('SAVE10');
        const discountPercent = 10;

        const recoveryUrl = `${BASE_URL}/cart/recover?token=${cart.recovery_token}`;

        let { subject, html, text } = generateEmail3({
          customerName: cart.customer_name,
          email: cart.email,
          products,
          cartTotal: cart.total_value,
          recoveryUrl,
          discountCode,
          discountPercent,
          expiresInHours: 24,
        });

        // Add tracking pixel
        html = addTrackingPixelToEmail(html, cart.id);

        await transporter.sendMail({
          from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.SMTP_FROM}>`,
          to: cart.email,
          subject,
          text,
          html,
          headers: {
            'X-Cart-ID': cart.id.toString(),
            'X-Email-Type': 'abandoned-cart-3',
          },
        });

        // Update to final status
        await sql`
          UPDATE abandoned_carts
          SET
            status = 'email_sent_3',
            third_email_sent_at = NOW(),
            recovery_discount_code = ${discountCode},
            recovery_discount_percent = ${discountPercent},
            updated_at = NOW()
          WHERE id = ${cart.id}
        `;

        sent++;
        console.log(`[Email Worker] Sent Email 3 (FINAL) to ${cart.email} (Code: ${discountCode})`);
      } catch (error) {
        console.error(`[Email Worker] Error sending Email 3 to cart ${cart.id}:`, error);
      }
    }

    return { processed: carts.length, sent };
  } catch (error) {
    console.error('[Email Worker] Error in sendEmail3:', error);
    throw error;
  }
}

/**
 * Mark old carts as lost (no recovery after 7 days)
 */
async function markLostCarts() {
  console.log('[Email Worker] Marking lost carts...');

  try {
    const result = await sql`
      UPDATE abandoned_carts
      SET
        status = 'lost',
        expired_at = NOW(),
        updated_at = NOW()
      WHERE status IN ('abandoned', 'email_sent_1', 'email_sent_2', 'email_sent_3')
      AND abandoned_at < NOW() - INTERVAL '7 days'
      AND status != 'lost'
    `;

    console.log(`[Email Worker] Marked ${result.count} carts as lost`);
    return { marked: result.count };
  } catch (error) {
    console.error('[Email Worker] Error marking lost carts:', error);
    throw error;
  }
}

/**
 * Create and start the email recovery worker
 */
export function createEmailRecoveryWorker() {
  const worker = new Worker(
    'email-recovery',
    async (job) => {
      console.log(`[Email Worker] Processing job ${job.id}: ${job.name}`);

      switch (job.name) {
        case 'send-email-1':
          return await sendEmail1();

        case 'send-email-2':
          return await sendEmail2();

        case 'send-email-3':
          return await sendEmail3();

        case 'mark-lost-carts':
          return await markLostCarts();

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    },
    {
      connection: redisConnection,
      concurrency: 2,
      limiter: {
        max: 50, // Max 50 emails per duration
        duration: 60000, // 1 minute (to avoid spam)
      },
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`[Email Worker] Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Email Worker] Job ${job?.id} failed:`, error);
  });

  console.log('[Email Worker] Email recovery worker started');

  return worker;
}

// Auto-start worker if this file is run directly
if (require.main === module) {
  createEmailRecoveryWorker();
  console.log('[Email Worker] Running in standalone mode. Press Ctrl+C to stop.');
}
