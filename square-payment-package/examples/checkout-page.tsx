'use client'

import { useState } from 'react'
import { SquareCardPayment } from '@/components/checkout/square-card-payment'
import { CashAppQRPayment } from '@/components/checkout/cashapp-qr-payment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Example Checkout Page
 *
 * This demonstrates how to integrate Square payments into a checkout flow.
 * Replace the hardcoded amount with your actual cart total.
 */
export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cashapp' | null>(null)
  const [orderTotal] = useState(99.99) // Replace with actual cart total

  // Square credentials from environment
  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
  const environment = (process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'

  const handlePaymentSuccess = (result: Record<string, unknown>) => {
    console.log('Payment successful!', result)

    // Here you would typically:
    // 1. Update order status in your database
    // 2. Send confirmation email
    // 3. Redirect to success page

    window.location.href = `/order/confirmation?paymentId=${result.paymentId}`
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error)
    alert(`Payment failed: ${error}`)
  }

  const handleBack = () => {
    setPaymentMethod(null)
  }

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>${(orderTotal / 1.0875).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Tax (8.75%):</span>
            <span>${(orderTotal - orderTotal / 1.0875).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>${orderTotal.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      {!paymentMethod ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-auto py-4 justify-start"
              onClick={() => setPaymentMethod('card')}
            >
              <div className="text-left">
                <p className="font-semibold">Credit or Debit Card</p>
                <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto py-4 justify-start"
              onClick={() => setPaymentMethod('cashapp')}
            >
              <div className="text-left">
                <p className="font-semibold">Cash App Pay</p>
                <p className="text-sm text-muted-foreground">Pay with your Cash App balance</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      ) : paymentMethod === 'card' ? (
        <SquareCardPayment
          applicationId={applicationId}
          locationId={locationId}
          total={orderTotal}
          environment={environment}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          onBack={handleBack}
        />
      ) : (
        <CashAppQRPayment
          total={orderTotal}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
