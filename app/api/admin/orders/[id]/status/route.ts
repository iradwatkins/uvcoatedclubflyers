import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const { id } = await params;
    const orderId = parseInt(id);

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Valid production statuses
    const validStatuses = [
      'pending',
      'processing',
      'printing',
      'quality_check',
      'ready_to_ship',
      'shipped',
      'completed',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update order status
    await prisma.$executeRaw`
      UPDATE orders
      SET
        status = ${status},
        updated_at = NOW()
      WHERE id = ${orderId}
    `;

    // If order is shipped, update shipped_at timestamp
    if (status === 'shipped') {
      await prisma.$executeRaw`
        UPDATE orders
        SET shipped_at = NOW()
        WHERE id = ${orderId}
      `;
    }

    // If order is completed, update completed_at timestamp
    if (status === 'completed') {
      await prisma.$executeRaw`
        UPDATE orders
        SET
          completed_at = NOW(),
          shipped_at = COALESCE(shipped_at, NOW())
        WHERE id = ${orderId}
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
