'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductionJob {
  id: number;
  order_number: string;
  status: string;
  created_at: Date;
  total_amount: string;
  user_name: string | null;
  user_email: string;
  items_count: number;
  items_summary: string;
}

interface ProductionJobCardProps {
  job: ProductionJob;
}

function getPriorityBadge(createdAt: Date) {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

  if (hoursOld > 48) {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle className="mr-1 h-3 w-3" />
        Urgent ({Math.floor(hoursOld)}h)
      </Badge>
    );
  } else if (hoursOld > 24) {
    return (
      <Badge variant="default" className="text-xs bg-orange-500">
        High ({Math.floor(hoursOld)}h)
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      {Math.floor(hoursOld)}h ago
    </Badge>
  );
}

export function ProductionJobCard({ job }: ProductionJobCardProps) {
  const [status, setStatus] = useState(job.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${job.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus.toUpperCase() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setStatus(newStatus);
      // Refresh the page to show updated stats
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Order Number and Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/admin/orders/${job.id}`}
              className="font-mono text-sm font-semibold hover:underline"
            >
              #{job.order_number}
            </Link>
            {getPriorityBadge(job.created_at)}
          </div>

          {/* Customer Info */}
          <div>
            <p className="text-sm font-medium">{job.user_name || 'Guest'}</p>
            <p className="text-xs text-muted-foreground">{job.user_email}</p>
          </div>

          {/* Items Summary */}
          <div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {job.items_summary}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {job.items_count} item{job.items_count !== 1 ? 's' : ''} • $
              {parseFloat(job.total_amount).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link href={`/admin/orders/${job.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Selector */}
      <div className="mt-3 pt-3 border-t">
        <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">🟡 Pending</SelectItem>
            <SelectItem value="processing">🔵 Processing</SelectItem>
            <SelectItem value="printing">🟣 Printing</SelectItem>
            <SelectItem value="quality_check">🔷 Quality Check</SelectItem>
            <SelectItem value="ready_to_ship">📦 Ready to Ship</SelectItem>
            <SelectItem value="shipped">🚚 Shipped</SelectItem>
            <SelectItem value="completed">✅ Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
