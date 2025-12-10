import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCartByRecoveryToken, trackEmailClick } from '@/lib/abandoned-cart';
import { redis } from '@/lib/redis';

/**
 * GET /api/abandoned-cart/recover?token=xxx
 * Recover an abandoned cart using a recovery token from email
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const emailNum = searchParams.get('email'); // Which email was clicked

    if (!token) {
      return NextResponse.json({ error: 'Recovery token required' }, { status: 400 });
    }

    // Get the abandoned cart
    const abandonedCart = await getCartByRecoveryToken(token);

    if (!abandonedCart) {
      return NextResponse.json({
        error: 'Cart not found or already recovered',
        expired: true,
      }, { status: 404 });
    }

    // Track the email click if email number provided
    if (emailNum) {
      await trackEmailClick(abandonedCart.id, parseInt(emailNum, 10));
    }

    // Get or create session ID
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      sessionId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    // Restore the cart data to Redis
    const cartData = abandonedCart.cartData as {
      items: unknown[];
      total: number;
      itemCount: number;
    };

    if (cartData && cartData.items && redis) {
      await redis.set(
        `cart:${sessionId}`,
        JSON.stringify(cartData),
        { EX: 60 * 60 * 24 * 7 } // 7 days
      );

      // Store the recovery coupon if one was offered
      if ((abandonedCart as unknown as { recoveryCouponCode: string }).recoveryCouponCode) {
        await redis.set(
          `cart:${sessionId}:recovery_coupon`,
          (abandonedCart as unknown as { recoveryCouponCode: string }).recoveryCouponCode,
          { EX: 60 * 60 * 24 } // 24 hours
        );
      }
    }

    // Create response with redirect to cart
    const response = NextResponse.redirect(new URL('/cart?recovered=true', request.url));

    // Set the session cookie
    response.cookies.set('cart_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Cart Recovery] Error:', error);
    return NextResponse.json({ error: 'Recovery failed' }, { status: 500 });
  }
}
