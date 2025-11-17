import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductConfigurator } from '@/components/product-configurator';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  return product;
}

export default async function ProductPage(props: ProductPageProps) {
  const params = await props.params;
  const product = await getProduct(params.id);

  if (!product || product.status !== 'active') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <ProductConfigurator product={product} />
      </div>
    </div>
  );
}
