import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearCart } from '@/lib/cart';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (sessionId) {
      await clearCart(sessionId);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('cart_session');

    return response;
  } catch (error) {
    console.error('Clear cart error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
