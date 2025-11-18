import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/payment-methods - List all saved payment methods for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      paymentMethods: paymentMethods.map((pm) => ({
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
        updatedAt: pm.updated_at,
      })),
    });
  } catch (error) {
    console.error('Fetch payment methods error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}

// POST /api/payment-methods - Save a new payment method
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      provider,
      providerCustomerId,
      paymentToken,
      cardBrand,
      lastFour,
      expiryMonth,
      expiryYear,
      cardholderName,
      isDefault = false,
      metadata = null,
    } = body;

    // Validate required fields
    if (!provider || !paymentToken) {
      return NextResponse.json(
        { error: 'Provider and payment token are required' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['square', 'paypal'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "square" or "paypal"' },
        { status: 400 }
      );
    }

    // Insert the new payment method
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO saved_payment_methods (
        user_id,
        provider,
        provider_customer_id,
        payment_token,
        card_brand,
        last_four,
        expiry_month,
        expiry_year,
        cardholder_name,
        is_default,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${parseInt(session.user.id)},
        ${provider},
        ${providerCustomerId || null},
        ${paymentToken},
        ${cardBrand || null},
        ${lastFour || null},
        ${expiryMonth || null},
        ${expiryYear || null},
        ${cardholderName || null},
        ${isDefault},
        ${metadata ? JSON.stringify(metadata) : null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const paymentMethod = result[0];

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
    console.error('Save payment method error:', error);
    return NextResponse.json({ error: 'Failed to save payment method' }, { status: 500 });
  }
}
