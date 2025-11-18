import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { query } from '../lib/db';

async function addProductConfigFields() {
  console.log('🔄 Adding product configuration fields...\n');

  try {
    // Add columns
    await query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS quantities TEXT DEFAULT '25,50,100,250,500,1000,2500,5000',
      ADD COLUMN IF NOT EXISTS sizes TEXT DEFAULT '4x6,5x7,6x9,8.5x11',
      ADD COLUMN IF NOT EXISTS available_paper_stocks JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS available_turnarounds JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS mandatory_addons JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS available_addons JSONB DEFAULT '[]'::jsonb
    `);

    console.log('✅ Columns added successfully\n');

    // Update product 1 with defaults
    await query(`
      UPDATE products
      SET
        quantities = '25,50,100,250,500,1000,2500,5000',
        sizes = '4x6,5x7,6x9,8.5x11',
        available_paper_stocks = '[1,2,3,4,5,6,7]'::jsonb,
        available_turnarounds = '[6,7,8,2]'::jsonb,
        mandatory_addons = '[]'::jsonb,
        available_addons = '[]'::jsonb
      WHERE id = 1
    `);

    console.log('✅ Product 1 updated with default configuration\n');
    console.log('Configuration:');
    console.log('  - Quantities: 25,50,100,250,500,1000,2500,5000');
    console.log('  - Sizes: 4x6,5x7,6x9,8.5x11');
    console.log('  - Paper Stocks: All 7');
    console.log('  - Turnarounds: 4 selected\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addProductConfigFields();
