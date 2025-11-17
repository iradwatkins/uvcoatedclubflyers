import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { removeFromCart } from '@/lib/cart';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing item ID' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No cart session found' },
        { status: 404 }
      );
    }

    const cart = await removeFromCart(sessionId, itemId);
    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
