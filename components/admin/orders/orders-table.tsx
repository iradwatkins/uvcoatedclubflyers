'use client';

import { useState } from 'react';
import { formatDate } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import type { Order, OrderStatus } from './types';
import { STATUS_CONFIG, getPriorityLevel } from './types';
import { cn } from '@/lib/utils';

interface OrdersTableProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  onStatusChange: (orderId: number, status: OrderStatus) => Promise<void>;
  selectedOrderId?: number | null;
}

type SortField = 'createdAt' | 'totalAmount' | 'status' | 'orderNumber';
type SortDirection = 'asc' | 'desc';

export function OrdersTable({
  orders,
  onOrderSelect,
  onStatusChange,
  selectedOrderId,
}: OrdersTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (orderId: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedIds(newSelected);
  };

  const handleStatusUpdate = async (orderId: number, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await onStatusChange(orderId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'createdAt':
        return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'totalAmount':
        return multiplier * (a.totalAmount - b.totalAmount);
      case 'status':
        return multiplier * a.status.localeCompare(b.status);
      case 'orderNumber':
        return multiplier * a.orderNumber.localeCompare(b.orderNumber);
      default:
        return 0;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const getPriorityBadge = (order: Order) => {
    const priority = getPriorityLevel(order.createdAt);
    if (priority === 'urgent') {
      return <Badge variant="destructive" className="text-xs ml-2">Urgent</Badge>;
    }
    if (priority === 'high') {
      return <Badge className="text-xs ml-2 bg-orange-500">High</Badge>;
    }
    return null;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.size === orders.length && orders.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('orderNumber')}
            >
              Order # <SortIcon field="orderNumber" />
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-center">Items</TableHead>
            <TableHead
              className="text-right cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('totalAmount')}
            >
              Total <SortIcon field="totalAmount" />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('status')}
            >
              Status <SortIcon field="status" />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('createdAt')}
            >
              Date <SortIcon field="createdAt" />
            </TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status];
            const isSelected = selectedOrderId === order.id;

            return (
              <TableRow
                key={order.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected && 'bg-primary/5'
                )}
                onClick={() => onOrderSelect(order)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(order.id)}
                    onCheckedChange={(checked) => handleSelectOne(order.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="font-mono text-sm font-medium">
                      {order.orderNumber}
                    </span>
                    {getPriorityBadge(order)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">
                      {order.userName ||
                        [order.billingFirstName, order.billingLastName].filter(Boolean).join(' ') ||
                        'Guest'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {order.userEmail || order.billingEmail}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm">{order.itemCount}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {updatingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusUpdate(order.id, value as OrderStatus)}
                      >
                        <SelectTrigger className={cn(
                          'h-8 w-[130px] text-xs',
                          statusConfig.bgColor,
                          statusConfig.color,
                          statusConfig.borderColor
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(new Date(order.createdAt), 'MMM d, yyyy')}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOrderSelect(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                No orders found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
