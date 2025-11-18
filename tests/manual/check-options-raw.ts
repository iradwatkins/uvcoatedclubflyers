import { config } from 'dotenv';
import path from 'path';
import { query } from './lib/db';

config({ path: path.join(__dirname, '.env.local') });

async function checkOptions() {
  try {
    const productResult = await query('SELECT id, name FROM products LIMIT 1');

    if (productResult.rows.length === 0) {
      console.log('\n❌ No products found\n');
      process.exit(0);
    }

    const product = productResult.rows[0];
    console.log(`\nChecking options for: ${product.name} (ID: ${product.id})\n`);

    const optionsResult = await query(
      'SELECT * FROM product_options WHERE product_id = $1 ORDER BY option_type, sort_order',
      [product.id]
    );

    console.log(`Found ${optionsResult.rows.length} option(s):\n`);

    if (optionsResult.rows.length === 0) {
      console.log('❌ NO OPTIONS FOUND - Need to seed product options!\n');
      console.log('Running seed script now...\n');
    } else {
      optionsResult.rows.forEach((opt: any) => {
        console.log(`  ${opt.option_type}: ${opt.option_value} (+$${opt.price_modifier}) ${opt.is_default ? '(DEFAULT)' : ''}`);
      });
      console.log('\n✅ Product options exist\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkOptions();
