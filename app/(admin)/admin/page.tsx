import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Users, DollarSign, TrendingUp } from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await auth();

  // Get statistics using raw SQL
  const totalOrdersResult = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM orders
  `;
  const totalOrders = Number(totalOrdersResult[0]?.count || 0);

  const totalCustomersResult = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM users WHERE role = 'customer'
  `;
  const totalCustomers = Number(totalCustomersResult[0]?.count || 0);

  // Get recent orders
  const recentOrders = await prisma.$queryRaw`
    SELECT
      o.id,
      o.order_number as "orderNumber",
      o.status,
      o.total_amount as "totalAmount",
      o.created_at as "createdAt",
      u.name as user_name,
      u.email as user_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `;

  // Format recent orders to match expected structure
  const formattedRecentOrders = recentOrders.map((order) => ({
    ...order,
    user:
      order.user_name || order.user_email
        ? {
            name: order.user_name,
            email: order.user_email,
          }
        : null,
  }));

  // Calculate total revenue
  const revenueResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(total_amount), 0)::int as total
    FROM orders
    WHERE payment_status = 'paid'
  `;
  const totalRevenue = Number(revenueResult[0]?.total || 0);

  const stats = [
    {
      title: 'Total Orders',
      value: totalOrders.toLocaleString(),
      icon: ShoppingBag,
      description: 'All time orders',
    },
    {
      title: 'Total Customers',
      value: totalCustomers.toLocaleString(),
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Total Revenue',
      value: `$${(totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: 'Completed orders',
    },
    {
      title: 'Avg Order Value',
      value:
        totalOrders > 0
          ? `$${(totalRevenue / totalOrders / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : '$0.00',
      icon: TrendingUp,
      description: 'Per order',
    },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    pending_payment: 'bg-orange-100 text-orange-800',
    processing: 'bg-blue-100 text-blue-800',
    printing: 'bg-purple-100 text-purple-800',
    quality_check: 'bg-indigo-100 text-indigo-800',
    ready_to_ship: 'bg-teal-100 text-teal-800',
    shipped: 'bg-green-100 text-green-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session?.user?.name || 'Admin'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {formattedRecentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {formattedRecentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.user?.name || order.user?.email || 'Guest'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-medium">${(order.totalAmount / 100).toFixed(2)}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                        statusColors[order.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
