import { config } from 'dotenv';
import path from 'path';
import { prisma } from './lib/prisma';

config({ path: path.join(__dirname, '.env.local') });

async function checkProducts() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        sku: true
      },
      take: 10
    });

    console.log(`\nFound ${products.length} product(s):\n`);
    products.forEach(p => {
      console.log(`  - ${p.name} (${p.sku}) [${p.status}]`);
    });

    if (products.length === 0) {
      console.log('\n❌ NO PRODUCTS FOUND - Need to seed database!\n');
    } else {
      console.log(`\n✅ Products exist in database\n`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkProducts();
