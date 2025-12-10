import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/admin/run-migration
// Run a specific migration by number (e.g., 026)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { migrationNumber } = await request.json();

    if (!migrationNumber) {
      return NextResponse.json({ error: 'Migration number required' }, { status: 400 });
    }

    // Migration 026: Add category column to add_ons
    if (migrationNumber === '026') {
      // Add category column if not exists
      await query(`
        ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS category VARCHAR(100)
      `);

      // Update design-related add-ons
      await query(`
        UPDATE add_ons
        SET category = 'Design Services'
        WHERE slug IN (
          'upload-my-artwork',
          'standard-custom-design',
          'rush-custom-design',
          'design-changes-minor',
          'design-changes-major',
          'will-upload-later'
        )
      `);

      // Update finishing add-ons
      await query(`
        UPDATE add_ons
        SET category = 'Finishing Options'
        WHERE slug IN (
          'perforation',
          'score-only',
          'folding',
          'corner-rounding',
          'hole-drilling',
          'wafer-seal'
        )
      `);

      // Update packaging add-ons
      await query(`
        UPDATE add_ons
        SET category = 'Packaging & Bundling'
        WHERE slug IN ('banding', 'shrink-wrapping')
      `);

      // Update premium add-ons
      await query(`
        UPDATE add_ons
        SET category = 'Premium Finishes'
        WHERE slug IN ('foil-stamping', 'spot-uv')
      `);

      // Update personalization add-ons
      await query(`
        UPDATE add_ons
        SET category = 'Personalization'
        WHERE slug IN ('variable-data-printing', 'numbering', 'qr-code')
      `);

      // Update pricing add-ons
      await query(`
        UPDATE add_ons
        SET category = 'Pricing Adjustments'
        WHERE slug IN ('our-tagline', 'exact-size')
      `);

      // Update proofs add-ons
      await query(`
        UPDATE add_ons
        SET category = 'Proofs & QC'
        WHERE slug IN ('digital-proof')
      `);

      // Create index
      await query(`
        CREATE INDEX IF NOT EXISTS idx_add_ons_category ON add_ons(category)
      `);

      return NextResponse.json({
        success: true,
        message: 'Migration 026 completed: Added category column and updated add-on categories',
      });
    }

    return NextResponse.json({ error: 'Unknown migration number' }, { status: 400 });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/run-migration
// Get current migration status
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if category column exists
    const columnCheck = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'add_ons' AND column_name = 'category'
    `);

    const hasCategoryColumn = columnCheck.rows.length > 0;

    // Get add-ons with categories
    const addOns = await query(`
      SELECT id, name, slug, category
      FROM add_ons
      ORDER BY category, display_order
    `);

    return NextResponse.json({
      hasCategoryColumn,
      addOns: addOns.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
