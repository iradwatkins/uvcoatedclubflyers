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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isResidential: boolean;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface ShippingAddressFormProps {
  onSubmit: (address: ShippingAddress, billingAddress?: BillingAddress) => void;
  onBack?: () => void;
}

export function ShippingAddressForm({ onSubmit, onBack }: ShippingAddressFormProps) {
  // Contact & Shipping fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isResidential, setIsResidential] = useState(false);

  // Billing address fields
  const [billingDifferent, setBillingDifferent] = useState(false);
  const [billingFirstName, setBillingFirstName] = useState('');
  const [billingLastName, setBillingLastName] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingStreet2, setBillingStreet2] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZipCode, setBillingZipCode] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Contact info validation
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\(\)\+]{10,}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    // Shipping address validation
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

    // Billing address validation (only if different from shipping)
    if (billingDifferent) {
      if (!billingFirstName.trim()) {
        newErrors.billingFirstName = 'Billing first name is required';
      }

      if (!billingLastName.trim()) {
        newErrors.billingLastName = 'Billing last name is required';
      }

      if (!billingStreet.trim()) {
        newErrors.billingStreet = 'Billing street address is required';
      }

      if (!billingCity.trim()) {
        newErrors.billingCity = 'Billing city is required';
      }

      if (!billingState.trim()) {
        newErrors.billingState = 'Billing state is required';
      } else if (billingState.length !== 2) {
        newErrors.billingState = 'State must be 2 letter code (e.g., CA)';
      }

      if (!billingZipCode.trim()) {
        newErrors.billingZipCode = 'Billing ZIP code is required';
      } else if (!/^\d{5}(-\d{4})?$/.test(billingZipCode)) {
        newErrors.billingZipCode = 'Invalid ZIP code format';
      }
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
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      street: street.trim(),
      street2: street2.trim() || undefined,
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zipCode: zipCode.trim(),
      country: 'US',
      isResidential,
    };

    // Build billing address if different from shipping
    const billing: BillingAddress | undefined = billingDifferent
      ? {
          firstName: billingFirstName.trim(),
          lastName: billingLastName.trim(),
          street: billingStreet.trim(),
          street2: billingStreet2.trim() || undefined,
          city: billingCity.trim(),
          state: billingState.trim().toUpperCase(),
          zipCode: billingZipCode.trim(),
          country: 'US',
        }
      : undefined;

    onSubmit(address, billing);
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
          {/* Contact Information Section */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h3>

            {/* First Name & Last Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className={errors.firstName ? 'border-destructive' : ''}
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  className={errors.lastName ? 'border-destructive' : ''}
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.smith@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              <p className="text-xs text-muted-foreground">We'll send your order confirmation here</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              <p className="text-xs text-muted-foreground">For delivery updates and questions</p>
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="space-y-4 pt-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Shipping Address</h3>

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
              {errors.street && <p className="text-sm text-destructive">{errors.street}</p>}
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
              {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
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
                {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
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
                {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode}</p>}
              </div>
            </div>

            {/* Residential Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="residential"
                checked={isResidential}
                onCheckedChange={(checked) => setIsResidential(checked as boolean)}
              />
              <Label htmlFor="residential" className="cursor-pointer text-sm font-normal">
                This is a residential address
              </Label>
            </div>

            {isResidential && (
              <Alert>
                <AlertDescription>
                  Residential deliveries may have additional options available (like FedEx Home
                  Delivery)
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Billing Address Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="billingDifferent"
                checked={billingDifferent}
                onCheckedChange={(checked) => setBillingDifferent(checked as boolean)}
              />
              <Label htmlFor="billingDifferent" className="cursor-pointer text-sm font-normal">
                Billing address is different from shipping address
              </Label>
            </div>

            {billingDifferent && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Billing Address</h3>

                {/* Billing Name */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billingFirstName">First Name *</Label>
                    <Input
                      id="billingFirstName"
                      value={billingFirstName}
                      onChange={(e) => setBillingFirstName(e.target.value)}
                      placeholder="John"
                      className={errors.billingFirstName ? 'border-destructive' : ''}
                    />
                    {errors.billingFirstName && <p className="text-sm text-destructive">{errors.billingFirstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingLastName">Last Name *</Label>
                    <Input
                      id="billingLastName"
                      value={billingLastName}
                      onChange={(e) => setBillingLastName(e.target.value)}
                      placeholder="Smith"
                      className={errors.billingLastName ? 'border-destructive' : ''}
                    />
                    {errors.billingLastName && <p className="text-sm text-destructive">{errors.billingLastName}</p>}
                  </div>
                </div>

                {/* Billing Street */}
                <div className="space-y-2">
                  <Label htmlFor="billingStreet">Street Address *</Label>
                  <Input
                    id="billingStreet"
                    value={billingStreet}
                    onChange={(e) => setBillingStreet(e.target.value)}
                    placeholder="1234 Main St"
                    className={errors.billingStreet ? 'border-destructive' : ''}
                  />
                  {errors.billingStreet && <p className="text-sm text-destructive">{errors.billingStreet}</p>}
                </div>

                {/* Billing Street 2 */}
                <div className="space-y-2">
                  <Label htmlFor="billingStreet2">Apartment, suite, etc. (optional)</Label>
                  <Input
                    id="billingStreet2"
                    value={billingStreet2}
                    onChange={(e) => setBillingStreet2(e.target.value)}
                    placeholder="Apt 5B"
                  />
                </div>

                {/* Billing City */}
                <div className="space-y-2">
                  <Label htmlFor="billingCity">City *</Label>
                  <Input
                    id="billingCity"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    placeholder="Los Angeles"
                    className={errors.billingCity ? 'border-destructive' : ''}
                  />
                  {errors.billingCity && <p className="text-sm text-destructive">{errors.billingCity}</p>}
                </div>

                {/* Billing State & ZIP */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billingState">State *</Label>
                    <Input
                      id="billingState"
                      value={billingState}
                      onChange={(e) => setBillingState(e.target.value.toUpperCase())}
                      placeholder="CA"
                      maxLength={2}
                      className={errors.billingState ? 'border-destructive' : ''}
                    />
                    {errors.billingState && <p className="text-sm text-destructive">{errors.billingState}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingZipCode">ZIP Code *</Label>
                    <Input
                      id="billingZipCode"
                      value={billingZipCode}
                      onChange={(e) => setBillingZipCode(e.target.value)}
                      placeholder="90001"
                      className={errors.billingZipCode ? 'border-destructive' : ''}
                    />
                    {errors.billingZipCode && <p className="text-sm text-destructive">{errors.billingZipCode}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

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
