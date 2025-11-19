import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { OrdersTable } from '@/components/customer/orders-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Await searchParams (Next.js 15+)
  const params = await searchParams;

  const userId = parseInt(session.user.id);

  // Build SQL query based on filters
  let query = `
    SELECT
      o.*,
      o.order_number as "orderNumber",
      o.total_amount as "totalAmount",
      o.payment_status as "paymentStatus",
      o.created_at as "createdAt"
    FROM orders o
    WHERE o.user_id = ${userId}
  `;

  if (params.status && params.status !== 'all') {
    query += ` AND o.status = '${params.status.toLowerCase()}'`;
  }

  if (params.search) {
    query += ` AND o.order_number ILIKE '%${params.search}%'`;
  }

  query += ` ORDER BY o.created_at DESC`;

  // Fetch orders with filters using raw SQL
  const orders = (await prisma.$queryRawUnsafe(query)) as any[];

  // Calculate statistics using raw SQL
  const totalResult = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM orders WHERE user_id = ${userId}
  `;

  const pendingResult = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM orders
    WHERE user_id = ${userId} AND status IN ('pending', 'pending_payment')
  `;

  const processingResult = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM orders
    WHERE user_id = ${userId} AND status IN ('processing', 'printing')
  `;

  const completedResult = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM orders
    WHERE user_id = ${userId} AND status = 'completed'
  `;

  const stats = {
    total: Number(totalResult[0]?.count || 0),
    pending: Number(pendingResult[0]?.count || 0),
    processing: Number(processingResult[0]?.count || 0),
    completed: Number(completedResult[0]?.count || 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">View and track all your orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Production</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.processing}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Orders Table with Filters */}
      <OrdersTable
        orders={orders}
        initialStatus={params.status}
        initialSearch={params.search}
      />
    </div>
  );
}
