import { NextRequest, NextResponse } from 'next/server';
import {
  detectAbandonedCarts,
  getCartsNeedingEmails,
  getEmailTemplate,
  recordEmailSent,
  expireOldCarts,
} from '@/lib/abandoned-cart';
import { sql } from '@/lib/db';

// This endpoint should be called by a cron job (e.g., every 15 minutes)
// Protect with a secret key in production

const CRON_SECRET = process.env.CRON_SECRET || 'development-secret';

/**
 * POST /api/abandoned-cart/process
 * Process abandoned carts - detect abandoned, send emails, expire old
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      detected: 0,
      emailsSent: 0,
      expired: 0,
      errors: [] as string[],
    };

    // 1. Detect new abandoned carts (30 min inactive with email captured)
    results.detected = await detectAbandonedCarts(30);

    // 2. Get carts that need emails and send them
    const cartsNeedingEmails = await getCartsNeedingEmails();

    for (const cart of cartsNeedingEmails) {
      try {
        const nextEmailNumber = cart.emailsSent + 1;
        const template = await getEmailTemplate(nextEmailNumber);

        if (!template || !cart.email) continue;

        // Generate coupon if this email includes a discount
        let couponCode: string | undefined;
        if (template.includeDiscount && template.discountType && template.discountValue) {
          couponCode = await generateRecoveryCoupon(
            cart.id,
            template.discountType,
            template.discountValue
          );
        }

        // Prepare email data
        const emailData = {
          to: cart.email,
          firstName: cart.firstName || 'there',
          subject: template.subject,
          previewText: template.previewText || undefined,
          cart: cart.cartData as {
            items: Array<{
              productName: string;
              quantity: number;
              price: number;
              unitPrice: number;
            }>;
            total: number;
          },
          recoveryUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/abandoned-cart/recover?token=${cart.recoveryToken}&email=${nextEmailNumber}`,
          couponCode,
          discountValue: template.discountValue,
          discountType: template.discountType,
          trackingPixelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/abandoned-cart/track-open?cid=${cart.id}&en=${nextEmailNumber}`,
        };

        // Send the email (implement your email sending logic here)
        const sent = await sendAbandonedCartEmail(emailData, template.templateKey);

        if (sent) {
          await recordEmailSent(
            cart.id,
            nextEmailNumber,
            cart.email,
            template.subject,
            template.templateKey,
            couponCode,
            template.discountType || undefined,
            template.discountValue || undefined
          );
          results.emailsSent++;
        }
      } catch (error) {
        console.error(`[Process] Error sending email for cart ${cart.id}:`, error);
        results.errors.push(`Cart ${cart.id}: ${(error as Error).message}`);
      }
    }

    // 3. Expire old carts (30 days)
    results.expired = await expireOldCarts(30);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Process Abandoned Carts] Error:', error);
    return NextResponse.json(
      { error: 'Processing failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique recovery coupon for this cart
 */
async function generateRecoveryCoupon(
  cartId: number,
  discountType: string,
  discountValue: number
): Promise<string> {
  const code = `RECOVER${cartId}${Date.now().toString(36).toUpperCase()}`;

  // Create a single-use coupon
  await sql`
    INSERT INTO coupons (
      code,
      name,
      discount_type,
      discount_value,
      usage_limit,
      usage_limit_per_user,
      expires_at,
      is_active
    ) VALUES (
      ${code},
      ${'Cart Recovery - ' + code},
      ${discountType},
      ${discountValue},
      1,
      1,
      NOW() + INTERVAL '7 days',
      true
    )
    ON CONFLICT (code) DO NOTHING
  `;

  return code;
}

/**
 * Send abandoned cart email (placeholder - implement with your email service)
 */
async function sendAbandonedCartEmail(
  emailData: {
    to: string;
    firstName: string;
    subject: string;
    previewText?: string;
    cart: {
      items: Array<{
        productName: string;
        quantity: number;
        price: number;
        unitPrice: number;
      }>;
      total: number;
    };
    recoveryUrl: string;
    couponCode?: string;
    discountValue?: number | null;
    discountType?: string | null;
    trackingPixelUrl: string;
  },
  templateKey: string
): Promise<boolean> {
  // TODO: Implement with your email service (SendGrid, AWS SES, etc.)
  // For now, just log the email that would be sent
  console.log('[Email] Would send abandoned cart email:', {
    to: emailData.to,
    subject: emailData.subject,
    template: templateKey,
    recoveryUrl: emailData.recoveryUrl,
    couponCode: emailData.couponCode,
    itemCount: emailData.cart.items.length,
    cartTotal: emailData.cart.total,
  });

  // Return true to mark as sent (in production, only return true if actually sent)
  return true;
}
