import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { addToCart } from '@/lib/cart';
import { randomUUID } from 'crypto';
import { trackCartActivity } from '@/lib/abandoned-cart';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, productName, quantity, options, price, unitPrice, uploadedFiles, addOns } =
      body;

    if (!productId || !quantity || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create session ID
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      sessionId = randomUUID();
    }

    const cart = await addToCart(sessionId, {
      productId,
      productName,
      quantity,
      options: options || {},
      price,
      unitPrice,
      uploadedFiles: uploadedFiles || [],
      addOns: addOns || [],
    });

    // Track cart activity for abandoned cart detection
    trackCartActivity(sessionId, cart).catch((err) =>
      console.error('[Cart] Track activity error:', err)
    );

    const response = NextResponse.json({ success: true, cart });

    // Set cart session cookie
    // Note: secure should only be true when using HTTPS
    // Check if request is over HTTPS by looking at x-forwarded-proto or protocol
    const isHttps = request.headers.get('x-forwarded-proto') === 'https' ||
                    request.url.startsWith('https://');

    response.cookies.set('cart_session', sessionId, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
}
