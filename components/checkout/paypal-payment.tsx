'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface PayPalPaymentProps {
  total: number;
  orderNumber: string;
  onPaymentSuccess: (result: Record<string, unknown>) => void;
  onPaymentError: (error: string) => void;
  onBack: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export function PayPalPayment({
  total,
  orderNumber,
  onPaymentSuccess,
  onPaymentError,
  onBack,
}: PayPalPaymentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paypalRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const buttonsRendered = useRef(false);

  // BUG FIX #1: Define loadPayPalScript BEFORE useEffect (function hoisting fix)
  const loadPayPalScript = async () => {
    console.log('[PayPal] loadPayPalScript called');
    try {
      // Check if script already exists
      if (document.querySelector('script[src*="paypal.com/sdk"]')) {
        console.log('[PayPal] SDK already loaded');
        return Promise.resolve();
      }

      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
      if (!clientId) {
        throw new Error('PayPal Client ID not configured');
      }

      console.log('[PayPal] Loading PayPal SDK...');

      // Load PayPal SDK
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;
        script.onload = () => {
          console.log('[PayPal] SDK loaded successfully');
          resolve();
        };
        script.onerror = (err) => {
          console.error('[PayPal] Failed to load SDK:', err);
          setError('Failed to load PayPal SDK');
          setIsLoading(false);
          reject(new Error('Failed to load PayPal SDK'));
        };
        document.body.appendChild(script);
      });
    } catch (err) {
      console.error('[PayPal] Error in loadPayPalScript:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize PayPal');
      setIsLoading(false);
      throw err;
    }
  };

  // BUG FIX #2: Define initializePayPal BEFORE useEffect
  const initializePayPal = async () => {
    console.log('[PayPal] initializePayPal called');

    if (!window.paypal) {
      console.error('[PayPal] window.paypal not available');
      setError('PayPal SDK failed to load');
      setIsLoading(false);
      return;
    }

    // BUG FIX #3: Wait for container to be available (race condition fix)
    console.log('[PayPal] Waiting for container...');
    let containerAttempts = 0;
    const maxAttempts = 30; // 3 seconds max

    while (!paypalRef.current && containerAttempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      containerAttempts++;
    }

    if (!paypalRef.current) {
      console.error('[PayPal] Container not found after 3 seconds');
      setError('PayPal container element not found');
      setIsLoading(false);
      return;
    }

    console.log('[PayPal] Container found, rendering buttons...');

    try {
      window.paypal
        .Buttons({
          createOrder: async (data: any, actions: any) => {
            try {
              const response = await fetch('/api/checkout/create-paypal-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: (total / 100).toFixed(2),
                  orderNumber,
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to create PayPal order');
              }

              const order = await response.json();
              return order.id;
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create order');
              throw err;
            }
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const response = await fetch('/api/checkout/capture-paypal-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderID: data.orderID,
                  orderNumber,
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to capture PayPal payment');
              }

              const result = await response.json();
              onPaymentSuccess({
                paymentId: result.paymentId,
                paymentMethod: 'paypal',
              });
            } catch (err) {
              onPaymentError(err instanceof Error ? err.message : 'Payment capture failed');
            }
          },
          onError: (err: any) => {
            console.error('[PayPal] Button error:', err);
            onPaymentError('PayPal payment error occurred');
          },
          onCancel: () => {
            console.log('[PayPal] Payment cancelled by user');
            setError('Payment was cancelled');
          },
        })
        .render(paypalRef.current);

      buttonsRendered.current = true;
      setIsLoading(false);
      console.log('[PayPal] Buttons rendered successfully');
    } catch (err) {
      console.error('[PayPal] Error rendering buttons:', err);
      setError(err instanceof Error ? err.message : 'Failed to render PayPal buttons');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[PayPal] useEffect triggered');

    if (scriptLoaded.current) {
      console.log('[PayPal] Script already loaded, skipping');
      return;
    }

    scriptLoaded.current = true;

    // BUG FIX #4: Set isLoading false early so container renders (race condition fix)
    setIsLoading(false);

    const initPayPal = async () => {
      try {
        await loadPayPalScript();
        await initializePayPal();
      } catch (err) {
        console.error('[PayPal] Initialization error:', err);
      }
    };

    // BUG FIX #5: Call directly instead of using setTimeout (StrictMode fix)
    initPayPal();

    // BUG FIX #6: Add cleanup function
    return () => {
      console.log('[PayPal] Cleanup called');
      if (paypalRef.current && buttonsRendered.current) {
        paypalRef.current.innerHTML = '';
      }
    };
  }, []); // BUG FIX #7: Empty dependency array (prevent infinite re-renders)

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>PayPal Payment</CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex justify-between">
            <span className="font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading PayPal...</span>
          </div>
        )}

        {/* PayPal Buttons Container */}
        <div ref={paypalRef} className="min-h-[150px]" />

        {/* Info */}
        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Secure Payment:</strong> You'll be redirected to PayPal to complete your payment
            securely.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
