import { Suspense } from 'react';
import { query } from '@/lib/db';
import { OrderCommandCenter } from '@/components/admin/orders';
import type { Order, OrderStats, OrderStatus, PaymentStatus } from '@/components/admin/orders/types';

async function getOrdersData(): Promise<{ orders: Order[]; stats: OrderStats }> {
  try {
    // Fetch all orders with user info and items
    const ordersResult = await query(`
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.payment_status,
        o.created_at,
        o.updated_at,
        o.paid_at,
        o.shipped_at,
        o.completed_at,
        o.subtotal,
        o.tax_amount,
        o.shipping_rate_amount,
        o.total_amount,
        o.user_id,
        u.name as user_name,
        u.email as user_email,
        o.billing_first_name,
        o.billing_last_name,
        o.billing_email,
        o.billing_phone,
        o.billing_address_1 as billing_address,
        o.billing_city,
        o.billing_state,
        o.billing_postcode,
        o.shipping_first_name,
        o.shipping_last_name,
        o.shipping_address_1 as shipping_address,
        o.shipping_city,
        o.shipping_state,
        o.shipping_postcode,
        o.shipping_carrier,
        o.shipping_service,
        o.shipping_tracking_number,
        o.customer_notes,
        o.internal_notes,
        COUNT(oi.id) as item_count,
        STRING_AGG(
          oi.quantity || 'x ' || oi.product_name,
          ', '
          ORDER BY oi.id
        ) as items_summary
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT 500
    `);

    // Get order items for all orders
    const orderIds = ordersResult.rows.map((o: any) => o.id);

    let itemsByOrderId: Record<number, any[]> = {};

    if (orderIds.length > 0) {
      const itemsResult = await query(`
        SELECT
          oi.order_id,
          oi.id,
          oi.product_id,
          oi.product_name,
          p.sku as product_sku,
          p.image_url as product_image_url,
          oi.quantity,
          oi.unit_price,
          oi.total_price,
          oi.configuration
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ANY($1::int[])
        ORDER BY oi.id
      `, [orderIds]);

      itemsResult.rows.forEach((item: any) => {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        itemsByOrderId[item.order_id].push({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productSku: item.product_sku,
          productImageUrl: item.product_image_url,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price),
          configuration: item.configuration,
        });
      });
    }

    // Transform orders
    const orders: Order[] = ordersResult.rows.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      status: row.status as OrderStatus,
      paymentStatus: row.payment_status as PaymentStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      paidAt: row.paid_at,
      shippedAt: row.shipped_at,
      completedAt: row.completed_at,
      subtotal: parseFloat(row.subtotal || 0),
      taxAmount: parseFloat(row.tax_amount || 0),
      shippingAmount: row.shipping_rate_amount ? parseFloat(row.shipping_rate_amount) : null,
      totalAmount: parseFloat(row.total_amount || 0),
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email || row.billing_email,
      billingFirstName: row.billing_first_name,
      billingLastName: row.billing_last_name,
      billingEmail: row.billing_email,
      billingPhone: row.billing_phone,
      billingAddress: row.billing_address,
      billingCity: row.billing_city,
      billingState: row.billing_state,
      billingPostcode: row.billing_postcode,
      shippingFirstName: row.shipping_first_name,
      shippingLastName: row.shipping_last_name,
      shippingAddress: row.shipping_address,
      shippingCity: row.shipping_city,
      shippingState: row.shipping_state,
      shippingPostcode: row.shipping_postcode,
      shippingCarrier: row.shipping_carrier,
      shippingService: row.shipping_service,
      shippingTrackingNumber: row.shipping_tracking_number,
      items: itemsByOrderId[row.id] || [],
      itemCount: parseInt(row.item_count) || 0,
      itemsSummary: row.items_summary || '',
      customerNotes: row.customer_notes,
      internalNotes: row.internal_notes,
    }));

    // Calculate stats
    const now = Date.now();
    const urgentThreshold = 48 * 60 * 60 * 1000;

    const stats: OrderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      printing: orders.filter(o => o.status === 'printing').length,
      qualityCheck: orders.filter(o => o.status === 'quality_check').length,
      readyToShip: orders.filter(o => o.status === 'ready_to_ship').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      urgent: orders.filter(o => {
        const age = now - new Date(o.createdAt).getTime();
        return age > urgentThreshold &&
          ['pending', 'processing', 'printing', 'quality_check', 'ready_to_ship'].includes(o.status);
      }).length,
      totalRevenue: orders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };

    return { orders, stats };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      orders: [],
      stats: {
        total: 0,
        pending: 0,
        processing: 0,
        printing: 0,
        qualityCheck: 0,
        readyToShip: 0,
        shipped: 0,
        completed: 0,
        cancelled: 0,
        urgent: 0,
        totalRevenue: 0,
      },
    };
  }
}

function OrdersLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 bg-muted animate-pulse rounded" />
      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-12 bg-muted animate-pulse rounded" />
      <div className="h-[500px] bg-muted animate-pulse rounded" />
    </div>
  );
}

export default async function AdminOrdersPage() {
  const { orders, stats } = await getOrdersData();

  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrderCommandCenter initialOrders={orders} initialStats={stats} />
    </Suspense>
  );
}
