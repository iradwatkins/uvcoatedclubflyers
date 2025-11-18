import { type NextRequest, NextResponse } from 'next/server';
import { getCart } from '@/lib/cart';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

/**
 * GET /api/cart/session
 * Get current cart with upsell recommendations
 * Returns cart data + personalized upsells + session tracking
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || '';

    if (!sessionId) {
      return NextResponse.json({
        cart: { items: [], total: 0, itemCount: 0 },
        upsells: [],
        session: null,
      });
    }

    // Get cart from Redis
    const cart = await getCart(sessionId);

    // Track/update cart session in database
    const session = await trackCartSession(sessionId, cart);

    // Get personalized upsells based on cart
    const upsells = await getCartUpsells(cart);

    // Track analytics event
    await trackCartEvent(sessionId, 'cart_viewed', {
      item_count: cart.itemCount,
      cart_value: cart.total,
    });

    return NextResponse.json({
      cart,
      upsells,
      session: {
        id: session.id,
        itemCount: session.item_count,
        totalValue: session.total_value,
        lastActivity: session.last_activity_at,
      },
    });
  } catch (error: any) {
    console.error('[Cart Session] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get cart session' },
      { status: 500 }
    );
  }
}

/**
 * Track or update cart session in database
 */
async function trackCartSession(sessionId: string, cart: any) {
  try {
    // Upsert cart session
    const result = await query(
      `INSERT INTO cart_sessions (
        session_id,
        cart_data,
        total_value,
        item_count,
        last_activity_at
      ) VALUES (
        $1,
        $2::jsonb,
        $3,
        $4,
        NOW()
      )
      ON CONFLICT (session_id)
      DO UPDATE SET
        cart_data = $2::jsonb,
        total_value = $3,
        item_count = $4,
        last_activity_at = NOW(),
        updated_at = NOW()
      RETURNING *`,
      [sessionId, JSON.stringify(cart), cart.total, cart.itemCount]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[Track Cart Session] Error:', error);
    throw error;
  }
}

/**
 * Get personalized upsell recommendations
 */
async function getCartUpsells(cart: any) {
  try {
    // Get active upsell rules that match cart conditions
    const cartValue = cart.total;
    const itemCount = cart.itemCount;

    // Query for applicable upsells
    const upsellsResult = await query(
      `SELECT
        cu.id,
        cu.name,
        cu.description,
        cu.trigger_type,
        cu.upsell_products,
        cu.max_display,
        cu.display_position
      FROM cart_upsells cu
      WHERE cu.is_active = true
      AND (
        -- Empty cart upsells
        (cu.trigger_type = 'cart_empty' AND $1 = 0)
        OR
        -- Cart value-based upsells
        (cu.trigger_type = 'cart_value'
          AND $2 >= COALESCE((cu.trigger_config->>'min_cart_value')::int, 0)
          AND (cu.trigger_config->>'max_cart_value' IS NULL
            OR $2 <= (cu.trigger_config->>'max_cart_value')::int)
        )
      )
      ORDER BY cu.priority DESC, cu.display_order ASC
      LIMIT 3`,
      [itemCount, cartValue]
    );

    const upsells = upsellsResult.rows;

    // For each upsell, fetch the actual product details
    const upsellsWithProducts = await Promise.all(
      upsells.map(async (upsell) => {
        const productIds = (upsell.upsell_products as any[]).map((p: any) => p.product_id);

        if (productIds.length === 0) {
          return null;
        }

        const productsResult = await query(
          `SELECT
            id,
            name,
            description,
            base_price,
            image_url,
            is_active
          FROM products
          WHERE id = ANY($1)
          AND is_active = true
          LIMIT $2`,
          [productIds, upsell.max_display]
        );

        const products = productsResult.rows;

        // Merge product data with discount info from upsell config
        const productsWithDiscounts = products.map((product) => {
          const upsellProduct = (upsell.upsell_products as any[]).find(
            (p: any) => p.product_id === product.id
          );
          return {
            ...product,
            discountPercent: upsellProduct?.discount_percent || 0,
            finalPrice:
              product.base_price -
              Math.round((product.base_price * (upsellProduct?.discount_percent || 0)) / 100),
          };
        });

        return {
          id: upsell.id,
          name: upsell.name,
          description: upsell.description,
          products: productsWithDiscounts,
          position: upsell.display_position,
        };
      })
    );

    return upsellsWithProducts.filter((u) => u !== null && u.products.length > 0);
  } catch (error) {
    console.error('[Get Cart Upsells] Error:', error);
    return [];
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
    await query(
      `INSERT INTO cart_interactions (
        session_id,
        event_type,
        event_data,
        created_at
      ) VALUES (
        $1,
        $2,
        $3::jsonb,
        NOW()
      )`,
      [sessionId, eventType, JSON.stringify(eventData)]
    );
  } catch (error) {
    console.error('[Track Cart Event] Error:', error);
    // Don't throw - analytics should not break cart functionality
  }
}
