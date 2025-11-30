/**
 * API Route: Get Quick Products
 * GET /api/products/quick
 *
 * Returns quick products for the homepage carousel
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.base_price,
        p.image_url,
        p.fixed_width,
        p.fixed_height,
        p.fixed_sides,
        ps.name as paper_stock_name,
        c.name as coating_name
      FROM products p
      LEFT JOIN paper_stocks ps ON p.fixed_paper_stock_id = ps.id
      LEFT JOIN coatings c ON p.fixed_coating_id = c.id
      WHERE p.is_quick_product = true
        AND p.status = 'active'
      ORDER BY p.display_order ASC`
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('[Quick Products API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick products', message: error.message },
      { status: 500 }
    );
  }
}
