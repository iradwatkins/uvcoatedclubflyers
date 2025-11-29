import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesChart } from '@/components/admin/analytics/sales-chart';
import { ProductPerformance } from '@/components/admin/analytics/product-performance';
import { CustomerInsights } from '@/components/admin/analytics/customer-insights';
import { TrendingUp, DollarSign, Users, ShoppingBag, Package } from 'lucide-react';

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch analytics data
  const [orders, customers, revenueData] = await Promise.all([
    prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { role: 'customer' },
      include: {
        orders: true,
      },
    }),
    prisma.order.findMany({
      where: {
        paymentStatus: 'COMPLETED',
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    }),
  ]);

  // Calculate metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'COMPLETED')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const monthlyRevenue = orders
    .filter((o) => o.paymentStatus === 'COMPLETED' && new Date(o.createdAt) >= thisMonth)
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item: { product?: { name?: string }; quantity: number; totalPrice: number }) => {
      const productName = item.product?.name || 'Unknown';
      if (!productSales[productName]) {
        productSales[productName] = { name: productName, quantity: 0, revenue: 0 };
      }
      productSales[productName].quantity += item.quantity;
      productSales[productName].revenue += item.totalPrice;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Customer metrics
  const activeCustomers = customers.filter((c) => c.orders.length > 0).length;
  const newCustomersThisMonth = customers.filter((c) => new Date(c.createdAt) >= thisMonth).length;

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${(totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: '+12.5%',
      icon: DollarSign,
      description: 'All time',
    },
    {
      title: 'This Month',
      value: `$${(monthlyRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: '+8.2%',
      icon: TrendingUp,
      description: 'vs last month',
    },
    {
      title: 'Total Orders',
      value: orders.length.toLocaleString(),
      change: `${completedOrders} completed`,
      icon: ShoppingBag,
      description: 'All time orders',
    },
    {
      title: 'Avg Order Value',
      value: `$${(averageOrderValue / 100).toFixed(2)}`,
      change: 'Per order',
      icon: Package,
      description: 'Average',
    },
    {
      title: 'Active Customers',
      value: activeCustomers.toLocaleString(),
      change: `+${newCustomersThisMonth} this month`,
      icon: Users,
      description: `of ${customers.length} total`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your business performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                <p className="text-xs text-green-600 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <SalesChart orders={orders} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductPerformance products={topProducts} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomerInsights customers={customers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
