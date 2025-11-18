'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

type OrderStatus = 'pending' | 'processing' | 'printing' | 'quality_check' | 'ready_to_ship';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: Date;
  totalAmount: number;
  user: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  orderItems: Array<{
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
    };
  }>;
}

interface KanbanBoardProps {
  orders: Order[];
}

const stages = [
  {
    id: 'pending' as OrderStatus,
    title: 'Awaiting Files',
    icon: Clock,
    description: 'Orders pending file upload',
    color: 'bg-gray-100 border-gray-300',
  },
  {
    id: 'processing' as OrderStatus,
    title: 'Pre-Press',
    icon: FileText,
    description: 'File review and preparation',
    color: 'bg-blue-50 border-blue-300',
  },
  {
    id: 'printing' as OrderStatus,
    title: 'Printing',
    icon: Printer,
    description: 'Currently being printed',
    color: 'bg-purple-50 border-purple-300',
  },
  {
    id: 'quality_check' as OrderStatus,
    title: 'Quality Check',
    icon: CheckCircle,
    description: 'Quality inspection',
    color: 'bg-yellow-50 border-yellow-300',
  },
  {
    id: 'ready_to_ship' as OrderStatus,
    title: 'Ready to Ship',
    icon: Package,
    description: 'Ready for shipping',
    color: 'bg-green-50 border-green-300',
  },
];

export function KanbanBoard({ orders: initialOrders }: KanbanBoardProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [draggedOrder, setDraggedOrder] = useState<number | null>(null);

  const getPriorityLevel = (createdAt: Date) => {
    const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursOld > 48) return 'urgent';
    if (hoursOld > 24) return 'high';
    return 'normal';
  };

  const getPriorityBadge = (createdAt: Date) => {
    const priority = getPriorityLevel(createdAt);
    if (priority === 'urgent') {
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    } else if (priority === 'high') {
      return <Badge variant="default" className="text-xs">High</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Normal</Badge>;
  };

  const handleDragStart = (orderId: number) => {
    setDraggedOrder(orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();

    if (!draggedOrder) return;

    const order = orders.find(o => o.id === draggedOrder);
    if (!order || order.status === newStatus) {
      setDraggedOrder(null);
      return;
    }

    // Optimistically update UI
    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === draggedOrder ? { ...o, status: newStatus } : o
      )
    );

    try {
      const response = await fetch(`/api/admin/orders/${draggedOrder}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating order status:', error);
      // Revert on error
      setOrders(initialOrders);
      alert('Failed to update order status. Please try again.');
    }

    setDraggedOrder(null);
  };

  const getOrdersForStage = (stageId: OrderStatus) => {
    return orders.filter(order => order.status === stageId);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stages.map((stage) => {
        const Icon = stage.icon;
        const stageOrders = getOrdersForStage(stage.id);
        const urgentCount = stageOrders.filter(
          o => getPriorityLevel(o.createdAt) === 'urgent'
        ).length;

        return (
          <div
            key={stage.id}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <Card className={`border-2 ${stage.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-sm font-semibold">
                      {stage.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {stageOrders.length}
                    </Badge>
                    {urgentCount > 0 && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </CardHeader>
            </Card>

            <div className="mt-2 space-y-2 min-h-[200px]">
              {stageOrders.map((order) => (
                <Card
                  key={order.id}
                  draggable
                  onDragStart={() => handleDragStart(order.id)}
                  className="cursor-move hover:shadow-lg transition-shadow border-2"
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">
                        {order.orderNumber}
                      </span>
                      {getPriorityBadge(order.createdAt)}
                    </div>

                    <div className="text-xs">
                      <p className="font-medium truncate">
                        {order.user?.name || 'Guest'}
                      </p>
                      <p className="text-muted-foreground truncate">
                        {order.user?.email}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t">
                      {order.orderItems.map((item) => (
                        <p key={item.id} className="text-xs text-muted-foreground">
                          {item.quantity}× {item.product.name}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-xs font-semibold">
                        ${(order.totalAmount / 100).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        View
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {stageOrders.length === 0 && (
                <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
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
