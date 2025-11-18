'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Trash2, AlertCircle, Star } from 'lucide-react';

interface SavedPaymentMethod {
  id: number;
  provider: string;
  cardBrand: string | null;
  lastFour: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  cardholderName: string | null;
  isDefault: boolean;
  isExpired: boolean;
}

interface PaymentMethodSettingsProps {
  userId: string;
}

export function PaymentMethodSettings({ userId }: PaymentMethodSettingsProps) {
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payment-methods');

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (err) {
      console.error('Fetch payment methods error:', err);
      setError('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    } catch (err) {
      console.error('Delete payment method error:', err);
      setError('Failed to delete payment method');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      setSettingDefaultId(id);
      const response = await fetch(`/api/payment-methods/${id}/set-default`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (err) {
      console.error('Set default payment method error:', err);
      setError('Failed to set default payment method');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const formatCardBrand = (brand: string | null) => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const formatExpiry = (month: number | null, year: number | null) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const getCardIcon = (brand: string | null) => {
    return <CreditCard className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activePaymentMethods = paymentMethods.filter((pm) => !pm.isExpired);
  const expiredPaymentMethods = paymentMethods.filter((pm) => pm.isExpired);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>
          Manage your saved payment methods. Payment methods are automatically saved when you check
          out and can be reused for faster payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {activePaymentMethods.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved payment methods</h3>
            <p className="text-muted-foreground mb-4">
              Payment methods will be saved automatically during checkout when you opt to save your
              card.
            </p>
            <Button onClick={() => (window.location.href = '/products')}>Browse Products</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Active Cards</h3>
            {activePaymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  {getCardIcon(pm.cardBrand)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCardBrand(pm.cardBrand)} ending in {pm.lastFour}
                      </span>
                      {pm.isDefault && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {pm.cardholderName && <span>{pm.cardholderName} • </span>}
                      Expires {formatExpiry(pm.expiryMonth, pm.expiryYear)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!pm.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(pm.id)}
                      disabled={settingDefaultId === pm.id}
                    >
                      {settingDefaultId === pm.id ? 'Setting...' : 'Set as Default'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pm.id)}
                    disabled={deletingId === pm.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {expiredPaymentMethods.length > 0 && (
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Expired Cards</h3>
            {expiredPaymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4"
              >
                <div className="flex items-center gap-4">
                  {getCardIcon(pm.cardBrand)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">
                        {formatCardBrand(pm.cardBrand)} ending in {pm.lastFour}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        Expired
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {pm.cardholderName && <span>{pm.cardholderName} • </span>}
                      Expired {formatExpiry(pm.expiryMonth, pm.expiryYear)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(pm.id)}
                  disabled={deletingId === pm.id}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            For your security, full card details are never stored. Only the last 4 digits and
            expiration date are saved for identification purposes.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
