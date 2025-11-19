import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/admin/abandoned-carts
 * Get list of abandoned carts with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'abandoned_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['abandoned_at', 'total_value', 'item_count', 'email', 'status'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'abandoned_at';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Build query with conditional WHERE clause
    let cartsQuery = `
      SELECT
        ac.id,
        ac.session_id,
        ac.email,
        ac.phone,
        ac.cart_data,
        ac.total_value,
        ac.item_count,
        ac.product_names,
        ac.product_images,
        ac.status,
        ac.abandonment_stage,
        ac.abandoned_at,
        ac.first_email_sent_at,
        ac.second_email_sent_at,
        ac.third_email_sent_at,
        ac.recovered_at,
        ac.converted_at,
        ac.recovered_order_id,
        ac.recovered_revenue,
        ac.email_open_count,
        ac.email_click_count,
        ac.recovery_discount_percent,
        ac.source,
        ac.utm_source,
        ac.utm_medium,
        ac.utm_campaign,
        ac.device_type,
        u.name as user_name,
        u.email as user_email
      FROM abandoned_carts ac
      LEFT JOIN users u ON ac.user_id = u.id
    `;

    const params: any[] = [];
    if (status !== 'all') {
      cartsQuery += ` WHERE ac.status = $1`;
      params.push(status);
    }

    cartsQuery += ` ORDER BY ac.${safeSortBy} ${safeSortOrder}`;
    cartsQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const cartsResult = await query(cartsQuery, params);
    const carts = cartsResult.rows;

    // Get total count
    let countQuery = `SELECT COUNT(*)::int as total FROM abandoned_carts`;
    const countParams: any[] = [];
    if (status !== 'all') {
      countQuery += ` WHERE status = $1`;
      countParams.push(status);
    }
    const countResult = await query(countQuery, countParams);
    const total = countResult.rows[0]?.total || 0;

    // Get summary statistics
    const statsResult = await query(`
      SELECT
        COUNT(*)::int as total_abandoned,
        COUNT(CASE WHEN status = 'recovered' THEN 1 END)::int as total_recovered,
        COUNT(CASE WHEN status = 'converted' THEN 1 END)::int as total_converted,
        COUNT(CASE WHEN status = 'lost' THEN 1 END)::int as total_lost,
        COALESCE(SUM(total_value), 0)::int as total_value,
        COALESCE(SUM(recovered_revenue), 0)::int as total_recovered_revenue,
        COALESCE(AVG(total_value), 0)::int as avg_cart_value,
        COUNT(CASE WHEN email IS NOT NULL THEN 1 END)::int as with_email
      FROM abandoned_carts
    `);

    return NextResponse.json({
      success: true,
      carts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: statsResult.rows[0],
    });
  } catch (error: any) {
    console.error('[Abandoned Carts API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch abandoned carts' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/abandoned-carts
 * Update abandoned cart status
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields: id, status' }, { status: 400 });
    }

    const validStatuses = [
      'abandoned',
      'email_sent_1',
      'email_sent_2',
      'email_sent_3',
      'recovered',
      'converted',
      'lost',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await query(
      `UPDATE abandoned_carts SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Abandoned cart updated',
    });
  } catch (error: any) {
    console.error('[Abandoned Carts API] Error updating:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update abandoned cart' },
      { status: 500 }
    );
  }
}
