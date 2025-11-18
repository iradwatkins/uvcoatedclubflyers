/**
 * Test script for pricing engine
 * Tests the square inch based pricing calculation
 */

import { PricingEngine } from '../lib/services/pricing-engine';

async function testPricing() {
  console.log('Testing Pricing Engine...\n');

  // Test 1: Basic 4×6 postcard calculation
  console.log('Test 1: 4×6 Postcard - 500 qty, 12pt C2S, Matte Aqueous, Economy turnaround');
  console.log('Expected: Square inch pricing with 12pt using 9pt base × 2.0x markup');

  try {
    const result = await PricingEngine.calculatePrice({
      productId: 1,
      paperStockId: 5, // 12pt C2S Cardstock
      coatingId: 3, // Matte Aqueous
      turnaroundId: 6, // 2-4 Days Standard (economy)
      quantity: 500,
      width: 4.0,
      height: 6.0,
      sides: 'double',
      addOns: []
    });

    console.log('\nPrice Breakdown:');
    console.log('================');
    console.log(`Size: ${result.size}`);
    console.log(`Square inches: ${result.squareInches}`);
    console.log(`Price per sq in: $${result.pricePerSqIn}`);
    console.log(`Sides multiplier: ${result.sidesMultiplier}x`);
    console.log(`Turnaround multiplier: ${result.turnaroundMultiplier}x`);
    console.log(`Base cost: $${result.baseCost.toFixed(2)}`);
    console.log(`Markup (${result.markupMultiplier}x): $${result.markupAmount.toFixed(2)}`);
    console.log(`Subtotal: $${result.subtotal.toFixed(2)}`);
    console.log(`\nTOTAL: $${result.totalPrice.toFixed(2)}`);
    console.log(`Unit price: $${result.unitPrice.toFixed(4)}`);
    console.log(`\n✓ Test 1 passed!\n`);
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
  }

  // Test 2: With add-ons
  console.log('\n========================================\n');
  console.log('Test 2: 4×6 Postcard with add-ons - 1000 qty');
  console.log('Add-ons: Perforation ($20 + $0.01/piece)');

  try {
    const result = await PricingEngine.calculatePrice({
      productId: 1,
      paperStockId: 5, // 12pt C2S
      coatingId: 3, // Matte Aqueous
      turnaroundId: 6, // 2-4 Days
      quantity: 1000,
      width: 4.0,
      height: 6.0,
      sides: 'double',
      addOns: [
        {
          addOnId: 7, // Perforation
          subOptions: {
            vertical_count: 1,
            vertical_position: '3.5"',
            horizontal_count: 0,
            horizontal_position: ''
          }
        }
      ]
    });

    console.log('\nPrice Breakdown:');
    console.log('================');
    console.log(`Base price: $${result.subtotal.toFixed(2)}`);
    console.log(`\nAdd-ons:`);
    result.addOnsDetails.forEach(addon => {
      console.log(`  - ${addon.name}: $${addon.cost.toFixed(2)} (${addon.description})`);
    });
    console.log(`Total add-ons: $${result.addOnsCost.toFixed(2)}`);
    console.log(`\nTOTAL: $${result.totalPrice.toFixed(2)}`);
    console.log(`Unit price: $${result.unitPrice.toFixed(4)}`);
    console.log(`\n✓ Test 2 passed!\n`);
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
  }

  // Test 3: With discount add-on
  console.log('\n========================================\n');
  console.log('Test 3: 4×6 Postcard with Our Tagline (5% discount)');

  try {
    const result = await PricingEngine.calculatePrice({
      productId: 1,
      paperStockId: 5,
      coatingId: 3,
      turnaroundId: 6,
      quantity: 500,
      width: 4.0,
      height: 6.0,
      sides: 'double',
      addOns: [
        {
          addOnId: 19, // Our Tagline (5% discount)
          subOptions: {}
        }
      ]
    });

    console.log('\nPrice Breakdown:');
    console.log('================');
    console.log(`Subtotal: $${result.subtotal.toFixed(2)}`);
    console.log(`Discount (5% of markup): -$${result.discountAmount.toFixed(2)}`);
    console.log(`\nTOTAL: $${result.totalPrice.toFixed(2)}`);
    console.log(`\n✓ Test 3 passed!\n`);
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
  }

  console.log('\n========================================');
  console.log('All pricing tests completed!');
  console.log('========================================\n');
}

testPricing().catch(console.error);
