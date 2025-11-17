import { SquareClient, SquareEnvironment, SquareError } from 'square'
import * as crypto from 'crypto'
import { SQUARE_CONFIG, PRICING } from '@/config/constants'

// Initialize Square client
const client = new SquareClient({
  squareVersion: SQUARE_CONFIG.API_VERSION,
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
} as any)

export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!
export const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID!

// Create a payment link for checkout
export async function createSquareCheckout(orderData: {
  amount: number // Amount in cents
  orderNumber: string
  email: string
  items?: Array<{
    name: string
    quantity: string
    basePriceMoney: {
      amount: bigint
      currency: string
    }
  }>
}) {
  try {
    const { result } = await client.checkoutApi.createPaymentLink({
      checkoutOptions: {
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
          cashAppPay: true, // Cash App Pay is part of Square SDK
          afterpayClearpay: true,
        },
        askForShippingAddress: true,
        merchantSupportEmail: 'support@gangrunprinting.com',
        redirectUrl: `${process.env.NEXTAUTH_URL}/checkout/success`,
      },
      order: {
        locationId: SQUARE_LOCATION_ID,
        referenceId: orderData.orderNumber,
        lineItems: orderData.items || [
          {
            name: `Order ${orderData.orderNumber}`,
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(orderData.amount),
              currency: 'USD',
            },
          },
        ],
      },
      prePopulatedData: {
        buyerEmail: orderData.email,
      },
    })

    return {
      url: result.paymentLink?.url || '',
      id: result.paymentLink?.id || '',
      orderId: result.paymentLink?.orderId || '',
    }
  } catch (error) {
    if (error instanceof SquareError) {
      throw new Error(`Square checkout failed: ${error.message || 'Unknown error'}`)
    }
    throw error
  }
}

// Retrieve payment details
export async function retrieveSquarePayment(paymentId: string) {
  try {
    const { result } = await client.paymentsApi.getPayment(paymentId)

    return {
      id: result.payment?.id,
      status: result.payment?.status,
      amount: result.payment?.amountMoney?.amount ? Number(result.payment.amountMoney.amount) : 0,
      receiptUrl: result.payment?.receiptUrl,
      orderId: result.payment?.orderId,
      customerId: result.payment?.customerId,
      createdAt: result.payment?.createdAt,
    }
  } catch (error) {
    if (error instanceof SquareError) {
      throw new Error(`Failed to retrieve payment: ${error.message || 'Unknown error'}`)
    }
    throw error
  }
}

// Create or update Square customer
export async function createOrUpdateSquareCustomer(email: string, name?: string, phone?: string) {
  try {
    // First, try to find existing customer by email
    const searchResult = await client.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: email,
          },
        },
      },
    })

    let customerId: string | undefined

    if (searchResult.result.customers && searchResult.result.customers.length > 0) {
      // Update existing customer
      customerId = searchResult.result.customers[0].id

      await client.customersApi.updateCustomer(customerId, {
        emailAddress: email,
        ...(name && {
          givenName: name.split(' ')[0],
          familyName: name.split(' ').slice(1).join(' '),
        }),
        ...(phone && { phoneNumber: phone }),
      })
    } else {
      // Create new customer
      const createResult = await client.customersApi.createCustomer({
        emailAddress: email,
        ...(name && {
          givenName: name.split(' ')[0],
          familyName: name.split(' ').slice(1).join(' '),
        }),
        ...(phone && { phoneNumber: phone }),
      })

      customerId = createResult.result.customer?.id
    }

    return {
      id: customerId || '',
      email,
      name,
      phone,
    }
  } catch (error) {
    if (error instanceof SquareError) {
      throw new Error(`Customer operation failed: ${error.message || 'Unknown error'}`)
    }
    throw error
  }
}

// Create an order in Square
export async function createSquareOrder(orderData: {
  referenceId: string
  customerId?: string
  lineItems: Array<{
    name: string
    quantity: string
    basePriceMoney: {
      amount: bigint
      currency: string
    }
  }>
  taxes?: Array<{
    name: string
    percentage: string
  }>
}) {
  try {
    const { result } = await client.ordersApi.createOrder({
      order: {
        locationId: SQUARE_LOCATION_ID,
        referenceId: orderData.referenceId,
        customerId: orderData.customerId,
        lineItems: orderData.lineItems,
        taxes: orderData.taxes,
      },
    })

    return {
      id: result.order?.id || '',
      referenceId: result.order?.referenceId,
      totalMoney: result.order?.totalMoney?.amount ? Number(result.order.totalMoney.amount) : 0,
      state: result.order?.state,
    }
  } catch (error) {
    if (error instanceof SquareError) {
      throw new Error(`Order creation failed: ${error.message || 'Unknown error'}`)
    }
    throw error
  }
}

// Retrieve an order
export async function retrieveSquareOrder(orderId: string) {
  try {
    const { result } = await client.ordersApi.retrieveOrder(orderId)

    return {
      id: result.order?.id,
      referenceId: result.order?.referenceId,
      state: result.order?.state,
      totalMoney: result.order?.totalMoney?.amount ? Number(result.order.totalMoney.amount) : 0,
      lineItems: result.order?.lineItems,
      fulfillments: result.order?.fulfillments,
    }
  } catch (error) {
    if (error instanceof SquareError) {
      throw new Error(`Failed to retrieve order: ${error.message || 'Unknown error'}`)
    }
    throw error
  }
}

// Update order fulfillment
export async function updateSquareFulfillment(
  orderId: string,
  fulfillmentUid: string,
  state: 'PROPOSED' | 'RESERVED' | 'PREPARED' | 'COMPLETED' | 'CANCELED' | 'FAILED'
) {
  try {
    const { result } = await client.ordersApi.updateOrder(orderId, {
      order: {
        locationId: SQUARE_LOCATION_ID,
        fulfillments: [
          {
            uid: fulfillmentUid,
            state: state,
          },
        ],
      },
    })

    return {
      success: true,
      order: result.order,
    }
  } catch (error) {
    if (error instanceof SquareError) {
      throw new Error(
        `Fulfillment update failed: ${error.result.errors?.[0]?.detail || 'Unknown error'}`
      )
    }
    throw error
  }
}

// Calculate order amount including taxes
export async function calculateOrderAmount(
  subtotal: number,
  taxRate: number = PRICING.SQUARE_TAX_RATE
): Promise<{
  subtotal: number
  tax: number
  total: number
}> {
  const tax = Math.round(subtotal * taxRate)
  const total = subtotal + tax

  return {
    subtotal,
    tax,
    total,
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  body: string,
  signature: string,
  signatureKey: string,
  requestUrl: string
): boolean {
  const hmac = crypto.createHmac(SQUARE_CONFIG.WEBHOOK_SIGNATURE_ALGORITHM, signatureKey)
  hmac.update(requestUrl + body)
  const hash = hmac.digest('base64')
  return hash === signature
}
