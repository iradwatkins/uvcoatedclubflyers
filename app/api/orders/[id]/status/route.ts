import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendOrderStatusUpdate } from '@/lib/email/send';

const VALID_STATUSES = [
  'PENDING',
  'PENDING_PAYMENT',
  'PROCESSING',
  'PRINTING',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
];

const STATUS_MESSAGES: Record<string, string> = {
  PENDING: 'Your order has been received and is waiting to be processed.',
  PENDING_PAYMENT: 'We are waiting for your payment to be confirmed.',
  PROCESSING: 'Your order is being prepared for printing.',
  PRINTING: 'Your flyers are currently being printed.',
  SHIPPED: 'Your order has been shipped and is on its way to you!',
  COMPLETED: 'Your order has been completed and delivered.',
  CANCELLED: 'This order has been cancelled.',
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    // Only admins can update order status
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const { id } = await params;

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch the current order with user info
    const order = await prisma.order.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status
    const orderId = parseInt(id);
    const completedAt = status === 'COMPLETED' ? new Date() : order.completedAt;

    await prisma.$executeRaw`
      UPDATE orders
      SET
        status = ${status.toLowerCase()},
        completed_at = ${completedAt},
        updated_at = NOW()
      WHERE id = ${orderId}
    `;

    // Create updatedOrder object manually
    const updatedOrder = {
      ...order,
      status,
      completedAt,
      updatedAt: new Date(),
    };

    // Send status update email to customer
    if (order.user?.email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        await sendOrderStatusUpdate({
          to: order.user.email,
          customerName: order.user.name || 'Customer',
          orderNumber: order.orderNumber,
          newStatus: status.replace('_', ' '),
          statusMessage: STATUS_MESSAGES[status] || 'Your order status has been updated.',
          orderUrl: `${baseUrl}/dashboard/orders/${order.id}`,
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the status update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
