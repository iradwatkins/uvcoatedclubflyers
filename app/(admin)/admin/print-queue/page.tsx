import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Printer, Clock, CheckCircle2, Kanban } from 'lucide-react';

async function getPrintJobs() {
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ['pending', 'processing', 'printing'],
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return orders;
}

function getPriorityBadge(createdAt: Date) {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

  if (hoursOld > 48) {
    return <Badge variant="destructive">Urgent</Badge>;
  } else if (hoursOld > 24) {
    return <Badge variant="default">High Priority</Badge>;
  } else {
    return <Badge variant="secondary">Normal</Badge>;
  }
}

export default async function PrintQueuePage() {
  const jobs = await getPrintJobs();

  const stats = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    printing: jobs.filter((j) => j.status === 'printing').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Print Queue</h1>
          <p className="text-muted-foreground">Manage and track printing jobs</p>
        </div>
        <Link href="/admin/print-queue/kanban">
          <Button>
            <Kanban className="mr-2 h-4 w-4" />
            Kanban View
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting print</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">Being prepared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Printing</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.printing}</div>
            <p className="text-xs text-muted-foreground">Currently printing</p>
          </CardContent>
        </Card>
      </div>

      {/* Print Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Print Jobs</CardTitle>
          <CardDescription>Orders ready for printing, sorted by oldest first</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-start justify-between rounded-lg border p-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{job.orderNumber}</span>
                    {getPriorityBadge(job.createdAt)}
                    <Badge variant="secondary">{job.status}</Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{job.user?.name || 'Guest'}</p>
                    <p className="text-sm text-muted-foreground">{job.user?.email}</p>
                  </div>

                  <div className="space-y-1">
                    {job.orderItems.map((item) => (
                      <p key={item.id} className="text-sm text-muted-foreground">
                        {item.quantity}× {item.product.name}
                      </p>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Ordered: {new Date(job.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <Select defaultValue={job.status}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="printing">Printing</SelectItem>
                      <SelectItem value="quality_check">Quality Check</SelectItem>
                      <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            {jobs.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No jobs in the print queue</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
