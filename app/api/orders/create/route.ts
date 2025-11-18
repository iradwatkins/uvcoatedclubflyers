import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Cart } from '@/lib/cart';
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email/send';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
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

    // Link uploaded files to order items
    if (order.orderItems && order.orderItems.length > 0) {
      for (let i = 0; i < cart.items.length; i++) {
        const cartItem = cart.items[i];
        const orderItem = order.orderItems[i];

        if (cartItem.uploadedFiles && cartItem.uploadedFiles.length > 0 && orderItem) {
          // Update each file to link it to this order item
          for (const fileId of cartItem.uploadedFiles) {
            try {
              await prisma.$executeRaw`
                UPDATE files
                SET order_item_id = ${orderItem.id}
                WHERE id = ${fileId}
              `;
            } catch (fileError) {
              console.error(`Failed to link file ${fileId} to order item ${orderItem.id}:`, fileError);
              // Don't fail the entire order if file linking fails
            }
          }
        }
      }
    }

    // Send confirmation email to customer
    if (session?.user?.email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        await sendOrderConfirmation({
          to: session.user.email,
          orderNumber: order.orderNumber,
          customerName: session.user.name || 'Customer',
          items: cart.items.map(item => ({
            productName: item.productName || 'Product',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.price,
            configuration: item.options,
          })),
          subtotal,
          tax: taxAmount,
          shippingCost,
          total: totalAmount,
          shippingAddress: shippingAddress || { address: '', city: '', state: '', zipCode: '' },
          orderUrl: `${baseUrl}/dashboard/orders/${order.id}`,
        });
      } catch (emailError) {
        console.error('Failed to send customer confirmation email:', emailError);
        // Don't fail the order if email fails
      }
    }

    // Send notification to admin
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      await sendAdminOrderNotification({
        orderNumber: order.orderNumber,
        customerName: session?.user?.name || 'Guest',
        customerEmail: session?.user?.email || 'N/A',
        itemCount: cart.items.length,
        total: totalAmount,
        paymentMethod,
        orderUrl: `${baseUrl}/admin/orders/${order.id}`,
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the order if email fails
    }

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
