import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;

    await prisma.$executeRaw`
      DELETE FROM product_favorites
      WHERE user_id = ${parseInt(session.user.id)}
      AND product_id = ${parseInt(productId)}
    `;

    return NextResponse.json({
      success: true,
      message: 'Product removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
