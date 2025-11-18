'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Trash2, Plus, AlertCircle } from 'lucide-react';

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

interface SavedPaymentSelectorProps {
  onSelectSaved: (paymentMethod: SavedPaymentMethod) => void;
  onSelectNew: () => void;
  selectedPaymentMethodId?: number | null;
}

export function SavedPaymentSelector({
  onSelectSaved,
  onSelectNew,
  selectedPaymentMethodId = null,
}: SavedPaymentSelectorProps) {
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(
    selectedPaymentMethodId ? selectedPaymentMethodId.toString() : 'new'
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payment-methods');

      if (!response.ok) {
        // User might not be logged in or have no saved methods
        if (response.status === 401) {
          setPaymentMethods([]);
          return;
        }
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (err) {
      console.error('Fetch payment methods error:', err);
      setError('Failed to load saved payment methods');
      setPaymentMethods([]);
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

      // Remove from local state
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));

      // If this was the selected method, switch to new card
      if (selectedId === id.toString()) {
        setSelectedId('new');
        onSelectNew();
      }
    } catch (err) {
      console.error('Delete payment method error:', err);
      setError('Failed to delete payment method');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectionChange = (value: string) => {
    setSelectedId(value);

    if (value === 'new') {
      onSelectNew();
    } else {
      const method = paymentMethods.find((pm) => pm.id.toString() === value);
      if (method) {
        onSelectSaved(method);
      }
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
    // You can customize this based on card brand
    return <CreditCard className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-16 rounded bg-muted" />
            <div className="h-16 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out expired cards
  const activePaymentMethods = paymentMethods.filter((pm) => !pm.isExpired);
  const hasActiveCards = activePaymentMethods.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <RadioGroup value={selectedId} onValueChange={handleSelectionChange}>
          {hasActiveCards && (
            <div className="space-y-3 mb-4">
              <Label className="text-sm font-medium text-muted-foreground">Saved Cards</Label>
              {activePaymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <RadioGroupItem value={pm.id.toString()} id={`pm-${pm.id}`} />
                  <Label
                    htmlFor={`pm-${pm.id}`}
                    className="flex flex-1 items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {getCardIcon(pm.cardBrand)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatCardBrand(pm.cardBrand)} ending in {pm.lastFour}
                          </span>
                          {pm.isDefault && (
                            <Badge variant="secondary" className="text-xs">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(pm.id);
                      }}
                      disabled={deletingId === pm.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </Label>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center space-x-3 rounded-lg border-2 border-dashed p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="new" id="pm-new" />
              <Label htmlFor="pm-new" className="flex flex-1 items-center gap-3 cursor-pointer">
                <Plus className="h-5 w-5" />
                <div>
                  <span className="font-medium">Use a new card</span>
                  <p className="text-sm text-muted-foreground">Pay with a different card</p>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>

        {paymentMethods.some((pm) => pm.isExpired) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some of your saved cards have expired and are not shown. You can manage your payment
              methods in your account settings.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
