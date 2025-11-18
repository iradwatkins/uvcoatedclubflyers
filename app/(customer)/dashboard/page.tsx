import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/prisma';
import { formatDate } from 'date-fns';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user's recent orders
  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
    include: {
      orderItems: true,
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
      case 'printing':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'pending':
      case 'pending_payment':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Welcome, {session.user.name}!</h1>
        <p className="text-muted-foreground mt-2">Manage your flyer orders and designs</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest printing orders</CardDescription>
            </div>
            {orders.length > 0 && (
              <Link href="/dashboard/orders" className="text-sm text-primary hover:underline">
                View All
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">No orders yet</p>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.orderNumber}</span>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold">${(order.totalAmount / 100).toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Design Files</CardTitle>
            <CardDescription>Manage your uploaded designs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No files uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/products" className="block text-sm text-primary hover:underline">
                Browse Products
              </a>
              <a href="/dashboard/files" className="block text-sm text-primary hover:underline">
                Upload Design
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Email:</span> {session.user.email}
          </p>
          <p>
            <span className="font-medium">Role:</span>{' '}
            <span className="capitalize">{session.user.role}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
