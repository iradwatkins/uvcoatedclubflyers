import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProductAddOnsManager } from '@/components/admin/product-addons-manager';

interface ProductAddOnsPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: number) {
  const products = await prisma.$queryRaw<any[]>`
    SELECT * FROM products WHERE id = ${id} LIMIT 1
  `;

  return products[0] || null;
}

export default async function ProductAddOnsPage({ params }: ProductAddOnsPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  const { id } = await params;
  const productId = parseInt(id);

  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      {/* Back Button */}
      <Link
        href="/admin/products"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Link>

      {/* Product Add-Ons Manager */}
      <ProductAddOnsManager
        productId={productId}
        productName={product.name}
      />
    </div>
  );
}
