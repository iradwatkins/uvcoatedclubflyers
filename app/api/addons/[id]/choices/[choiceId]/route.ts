import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string; choiceId: string }>;
}

// GET /api/addons/[id]/choices/[choiceId] - Get a single choice
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, choiceId } = await params;
    const addOnId = parseInt(id);
    const choiceIdNum = parseInt(choiceId);

    if (isNaN(addOnId) || isNaN(choiceIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const result = await query(
      `SELECT * FROM add_on_choices
       WHERE id = $1 AND add_on_id = $2`,
      [choiceIdNum, addOnId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Choice not found' }, { status: 404 });
    }

    return NextResponse.json({ choice: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching choice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/addons/[id]/choices/[choiceId] - Update a choice
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, choiceId } = await params;
    const addOnId = parseInt(id);
    const choiceIdNum = parseInt(choiceId);

    if (isNaN(addOnId) || isNaN(choiceIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      value,
      label,
      description,
      priceType,
      basePrice,
      perUnitPrice,
      percentage,
      requiresFileUpload,
      requiresSidesSelection,
      sidesPricing,
      displayOrder,
      isDefault,
      isActive,
    } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (value !== undefined) {
      updates.push(`value = $${paramCount++}`);
      values.push(value);
    }
    if (label !== undefined) {
      updates.push(`label = $${paramCount++}`);
      values.push(label);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (priceType !== undefined) {
      updates.push(`price_type = $${paramCount++}`);
      values.push(priceType);
    }
    if (basePrice !== undefined) {
      updates.push(`base_price = $${paramCount++}`);
      values.push(basePrice);
    }
    if (perUnitPrice !== undefined) {
      updates.push(`per_unit_price = $${paramCount++}`);
      values.push(perUnitPrice);
    }
    if (percentage !== undefined) {
      updates.push(`percentage = $${paramCount++}`);
      values.push(percentage);
    }
    if (requiresFileUpload !== undefined) {
      updates.push(`requires_file_upload = $${paramCount++}`);
      values.push(requiresFileUpload);
    }
    if (requiresSidesSelection !== undefined) {
      updates.push(`requires_sides_selection = $${paramCount++}`);
      values.push(requiresSidesSelection);
    }
    if (sidesPricing !== undefined) {
      updates.push(`sides_pricing = $${paramCount++}`);
      values.push(sidesPricing ? JSON.stringify(sidesPricing) : null);
    }
    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(displayOrder);
    }
    if (isDefault !== undefined) {
      updates.push(`is_default = $${paramCount++}`);
      values.push(isDefault);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(choiceIdNum, addOnId);

    const result = await query(
      `UPDATE add_on_choices
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND add_on_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Choice not found' }, { status: 404 });
    }

    return NextResponse.json({ choice: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating choice:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A choice with this value already exists for this add-on' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/addons/[id]/choices/[choiceId] - Delete a choice
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, choiceId } = await params;
    const addOnId = parseInt(id);
    const choiceIdNum = parseInt(choiceId);

    if (isNaN(addOnId) || isNaN(choiceIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const result = await query(
      `DELETE FROM add_on_choices
       WHERE id = $1 AND add_on_id = $2
       RETURNING id`,
      [choiceIdNum, addOnId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Choice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: choiceIdNum });
  } catch (error: any) {
    console.error('Error deleting choice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
