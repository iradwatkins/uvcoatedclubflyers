import { sql } from '@/lib/db';
import { nanoid } from 'nanoid';

export interface AbandonedCart {
  id: number;
  sessionId: string;
  userId: number | null;
  email: string | null;
  firstName: string | null;
  cartData: unknown;
  cartTotal: number;
  itemCount: number;
  status: string;
  abandonedAt: Date | null;
  recoveryToken: string | null;
  recoveryCouponCode: string | null;
  emailsSent: number;
  firstEmailSentAt: Date | null;
  secondEmailSentAt: Date | null;
  thirdEmailSentAt: Date | null;
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
 * Uses existing schema: total_value (cents), status, abandoned_at
 */
export async function trackCartActivity(
  sessionId: string,
  cart: { items: CartItem[]; total: number; itemCount: number },
  email?: string
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

    // Convert total from dollars to cents for storage
    const totalCents = Math.round(cart.total * 100);

    // Extract product names for email display
    const productNames = cart.items.map((item) => item.productName);

    await sql`
      INSERT INTO abandoned_carts (
        session_id,
        email,
        cart_data,
        total_value,
        item_count,
        product_names,
        status,
        abandoned_at
      ) VALUES (
        ${sessionId},
        ${email || null},
        ${JSON.stringify(cart)}::jsonb,
        ${totalCents},
        ${cart.itemCount},
        ${JSON.stringify(productNames)}::jsonb,
        'active',
        NOW()
      )
      ON CONFLICT (session_id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, abandoned_carts.email),
        cart_data = EXCLUDED.cart_data,
        total_value = EXCLUDED.total_value,
        item_count = EXCLUDED.item_count,
        product_names = EXCLUDED.product_names,
        status = CASE
          WHEN abandoned_carts.status IN ('recovered', 'converted')
          THEN abandoned_carts.status
          ELSE 'active'
        END,
        abandoned_at = NOW(),
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
        status = 'recovered',
        recovered_at = NOW(),
        recovered_order_id = ${orderId},
        updated_at = NOW()
      WHERE session_id = ${sessionId}
        AND status NOT IN ('recovered', 'converted', 'expired')
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
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await sql`
    UPDATE abandoned_carts
    SET
      recovery_token = ${token},
      recovery_token_expires_at = ${expiresAt},
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
      cart_data as "cartData",
      total_value as "cartTotal",
      item_count as "itemCount",
      status,
      abandoned_at as "abandonedAt",
      recovery_token as "recoveryToken",
      recovery_discount_code as "recoveryCouponCode",
      first_email_sent_at as "firstEmailSentAt",
      second_email_sent_at as "secondEmailSentAt",
      third_email_sent_at as "thirdEmailSentAt",
      CASE
        WHEN third_email_sent_at IS NOT NULL THEN 3
        WHEN second_email_sent_at IS NOT NULL THEN 2
        WHEN first_email_sent_at IS NOT NULL THEN 1
        ELSE 0
      END as "emailsSent"
    FROM abandoned_carts
    WHERE recovery_token = ${token}
      AND status NOT IN ('recovered', 'converted', 'expired')
      AND (recovery_token_expires_at IS NULL OR recovery_token_expires_at > NOW())
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
        status = 'abandoned',
        recovery_token = encode(gen_random_bytes(24), 'hex'),
        recovery_token_expires_at = NOW() + INTERVAL '7 days',
        updated_at = NOW()
      WHERE status = 'active'
        AND email IS NOT NULL
        AND abandoned_at < NOW() - make_interval(mins => ${inactiveMinutes})
        AND total_value > 0
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
      ac.cart_data as "cartData",
      ac.total_value as "cartTotal",
      ac.item_count as "itemCount",
      ac.status,
      ac.abandoned_at as "abandonedAt",
      ac.recovery_token as "recoveryToken",
      ac.recovery_discount_code as "recoveryCouponCode",
      ac.first_email_sent_at as "firstEmailSentAt",
      ac.second_email_sent_at as "secondEmailSentAt",
      ac.third_email_sent_at as "thirdEmailSentAt",
      CASE
        WHEN ac.third_email_sent_at IS NOT NULL THEN 3
        WHEN ac.second_email_sent_at IS NOT NULL THEN 2
        WHEN ac.first_email_sent_at IS NOT NULL THEN 1
        ELSE 0
      END as "emailsSent"
    FROM abandoned_carts ac
    WHERE ac.status = 'abandoned'
      AND ac.email IS NOT NULL
      AND ac.first_email_sent_at IS NULL
    ORDER BY ac.abandoned_at ASC
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

  // Update the cart based on email number
  if (emailNumber === 1) {
    await sql`
      UPDATE abandoned_carts
      SET
        first_email_sent_at = NOW(),
        recovery_discount_code = COALESCE(${couponCode || null}, recovery_discount_code),
        recovery_discount_percent = COALESCE(${discountValue ? Math.round(discountValue) : null}, recovery_discount_percent),
        updated_at = NOW()
      WHERE id = ${abandonedCartId}
    `;
  } else if (emailNumber === 2) {
    await sql`
      UPDATE abandoned_carts
      SET
        second_email_sent_at = NOW(),
        recovery_discount_code = COALESCE(${couponCode || null}, recovery_discount_code),
        recovery_discount_percent = COALESCE(${discountValue ? Math.round(discountValue) : null}, recovery_discount_percent),
        updated_at = NOW()
      WHERE id = ${abandonedCartId}
    `;
  } else {
    await sql`
      UPDATE abandoned_carts
      SET
        third_email_sent_at = NOW(),
        recovery_discount_code = COALESCE(${couponCode || null}, recovery_discount_code),
        recovery_discount_percent = COALESCE(${discountValue ? Math.round(discountValue) : null}, recovery_discount_percent),
        updated_at = NOW()
      WHERE id = ${abandonedCartId}
    `;
  }
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

  await sql`
    UPDATE abandoned_carts
    SET
      email_open_count = email_open_count + 1,
      last_email_opened_at = NOW(),
      updated_at = NOW()
    WHERE id = ${abandonedCartId}
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

  await sql`
    UPDATE abandoned_carts
    SET
      email_click_count = email_click_count + 1,
      last_email_clicked_at = NOW(),
      updated_at = NOW()
    WHERE id = ${abandonedCartId}
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
        status = 'expired',
        expired_at = NOW(),
        updated_at = NOW()
      WHERE status IN ('active', 'abandoned')
        AND abandoned_at < NOW() - make_interval(days => ${days})
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
      COUNT(*) FILTER (WHERE status IN ('abandoned', 'recovered', 'expired')) as total_abandoned,
      COUNT(*) FILTER (WHERE status = 'recovered') as total_recovered,
      COALESCE(SUM(total_value) FILTER (WHERE status IN ('abandoned', 'recovered', 'expired')), 0) as abandoned_value,
      COALESCE(SUM(total_value) FILTER (WHERE status = 'recovered'), 0) as recovered_value,
      COALESCE(SUM(recovered_revenue), 0) as total_recovered_revenue,
      ROUND(
        (COUNT(*) FILTER (WHERE status = 'recovered')::numeric /
         NULLIF(COUNT(*) FILTER (WHERE status IN ('abandoned', 'recovered', 'expired')), 0) * 100),
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
    total_recovered_revenue: 0,
    recovery_rate: 0,
  };
}
