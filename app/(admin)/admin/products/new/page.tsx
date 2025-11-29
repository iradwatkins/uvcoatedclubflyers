import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductCreateForm } from '@/components/admin/products/product-create-form';

export default async function ProductCreatePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch all categories, paper stocks, and turnarounds
  const [categories, paperStocksResult, turnaroundsResult] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.$queryRaw<{ id: number; name: string; display_order: number }[]>`
      SELECT id, name, display_order FROM paper_stocks WHERE is_active = true ORDER BY display_order ASC
    `.catch(() => []),
    prisma.$queryRaw<{ id: number; name: string; production_days: number; display_order: number }[]>`
      SELECT id, name, production_days, display_order FROM turnarounds WHERE is_active = true ORDER BY display_order ASC
    `.catch(() => []),
  ]);

  const paperStocks = paperStocksResult || [];
  const turnarounds = turnaroundsResult || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <p className="text-muted-foreground">Add a new product to your catalog</p>
      </div>

      <ProductCreateForm
        categories={categories}
        paperStocks={paperStocks}
        turnarounds={turnarounds}
      />
    </div>
  );
}
