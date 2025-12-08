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
import { Plane, MapPin, Clock, Search } from 'lucide-react';

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

interface AirportSelectorProps {
  onSelect: (airportId: string) => void;
  onBack?: () => void;
  onSkip?: () => void;
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

export function AirportSelector({ onSelect, onBack, onSkip }: AirportSelectorProps) {
  const [allAirports, setAllAirports] = useState<Airport[]>([]);
  const [selectedAirportId, setSelectedAirportId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Filter state
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchAllAirports();
  }, []);

  const fetchAllAirports = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch ALL airports (no state filter)
      const response = await fetch('/api/shipping/airports');

      if (!response.ok) {
        throw new Error('Failed to fetch airports');
      }

      const data = await response.json();

      if (data.success && data.airports) {
        setAllAirports(data.airports);
      }
    } catch (err) {
      console.error('Airport fetch error:', err);
      setError('Unable to load airports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique states that have airports
  const availableStates = useMemo(() => {
    const states = [...new Set(allAirports.map((a) => a.state))].sort();
    return states;
  }, [allAirports]);

  // Filter airports based on state and search query
  const filteredAirports = useMemo(() => {
    return allAirports.filter((airport) => {
      // State filter
      if (stateFilter !== 'all' && airport.state !== stateFilter) {
        return false;
      }

      // Search filter (search by code, name, or city)
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
  }, [allAirports, stateFilter, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAirportId) {
      setError('Please select an airport');
      return;
    }

    onSelect(selectedAirportId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            <CardTitle>Select Pickup Airport</CardTitle>
          </div>
          <CardDescription>Loading Southwest Cargo locations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (allAirports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            <CardTitle>No Airports Available</CardTitle>
          </div>
          <CardDescription>Southwest Cargo locations are not available</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              There are no Southwest Cargo locations available at this time. You can skip this step
              to see other shipping options.
            </AlertDescription>
          </Alert>

          <div className="mt-6 flex gap-3">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            {onSkip && (
              <Button type="button" onClick={onSkip} className="flex-1">
                Skip to Other Shipping Options
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
          <Plane className="h-6 w-6" />
          <CardTitle>Select Pickup Airport</CardTitle>
        </div>
        <CardDescription>
          Choose any Southwest Cargo location for pickup - you can pick up at any airport regardless
          of your shipping address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row">
            {/* State Filter */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="stateFilter">Filter by State</Label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger id="stateFilter">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States ({allAirports.length} airports)</SelectItem>
                  {availableStates.map((state) => {
                    const count = allAirports.filter((a) => a.state === state).length;
                    const stateName = US_STATES.find((s) => s.code === state)?.name || state;
                    return (
                      <SelectItem key={state} value={state}>
                        {stateName} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code, name, or city..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredAirports.length} of {allAirports.length} airports
          </p>

          {filteredAirports.length === 0 ? (
            <Alert>
              <AlertDescription>
                No airports match your filters. Try adjusting your search or selecting a different
                state.
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup value={selectedAirportId} onValueChange={setSelectedAirportId}>
              <div className="max-h-[400px] space-y-3 overflow-y-auto">
                {filteredAirports.map((airport) => (
                  <div
                    key={airport.id}
                    className={`relative flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                      selectedAirportId === airport.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={airport.id} id={airport.id} className="mt-1" />
                    <Label htmlFor={airport.id} className="flex-1 cursor-pointer">
                      <div className="space-y-2">
                        {/* Airport Name and Code */}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">
                            {airport.code} - {airport.name}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <div>
                            <p>{airport.address}</p>
                            <p>
                              {airport.city}, {airport.state} {airport.zip}
                            </p>
                          </div>
                        </div>

                        {/* Hours */}
                        {airport.hours && Object.keys(airport.hours).length > 0 && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="space-y-1">
                              {Object.entries(airport.hours).map(([day, hours]) => (
                                <p key={day}>
                                  <span className="font-medium">{day}:</span> {hours}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> You can pick up your order at any Southwest Cargo airport
              location. Shipping costs will be calculated based on the airport you select. You'll
              receive tracking information once your order is ready for pickup.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            {onSkip && (
              <Button type="button" variant="outline" onClick={onSkip}>
                Skip (Ship to Address)
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={!selectedAirportId}>
              Continue with Selected Airport
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
