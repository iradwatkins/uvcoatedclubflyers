import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateCartItem } from '@/lib/cart';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid item ID or quantity' },
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

    const cart = await updateCartItem(sessionId, itemId, quantity);
    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}
