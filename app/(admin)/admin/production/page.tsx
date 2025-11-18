import { query } from '@/lib/db';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Printer,
  CheckCircle2,
  Package,
  Truck,
  AlertCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { ProductionJobCard } from '@/components/admin/production-job-card';

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

async function getProductionJobs(): Promise<ProductionJob[]> {
  try {
    // Fetch orders in production workflow
    const ordersResult = await query(`
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.created_at,
        o.total_amount,
        u.name as user_name,
        u.email as user_email,
        COUNT(oi.id) as items_count,
        STRING_AGG(
          oi.quantity || 'x ' || oi.product_name,
          ', '
          ORDER BY oi.id
        ) as items_summary
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status IN ('pending', 'processing', 'printing', 'quality_check', 'ready_to_ship')
        AND o.payment_status = 'paid'
      GROUP BY o.id, o.order_number, o.status, o.created_at, o.total_amount, u.name, u.email
      ORDER BY
        CASE o.status
          WHEN 'pending' THEN 1
          WHEN 'processing' THEN 2
          WHEN 'printing' THEN 3
          WHEN 'quality_check' THEN 4
          WHEN 'ready_to_ship' THEN 5
        END,
        o.created_at ASC
    `);

    return ordersResult.rows.map((row: any) => ({
      id: row.id,
      order_number: row.order_number,
      status: row.status,
      created_at: row.created_at,
      total_amount: row.total_amount,
      user_name: row.user_name,
      user_email: row.user_email,
      items_count: parseInt(row.items_count),
      items_summary: row.items_summary || '',
    }));
  } catch (error) {
    console.error('Error fetching production jobs:', error);
    return [];
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'processing':
      return <FileText className="h-4 w-4" />;
    case 'printing':
      return <Printer className="h-4 w-4" />;
    case 'quality_check':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'ready_to_ship':
      return <Package className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: {
      label: 'Pending',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-200',
    },
    processing: {
      label: 'Processing',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
    },
    printing: {
      label: 'Printing',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50 border-purple-200',
    },
    quality_check: {
      label: 'Quality Check',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50 border-indigo-200',
    },
    ready_to_ship: {
      label: 'Ready to Ship',
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200',
    },
  };

  return configs[status] || configs.pending;
}

export default async function ProductionBoardPage() {
  const jobs = await getProductionJobs();

  const stats = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    printing: jobs.filter((j) => j.status === 'printing').length,
    quality_check: jobs.filter((j) => j.status === 'quality_check').length,
    ready_to_ship: jobs.filter((j) => j.status === 'ready_to_ship').length,
  };

  // Calculate urgency (orders older than 24/48 hours)
  const now = Date.now();
  const urgentJobs = jobs.filter((j) => {
    const age = now - new Date(j.created_at).getTime();
    return age > 48 * 60 * 60 * 1000; // 48 hours
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Board</h1>
          <p className="text-muted-foreground">
            Manage and track all production orders from start to finish
          </p>
        </div>
        <div className="flex items-center gap-2">
          {urgentJobs > 0 && (
            <Badge variant="destructive" className="text-sm">
              <AlertCircle className="mr-1 h-3 w-3" />
              {urgentJobs} Urgent
            </Badge>
          )}
          <Link href="/admin/orders">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              All Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">Being prepared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Printing</CardTitle>
            <Printer className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.printing}</div>
            <p className="text-xs text-muted-foreground">On press</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Check</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quality_check}</div>
            <p className="text-xs text-muted-foreground">Inspection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ready_to_ship}</div>
            <p className="text-xs text-muted-foreground">Awaiting shipment</p>
          </CardContent>
        </Card>
      </div>

      {/* Production Jobs by Status */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Pending */}
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending ({stats.pending})
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              New orders awaiting file prep
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {jobs
                .filter((job) => job.status === 'pending')
                .map((job) => (
                  <ProductionJobCard key={job.id} job={job} />
                ))}
              {stats.pending === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No pending orders
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processing */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Processing ({stats.processing})
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Files being prepared for print
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {jobs
                .filter((job) => job.status === 'processing')
                .map((job) => (
                  <ProductionJobCard key={job.id} job={job} />
                ))}
              {stats.processing === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No jobs in processing
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Printing */}
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Printer className="h-4 w-4 text-purple-600" />
                Printing ({stats.printing})
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Currently on the press
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {jobs
                .filter((job) => job.status === 'printing')
                .map((job) => (
                  <ProductionJobCard key={job.id} job={job} />
                ))}
              {stats.printing === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No jobs printing
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quality Check */}
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                Quality Check ({stats.quality_check})
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Inspecting for quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {jobs
                .filter((job) => job.status === 'quality_check')
                .map((job) => (
                  <ProductionJobCard key={job.id} job={job} />
                ))}
              {stats.quality_check === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No jobs in QC
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ready to Ship */}
        <Card className="border-green-200 bg-green-50/30 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-green-600" />
                Ready to Ship ({stats.ready_to_ship})
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Completed and awaiting shipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {jobs
                .filter((job) => job.status === 'ready_to_ship')
                .map((job) => (
                  <ProductionJobCard key={job.id} job={job} />
                ))}
              {stats.ready_to_ship === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No jobs ready to ship
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {jobs.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No Active Production Jobs</h3>
              <p className="text-muted-foreground mt-2">
                All orders are either shipped or awaiting payment
              </p>
              <Link href="/admin/orders">
                <Button variant="outline" className="mt-4">
                  View All Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
