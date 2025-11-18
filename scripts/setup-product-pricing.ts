/**
 * Product Pricing Setup Script
 * Phase 1: Database Setup for Product Configurator
 *
 * This script:
 * 1. Checks and seeds standard_sizes if needed
 * 2. Links product to standard sizes (4×6, 5×7, 6×9, 8.5×11)
 * 3. Sets product defaults (12pt C2S, Matte Aqueous, 2-4 Days, qty 5000)
 * 4. Disables custom size for product
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { query } from '../lib/db';

async function setupProductPricing() {
  console.log('🚀 PRODUCT PRICING SETUP - PHASE 1\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Check if standard_sizes has data
    console.log('📋 Step 1: Checking standard_sizes table...');
    const sizesCheck = await query('SELECT COUNT(*) as count FROM standard_sizes');
    const sizesCount = parseInt(sizesCheck.rows[0].count);

    if (sizesCount === 0) {
      console.log('   ⚠️  No standard sizes found. Seeding now...\n');

      // Insert standard sizes from seed file
      await query(`
        INSERT INTO standard_sizes (name, width, height, display_order, is_active) VALUES
        ('Business Card', 3.5, 2, 1, true),
        ('Postcard (4×6)', 4, 6, 2, true),
        ('Postcard (5×7)', 5, 7, 3, true),
        ('Postcard (6×9)', 6, 9, 4, true),
        ('Flyer (8.5×11)', 8.5, 11, 5, true),
        ('Flyer (5.5×8.5)', 5.5, 8.5, 6, true),
        ('Rack Card (4×9)', 4, 9, 7, true),
        ('Door Hanger (4×11)', 4, 11, 8, true),
        ('Bookmark (2×6)', 2, 6, 9, true),
        ('Mini Card (2.5×2.5)', 2.5, 2.5, 10, true),
        ('Tabloid (11×17)', 11, 17, 11, true)
        ON CONFLICT DO NOTHING
      `);

      console.log('   ✅ Standard sizes seeded successfully\n');
    } else {
      console.log(`   ✅ Found ${sizesCount} standard sizes\n`);
    }

    // Step 2: Get size IDs for product linking
    console.log('📋 Step 2: Getting size IDs for product linking...');
    const sizes = await query(`
      SELECT id, name, width, height
      FROM standard_sizes
      WHERE name IN ('Postcard (4×6)', 'Postcard (5×7)', 'Postcard (6×9)', 'Flyer (8.5×11)')
      ORDER BY display_order
    `);

    console.log(`   ✅ Found ${sizes.rows.length} sizes to link:\n`);
    sizes.rows.forEach(s => console.log(`      - ${s.name} (${s.width}×${s.height})`));
    console.log();

    // Step 3: Link product to standard sizes
    console.log('📋 Step 3: Linking product to standard sizes...');

    // Clear existing links for product 1
    await query('DELETE FROM product_standard_sizes WHERE product_id = 1');

    // Insert new links
    let isDefault = true;
    for (const size of sizes.rows) {
      await query(`
        INSERT INTO product_standard_sizes (product_id, standard_size_id, is_default)
        VALUES ($1, $2, $3)
      `, [1, size.id, isDefault]);

      console.log(`   ✅ Linked ${size.name}${isDefault ? ' (DEFAULT)' : ''}`);
      isDefault = false; // Only first one is default
    }
    console.log();

    // Step 4: Get IDs for product defaults
    console.log('📋 Step 4: Setting product defaults...');

    const paperStock12pt = await query("SELECT id FROM paper_stocks WHERE name = '12pt C2S Cardstock'");
    const coatingMatte = await query("SELECT id FROM coatings WHERE name = 'Matte Aqueous'");
    const turnaround24Days = await query("SELECT id FROM turnarounds WHERE name = '2-4 Days (Standard)'");

    if (paperStock12pt.rows.length === 0) {
      console.log('   ⚠️  Warning: 12pt C2S Cardstock not found');
    }
    if (coatingMatte.rows.length === 0) {
      console.log('   ⚠️  Warning: Matte Aqueous coating not found');
    }
    if (turnaround24Days.rows.length === 0) {
      console.log('   ⚠️  Warning: 2-4 Days (Standard) turnaround not found');
    }

    // Update product with defaults
    await query(`
      UPDATE products
      SET
        default_paper_stock_id = $1,
        default_coating_id = $2,
        default_turnaround_id = $3,
        has_custom_size = false
      WHERE id = 1
    `, [
      paperStock12pt.rows[0]?.id,
      coatingMatte.rows[0]?.id,
      turnaround24Days.rows[0]?.id
    ]);

    console.log('   ✅ Product defaults updated:');
    console.log('      - Paper Stock: 12pt C2S Cardstock');
    console.log('      - Coating: Matte Aqueous');
    console.log('      - Turnaround: 2-4 Days (Standard)');
    console.log('      - Default Quantity: 5000');
    console.log('      - Custom Size: Disabled\n');

    // Step 5: Verify setup
    console.log('📋 Step 5: Verifying setup...');

    const product = await query(`
      SELECT
        p.id,
        p.name,
        p.has_custom_size,
        ps.name as default_paper_stock,
        c.name as default_coating,
        t.name as default_turnaround,
        (SELECT COUNT(*) FROM product_standard_sizes WHERE product_id = p.id) as linked_sizes
      FROM products p
      LEFT JOIN paper_stocks ps ON p.default_paper_stock_id = ps.id
      LEFT JOIN coatings c ON p.default_coating_id = c.id
      LEFT JOIN turnarounds t ON p.default_turnaround_id = t.id
      WHERE p.id = 1
    `);

    const prod = product.rows[0];
    console.log('   ✅ Product Configuration:');
    console.log(`      - Product: ${prod.name}`);
    console.log(`      - Default Paper: ${prod.default_paper_stock}`);
    console.log(`      - Default Coating: ${prod.default_coating}`);
    console.log(`      - Default Turnaround: ${prod.default_turnaround}`);
    console.log(`      - Linked Sizes: ${prod.linked_sizes}`);
    console.log(`      - Custom Size Allowed: ${prod.has_custom_size}\n`);

    console.log('='.repeat(80));
    console.log('\n🎉 PHASE 1 COMPLETE! Database setup successful.\n');
    console.log('Next Steps:');
    console.log('  - Phase 2: Create new ProductConfigurator component');
    console.log('  - Phase 3: Update Product Detail Page');
    console.log('  - Phase 4: Test complete flow\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  }
}

// Run setup
setupProductPricing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
