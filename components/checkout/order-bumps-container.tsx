'use client';

import { useState, useEffect } from 'react';
import { OrderBump } from './order-bump';
import { useAnalytics } from '@/lib/analytics/use-analytics';

interface OrderBumpData {
  id: number;
  name: string;
  productId: number | null;
  headline: string;
  description: string | null;
  checkboxLabel: string;
  imageUrl: string | null;
  displayPosition: string;
  layout: string;
  backgroundColor: string;
  borderColor: string;
  highlightText: string | null;
  productName: string | null;
  originalPrice: number;
  finalPrice: number;
  discountType: string;
  discountValue: number;
  savings: number;
}

interface OrderBumpsContainerProps {
  position?: 'before_payment' | 'after_order_summary' | 'in_order_summary';
  onBumpAccepted?: (cart: unknown) => void;
}

export function OrderBumpsContainer({
  position = 'before_payment',
  onBumpAccepted,
}: OrderBumpsContainerProps) {
  const analytics = useAnalytics();
  const [bumps, setBumps] = useState<OrderBumpData[]>([]);
  const [loadingBumpId, setLoadingBumpId] = useState<number | null>(null);
  const [acceptedBumpIds, setAcceptedBumpIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBumps();
  }, []);

  const fetchBumps = async () => {
    try {
      const response = await fetch('/api/order-bumps/evaluate');
      if (!response.ok) throw new Error('Failed to fetch bumps');

      const data = await response.json();
      setBumps(data.bumps || []);

      // Track impressions for all fetched bumps
      if (data.bumps && data.bumps.length > 0) {
        data.bumps.forEach((bump: OrderBumpData) => {
          analytics.trackOrderBumpView(bump.id, bump.name);
        });
      }
    } catch (error) {
      console.error('[OrderBumps] Fetch error:', error);
      setBumps([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBump = async (bumpId: number) => {
    const bump = bumps.find((b) => b.id === bumpId);
    if (!bump) return;

    setLoadingBumpId(bumpId);

    try {
      const response = await fetch('/api/order-bumps/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bumpId,
          finalPrice: bump.finalPrice,
          originalPrice: bump.originalPrice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept bump');
      }

      const data = await response.json();

      // Mark as accepted
      setAcceptedBumpIds((prev) => new Set(prev).add(bumpId));

      // Track bump acceptance
      analytics.trackOrderBumpAccept(bump.id, bump.name, bump.finalPrice);

      // Notify parent of cart update
      if (onBumpAccepted && data.cart) {
        onBumpAccepted(data.cart);
      }
    } catch (error) {
      console.error('[OrderBumps] Accept error:', error);
      // Reset checkbox state on error
    } finally {
      setLoadingBumpId(null);
    }
  };

  // Filter bumps by position
  const filteredBumps = bumps.filter((bump) => bump.displayPosition === position);

  // Don't render if no bumps or still loading
  if (isLoading) {
    return null; // Or a subtle loading state
  }

  if (filteredBumps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {filteredBumps.map((bump) => (
        <OrderBump
          key={bump.id}
          id={bump.id}
          headline={bump.headline}
          description={bump.description}
          checkboxLabel={bump.checkboxLabel}
          imageUrl={bump.imageUrl}
          productName={bump.productName}
          originalPrice={bump.originalPrice}
          finalPrice={bump.finalPrice}
          discountType={bump.discountType}
          discountValue={bump.discountValue}
          savings={bump.savings}
          layout={bump.layout}
          backgroundColor={bump.backgroundColor}
          borderColor={bump.borderColor}
          highlightText={bump.highlightText}
          onAccept={handleAcceptBump}
          isLoading={loadingBumpId === bump.id}
          isAccepted={acceptedBumpIds.has(bump.id)}
        />
      ))}
    </div>
  );
}
