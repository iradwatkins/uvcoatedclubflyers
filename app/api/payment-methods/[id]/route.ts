import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH /api/payment-methods/[id] - Update a payment method (e.g., set as default)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const paymentMethodId = parseInt(id);

    if (isNaN(paymentMethodId)) {
      return NextResponse.json({ error: 'Invalid payment method ID' }, { status: 400 });
    }

    const body = await request.json();
    const { isDefault } = body;

    // Verify the payment method belongs to the current user
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM saved_payment_methods
      WHERE id = ${paymentMethodId}
        AND user_id = ${parseInt(session.user.id)}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Update the payment method
    await prisma.$executeRaw`
      UPDATE saved_payment_methods
      SET is_default = ${isDefault},
          updated_at = NOW()
      WHERE id = ${paymentMethodId}
    `;

    // Fetch the updated payment method
    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM saved_payment_methods
      WHERE id = ${paymentMethodId}
    `;

    const paymentMethod = updated[0];

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        userId: paymentMethod.user_id,
        provider: paymentMethod.provider,
        providerCustomerId: paymentMethod.provider_customer_id,
        cardBrand: paymentMethod.card_brand,
        lastFour: paymentMethod.last_four,
        expiryMonth: paymentMethod.expiry_month,
        expiryYear: paymentMethod.expiry_year,
        cardholderName: paymentMethod.cardholder_name,
        isDefault: paymentMethod.is_default,
        isExpired: paymentMethod.is_expired,
        createdAt: paymentMethod.created_at,
        updatedAt: paymentMethod.updated_at,
      },
    });
  } catch (error) {
    console.error('Update payment method error:', error);
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
}

// DELETE /api/payment-methods/[id] - Remove a saved payment method
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const paymentMethodId = parseInt(id);

    if (isNaN(paymentMethodId)) {
      return NextResponse.json({ error: 'Invalid payment method ID' }, { status: 400 });
    }

    // Verify the payment method belongs to the current user
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM saved_payment_methods
      WHERE id = ${paymentMethodId}
        AND user_id = ${parseInt(session.user.id)}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Delete the payment method
    await prisma.$executeRaw`
      DELETE FROM saved_payment_methods
      WHERE id = ${paymentMethodId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
  }
}
