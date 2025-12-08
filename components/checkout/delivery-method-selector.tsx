'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Loader2, Plane, Truck, MapPin, Clock, Search, ChevronDown, ChevronUp } from 'lucide-react';
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

interface Airport {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  address: string;
  zip: string;
  hours: Record<string, string>;
}

interface DeliveryMethodSelectorProps {
  toAddress: ShippingAddress;
  cartItems: CartItem[];
  onSelect: (rate: ShippingRate, airportId?: string) => void;
  onBack?: () => void;
}

// US States for filter dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export function DeliveryMethodSelector({
  toAddress,
  cartItems,
  onSelect,
  onBack,
}: DeliveryMethodSelectorProps) {
  // Delivery type: 'address' (FedEx) or 'airport' (Southwest Cargo)
  const [deliveryType, setDeliveryType] = useState<'address' | 'airport' | null>(null);

  // FedEx rates
  const [fedexRates, setFedexRates] = useState<ShippingRate[]>([]);
  const [selectedFedexService, setSelectedFedexService] = useState<string>('');

  // Southwest Cargo
  const [airports, setAirports] = useState<Airport[]>([]);
  const [selectedAirportId, setSelectedAirportId] = useState<string>('');
  const [southwestRates, setSouthwestRates] = useState<ShippingRate[]>([]);
  const [selectedSouthwestService, setSelectedSouthwestService] = useState<string>('');

  // Airport filter state
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAirportPicker, setShowAirportPicker] = useState(false);

  // Loading states
  const [isLoadingFedex, setIsLoadingFedex] = useState(true);
  const [isLoadingAirports, setIsLoadingAirports] = useState(true);
  const [isLoadingSouthwest, setIsLoadingSouthwest] = useState(false);

  const [error, setError] = useState<string>('');
  const [totalWeight, setTotalWeight] = useState('0');

  // Fetch FedEx rates and airports on mount
  useEffect(() => {
    fetchFedexRates();
    fetchAirports();
  }, [toAddress, cartItems]);

  // Fetch Southwest rates when airport is selected
  useEffect(() => {
    if (selectedAirportId) {
      fetchSouthwestRates();
    }
  }, [selectedAirportId]);

  const fetchFedexRates = async () => {
    try {
      setIsLoadingFedex(true);
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress,
          items: cartItems,
          // No airport - just FedEx rates
        }),
      });

      if (!response.ok) throw new Error('Failed to calculate FedEx rates');

      const data = await response.json();
      if (data.success && data.rates) {
        // Filter to only FedEx rates
        const fedex = data.rates.filter((r: ShippingRate) => r.carrier === 'FEDEX');
        setFedexRates(fedex);
        setTotalWeight(data.totalWeight || '0');

        // Auto-select cheapest FedEx rate
        if (fedex.length > 0) {
          setSelectedFedexService(fedex[0].service);
        }
      }
    } catch (err) {
      console.error('FedEx rate error:', err);
    } finally {
      setIsLoadingFedex(false);
    }
  };

  const fetchAirports = async () => {
    try {
      setIsLoadingAirports(true);
      const response = await fetch('/api/shipping/airports');
      if (!response.ok) throw new Error('Failed to fetch airports');

      const data = await response.json();
      if (data.success && data.airports) {
        setAirports(data.airports);
      }
    } catch (err) {
      console.error('Airport fetch error:', err);
    } finally {
      setIsLoadingAirports(false);
    }
  };

  const fetchSouthwestRates = async () => {
    try {
      setIsLoadingSouthwest(true);
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress,
          items: cartItems,
          selectedAirportId,
        }),
      });

      if (!response.ok) throw new Error('Failed to calculate Southwest rates');

      const data = await response.json();
      if (data.success && data.rates) {
        // Filter to only Southwest rates
        const southwest = data.rates.filter((r: ShippingRate) => r.carrier === 'SOUTHWEST_CARGO');
        setSouthwestRates(southwest);

        // Auto-select first Southwest rate
        if (southwest.length > 0) {
          setSelectedSouthwestService(southwest[0].service);
        }
      }
    } catch (err) {
      console.error('Southwest rate error:', err);
    } finally {
      setIsLoadingSouthwest(false);
    }
  };

  // Get unique states that have airports
  const availableStates = useMemo(() => {
    const states = [...new Set(airports.map((a) => a.state))].sort();
    return states;
  }, [airports]);

  // Filter airports based on state and search query
  const filteredAirports = useMemo(() => {
    return airports.filter((airport) => {
      if (stateFilter !== 'all' && airport.state !== stateFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          airport.code.toLowerCase().includes(query) ||
          airport.name.toLowerCase().includes(query) ||
          airport.city.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [airports, stateFilter, searchQuery]);

  const selectedAirport = airports.find(a => a.id === selectedAirportId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (deliveryType === 'address') {
      if (!selectedFedexService) {
        setError('Please select a shipping method');
        return;
      }
      const selectedRate = fedexRates.find((r) => r.service === selectedFedexService);
      if (selectedRate) {
        onSelect(selectedRate);
      }
    } else if (deliveryType === 'airport') {
      if (!selectedAirportId) {
        setError('Please select an airport for pickup');
        return;
      }
      if (!selectedSouthwestService) {
        setError('Please select a shipping method');
        return;
      }
      const selectedRate = southwestRates.find((r) => r.service === selectedSouthwestService);
      if (selectedRate) {
        onSelect(selectedRate, selectedAirportId);
      }
    } else {
      setError('Please select a delivery method');
    }
  };

  const formatPrice = (dollars: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars);
  };

  const getServiceDisplayName = (serviceName: string) => {
    const nameMap: Record<string, string> = {
      'FedEx Ground': 'FedEx Ground',
      'FedEx 2Day': 'FedEx 2Day',
      'FedEx Standard Overnight': 'FedEx Overnight',
      'FedEx Home Delivery': 'FedEx Home Delivery',
      'Southwest Cargo Pickup': 'Southwest Cargo (Standard)',
      'Southwest Cargo Dash': 'Southwest Cargo Dash (Express)',
    };
    return nameMap[serviceName] || serviceName;
  };

  const isLoading = isLoadingFedex && isLoadingAirports;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <CardTitle>Loading Delivery Options...</CardTitle>
          </div>
          <CardDescription>Finding the best shipping options for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <CardTitle>Select Delivery Method</CardTitle>
        </div>
        <CardDescription>
          Choose how you'd like to receive your order · Total weight: {totalWeight} lbs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Delivery Type Selection */}
          <div className="space-y-4">
            {/* Option 1: Ship to Address (FedEx) */}
            <div
              className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                deliveryType === 'address'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => {
                setDeliveryType('address');
                setError('');
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  deliveryType === 'address' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {deliveryType === 'address' && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    <span className="font-semibold">Ship to My Address</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    FedEx delivery to {toAddress.street}, {toAddress.city}, {toAddress.state}
                  </p>

                  {/* FedEx Options */}
                  {deliveryType === 'address' && fedexRates.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <RadioGroup value={selectedFedexService} onValueChange={setSelectedFedexService}>
                        {fedexRates.map((rate) => (
                          <div
                            key={rate.service}
                            className={`flex items-center justify-between rounded-md border p-3 ${
                              selectedFedexService === rate.service ? 'border-primary bg-background' : 'bg-muted/30'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value={rate.service} id={rate.service} />
                              <Label htmlFor={rate.service} className="cursor-pointer font-medium">
                                {getServiceDisplayName(rate.serviceName)}
                              </Label>
                            </div>
                            <span className="font-bold">{formatPrice(rate.cost)}</span>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {deliveryType === 'address' && fedexRates.length === 0 && !isLoadingFedex && (
                    <Alert className="mt-4">
                      <AlertDescription>
                        No FedEx shipping options available for this address.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>

            {/* Option 2: Airport Pickup (Southwest Cargo) */}
            <div
              className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                deliveryType === 'airport'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => {
                setDeliveryType('airport');
                setShowAirportPicker(true);
                setError('');
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  deliveryType === 'airport' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {deliveryType === 'airport' && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    <span className="font-semibold">Airport Pickup (Southwest Cargo)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pick up your order at any Southwest Cargo airport location
                  </p>

                  {/* Airport Selection */}
                  {deliveryType === 'airport' && (
                    <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                      {/* Selected Airport Display */}
                      {selectedAirport && (
                        <div className="rounded-md border bg-background p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{selectedAirport.code} - {selectedAirport.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedAirport.city}, {selectedAirport.state}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAirportPicker(!showAirportPicker)}
                            >
                              Change
                              {showAirportPicker ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Airport Picker */}
                      {(showAirportPicker || !selectedAirportId) && (
                        <div className="space-y-3">
                          {/* Filters */}
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Select value={stateFilter} onValueChange={setStateFilter}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Filter by State" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All States ({airports.length})</SelectItem>
                                {availableStates.map((state) => {
                                  const count = airports.filter((a) => a.state === state).length;
                                  const stateName = US_STATES.find((s) => s.code === state)?.name || state;
                                  return (
                                    <SelectItem key={state} value={state}>
                                      {stateName} ({count})
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>

                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search airports..."
                                className="pl-9"
                              />
                            </div>
                          </div>

                          {/* Airport List */}
                          <div className="max-h-[250px] space-y-2 overflow-y-auto rounded-md border p-2">
                            {filteredAirports.length === 0 ? (
                              <p className="p-4 text-center text-sm text-muted-foreground">
                                No airports match your search
                              </p>
                            ) : (
                              filteredAirports.map((airport) => (
                                <div
                                  key={airport.id}
                                  className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                                    selectedAirportId === airport.id
                                      ? 'border-primary bg-primary/10'
                                      : 'hover:bg-muted/50'
                                  }`}
                                  onClick={() => {
                                    setSelectedAirportId(airport.id);
                                    setShowAirportPicker(false);
                                  }}
                                >
                                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                    selectedAirportId === airport.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                                  }`}>
                                    {selectedAirportId === airport.id && (
                                      <div className="h-2 w-2 rounded-full bg-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {airport.code} - {airport.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {airport.city}, {airport.state}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Southwest Cargo Rates */}
                      {selectedAirportId && (
                        <div className="space-y-2">
                          {isLoadingSouthwest ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <span className="ml-2 text-sm text-muted-foreground">Calculating rates...</span>
                            </div>
                          ) : southwestRates.length > 0 ? (
                            <RadioGroup value={selectedSouthwestService} onValueChange={setSelectedSouthwestService}>
                              {southwestRates.map((rate) => (
                                <div
                                  key={rate.service}
                                  className={`flex items-center justify-between rounded-md border p-3 ${
                                    selectedSouthwestService === rate.service ? 'border-primary bg-background' : 'bg-muted/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem value={rate.service} id={rate.service} />
                                    <Label htmlFor={rate.service} className="cursor-pointer font-medium">
                                      {getServiceDisplayName(rate.serviceName)}
                                    </Label>
                                  </div>
                                  <span className="font-bold">{formatPrice(rate.cost)}</span>
                                </div>
                              ))}
                            </RadioGroup>
                          ) : (
                            <Alert>
                              <AlertDescription>
                                No Southwest Cargo rates available for this airport.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {deliveryType && (
            <Alert>
              <AlertDescription>
                {deliveryType === 'address'
                  ? 'Your order will be delivered directly to your address via FedEx.'
                  : selectedAirport
                    ? `Your order will be available for pickup at ${selectedAirport.code} - ${selectedAirport.city}, ${selectedAirport.state}. You'll receive a notification when it's ready.`
                    : 'Select an airport to see pickup options.'
                }
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
            <Button
              type="submit"
              className="flex-1"
              disabled={
                !deliveryType ||
                (deliveryType === 'address' && !selectedFedexService) ||
                (deliveryType === 'airport' && (!selectedAirportId || !selectedSouthwestService))
              }
            >
              Continue to Payment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
