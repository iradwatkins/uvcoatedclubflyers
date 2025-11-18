/**
 * API Route: Calculate Product Price
 * POST /api/products/calculate-price
 *
 * Calculates pricing for printing products using square inch based model
 */

import { NextRequest, NextResponse } from 'next/server';
import { PricingEngine, type PriceCalculationInput } from '@/lib/services/pricing-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      productId,
      paperStockId,
      coatingId,
      turnaroundId,
      quantity,
      width,
      height,
      sides = 'double',
      addOns = [],
    } = body;

    if (
      !productId ||
      !paperStockId ||
      !coatingId ||
      !turnaroundId ||
      !quantity ||
      !width ||
      !height
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate numeric values
    if (
      isNaN(paperStockId) ||
      isNaN(coatingId) ||
      isNaN(turnaroundId) ||
      isNaN(quantity) ||
      isNaN(width) ||
      isNaN(height)
    ) {
      return NextResponse.json({ error: 'Invalid numeric values' }, { status: 400 });
    }

    // Validate sides
    if (sides !== 'single' && sides !== 'double') {
      return NextResponse.json({ error: 'Sides must be "single" or "double"' }, { status: 400 });
    }

    // Build calculation input
    const input: PriceCalculationInput = {
      productId: parseInt(productId),
      paperStockId: parseInt(paperStockId),
      coatingId: parseInt(coatingId),
      turnaroundId: parseInt(turnaroundId),
      quantity: parseInt(quantity),
      width: parseFloat(width),
      height: parseFloat(height),
      sides,
      addOns: addOns.map((a: any) => ({
        addOnId: parseInt(a.addOnId),
        subOptions: a.subOptions || {},
      })),
    };

    // Calculate price
    const priceBreakdown = await PricingEngine.calculatePrice(input);

    return NextResponse.json({
      success: true,
      data: priceBreakdown,
    });
  } catch (error: any) {
    console.error('[Pricing API] Error calculating price:', error);

    return NextResponse.json(
      {
        error: 'Failed to calculate price',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to calculate prices.' },
    { status: 405 }
  );
}
