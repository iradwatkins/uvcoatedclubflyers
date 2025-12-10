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

    if (migrationName === '029_fix_design_choice_pricing') {
      // Fix design choice pricing to correct flat amounts
      await query(`
        -- Update Standard Custom Design to $125 flat (no sides selection)
        UPDATE add_on_choices
        SET price_type = 'flat',
            base_price = 125,
            requires_sides_selection = false,
            sides_pricing = NULL,
            updated_at = NOW()
        WHERE add_on_id = 1 AND value = 'standard-custom-design';
      `);

      await query(`
        -- Update Rush Custom Design to $150 flat (no sides selection)
        UPDATE add_on_choices
        SET price_type = 'flat',
            base_price = 150,
            requires_sides_selection = false,
            sides_pricing = NULL,
            updated_at = NOW()
        WHERE add_on_id = 1 AND value = 'rush-custom-design';
      `);

      await query(`
        -- Update Design Changes - Minor to $35 flat
        UPDATE add_on_choices
        SET base_price = 35,
            updated_at = NOW()
        WHERE add_on_id = 1 AND value = 'design-changes-minor';
      `);

      await query(`
        -- Update Design Changes - Major to $50 flat
        UPDATE add_on_choices
        SET base_price = 50,
            updated_at = NOW()
        WHERE add_on_id = 1 AND value = 'design-changes-major';
      `);

      // Verify the updates
      const verifyResult = await query(`
        SELECT value, label, price_type, base_price, requires_sides_selection
        FROM add_on_choices
        WHERE add_on_id = 1
        ORDER BY display_order
      `);

      return NextResponse.json({
        success: true,
        message: 'Design choice pricing updated successfully',
        choices: verifyResult.rows,
      });
    }

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

    if (migrationName === '030_add_color_critical_addon') {
      // Add Color Critical addon
      const insertResult = await query(`
        INSERT INTO add_ons (
          name,
          slug,
          description,
          pricing_model,
          base_price,
          per_unit_price,
          percentage,
          ui_component,
          position,
          display_order,
          is_mandatory_default,
          is_enabled_default,
          turnaround_days_add,
          is_active
        )
        VALUES (
          'Color Critical',
          'color-critical',
          'Production time dependent on approval of color proof. Because of limitations with the gang run printing process, the accuracy of color reproduction is not guaranteed. Only select this option if you are looking for a specific color match custom run with proofs that will not gang up with other jobs.',
          'CUSTOM',
          0,
          0,
          0,
          'checkbox',
          'below_upload',
          23,
          false,
          true,
          0,
          true
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          is_active = true
        RETURNING *;
      `);

      return NextResponse.json({
        success: true,
        message: 'Color Critical addon created successfully',
        addon: insertResult.rows[0],
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
