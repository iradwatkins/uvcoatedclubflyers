import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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

    // Get all sides options (master list - price_multiplier is per paper stock, not here)
    const sidesOptionsResult = await query(
      `SELECT id, name, slug, description, is_active
       FROM sides_options
       ORDER BY display_order, id`
    );

    // Get paper stock coating assignments
    const coatingAssignmentsResult = await query(
      `SELECT psc.paper_stock_id, psc.coating_id, psc.is_default
       FROM paper_stock_coatings psc
       ORDER BY psc.paper_stock_id, psc.coating_id`
    );

    // Get paper stock sides assignments (including price_multiplier per paper stock)
    const sidesAssignmentsResult = await query(
      `SELECT pss.paper_stock_id, pss.sides_option_id, pss.is_default, pss.price_multiplier
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

    // Group sides assignments by paper stock (including price_multiplier)
    const sidesByPaperStock: Record<number, { sides_option_id: number; is_default: boolean; price_multiplier: string }[]> = {};
    for (const a of sidesAssignmentsResult.rows) {
      if (!sidesByPaperStock[a.paper_stock_id]) {
        sidesByPaperStock[a.paper_stock_id] = [];
      }
      sidesByPaperStock[a.paper_stock_id].push({
        sides_option_id: a.sides_option_id,
        is_default: a.is_default,
        price_multiplier: a.price_multiplier || '1.0',
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

// POST - Create new paper stock
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      type = 'cardstock',
      thickness = '',
      base_cost_per_sq_in = 0.0001,
      weight_per_sq_in = 0.000001,
      markup = 1.75,
      is_active = true,
      coatings = [], // Array of coating IDs
      sidesOptions = [], // Array of { sides_option_id, is_default, price_multiplier }
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const finalSlug = slug || generateSlug(name);

    // Check if slug already exists
    const existingSlug = await query('SELECT id FROM paper_stocks WHERE slug = $1', [finalSlug]);
    if (existingSlug.rows.length > 0) {
      return NextResponse.json({ error: 'A paper stock with this slug already exists' }, { status: 400 });
    }

    // Get max display_order
    const maxOrderResult = await query('SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM paper_stocks');
    const displayOrder = maxOrderResult.rows[0].next_order;

    // Create the paper stock
    const result = await query(
      `INSERT INTO paper_stocks (name, slug, type, thickness, base_cost_per_sq_in, weight_per_sq_in, markup, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, finalSlug, type, thickness, base_cost_per_sq_in, weight_per_sq_in, markup, is_active, displayOrder]
    );

    const newPaperStock = result.rows[0];
    const paperStockId = newPaperStock.id;

    // Add coating assignments if provided
    if (coatings.length > 0) {
      const coatingValues = coatings.map((coatingId: number, index: number) =>
        `(${paperStockId}, ${coatingId}, ${index === 0})`
      ).join(', ');
      await query(
        `INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES ${coatingValues}`
      );
    }

    // Add sides options assignments if provided
    if (sidesOptions.length > 0) {
      const sidesValues = sidesOptions.map((opt: { sides_option_id: number; is_default?: boolean; price_multiplier?: number }) =>
        `(${paperStockId}, ${opt.sides_option_id}, ${opt.is_default || false}, ${opt.price_multiplier || 1.0})`
      ).join(', ');
      await query(
        `INSERT INTO paper_stock_sides (paper_stock_id, sides_option_id, is_default, price_multiplier) VALUES ${sidesValues}`
      );
    }

    // Fetch and return the complete paper stock with assignments
    const coatingsResult = await query(
      `SELECT coating_id, is_default FROM paper_stock_coatings WHERE paper_stock_id = $1`,
      [paperStockId]
    );
    const sidesResult = await query(
      `SELECT sides_option_id, is_default, price_multiplier FROM paper_stock_sides WHERE paper_stock_id = $1`,
      [paperStockId]
    );

    return NextResponse.json({
      ...newPaperStock,
      coatings: coatingsResult.rows,
      sidesOptions: sidesResult.rows,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create paper stock:', error);
    return NextResponse.json({ error: 'Failed to create paper stock' }, { status: 500 });
  }
}
