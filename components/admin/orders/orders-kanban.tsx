'use client';

import { useState } from 'react';
import { formatDate } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  FileText,
  Printer,
  CheckCircle,
  Package,
  AlertCircle,
  Eye,
} from 'lucide-react';
import type { Order, OrderStatus } from './types';
import { STATUS_CONFIG, PRODUCTION_STATUSES, getPriorityLevel } from './types';
import { cn } from '@/lib/utils';

interface OrdersKanbanProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  onStatusChange: (orderId: number, status: OrderStatus) => Promise<void>;
  selectedOrderId?: number | null;
}

const KANBAN_COLUMNS: {
  id: OrderStatus;
  title: string;
  icon: typeof Clock;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    id: 'pending',
    title: 'Pending',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  {
    id: 'processing',
    title: 'Processing',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'printing',
    title: 'Printing',
    icon: Printer,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'quality_check',
    title: 'Quality Check',
    icon: CheckCircle,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'ready_to_ship',
    title: 'Ready to Ship',
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
];

export function OrdersKanban({
  orders,
  onOrderSelect,
  onStatusChange,
  selectedOrderId,
}: OrdersKanbanProps) {
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<OrderStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, orderId: number) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault();
    setDropTarget(status);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();
    if (!draggedOrderId) return;

    const order = orders.find((o) => o.id === draggedOrderId);
    if (!order || order.status === newStatus) {
      setDraggedOrderId(null);
      setDropTarget(null);
      return;
    }

    setDraggedOrderId(null);
    setDropTarget(null);

    await onStatusChange(draggedOrderId, newStatus);
  };

  const getOrdersForColumn = (status: OrderStatus) => {
    return orders
      .filter((o) => o.status === status)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const getPriorityBadge = (order: Order) => {
    const priority = getPriorityLevel(order.createdAt);
    if (priority === 'urgent') {
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    }
    if (priority === 'high') {
      return <Badge className="text-xs bg-orange-500 text-white">High</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Normal</Badge>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {KANBAN_COLUMNS.map((column) => {
        const Icon = column.icon;
        const columnOrders = getOrdersForColumn(column.id);
        const urgentCount = columnOrders.filter(
          (o) => getPriorityLevel(o.createdAt) === 'urgent'
        ).length;
        const isDropTarget = dropTarget === column.id;

        return (
          <div
            key={column.id}
            className="flex flex-col"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <Card className={cn('border-2', column.borderColor, column.bgColor)}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', column.color)} />
                    <CardTitle className="text-sm font-semibold">
                      {column.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {columnOrders.length}
                    </Badge>
                    {urgentCount > 0 && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Column Content */}
            <div
              className={cn(
                'mt-2 space-y-2 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors',
                isDropTarget
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent'
              )}
            >
              {columnOrders.map((order) => {
                const isSelected = selectedOrderId === order.id;
                const isDragging = draggedOrderId === order.id;

                return (
                  <Card
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onOrderSelect(order)}
                    className={cn(
                      'cursor-move hover:shadow-md transition-all',
                      isSelected && 'ring-2 ring-primary',
                      isDragging && 'opacity-50'
                    )}
                  >
                    <CardContent className="p-3 space-y-2">
                      {/* Order Number & Priority */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold">
                          {order.orderNumber}
                        </span>
                        {getPriorityBadge(order)}
                      </div>

                      {/* Customer */}
                      <div className="text-xs">
                        <p className="font-medium truncate">
                          {order.userName ||
                            [order.billingFirstName, order.billingLastName]
                              .filter(Boolean)
                              .join(' ') ||
                            'Guest'}
                        </p>
                        <p className="text-muted-foreground truncate">
                          {order.userEmail || order.billingEmail}
                        </p>
                      </div>

                      {/* Items Summary */}
                      <div className="pt-1 border-t">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {order.itemsSummary || `${order.itemCount} items`}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs font-semibold">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOrderSelect(order);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(order.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}

              {columnOrders.length === 0 && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">No orders</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
