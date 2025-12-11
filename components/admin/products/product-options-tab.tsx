'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

interface AddOn {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing_model: string;
  base_price: string;
  per_unit_price: string;
  percentage: string;
  ui_component: string;
  is_assigned: boolean;
  is_default: boolean;
  display_order: number;
}

interface ProductOptionsTabProps {
  productId?: number;
}

export function ProductOptionsTab({ productId }: ProductOptionsTabProps) {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);

  // Fetch add-ons when component mounts
  useEffect(() => {
    if (!productId) return;

    const fetchAddOns = async () => {
      try {
        const response = await fetch(`/api/admin/products/${productId}/addons`);
        const data = await response.json();

        if (data.success) {
          setAddOns(data.addOns);
          // Set initially selected add-ons
          const assigned = data.addOns
            .filter((addon: AddOn) => addon.is_assigned)
            .map((addon: AddOn) => addon.id);
          setSelectedAddOns(assigned);
        }
      } catch (error) {
        console.error('Failed to fetch add-ons:', error);
        setMessage({ type: 'error', text: 'Failed to load add-ons' });
      } finally {
        setLoading(false);
      }
    };

    fetchAddOns();
  }, [productId]);

  const handleToggleAddOn = (addOnId: number) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
  };

  const handleSelectAll = () => {
    setSelectedAddOns(addOns.map((addon) => addon.id));
  };

  const handleDeselectAll = () => {
    setSelectedAddOns([]);
  };

  const handleSave = async () => {
    if (!productId) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addOnIds: selectedAddOns }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Add-ons saved successfully!' });
        // Update the is_assigned status locally
        setAddOns((prev) =>
          prev.map((addon) => ({
            ...addon,
            is_assigned: selectedAddOns.includes(addon.id),
          }))
        );
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save add-ons' });
      }
    } catch (error) {
      console.error('Failed to save add-ons:', error);
      setMessage({ type: 'error', text: 'Failed to save add-ons' });
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (addon: AddOn) => {
    const basePrice = parseFloat(addon.base_price) || 0;
    const perUnit = parseFloat(addon.per_unit_price) || 0;
    const percentage = parseFloat(addon.percentage) || 0;

    switch (addon.pricing_model) {
      case 'FLAT':
        return basePrice > 0 ? `$${basePrice.toFixed(2)} flat` : 'Free';
      case 'PER_UNIT':
        return perUnit > 0 ? `$${perUnit.toFixed(4)}/unit` : 'Free';
      case 'PERCENTAGE':
        return percentage > 0 ? `${percentage}%` : 'Free';
      case 'CUSTOM':
        return 'Custom pricing';
      default:
        return 'Variable';
    }
  };

  if (!productId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Save the product first to configure add-ons.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading add-ons...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Add-ons</CardTitle>
              <CardDescription>
                Select which add-ons are available for this product. Customers will see these options
                when configuring their order.
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
                  Save Add-ons
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
            <span className="ml-auto text-sm text-muted-foreground">
              {selectedAddOns.length} of {addOns.length} selected
            </span>
          </div>

          {addOns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No add-ons available. Create add-ons in the Add-ons management section first.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {addOns.map((addon) => (
                <div
                  key={addon.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAddOns.includes(addon.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleToggleAddOn(addon.id)}
                >
                  <Checkbox
                    id={`addon-${addon.id}`}
                    checked={selectedAddOns.includes(addon.id)}
                    onCheckedChange={() => handleToggleAddOn(addon.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={`addon-${addon.id}`}
                      className="cursor-pointer font-medium block"
                    >
                      {addon.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {addon.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {formatPrice(addon)}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                        {addon.ui_component}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
