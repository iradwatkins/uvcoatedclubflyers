import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.$queryRaw`
      SELECT pf.id, pf.created_at, p.*
      FROM product_favorites pf
      INNER JOIN products p ON pf.product_id = p.id
      WHERE pf.user_id = ${parseInt(session.user.id)}
      ORDER BY pf.created_at DESC
    `;

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Add to favorites (ignore if already exists)
    await prisma.$executeRaw`
      INSERT INTO product_favorites (user_id, product_id, created_at)
      VALUES (${parseInt(session.user.id)}, ${productId}, NOW())
      ON CONFLICT (user_id, product_id) DO NOTHING
    `;

    return NextResponse.json({
      success: true,
      message: 'Product added to favorites',
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}
