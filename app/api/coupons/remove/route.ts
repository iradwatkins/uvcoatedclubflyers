import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/cart';

/**
 * DELETE /api/coupons/remove
 * Remove applied coupon from cart session
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ success: true });
    }

    // Remove coupon from session
    await sql`
      DELETE FROM cart_coupons WHERE session_id = ${sessionId}
    `;

    // Get updated cart total
    const cart = await getCart(sessionId);

    return NextResponse.json({
      success: true,
      cartTotal: cart.total,
    });
  } catch (error) {
    console.error('[Coupon Remove] Error:', error);
    return NextResponse.json({ error: 'Failed to remove coupon' }, { status: 500 });
  }
}
