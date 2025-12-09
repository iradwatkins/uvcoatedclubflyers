'use client';

import { useState } from 'react';
import { formatDate } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  CreditCard,
  Truck,
  Clock,
  ExternalLink,
  Download,
  Loader2,
} from 'lucide-react';
import type { Order, OrderStatus } from './types';
import { STATUS_CONFIG, getPriorityLevel } from './types';
import { cn } from '@/lib/utils';

interface OrderDetailPanelProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderId: number, status: OrderStatus) => Promise<void>;
}

export function OrderDetailPanel({ order, onClose, onStatusChange }: OrderDetailPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);

  if (!order) return null;

  const priority = getPriorityLevel(order.createdAt);
  const statusConfig = STATUS_CONFIG[order.status];

  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === order.status) return;
    setIsUpdating(true);
    try {
      await onStatusChange(order.id, selectedStatus);
      setSelectedStatus(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const customerName = order.userName ||
    [order.billingFirstName, order.billingLastName].filter(Boolean).join(' ') ||
    'Guest';

  const shippingName = [order.shippingFirstName, order.shippingLastName]
    .filter(Boolean)
    .join(' ') || customerName;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-xl z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">Order #{order.orderNumber}</h2>
          {priority === 'urgent' && (
            <Badge variant="destructive" className="text-xs">Urgent</Badge>
          )}
          {priority === 'high' && (
            <Badge className="text-xs bg-orange-500">High</Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Status</span>
            <Badge className={cn(statusConfig.bgColor, statusConfig.color, 'border-0')}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedStatus || order.status}
              onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStatus && selectedStatus !== order.status && (
              <Button
                onClick={handleStatusChange}
                disabled={isUpdating}
                size="sm"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Update'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Order Date</p>
            <p className="text-sm font-medium">
              {formatDate(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Payment</p>
            <Badge
              variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {order.paymentStatus.toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Items</p>
            <p className="text-sm font-medium">{order.itemCount} items</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold text-primary">
              ${order.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Customer */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer
          </h3>
          <div className="space-y-1 pl-6">
            <p className="text-sm font-medium">{customerName}</p>
            {order.userEmail && (
              <a
                href={`mailto:${order.userEmail}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                {order.userEmail}
              </a>
            )}
            {order.billingPhone && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {order.billingPhone}
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items
          </h3>
          <div className="space-y-2 pl-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-2 bg-muted/30 rounded">
                {item.productImageUrl && (
                  <img
                    src={item.productImageUrl}
                    alt={item.productName}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity.toLocaleString()} × ${item.unitPrice.toFixed(2)}
                  </p>
                  {item.configuration && Object.keys(item.configuration).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {Object.entries(item.configuration)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' • ')}
                    </p>
                  )}
                </div>
                <p className="text-sm font-medium">${item.totalPrice.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping */}
        {order.shippingAddress && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipping
            </h3>
            <div className="space-y-1 pl-6 text-sm">
              <p className="font-medium">{shippingName}</p>
              <p className="text-muted-foreground">{order.shippingAddress}</p>
              <p className="text-muted-foreground">
                {[order.shippingCity, order.shippingState, order.shippingPostcode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {order.shippingCarrier && (
                <p className="mt-2">
                  <span className="text-muted-foreground">Carrier:</span>{' '}
                  <span className="capitalize">{order.shippingCarrier}</span>
                  {order.shippingService && ` - ${order.shippingService.replace(/_/g, ' ')}`}
                </p>
              )}
              {order.shippingTrackingNumber && (
                <p>
                  <span className="text-muted-foreground">Tracking:</span>{' '}
                  <span className="font-mono">{order.shippingTrackingNumber}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </h3>
          <div className="space-y-1 pl-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.shippingAmount && order.shippingAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>${order.shippingAmount.toFixed(2)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Total</span>
              <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </h3>
          <div className="space-y-2 pl-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Created</span>
              <span className="ml-auto text-xs">
                {formatDate(new Date(order.createdAt), 'MMM d, h:mm a')}
              </span>
            </div>
            {order.paidAt && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Paid</span>
                <span className="ml-auto text-xs">
                  {formatDate(new Date(order.paidAt), 'MMM d, h:mm a')}
                </span>
              </div>
            )}
            {order.shippedAt && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Shipped</span>
                <span className="ml-auto text-xs">
                  {formatDate(new Date(order.shippedAt), 'MMM d, h:mm a')}
                </span>
              </div>
            )}
            {order.completedAt && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Completed</span>
                <span className="ml-auto text-xs">
                  {formatDate(new Date(order.completedAt), 'MMM d, h:mm a')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {(order.customerNotes || order.internalNotes) && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Notes</h3>
            {order.customerNotes && (
              <div className="p-2 bg-muted/30 rounded text-sm">
                <p className="text-xs text-muted-foreground mb-1">Customer Note</p>
                <p>{order.customerNotes}</p>
              </div>
            )}
            {order.internalNotes && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="text-xs text-yellow-700 mb-1">Internal Note</p>
                <p>{order.internalNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t p-4 bg-muted/30 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/admin/orders/${order.id}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Full Details
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/orders/${order.id}/receipt`} download>
              <Download className="h-4 w-4 mr-1.5" />
              Invoice
            </a>
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          asChild
        >
          <a href={`mailto:${order.userEmail}?subject=Regarding Order ${order.orderNumber}`}>
            <Mail className="h-4 w-4 mr-1.5" />
            Email Customer
          </a>
        </Button>
      </div>
    </div>
  );
}
