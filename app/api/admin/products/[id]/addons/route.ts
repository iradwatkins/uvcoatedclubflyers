import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch assigned add-ons for a product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    // Get all add-ons with assignment status for this product
    const allAddOns = await prisma.$queryRaw`
      SELECT
        a.*,
        pa.product_id as assignment_id,
        pa.is_enabled as is_default,
        pa.display_order,
        CASE WHEN pa.product_id IS NOT NULL THEN true ELSE false END as is_assigned
      FROM add_ons a
      LEFT JOIN product_add_ons pa ON a.id = pa.add_on_id AND pa.product_id = ${productId}
      WHERE a.is_active = true
      ORDER BY
        CASE WHEN pa.product_id IS NOT NULL THEN pa.display_order ELSE a.display_order END,
        a.id
    `;

    return NextResponse.json({
      success: true,
      addOns: allAddOns,
    });
  } catch (error) {
    console.error('Get product add-ons error:', error);
    return NextResponse.json({ error: 'Failed to fetch product add-ons' }, { status: 500 });
  }
}

// POST - Assign add-ons to product
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const { addOnIds } = await request.json();

    if (!Array.isArray(addOnIds)) {
      return NextResponse.json({ error: 'addOnIds must be an array' }, { status: 400 });
    }

    // Delete existing assignments
    await prisma.$executeRaw`
      DELETE FROM product_add_ons WHERE product_id = ${productId}
    `;

    // Insert new assignments
    if (addOnIds.length > 0) {
      const values = addOnIds
        .map((addOnId, index) => {
          // Determine position based on addon slug (Design goes above_upload, others below)
          const position = addOnId === 1 ? 'above_upload' : 'below_upload';
          return `(${productId}, ${addOnId}, '${position}', false, true, ${index + 1})`;
        })
        .join(', ');

      await prisma.$executeRawUnsafe(`
        INSERT INTO product_add_ons (product_id, add_on_id, position, is_mandatory, is_enabled, display_order)
        VALUES ${values}
      `);
    }

    return NextResponse.json({
      success: true,
      message: 'Add-ons assigned successfully',
    });
  } catch (error) {
    console.error('Assign add-ons error:', error);
    return NextResponse.json({ error: 'Failed to assign add-ons' }, { status: 500 });
  }
}
