import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/prisma';
import { formatDate } from 'date-fns';
import { Users, Mail, ShoppingBag, DollarSign } from 'lucide-react';

export default async function AdminCustomersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  // Fetch all customers with their order stats
  const customers = await prisma.user.findMany({
    where: {
      role: 'customer',
    },
    include: {
      orders: {
        select: {
          id: true,
          totalAmount: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate statistics
  const totalCustomers = customers.length;
  const customersWithOrders = customers.filter(c => c.orders.length > 0).length;
  const totalRevenue = customers.reduce((sum, customer) => {
    return sum + customer.orders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((orderSum, order) => orderSum + order.totalAmount, 0);
  }, 0);

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all customers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersWithOrders}</div>
            <p className="text-xs text-muted-foreground">
              {((customersWithOrders / totalCustomers) * 100).toFixed(0)}% with orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalRevenue / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg per Customer
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${customersWithOrders > 0 ? ((totalRevenue / customersWithOrders) / 100).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            A list of all registered customers and their order history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Orders</th>
                  <th scope="col" className="px-6 py-3">Total Spent</th>
                  <th scope="col" className="px-6 py-3">Member Since</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const totalSpent = customer.orders
                      .filter(o => o.paymentStatus === 'PAID')
                      .reduce((sum, order) => sum + order.totalAmount, 0);

                    return (
                      <tr key={customer.id} className="border-b hover:bg-muted/50">
                        <td className="px-6 py-4 font-medium">
                          {customer.name || 'No name'}
                        </td>
                        <td className="px-6 py-4">
                          <a href={`mailto:${customer.email}`} className="text-primary hover:underline flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={customer.orders.length > 0 ? 'default' : 'secondary'}>
                            {customer.orders.length} orders
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          ${(totalSpent / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(customer.createdAt, 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {customer.orders.length > 0 && (
                              <Link
                                href={`/admin/orders?customer=${customer.id}`}
                                className="text-sm text-primary hover:underline"
                              >
                                View Orders
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
