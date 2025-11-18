/**
 * API Route: Get Product Pricing Options
 * GET /api/products/[id]/pricing-options
 *
 * Returns all available configuration options for pricing a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductPricingOptions } from '@/lib/services/pricing-engine';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const options = await getProductPricingOptions(productId);

    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error: any) {
    console.error('[Pricing Options API] Error:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to get pricing options',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
