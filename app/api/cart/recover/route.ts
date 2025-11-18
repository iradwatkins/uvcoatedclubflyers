import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { redis } from '@/lib/redis';

/**
 * GET /api/cart/recover?token=xxx
 * Validate recovery token and restore abandoned cart
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Recovery token is required' },
        { status: 400 }
      );
    }

    // Find abandoned cart by recovery token
    const carts = await sql`
      SELECT
        id,
        session_id,
        email,
        cart_data,
        total_value,
        item_count,
        product_names,
        product_images,
        status,
        recovery_discount_code,
        recovery_discount_percent,
        abandoned_at,
        first_email_sent_at,
        second_email_sent_at,
        third_email_sent_at
      FROM abandoned_carts
      WHERE recovery_token = ${token}
      AND status NOT IN ('recovered', 'converted', 'lost')
      LIMIT 1
    `;

    if (carts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired recovery link' },
        { status: 404 }
      );
    }

    const cart = carts[0];

    // Check if cart is too old (expired after 7 days)
    const abandonedAt = new Date(cart.abandoned_at);
    const daysSinceAbandoned = (Date.now() - abandonedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceAbandoned > 7) {
      return NextResponse.json(
        { error: 'This recovery link has expired' },
        { status: 410 }
      );
    }

    // Track email click (if they came from email)
    await sql`
      UPDATE abandoned_carts
      SET
        email_click_count = COALESCE(email_click_count, 0) + 1,
        last_clicked_at = NOW(),
        updated_at = NOW()
      WHERE id = ${cart.id}
    `;

    // Return cart data
    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        sessionId: cart.session_id,
        email: cart.email,
        cartData: cart.cart_data,
        totalValue: cart.total_value,
        itemCount: cart.item_count,
        productNames: cart.product_names,
        productImages: cart.product_images,
        status: cart.status,
        discountCode: cart.recovery_discount_code,
        discountPercent: cart.recovery_discount_percent,
        abandonedAt: cart.abandoned_at,
        emailsSent: {
          first: cart.first_email_sent_at,
          second: cart.second_email_sent_at,
          third: cart.third_email_sent_at,
        },
      },
    });
  } catch (error: any) {
    console.error('[Cart Recovery API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to recover cart' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart/recover
 * Restore abandoned cart to user's active session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newSessionId } = body;

    if (!token || !newSessionId) {
      return NextResponse.json(
        { error: 'Token and newSessionId are required' },
        { status: 400 }
      );
    }

    // Find abandoned cart
    const carts = await sql`
      SELECT
        id,
        session_id,
        cart_data,
        recovery_discount_code,
        recovery_discount_percent
      FROM abandoned_carts
      WHERE recovery_token = ${token}
      AND status NOT IN ('recovered', 'converted', 'lost')
      LIMIT 1
    `;

    if (carts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired recovery link' },
        { status: 404 }
      );
    }

    const cart = carts[0];

    // Restore cart to Redis with new session ID
    const cartData = cart.cart_data as any;

    // Add discount code if available
    if (cart.recovery_discount_code && cart.recovery_discount_percent) {
      cartData.discountCode = cart.recovery_discount_code;
      cartData.discountPercent = cart.recovery_discount_percent;
    }

    await redis.set(
      `cart:${newSessionId}`,
      JSON.stringify(cartData),
      'EX',
      60 * 60 * 24 * 30 // 30 days
    );

    // Mark cart as recovered
    await sql`
      UPDATE abandoned_carts
      SET
        status = 'recovered',
        recovered_at = NOW(),
        updated_at = NOW()
      WHERE id = ${cart.id}
    `;

    console.log(`[Cart Recovery] Cart ${cart.id} recovered to session ${newSessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Cart restored successfully',
      sessionId: newSessionId,
      discountCode: cart.recovery_discount_code,
      discountPercent: cart.recovery_discount_percent,
    });
  } catch (error: any) {
    console.error('[Cart Recovery API] Error restoring cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore cart' },
      { status: 500 }
    );
  }
}
