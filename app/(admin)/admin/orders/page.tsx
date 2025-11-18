import Link from 'next/link';
import { query } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  configuration: any;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: string;
  payment_status: string;
  created_at: Date;
  user?: {
    name: string | null;
    email: string;
  } | null;
  orderItems: OrderItem[];
  items_count: number;
}

const ITEMS_PER_PAGE = 50;

interface GetOrdersParams {
  page?: number;
  limit?: number;
}

async function getOrders(
  params: GetOrdersParams = {}
): Promise<{ orders: Order[]; total: number }> {
  const page = params.page || 1;
  const limit = params.limit || ITEMS_PER_PAGE;
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM orders
    `);
    const total = parseInt(countResult.rows[0].total);

    // Fetch orders with user information
    const ordersResult = await query(
      `
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.payment_status,
        o.created_at,
        u.name as user_name,
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    // Fetch order items for all orders in a single query
    const orderIds = ordersResult.rows.map((o: any) => o.id);

    let itemsByOrderId: Record<number, OrderItem[]> = {};

    if (orderIds.length > 0) {
      const itemsResult = await query(
        `
        SELECT
          order_id,
          id,
          product_name,
          quantity,
          unit_price,
          total_price,
          configuration
        FROM order_items
        WHERE order_id = ANY($1::int[])
        ORDER BY id
      `,
        [orderIds]
      );

      // Group items by order_id
      itemsResult.rows.forEach((item: any) => {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        itemsByOrderId[item.order_id].push({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          configuration: item.configuration,
        });
      });
    }

    // Map orders with their items
    const orders = ordersResult.rows.map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      created_at: order.created_at,
      user:
        order.user_name || order.user_email
          ? {
              name: order.user_name,
              email: order.user_email,
            }
          : null,
      orderItems: itemsByOrderId[order.id] || [],
      items_count: (itemsByOrderId[order.id] || []).length,
    }));

    return { orders, total };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { orders: [], total: 0 };
  }
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: any; label: string; className?: string }> = {
    pending: {
      variant: 'secondary',
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    processing: {
      variant: 'default',
      label: 'Processing',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    printing: {
      variant: 'default',
      label: 'Printing',
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    },
    quality_check: {
      variant: 'default',
      label: 'Quality Check',
      className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
    },
    ready_to_ship: {
      variant: 'default',
      label: 'Ready to Ship',
      className: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100',
    },
    shipped: {
      variant: 'default',
      label: 'Shipped',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    completed: {
      variant: 'default',
      label: 'Completed',
      className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    },
    cancelled: {
      variant: 'destructive',
      label: 'Cancelled',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
  };

  const config = statusConfig[status] || {
    variant: 'secondary',
    label: status.replace(/_/g, ' '),
    className: '',
  };
  return (
    <Badge variant={config.variant} className={`capitalize ${config.className}`}>
      {config.label}
    </Badge>
  );
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');

  const { orders, total } = await getOrders({ page: currentPage });

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const stats = {
    total: total,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    revenue: orders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2">Order Management</h1>
        <p className="text-muted-foreground">View and manage all customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>All orders sorted by most recent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium">Order #</th>
                  <th className="pb-3 text-left font-medium">Customer</th>
                  <th className="pb-3 text-left font-medium">Items</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                  <th className="pb-3 text-center font-medium">Status</th>
                  <th className="pb-3 text-left font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-4">
                      <span className="font-mono text-sm">{order.order_number}</span>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{order.user?.name || 'Guest'}</p>
                        <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                    </td>
                    <td className="py-4 text-right font-medium">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td className="py-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No orders found.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} orders
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/orders?page=${currentPage - 1}`}>
                  <Button variant="outline" size="sm" disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </Link>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Link key={pageNum} href={`/admin/orders?page=${pageNum}`}>
                        <Button
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
                <Link href={`/admin/orders?page=${currentPage + 1}`}>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
