import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/admin/print-queue/kanban-board';
import { List } from 'lucide-react';

export default async function PrintQueueKanbanPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch orders that are in production stages
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ['pending', 'processing', 'printing', 'quality_check', 'ready_to_ship'],
      },
    },
    include: {
      user: {
        select: {
          id: true,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Board</h1>
          <p className="text-muted-foreground">
            Drag and drop orders to update their production status
          </p>
        </div>
        <Link href="/admin/print-queue">
          <Button variant="outline">
            <List className="mr-2 h-4 w-4" />
            List View
          </Button>
        </Link>
      </div>

      <KanbanBoard orders={orders} />
    </div>
  );
}
