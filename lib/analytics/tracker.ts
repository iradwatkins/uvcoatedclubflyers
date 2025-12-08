import { sql } from '@/lib/db';
import { headers } from 'next/headers';

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

export interface TrackEventOptions {
  sessionId: string;
  userId?: number | null;
  eventType: EventType;
  eventData?: Record<string, unknown>;
  pageUrl?: string;
  referrer?: string;
}

/**
 * Extract UTM parameters from URL
 */
function extractUTMParams(url: string): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
} {
  try {
    const urlObj = new URL(url);
    return {
      utmSource: urlObj.searchParams.get('utm_source') || undefined,
      utmMedium: urlObj.searchParams.get('utm_medium') || undefined,
      utmCampaign: urlObj.searchParams.get('utm_campaign') || undefined,
      utmTerm: urlObj.searchParams.get('utm_term') || undefined,
      utmContent: urlObj.searchParams.get('utm_content') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) {
      return 'tablet';
    }
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Track a funnel event server-side
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
  const { sessionId, userId, eventType, eventData, pageUrl, referrer } = options;

  try {
    // Get request headers for additional info
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const fullUrl = pageUrl || headersList.get('referer') || '';
    const deviceType = detectDeviceType(userAgent);

    // Extract UTM params from URL
    const utmParams = extractUTMParams(fullUrl);

    await sql`
      INSERT INTO funnel_events (
        session_id,
        user_id,
        event_type,
        event_data,
        page_url,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        device_type
      ) VALUES (
        ${sessionId},
        ${userId || null},
        ${eventType},
        ${JSON.stringify(eventData || {})}::jsonb,
        ${fullUrl || null},
        ${referrer || null},
        ${utmParams.utmSource || null},
        ${utmParams.utmMedium || null},
        ${utmParams.utmCampaign || null},
        ${deviceType}
      )
    `;
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
    // Don't throw - analytics should never break the main flow
  }
}

/**
 * Track revenue attribution for an order
 */
export async function trackRevenue(options: {
  sessionId: string;
  orderId: number;
  revenue: number;
  source?: string;
  medium?: string;
  campaign?: string;
}): Promise<void> {
  const { sessionId, orderId, revenue, source, medium, campaign } = options;

  try {
    await sql`
      INSERT INTO revenue_attribution (
        order_id,
        session_id,
        utm_source,
        utm_medium,
        utm_campaign,
        revenue
      ) VALUES (
        ${orderId},
        ${sessionId},
        ${source || 'direct'},
        ${medium || 'none'},
        ${campaign || null},
        ${revenue}
      )
    `;
  } catch (error) {
    console.error('[Analytics] Error tracking revenue:', error);
  }
}

/**
 * Get funnel metrics for a date range
 */
export async function getFunnelMetrics(startDate: Date, endDate: Date) {
  const metrics = await sql`
    WITH funnel_stages AS (
      SELECT
        DATE(created_at) as date,
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) as page_views,
        COUNT(DISTINCT CASE WHEN event_type = 'product_view' THEN session_id END) as product_views,
        COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN session_id END) as add_to_cart,
        COUNT(DISTINCT CASE WHEN event_type = 'checkout_start' THEN session_id END) as checkout_starts,
        COUNT(DISTINCT CASE WHEN event_type = 'checkout_complete' THEN session_id END) as conversions
      FROM funnel_events
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
    )
    SELECT
      date,
      page_views,
      product_views,
      add_to_cart,
      checkout_starts,
      conversions,
      CASE WHEN page_views > 0
        THEN ROUND((product_views::numeric / page_views * 100), 2)
        ELSE 0
      END as product_view_rate,
      CASE WHEN product_views > 0
        THEN ROUND((add_to_cart::numeric / product_views * 100), 2)
        ELSE 0
      END as add_to_cart_rate,
      CASE WHEN add_to_cart > 0
        THEN ROUND((checkout_starts::numeric / add_to_cart * 100), 2)
        ELSE 0
      END as checkout_rate,
      CASE WHEN checkout_starts > 0
        THEN ROUND((conversions::numeric / checkout_starts * 100), 2)
        ELSE 0
      END as conversion_rate
    FROM funnel_stages
    ORDER BY date DESC
  `;

  return metrics;
}

/**
 * Get order bump performance metrics
 */
export async function getOrderBumpMetrics(startDate: Date, endDate: Date) {
  const metrics = await sql`
    SELECT
      ob.id,
      ob.name,
      ob.headline,
      COUNT(CASE WHEN obs.event_type = 'impression' THEN 1 END) as impressions,
      COUNT(CASE WHEN obs.event_type = 'conversion' THEN 1 END) as conversions,
      COALESCE(SUM(CASE WHEN obs.event_type = 'conversion' THEN obs.revenue END), 0) as revenue,
      CASE WHEN COUNT(CASE WHEN obs.event_type = 'impression' THEN 1 END) > 0
        THEN ROUND(
          (COUNT(CASE WHEN obs.event_type = 'conversion' THEN 1 END)::numeric /
           COUNT(CASE WHEN obs.event_type = 'impression' THEN 1 END) * 100), 2
        )
        ELSE 0
      END as conversion_rate
    FROM order_bumps ob
    LEFT JOIN order_bump_stats obs ON ob.id = obs.bump_id
      AND obs.created_at >= ${startDate} AND obs.created_at <= ${endDate}
    GROUP BY ob.id, ob.name, ob.headline
    ORDER BY conversions DESC
  `;

  return metrics;
}

/**
 * Get revenue by traffic source
 */
export async function getRevenueBySource(startDate: Date, endDate: Date) {
  const metrics = await sql`
    SELECT
      COALESCE(utm_source, 'direct') as source,
      COALESCE(utm_medium, 'none') as medium,
      COUNT(DISTINCT order_id) as orders,
      SUM(revenue) as revenue,
      AVG(revenue) as avg_order_value
    FROM revenue_attribution
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY utm_source, utm_medium
    ORDER BY revenue DESC
    LIMIT 20
  `;

  return metrics;
}

/**
 * Get coupon usage metrics
 */
export async function getCouponMetrics(startDate: Date, endDate: Date) {
  const metrics = await sql`
    SELECT
      c.id,
      c.code,
      c.name,
      c.discount_type,
      c.discount_value,
      COUNT(cu.id) as times_used,
      COALESCE(SUM(cu.discount_amount), 0) as total_discount_given,
      AVG(cu.discount_amount) as avg_discount
    FROM coupons c
    LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
      AND cu.created_at >= ${startDate} AND cu.created_at <= ${endDate}
    GROUP BY c.id, c.code, c.name, c.discount_type, c.discount_value
    ORDER BY times_used DESC
  `;

  return metrics;
}
