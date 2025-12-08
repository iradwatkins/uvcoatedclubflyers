import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { addToCart, getCart } from '@/lib/cart';

interface AcceptBumpRequest {
  bumpId: number;
  finalPrice: number;
  originalPrice: number;
}

/**
 * POST /api/order-bumps/accept
 * Accept an order bump and add the product to cart
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'No cart session' }, { status: 400 });
    }

    const body: AcceptBumpRequest = await request.json();
    const { bumpId, finalPrice, originalPrice } = body;

    if (!bumpId) {
      return NextResponse.json({ error: 'Missing bump ID' }, { status: 400 });
    }

    // Get the order bump details
    const [bump] = await sql`
      SELECT
        ob.id,
        ob.name,
        ob.product_id,
        ob.discount_type,
        ob.discount_value,
        p.name as product_name,
        p.base_price as product_base_price,
        p.image_url as product_image_url
      FROM order_bumps ob
      LEFT JOIN products p ON ob.product_id = p.id
      WHERE ob.id = ${bumpId} AND ob.is_active = true
    `;

    if (!bump) {
      return NextResponse.json({ error: 'Order bump not found' }, { status: 404 });
    }

    // Check if product is already in cart
    const cart = await getCart(sessionId);
    const alreadyInCart = cart.items.some(
      (item) => parseInt(item.productId, 10) === bump.product_id
    );

    if (alreadyInCart) {
      return NextResponse.json({ error: 'Product already in cart' }, { status: 400 });
    }

    // Calculate the final price
    let bumpPrice = bump.product_base_price || finalPrice;
    let discountApplied = 0;

    if (bump.discount_type === 'percentage' && bump.discount_value > 0) {
      discountApplied = bumpPrice * (bump.discount_value / 100);
      bumpPrice = bumpPrice - discountApplied;
    } else if (bump.discount_type === 'fixed' && bump.discount_value > 0) {
      discountApplied = bump.discount_value;
      bumpPrice = Math.max(0, bumpPrice - discountApplied);
    }

    // Round to 2 decimal places
    bumpPrice = Math.round(bumpPrice * 100) / 100;
    discountApplied = Math.round(discountApplied * 100) / 100;

    // Add bump product to cart
    const updatedCart = await addToCart(sessionId, {
      productId: bump.product_id?.toString() || `bump-${bumpId}`,
      productName: bump.product_name || bump.name,
      quantity: 1,
      options: {
        source: 'order_bump',
        bumpId: bumpId.toString(),
        discountApplied: discountApplied > 0 ? `$${discountApplied.toFixed(2)} off` : 'none',
      },
      price: bumpPrice,
      unitPrice: bumpPrice,
    });

    // Track the conversion
    await sql`
      INSERT INTO order_bump_stats (bump_id, session_id, event_type, bump_price, discount_applied, revenue)
      VALUES (${bumpId}, ${sessionId}, 'conversion', ${originalPrice || bumpPrice}, ${discountApplied}, ${bumpPrice})
    `;

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: `${bump.product_name || bump.name} added to your order!`,
      addedItem: {
        name: bump.product_name || bump.name,
        price: bumpPrice,
        originalPrice: originalPrice || bump.product_base_price,
        discountApplied,
      },
    });
  } catch (error) {
    console.error('[Order Bump Accept] Error:', error);
    return NextResponse.json({ error: 'Failed to accept order bump' }, { status: 500 });
  }
}

/**
 * DELETE /api/order-bumps/accept
 * Decline an order bump (for tracking)
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    const { searchParams } = new URL(request.url);
    const bumpId = searchParams.get('bumpId');

    if (!sessionId || !bumpId) {
      return NextResponse.json({ success: true }); // Silently succeed
    }

    // Track the decline
    await sql`
      INSERT INTO order_bump_stats (bump_id, session_id, event_type)
      VALUES (${parseInt(bumpId, 10)}, ${sessionId}, 'declined')
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Order Bump Decline] Error:', error);
    return NextResponse.json({ success: true }); // Don't fail on tracking errors
  }
}
