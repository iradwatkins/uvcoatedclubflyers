import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/addons/[id]/choices - Get all choices for an add-on
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const addOnId = parseInt(id);

    if (isNaN(addOnId)) {
      return NextResponse.json({ error: 'Invalid add-on ID' }, { status: 400 });
    }

    const result = await query(
      `SELECT * FROM add_on_choices
       WHERE add_on_id = $1
       ORDER BY display_order, id`,
      [addOnId]
    );

    return NextResponse.json({ choices: result.rows });
  } catch (error: any) {
    console.error('Error fetching choices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/addons/[id]/choices - Create a new choice
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const addOnId = parseInt(id);

    if (isNaN(addOnId)) {
      return NextResponse.json({ error: 'Invalid add-on ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      value,
      label,
      description,
      priceType = 'flat',
      basePrice = 0,
      perUnitPrice = 0,
      percentage = 0,
      requiresFileUpload = false,
      requiresSidesSelection = false,
      sidesPricing = null,
      displayOrder = 0,
      isDefault = false,
      isActive = true,
    } = body;

    if (!value || !label) {
      return NextResponse.json(
        { error: 'Value and label are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO add_on_choices (
        add_on_id, value, label, description,
        price_type, base_price, per_unit_price, percentage,
        requires_file_upload, requires_sides_selection, sides_pricing,
        display_order, is_default, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        addOnId,
        value,
        label,
        description,
        priceType,
        basePrice,
        perUnitPrice,
        percentage,
        requiresFileUpload,
        requiresSidesSelection,
        sidesPricing ? JSON.stringify(sidesPricing) : null,
        displayOrder,
        isDefault,
        isActive,
      ]
    );

    return NextResponse.json({ choice: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating choice:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A choice with this value already exists for this add-on' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/addons/[id]/choices - Bulk update choices (for reordering)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const addOnId = parseInt(id);

    if (isNaN(addOnId)) {
      return NextResponse.json({ error: 'Invalid add-on ID' }, { status: 400 });
    }

    const body = await request.json();
    const { choices } = body;

    if (!Array.isArray(choices)) {
      return NextResponse.json(
        { error: 'Choices array is required' },
        { status: 400 }
      );
    }

    // Update each choice's display_order
    for (const choice of choices) {
      await query(
        `UPDATE add_on_choices
         SET display_order = $1, updated_at = NOW()
         WHERE id = $2 AND add_on_id = $3`,
        [choice.displayOrder, choice.id, addOnId]
      );
    }

    // Fetch updated choices
    const result = await query(
      `SELECT * FROM add_on_choices
       WHERE add_on_id = $1
       ORDER BY display_order, id`,
      [addOnId]
    );

    return NextResponse.json({ choices: result.rows });
  } catch (error: any) {
    console.error('Error updating choices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
