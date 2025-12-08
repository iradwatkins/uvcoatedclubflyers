import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { trackEvent, EventType } from '@/lib/analytics/tracker';

/**
 * POST /api/analytics/track
 * Track a funnel event from the client
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      // No session, don't track
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const { eventType, eventData, pageUrl, referrer } = body;

    // Validate event type
    const validEventTypes: EventType[] = [
      'page_view',
      'product_view',
      'add_to_cart',
      'remove_from_cart',
      'cart_view',
      'checkout_start',
      'checkout_step',
      'checkout_complete',
      'order_bump_view',
      'order_bump_accept',
      'order_bump_decline',
      'upsell_view',
      'upsell_accept',
      'upsell_decline',
      'coupon_apply',
      'coupon_remove',
      'search',
      'filter_change',
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    await trackEvent({
      sessionId,
      eventType,
      eventData,
      pageUrl,
      referrer,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics Track] Error:', error);
    // Always return success to not break client
    return NextResponse.json({ success: true });
  }
}
