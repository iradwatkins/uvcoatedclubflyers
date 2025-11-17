'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, AlertCircle } from 'lucide-react';

export default function CheckoutErrorPage() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message') || 'An unexpected error occurred during checkout.';

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-16">
        <Card className="mx-auto max-w-2xl animate-fade-in text-center">
          <CardHeader>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-500" />
            </div>
            <CardTitle className="text-3xl">Payment Failed</CardTitle>
            <CardDescription className="text-lg">
              We encountered an issue processing your payment.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-left">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            <div className="space-y-3 rounded-lg border p-6">
              <h3 className="font-semibold">Common Issues:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Card declined - Please verify your card details or try a different payment method</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Insufficient funds - Ensure your account has enough balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Incorrect CVV or billing address - Double-check your information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Network issues - Try again in a few moments</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border bg-muted/50 p-6">
              <h3 className="mb-3 font-semibold">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you continue to experience issues, please contact our support team at{' '}
                <a href="mailto:support@uvcoatedclubflyers.com" className="text-primary hover:underline">
                  support@uvcoatedclubflyers.com
                </a>{' '}
                or call us at{' '}
                <a href="tel:1-800-123-4567" className="text-primary hover:underline">
                  1-800-123-4567
                </a>
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Link href="/checkout" className="flex-1">
              <Button className="w-full">
                Try Again
              </Button>
            </Link>
            <Link href="/cart" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Cart
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
