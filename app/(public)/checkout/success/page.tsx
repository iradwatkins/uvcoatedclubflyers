'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-16">
        <Card className="mx-auto max-w-2xl animate-fade-in text-center">
          <CardHeader>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-3xl">Order Confirmed!</CardTitle>
            <CardDescription className="text-lg">
              Thank you for your order. We've received your payment and will begin processing your
              order shortly.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-left">
            {orderDetails && (
              <div className="rounded-lg border bg-muted/50 p-6">
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Order Number:</span>
                    <span className="font-mono">{orderDetails.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-lg font-bold text-primary">
                      ${(orderDetails.totalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500">
                      {orderDetails.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-lg border p-6">
              <h3 className="font-semibold">What's Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">1.</span>
                  <span>You'll receive an order confirmation email shortly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">2.</span>
                  <span>
                    Our team will review your design files and contact you if any adjustments are
                    needed
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">3.</span>
                  <span>Your order will be printed and prepared for shipping</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">4.</span>
                  <span>You'll receive a tracking number once your order ships</span>
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                View Order Details
              </Button>
            </Link>
            <Link href="/products" className="flex-1">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
