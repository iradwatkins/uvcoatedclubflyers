'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AddOnSubOptionField, AddOnSubOptionConfig } from './addon-sub-option-field';
import { cn } from '@/lib/utils';

export interface AddOn {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing_model: string;
  base_price: string;
  per_unit_price: string;
  percentage: string;
  ui_component: string;
  position: string;
  is_mandatory: boolean;
  is_enabled: boolean;
  display_order: number;
  subOptions?: AddOnSubOptionConfig[];
}

export interface AddOnWithSubOptionsProps {
  addOn: AddOn;
  isSelected: boolean;
  onToggle: (selected: boolean) => void;
  subOptionValues: Record<string, any>;
  onSubOptionChange: (fieldName: string, value: any) => void;
  quantity?: number;
  className?: string;
}

/**
 * Format price display for addon
 */
const formatAddOnPrice = (addOn: AddOn, quantity?: number): string => {
  const basePrice = parseFloat(addOn.base_price || '0');
  const perUnitPrice = parseFloat(addOn.per_unit_price || '0');
  const percentage = parseFloat(addOn.percentage || '0');

  switch (addOn.pricing_model) {
    case 'FLAT':
      if (basePrice > 0) {
        return `+$${basePrice.toFixed(2)}`;
      }
      return 'FREE';

    case 'PER_UNIT':
      if (perUnitPrice > 0) {
        if (quantity) {
          const total = perUnitPrice * quantity;
          return `+$${total.toFixed(2)} ($${perUnitPrice.toFixed(3)}/piece)`;
        }
        return `$${perUnitPrice.toFixed(3)}/piece`;
      }
      return '';

    case 'PERCENTAGE':
      if (percentage !== 0) {
        const sign = percentage > 0 ? '+' : '';
        return `${sign}${percentage}%`;
      }
      return '';

    case 'CUSTOM':
      // For custom pricing, show setup fee if available
      if (basePrice > 0 && perUnitPrice > 0) {
        return `$${basePrice.toFixed(2)} + $${perUnitPrice.toFixed(3)}/piece`;
      } else if (basePrice > 0) {
        return `$${basePrice.toFixed(2)}`;
      } else if (perUnitPrice > 0) {
        return `$${perUnitPrice.toFixed(3)}/piece`;
      }
      return 'Custom pricing';

    default:
      return '';
  }
};

/**
 * Component for rendering an addon with its sub-options
 * Supports expandable/collapsible sub-options panel
 */
export function AddOnWithSubOptions({
  addOn,
  isSelected,
  onToggle,
  subOptionValues,
  onSubOptionChange,
  quantity,
  className,
}: AddOnWithSubOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubOptions = addOn.subOptions && addOn.subOptions.length > 0;

  // Auto-expand when selected
  useEffect(() => {
    if (isSelected && hasSubOptions) {
      setIsExpanded(true);
    } else if (!isSelected) {
      setIsExpanded(false);
    }
  }, [isSelected, hasSubOptions]);

  // Sort sub-options by display order
  const sortedSubOptions = addOn.subOptions
    ? [...addOn.subOptions].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  const priceDisplay = formatAddOnPrice(addOn, quantity);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Main addon checkbox */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id={`addon-${addOn.id}`}
          checked={isSelected || addOn.is_mandatory}
          onCheckedChange={onToggle}
          disabled={addOn.is_mandatory}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label
              htmlFor={`addon-${addOn.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {addOn.name}
            </label>
            {addOn.is_mandatory && (
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            )}
            {priceDisplay && (
              <span className="text-xs text-muted-foreground font-medium">{priceDisplay}</span>
            )}
            {hasSubOptions && isSelected && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          {addOn.description && (
            <p className="text-xs text-muted-foreground mt-1">{addOn.description}</p>
          )}
        </div>
      </div>

      {/* Sub-options panel (collapsible) */}
      {hasSubOptions && isSelected && isExpanded && (
        <div className="ml-6 mt-3 space-y-4 border-l-2 border-primary/20 pl-4">
          {sortedSubOptions.map((subOption) => (
            <AddOnSubOptionField
              key={subOption.id}
              config={subOption}
              value={subOptionValues[subOption.fieldName]}
              onChange={(value) => onSubOptionChange(subOption.fieldName, value)}
              parentValues={subOptionValues}
            />
          ))}

          {/* Bundle calculation for Shrink Wrapping */}
          {addOn.slug === 'shrink-wrapping' && quantity && subOptionValues['bundle_size'] && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Bundle Calculation:
              </p>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p>• Total Items: {quantity.toLocaleString()}</p>
                <p>• Items per Bundle: {subOptionValues['bundle_size']}</p>
                <p className="font-medium">
                  • You'll receive: {Math.ceil(quantity / subOptionValues['bundle_size'])} bundles
                </p>
                {addOn.base_price && (
                  <p className="font-medium pt-2 border-t border-blue-200 dark:border-blue-800">
                    Total Cost: $
                    {(
                      Math.ceil(quantity / subOptionValues['bundle_size']) *
                      parseFloat(addOn.base_price)
                    ).toFixed(2)}
                    <span className="text-xs font-normal ml-1">
                      ({Math.ceil(quantity / subOptionValues['bundle_size'])} bundles × $
                      {parseFloat(addOn.base_price).toFixed(2)}/bundle)
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
