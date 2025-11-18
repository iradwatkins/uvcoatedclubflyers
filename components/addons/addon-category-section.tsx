'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AddOnWithSubOptions, AddOn } from './addon-with-sub-options';
import { cn } from '@/lib/utils';

export interface AddOnCategorySectionProps {
  title: string;
  description?: string;
  addOns: AddOn[];
  selectedAddOnIds: number[];
  onToggleAddOn: (addOnId: number, selected: boolean) => void;
  subOptionValues: Record<number, Record<string, any>>; // addOnId -> field values
  onSubOptionChange: (addOnId: number, fieldName: string, value: any) => void;
  quantity?: number;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Define addon categories based on documentation
 */
export const ADDON_CATEGORIES = {
  FINISHING: {
    title: 'Finishing Options',
    description: 'Professional finishing services for your prints',
    slugs: [
      'perforation',
      'score-only',
      'folding',
      'corner-rounding',
      'hole-drilling',
      'wafer-seal',
    ],
  },
  PACKAGING: {
    title: 'Packaging & Bundling',
    description: 'Bundle and protect your prints',
    slugs: ['banding', 'shrink-wrapping'],
  },
  PERSONALIZATION: {
    title: 'Personalization',
    description: 'Add unique data to each piece',
    slugs: ['variable-data-printing', 'numbering', 'qr-code'],
  },
  PREMIUM: {
    title: 'Premium Finishes',
    description: 'Luxury enhancements for standout prints',
    slugs: ['foil-stamping', 'spot-uv'],
  },
  MAILING: {
    title: 'Mailing Services',
    description: 'Complete mailing and delivery solutions',
    slugs: ['postal-delivery-ddu', 'eddm-process-postage'],
  },
  PRICING: {
    title: 'Pricing Adjustments',
    description: 'Discounts and special pricing options',
    slugs: ['our-tagline', 'exact-size'],
  },
  PROOFS: {
    title: 'Proofs & Quality Control',
    description: 'Ensure your prints are perfect before production',
    slugs: ['digital-proof'],
  },
} as const;

/**
 * Component for displaying a category of addons
 * Supports collapsible sections
 */
export function AddOnCategorySection({
  title,
  description,
  addOns,
  selectedAddOnIds,
  onToggleAddOn,
  subOptionValues,
  onSubOptionChange,
  quantity,
  defaultExpanded = true,
  className,
}: AddOnCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (addOns.length === 0) {
    return null;
  }

  // Sort addons by display order
  const sortedAddOns = [...addOns].sort((a, b) => a.display_order - b.display_order);

  return (
    <Card className={cn('', className)}>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {sortedAddOns.map((addOn) => {
            const isSelected = selectedAddOnIds.includes(addOn.id);
            const subOptions = subOptionValues[addOn.id] || {};

            return (
              <AddOnWithSubOptions
                key={addOn.id}
                addOn={addOn}
                isSelected={isSelected}
                onToggle={(selected) => onToggleAddOn(addOn.id, selected)}
                subOptionValues={subOptions}
                onSubOptionChange={(fieldName, value) =>
                  onSubOptionChange(addOn.id, fieldName, value)
                }
                quantity={quantity}
              />
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Helper function to categorize addons by slug
 */
export function categorizeAddOns(addOns: AddOn[]): Record<string, AddOn[]> {
  const categorized: Record<string, AddOn[]> = {
    FINISHING: [],
    PACKAGING: [],
    PERSONALIZATION: [],
    PREMIUM: [],
    MAILING: [],
    PRICING: [],
    PROOFS: [],
    OTHER: [],
  };

  addOns.forEach((addOn) => {
    let found = false;

    for (const [categoryKey, categoryInfo] of Object.entries(ADDON_CATEGORIES)) {
      if (categoryInfo.slugs.includes(addOn.slug)) {
        categorized[categoryKey].push(addOn);
        found = true;
        break;
      }
    }

    if (!found) {
      categorized.OTHER.push(addOn);
    }
  });

  return categorized;
}
