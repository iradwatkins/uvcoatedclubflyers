import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sourceProductId = parseInt(id);

    // Fetch the source product using raw SQL
    const sourceProducts = await prisma.$queryRaw<any[]>`
      SELECT * FROM products WHERE id = ${sourceProductId}
    `;

    if (sourceProducts.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const sourceProduct = sourceProducts[0];

    // Create the duplicate product name
    const duplicateName = `${sourceProduct.name} (Copy)`;

    // Create duplicate SKU (append -copy or increment)
    let duplicateSku = sourceProduct.sku ? `${sourceProduct.sku}-copy` : null;

    // Check if this SKU already exists and increment if needed
    if (duplicateSku) {
      let counter = 1;
      let skuCheck = await prisma.$queryRaw<any[]>`
        SELECT id FROM products WHERE sku = ${duplicateSku}
      `;

      while (skuCheck.length > 0) {
        counter++;
        duplicateSku = sourceProduct.sku ? `${sourceProduct.sku}-copy-${counter}` : null;
        skuCheck = await prisma.$queryRaw<any[]>`
          SELECT id FROM products WHERE sku = ${duplicateSku}
        `;
      }
    }

    // Create the new product using raw SQL
    const newProducts = await prisma.$queryRaw<any[]>`
      INSERT INTO products (
        name,
        description,
        base_price,
        sku,
        image_url,
        image_url_2,
        image_url_3,
        image_url_4,
        is_active,
        is_featured,
        category_id,
        quantities,
        sizes,
        available_paper_stocks,
        available_turnarounds,
        created_at,
        updated_at
      ) VALUES (
        ${duplicateName},
        ${sourceProduct.description},
        ${sourceProduct.base_price},
        ${duplicateSku},
        ${sourceProduct.image_url},
        ${sourceProduct.image_url_2},
        ${sourceProduct.image_url_3},
        ${sourceProduct.image_url_4},
        false,
        false,
        ${sourceProduct.category_id},
        ${sourceProduct.quantities},
        ${sourceProduct.sizes},
        ${JSON.stringify(sourceProduct.available_paper_stocks)}::jsonb,
        ${JSON.stringify(sourceProduct.available_turnarounds)}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;

    const newProduct = newProducts[0];

    // Copy product-addon relationships
    const productAddons = await prisma.$queryRaw<any[]>`
      SELECT addon_id, is_mandatory, is_enabled
      FROM product_addons
      WHERE product_id = ${sourceProductId}
    `;

    if (productAddons.length > 0) {
      for (const pa of productAddons) {
        await prisma.$executeRaw`
          INSERT INTO product_addons (product_id, addon_id, is_mandatory, is_enabled)
          VALUES (${newProduct.id}, ${pa.addon_id}, ${pa.is_mandatory}, ${pa.is_enabled})
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product duplicated successfully',
      productId: newProduct.id,
      productName: newProduct.name,
    });
  } catch (error) {
    console.error('Duplicate product error:', error);
    return NextResponse.json({ error: 'Failed to duplicate product' }, { status: 500 });
  }
}
