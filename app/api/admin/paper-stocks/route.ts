import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT id, name, slug, type, thickness, base_cost_per_sq_in, weight_per_sq_in,
              markup, sides_multiplier_single, sides_multiplier_double, is_active
       FROM paper_stocks
       ORDER BY display_order, id`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch paper stocks:', error);
    return NextResponse.json({ error: 'Failed to fetch paper stocks' }, { status: 500 });
  }
}
