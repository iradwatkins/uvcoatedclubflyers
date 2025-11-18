'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Info } from 'lucide-react';

interface AddOn {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing_model: string;
  pricing_amount: number;
  pricing_details: string;
  is_assigned: boolean;
  display_order: number;
}

interface ProductAddOnsManagerProps {
  productId: number;
  productName: string;
}

export function ProductAddOnsManager({ productId, productName }: ProductAddOnsManagerProps) {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAddOns();
  }, [productId]);

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}/addons`);
      const data = await response.json();

      if (data.success) {
        setAddOns(data.addOns);
        setSelectedAddOnIds(
          data.addOns.filter((a: AddOn) => a.is_assigned).map((a: AddOn) => a.id)
        );
      }
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      setMessage({ type: 'error', text: 'Failed to load add-ons' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAddOn = (addOnId: number) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(`/api/admin/products/${productId}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addOnIds: selectedAddOnIds }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Add-ons updated successfully!' });
        await fetchAddOns();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update add-ons' });
      }
    } catch (error) {
      console.error('Error saving add-ons:', error);
      setMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const getPricingDisplay = (addOn: AddOn) => {
    const amount = parseFloat(String(addOn.pricing_amount || 0));

    switch (addOn.pricing_model?.toUpperCase()) {
      case 'FLAT':
        return `$${amount.toFixed(2)} flat`;
      case 'PER_UNIT':
        return `$${amount.toFixed(4)}/unit`;
      case 'PERCENTAGE':
        return `${amount}% of total`;
      case 'CUSTOM':
        return addOn.pricing_details || 'Custom pricing';
      case 'FREE':
        return 'Free';
      default:
        return 'N/A';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading add-ons...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Add-Ons to {productName}</CardTitle>
          <CardDescription>
            Select which add-ons should be available for this product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Selected add-ons will appear in the product configurator for customers. Display order
              is set by add-on display_order value.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Add-Ons List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Add-Ons</CardTitle>
              <CardDescription>
                {selectedAddOnIds.length} of {addOns.length} selected
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {addOns.map((addOn) => (
              <div
                key={addOn.id}
                className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50"
              >
                <Checkbox
                  id={`addon-${addOn.id}`}
                  checked={selectedAddOnIds.includes(addOn.id)}
                  onCheckedChange={() => handleToggleAddOn(addOn.id)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`addon-${addOn.id}`}
                    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    <div className="flex items-center gap-2">
                      <span>{addOn.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getPricingDisplay(addOn)}
                      </Badge>
                    </div>
                    {addOn.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{addOn.description}</p>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>

          {addOns.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No add-ons available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
