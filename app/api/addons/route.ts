import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

// GET - List all addons with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const position = searchParams.get('position') || ''; // above_upload or below_upload
    const isActive = searchParams.get('is_active'); // true, false, or null for all
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (position) {
      whereConditions.push(`position = $${paramIndex}`);
      params.push(position);
      paramIndex++;
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      whereConditions.push(`is_active = $${paramIndex}`);
      params.push(isActive === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM add_ons
      ${whereClause}
    `;
    const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery, ...params);
    const total = Number(countResult[0].total);

    // Get addons with sub-options count
    const addonsQuery = `
      SELECT
        a.*,
        COUNT(DISTINCT aso.id) as sub_options_count,
        COUNT(DISTINCT pa.id) as product_count
      FROM add_ons a
      LEFT JOIN add_on_sub_options aso ON a.id = aso.add_on_id
      LEFT JOIN product_addons pa ON a.id = pa.addon_id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.display_order ASC, a.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const addons = await prisma.$queryRawUnsafe<any[]>(
      addonsQuery,
      ...params,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: {
        addons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('List addons error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}

// POST - Create new addon
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Validation
    if (!name || !pricingModel || !uiComponent || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = generateSlug(name);

    // Check if name or slug already exists
    const existingCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM add_ons
      WHERE name = ${name} OR slug = ${slug}
      LIMIT 1
    `;

    if (existingCheck.length > 0) {
      return NextResponse.json(
        { error: 'An addon with this name already exists' },
        { status: 400 }
      );
    }

    // Validate pricing based on model
    if (pricingModel === 'FLAT' && (!basePrice && basePrice !== 0)) {
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
    if (pricingModel === 'CUSTOM' && (!basePrice && basePrice !== 0) && !perUnitPrice) {
      return NextResponse.json(
        { error: 'At least one price field is required for CUSTOM pricing model' },
        { status: 400 }
      );
    }

    // Insert addon
    const insertResult = await prisma.$queryRaw<any[]>`
      INSERT INTO add_ons (
        name,
        slug,
        description,
        tooltip_text,
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
        is_active,
        admin_notes,
        created_at,
        updated_at
      ) VALUES (
        ${name},
        ${slug},
        ${description || null},
        ${tooltipText || null},
        ${pricingModel},
        ${basePrice || null},
        ${perUnitPrice || null},
        ${percentage || null},
        ${uiComponent},
        ${position},
        ${displayOrder || 0},
        ${isMandatoryDefault || false},
        ${isEnabledDefault || false},
        ${turnaroundDaysAdd || 0},
        ${isActive !== false}, -- Default to true
        ${adminNotes || null},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    const addonId = insertResult[0]?.id;

    if (!addonId) {
      throw new Error('Failed to get addon ID after insertion');
    }

    // Insert sub-options if provided
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

    // Fetch the created addon with sub-options
    const createdAddon = await prisma.$queryRaw<any[]>`
      SELECT * FROM add_ons WHERE id = ${addonId}
    `;

    const createdSubOptions = await prisma.$queryRaw<any[]>`
      SELECT * FROM add_on_sub_options
      WHERE add_on_id = ${addonId}
      ORDER BY display_order
    `;

    return NextResponse.json({
      success: true,
      data: {
        addon: createdAddon[0],
        subOptions: createdSubOptions,
      },
    });
  } catch (error) {
    console.error('Create addon error:', error);
    return NextResponse.json(
      { error: 'Failed to create addon' },
      { status: 500 }
    );
  }
}
