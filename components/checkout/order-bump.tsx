'use client';

import { useState } from 'react';
import { Check, Gift, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface OrderBumpProps {
  id: number;
  headline: string;
  description: string | null;
  checkboxLabel: string;
  imageUrl: string | null;
  productName: string | null;
  originalPrice: number;
  finalPrice: number;
  discountType: string;
  discountValue: number;
  savings: number;
  layout: string;
  backgroundColor: string;
  borderColor: string;
  highlightText: string | null;
  onAccept: (bumpId: number) => Promise<void>;
  isLoading?: boolean;
  isAccepted?: boolean;
}

export function OrderBump({
  id,
  headline,
  description,
  checkboxLabel,
  imageUrl,
  productName,
  originalPrice,
  finalPrice,
  savings,
  layout,
  backgroundColor,
  borderColor,
  highlightText,
  onAccept,
  isLoading = false,
  isAccepted = false,
}: OrderBumpProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = async () => {
    if (isAccepted || isLoading) return;

    setIsChecked(true);
    await onAccept(id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Layout 1: Classic with image on left
  if (layout === 'layout_1') {
    return (
      <div
        className={cn(
          'relative rounded-lg border-2 p-4 transition-all duration-200',
          isAccepted ? 'opacity-60' : 'hover:shadow-md cursor-pointer',
          isChecked && !isAccepted && 'ring-2 ring-primary'
        )}
        style={{
          backgroundColor: isAccepted ? '#f0fdf4' : backgroundColor,
          borderColor: isAccepted ? '#22c55e' : borderColor,
        }}
        onClick={!isAccepted && !isLoading ? handleCheckboxChange : undefined}
      >
        {highlightText && !isAccepted && (
          <div
            className="absolute -top-3 left-4 px-3 py-1 text-xs font-bold text-white rounded-full flex items-center gap-1"
            style={{ backgroundColor: borderColor }}
          >
            <Sparkles className="h-3 w-3" />
            {highlightText}
          </div>
        )}

        <div className="flex gap-4">
          {imageUrl && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-white">
              <Image
                src={imageUrl}
                alt={productName || headline}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base mb-1">{headline}</h4>
            {description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{description}</p>
            )}

            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  isChecked || isAccepted
                    ? 'bg-green-500 border-green-500'
                    : 'bg-white border-gray-300'
                )}
              >
                {(isChecked || isAccepted) && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm font-medium flex-1">{checkboxLabel}</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            {savings > 0 && (
              <p className="text-xs text-muted-foreground line-through">{formatPrice(originalPrice)}</p>
            )}
            <p className="text-xl font-bold text-primary">{formatPrice(finalPrice)}</p>
            {savings > 0 && (
              <p className="text-xs font-medium text-green-600">Save {formatPrice(savings)}</p>
            )}
          </div>
        </div>

        {isAccepted && (
          <div className="absolute inset-0 rounded-lg bg-green-500/10 flex items-center justify-center">
            <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
              <Check className="h-5 w-5" />
              Added to Order!
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 rounded-lg bg-white/50 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    );
  }

  // Layout 2: Highlighted box with urgency (default)
  return (
    <div
      className={cn(
        'relative rounded-lg border-2 overflow-hidden transition-all duration-200',
        isAccepted ? 'opacity-60' : 'hover:shadow-lg cursor-pointer',
        isChecked && !isAccepted && 'ring-2 ring-primary'
      )}
      style={{
        borderColor: isAccepted ? '#22c55e' : borderColor,
      }}
      onClick={!isAccepted && !isLoading ? handleCheckboxChange : undefined}
    >
      {/* Header strip */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: borderColor }}
      >
        <div className="flex items-center gap-2 text-white">
          <Gift className="h-4 w-4" />
          <span className="font-bold text-sm">{highlightText || 'SPECIAL OFFER'}</span>
        </div>
        {savings > 0 && (
          <span className="text-white text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
            Save {formatPrice(savings)}
          </span>
        )}
      </div>

      {/* Content */}
      <div
        className="p-4"
        style={{ backgroundColor: isAccepted ? '#f0fdf4' : backgroundColor }}
      >
        <div className="flex gap-4">
          {imageUrl && (
            <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-white shadow-sm">
              <Image
                src={imageUrl}
                alt={productName || headline}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg mb-1">{headline}</h4>
            {description && (
              <p className="text-sm text-muted-foreground mb-3">{description}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                    isChecked || isAccepted
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  )}
                >
                  {(isChecked || isAccepted) && <Check className="h-4 w-4 text-white" />}
                </div>
                <span className="text-sm font-medium">{checkboxLabel}</span>
              </div>

              <div className="text-right">
                {savings > 0 && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatPrice(originalPrice)}
                  </p>
                )}
                <p className="text-2xl font-bold" style={{ color: borderColor }}>
                  {formatPrice(finalPrice)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAccepted && (
        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg">
            <Check className="h-5 w-5" />
            Added to Your Order!
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
