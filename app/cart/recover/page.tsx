'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { Loader2, ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RecoveredCart {
  id: number;
  sessionId: string;
  email: string;
  cartData: any;
  totalValue: number;
  itemCount: number;
  productNames: string[];
  productImages: string[];
  discountCode?: string;
  discountPercent?: number;
}

export default function CartRecoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate } = useCart();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [recoveredCart, setRecoveredCart] = useState<RecoveredCart | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid recovery link. Please check your email and try again.');
      return;
    }

    recoverCart(token);
  }, [searchParams]);

  async function recoverCart(token: string) {
    try {
      setStatus('loading');
      setMessage('Restoring your cart...');

      // Step 1: Validate token and get cart data
      const validateRes = await fetch(`/api/cart/recover?token=${token}`);
      const validateData = await validateRes.json();

      if (!validateRes.ok) {
        throw new Error(validateData.error || 'Failed to validate recovery link');
      }

      const cart = validateData.cart as RecoveredCart;
      setRecoveredCart(cart);

      // Step 2: Get or create new session ID
      const sessionRes = await fetch('/api/cart/session');
      const sessionData = await sessionRes.json();
      const newSessionId = sessionData.sessionId;

      // Step 3: Restore cart to new session
      const restoreRes = await fetch('/api/cart/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newSessionId,
        }),
      });

      const restoreData = await restoreRes.json();

      if (!restoreRes.ok) {
        throw new Error(restoreData.error || 'Failed to restore cart');
      }

      // Success!
      setStatus('success');

      if (restoreData.discountCode) {
        setMessage(
          `Your cart has been restored! We've applied a ${restoreData.discountPercent}% discount with code: ${restoreData.discountCode}`
        );
      } else {
        setMessage('Your cart has been restored successfully!');
      }

      // Revalidate cart data
      mutate();

      // Redirect to cart after 2 seconds
      setTimeout(() => {
        router.push('/cart');
      }, 2000);
    } catch (error: any) {
      console.error('[Cart Recovery] Error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to recover your cart. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <ShoppingCart className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cart Recovery
            </h1>
            <p className="text-gray-600">
              We're restoring your saved items
            </p>
          </div>

          {/* Status */}
          <div className="space-y-4">
            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                <p className="text-gray-600 text-center">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-800 font-medium mb-1">Success!</p>
                    <p className="text-green-700 text-sm">{message}</p>
                  </div>
                </div>

                {recoveredCart && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Restored Items ({recoveredCart.itemCount})
                    </h3>
                    <div className="space-y-2">
                      {recoveredCart.productNames.map((name, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          {recoveredCart.productImages[index] && (
                            <img
                              src={recoveredCart.productImages[index]}
                              alt={name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <span className="text-sm text-gray-700">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-center text-sm text-gray-500">
                  Redirecting to your cart...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium mb-1">Error</p>
                    <p className="text-red-700 text-sm">{message}</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push('/')}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Go to Home
                  </button>
                  <button
                    onClick={() => router.push('/cart')}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Cart
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {status !== 'error' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Questions? Contact us at{' '}
                <a
                  href="mailto:support@uvcoatedclubflyers.com"
                  className="text-purple-600 hover:underline"
                >
                  support@uvcoatedclubflyers.com
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
