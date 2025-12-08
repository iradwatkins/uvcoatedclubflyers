'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tag, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppliedCoupon {
  code: string;
  name: string | null;
  discountType: string;
  discountValue: number;
  freeShipping: boolean;
}

interface CouponInputProps {
  onCouponApplied?: (discount: number, coupon: AppliedCoupon) => void;
  onCouponRemoved?: () => void;
  email?: string;
  className?: string;
  compact?: boolean;
}

export function CouponInput({
  onCouponApplied,
  onCouponRemoved,
  email,
  className,
  compact = false,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check for already applied coupon on mount
  useEffect(() => {
    checkAppliedCoupon();
  }, []);

  const checkAppliedCoupon = async () => {
    try {
      const response = await fetch('/api/coupons/apply');
      if (response.ok) {
        const data = await response.json();
        if (data.coupon) {
          setAppliedCoupon(data.coupon);
          setDiscount(data.discount || 0);
          setIsExpanded(true);
        }
      }
    } catch (err) {
      // Ignore errors on initial load
    }
  };

  const handleApplyCoupon = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // First validate
      const validateResponse = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        setError(validateData.error || 'Invalid coupon code');
        return;
      }

      // Then apply
      const applyResponse = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email }),
      });

      const applyData = await applyResponse.json();

      if (!applyResponse.ok) {
        setError(applyData.error || 'Failed to apply coupon');
        return;
      }

      setAppliedCoupon(applyData.coupon);
      setDiscount(applyData.discount);
      setCode('');

      if (onCouponApplied) {
        onCouponApplied(applyData.discount, applyData.coupon);
      }
    } catch (err) {
      setError('Failed to apply coupon. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setIsLoading(true);

    try {
      await fetch('/api/coupons/remove', { method: 'DELETE' });

      setAppliedCoupon(null);
      setDiscount(0);
      setError(null);

      if (onCouponRemoved) {
        onCouponRemoved();
      }
    } catch (err) {
      console.error('Failed to remove coupon:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDiscount = (coupon: AppliedCoupon) => {
    if (coupon.freeShipping) return 'Free Shipping';
    if (coupon.discountType === 'percentage') return `${coupon.discountValue}% off`;
    return `$${coupon.discountValue.toFixed(2)} off`;
  };

  // Compact view for sliding cart
  if (compact) {
    if (appliedCoupon) {
      return (
        <div className={cn('flex items-center justify-between p-2 bg-green-50 rounded-md border border-green-200', className)}>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{appliedCoupon.code}</span>
            <Badge variant="secondary" className="text-xs">
              {formatDiscount(appliedCoupon)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-green-600 hover:text-red-600"
            onClick={handleRemoveCoupon}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className={cn('flex gap-2', className)}>
        <Input
          placeholder="Coupon code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleApplyCoupon}
          disabled={isLoading || !code.trim()}
          className="h-8 px-3"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
        </Button>
      </div>
    );
  }

  // Full view for checkout
  return (
    <div className={cn('space-y-3', className)}>
      {/* Toggle button */}
      {!isExpanded && !appliedCoupon && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Tag className="h-4 w-4" />
          Have a coupon code?
        </button>
      )}

      {/* Applied coupon display */}
      {appliedCoupon && (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-700">{appliedCoupon.code}</span>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  {formatDiscount(appliedCoupon)}
                </Badge>
              </div>
              {appliedCoupon.name && (
                <p className="text-xs text-green-600">{appliedCoupon.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {discount > 0 && (
              <span className="text-lg font-bold text-green-600">-${discount.toFixed(2)}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              disabled={isLoading}
              className="text-green-600 hover:text-red-600 hover:bg-red-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Input form */}
      {isExpanded && !appliedCoupon && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter coupon code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                className={cn(
                  'pl-10',
                  error && 'border-red-500 focus-visible:ring-red-500'
                )}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleApplyCoupon}
              disabled={isLoading || !code.trim()}
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <X className="h-3 w-3" />
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setCode('');
              setError(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
