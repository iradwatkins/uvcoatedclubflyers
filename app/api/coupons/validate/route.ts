import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/cart';

interface Coupon {
  id: number;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  usage_limit_per_user: number | null;
  product_ids: number[] | null;
  exclude_product_ids: number[] | null;
  starts_at: Date | null;
  expires_at: Date | null;
  can_combine: boolean;
  exclude_sale_items: boolean;
  is_active: boolean;
}

/**
 * POST /api/coupons/validate
 * Validate a coupon code and calculate the discount
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;
    const body = await request.json();
    const { code, email } = body;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const normalizedCode = code.toUpperCase().trim();

    // Find the coupon
    const [coupon] = await sql<Coupon[]>`
      SELECT
        id, code, name, description, discount_type, discount_value,
        min_order_amount, max_discount_amount, usage_limit, usage_count,
        usage_limit_per_user, product_ids, exclude_product_ids,
        starts_at, expires_at, can_combine, exclude_sale_items, is_active
      FROM coupons
      WHERE UPPER(code) = ${normalizedCode}
    `;

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    }

    // Check date restrictions
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({ error: 'This coupon is not yet active' }, { status: 400 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
    }

    // Check per-user limit if email provided
    if (email && coupon.usage_limit_per_user !== null) {
      const [usage] = await sql<{ count: number }[]>`
        SELECT COUNT(*)::int as count
        FROM coupon_usage
        WHERE coupon_id = ${coupon.id} AND email = ${email}
      `;

      if (usage && usage.count >= coupon.usage_limit_per_user) {
        return NextResponse.json({
          error: 'You have already used this coupon the maximum number of times',
        }, { status: 400 });
      }
    }

    // Get cart to calculate discount
    let cartTotal = 0;
    let eligibleTotal = 0;

    if (sessionId) {
      const cart = await getCart(sessionId);
      cartTotal = cart.total;

      // Calculate eligible total (considering product restrictions)
      if (coupon.product_ids && coupon.product_ids.length > 0) {
        // Only apply to specific products
        eligibleTotal = cart.items
          .filter((item) => coupon.product_ids!.includes(parseInt(item.productId, 10)))
          .reduce((sum, item) => sum + item.price, 0);
      } else if (coupon.exclude_product_ids && coupon.exclude_product_ids.length > 0) {
        // Apply to all except excluded products
        eligibleTotal = cart.items
          .filter((item) => !coupon.exclude_product_ids!.includes(parseInt(item.productId, 10)))
          .reduce((sum, item) => sum + item.price, 0);
      } else {
        eligibleTotal = cartTotal;
      }
    }

    // Check minimum order amount
    if (coupon.min_order_amount !== null && cartTotal < coupon.min_order_amount) {
      return NextResponse.json({
        error: `Minimum order amount of $${coupon.min_order_amount.toFixed(2)} required`,
        minAmount: coupon.min_order_amount,
        currentTotal: cartTotal,
      }, { status: 400 });
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
        // Fixed amount per eligible product
        discountAmount = coupon.discount_value; // Per item logic would need cart item count
        break;
      case 'free_shipping':
        // Handled separately at checkout
        discountAmount = 0;
        break;
    }

    // Apply max discount cap
    if (coupon.max_discount_amount !== null && discountAmount > coupon.max_discount_amount) {
      discountAmount = coupon.max_discount_amount;
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        freeShipping: coupon.discount_type === 'free_shipping',
      },
      discount: {
        amount: discountAmount,
        type: coupon.discount_type,
        percentage: coupon.discount_type === 'percentage' ? coupon.discount_value : null,
      },
      cartTotal,
      newTotal: Math.max(0, cartTotal - discountAmount),
    });
  } catch (error) {
    console.error('[Coupon Validate] Error:', error);
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}
