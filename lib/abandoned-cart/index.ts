import { sql } from '@/lib/db';
import { nanoid } from 'nanoid';

export interface AbandonedCart {
  id: number;
  sessionId: string;
  userId: number | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  cartData: unknown;
  cartTotal: number;
  itemCount: number;
  recoveryStatus: string;
  emailsSent: number;
  lastActivityAt: Date;
  abandonmentDetectedAt: Date | null;
  recoveryToken: string | null;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  options: Record<string, string>;
  price: number;
  unitPrice: number;
}

/**
 * Track or update cart activity for abandoned cart detection
 */
export async function trackCartActivity(
  sessionId: string,
  cart: { items: CartItem[]; total: number; itemCount: number },
  email?: string,
  firstName?: string,
  lastName?: string
): Promise<void> {
  try {
    // Skip if cart is empty
    if (cart.items.length === 0) {
      // Delete any existing abandoned cart record for empty carts
      await sql`
        DELETE FROM abandoned_carts
        WHERE session_id = ${sessionId}
      `;
      return;
    }

    await sql`
      INSERT INTO abandoned_carts (
        session_id,
        email,
        first_name,
        last_name,
        cart_data,
        cart_total,
        item_count,
        last_activity_at,
        recovery_status
      ) VALUES (
        ${sessionId},
        ${email || null},
        ${firstName || null},
        ${lastName || null},
        ${JSON.stringify(cart)}::jsonb,
        ${cart.total},
        ${cart.itemCount},
        NOW(),
        'active'
      )
      ON CONFLICT (session_id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, abandoned_carts.email),
        first_name = COALESCE(EXCLUDED.first_name, abandoned_carts.first_name),
        last_name = COALESCE(EXCLUDED.last_name, abandoned_carts.last_name),
        cart_data = EXCLUDED.cart_data,
        cart_total = EXCLUDED.cart_total,
        item_count = EXCLUDED.item_count,
        last_activity_at = NOW(),
        recovery_status = CASE
          WHEN abandoned_carts.recovery_status IN ('recovered', 'unsubscribed')
          THEN abandoned_carts.recovery_status
          ELSE 'active'
        END,
        abandonment_detected_at = NULL,
        updated_at = NOW()
    `;
  } catch (error) {
    console.error('[AbandonedCart] Track activity error:', error);
  }
}

/**
 * Mark cart as recovered when order is completed
 */
export async function markCartRecovered(
  sessionId: string,
  orderId: number
): Promise<void> {
  try {
    await sql`
      UPDATE abandoned_carts
      SET
        recovery_status = 'recovered',
        recovered_at = NOW(),
        recovered_order_id = ${orderId},
        updated_at = NOW()
      WHERE session_id = ${sessionId}
        AND recovery_status NOT IN ('recovered', 'expired')
    `;
  } catch (error) {
    console.error('[AbandonedCart] Mark recovered error:', error);
  }
}

/**
 * Generate unique recovery token for email links
 */
export async function generateRecoveryToken(
  abandonedCartId: number
): Promise<string> {
  const token = nanoid(32);

  await sql`
    UPDATE abandoned_carts
    SET
      recovery_token = ${token},
      updated_at = NOW()
    WHERE id = ${abandonedCartId}
  `;

  return token;
}

/**
 * Get cart by recovery token
 */
export async function getCartByRecoveryToken(
  token: string
): Promise<AbandonedCart | null> {
  const [cart] = (await sql`
    SELECT
      id,
      session_id as "sessionId",
      user_id as "userId",
      email,
      first_name as "firstName",
      last_name as "lastName",
      cart_data as "cartData",
      cart_total as "cartTotal",
      item_count as "itemCount",
      recovery_status as "recoveryStatus",
      emails_sent as "emailsSent",
      last_activity_at as "lastActivityAt",
      abandonment_detected_at as "abandonmentDetectedAt",
      recovery_token as "recoveryToken",
      recovery_coupon_code as "recoveryCouponCode"
    FROM abandoned_carts
    WHERE recovery_token = ${token}
      AND recovery_status NOT IN ('recovered', 'expired', 'unsubscribed')
  `) as AbandonedCart[];

  return cart || null;
}

/**
 * Detect abandoned carts (carts inactive for specified minutes)
 * This would be called by a scheduled job
 */
export async function detectAbandonedCarts(
  inactiveMinutes: number = 30
): Promise<number> {
  try {
    const result = await sql`
      UPDATE abandoned_carts
      SET
        abandonment_detected_at = NOW(),
        recovery_status = 'email_scheduled',
        recovery_token = encode(gen_random_bytes(24), 'hex'),
        updated_at = NOW()
      WHERE recovery_status = 'active'
        AND email IS NOT NULL
        AND last_activity_at < NOW() - INTERVAL '${inactiveMinutes} minutes'
        AND abandonment_detected_at IS NULL
        AND cart_total > 0
      RETURNING id
    `;

    return (result as { id: number }[]).length;
  } catch (error) {
    console.error('[AbandonedCart] Detection error:', error);
    return 0;
  }
}

/**
 * Get carts that need recovery emails
 */
export async function getCartsNeedingEmails(): Promise<AbandonedCart[]> {
  const carts = (await sql`
    SELECT
      ac.id,
      ac.session_id as "sessionId",
      ac.user_id as "userId",
      ac.email,
      ac.first_name as "firstName",
      ac.last_name as "lastName",
      ac.cart_data as "cartData",
      ac.cart_total as "cartTotal",
      ac.item_count as "itemCount",
      ac.recovery_status as "recoveryStatus",
      ac.emails_sent as "emailsSent",
      ac.last_activity_at as "lastActivityAt",
      ac.abandonment_detected_at as "abandonmentDetectedAt",
      ac.recovery_token as "recoveryToken"
    FROM abandoned_carts ac
    WHERE ac.recovery_status = 'email_scheduled'
      AND ac.email IS NOT NULL
      AND ac.abandonment_detected_at IS NOT NULL
      AND ac.emails_sent < ac.max_emails
      AND EXISTS (
        SELECT 1 FROM abandoned_cart_email_templates t
        WHERE t.email_number = ac.emails_sent + 1
          AND t.is_active = true
          AND ac.abandonment_detected_at + (t.delay_hours || ' hours')::interval <= NOW()
      )
    ORDER BY ac.abandonment_detected_at ASC
    LIMIT 100
  `) as AbandonedCart[];

  return carts;
}

/**
 * Get email template for a specific email number
 */
export async function getEmailTemplate(emailNumber: number) {
  const [template] = (await sql`
    SELECT
      id,
      email_number as "emailNumber",
      name,
      subject,
      preview_text as "previewText",
      template_key as "templateKey",
      delay_hours as "delayHours",
      include_discount as "includeDiscount",
      discount_type as "discountType",
      discount_value as "discountValue"
    FROM abandoned_cart_email_templates
    WHERE email_number = ${emailNumber}
      AND is_active = true
  `) as {
    id: number;
    emailNumber: number;
    name: string;
    subject: string;
    previewText: string | null;
    templateKey: string;
    delayHours: number;
    includeDiscount: boolean;
    discountType: string | null;
    discountValue: number | null;
  }[];

  return template || null;
}

/**
 * Record that an email was sent
 */
export async function recordEmailSent(
  abandonedCartId: number,
  emailNumber: number,
  recipientEmail: string,
  subject: string,
  templateName: string,
  couponCode?: string,
  discountType?: string,
  discountValue?: number
): Promise<void> {
  await sql`
    INSERT INTO abandoned_cart_emails (
      abandoned_cart_id,
      email_number,
      subject,
      template_name,
      recipient_email,
      coupon_code,
      discount_type,
      discount_value,
      scheduled_for,
      sent_at,
      status
    ) VALUES (
      ${abandonedCartId},
      ${emailNumber},
      ${subject},
      ${templateName},
      ${recipientEmail},
      ${couponCode || null},
      ${discountType || null},
      ${discountValue || null},
      NOW(),
      NOW(),
      'sent'
    )
  `;

  // Update the cart's email count
  await sql`
    UPDATE abandoned_carts
    SET
      emails_sent = emails_sent + 1,
      last_email_sent_at = NOW(),
      first_email_sent_at = COALESCE(first_email_sent_at, NOW()),
      recovery_status = 'email_sent',
      recovery_coupon_code = COALESCE(${couponCode || null}, recovery_coupon_code),
      updated_at = NOW()
    WHERE id = ${abandonedCartId}
  `;
}

/**
 * Track email open event
 */
export async function trackEmailOpen(
  abandonedCartId: number,
  emailNumber: number
): Promise<void> {
  await sql`
    UPDATE abandoned_cart_emails
    SET
      opened_at = COALESCE(opened_at, NOW()),
      status = 'opened'
    WHERE abandoned_cart_id = ${abandonedCartId}
      AND email_number = ${emailNumber}
  `;
}

/**
 * Track email click event
 */
export async function trackEmailClick(
  abandonedCartId: number,
  emailNumber: number
): Promise<void> {
  await sql`
    UPDATE abandoned_cart_emails
    SET
      clicked_at = COALESCE(clicked_at, NOW()),
      click_count = click_count + 1,
      status = 'clicked'
    WHERE abandoned_cart_id = ${abandonedCartId}
      AND email_number = ${emailNumber}
  `;
}

/**
 * Expire old abandoned carts (no activity after X days)
 */
export async function expireOldCarts(days: number = 30): Promise<number> {
  try {
    const result = await sql`
      UPDATE abandoned_carts
      SET
        recovery_status = 'expired',
        updated_at = NOW()
      WHERE recovery_status IN ('active', 'email_scheduled', 'email_sent')
        AND last_activity_at < NOW() - INTERVAL '${days} days'
      RETURNING id
    `;

    return (result as { id: number }[]).length;
  } catch (error) {
    console.error('[AbandonedCart] Expire error:', error);
    return 0;
  }
}

/**
 * Get abandoned cart recovery statistics
 */
export async function getRecoveryStats(startDate: Date, endDate: Date) {
  const stats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE abandonment_detected_at IS NOT NULL) as total_abandoned,
      COUNT(*) FILTER (WHERE recovery_status = 'recovered') as total_recovered,
      SUM(cart_total) FILTER (WHERE abandonment_detected_at IS NOT NULL) as abandoned_value,
      SUM(cart_total) FILTER (WHERE recovery_status = 'recovered') as recovered_value,
      SUM(emails_sent) as total_emails_sent,
      ROUND(
        (COUNT(*) FILTER (WHERE recovery_status = 'recovered')::numeric /
         NULLIF(COUNT(*) FILTER (WHERE abandonment_detected_at IS NOT NULL), 0) * 100),
        2
      ) as recovery_rate
    FROM abandoned_carts
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
  `;

  return stats[0] || {
    total_abandoned: 0,
    total_recovered: 0,
    abandoned_value: 0,
    recovered_value: 0,
    total_emails_sent: 0,
    recovery_rate: 0,
  };
}
