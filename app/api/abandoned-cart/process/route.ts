import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/components';
import {
  detectAbandonedCarts,
  getCartsNeedingEmails,
  getEmailTemplate,
  recordEmailSent,
  expireOldCarts,
} from '@/lib/abandoned-cart';
import { sql } from '@/lib/db';
import { transporter, FROM_EMAIL, REPLY_TO_EMAIL } from '@/lib/email/nodemailer';
import { AbandonedCartEmail } from '@/lib/email/templates/marketing/abandoned-cart';

// This endpoint should be called by a cron job (e.g., every 15 minutes)
// Protect with a secret key in production

const CRON_SECRET = process.env.CRON_SECRET || 'development-secret';

/**
 * GET /api/abandoned-cart/process
 * Health check endpoint - returns status of abandoned cart processing
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const urlSecret = request.nextUrl.searchParams.get('secret');

  if (authHeader !== `Bearer ${CRON_SECRET}` && urlSecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get pending stats
    const [stats] = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_carts,
        COUNT(*) FILTER (WHERE status = 'abandoned' AND first_email_sent_at IS NULL) as pending_emails,
        COUNT(*) FILTER (WHERE status = 'abandoned') as total_abandoned,
        COUNT(*) FILTER (WHERE status = 'recovered') as total_recovered
      FROM abandoned_carts
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `) as { active_carts: number; pending_emails: number; total_abandoned: number; total_recovered: number }[];

    return NextResponse.json({
      status: 'ok',
      stats: stats || { active_carts: 0, pending_emails: 0, total_abandoned: 0, total_recovered: 0 },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: (error as Error).message,
    }, { status: 500 });
  }
}

/**
 * POST /api/abandoned-cart/process
 * Process abandoned carts - detect abandoned, send emails, expire old
 *
 * Call this endpoint every 15 minutes via external cron service:
 * - cron-job.org (free)
 * - EasyCron
 * - UptimeRobot (free)
 * - Server cron: curl -X POST -H "Authorization: Bearer YOUR_SECRET" https://uvcoatedclubflyers.com/api/abandoned-cart/process
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (via header or URL param)
    const authHeader = request.headers.get('authorization');
    const urlSecret = request.nextUrl.searchParams.get('secret');

    if (authHeader !== `Bearer ${CRON_SECRET}` && urlSecret !== CRON_SECRET) {
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
          recoveryUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://uvcoatedclubflyers.com'}/api/abandoned-cart/recover?token=${cart.recoveryToken}&email=${nextEmailNumber}`,
          couponCode,
          discountValue: template.discountValue,
          discountType: template.discountType,
          trackingPixelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://uvcoatedclubflyers.com'}/api/abandoned-cart/track-open?cid=${cart.id}&en=${nextEmailNumber}`,
          abandonedAt: cart.abandonedAt || undefined,
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
 * Send abandoned cart email using nodemailer
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
    abandonedAt?: Date;
  },
  templateKey: string
): Promise<boolean> {
  try {
    // Calculate hours since abandonment
    const hoursSinceAbandonment = emailData.abandonedAt
      ? Math.round((Date.now() - new Date(emailData.abandonedAt).getTime()) / (1000 * 60 * 60))
      : 1;

    // Render the email template
    const emailHtml = await render(
      AbandonedCartEmail({
        customerName: emailData.firstName !== 'there' ? emailData.firstName : undefined,
        items: emailData.cart.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: Math.round(item.price * 100), // Convert to cents for template
        })),
        subtotal: Math.round(emailData.cart.total * 100),
        total: Math.round(emailData.cart.total * 100),
        cartUrl: emailData.recoveryUrl,
        couponCode: emailData.couponCode,
        couponValue: emailData.discountValue || undefined,
        hoursSinceAbandonment,
      })
    );

    // Add tracking pixel to the email
    const emailWithTracking = emailHtml.replace(
      '</body>',
      `<img src="${emailData.trackingPixelUrl}" width="1" height="1" alt="" style="display:none" /></body>`
    );

    // Send the email
    const info = await transporter.sendMail({
      from: `"UV Coated Club Flyers" <${FROM_EMAIL}>`,
      replyTo: REPLY_TO_EMAIL,
      to: emailData.to,
      subject: emailData.subject,
      html: emailWithTracking,
    });

    console.log('[Email] Abandoned cart email sent:', {
      to: emailData.to,
      messageId: info.messageId,
      template: templateKey,
    });

    return true;
  } catch (error) {
    console.error('[Email] Failed to send abandoned cart email:', error);
    return false;
  }
}
