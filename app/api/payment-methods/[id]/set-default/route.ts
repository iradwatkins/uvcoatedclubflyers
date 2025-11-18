import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH /api/payment-methods/[id]/set-default - Set a payment method as the default
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const paymentMethodId = parseInt(id);

    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    // Verify the payment method belongs to the current user
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM saved_payment_methods
      WHERE id = ${paymentMethodId}
        AND user_id = ${parseInt(session.user.id)}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Set this payment method as default
    // The database trigger will automatically unset other defaults
    await prisma.$executeRaw`
      UPDATE saved_payment_methods
      SET is_default = true,
          updated_at = NOW()
      WHERE id = ${paymentMethodId}
    `;

    // Fetch all payment methods to return updated list
    const paymentMethods = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        user_id,
        provider,
        provider_customer_id,
        card_brand,
        last_four,
        expiry_month,
        expiry_year,
        cardholder_name,
        is_default,
        is_expired,
        created_at,
        updated_at
      FROM saved_payment_methods
      WHERE user_id = ${parseInt(session.user.id)}
      ORDER BY is_default DESC, created_at DESC
    `;

    return NextResponse.json({
      success: true,
      paymentMethods: paymentMethods.map(pm => ({
        id: pm.id,
        userId: pm.user_id,
        provider: pm.provider,
        providerCustomerId: pm.provider_customer_id,
        cardBrand: pm.card_brand,
        lastFour: pm.last_four,
        expiryMonth: pm.expiry_month,
        expiryYear: pm.expiry_year,
        cardholderName: pm.cardholder_name,
        isDefault: pm.is_default,
        isExpired: pm.is_expired,
        createdAt: pm.created_at,
        updatedAt: pm.updated_at
      }))
    });
  } catch (error) {
    console.error('Set default payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to set default payment method' },
      { status: 500 }
    );
  }
}
