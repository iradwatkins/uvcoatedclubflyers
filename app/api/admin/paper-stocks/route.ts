import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get paper stocks
    const result = await query(
      `SELECT id, name, slug, type, thickness, base_cost_per_sq_in, weight_per_sq_in,
              markup, is_active
       FROM paper_stocks
       ORDER BY display_order, id`
    );

    // Get all coatings
    const coatingsResult = await query(
      `SELECT id, name, slug, description, is_active
       FROM coatings
       ORDER BY display_order, id`
    );

    // Get all sides options
    const sidesOptionsResult = await query(
      `SELECT id, name, slug, description, price_multiplier, is_active
       FROM sides_options
       ORDER BY display_order, id`
    );

    // Get paper stock coating assignments
    const coatingAssignmentsResult = await query(
      `SELECT psc.paper_stock_id, psc.coating_id, psc.is_default
       FROM paper_stock_coatings psc
       ORDER BY psc.paper_stock_id, psc.coating_id`
    );

    // Get paper stock sides assignments
    const sidesAssignmentsResult = await query(
      `SELECT pss.paper_stock_id, pss.sides_option_id, pss.is_default
       FROM paper_stock_sides pss
       ORDER BY pss.paper_stock_id, pss.sides_option_id`
    );

    // Group coating assignments by paper stock
    const coatingsByPaperStock: Record<number, { coating_id: number; is_default: boolean }[]> = {};
    for (const a of coatingAssignmentsResult.rows) {
      if (!coatingsByPaperStock[a.paper_stock_id]) {
        coatingsByPaperStock[a.paper_stock_id] = [];
      }
      coatingsByPaperStock[a.paper_stock_id].push({
        coating_id: a.coating_id,
        is_default: a.is_default,
      });
    }

    // Group sides assignments by paper stock
    const sidesByPaperStock: Record<number, { sides_option_id: number; is_default: boolean }[]> = {};
    for (const a of sidesAssignmentsResult.rows) {
      if (!sidesByPaperStock[a.paper_stock_id]) {
        sidesByPaperStock[a.paper_stock_id] = [];
      }
      sidesByPaperStock[a.paper_stock_id].push({
        sides_option_id: a.sides_option_id,
        is_default: a.is_default,
      });
    }

    // Add coatings and sides to each paper stock
    const paperStocksWithOptions = result.rows.map((ps: any) => ({
      ...ps,
      coatings: coatingsByPaperStock[ps.id] || [],
      sidesOptions: sidesByPaperStock[ps.id] || [],
    }));

    return NextResponse.json({
      paperStocks: paperStocksWithOptions,
      allCoatings: coatingsResult.rows,
      allSidesOptions: sidesOptionsResult.rows,
    });
  } catch (error) {
    console.error('Failed to fetch paper stocks:', error);
    return NextResponse.json({ error: 'Failed to fetch paper stocks' }, { status: 500 });
  }
}
