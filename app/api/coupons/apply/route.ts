import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/cart';

/**
 * POST /api/coupons/apply
 * Apply a validated coupon to the cart session
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'No cart session found' }, { status: 400 });
    }

    const body = await request.json();
    const { code, email } = body;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const normalizedCode = code.toUpperCase().trim();

    // Find and validate the coupon
    const [coupon] = await sql`
      SELECT
        id, code, name, discount_type, discount_value,
        min_order_amount, max_discount_amount, product_ids, exclude_product_ids
      FROM coupons
      WHERE UPPER(code) = ${normalizedCode}
        AND is_active = true
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (usage_limit IS NULL OR usage_count < usage_limit)
    `;

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    }

    // Get cart to calculate discount
    const cart = await getCart(sessionId);
    const cartTotal = cart.total;

    // Check minimum order amount
    if (coupon.min_order_amount !== null && cartTotal < coupon.min_order_amount) {
      return NextResponse.json({
        error: `Minimum order of $${coupon.min_order_amount.toFixed(2)} required`,
      }, { status: 400 });
    }

    // Calculate eligible total
    let eligibleTotal = cartTotal;
    if (coupon.product_ids && coupon.product_ids.length > 0) {
      eligibleTotal = cart.items
        .filter((item) => coupon.product_ids.includes(parseInt(item.productId, 10)))
        .reduce((sum, item) => sum + item.price, 0);
    } else if (coupon.exclude_product_ids && coupon.exclude_product_ids.length > 0) {
      eligibleTotal = cart.items
        .filter((item) => !coupon.exclude_product_ids.includes(parseInt(item.productId, 10)))
        .reduce((sum, item) => sum + item.price, 0);
    }

    // Calculate discount
    let discountAmount = 0;
    switch (coupon.discount_type) {
      case 'percentage':
        discountAmount = eligibleTotal * (coupon.discount_value / 100);
        break;
      case 'fixed_cart':
        discountAmount = Math.min(coupon.discount_value, eligibleTotal);
        break;
      case 'fixed_product':
        discountAmount = coupon.discount_value;
        break;
    }

    // Apply max discount cap
    if (coupon.max_discount_amount !== null && discountAmount > coupon.max_discount_amount) {
      discountAmount = coupon.max_discount_amount;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    // Check if coupon already applied to this session
    const [existingCoupon] = await sql`
      SELECT id FROM cart_coupons
      WHERE session_id = ${sessionId} AND coupon_id = ${coupon.id}
    `;

    if (existingCoupon) {
      // Update existing
      await sql`
        UPDATE cart_coupons
        SET discount_amount = ${discountAmount}, updated_at = NOW()
        WHERE session_id = ${sessionId} AND coupon_id = ${coupon.id}
      `;
    } else {
      // Remove any other coupons (only one at a time for now)
      await sql`
        DELETE FROM cart_coupons WHERE session_id = ${sessionId}
      `;

      // Insert new
      await sql`
        INSERT INTO cart_coupons (session_id, coupon_id, coupon_code, discount_amount)
        VALUES (${sessionId}, ${coupon.id}, ${coupon.code}, ${discountAmount})
      `;
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        freeShipping: coupon.discount_type === 'free_shipping',
      },
      discount: discountAmount,
      cartTotal,
      newTotal: Math.max(0, cartTotal - discountAmount),
    });
  } catch (error) {
    console.error('[Coupon Apply] Error:', error);
    return NextResponse.json({ error: 'Failed to apply coupon' }, { status: 500 });
  }
}

/**
 * GET /api/coupons/apply
 * Get currently applied coupon for session
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ coupon: null });
    }

    const [appliedCoupon] = await sql`
      SELECT
        cc.coupon_code as code,
        cc.discount_amount as discount,
        c.name,
        c.discount_type,
        c.discount_value
      FROM cart_coupons cc
      JOIN coupons c ON cc.coupon_id = c.id
      WHERE cc.session_id = ${sessionId}
    `;

    if (!appliedCoupon) {
      return NextResponse.json({ coupon: null });
    }

    return NextResponse.json({
      coupon: {
        code: appliedCoupon.code,
        name: appliedCoupon.name,
        discountType: appliedCoupon.discount_type,
        discountValue: appliedCoupon.discount_value,
        freeShipping: appliedCoupon.discount_type === 'free_shipping',
      },
      discount: appliedCoupon.discount,
    });
  } catch (error) {
    console.error('[Coupon Get] Error:', error);
    return NextResponse.json({ coupon: null });
  }
}
