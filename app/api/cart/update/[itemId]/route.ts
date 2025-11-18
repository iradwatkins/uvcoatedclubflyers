import { type NextRequest, NextResponse } from 'next/server';
import { updateCartItem, getCart } from '@/lib/cart';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

/**
 * PATCH /api/cart/update/[itemId]
 * Update cart item quantity via AJAX
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 400 });
    }

    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Get cart before update for comparison
    const cartBefore = await getCart(sessionId);
    const itemBefore = cartBefore.items.find((i) => i.id === itemId);

    // Update quantity
    const updatedCart = await updateCartItem(sessionId, itemId, quantity);

    // Update session
    await updateCartSession(sessionId, updatedCart);

    // Track analytics
    if (itemBefore) {
      await trackCartEvent(sessionId, 'quantity_changed', {
        product_id: parseInt(itemBefore.productId),
        quantity_before: itemBefore.quantity,
        quantity_after: quantity,
        cart_value_before: cartBefore.total,
        cart_value_after: updatedCart.total,
      });
    }

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: 'Cart updated',
    });
  } catch (error: any) {
    console.error('[Update Cart Item] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update cart' }, { status: 500 });
  }
}

async function updateCartSession(sessionId: string, cart: any) {
  try {
    await sql`
      UPDATE cart_sessions
      SET
        cart_data = ${JSON.stringify(cart)}::jsonb,
        total_value = ${cart.total},
        item_count = ${cart.itemCount},
        last_activity_at = NOW(),
        updated_at = NOW()
      WHERE session_id = ${sessionId}
    `;
  } catch (error) {
    console.error('[Update Cart Session] Error:', error);
  }
}

async function trackCartEvent(
  sessionId: string,
  eventType: string,
  eventData: Record<string, any>
) {
  try {
    await sql`
      INSERT INTO cart_interactions (
        session_id,
        event_type,
        event_data,
        product_id,
        quantity,
        created_at
      ) VALUES (
        ${sessionId},
        ${eventType},
        ${JSON.stringify(eventData)}::jsonb,
        ${eventData.product_id || null},
        ${eventData.quantity_after || null},
        NOW()
      )
    `;
  } catch (error) {
    console.error('[Track Cart Event] Error:', error);
  }
}
