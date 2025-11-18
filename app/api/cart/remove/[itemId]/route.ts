import { type NextRequest, NextResponse } from 'next/server';
import { removeFromCart, getCart } from '@/lib/cart';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

/**
 * DELETE /api/cart/remove/[itemId]
 * Remove item from cart via AJAX
 */
export async function DELETE(
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

    // Get item details before removing for analytics
    const cart = await getCart(sessionId);
    const item = cart.items.find((i) => i.id === itemId);

    // Remove from cart
    const updatedCart = await removeFromCart(sessionId, itemId);

    // Update session
    await updateCartSession(sessionId, updatedCart);

    // Track analytics
    if (item) {
      await trackCartEvent(sessionId, 'item_removed', {
        product_id: parseInt(item.productId),
        quantity: item.quantity,
        price: item.price,
        cart_value_after: updatedCart.total,
      });
    }

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: 'Item removed from cart',
    });
  } catch (error: any) {
    console.error('[Remove from Cart] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove item' }, { status: 500 });
  }
}

async function updateCartSession(sessionId: string, cart: any) {
  try {
    if (cart.items.length === 0) {
      // Mark session as abandoned if cart is now empty
      await sql`
        UPDATE cart_sessions
        SET
          cart_data = ${JSON.stringify(cart)}::jsonb,
          total_value = 0,
          item_count = 0,
          last_activity_at = NOW(),
          updated_at = NOW()
        WHERE session_id = ${sessionId}
      `;
    } else {
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
    }
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
        price_at_time,
        created_at
      ) VALUES (
        ${sessionId},
        ${eventType},
        ${JSON.stringify(eventData)}::jsonb,
        ${eventData.product_id || null},
        ${eventData.quantity || null},
        ${eventData.price || null},
        NOW()
      )
    `;
  } catch (error) {
    console.error('[Track Cart Event] Error:', error);
  }
}
