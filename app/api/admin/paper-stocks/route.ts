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
              markup, sides_multiplier_single, sides_multiplier_double, is_active
       FROM paper_stocks
       ORDER BY display_order, id`
    );

    // Get all coatings
    const coatingsResult = await query(
      `SELECT id, name, slug, description, is_active
       FROM coatings
       ORDER BY display_order, id`
    );

    // Get paper stock coating assignments
    const assignmentsResult = await query(
      `SELECT psc.paper_stock_id, psc.coating_id, psc.is_default
       FROM paper_stock_coatings psc
       ORDER BY psc.paper_stock_id, psc.coating_id`
    );

    // Group assignments by paper stock
    const assignmentsByPaperStock: Record<number, { coating_id: number; is_default: boolean }[]> = {};
    for (const a of assignmentsResult.rows) {
      if (!assignmentsByPaperStock[a.paper_stock_id]) {
        assignmentsByPaperStock[a.paper_stock_id] = [];
      }
      assignmentsByPaperStock[a.paper_stock_id].push({
        coating_id: a.coating_id,
        is_default: a.is_default,
      });
    }

    // Add coatings to each paper stock
    const paperStocksWithCoatings = result.rows.map((ps: any) => ({
      ...ps,
      coatings: assignmentsByPaperStock[ps.id] || [],
    }));

    return NextResponse.json({
      paperStocks: paperStocksWithCoatings,
      allCoatings: coatingsResult.rows,
    });
  } catch (error) {
    console.error('Failed to fetch paper stocks:', error);
    return NextResponse.json({ error: 'Failed to fetch paper stocks' }, { status: 500 });
  }
}
