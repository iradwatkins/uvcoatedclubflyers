import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/cart';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ items: [], total: 0, itemCount: 0 });
    }

    const cart = await getCart(sessionId);
    return NextResponse.json(cart);
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart' },
      { status: 500 }
    );
  }
}
