import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET all sides options
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT id, name, slug, description, price_multiplier, is_active, display_order, created_at, updated_at
       FROM sides_options
       ORDER BY display_order, id`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch sides options:', error);
    return NextResponse.json({ error: 'Failed to fetch sides options' }, { status: 500 });
  }
}

// POST create new sides option
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, price_multiplier, is_active, display_order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check for duplicate slug
    const existing = await query('SELECT id FROM sides_options WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO sides_options (name, slug, description, price_multiplier, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        slug,
        description || null,
        price_multiplier || 1.0,
        is_active !== false,
        display_order || 0
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create sides option:', error);
    return NextResponse.json({ error: 'Failed to create sides option' }, { status: 500 });
  }
}
