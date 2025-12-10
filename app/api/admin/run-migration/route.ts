/**
 * API Route: Run Database Migration
 * POST /api/admin/run-migration
 *
 * Runs a specific SQL migration on the database.
 * ADMIN ONLY - Protected endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { migrationName } = await request.json();

    if (migrationName === '029_design_addon_sub_options') {
      // Run the migration to add design_sides sub-option

      // First, add columns if they don't exist
      await query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'add_on_sub_options' AND column_name = 'show_when'
          ) THEN
            ALTER TABLE add_on_sub_options ADD COLUMN show_when JSONB;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'add_on_sub_options' AND column_name = 'affects_pricing'
          ) THEN
            ALTER TABLE add_on_sub_options ADD COLUMN affects_pricing BOOLEAN DEFAULT false;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'add_on_sub_options' AND column_name = 'tooltip'
          ) THEN
            ALTER TABLE add_on_sub_options ADD COLUMN tooltip TEXT;
          END IF;
        END $$;
      `);

      // Insert the design_sides sub-option
      const insertResult = await query(`
        INSERT INTO add_on_sub_options (
          add_on_id,
          field_name,
          field_label,
          field_type,
          options,
          default_value,
          is_required,
          display_order,
          show_when,
          affects_pricing,
          tooltip
        )
        SELECT
          1,
          'design_sides',
          'How many sides need design?',
          'select',
          '{"options": [{"value": "one", "label": "One Side"}, {"value": "two", "label": "Two Sides"}]}'::jsonb,
          'one',
          true,
          1,
          '{"choiceRequiresSides": true}'::jsonb,
          true,
          'Select how many sides you need designed. Two-sided design costs more.'
        WHERE NOT EXISTS (
          SELECT 1 FROM add_on_sub_options
          WHERE add_on_id = 1 AND field_name = 'design_sides'
        )
        RETURNING id;
      `);

      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
        result: insertResult.rows,
      });
    }

    return NextResponse.json({ error: 'Unknown migration' }, { status: 400 });
  } catch (error: any) {
    console.error('[Migration API] Error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run the migration to add design_sides sub-option
    // First, add columns if they don't exist
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'add_on_sub_options' AND column_name = 'show_when'
        ) THEN
          ALTER TABLE add_on_sub_options ADD COLUMN show_when JSONB;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'add_on_sub_options' AND column_name = 'affects_pricing'
        ) THEN
          ALTER TABLE add_on_sub_options ADD COLUMN affects_pricing BOOLEAN DEFAULT false;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'add_on_sub_options' AND column_name = 'tooltip'
        ) THEN
          ALTER TABLE add_on_sub_options ADD COLUMN tooltip TEXT;
        END IF;
      END $$;
    `);

    // Insert the design_sides sub-option
    const insertResult = await query(`
      INSERT INTO add_on_sub_options (
        add_on_id,
        field_name,
        field_label,
        field_type,
        options,
        default_value,
        is_required,
        display_order,
        show_when,
        affects_pricing,
        tooltip
      )
      SELECT
        1,
        'design_sides',
        'How many sides need design?',
        'select',
        '{"options": [{"value": "one", "label": "One Side"}, {"value": "two", "label": "Two Sides"}]}'::jsonb,
        'one',
        true,
        1,
        '{"choiceRequiresSides": true}'::jsonb,
        true,
        'Select how many sides you need designed. Two-sided design costs more.'
      WHERE NOT EXISTS (
        SELECT 1 FROM add_on_sub_options
        WHERE add_on_id = 1 AND field_name = 'design_sides'
      )
      RETURNING id;
    `);

    // Check current sub-options
    const currentSubOptions = await query(`
      SELECT * FROM add_on_sub_options WHERE add_on_id = 1 ORDER BY display_order
    `);

    return NextResponse.json({
      success: true,
      message: 'Migration 029_design_addon_sub_options completed',
      inserted: insertResult.rows,
      currentSubOptions: currentSubOptions.rows,
    });
  } catch (error: any) {
    console.error('[Migration API] Error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
