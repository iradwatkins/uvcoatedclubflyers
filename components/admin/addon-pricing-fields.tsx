'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface AddonPricingFieldsProps {
  pricingModel: string;
  basePrice: number | '';
  perUnitPrice: number | '';
  percentage: number | '';
  onBasePriceChange: (value: number | '') => void;
  onPerUnitPriceChange: (value: number | '') => void;
  onPercentageChange: (value: number | '') => void;
  errors?: {
    basePrice?: string;
    perUnitPrice?: string;
    percentage?: string;
  };
}

/**
 * Dynamic pricing input fields based on selected pricing model
 * FLAT: Base Price only
 * PERCENTAGE: Percentage only (can be negative)
 * PER_UNIT: Per Unit Price only
 * CUSTOM: Both Base Price and Per Unit Price
 */
export function AddonPricingFields({
  pricingModel,
  basePrice,
  perUnitPrice,
  percentage,
  onBasePriceChange,
  onPerUnitPriceChange,
  onPercentageChange,
  errors = {},
}: AddonPricingFieldsProps) {
  const handleNumberInput = (
    value: string,
    onChange: (val: number | '') => void,
    allowNegative: boolean = false
  ) => {
    if (value === '') {
      onChange('');
      return;
    }

    const num = parseFloat(value);
    if (isNaN(num)) return;

    if (!allowNegative && num < 0) return;

    onChange(num);
  };

  // Helper text based on pricing model
  const getPricingHelp = () => {
    switch (pricingModel) {
      case 'FLAT':
        return 'Fixed price added to order total (e.g., $5.00 for Digital Proof)';
      case 'PERCENTAGE':
        return 'Percentage markup or discount on base price. Use negative values for discounts (e.g., -5 for 5% off)';
      case 'PER_UNIT':
        return 'Price per piece/unit (e.g., $0.10 per piece for Numbering)';
      case 'CUSTOM':
        return 'Combination of setup fee + per-unit price (e.g., $20 setup + $0.01/piece for Perforation)';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Helper Text */}
      {pricingModel && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{getPricingHelp()}</AlertDescription>
        </Alert>
      )}

      {/* FLAT Pricing */}
      {pricingModel === 'FLAT' && (
        <div className="space-y-2">
          <Label htmlFor="basePrice">
            Base Price <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-muted-foreground">$</span>
            <Input
              id="basePrice"
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(e) => handleNumberInput(e.target.value, onBasePriceChange)}
              placeholder="0.00"
              className="max-w-xs"
            />
          </div>
          {errors.basePrice && <p className="text-sm text-red-500">{errors.basePrice}</p>}
        </div>
      )}

      {/* PERCENTAGE Pricing */}
      {pricingModel === 'PERCENTAGE' && (
        <div className="space-y-2">
          <Label htmlFor="percentage">
            Percentage <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="percentage"
              type="number"
              step="0.01"
              value={percentage}
              onChange={(e) => handleNumberInput(e.target.value, onPercentageChange, true)}
              placeholder="0.00"
              className="max-w-xs"
            />
            <span className="text-lg font-semibold text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Use positive values for markups (+20 = +20%) or negative values for discounts (-5 = -5%)
          </p>
          {errors.percentage && <p className="text-sm text-red-500">{errors.percentage}</p>}
        </div>
      )}

      {/* PER_UNIT Pricing */}
      {pricingModel === 'PER_UNIT' && (
        <div className="space-y-2">
          <Label htmlFor="perUnitPrice">
            Per Unit Price <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-muted-foreground">$</span>
            <Input
              id="perUnitPrice"
              type="number"
              min="0"
              step="0.0001"
              value={perUnitPrice}
              onChange={(e) => handleNumberInput(e.target.value, onPerUnitPriceChange)}
              placeholder="0.0000"
              className="max-w-xs"
            />
            <span className="text-sm text-muted-foreground">per piece</span>
          </div>
          {errors.perUnitPrice && <p className="text-sm text-red-500">{errors.perUnitPrice}</p>}
        </div>
      )}

      {/* CUSTOM Pricing */}
      {pricingModel === 'CUSTOM' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customBasePrice">Setup Fee / Base Price</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted-foreground">$</span>
              <Input
                id="customBasePrice"
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => handleNumberInput(e.target.value, onBasePriceChange)}
                placeholder="0.00"
                className="max-w-xs"
              />
            </div>
            {errors.basePrice && <p className="text-sm text-red-500">{errors.basePrice}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customPerUnitPrice">Per Unit Price</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted-foreground">$</span>
              <Input
                id="customPerUnitPrice"
                type="number"
                min="0"
                step="0.0001"
                value={perUnitPrice}
                onChange={(e) => handleNumberInput(e.target.value, onPerUnitPriceChange)}
                placeholder="0.0000"
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">per piece</span>
            </div>
            {errors.perUnitPrice && <p className="text-sm text-red-500">{errors.perUnitPrice}</p>}
          </div>

          <p className="text-xs text-muted-foreground">
            At least one price field is required for custom pricing. Formula will be: Base Price +
            (Per Unit Price × Quantity)
          </p>
        </div>
      )}

      {/* No pricing model selected */}
      {!pricingModel && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Select a pricing model to configure pricing
          </p>
        </div>
      )}
    </div>
  );
}
