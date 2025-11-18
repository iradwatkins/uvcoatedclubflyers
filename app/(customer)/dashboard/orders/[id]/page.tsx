import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { formatDate } from 'date-fns';
import { ArrowLeft, Download, Package, MapPin } from 'lucide-react';
import { OrderTimeline } from '@/components/customer/order-timeline';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Await params (Next.js 15+)
  const { id } = await params;

  // Fetch order with all details
  const order = await prisma.order.findUnique({
    where: {
      id: id,
      userId: session.user.id, // Ensure user can only see their own orders
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

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

  const getStatusMessage = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Your order has been received and is waiting to be processed.';
      case 'pending_payment':
        return 'Waiting for payment confirmation.';
      case 'processing':
        return 'Your order is being prepared for printing.';
      case 'printing':
        return 'Your flyers are currently being printed.';
      case 'shipped':
        return 'Your order has been shipped!';
      case 'completed':
        return 'Your order has been completed.';
      case 'cancelled':
        return 'This order has been cancelled.';
      default:
        return 'Order status updated.';
    }
  };

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Order Details</h1>
            <p className="text-muted-foreground mt-2">
              Order #{order.orderNumber}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white text-sm px-4 py-2`}>
            {order.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Tracking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                status={order.status}
                createdAt={order.createdAt}
                paidAt={order.paidAt}
                completedAt={order.completedAt}
                trackingNumber={order.shippingTrackingNumber}
              />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {item.product?.name || 'Product'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity.toLocaleString()}
                      </p>
                      {item.options && typeof item.options === 'object' && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Configuration:</p>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {Object.entries(item.options as Record<string, any>).map(([key, value]) => (
                              <li key={key}>
                                {key}: {String(value)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        ${(item.unitPrice / 100).toFixed(2)} each
                      </p>
                      <p className="font-semibold mt-1">
                        ${(item.totalPrice / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && typeof order.shippingAddress === 'object' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>{(order.shippingAddress as any).fullName || (order.shippingAddress as any).name}</p>
                  <p>{(order.shippingAddress as any).address || (order.shippingAddress as any).street}</p>
                  <p>
                    {(order.shippingAddress as any).city}, {(order.shippingAddress as any).state}{' '}
                    {(order.shippingAddress as any).zipCode || (order.shippingAddress as any).zip}
                  </p>
                  {(order.shippingAddress as any).country && (
                    <p>{(order.shippingAddress as any).country}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium">
                  {formatDate(order.createdAt, 'MMM d, yyyy')}
                </span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid Date:</span>
                  <span className="font-medium">
                    {formatDate(order.paidAt, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod}
                </span>
              </div>
              {order.paymentStatus && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <span className="font-medium capitalize">
                    {order.paymentStatus}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${(order.subtotal / 100).toFixed(2)}</span>
              </div>
              {order.shippingRateAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span>${(order.shippingRateAmount / 100).toFixed(2)}</span>
                </div>
              )}
              {order.taxAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>${(order.taxAmount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">
                    ${(order.totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <a href={`/api/orders/${order.id}/receipt`} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/products">
                  Reorder
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Contact our support team for any questions about your order.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:support@uvcoatedflyers.com">
                  Email Support
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
