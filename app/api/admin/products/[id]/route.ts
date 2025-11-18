import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);
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
      quantities,
      sizes,
      availablePaperStocks,
      availableTurnarounds,
    } = data;

    // Validation
    if (!name || basePrice === undefined) {
      return NextResponse.json(
        { error: 'Name and base price are required' },
        { status: 400 }
      );
    }

    if (basePrice < 0) {
      return NextResponse.json(
        { error: 'Base price must be positive' },
        { status: 400 }
      );
    }

    // Update product
    // Note: products table uses 'status' ('active'/'draft'/'archived') not 'is_active'
    const status = isActive ? 'active' : 'draft';

    await prisma.$executeRaw`
      UPDATE products
      SET
        name = ${name},
        description = ${description || null},
        base_price = ${basePrice},
        sku = ${sku || null},
        image_url = ${imageUrl || null},
        image_url_2 = ${imageUrl2 || null},
        image_url_3 = ${imageUrl3 || null},
        image_url_4 = ${imageUrl4 || null},
        status = ${status},
        is_featured = ${isFeatured || false},
        category_id = ${categoryId || null},
        quantities = ${quantities || '25,50,100,250,500,1000,2500,5000'},
        sizes = ${sizes || '4x6,5x7,6x9,8.5x11'},
        available_paper_stocks = ${JSON.stringify(availablePaperStocks || [])}::jsonb,
        available_turnarounds = ${JSON.stringify(availableTurnarounds || [])}::jsonb,
        updated_at = NOW()
      WHERE id = ${productId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    // Check if product has orders
    const orderCount = await prisma.orderItem.count({
      where: { productId },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing orders. Consider archiving instead.' },
        { status: 400 }
      );
    }

    // Delete product (will cascade delete options)
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
