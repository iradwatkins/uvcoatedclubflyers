import { config } from 'dotenv';
import path from 'path';
import { prisma } from './lib/prisma';

config({ path: path.join(__dirname, '.env.local') });

async function checkProductOptions() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
      },
      take: 1
    });

    if (products.length === 0) {
      console.log('\n❌ No products found\n');
      process.exit(0);
    }

    const product = products[0];
    console.log(`\nChecking product options for: ${product.name}\n`);

    const options = await prisma.productOption.findMany({
      where: {
        productId: product.id
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    console.log(`Found ${options.length} product option(s):\n`);

    if (options.length === 0) {
      console.log('❌ NO OPTIONS FOUND - Need to seed product options!\n');
    } else {
      const grouped = options.reduce((acc: any, opt: any) => {
        if (!acc[opt.optionType]) {
          acc[opt.optionType] = [];
        }
        acc[opt.optionType].push(opt);
        return acc;
      }, {});

      Object.keys(grouped).forEach(type => {
        console.log(`\n${type.toUpperCase()}:`);
        grouped[type].forEach((opt: any) => {
          const defaultMark = opt.isDefault ? ' (DEFAULT)' : '';
          console.log(`  - ${opt.optionValue}: +$${opt.priceModifier}${defaultMark}`);
        });
      });
      console.log('\n✅ Product options exist\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkProductOptions();
