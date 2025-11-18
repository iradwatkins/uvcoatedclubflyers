import { prisma } from '../prisma';

export async function seedProducts() {
  console.log('Seeding categories...');

  // Create "All Products" category
  const allProductsCategory = await prisma.category.create({
    name: 'All Products',
    slug: 'all-products',
    description: 'All available printing products',
    sortOrder: 0,
    isActive: true,
  });

  console.log('✓ Created category:', allProductsCategory.name);

  console.log('\nSeeding products...');

  // Create "Flyer Pricing" product
  const flyerProduct = await prisma.product.create({
    sku: 'FLY-4X6-001',
    name: 'Flyer Pricing',
    description:
      'Premium UV coated club flyers - Professional quality printing with fast turnaround. Perfect for events, promotions, and marketing materials.',
    basePrice: 175.0,
    status: 'active',
    productType: 'flyer',
    categoryId: allProductsCategory.id,
    imageUrl: '/images/products/flyer-pricing-main.jpg',
  });

  console.log('✓ Created product:', flyerProduct.name, `(ID: ${flyerProduct.id})`);

  console.log('\nSeeding product options...');

  // Create product options
  const options = [
    // Size Options
    {
      productId: flyerProduct.id,
      optionType: 'size',
      optionName: 'Size',
      optionValue: '4x6',
      priceModifier: 0.0,
      isDefault: true,
      sortOrder: 1,
    },
    {
      productId: flyerProduct.id,
      optionType: 'size',
      optionName: 'Size',
      optionValue: '5x7',
      priceModifier: 0.5,
      isDefault: false,
      sortOrder: 2,
    },
    {
      productId: flyerProduct.id,
      optionType: 'size',
      optionName: 'Size',
      optionValue: '8.5x11',
      priceModifier: 1.25,
      isDefault: false,
      sortOrder: 3,
    },

    // Coating Options
    {
      productId: flyerProduct.id,
      optionType: 'coating',
      optionName: 'Coating',
      optionValue: 'No Coating',
      priceModifier: 0.0,
      isDefault: true,
      sortOrder: 1,
    },
    {
      productId: flyerProduct.id,
      optionType: 'coating',
      optionName: 'Coating',
      optionValue: 'Gloss Aqueous',
      priceModifier: 0.15,
      isDefault: false,
      sortOrder: 2,
    },
    {
      productId: flyerProduct.id,
      optionType: 'coating',
      optionName: 'Coating',
      optionValue: 'Matte Aqueous',
      priceModifier: 0.15,
      isDefault: false,
      sortOrder: 3,
    },
    {
      productId: flyerProduct.id,
      optionType: 'coating',
      optionName: 'Coating',
      optionValue: 'UV One Side',
      priceModifier: 0.25,
      isDefault: false,
      sortOrder: 4,
    },
    {
      productId: flyerProduct.id,
      optionType: 'coating',
      optionName: 'Coating',
      optionValue: 'UV Both Sides',
      priceModifier: 0.4,
      isDefault: false,
      sortOrder: 5,
    },

    // Material Options
    {
      productId: flyerProduct.id,
      optionType: 'material',
      optionName: 'Material',
      optionValue: '9pt C2S Cardstock',
      priceModifier: 0.0,
      isDefault: true,
      sortOrder: 1,
    },
    {
      productId: flyerProduct.id,
      optionType: 'material',
      optionName: 'Material',
      optionValue: '12pt C2S Cardstock',
      priceModifier: 0.2,
      isDefault: false,
      sortOrder: 2,
    },
    {
      productId: flyerProduct.id,
      optionType: 'material',
      optionName: 'Material',
      optionValue: '14pt C2S Cardstock',
      priceModifier: 0.3,
      isDefault: false,
      sortOrder: 3,
    },
    {
      productId: flyerProduct.id,
      optionType: 'material',
      optionName: 'Material',
      optionValue: '16pt C2S Cardstock',
      priceModifier: 0.4,
      isDefault: false,
      sortOrder: 4,
    },

    // Sides Options
    {
      productId: flyerProduct.id,
      optionType: 'sides',
      optionName: 'Sides',
      optionValue: 'Single-Sided',
      priceModifier: 0.0,
      isDefault: true,
      sortOrder: 1,
    },
    {
      productId: flyerProduct.id,
      optionType: 'sides',
      optionName: 'Sides',
      optionValue: 'Double-Sided',
      priceModifier: 0.35,
      isDefault: false,
      sortOrder: 2,
    },

    // Turnaround Options
    {
      productId: flyerProduct.id,
      optionType: 'turnaround',
      optionName: 'Turnaround',
      optionValue: '5-7 Days (Economy)',
      priceModifier: 0.0,
      isDefault: true,
      sortOrder: 1,
    },
    {
      productId: flyerProduct.id,
      optionType: 'turnaround',
      optionName: 'Turnaround',
      optionValue: '2-4 Days (Fast)',
      priceModifier: 15.0,
      isDefault: false,
      sortOrder: 2,
    },
    {
      productId: flyerProduct.id,
      optionType: 'turnaround',
      optionName: 'Turnaround',
      optionValue: 'Next Day (Faster)',
      priceModifier: 35.0,
      isDefault: false,
      sortOrder: 3,
    },
    {
      productId: flyerProduct.id,
      optionType: 'turnaround',
      optionName: 'Turnaround',
      optionValue: 'Same Day (Crazy Fast)',
      priceModifier: 75.0,
      isDefault: false,
      sortOrder: 4,
    },
  ];

  await prisma.productOption.createMany({
    data: options,
  });

  console.log(`✓ Created ${options.length} product options`);
  console.log('\n✅ Product seeding complete!');
  console.log('\nSummary:');
  console.log(`  - 1 category (${allProductsCategory.name})`);
  console.log(`  - 1 product (${flyerProduct.name})`);
  console.log(`  - ${options.length} product options:`);
  console.log(`    • 3 size options`);
  console.log(`    • 4 material options (paper stock)`);
  console.log(`    • 2 sides options`);
  console.log(`    • 5 coating options`);
  console.log(`    • 4 turnaround options`);
}
