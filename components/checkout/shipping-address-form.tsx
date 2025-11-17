'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck } from 'lucide-react';

export interface ShippingAddress {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isResidential: boolean;
}

interface ShippingAddressFormProps {
  onSubmit: (address: ShippingAddress) => void;
  onBack?: () => void;
}

export function ShippingAddressForm({ onSubmit, onBack }: ShippingAddressFormProps) {
  const [street, setStreet] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isResidential, setIsResidential] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!state.trim()) {
      newErrors.state = 'State is required';
    } else if (state.length !== 2) {
      newErrors.state = 'State must be 2 letter code (e.g., CA)';
    }

    if (!zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const address: ShippingAddress = {
      street: street.trim(),
      street2: street2.trim() || undefined,
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zipCode: zipCode.trim(),
      country: 'US',
      isResidential,
    };

    onSubmit(address);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6" />
          <CardTitle>Shipping Address</CardTitle>
        </div>
        <CardDescription>Where should we send your order?</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Street Address */}
          <div className="space-y-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="1234 Main St"
              className={errors.street ? 'border-destructive' : ''}
            />
            {errors.street && (
              <p className="text-sm text-destructive">{errors.street}</p>
            )}
          </div>

          {/* Street Address 2 */}
          <div className="space-y-2">
            <Label htmlFor="street2">Apartment, suite, etc. (optional)</Label>
            <Input
              id="street2"
              value={street2}
              onChange={(e) => setStreet2(e.target.value)}
              placeholder="Apt 5B"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Los Angeles"
              className={errors.city ? 'border-destructive' : ''}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city}</p>
            )}
          </div>

          {/* State & ZIP */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="CA"
                maxLength={2}
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="90001"
                className={errors.zipCode ? 'border-destructive' : ''}
              />
              {errors.zipCode && (
                <p className="text-sm text-destructive">{errors.zipCode}</p>
              )}
            </div>
          </div>

          {/* Residential Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="residential"
              checked={isResidential}
              onCheckedChange={(checked) => setIsResidential(checked as boolean)}
            />
            <Label
              htmlFor="residential"
              className="cursor-pointer text-sm font-normal"
            >
              This is a residential address
            </Label>
          </div>

          {isResidential && (
            <Alert>
              <AlertDescription>
                Residential deliveries may have additional options available (like FedEx Home Delivery)
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
            <Button type="submit" className="flex-1">
              Continue to Shipping Options
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
