import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Cart } from '@/lib/cart';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const {
      orderNumber,
      paymentId,
      paymentMethod = 'card',
      paymentStatus = 'COMPLETED',
      billingInfo,
      cart,
      totalAmount: providedTotal,
      shippingAddress,
      shipping,
      airportId,
    } = body as {
      orderNumber: string;
      paymentId?: string;
      paymentMethod?: string;
      paymentStatus?: string;
      billingInfo?: any;
      cart?: Cart;
      totalAmount?: number;
      shippingAddress?: any;
      shipping?: any;
      airportId?: string;
    };

    if (!orderNumber || !cart) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For cash payments, paymentId is not required
    if (paymentMethod !== 'cash' && !paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required for non-cash payments' },
        { status: 400 }
      );
    }

    // Calculate total with shipping and tax
    const subtotal = cart.total;
    const shippingCost = shipping ? Math.round(shipping.cost * 100) : 0;
    const taxAmount = Math.round((subtotal + shippingCost) * 0.0875);
    const totalAmount = providedTotal || subtotal + shippingCost + taxAmount;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id,
        status: paymentMethod === 'cash' ? 'PENDING_PAYMENT' : 'PENDING',
        subtotal,
        taxAmount,
        totalAmount,
        paymentId: paymentId || null,
        paymentMethod,
        paymentStatus,
        billingInfo: billingInfo || null,
        shippingAddress: shippingAddress || null,
        shippingCarrier: shipping?.carrier || null,
        shippingService: shipping?.service || null,
        shippingRateAmount: shippingCost || null,
        pickupAirportId: airportId || null,
        orderItems: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.price,
            options: item.options as any,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    // TODO: Send confirmation email
    // TODO: Notify admin of new order

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
