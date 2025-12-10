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

// GET - List all coatings
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query('SELECT * FROM coatings ORDER BY display_order, id');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch coatings:', error);
    return NextResponse.json({ error: 'Failed to fetch coatings' }, { status: 500 });
  }
}

// POST - Create new coating
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
      description = '',
      is_active = true,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const finalSlug = slug || generateSlug(name);

    // Check if slug already exists
    const existingSlug = await query('SELECT id FROM coatings WHERE slug = $1', [finalSlug]);
    if (existingSlug.rows.length > 0) {
      return NextResponse.json({ error: 'A coating with this slug already exists' }, { status: 400 });
    }

    // Get max display_order
    const maxOrderResult = await query('SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM coatings');
    const displayOrder = maxOrderResult.rows[0].next_order;

    // Create the coating
    const result = await query(
      `INSERT INTO coatings (name, slug, description, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, finalSlug, description, is_active, displayOrder]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create coating:', error);
    return NextResponse.json({ error: 'Failed to create coating' }, { status: 500 });
  }
}
