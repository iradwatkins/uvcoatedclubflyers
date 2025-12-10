import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET single sides option
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await query('SELECT * FROM sides_options WHERE id = $1', [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Sides option not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch sides option:', error);
    return NextResponse.json({ error: 'Failed to fetch sides option' }, { status: 500 });
  }
}

// PATCH update sides option
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sidesOptionId = parseInt(id);
    const body = await request.json();
    const { name, slug, description, price_multiplier, is_active, display_order } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (slug !== undefined) {
      // Check for duplicate slug (excluding current record)
      const existing = await query(
        'SELECT id FROM sides_options WHERE slug = $1 AND id != $2',
        [slug, sidesOptionId]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
      updates.push(`slug = $${paramIndex++}`);
      values.push(slug);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (price_multiplier !== undefined) {
      const multiplier = parseFloat(price_multiplier);
      if (isNaN(multiplier) || multiplier < 0.1 || multiplier > 10) {
        return NextResponse.json(
          { error: 'Price multiplier must be between 0.1 and 10' },
          { status: 400 }
        );
      }
      updates.push(`price_multiplier = $${paramIndex++}`);
      values.push(multiplier);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (display_order !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(display_order);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(sidesOptionId);

    const result = await query(
      `UPDATE sides_options SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Sides option not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update sides option:', error);
    return NextResponse.json({ error: 'Failed to update sides option' }, { status: 500 });
  }
}

// DELETE sides option
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sidesOptionId = parseInt(id);

    // Check if this option is used by any paper stocks
    const usageCheck = await query(
      'SELECT COUNT(*) as count FROM paper_stock_sides WHERE sides_option_id = $1',
      [sidesOptionId]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete: This option is assigned to paper stocks. Remove assignments first.' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM sides_options WHERE id = $1 RETURNING id',
      [sidesOptionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Sides option not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: sidesOptionId });
  } catch (error) {
    console.error('Failed to delete sides option:', error);
    return NextResponse.json({ error: 'Failed to delete sides option' }, { status: 500 });
  }
}
