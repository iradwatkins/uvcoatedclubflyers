'use client';

import { useCallback } from 'react';

export type EventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'cart_view'
  | 'checkout_start'
  | 'checkout_step'
  | 'checkout_complete'
  | 'order_bump_view'
  | 'order_bump_accept'
  | 'order_bump_decline'
  | 'upsell_view'
  | 'upsell_accept'
  | 'upsell_decline'
  | 'coupon_apply'
  | 'coupon_remove'
  | 'search'
  | 'filter_change';

interface TrackOptions {
  eventType: EventType;
  eventData?: Record<string, unknown>;
}

/**
 * Hook for tracking analytics events from client components
 */
export function useAnalytics() {
  const track = useCallback(async (options: TrackOptions) => {
    try {
      const { eventType, eventData } = options;

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          eventData,
          pageUrl: window.location.href,
          referrer: document.referrer,
        }),
      });
    } catch (error) {
      // Silently fail - analytics should never break the UX
      console.debug('[Analytics] Tracking failed:', error);
    }
  }, []);

  // Convenience methods for common events
  const trackPageView = useCallback(
    (data?: Record<string, unknown>) =>
      track({ eventType: 'page_view', eventData: data }),
    [track]
  );

  const trackProductView = useCallback(
    (productId: string, productName: string, price: number) =>
      track({
        eventType: 'product_view',
        eventData: { productId, productName, price },
      }),
    [track]
  );

  const trackAddToCart = useCallback(
    (productId: string, productName: string, quantity: number, price: number) =>
      track({
        eventType: 'add_to_cart',
        eventData: { productId, productName, quantity, price },
      }),
    [track]
  );

  const trackRemoveFromCart = useCallback(
    (productId: string, productName: string) =>
      track({
        eventType: 'remove_from_cart',
        eventData: { productId, productName },
      }),
    [track]
  );

  const trackCheckoutStart = useCallback(
    (cartTotal: number, itemCount: number) =>
      track({
        eventType: 'checkout_start',
        eventData: { cartTotal, itemCount },
      }),
    [track]
  );

  const trackCheckoutStep = useCallback(
    (step: number, stepName: string) =>
      track({
        eventType: 'checkout_step',
        eventData: { step, stepName },
      }),
    [track]
  );

  const trackCheckoutComplete = useCallback(
    (orderId: string, orderTotal: number) =>
      track({
        eventType: 'checkout_complete',
        eventData: { orderId, orderTotal },
      }),
    [track]
  );

  const trackOrderBumpView = useCallback(
    (bumpId: number, bumpName: string) =>
      track({
        eventType: 'order_bump_view',
        eventData: { bumpId, bumpName },
      }),
    [track]
  );

  const trackOrderBumpAccept = useCallback(
    (bumpId: number, bumpName: string, price: number) =>
      track({
        eventType: 'order_bump_accept',
        eventData: { bumpId, bumpName, price },
      }),
    [track]
  );

  const trackOrderBumpDecline = useCallback(
    (bumpId: number, bumpName: string) =>
      track({
        eventType: 'order_bump_decline',
        eventData: { bumpId, bumpName },
      }),
    [track]
  );

  const trackCouponApply = useCallback(
    (code: string, discountAmount: number) =>
      track({
        eventType: 'coupon_apply',
        eventData: { code, discountAmount },
      }),
    [track]
  );

  const trackCouponRemove = useCallback(
    (code: string) =>
      track({
        eventType: 'coupon_remove',
        eventData: { code },
      }),
    [track]
  );

  const trackSearch = useCallback(
    (query: string, resultCount: number) =>
      track({
        eventType: 'search',
        eventData: { query, resultCount },
      }),
    [track]
  );

  return {
    track,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckoutStart,
    trackCheckoutStep,
    trackCheckoutComplete,
    trackOrderBumpView,
    trackOrderBumpAccept,
    trackOrderBumpDecline,
    trackCouponApply,
    trackCouponRemove,
    trackSearch,
  };
}
