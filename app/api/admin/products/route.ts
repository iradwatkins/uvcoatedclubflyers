import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const {
      name,
      description,
      basePrice,
      sku,
      imageUrl,
      imageUrl2,
      imageUrl3,
      imageUrl4,
      isActive,
      isFeatured,
      categoryId,
      options,
    } = data;

    // Validation
    if (!name || basePrice === undefined) {
      return NextResponse.json({ error: 'Name and base price are required' }, { status: 400 });
    }

    if (basePrice < 0) {
      return NextResponse.json({ error: 'Base price must be positive' }, { status: 400 });
    }

    // Check if SKU already exists
    if (sku) {
      const existingSku = await prisma.$queryRaw<any[]>`
        SELECT id FROM products WHERE sku = ${sku}
      `;

      if (existingSku.length > 0) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
      }
    }

    // Create product
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO products (
        name,
        description,
        base_price,
        sku,
        image_url,
        image_url_2,
        image_url_3,
        image_url_4,
        is_active,
        is_featured,
        category_id,
        created_at,
        updated_at
      ) VALUES (
        ${name},
        ${description || null},
        ${basePrice},
        ${sku || null},
        ${imageUrl || null},
        ${imageUrl2 || null},
        ${imageUrl3 || null},
        ${imageUrl4 || null},
        ${isActive},
        ${isFeatured},
        ${categoryId || null},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    const productId = result[0]?.id;

    if (!productId) {
      throw new Error('Failed to get product ID');
    }

    // Insert product options if provided
    if (options && Array.isArray(options)) {
      for (const option of options) {
        if (option.option_name && option.option_value) {
          await prisma.$executeRaw`
            INSERT INTO product_options (
              product_id,
              option_type,
              option_name,
              option_value,
              price_modifier,
              is_default,
              sort_order
            ) VALUES (
              ${productId},
              ${option.option_type},
              ${option.option_name},
              ${option.option_value},
              ${option.price_modifier || 0},
              ${option.is_default || false},
              ${option.sort_order || 0}
            )
          `;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      productId,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
