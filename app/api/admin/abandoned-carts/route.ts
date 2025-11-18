import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

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

    // Build WHERE clause
    let whereClause = '';
    if (status !== 'all') {
      whereClause = `WHERE status = '${status}'`;
    }

    // Get abandoned carts
    const carts = await sql`
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
      ${status !== 'all' ? sql`WHERE ac.status = ${status}` : sql``}
      ORDER BY ac.${sql(sortBy)} ${sql(sortOrder === 'ASC' ? 'ASC' : 'DESC')}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*)::int as total
      FROM abandoned_carts
      ${status !== 'all' ? sql`WHERE status = ${status}` : sql``}
    `;

    const total = countResult[0]?.total || 0;

    // Get summary statistics
    const stats = await sql`
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
    `;

    return NextResponse.json({
      success: true,
      carts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: stats[0],
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

    await sql`
      UPDATE abandoned_carts
      SET
        status = ${status},
        updated_at = NOW()
      WHERE id = ${id}
    `;

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
