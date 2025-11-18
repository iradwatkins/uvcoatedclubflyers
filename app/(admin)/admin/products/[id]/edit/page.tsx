import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductEditForm } from '@/components/admin/products/product-edit-form';

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: true,
    },
  });

  if (!product) {
    redirect('/admin/products');
  }

  // Fetch all categories
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  // Fetch paper stocks
  const paperStocks = await prisma.$queryRaw<any[]>`
    SELECT id, name, display_order
    FROM paper_stocks
    WHERE is_active = true
    ORDER BY display_order
  `;

  // Fetch turnarounds
  const turnarounds = await prisma.$queryRaw<any[]>`
    SELECT id, name, production_days, display_order
    FROM turnarounds
    WHERE is_active = true
    ORDER BY display_order
  `;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">
          Update product details, pricing, and options
        </p>
      </div>

      <ProductEditForm
        product={product}
        categories={categories}
        paperStocks={paperStocks}
        turnarounds={turnarounds}
      />
    </div>
  );
}
