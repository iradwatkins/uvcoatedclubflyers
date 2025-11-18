'use client';

import { Check, Package, Printer, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from 'date-fns';

interface OrderTimelineProps {
  status: string;
  createdAt: Date;
  paidAt?: Date | null;
  completedAt?: Date | null;
  trackingNumber?: string | null;
}

const timelineSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Package, description: 'Order received' },
  { key: 'PROCESSING', label: 'Processing', icon: Clock, description: 'Preparing for production' },
  { key: 'PRINTING', label: 'Printing', icon: Printer, description: 'In production' },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck, description: 'On the way' },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2, description: 'Delivered' },
];

const statusOrder = ['PENDING', 'PENDING_PAYMENT', 'PROCESSING', 'PRINTING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

export function OrderTimeline({ status, createdAt, paidAt, completedAt, trackingNumber }: OrderTimelineProps) {
  const currentStatusIndex = statusOrder.indexOf(status);
  const isCancelled = status === 'CANCELLED';

  const getStepStatus = (stepKey: string): 'completed' | 'current' | 'upcoming' | 'cancelled' => {
    if (isCancelled) return 'cancelled';

    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentStatusIndex) return 'completed';
    if (stepKey === status) return 'current';
    return 'upcoming';
  };

  const getStepDate = (stepKey: string) => {
    switch (stepKey) {
      case 'PENDING':
        return createdAt;
      case 'PROCESSING':
        return paidAt || (currentStatusIndex >= statusOrder.indexOf('PROCESSING') ? createdAt : null);
      case 'COMPLETED':
        return completedAt;
      default:
        return null;
    }
  };

  if (isCancelled) {
    return (
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <XCircle className="h-8 w-8 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Order Cancelled</h3>
            <p className="text-sm text-red-700">This order was cancelled on {formatDate(completedAt || createdAt, 'MMMM d, yyyy')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="absolute left-[23px] top-[30px] h-[calc(100%-60px)] w-0.5 bg-gray-200">
        <div
          className="h-full w-full bg-primary transition-all duration-500"
          style={{
            transform: `scaleY(${Math.min((currentStatusIndex / (timelineSteps.length - 1)) * 100, 100)}%)`,
            transformOrigin: 'top',
          }}
        />
      </div>

      {/* Timeline Steps */}
      <div className="space-y-8">
        {timelineSteps.map((step, index) => {
          const stepStatus = getStepStatus(step.key);
          const stepDate = getStepDate(step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative flex items-start gap-4">
              {/* Icon Circle */}
              <div
                className={cn(
                  'z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background transition-colors',
                  stepStatus === 'completed' && 'border-primary bg-primary text-primary-foreground',
                  stepStatus === 'current' && 'border-primary bg-background text-primary',
                  stepStatus === 'upcoming' && 'border-gray-300 text-gray-400',
                  stepStatus === 'cancelled' && 'border-red-300 text-red-400'
                )}
              >
                {stepStatus === 'completed' ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={cn(
                      'font-semibold',
                      stepStatus === 'completed' && 'text-foreground',
                      stepStatus === 'current' && 'text-primary',
                      stepStatus === 'upcoming' && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </h4>
                  {stepDate && (
                    <span className="text-sm text-muted-foreground">
                      {formatDate(stepDate, 'MMM d, h:mm a')}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    'text-sm',
                    stepStatus === 'completed' && 'text-muted-foreground',
                    stepStatus === 'current' && 'text-foreground',
                    stepStatus === 'upcoming' && 'text-muted-foreground'
                  )}
                >
                  {step.description}
                </p>

                {/* Tracking Number for Shipped Status */}
                {step.key === 'SHIPPED' && trackingNumber && stepStatus !== 'upcoming' && (
                  <div className="mt-2 rounded-md bg-muted p-2">
                    <p className="text-xs text-muted-foreground">Tracking Number</p>
                    <p className="font-mono text-sm font-medium">{trackingNumber}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
