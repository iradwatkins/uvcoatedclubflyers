import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createOrUpdateSquareCustomer, saveCardOnFile } from '@/lib/square';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/user/payment-methods
 * Save a new payment method (card) to the user's account
 *
 * This endpoint:
 * 1. Creates/updates Square customer record
 * 2. Saves the card via Square Card on File API
 * 3. Stores the card reference in our database
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, nickname, isDefault = false, cardholderName, billingAddress } = body;

    if (!sourceId) {
      return NextResponse.json({ error: 'Missing payment source' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Step 1: Create or update Square customer
    const squareCustomer = await createOrUpdateSquareCustomer(
      session.user.email!,
      session.user.name || undefined
    );

    if (!squareCustomer.id) {
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    // Step 2: Save card to Square using Card on File API
    const savedCard = await saveCardOnFile({
      customerId: squareCustomer.id,
      sourceId: sourceId,
      cardholderName: cardholderName,
      billingAddress: billingAddress
        ? {
            addressLine1: billingAddress.addressLine1,
            addressLine2: billingAddress.addressLine2,
            locality: billingAddress.city,
            administrativeDistrictLevel1: billingAddress.state,
            postalCode: billingAddress.postalCode,
            country: billingAddress.country || 'US',
          }
        : undefined,
    });

    // Step 3: Save to our database
    const paymentMethodId = await prisma.$queryRaw<any[]>`
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
      )
      VALUES (
        ${userId},
        'square',
        ${squareCustomer.id},
        ${savedCard.id},
        ${savedCard.cardBrand.toLowerCase()},
        ${savedCard.last4},
        ${savedCard.expMonth},
        ${savedCard.expYear},
        ${cardholderName || null},
        ${isDefault},
        ${JSON.stringify({ nickname: nickname || null })},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    const newPaymentMethodId = paymentMethodId[0]?.id;

    // If this is the default, update user's default payment method
    if (isDefault && newPaymentMethodId) {
      await prisma.$executeRaw`
        UPDATE users
        SET default_payment_method_id = ${newPaymentMethodId}
        WHERE id = ${userId}
      `;
    }

    // Return the saved payment method
    const savedPaymentMethod = await prisma.$queryRaw<any[]>`
      SELECT
        id,
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
        is_expired,
        metadata,
        created_at,
        updated_at
      FROM saved_payment_methods
      WHERE id = ${newPaymentMethodId}
    `;

    const method = savedPaymentMethod[0];

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: method.id,
        userId: method.user_id,
        provider: method.provider,
        providerCustomerId: method.provider_customer_id,
        cardBrand: method.card_brand,
        lastFour: method.last_four,
        expiryMonth: method.expiry_month,
        expiryYear: method.expiry_year,
        cardholderName: method.cardholder_name,
        isDefault: method.is_default,
        isExpired: method.is_expired,
        createdAt: method.created_at,
        updatedAt: method.updated_at,
      },
    });
  } catch (error: any) {
    console.error('[Save Payment Method] Error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to save payment method',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
