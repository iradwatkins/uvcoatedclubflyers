import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await query('SELECT * FROM paper_stocks WHERE id = $1', [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Paper stock not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch paper stock:', error);
    return NextResponse.json({ error: 'Failed to fetch paper stock' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { markup, base_cost_per_sq_in, weight_per_sq_in, is_active } = body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (markup !== undefined) {
      const markupValue = parseFloat(markup);
      if (isNaN(markupValue) || markupValue < 0.1 || markupValue > 10) {
        return NextResponse.json(
          { error: 'Markup must be between 0.1 and 10' },
          { status: 400 }
        );
      }
      updates.push(`markup = $${paramIndex++}`);
      values.push(markupValue);
    }

    if (base_cost_per_sq_in !== undefined) {
      updates.push(`base_cost_per_sq_in = $${paramIndex++}`);
      values.push(parseFloat(base_cost_per_sq_in));
    }

    if (weight_per_sq_in !== undefined) {
      updates.push(`weight_per_sq_in = $${paramIndex++}`);
      values.push(parseFloat(weight_per_sq_in));
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(parseInt(id));

    const result = await query(
      `UPDATE paper_stocks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Paper stock not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update paper stock:', error);
    return NextResponse.json({ error: 'Failed to update paper stock' }, { status: 500 });
  }
}
