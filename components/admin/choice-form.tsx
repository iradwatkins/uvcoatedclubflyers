'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Save } from 'lucide-react';

interface ChoiceFormProps {
  addOnId: number;
  initialData?: {
    id: number;
    value: string;
    label: string;
    description: string | null;
    price_type: string;
    base_price: string;
    per_unit_price: string;
    percentage: string;
    requires_file_upload: boolean;
    requires_sides_selection: boolean;
    sides_pricing: any;
    display_order: number;
    is_default: boolean;
    is_active: boolean;
  };
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
}

export function ChoiceForm({ addOnId, initialData, mode = 'create', onSuccess }: ChoiceFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [value, setValue] = useState(initialData?.value || '');
  const [label, setLabel] = useState(initialData?.label || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priceType, setPriceType] = useState(initialData?.price_type || 'flat');
  const [basePrice, setBasePrice] = useState(
    initialData?.base_price ? parseFloat(initialData.base_price) : 0
  );
  const [perUnitPrice, setPerUnitPrice] = useState(
    initialData?.per_unit_price ? parseFloat(initialData.per_unit_price) : 0
  );
  const [percentage, setPercentage] = useState(
    initialData?.percentage ? parseFloat(initialData.percentage) : 0
  );
  const [requiresFileUpload, setRequiresFileUpload] = useState(
    initialData?.requires_file_upload || false
  );
  const [requiresSidesSelection, setRequiresSidesSelection] = useState(
    initialData?.requires_sides_selection || false
  );
  const [sidesPricingOne, setSidesPricingOne] = useState(() => {
    if (initialData?.sides_pricing) {
      const sp = typeof initialData.sides_pricing === 'string'
        ? JSON.parse(initialData.sides_pricing)
        : initialData.sides_pricing;
      return sp.one || 0;
    }
    return 0;
  });
  const [sidesPricingTwo, setSidesPricingTwo] = useState(() => {
    if (initialData?.sides_pricing) {
      const sp = typeof initialData.sides_pricing === 'string'
        ? JSON.parse(initialData.sides_pricing)
        : initialData.sides_pricing;
      return sp.two || 0;
    }
    return 0;
  });
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order || 0);
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);
  const [isActive, setIsActive] = useState(initialData?.is_active !== false);

  // Auto-generate value from label
  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    if (mode === 'create' && !value) {
      const slug = newLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setValue(slug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!value.trim() || !label.trim()) {
      setError('Value and label are required');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        value: value.trim(),
        label: label.trim(),
        description: description.trim() || null,
        priceType,
        basePrice,
        perUnitPrice,
        percentage,
        requiresFileUpload,
        requiresSidesSelection,
        sidesPricing: requiresSidesSelection
          ? { one: sidesPricingOne, two: sidesPricingTwo }
          : null,
        displayOrder,
        isDefault,
        isActive,
      };

      const url = mode === 'create'
        ? `/api/addons/${addOnId}/choices`
        : `/api/addons/${addOnId}/choices/${initialData?.id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save choice');
      }

      setSuccess(true);

      if (mode === 'create') {
        // Reset form
        setValue('');
        setLabel('');
        setDescription('');
        setPriceType('flat');
        setBasePrice(0);
        setPerUnitPrice(0);
        setPercentage(0);
        setRequiresFileUpload(false);
        setRequiresSidesSelection(false);
        setSidesPricingOne(0);
        setSidesPricingTwo(0);
        setDisplayOrder(0);
        setIsDefault(false);
        setIsActive(true);
      }

      router.refresh();
      if (onSuccess) onSuccess();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription className="text-green-700">
            Choice {mode === 'create' ? 'created' : 'updated'} successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">
            Display Label <span className="text-red-500">*</span>
          </Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g., Upload My Artwork"
          />
        </div>

        {/* Value */}
        <div className="space-y-2">
          <Label htmlFor="value">
            Internal Value <span className="text-red-500">*</span>
          </Label>
          <Input
            id="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g., upload-my-artwork"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier (auto-generated from label)
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Helper text shown when this option is selected"
          rows={2}
        />
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="font-semibold">Pricing</h3>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="priceType">Price Type</Label>
            <Select value={priceType} onValueChange={setPriceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat Price</SelectItem>
                <SelectItem value="per_unit">Per Unit</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="custom">Custom (Sides-based)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(priceType === 'flat' || priceType === 'custom') && (
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price ($)</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {priceType === 'per_unit' && (
            <div className="space-y-2">
              <Label htmlFor="perUnitPrice">Per Unit Price ($)</Label>
              <Input
                id="perUnitPrice"
                type="number"
                step="0.0001"
                min="0"
                value={perUnitPrice}
                onChange={(e) => setPerUnitPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {priceType === 'percentage' && (
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentage (%)</Label>
              <Input
                id="percentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Behaviors */}
      <div className="space-y-4">
        <h3 className="font-semibold">Behaviors</h3>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresFileUpload"
              checked={requiresFileUpload}
              onCheckedChange={(checked) => setRequiresFileUpload(checked as boolean)}
            />
            <Label htmlFor="requiresFileUpload" className="font-normal cursor-pointer">
              Show file upload when selected
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresSidesSelection"
              checked={requiresSidesSelection}
              onCheckedChange={(checked) => setRequiresSidesSelection(checked as boolean)}
            />
            <Label htmlFor="requiresSidesSelection" className="font-normal cursor-pointer">
              Show sides selection when selected
            </Label>
          </div>

          {requiresSidesSelection && (
            <div className="ml-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sidesPricingOne">One Side Price ($)</Label>
                <Input
                  id="sidesPricingOne"
                  type="number"
                  step="0.01"
                  min="0"
                  value={sidesPricingOne}
                  onChange={(e) => setSidesPricingOne(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sidesPricingTwo">Two Sides Price ($)</Label>
                <Input
                  id="sidesPricingTwo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={sidesPricingTwo}
                  onChange={(e) => setSidesPricingTwo(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            min="0"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="isDefault"
            checked={isDefault}
            onCheckedChange={(checked) => setIsDefault(checked as boolean)}
          />
          <Label htmlFor="isDefault" className="font-normal cursor-pointer">
            Default selection
          </Label>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(checked as boolean)}
          />
          <Label htmlFor="isActive" className="font-normal cursor-pointer">
            Active
          </Label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === 'create' ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Choice
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
