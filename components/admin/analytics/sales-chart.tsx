'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from 'date-fns';

interface SalesChartProps {
  orders: any[];
}

export function SalesChart({ orders }: SalesChartProps) {
  // Group orders by date
  const salesByDate: Record<string, number> = {};

  orders.forEach(order => {
    if (order.paymentStatus === 'COMPLETED') {
      const date = formatDate(new Date(order.createdAt), 'MMM dd');
      salesByDate[date] = (salesByDate[date] || 0) + order.totalAmount;
    }
  });

  const dates = Object.keys(salesByDate).slice(-30); // Last 30 days
  const maxRevenue = Math.max(...Object.values(salesByDate));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Daily revenue for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dates.slice(-10).map(date => {
              const revenue = salesByDate[date];
              const percentage = (revenue / maxRevenue) * 100;

              return (
                <div key={date} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{date}</span>
                    <span className="font-medium">
                      ${(revenue / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Status Breakdown</CardTitle>
          <CardDescription>Current orders by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['PENDING', 'PROCESSING', 'PRINTING', 'SHIPPED', 'COMPLETED'].map(status => {
              const count = orders.filter(o => o.status === status).length;
              const percentage = (count / orders.length) * 100;

              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                    <span className="font-medium">{count} orders</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Orders by payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['COMPLETED', 'PENDING', 'FAILED'].map(status => {
              const count = orders.filter(o => o.paymentStatus === status).length;
              const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;

              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{status.toLowerCase()}</span>
                    <span className="font-medium">{count} orders</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
