import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/cart';

interface OrderBump {
  id: number;
  name: string;
  product_id: number | null;
  discount_type: string;
  discount_value: number;
  headline: string;
  description: string | null;
  checkbox_label: string;
  image_url: string | null;
  display_position: string;
  layout: string;
  background_color: string;
  border_color: string;
  highlight_text: string | null;
  priority: number;
  product_name?: string;
  product_base_price?: number;
  product_image_url?: string;
}

interface BumpRule {
  bump_id: number;
  rule_type: string;
  rule_value: Record<string, unknown>;
  operator: string;
}

/**
 * GET /api/order-bumps/evaluate
 * Evaluate which order bumps should be shown based on current cart
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ bumps: [] });
    }

    // Get current cart
    const cart = await getCart(sessionId);

    if (cart.items.length === 0) {
      return NextResponse.json({ bumps: [] });
    }

    // Get cart product IDs for rule evaluation
    const cartProductIds = cart.items.map((item) => parseInt(item.productId, 10));
    const cartTotal = cart.total;
    const cartItemCount = cart.itemCount;

    // Fetch active order bumps with their products
    const bumps = await sql<OrderBump[]>`
      SELECT
        ob.id,
        ob.name,
        ob.product_id,
        ob.discount_type,
        ob.discount_value,
        ob.headline,
        ob.description,
        ob.checkbox_label,
        ob.image_url,
        ob.display_position,
        ob.layout,
        ob.background_color,
        ob.border_color,
        ob.highlight_text,
        ob.priority,
        p.name as product_name,
        p.base_price as product_base_price,
        p.image_url as product_image_url
      FROM order_bumps ob
      LEFT JOIN products p ON ob.product_id = p.id
      WHERE ob.is_active = true
      ORDER BY ob.priority DESC
    `;

    // Fetch all rules for these bumps
    const bumpIds = bumps.map((b) => b.id);
    const rules = await sql<BumpRule[]>`
      SELECT bump_id, rule_type, rule_value, operator
      FROM order_bump_rules
      WHERE bump_id = ANY(${bumpIds})
    `;

    // Group rules by bump_id
    const rulesByBump = new Map<number, BumpRule[]>();
    for (const rule of rules) {
      if (!rulesByBump.has(rule.bump_id)) {
        rulesByBump.set(rule.bump_id, []);
      }
      rulesByBump.get(rule.bump_id)!.push(rule);
    }

    // Evaluate each bump's rules
    const eligibleBumps = bumps.filter((bump) => {
      const bumpRules = rulesByBump.get(bump.id) || [];

      // If no rules, don't show (must have at least one rule)
      if (bumpRules.length === 0) {
        return false;
      }

      // Don't show bump if product is already in cart
      if (bump.product_id && cartProductIds.includes(bump.product_id)) {
        return false;
      }

      // Evaluate rules - use AND logic by default
      return bumpRules.every((rule) => evaluateRule(rule, cartTotal, cartItemCount, cartProductIds));
    });

    // Calculate final prices for each bump
    const bumpsWithPrices = eligibleBumps.map((bump) => {
      let originalPrice = bump.product_base_price || 0;
      let finalPrice = originalPrice;

      if (bump.discount_type === 'percentage' && bump.discount_value > 0) {
        finalPrice = originalPrice * (1 - bump.discount_value / 100);
      } else if (bump.discount_type === 'fixed' && bump.discount_value > 0) {
        finalPrice = Math.max(0, originalPrice - bump.discount_value);
      }

      return {
        id: bump.id,
        name: bump.name,
        productId: bump.product_id,
        headline: bump.headline,
        description: bump.description,
        checkboxLabel: bump.checkbox_label,
        imageUrl: bump.image_url || bump.product_image_url,
        displayPosition: bump.display_position,
        layout: bump.layout,
        backgroundColor: bump.background_color,
        borderColor: bump.border_color,
        highlightText: bump.highlight_text,
        productName: bump.product_name,
        originalPrice,
        finalPrice: Math.round(finalPrice * 100) / 100,
        discountType: bump.discount_type,
        discountValue: bump.discount_value,
        savings: Math.round((originalPrice - finalPrice) * 100) / 100,
      };
    });

    // Track impressions
    if (bumpsWithPrices.length > 0) {
      await trackBumpImpressions(sessionId, bumpsWithPrices.map((b) => b.id));
    }

    return NextResponse.json({
      bumps: bumpsWithPrices,
    });
  } catch (error) {
    console.error('[Order Bumps Evaluate] Error:', error);
    return NextResponse.json({ error: 'Failed to evaluate order bumps' }, { status: 500 });
  }
}

/**
 * Evaluate a single rule against cart state
 */
function evaluateRule(
  rule: BumpRule,
  cartTotal: number,
  cartItemCount: number,
  cartProductIds: number[]
): boolean {
  const value = rule.rule_value;

  switch (rule.rule_type) {
    case 'all':
      // Always matches
      return true;

    case 'cart_total_min':
      // Cart total must be at least this value
      return cartTotal >= (value.min_value as number || 0);

    case 'cart_total_max':
      // Cart total must be at most this value
      return cartTotal <= (value.max_value as number || Infinity);

    case 'cart_item_count':
      // Cart must have specific number of items
      const minItems = (value.min_items as number) ?? 0;
      const maxItems = (value.max_items as number) ?? Infinity;
      return cartItemCount >= minItems && cartItemCount <= maxItems;

    case 'cart_contains':
      // Cart must contain specific product(s)
      const requiredProducts = value.product_ids as number[] || [];
      return requiredProducts.some((pid) => cartProductIds.includes(pid));

    case 'cart_not_contains':
      // Cart must NOT contain specific product(s)
      const excludedProducts = value.product_ids as number[] || [];
      return !excludedProducts.some((pid) => cartProductIds.includes(pid));

    case 'product_category':
      // Cart contains product from specific category
      // TODO: Implement category check
      return true;

    default:
      return false;
  }
}

/**
 * Track bump impressions
 */
async function trackBumpImpressions(sessionId: string, bumpIds: number[]) {
  try {
    for (const bumpId of bumpIds) {
      await sql`
        INSERT INTO order_bump_stats (bump_id, session_id, event_type)
        VALUES (${bumpId}, ${sessionId}, 'impression')
      `;
    }
  } catch (error) {
    console.error('[Track Bump Impressions] Error:', error);
  }
}
