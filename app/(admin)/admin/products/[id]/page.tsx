import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Copy, Trash2 } from 'lucide-react';
import { ProductViewDetails } from '@/components/admin/products/product-view-details';
import { ProductDeleteDialog } from '@/components/admin/products/product-delete-dialog';
import { ProductDuplicateButton } from '@/components/admin/products/product-duplicate-button';

interface ProductViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      productAddons: {
        include: {
          addon: true,
        },
        orderBy: {
          addon: {
            displayOrder: 'asc',
          },
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  // Manually count order items using raw SQL
  const countResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM order_items WHERE product_id = ${id}
  `;
  const orderItemCount = Number(countResult[0]?.count || 0);

  return {
    ...product,
    _count: {
      orderItems: orderItemCount,
    },
  };
}

export default async function ProductViewPage({ params }: ProductViewPageProps) {
  const session = await auth();

  // Require authentication and admin role
  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const productId = parseInt(id);

  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Product Details</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/products/${product.id}/edit`}>
            <Button variant="default">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <ProductDuplicateButton productId={product.id} productName={product.name} />
          <ProductDeleteDialog
            productId={product.id}
            productName={product.name}
            orderCount={product._count?.orderItems || 0}
          />
        </div>
      </div>

      {/* Product Details */}
      <ProductViewDetails product={product} />
    </div>
  );
}
