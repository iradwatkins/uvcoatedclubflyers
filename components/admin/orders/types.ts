// Shared types for Order Command Center

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'printing'
  | 'quality_check'
  | 'ready_to_ship'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string | null;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  configuration: Record<string, unknown> | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  completedAt: Date | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number | null;
  totalAmount: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  billingFirstName: string | null;
  billingLastName: string | null;
  billingEmail: string | null;
  billingPhone: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostcode: string | null;
  shippingFirstName: string | null;
  shippingLastName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostcode: string | null;
  shippingCarrier: string | null;
  shippingService: string | null;
  shippingTrackingNumber: string | null;
  items: OrderItem[];
  itemCount: number;
  itemsSummary: string;
  customerNotes: string | null;
  internalNotes: string | null;
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  printing: number;
  qualityCheck: number;
  readyToShip: number;
  shipped: number;
  completed: number;
  cancelled: number;
  urgent: number;
  totalRevenue: number;
}

export type ViewMode = 'table' | 'kanban';

export type StatusFilter =
  | 'all'
  | 'active'
  | 'production'
  | 'needs_attention'
  | OrderStatus;

export interface FilterState {
  status: StatusFilter;
  search: string;
  dateRange: 'all' | '7d' | '30d' | '90d';
}

export const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  printing: {
    label: 'Printing',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  quality_check: {
    label: 'Quality Check',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-200',
  },
  ready_to_ship: {
    label: 'Ready to Ship',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-200',
  },
  shipped: {
    label: 'Shipped',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
};

export const PRODUCTION_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'printing',
  'quality_check',
  'ready_to_ship',
];

export function getPriorityLevel(createdAt: Date): 'urgent' | 'high' | 'normal' {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursOld > 48) return 'urgent';
  if (hoursOld > 24) return 'high';
  return 'normal';
}

export function getHoursOld(createdAt: Date): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
}
