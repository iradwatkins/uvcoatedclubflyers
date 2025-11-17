'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plane, MapPin, Clock } from 'lucide-react';

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
  state: string;
  onSelect: (airportId: string) => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function AirportSelector({ state, onSelect, onBack, onSkip }: AirportSelectorProps) {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [selectedAirportId, setSelectedAirportId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAirports();
  }, [state]);

  const fetchAirports = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`/api/shipping/airports?state=${state}`);

      if (!response.ok) {
        throw new Error('Failed to fetch airports');
      }

      const data = await response.json();

      if (data.success && data.airports) {
        setAirports(data.airports);

        // Auto-select first airport if only one available
        if (data.airports.length === 1) {
          setSelectedAirportId(data.airports[0].id);
        }
      }
    } catch (err) {
      console.error('Airport fetch error:', err);
      setError('Unable to load airports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (airports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            <CardTitle>No Airports Available</CardTitle>
          </div>
          <CardDescription>
            Southwest Cargo is not available in {state}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              There are no Southwest Cargo locations in your state. You can skip this step to see other shipping options.
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
          Choose a Southwest Cargo location for pickup ({airports.length} available in {state})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <RadioGroup value={selectedAirportId} onValueChange={setSelectedAirportId}>
            <div className="space-y-3">
              {airports.map((airport) => (
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

          <Alert>
            <AlertDescription>
              You'll pick up your order at the selected Southwest Cargo location.
              You'll receive tracking information once your order is ready for pickup.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={!selectedAirportId}>
              Continue to Shipping Method
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
