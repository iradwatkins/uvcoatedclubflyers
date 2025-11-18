import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { query } from '@/lib/db';
import { formatDate } from 'date-fns';
import { ArrowLeft, Download, Package, MapPin, User, CreditCard, Phone, Mail } from 'lucide-react';
import { OrderStatusSelector } from '@/components/admin/order-status-selector';

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  const { id } = await params;
  const orderId = parseInt(id);

  // Fetch order with all details
  const orderResult = await query(`
    SELECT
      o.*,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email,
      u.created_at as user_created_at
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = $1
  `, [orderId]);

  if (orderResult.rows.length === 0) {
    notFound();
  }

  const orderRow = orderResult.rows[0];

  // Fetch order items with product details
  const itemsResult = await query(`
    SELECT
      oi.*,
      p.id as product_id,
      p.name as product_name,
      p.sku as product_sku,
      p.image_url as product_image_url
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = $1
  `, [orderId]);

  // Calculate customer stats
  const statsResult = await query(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_spent
    FROM orders
    WHERE user_id = $1
  `, [orderRow.user_id]);

  const customerStats = statsResult.rows[0] || { total_orders: 0, total_spent: 0 };

  // Build order object
  const order = {
    id: orderRow.id,
    orderNumber: orderRow.order_number,
    status: orderRow.status,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
    completedAt: orderRow.completed_at,
    paidAt: orderRow.paid_at,
    shippedAt: orderRow.shipped_at,
    subtotal: parseFloat(orderRow.subtotal),
    taxAmount: parseFloat(orderRow.tax_amount || 0),
    totalAmount: parseFloat(orderRow.total_amount),
    shippingRateAmount: orderRow.shipping_rate_amount ? parseFloat(orderRow.shipping_rate_amount) : null,
    paymentMethod: orderRow.payment_method,
    paymentStatus: orderRow.payment_status,
    transactionId: orderRow.transaction_id,
    shippingCarrier: orderRow.shipping_carrier,
    shippingService: orderRow.shipping_service,
    shippingTrackingNumber: orderRow.shipping_tracking_number,
    pickupAirportId: orderRow.pickup_airport_id,
    customerNotes: orderRow.customer_notes,
    internalNotes: orderRow.internal_notes,
    billingInfo: {
      name: `${orderRow.billing_first_name || ''} ${orderRow.billing_last_name || ''}`.trim(),
      email: orderRow.billing_email,
      phone: orderRow.billing_phone,
      address: orderRow.billing_address_1,
      address2: orderRow.billing_address_2,
      city: orderRow.billing_city,
      state: orderRow.billing_state,
      zipCode: orderRow.billing_postcode,
      country: orderRow.billing_country,
    },
    shippingAddress: {
      name: `${orderRow.shipping_first_name || ''} ${orderRow.shipping_last_name || ''}`.trim(),
      fullName: `${orderRow.shipping_first_name || ''} ${orderRow.shipping_last_name || ''}`.trim(),
      address: orderRow.shipping_address_1,
      address2: orderRow.shipping_address_2,
      city: orderRow.shipping_city,
      state: orderRow.shipping_state,
      zipCode: orderRow.shipping_postcode,
      country: orderRow.shipping_country,
    },
    user: orderRow.user_id ? {
      id: orderRow.user_id,
      name: orderRow.user_name,
      email: orderRow.user_email,
      createdAt: orderRow.user_created_at,
    } : null,
    orderItems: itemsResult.rows.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      totalPrice: parseFloat(item.total_price),
      options: item.configuration,
      product: item.product_id ? {
        id: item.product_id,
        name: item.product_name,
        sku: item.product_sku,
        imageUrl: item.product_image_url,
      } : null,
    })),
    userId: orderRow.user_id,
  };

  const totalOrders = parseInt(customerStats.total_orders);
  const totalSpent = parseFloat(customerStats.total_spent);

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


  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground mt-2">
              Placed on {formatDate(order.createdAt, 'MMMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className={`${getStatusColor(order.status)} text-white text-sm px-4 py-2`}>
              {order.status.replace('_', ' ')}
            </Badge>
            <OrderStatusSelector orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Contact Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{order.user?.name || 'Guest'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${order.user?.email}`} className="text-primary hover:underline">
                        {order.user?.email || 'N/A'}
                      </a>
                    </div>
                    {order.user && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-muted-foreground">Customer since:</p>
                        <p className="font-medium">{formatDate(order.user.createdAt, 'MMM d, yyyy')}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {totalOrders} total orders • ${totalSpent.toFixed(2)} spent
                        </p>
                        <Link href={`/admin/customers/${order.user.id}`} className="text-sm text-primary hover:underline mt-2 inline-block">
                          View Customer Profile →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {order.billingInfo && typeof order.billingInfo === 'object' && (
                  <div>
                    <h3 className="font-semibold mb-3">Billing Address</h3>
                    <div className="text-sm space-y-1">
                      <p>{(order.billingInfo as any).name}</p>
                      <p>{(order.billingInfo as any).address || (order.billingInfo as any).street}</p>
                      <p>
                        {(order.billingInfo as any).city}, {(order.billingInfo as any).state}{' '}
                        {(order.billingInfo as any).zipCode || (order.billingInfo as any).zip}
                      </p>
                      {(order.billingInfo as any).country && (
                        <p>{(order.billingInfo as any).country}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
              <CardDescription>
                {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    {item.product?.imageUrl && (
                      <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {item.product?.name || 'Product'}
                      </h3>
                      {item.product?.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity.toLocaleString()}
                      </p>
                      {item.options && typeof item.options === 'object' && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Configuration:</p>
                          <div className="grid grid-cols-2 gap-x-4 text-muted-foreground">
                            {Object.entries(item.options as Record<string, any>).map(([key, value]) => (
                              <p key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        ${item.unitPrice.toFixed(2)} each
                      </p>
                      <p className="font-semibold mt-1">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {order.shippingAddress && typeof order.shippingAddress === 'object' && (
                  <div>
                    <h3 className="font-semibold mb-3">Shipping Address</h3>
                    <div className="text-sm space-y-1">
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
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Shipping Method</h3>
                  <div className="text-sm space-y-2">
                    {order.shippingCarrier && (
                      <p>
                        <span className="text-muted-foreground">Carrier:</span>{' '}
                        <span className="font-medium capitalize">{order.shippingCarrier}</span>
                      </p>
                    )}
                    {order.shippingService && (
                      <p>
                        <span className="text-muted-foreground">Service:</span>{' '}
                        <span className="font-medium">{order.shippingService.replace(/_/g, ' ')}</span>
                      </p>
                    )}
                    {order.shippingRateAmount && (
                      <p>
                        <span className="text-muted-foreground">Cost:</span>{' '}
                        <span className="font-medium">${order.shippingRateAmount.toFixed(2)}</span>
                      </p>
                    )}
                    {order.shippingTrackingNumber && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-muted-foreground mb-1">Tracking Number:</p>
                        <p className="font-mono text-sm">{order.shippingTrackingNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {order.paymentStatus ? order.paymentStatus.toUpperCase() : 'PENDING'}
                </Badge>
              </div>
              {order.transactionId && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Transaction ID:</p>
                  <p className="font-mono text-xs break-all">{order.transactionId}</p>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between text-sm pt-3 border-t">
                  <span className="text-muted-foreground">Paid On:</span>
                  <span className="font-medium">
                    {formatDate(order.paidAt, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Order Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.shippingRateAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span>${order.shippingRateAmount.toFixed(2)}</span>
                </div>
              )}
              {order.taxAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>${order.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <a href={`/api/orders/${order.id}/receipt`} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={`mailto:${order.user?.email}?subject=Regarding Order ${order.orderNumber}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Customer
                </a>
              </Button>
              <Button variant="outline" className="w-full">
                Print Order
              </Button>
              {order.status !== 'cancelled' && (
                <Button variant="destructive" className="w-full">
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {order.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {order.internalNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                <div>
                  <p className="font-medium">Order Created</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(order.createdAt, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              {order.paidAt && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                  <div>
                    <p className="font-medium">Payment Received</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(order.paidAt, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}
              {order.completedAt && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                  <div>
                    <p className="font-medium">Order Completed</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(order.completedAt, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
