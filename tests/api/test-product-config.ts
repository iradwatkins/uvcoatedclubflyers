/**
 * Test script to verify product configuration
 */

import { query } from './lib/db';

async function testProductConfig() {
  try {
    console.log('Testing product configuration...\n');

    const result = await query(`
      SELECT
        id,
        name,
        quantities,
        sizes,
        available_paper_stocks,
        available_turnarounds
      FROM products
      WHERE id = 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ No product found with ID 1');
      return;
    }

    const product = result.rows[0];
    console.log('✅ Product found:', product.name);
    console.log('\nConfiguration:');
    console.log('- Quantities:', product.quantities);
    console.log('- Sizes:', product.sizes);
    console.log('- Available Paper Stocks:', product.available_paper_stocks);
    console.log('- Available Turnarounds:', product.available_turnarounds);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testProductConfig();
