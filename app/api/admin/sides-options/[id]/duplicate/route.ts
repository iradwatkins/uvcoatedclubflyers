import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// POST duplicate a sides option
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sidesOptionId = parseInt(id);

    // Get the original sides option
    const original = await query('SELECT * FROM sides_options WHERE id = $1', [sidesOptionId]);

    if (original.rows.length === 0) {
      return NextResponse.json({ error: 'Sides option not found' }, { status: 404 });
    }

    const orig = original.rows[0];

    // Generate unique slug
    let newSlug = `${orig.slug}-copy`;
    let counter = 1;
    while (true) {
      const existing = await query('SELECT id FROM sides_options WHERE slug = $1', [newSlug]);
      if (existing.rows.length === 0) break;
      newSlug = `${orig.slug}-copy-${counter++}`;
    }

    // Create the duplicate
    const result = await query(
      `INSERT INTO sides_options (name, slug, description, price_multiplier, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        `${orig.name} (Copy)`,
        newSlug,
        orig.description,
        orig.price_multiplier,
        orig.is_active,
        orig.display_order + 1
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to duplicate sides option:', error);
    return NextResponse.json({ error: 'Failed to duplicate sides option' }, { status: 500 });
  }
}
