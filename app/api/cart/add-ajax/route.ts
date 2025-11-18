import { type NextRequest, NextResponse } from 'next/server';
import { addToCart, type CartItem } from '@/lib/cart';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { randomBytes } from 'crypto';

/**
 * POST /api/cart/add-ajax
 * Add item to cart via AJAX (no page reload)
 * Tracks analytics and updates session
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('session_id')?.value;

    // Generate session ID if not exists
    if (!sessionId) {
      sessionId = randomBytes(32).toString('hex');
      cookieStore.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    const body = await request.json();
    const { productId, productName, quantity, options, price, unitPrice } = body;

    // Validation
    if (!productId || !productName || !quantity || !price || !unitPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Add to Redis cart
    const cart = await addToCart(sessionId, {
      productId,
      productName,
      quantity,
      options: options || {},
      price,
      unitPrice,
    });

    // Update cart session in database
    await updateCartSession(sessionId, cart);

    // Track analytics event
    await trackCartEvent(sessionId, 'item_added', {
      product_id: parseInt(productId),
      quantity,
      price,
      options,
      cart_value_after: cart.total,
    });

    // Get upsells for updated cart
    const upsells = await getCartUpsells(cart);

    return NextResponse.json({
      success: true,
      cart,
      upsells,
      message: `${productName} added to cart`,
    });
  } catch (error: any) {
    console.error('[Add to Cart AJAX] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

/**
 * Update cart session in database
 */
async function updateCartSession(sessionId: string, cart: any) {
  try {
    await sql`
      INSERT INTO cart_sessions (
        session_id,
        cart_data,
        total_value,
        item_count,
        last_activity_at
      ) VALUES (
        ${sessionId},
        ${JSON.stringify(cart)}::jsonb,
        ${cart.total},
        ${cart.itemCount},
        NOW()
      )
      ON CONFLICT (session_id)
      DO UPDATE SET
        cart_data = ${JSON.stringify(cart)}::jsonb,
        total_value = ${cart.total},
        item_count = ${cart.itemCount},
        last_activity_at = NOW(),
        updated_at = NOW(),
        status = 'active'
    `;
  } catch (error) {
    console.error('[Update Cart Session] Error:', error);
  }
}

/**
 * Track cart interaction event
 */
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

/**
 * Get cart upsells
 */
async function getCartUpsells(cart: any) {
  try {
    const cartValue = cart.total;
    const itemCount = cart.itemCount;

    const upsells = await sql`
      SELECT
        cu.id,
        cu.name,
        cu.upsell_products,
        cu.max_display
      FROM cart_upsells cu
      WHERE cu.is_active = true
      AND (
        (cu.trigger_type = 'cart_value'
          AND ${cartValue} >= COALESCE((cu.trigger_config->>'min_cart_value')::int, 0))
      )
      ORDER BY cu.priority DESC
      LIMIT 3
    `;

    const upsellsWithProducts = await Promise.all(
      upsells.map(async (upsell) => {
        const productIds = (upsell.upsell_products as any[]).map((p: any) => p.product_id);
        const products = await sql`
          SELECT id, name, base_price, image_url
          FROM products
          WHERE id = ANY(${productIds}) AND is_active = true
          LIMIT ${upsell.max_display}
        `;
        return products.length > 0 ? { id: upsell.id, products } : null;
      })
    );

    return upsellsWithProducts.filter((u) => u !== null);
  } catch (error) {
    console.error('[Get Upsells] Error:', error);
    return [];
  }
}
