'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Smartphone, ArrowLeft, Check } from 'lucide-react';
import { SquareCardPayment } from '@/components/checkout/square-card-payment';
import { CashAppQRPayment } from '@/components/checkout/cashapp-qr-payment';
import { PayPalPayment } from '@/components/checkout/paypal-payment';
import { ShippingAddressForm, type ShippingAddress } from '@/components/checkout/shipping-address-form';
import { AirportSelector } from '@/components/checkout/airport-selector';
import { ShippingMethodSelector } from '@/components/checkout/shipping-method-selector';
import { SavedPaymentSelector } from '@/components/checkout/saved-payment-selector';
import { ProductImage } from '@/components/product-image';
import { OrderFilesDisplay } from '@/components/order-files-display';
import type { Cart } from '@/lib/cart';
import { calculateItemWeight } from '@/lib/cart/weight-calculator';

type CheckoutStep = 'shipping-address' | 'airport-selection' | 'shipping-method' | 'payment';

interface ShippingRate {
  carrier: string;
  service: string;
  serviceName: string;
  cost: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping-address');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [selectedAirportId, setSelectedAirportId] = useState<string>('');
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cashapp' | 'paypal' | null>(null);
  const [selectedSavedPayment, setSelectedSavedPayment] = useState<any | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    fetchCart();
    generateOrderNumber();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) throw new Error('Failed to fetch cart');

      const data = await response.json();
      setCart(data);

      if (data.items.length === 0) {
        router.push('/cart');
      }
    } catch (error) {
      console.error('Fetch cart error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateOrderNumber = () => {
    const number = `UVC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setOrderNumber(number);
  };

  const handleShippingAddressSubmit = (address: ShippingAddress) => {
    setShippingAddress(address);
    setCurrentStep('airport-selection');
  };

  const handleAirportSelect = (airportId: string) => {
    setSelectedAirportId(airportId);
    setCurrentStep('shipping-method');
  };

  const handleSkipAirport = () => {
    setSelectedAirportId('');
    setCurrentStep('shipping-method');
  };

  const handleShippingMethodSelect = (rate: ShippingRate) => {
    setSelectedShipping(rate);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async (result: Record<string, unknown>) => {
    try {
      // Save order to database
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          paymentId: result.paymentId,
          paymentMethod: result.paymentMethod || 'card',
          cart,
          shippingAddress,
          shipping: selectedShipping,
          airportId: selectedAirportId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create order');

      const data = await response.json();

      // Clear cart
      await fetch('/api/cart/clear', { method: 'POST' });

      // Redirect to success page
      router.push(`/checkout/success?order=${data.orderId}`);
    } catch (error) {
      console.error('Order creation error:', error);
      router.push('/checkout/error');
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    router.push(`/checkout/error?message=${encodeURIComponent(error)}`);
  };

  const handlePaymentBack = () => {
    setPaymentMethod(null);
    setCurrentStep('shipping-method');
  };

  const handleStepBack = () => {
    if (currentStep === 'airport-selection') {
      setCurrentStep('shipping-address');
    } else if (currentStep === 'shipping-method') {
      setCurrentStep('airport-selection');
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (isLoading || !cart) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-96 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;
  const environment = (process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/cart')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
        </div>

        <h1 className="mb-8">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Order #{orderNumber}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3 border-b pb-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex gap-3 text-sm">
                        <ProductImage
                          imageUrl={null}
                          productName={item.productName}
                          variant="mini"
                          className="shrink-0"
                        />
                        <div className="flex flex-1 justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-muted-foreground">
                              Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                            </p>
                          </div>
                          <p className="font-medium">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                      {/* Uploaded Files */}
                      {item.uploadedFiles && item.uploadedFiles.length > 0 && (
                        <div className="ml-14">
                          <OrderFilesDisplay
                            fileIds={item.uploadedFiles}
                            variant="compact"
                            showDownload={false}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(cart.total)}</span>
                  </div>
                  {selectedShipping && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(selectedShipping.cost)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (8.75%)</span>
                    <span className="font-medium">
                      {formatPrice(Math.round((cart.total + (selectedShipping ? selectedShipping.cost * 100 : 0)) * 0.0875))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(Math.round((cart.total + (selectedShipping ? selectedShipping.cost * 100 : 0)) * 1.0875))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Steps */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === 'shipping-address' ? 'bg-primary text-primary-foreground' : shippingAddress ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {shippingAddress ? <Check className="h-5 w-5" /> : '1'}
                </div>
                <span className="text-sm font-medium">Address</span>
              </div>
              <div className="h-px flex-1 bg-border mx-2" />
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === 'airport-selection' ? 'bg-primary text-primary-foreground' : currentStep === 'shipping-method' || currentStep === 'payment' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {currentStep === 'shipping-method' || currentStep === 'payment' ? <Check className="h-5 w-5" /> : '2'}
                </div>
                <span className="text-sm font-medium">Airport</span>
              </div>
              <div className="h-px flex-1 bg-border mx-2" />
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === 'shipping-method' ? 'bg-primary text-primary-foreground' : selectedShipping ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {selectedShipping ? <Check className="h-5 w-5" /> : '3'}
                </div>
                <span className="text-sm font-medium">Shipping</span>
              </div>
              <div className="h-px flex-1 bg-border mx-2" />
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  4
                </div>
                <span className="text-sm font-medium">Payment</span>
              </div>
            </div>

            {/* Step 1: Shipping Address */}
            {currentStep === 'shipping-address' && (
              <ShippingAddressForm
                onSubmit={handleShippingAddressSubmit}
                onBack={() => router.push('/cart')}
              />
            )}

            {/* Step 2: Airport Selection */}
            {currentStep === 'airport-selection' && shippingAddress && (
              <AirportSelector
                state={shippingAddress.state}
                onSelect={handleAirportSelect}
                onBack={handleStepBack}
                onSkip={handleSkipAirport}
              />
            )}

            {/* Step 3: Shipping Method */}
            {currentStep === 'shipping-method' && shippingAddress && (
              <ShippingMethodSelector
                toAddress={shippingAddress}
                cartItems={cart.items.map(item => ({
                  quantity: item.quantity,
                  weightLbs: calculateItemWeight(item, item.productName),
                }))}
                selectedAirportId={selectedAirportId}
                onSelect={handleShippingMethodSelect}
                onBack={handleStepBack}
              />
            )}

            {/* Step 4: Payment */}
            {currentStep === 'payment' && selectedShipping && (
              <>
                {!paymentMethod ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Payment Method</CardTitle>
                      <CardDescription>
                        Choose how you'd like to pay for your order
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        variant="outline"
                        className="h-auto w-full justify-start p-6 text-left"
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CreditCard className="mr-4 h-8 w-8" />
                        <div className="flex-1">
                          <p className="font-semibold">Credit or Debit Card</p>
                          <p className="text-sm text-muted-foreground">
                            Pay securely with Visa, Mastercard, American Express, or Discover
                          </p>
                        </div>
                        <Badge>Recommended</Badge>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto w-full justify-start p-6 text-left"
                        onClick={() => setPaymentMethod('cashapp')}
                      >
                        <Smartphone className="mr-4 h-8 w-8" />
                        <div className="flex-1">
                          <p className="font-semibold">Cash App Pay</p>
                          <p className="text-sm text-muted-foreground">
                            Scan QR code with your Cash App to pay
                          </p>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto w-full justify-start p-6 text-left"
                        onClick={() => setPaymentMethod('paypal')}
                      >
                        <svg className="mr-4 h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 01-.794.68H7.72a.483.483 0 01-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z"/>
                          <path d="M2.379 0C1.818 0 1.334.426 1.258.983L.006 9.958c-.063.458.263.862.728.862h4.368l1.096-6.945L6.25 3.48c.062-.397.41-.69.813-.69h6.817c2.059 0 3.606.422 4.596 1.252.298.25.524.526.684.825.165.312.264.658.303 1.052.04.4.02.858-.06 1.37v.004c-.02.12-.043.244-.068.37-.736 4.046-3.369 6.11-7.831 6.14H9.441a.81.81 0 00-.799.68l-.04.22-1.139 7.22-.03.177a.806.806 0 01-.795.68H2.878a.483.483 0 01-.477-.558l2.255-14.29z"/>
                        </svg>
                        <div className="flex-1">
                          <p className="font-semibold">PayPal</p>
                          <p className="text-sm text-muted-foreground">
                            Pay securely with your PayPal account
                          </p>
                        </div>
                      </Button>

                      <div className="pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep('shipping-method')}
                          className="w-full"
                        >
                          Back to Shipping Method
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : paymentMethod === 'card' ? (
                  !showNewCardForm && !selectedSavedPayment ? (
                    <SavedPaymentSelector
                      onSelectSaved={(pm) => {
                        setSelectedSavedPayment(pm);
                      }}
                      onSelectNew={() => {
                        setShowNewCardForm(true);
                        setSelectedSavedPayment(null);
                      }}
                    />
                  ) : (
                    <SquareCardPayment
                      applicationId={applicationId}
                      locationId={locationId}
                      total={Math.round((cart.total + selectedShipping.cost * 100) * 1.0875)}
                      environment={environment}
                      savedPaymentMethod={selectedSavedPayment ? {
                        id: selectedSavedPayment.id.toString(),
                        squareCardId: selectedSavedPayment.providerCustomerId || '',
                        maskedNumber: `****${selectedSavedPayment.lastFour}`,
                        cardBrand: selectedSavedPayment.cardBrand || 'card'
                      } : null}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      onBack={() => {
                        setShowNewCardForm(false);
                        setSelectedSavedPayment(null);
                      }}
                    />
                  )
                ) : paymentMethod === 'cashapp' ? (
                  <CashAppQRPayment
                    total={Math.round((cart.total + selectedShipping.cost * 100) * 1.0875) / 100}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    onBack={handlePaymentBack}
                  />
                ) : (
                  <PayPalPayment
                    total={Math.round((cart.total + selectedShipping.cost * 100) * 1.0875)}
                    orderNumber={orderNumber}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    onBack={handlePaymentBack}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
