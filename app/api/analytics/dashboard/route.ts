import { NextRequest, NextResponse } from 'next/server';
import {
  getFunnelMetrics,
  getOrderBumpMetrics,
  getRevenueBySource,
  getCouponMetrics,
} from '@/lib/analytics/tracker';

/**
 * GET /api/analytics/dashboard
 * Get comprehensive analytics data for the admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

    switch (range) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch all metrics in parallel
    const [funnelMetrics, orderBumpMetrics, revenueBySource, couponMetrics] = await Promise.all([
      getFunnelMetrics(startDate, endDate),
      getOrderBumpMetrics(startDate, endDate),
      getRevenueBySource(startDate, endDate),
      getCouponMetrics(startDate, endDate),
    ]);

    // Calculate summary stats
    const totals = (funnelMetrics as Array<{
      page_views: number;
      product_views: number;
      add_to_cart: number;
      checkout_starts: number;
      conversions: number;
    }>).reduce(
      (acc, day) => ({
        pageViews: acc.pageViews + (day.page_views || 0),
        productViews: acc.productViews + (day.product_views || 0),
        addToCart: acc.addToCart + (day.add_to_cart || 0),
        checkoutStarts: acc.checkoutStarts + (day.checkout_starts || 0),
        conversions: acc.conversions + (day.conversions || 0),
      }),
      {
        pageViews: 0,
        productViews: 0,
        addToCart: 0,
        checkoutStarts: 0,
        conversions: 0,
      }
    );

    const overallConversionRate = totals.checkoutStarts > 0
      ? ((totals.conversions / totals.checkoutStarts) * 100).toFixed(2)
      : '0.00';

    const cartToCheckoutRate = totals.addToCart > 0
      ? ((totals.checkoutStarts / totals.addToCart) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      range,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        ...totals,
        overallConversionRate,
        cartToCheckoutRate,
      },
      funnel: funnelMetrics,
      orderBumps: orderBumpMetrics,
      revenueBySource,
      coupons: couponMetrics,
    });
  } catch (error) {
    console.error('[Analytics Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
