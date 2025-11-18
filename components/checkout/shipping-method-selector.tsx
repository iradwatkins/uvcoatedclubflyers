'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Loader2 } from 'lucide-react';
import type { ShippingAddress } from './shipping-address-form';

interface CartItem {
  quantity: number;
  weightLbs: number;
}

interface ShippingRate {
  carrier: string;
  service: string;
  serviceName: string;
  cost: number;
}

interface ShippingMethodSelectorProps {
  toAddress: ShippingAddress;
  cartItems: CartItem[];
  selectedAirportId?: string;
  onSelect: (rate: ShippingRate) => void;
  onBack?: () => void;
}

export function ShippingMethodSelector({
  toAddress,
  cartItems,
  selectedAirportId,
  onSelect,
  onBack,
}: ShippingMethodSelectorProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [totalWeight, setTotalWeight] = useState('0');
  const [boxSummary, setBoxSummary] = useState('');

  useEffect(() => {
    calculateShipping();
  }, [toAddress, cartItems, selectedAirportId]);

  const calculateShipping = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress,
          items: cartItems,
          selectedAirportId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate shipping rates');
      }

      const data = await response.json();

      if (data.success && data.rates) {
        setRates(data.rates);
        setTotalWeight(data.totalWeight || '0');
        setBoxSummary(data.boxSummary || '');

        // Auto-select cheapest rate
        if (data.rates.length > 0) {
          setSelectedService(data.rates[0].service);
        }
      } else {
        throw new Error(data.error || 'No rates available');
      }
    } catch (err) {
      console.error('Shipping calculation error:', err);
      setError('Unable to calculate shipping rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService) {
      setError('Please select a shipping method');
      return;
    }

    const selectedRate = rates.find((r) => r.service === selectedService);

    if (!selectedRate) {
      setError('Invalid shipping method selected');
      return;
    }

    onSelect(selectedRate);
  };

  const formatPrice = (dollars: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars);
  };

  const getServiceDisplayName = (serviceName: string) => {
    // Clean up service names for display
    const nameMap: Record<string, string> = {
      'FedEx Ground': 'FedEx Ground',
      'FedEx 2Day': 'FedEx 2Day',
      'FedEx Standard Overnight': 'FedEx Overnight',
      'FedEx Home Delivery': 'FedEx Home Delivery',
      'Southwest Cargo Pickup': 'Southwest Cargo Pickup (Standard)',
      'Southwest Cargo Dash': 'Southwest Cargo Dash (Express)',
    };

    return nameMap[serviceName] || serviceName;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <CardTitle>Calculating Shipping Rates...</CardTitle>
          </div>
          <CardDescription>Please wait while we find the best shipping options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <CardTitle>Shipping Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="mt-6 flex gap-3">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button type="button" onClick={calculateShipping} className="flex-1">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <CardTitle>No Shipping Options Available</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              We couldn't find any shipping options for this address. Please check your address and
              try again.
            </AlertDescription>
          </Alert>

          <div className="mt-6 flex gap-3">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Back to Address
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <CardTitle>Select Shipping Method</CardTitle>
        </div>
        <CardDescription>
          {rates.length} shipping option{rates.length !== 1 ? 's' : ''} available · Total weight:{' '}
          {totalWeight} lbs
          {boxSummary && ` · ${boxSummary}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup value={selectedService} onValueChange={setSelectedService}>
            <div className="space-y-3">
              {rates.map((rate) => (
                <div
                  key={rate.service}
                  className={`relative flex items-center justify-between space-x-3 rounded-lg border p-4 transition-colors ${
                    selectedService === rate.service
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={rate.service} id={rate.service} />
                    <Label htmlFor={rate.service} className="cursor-pointer">
                      <div className="space-y-1">
                        <p className="font-semibold">{getServiceDisplayName(rate.serviceName)}</p>
                        <p className="text-sm text-muted-foreground">
                          {rate.carrier === 'FEDEX' && 'FedEx delivery to your address'}
                          {rate.carrier === 'SOUTHWEST_CARGO' &&
                            'Pickup at Southwest Cargo airport'}
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatPrice(rate.cost)}</p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>

          {selectedService && (
            <Alert>
              <AlertDescription>
                {rates.find((r) => r.service === selectedService)?.carrier === 'FEDEX'
                  ? 'Your order will be delivered directly to your address.'
                  : "You will pick up your order at the selected Southwest Cargo airport. You'll receive a notification when it's ready."}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={!selectedService}>
              Continue to Payment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
