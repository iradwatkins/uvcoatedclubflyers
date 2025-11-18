'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Download } from 'lucide-react';
import { formatDate } from 'date-fns';

interface OrdersTableProps {
  orders: any[];
  initialStatus?: string;
  initialSearch?: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_PAYMENT: 'bg-orange-100 text-orange-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  PRINTING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function OrdersTable({ orders, initialStatus, initialSearch }: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch || '');
  const [status, setStatus] = useState(initialStatus || 'all');

  const handleFilterChange = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    if (status && status !== 'all') {
      params.set('status', status);
    } else {
      params.delete('status');
    }

    router.push(`/dashboard/orders?${params.toString()}`);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="printing">Printing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleFilterChange}>Apply Filters</Button>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-lg">No orders found</p>
            <p className="text-sm">Try adjusting your filters or browse our products to create your first order</p>
            <Button asChild className="mt-4">
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header - Desktop Only */}
            <div className="hidden grid-cols-6 gap-4 border-b pb-3 font-medium md:grid">
              <div>Order #</div>
              <div>Date</div>
              <div>Items</div>
              <div>Total</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Orders */}
            {orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-1 gap-4 border-b pb-4 last:border-0 md:grid-cols-6 md:items-center"
              >
                <div>
                  <div className="text-sm font-medium md:hidden">Order #</div>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </div>

                <div>
                  <div className="text-sm font-medium md:hidden">Date</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(new Date(order.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium md:hidden">Items</div>
                  <div className="text-sm">
                    {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium md:hidden">Total</div>
                  <div className="font-medium">{formatPrice(order.totalAmount)}</div>
                </div>

                <div>
                  <div className="text-sm font-medium md:hidden">Status</div>
                  <Badge
                    className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}
                  >
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex gap-2 md:justify-end">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/api/orders/${order.id}/receipt`}>
                      <Download className="mr-1 h-4 w-4" />
                      Receipt
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
