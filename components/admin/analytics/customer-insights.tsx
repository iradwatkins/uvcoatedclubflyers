'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign } from 'lucide-react';
import { formatDate } from 'date-fns';

interface CustomerInsightsProps {
  customers: any[];
}

export function CustomerInsights({ customers }: CustomerInsightsProps) {
  // Calculate customer lifetime values
  const customersWithLTV = customers.map((customer) => {
    const totalSpent = customer.orders
      .filter((o: any) => o.paymentStatus === 'COMPLETED')
      .reduce((sum: number, order: any) => sum + order.totalAmount, 0);

    return {
      ...customer,
      totalSpent,
      orderCount: customer.orders.length,
    };
  });

  const topCustomers = customersWithLTV.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

  const totalRevenue = customersWithLTV.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgLTV = customers.length > 0 ? totalRevenue / customers.length : 0;
  const activeCustomers = customersWithLTV.filter((c) => c.orderCount > 0).length;

  // New customers this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const newThisMonth = customers.filter((c) => new Date(c.createdAt) >= thisMonth).length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Customers</span>
            <span className="text-2xl font-bold">{customers.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Customers</span>
            <span className="text-2xl font-bold text-green-600">{activeCustomers}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">New This Month</span>
            <span className="text-2xl font-bold text-blue-600">{newThisMonth}</span>
          </div>
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Lifetime Value</span>
              <span className="text-lg font-semibold">${(avgLTV / 100).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Customer Revenue</span>
              <span className="font-semibold">
                ${(totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Revenue per Active Customer</span>
              <span className="font-semibold">
                ${activeCustomers > 0 ? (totalRevenue / activeCustomers / 100).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer Retention Rate</span>
              <span className="font-semibold text-green-600">
                {customers.length > 0 ? ((activeCustomers / customers.length) * 100).toFixed(1) : 0}
                %
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Customers
          </CardTitle>
          <CardDescription>Highest value customers by total spent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between pb-3 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{customer.name || 'Customer'}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(customer.totalSpent / 100).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{customer.orderCount} orders</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
