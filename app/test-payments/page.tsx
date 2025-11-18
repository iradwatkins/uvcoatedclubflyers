'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SquareCardPayment } from '@/components/checkout/square-card-payment';
import { CashAppQRPayment } from '@/components/checkout/cashapp-qr-payment';
import { PayPalPayment } from '@/components/checkout/paypal-payment';

export default function TestPaymentsPage() {
  const [activeTest, setActiveTest] = useState<'square' | 'cashapp' | 'paypal' | null>(null);
  const [testCount, setTestCount] = useState({ square: 0, cashapp: 0, paypal: 0 });
  const [results, setResults] = useState<
    Array<{ method: string; status: string; message: string }>
  >([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [mounted, setMounted] = useState(false);

  // Test configuration
  const TEST_AMOUNT_CENTS = 19031; // $190.31
  const TEST_AMOUNT_DOLLARS = 190.31;

  // Generate order number on client side only
  useEffect(() => {
    setOrderNumber(`TEST-${Date.now()}`);
    setMounted(true);
  }, []);

  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;
  const environment = (process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox') as
    | 'sandbox'
    | 'production';

  const handlePaymentSuccess = (result: Record<string, unknown>) => {
    const method = activeTest || 'unknown';
    setResults((prev) => [
      ...prev,
      {
        method: method.toUpperCase(),
        status: 'SUCCESS',
        message: `Payment ID: ${result.paymentId}`,
      },
    ]);
    setTestCount((prev) => ({ ...prev, [method]: prev[method as keyof typeof prev] + 1 }));
    alert(
      `✅ Payment successful! Test #${testCount[method as keyof typeof testCount] + 1} completed.`
    );
    setActiveTest(null);
  };

  const handlePaymentError = (error: string) => {
    const method = activeTest || 'unknown';
    setResults((prev) => [
      ...prev,
      {
        method: method.toUpperCase(),
        status: 'ERROR',
        message: error,
      },
    ]);
    alert(`❌ Payment error: ${error}`);
  };

  const handleBack = () => {
    setActiveTest(null);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-96 rounded bg-muted" />
            <div className="h-24 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">🧪 Payment Methods Test Suite</h1>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm">
              <strong>Test Amount:</strong> ${TEST_AMOUNT_DOLLARS.toFixed(2)} ($
              {(TEST_AMOUNT_CENTS / 100).toFixed(2)})<br />
              <strong>Environment:</strong> {environment.toUpperCase()}
              <br />
              <strong>Order Number:</strong> {orderNumber}
            </p>
          </div>
        </div>

        {/* Test Progress */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Square Card</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{testCount.square}/3</div>
              <p className="text-xs text-muted-foreground">Tests Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cash App Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{testCount.cashapp}/3</div>
              <p className="text-xs text-muted-foreground">Tests Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">PayPal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{testCount.paypal}/3</div>
              <p className="text-xs text-muted-foreground">Tests Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Selection or Active Test */}
        {!activeTest ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method to Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="h-auto w-full justify-between p-6 text-left"
                onClick={() => setActiveTest('square')}
              >
                <div>
                  <p className="font-semibold text-lg">1. Square Card Payment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Test card: 4111 1111 1111 1111 • CVV: 123 • ZIP: 12345
                  </p>
                </div>
                <Badge variant={testCount.square >= 3 ? 'default' : 'secondary'}>
                  {testCount.square}/3
                </Badge>
              </Button>

              <Button
                variant="outline"
                className="h-auto w-full justify-between p-6 text-left"
                onClick={() => setActiveTest('cashapp')}
              >
                <div>
                  <p className="font-semibold text-lg">2. Cash App Pay</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    QR code payment method • Verify button renders
                  </p>
                </div>
                <Badge variant={testCount.cashapp >= 3 ? 'default' : 'secondary'}>
                  {testCount.cashapp}/3
                </Badge>
              </Button>

              <Button
                variant="outline"
                className="h-auto w-full justify-between p-6 text-left"
                onClick={() => setActiveTest('paypal')}
              >
                <div>
                  <p className="font-semibold text-lg">3. PayPal Payment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PayPal buttons • Sandbox account testing
                  </p>
                </div>
                <Badge variant={testCount.paypal >= 3 ? 'default' : 'secondary'}>
                  {testCount.paypal}/3
                </Badge>
              </Button>
            </CardContent>
          </Card>
        ) : activeTest === 'square' ? (
          <div>
            <div className="mb-4">
              <Badge className="mb-2">Test #{testCount.square + 1}/3</Badge>
            </div>
            <SquareCardPayment
              applicationId={applicationId}
              locationId={locationId}
              total={TEST_AMOUNT_DOLLARS}
              environment={environment}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onBack={handleBack}
            />
          </div>
        ) : activeTest === 'cashapp' ? (
          <div>
            <div className="mb-4">
              <Badge className="mb-2">Test #{testCount.cashapp + 1}/3</Badge>
            </div>
            <CashAppQRPayment
              total={TEST_AMOUNT_DOLLARS}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onBack={handleBack}
            />
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <Badge className="mb-2">Test #{testCount.paypal + 1}/3</Badge>
            </div>
            <PayPalPayment
              total={TEST_AMOUNT_CENTS}
              orderNumber={orderNumber}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onBack={handleBack}
            />
          </div>
        )}

        {/* Test Results Log */}
        {results.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Test Results Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      result.status === 'SUCCESS'
                        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-semibold">{result.method}</span>
                        <span
                          className={`ml-2 text-sm ${
                            result.status === 'SUCCESS'
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-red-700 dark:text-red-400'
                          }`}
                        >
                          {result.status}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">Test #{index + 1}</span>
                    </div>
                    <p className="text-sm mt-1 text-muted-foreground">{result.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Tests Complete */}
        {testCount.square >= 3 && testCount.cashapp >= 3 && testCount.paypal >= 3 && (
          <Card className="mt-8 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-400">
                ✅ All Tests Complete!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                All three payment methods have been tested 3 times each. Review the test results log
                above for details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
