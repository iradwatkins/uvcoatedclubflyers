'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StatsBar } from './stats-bar';
import { FilterBar } from './filter-bar';
import { OrderDetailPanel } from './order-detail-panel';
import { OrdersTable } from './orders-table';
import { OrdersKanban } from './orders-kanban';
import type {
  Order,
  OrderStats,
  OrderStatus,
  ViewMode,
  StatusFilter,
  FilterState,
} from './types';
import { PRODUCTION_STATUSES, getPriorityLevel } from './types';

interface OrderCommandCenterProps {
  initialOrders: Order[];
  initialStats: OrderStats;
}

export function OrderCommandCenter({
  initialOrders,
  initialStats,
}: OrderCommandCenterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [stats] = useState<OrderStats>(initialStats);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'table'
  );

  const [filters, setFilters] = useState<FilterState>({
    status: (searchParams.get('status') as StatusFilter) || 'active',
    search: searchParams.get('search') || '',
    dateRange: (searchParams.get('dateRange') as FilterState['dateRange']) || 'all',
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (viewMode !== 'table') params.set('view', viewMode);
    if (filters.status !== 'active') params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (filters.dateRange !== 'all') params.set('dateRange', filters.dateRange);

    const newUrl = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [viewMode, filters]);

  // Filter orders based on current filters
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (filters.status === 'active') {
      if (!PRODUCTION_STATUSES.includes(order.status)) return false;
    } else if (filters.status === 'production') {
      if (!['processing', 'printing', 'quality_check'].includes(order.status)) return false;
    } else if (filters.status === 'needs_attention') {
      const priority = getPriorityLevel(order.createdAt);
      if (priority !== 'urgent' && order.status !== 'pending') return false;
    } else if (filters.status !== 'all') {
      if (order.status !== filters.status) return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesOrder = order.orderNumber.toLowerCase().includes(searchLower);
      const matchesName = (order.userName || '').toLowerCase().includes(searchLower);
      const matchesEmail = (order.userEmail || '').toLowerCase().includes(searchLower);
      const matchesBillingName = [order.billingFirstName, order.billingLastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchLower);

      if (!matchesOrder && !matchesName && !matchesEmail && !matchesBillingName) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      if (orderDate < cutoff) return false;
    }

    return true;
  });

  // Handle status change
  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Update selected order if it's the one being changed
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      }

      // Refresh page data
      router.refresh();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  // Handle order selection
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  // Handle filter from stats bar
  const handleStatusFilter = (status: StatusFilter) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedOrder) {
        setSelectedOrder(null);
      }

      if (selectedOrder && filteredOrders.length > 0) {
        const currentIndex = filteredOrders.findIndex((o) => o.id === selectedOrder.id);

        if (e.key === 'ArrowDown' || e.key === 'j') {
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, filteredOrders.length - 1);
          setSelectedOrder(filteredOrders[nextIndex]);
        }

        if (e.key === 'ArrowUp' || e.key === 'k') {
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          setSelectedOrder(filteredOrders[prevIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder, filteredOrders]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Order Command Center</h1>
        <p className="text-muted-foreground">
          Manage orders, track production, and monitor workflow
        </p>
      </div>

      {/* Stats Bar */}
      <StatsBar
        stats={stats}
        activeFilter={filters.status}
        onFilterChange={handleStatusFilter}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>

      {/* Main Content */}
      <div className={selectedOrder ? 'mr-[420px] transition-all' : 'transition-all'}>
        {viewMode === 'table' ? (
          <OrdersTable
            orders={filteredOrders}
            onOrderSelect={handleOrderSelect}
            onStatusChange={handleStatusChange}
            selectedOrderId={selectedOrder?.id}
          />
        ) : (
          <OrdersKanban
            orders={filteredOrders}
            onOrderSelect={handleOrderSelect}
            onStatusChange={handleStatusChange}
            selectedOrderId={selectedOrder?.id}
          />
        )}
      </div>

      {/* Detail Panel */}
      {selectedOrder && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedOrder(null)}
          />
          <OrderDetailPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={handleStatusChange}
          />
        </>
      )}
    </div>
  );
}
