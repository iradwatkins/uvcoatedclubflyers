import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductConfiguratorNew } from '@/components/product-configurator-new';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  return product;
}

export default async function ProductPage(props: ProductPageProps) {
  const params = await props.params;
  const productId = parseInt(params.id);

  const product = await getProduct(productId);

  if (!product || product.status !== 'active') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <ProductConfiguratorNew productId={productId} />
      </div>
    </div>
  );
}
