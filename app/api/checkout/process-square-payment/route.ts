import { type NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { createOrUpdateSquareCustomer, saveCardOnFile, chargeCardOnFile } from '@/lib/square';
import { prisma } from '@/lib/prisma';

// Validate environment variables on startup
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;

if (!SQUARE_ACCESS_TOKEN) {
  console.error('[Square] CRITICAL: SQUARE_ACCESS_TOKEN is not set!');
}
if (!SQUARE_LOCATION_ID) {
  console.error('[Square] CRITICAL: SQUARE_LOCATION_ID is not set!');
}

// Determine environment with fallback to sandbox
// SquareEnvironment provides full base URLs: Production or Sandbox
const squareEnvironment =
  SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox;

// Initialize Square client
// NOTE: Square SDK v43+ uses 'token' parameter (not 'accessToken')
const client = new SquareClient({
  token: SQUARE_ACCESS_TOKEN!,
  environment: squareEnvironment,
});

// This endpoint processes tokenized card payments through Square
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const {
      sourceId,
      cardId,
      amount,
      currency = 'USD',
      orderId,
      orderNumber,
      useSavedCard = false,
      savePaymentMethod = false,
      billingContact,
    } = body;

    if ((!sourceId && !cardId) || !amount) {
      return NextResponse.json({ error: 'Missing required payment details' }, { status: 400 });
    }

    // Validate location ID is available
    if (!SQUARE_LOCATION_ID) {
      console.error('[Square Payment] SQUARE_LOCATION_ID not set');
      return NextResponse.json(
        { error: 'Payment configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    let paymentResult: any;

    // CASE 1: Charge a saved card (Card on File)
    if (useSavedCard && cardId) {
      if (!session?.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Get the saved payment method from database
      const savedMethod = await prisma.$queryRaw`
        SELECT
          payment_token,
          provider_customer_id
        FROM saved_payment_methods
        WHERE id = ${parseInt(cardId)}
          AND user_id = ${parseInt(session.user.id)}
      `;

      if (!savedMethod || savedMethod.length === 0) {
        return NextResponse.json({ error: 'Saved payment method not found' }, { status: 404 });
      }

      const { payment_token, provider_customer_id } = savedMethod[0];

      // Charge the saved card
      paymentResult = await chargeCardOnFile({
        cardId: payment_token,
        customerId: provider_customer_id,
        amount: amount,
        currency: currency,
        referenceId: orderNumber,
      });

      return NextResponse.json({
        success: true,
        paymentId: paymentResult.paymentId,
        orderId: orderId,
        orderNumber: orderNumber,
        status: paymentResult.status,
        receiptUrl: paymentResult.receiptUrl,
        message: 'Payment processed successfully',
      });
    }

    // CASE 2: New card payment (with optional save)
    if (sourceId) {
      let customerId: string | undefined;

      // If user wants to save the card, create/update customer first
      if (savePaymentMethod && session?.user) {
        const squareCustomer = await createOrUpdateSquareCustomer(
          session.user.email!,
          session.user.name || undefined
        );
        customerId = squareCustomer.id;
      }

      // Process the payment
      const result = await client.payments.create({
        sourceId: sourceId,
        amountMoney: {
          amount: BigInt(amount),
          currency: currency,
        },
        idempotencyKey: randomUUID(),
        locationId: SQUARE_LOCATION_ID,
        referenceId: orderNumber,
        ...(customerId && { customerId }),
      });

      // If payment successful AND user wants to save card, save it now
      if (
        result.payment?.status === 'COMPLETED' &&
        savePaymentMethod &&
        session?.user &&
        customerId
      ) {
        try {
          const savedCard = await saveCardOnFile({
            customerId: customerId,
            sourceId: sourceId,
            cardholderName:
              billingContact?.givenName && billingContact?.familyName
                ? `${billingContact.givenName} ${billingContact.familyName}`
                : undefined,
            billingAddress: billingContact
              ? {
                  addressLine1: billingContact.addressLines?.[0],
                  locality: billingContact.city,
                  administrativeDistrictLevel1: billingContact.state,
                  postalCode: billingContact.postalCode,
                  country: billingContact.countryCode || 'US',
                }
              : undefined,
          });

          // Save to database
          await prisma.$executeRaw`
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
              created_at,
              updated_at
            )
            VALUES (
              ${parseInt(session.user.id)},
              'square',
              ${customerId},
              ${savedCard.id},
              ${savedCard.cardBrand.toLowerCase()},
              ${savedCard.last4},
              ${savedCard.expMonth},
              ${savedCard.expYear},
              ${savedCard.cardholderName || null},
              false,
              NOW(),
              NOW()
            )
          `;

          console.log('[Square Payment] Card saved successfully for future use');
        } catch (saveError) {
          console.error(
            '[Square Payment] Failed to save card (payment still succeeded):',
            saveError
          );
          // Don't fail the payment if card save fails
        }
      }

      return NextResponse.json({
        success: true,
        paymentId: result.payment?.id,
        orderId: orderId,
        orderNumber: orderNumber,
        status: result.payment?.status,
        receiptUrl: result.payment?.receiptUrl,
        message: 'Payment processed successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid payment request' }, { status: 400 });
  } catch (error: any) {
    console.error('[Square Payment] Error:', error);

    // Handle specific Square API errors
    if (error?.errors && Array.isArray(error.errors)) {
      const squareError = error.errors[0];
      const errorCode = squareError?.code;
      const errorDetail = squareError?.detail;

      if (errorCode === 'CARD_DECLINED') {
        return NextResponse.json(
          { error: 'Your card was declined. Please try a different payment method.' },
          { status: 400 }
        );
      } else if (errorCode === 'INSUFFICIENT_FUNDS') {
        return NextResponse.json(
          { error: 'Insufficient funds. Please try a different card.' },
          { status: 400 }
        );
      } else if (errorCode === 'INVALID_CARD' || errorCode === 'INVALID_CARD_DATA') {
        return NextResponse.json(
          { error: 'Invalid card details. Please check your information and try again.' },
          { status: 400 }
        );
      } else if (errorCode === 'CVV_FAILURE') {
        return NextResponse.json(
          { error: 'Card verification failed. Please check your CVV and try again.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: errorDetail || 'Payment processing failed. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Payment processing failed. Please try again.' },
      { status: 500 }
    );
  }
}
