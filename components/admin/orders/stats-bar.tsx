'use client';

import { cn } from '@/lib/utils';
import {
  Clock,
  FileText,
  Printer,
  CheckCircle,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import type { OrderStats, StatusFilter } from './types';

interface StatsBarProps {
  stats: OrderStats;
  activeFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}

const statItems = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'yellow' },
  { key: 'processing', label: 'Processing', icon: FileText, color: 'blue' },
  { key: 'printing', label: 'Printing', icon: Printer, color: 'purple' },
  { key: 'qualityCheck', label: 'QC', icon: CheckCircle, color: 'indigo' },
  { key: 'readyToShip', label: 'Ready', icon: Package, color: 'cyan' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'green' },
] as const;

export function StatsBar({ stats, activeFilter, onFilterChange }: StatsBarProps) {
  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; activeBg: string; text: string; border: string }> = {
      yellow: {
        bg: 'bg-yellow-50 hover:bg-yellow-100',
        activeBg: 'bg-yellow-200 ring-2 ring-yellow-400',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
      },
      blue: {
        bg: 'bg-blue-50 hover:bg-blue-100',
        activeBg: 'bg-blue-200 ring-2 ring-blue-400',
        text: 'text-blue-700',
        border: 'border-blue-200',
      },
      purple: {
        bg: 'bg-purple-50 hover:bg-purple-100',
        activeBg: 'bg-purple-200 ring-2 ring-purple-400',
        text: 'text-purple-700',
        border: 'border-purple-200',
      },
      indigo: {
        bg: 'bg-indigo-50 hover:bg-indigo-100',
        activeBg: 'bg-indigo-200 ring-2 ring-indigo-400',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
      },
      cyan: {
        bg: 'bg-cyan-50 hover:bg-cyan-100',
        activeBg: 'bg-cyan-200 ring-2 ring-cyan-400',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
      },
      green: {
        bg: 'bg-green-50 hover:bg-green-100',
        activeBg: 'bg-green-200 ring-2 ring-green-400',
        text: 'text-green-700',
        border: 'border-green-200',
      },
      red: {
        bg: 'bg-red-50 hover:bg-red-100',
        activeBg: 'bg-red-200 ring-2 ring-red-400',
        text: 'text-red-700',
        border: 'border-red-200',
      },
    };
    const c = colors[color] || colors.yellow;
    return {
      container: isActive ? c.activeBg : c.bg,
      text: c.text,
      border: c.border,
    };
  };

  const getStatusKey = (key: string): StatusFilter => {
    const map: Record<string, StatusFilter> = {
      pending: 'pending',
      processing: 'processing',
      printing: 'printing',
      qualityCheck: 'quality_check',
      readyToShip: 'ready_to_ship',
      shipped: 'shipped',
    };
    return map[key] || 'all';
  };

  const handleClick = (key: string) => {
    const statusKey = getStatusKey(key);
    if (activeFilter === statusKey) {
      onFilterChange('active');
    } else {
      onFilterChange(statusKey);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {statItems.map((item) => {
        const Icon = item.icon;
        const statusKey = getStatusKey(item.key);
        const isActive = activeFilter === statusKey;
        const count = stats[item.key as keyof OrderStats] as number;
        const colors = getColorClasses(item.color, isActive);

        return (
          <button
            key={item.key}
            onClick={() => handleClick(item.key)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer',
              colors.container,
              colors.border
            )}
          >
            <Icon className={cn('h-4 w-4', colors.text)} />
            <span className={cn('text-sm font-medium', colors.text)}>
              {count} {item.label}
            </span>
          </button>
        );
      })}

      {stats.urgent > 0 && (
        <button
          onClick={() => onFilterChange(activeFilter === 'needs_attention' ? 'active' : 'needs_attention')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer',
            activeFilter === 'needs_attention'
              ? 'bg-red-200 ring-2 ring-red-400 border-red-200'
              : 'bg-red-50 hover:bg-red-100 border-red-200'
          )}
        >
          <AlertTriangle className="h-4 w-4 text-red-700" />
          <span className="text-sm font-medium text-red-700">
            {stats.urgent} Urgent
          </span>
        </button>
      )}

      <button
        onClick={() => onFilterChange('all')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer',
          activeFilter === 'all'
            ? 'bg-gray-200 ring-2 ring-gray-400 border-gray-200'
            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
        )}
      >
        <span className="text-sm font-medium text-gray-700">
          All ({stats.total})
        </span>
      </button>
    </div>
  );
}
