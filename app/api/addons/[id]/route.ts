import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// GET - Fetch single addon with sub-options
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const addonId = parseInt(id);

    // Get addon
    const addon = await prisma.$queryRaw<any[]>`
      SELECT * FROM add_ons WHERE id = ${addonId}
    `;

    if (addon.length === 0) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Get sub-options
    const subOptions = await prisma.$queryRaw<any[]>`
      SELECT * FROM add_on_sub_options
      WHERE add_on_id = ${addonId}
      ORDER BY display_order
    `;

    // Get usage stats
    const usageStats = await prisma.$queryRaw<any[]>`
      SELECT
        COUNT(DISTINCT pa.product_id) as product_count
      FROM product_addons pa
      WHERE pa.addon_id = ${addonId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        addon: addon[0],
        subOptions,
        usageStats: usageStats[0] || { product_count: 0 },
      },
    });
  } catch (error) {
    console.error('Get addon error:', error);
    return NextResponse.json({ error: 'Failed to fetch addon' }, { status: 500 });
  }
}

// PUT - Update addon
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const addonId = parseInt(id);

    const body = await request.json();
    const {
      name,
      description,
      tooltipText,
      pricingModel,
      basePrice,
      perUnitPrice,
      percentage,
      uiComponent,
      position,
      displayOrder,
      isMandatoryDefault,
      isEnabledDefault,
      turnaroundDaysAdd,
      isActive,
      adminNotes,
      subOptions,
    } = body;

    // Check if addon exists
    const existingAddon = await prisma.$queryRaw<any[]>`
      SELECT * FROM add_ons WHERE id = ${addonId}
    `;

    if (existingAddon.length === 0) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Validation
    if (!name || !pricingModel || !uiComponent || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate slug from name
    const slug = generateSlug(name);

    // Check if name or slug conflicts with another addon
    const conflictCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM add_ons
      WHERE (name = ${name} OR slug = ${slug})
        AND id != ${addonId}
      LIMIT 1
    `;

    if (conflictCheck.length > 0) {
      return NextResponse.json(
        { error: 'An addon with this name already exists' },
        { status: 400 }
      );
    }

    // Validate pricing based on model
    if (pricingModel === 'FLAT' && !basePrice && basePrice !== 0) {
      return NextResponse.json(
        { error: 'Base price is required for FLAT pricing model' },
        { status: 400 }
      );
    }
    if (pricingModel === 'PER_UNIT' && !perUnitPrice) {
      return NextResponse.json(
        { error: 'Per unit price is required for PER_UNIT pricing model' },
        { status: 400 }
      );
    }
    if (pricingModel === 'PERCENTAGE' && percentage === undefined) {
      return NextResponse.json(
        { error: 'Percentage is required for PERCENTAGE pricing model' },
        { status: 400 }
      );
    }
    if (pricingModel === 'CUSTOM' && !basePrice && basePrice !== 0 && !perUnitPrice) {
      return NextResponse.json(
        { error: 'At least one price field is required for CUSTOM pricing model' },
        { status: 400 }
      );
    }

    // Update addon
    await prisma.$queryRaw`
      UPDATE add_ons
      SET
        name = ${name},
        slug = ${slug},
        description = ${description || null},
        tooltip_text = ${tooltipText || null},
        pricing_model = ${pricingModel},
        base_price = ${basePrice || null},
        per_unit_price = ${perUnitPrice || null},
        percentage = ${percentage || null},
        ui_component = ${uiComponent},
        position = ${position},
        display_order = ${displayOrder || 0},
        is_mandatory_default = ${isMandatoryDefault || false},
        is_enabled_default = ${isEnabledDefault || false},
        turnaround_days_add = ${turnaroundDaysAdd || 0},
        is_active = ${isActive !== false},
        admin_notes = ${adminNotes || null},
        updated_at = NOW()
      WHERE id = ${addonId}
    `;

    // Update sub-options - delete existing and insert new
    await prisma.$queryRaw`
      DELETE FROM add_on_sub_options WHERE add_on_id = ${addonId}
    `;

    if (subOptions && Array.isArray(subOptions) && subOptions.length > 0) {
      for (const subOption of subOptions) {
        await prisma.$queryRaw`
          INSERT INTO add_on_sub_options (
            add_on_id,
            field_name,
            field_label,
            field_type,
            options,
            default_value,
            is_required,
            min_value,
            max_value,
            pattern,
            display_order,
            created_at,
            updated_at
          ) VALUES (
            ${addonId},
            ${subOption.fieldName},
            ${subOption.fieldLabel},
            ${subOption.fieldType},
            ${subOption.options ? JSON.stringify(subOption.options) : null},
            ${subOption.defaultValue || null},
            ${subOption.isRequired || false},
            ${subOption.minValue || null},
            ${subOption.maxValue || null},
            ${subOption.pattern || null},
            ${subOption.displayOrder || 0},
            NOW(),
            NOW()
          )
        `;
      }
    }

    // Fetch updated addon with sub-options
    const updatedAddon = await prisma.$queryRaw<any[]>`
      SELECT * FROM add_ons WHERE id = ${addonId}
    `;

    const updatedSubOptions = await prisma.$queryRaw<any[]>`
      SELECT * FROM add_on_sub_options
      WHERE add_on_id = ${addonId}
      ORDER BY display_order
    `;

    return NextResponse.json({
      success: true,
      data: {
        addon: updatedAddon[0],
        subOptions: updatedSubOptions,
      },
    });
  } catch (error) {
    console.error('Update addon error:', error);
    return NextResponse.json({ error: 'Failed to update addon' }, { status: 500 });
  }
}

// DELETE - Delete addon (with usage check)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const addonId = parseInt(id);

    // Check if addon exists
    const addon = await prisma.$queryRaw<any[]>`
      SELECT * FROM add_ons WHERE id = ${addonId}
    `;

    if (addon.length === 0) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Check if addon is in use
    const productUsage = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM product_addons WHERE addon_id = ${addonId}
    `;

    if (productUsage[0].count > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete addon',
          message: `This addon is currently assigned to ${productUsage[0].count} product(s). Please remove it from all products before deleting.`,
          inUse: true,
          usageCount: Number(productUsage[0].count),
        },
        { status: 400 }
      );
    }

    // Delete sub-options first (cascade)
    await prisma.$queryRaw`
      DELETE FROM add_on_sub_options WHERE add_on_id = ${addonId}
    `;

    // Delete addon
    await prisma.$queryRaw`
      DELETE FROM add_ons WHERE id = ${addonId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Addon deleted successfully',
    });
  } catch (error) {
    console.error('Delete addon error:', error);
    return NextResponse.json({ error: 'Failed to delete addon' }, { status: 500 });
  }
}

// PATCH - Toggle addon active status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const addonId = parseInt(id);

    const body = await request.json();
    const { isActive } = body;

    if (isActive === undefined) {
      return NextResponse.json({ error: 'isActive field is required' }, { status: 400 });
    }

    // Check if addon exists
    const addon = await prisma.$queryRaw<any[]>`
      SELECT * FROM add_ons WHERE id = ${addonId}
    `;

    if (addon.length === 0) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Update status
    await prisma.$queryRaw`
      UPDATE add_ons
      SET is_active = ${isActive}, updated_at = NOW()
      WHERE id = ${addonId}
    `;

    return NextResponse.json({
      success: true,
      message: `Addon ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Toggle addon status error:', error);
    return NextResponse.json({ error: 'Failed to update addon status' }, { status: 500 });
  }
}
