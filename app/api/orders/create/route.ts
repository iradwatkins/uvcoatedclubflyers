import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Cart } from '@/lib/cart';
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email/send';
import { markCartRecovered } from '@/lib/abandoned-cart';

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
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For cash payments, paymentId is not required
    if (paymentMethod !== 'cash' && !paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required for non-cash payments' },
        { status: 400 }
      );
    }

    // Calculate total with shipping and tax
    // Cart prices are in dollars, convert to cents for database storage
    const subtotalCents = Math.round(cart.total * 100);
    const shippingCostCents = shipping ? Math.round(shipping.cost * 100) : 0;
    const taxAmountCents = Math.round((subtotalCents + shippingCostCents) * 0.0875);
    const totalAmountCents = providedTotal || subtotalCents + shippingCostCents + taxAmountCents;

    // Create order in database - pass data in format expected by prisma layer
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id,
        status: paymentMethod === 'cash' ? 'pending_payment' : 'pending',
        subtotal: subtotalCents,
        taxAmount: taxAmountCents,
        totalAmount: totalAmountCents,
        transactionId: paymentId || null,
        paymentMethod,
        paymentStatus: paymentStatus === 'COMPLETED' ? 'paid' : 'unpaid',
        // Pass billing and shipping info as objects for prisma layer to process
        billingInfo: billingInfo || null,
        shippingAddress: shippingAddress ? {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          address: shippingAddress.street,
          address2: shippingAddress.street2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country || 'US',
        } : null,
        // Shipping method
        shippingCarrier: shipping?.carrier || null,
        shippingService: shipping?.service || null,
        shippingRateAmount: shippingCostCents || null,
        pickupAirportId: airportId || null,
        orderItems: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.productName || 'Product',
            quantity: item.quantity,
            unitPrice: Math.round(item.unitPrice * 100),
            totalPrice: Math.round(item.price * 100),
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
              console.error(
                `Failed to link file ${fileId} to order item ${orderItem.id}:`,
                fileError
              );
              // Don't fail the entire order if file linking fails
            }
          }
        }
      }
    }

    // Send confirmation email to customer (use billing email, fallback to session email)
    const customerEmail = billingInfo?.email || session?.user?.email;
    const customerName = billingInfo?.firstName
      ? `${billingInfo.firstName} ${billingInfo.lastName || ''}`.trim()
      : session?.user?.name || 'Customer';

    if (customerEmail) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        await sendOrderConfirmation({
          to: customerEmail,
          orderNumber: order.orderNumber,
          customerName,
          items: cart.items.map((item) => ({
            productName: item.productName || 'Product',
            quantity: item.quantity,
            unitPrice: Math.round(item.unitPrice * 100),
            totalPrice: Math.round(item.price * 100),
            configuration: item.options,
          })),
          subtotal: subtotalCents,
          tax: taxAmountCents,
          shippingCost: shippingCostCents,
          total: totalAmountCents,
          shippingAddress: shippingAddress ? {
            address: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
          } : { address: '', city: '', state: '', zipCode: '' },
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
        customerName,
        customerEmail: customerEmail || 'N/A',
        itemCount: cart.items.length,
        total: totalAmountCents,
        paymentMethod,
        orderUrl: `${baseUrl}/admin/orders/${order.id}`,
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the order if email fails
    }

    // Mark abandoned cart as recovered
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get('cart_session')?.value;
      if (sessionId) {
        await markCartRecovered(sessionId, order.id);
      }
    } catch (recoveryError) {
      console.error('Failed to mark cart as recovered:', recoveryError);
      // Don't fail the order if this fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
