import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { QuickProductConfigurator } from '@/components/quick-product-configurator';

interface QuickProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  image_url: string | null;
  fixed_width: string;
  fixed_height: string;
  fixed_sides: string;
  fixed_paper_stock_id: number;
  fixed_coating_id: number;
  paper_stock_name: string;
  coating_name: string;
}

async function getQuickProduct(slug: string): Promise<QuickProduct | null> {
  const result = await query(
    `SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.base_price,
      p.image_url,
      p.fixed_width,
      p.fixed_height,
      p.fixed_sides,
      p.fixed_paper_stock_id,
      p.fixed_coating_id,
      ps.name as paper_stock_name,
      c.name as coating_name
    FROM products p
    LEFT JOIN paper_stocks ps ON p.fixed_paper_stock_id = ps.id
    LEFT JOIN coatings c ON p.fixed_coating_id = c.id
    WHERE p.slug = $1
      AND p.is_quick_product = true
      AND p.status = 'active'`,
    [slug]
  );

  return result.rows[0] || null;
}

async function getTurnarounds() {
  const result = await query(
    `SELECT id, name, slug, description, production_days, category
    FROM turnarounds
    WHERE is_active = true
    ORDER BY display_order ASC`
  );
  return result.rows;
}

export default async function QuickProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product, turnarounds] = await Promise.all([
    getQuickProduct(slug),
    getTurnarounds(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <QuickProductConfigurator
          product={product}
          turnarounds={turnarounds}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getQuickProduct(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name} | UV Coated Club Flyers`,
    description: product.description,
  };
}
