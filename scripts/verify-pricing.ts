/**
 * Pricing Verification Script
 * Tests pricing calculations against documentation examples
 *
 * Expected Results from printing-website-seed-document.md:
 *
 * Test Case 1: 9pt C2S, 4×6, 5000 qty, Economy (2-4 days)
 *   Base Cost: $86.88
 *   Retail Price: $200.49
 *   Per Piece: $0.040
 *
 * Test Case 2: 12pt C2S, 4×6, 5000 qty, Economy
 *   Base Cost: $86.88 (uses 9pt pricing)
 *   Retail Price: $173.76 (2.0x markup, not 2.308x)
 *   Per Piece: $0.035
 *
 * Test Case 3: 14pt C2S, 4×6, 5000 qty, Economy
 *   Base Cost: $129.60 (uses 16pt pricing @ 0.0015/sq in × 0.72 × 24 sq in × 5000)
 *   Retail Price: $259.20 (2.0x markup)
 */

import { PricingEngine } from '../lib/services/pricing-engine';
import { query } from '../lib/db';

interface TestCase {
  name: string;
  input: {
    productId: number;
    paperStockId: number;
    coatingId: number;
    turnaroundId: number;
    quantity: number;
    width: number;
    height: number;
    sides: 'single' | 'double';
  };
  expected: {
    baseCost: number;
    retailPrice: number;
    perPiece: number;
  };
}

const testCases: TestCase[] = [
  {
    name: 'Test Case 1: 9pt C2S, 4×6, 5000 qty, Both Sides, Economy (2-4 Days)',
    input: {
      productId: 1,
      paperStockId: 1, // 9pt C2S Cardstock
      coatingId: 2, // Gloss Aqueous
      turnaroundId: 6, // 2-4 Days (economy)
      quantity: 5000,
      width: 4,
      height: 6,
      sides: 'double', // 4/4
    },
    expected: {
      baseCost: 86.88,
      retailPrice: 200.49,
      perPiece: 0.040,
    },
  },
  {
    name: 'Test Case 2: 12pt C2S, 4×6, 5000 qty, Both Sides, Economy - Special Markup',
    input: {
      productId: 1,
      paperStockId: 5, // 12pt C2S Cardstock (uses 9pt pricing with 2.0x markup)
      coatingId: 3, // Matte Aqueous
      turnaroundId: 6, // 2-4 Days (economy)
      quantity: 5000,
      width: 4,
      height: 6,
      sides: 'double',
    },
    expected: {
      baseCost: 86.88, // Same as 9pt
      retailPrice: 173.76, // 2.0x markup instead of 2.308x
      perPiece: 0.0348,
    },
  },
  {
    name: 'Test Case 3: 16pt C2S, 4×6, 5000 qty, Both Sides, Economy',
    input: {
      productId: 1,
      paperStockId: 2, // 16pt C2S Cardstock
      coatingId: 3, // Matte Aqueous
      turnaroundId: 6, // 2-4 Days (economy)
      quantity: 5000,
      width: 4,
      height: 6,
      sides: 'double',
    },
    expected: {
      baseCost: 114.00, // 0.0015 × 1.0 × 0.95 × 24 × 5000
      retailPrice: 263.11, // × 2.308
      perPiece: 0.0526,
    },
  },
  {
    name: 'Test Case 4: 60lb Offset, 4×6, 5000 qty, Both Sides (1.75x multiplier), Economy',
    input: {
      productId: 1,
      paperStockId: 3, // 60 lb Offset
      coatingId: 1, // No Coating
      turnaroundId: 6, // 2-4 Days (economy)
      quantity: 5000,
      width: 4,
      height: 6,
      sides: 'double', // Should get 1.75x multiplier for text paper
    },
    expected: {
      baseCost: 60.48, // 0.0008 × 1.75 × 0.72 × 24 × 5000
      retailPrice: 139.55, // × 2.308
      perPiece: 0.0279,
    },
  },
  {
    name: 'Test Case 5: 9pt C2S, 4×6, 10000 qty (quantity scaling)',
    input: {
      productId: 1,
      paperStockId: 1, // 9pt C2S
      coatingId: 2, // Gloss Aqueous
      turnaroundId: 6, // 2-4 Days (economy)
      quantity: 10000, // > 5000, should use 5000 multiplier and scale linearly
      width: 4,
      height: 6,
      sides: 'double',
    },
    expected: {
      baseCost: 173.76, // $86.88 × 2 (double quantity)
      retailPrice: 400.98, // $200.49 × 2
      perPiece: 0.040, // Same per-piece rate as 5000 qty
    },
  },
  {
    name: 'Test Case 6: 9pt C2S, 4×6, 250 qty, Economy',
    input: {
      productId: 1,
      paperStockId: 1,
      coatingId: 2,
      turnaroundId: 6,
      quantity: 250,
      width: 4,
      height: 6,
      sides: 'double',
    },
    expected: {
      baseCost: 20.94, // 0.0010 × 1.0 × 3.49 × 24 × 250
      retailPrice: 48.33, // × 2.308
      perPiece: 0.1933,
    },
  },
  {
    name: 'Test Case 7: 9pt C2S, 4×6, 5000 qty, Faster (Next Day)',
    input: {
      productId: 1,
      paperStockId: 1,
      coatingId: 2,
      turnaroundId: 2, // Next Day (faster category)
      quantity: 5000,
      width: 4,
      height: 6,
      sides: 'double',
    },
    expected: {
      baseCost: 150.00, // 0.0010 × 1.0 × 1.25 × 24 × 5000
      retailPrice: 339.90, // × 2.266 (faster markup)
      perPiece: 0.0680,
    },
  },
  {
    name: 'Test Case 8: 9pt C2S, 4×6, 5000 qty, Same Day (crazy_fast)',
    input: {
      productId: 1,
      paperStockId: 1,
      coatingId: 2,
      turnaroundId: 1, // Same Day (crazy_fast)
      quantity: 5000,
      width: 4,
      height: 6,
      sides: 'double',
    },
    expected: {
      baseCost: 928.80, // 0.0010 × 1.0 × 7.74 × 24 × 5000
      retailPrice: 928.80, // × 1.0 (no markup for same day)
      perPiece: 0.1858,
    },
  },
];

async function runTests() {
  console.log('🧪 PRICING VERIFICATION TEST SUITE\n');
  console.log('Testing against documentation examples from printing-website-seed-document.md\n');
  console.log('='.repeat(100) + '\n');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const testCase of testCases) {
    console.log(`📊 ${testCase.name}`);
    console.log('-'.repeat(100));

    try {
      const result = await PricingEngine.calculatePrice(testCase.input);

      // Check base cost (within $0.10 tolerance)
      const baseCostMatch = Math.abs(result.baseCost - testCase.expected.baseCost) < 0.10;
      const baseCostStatus = baseCostMatch ? '✅' : '❌';

      // Check retail price (within $0.10 tolerance)
      const retailPriceMatch = Math.abs(result.totalPrice - testCase.expected.retailPrice) < 0.10;
      const retailPriceStatus = retailPriceMatch ? '✅' : '❌';

      // Check per piece (within $0.001 tolerance)
      const perPieceMatch = Math.abs(result.unitPrice - testCase.expected.perPiece) < 0.001;
      const perPieceStatus = perPieceMatch ? '✅' : '❌';

      console.log(`  Base Cost:       ${baseCostStatus} Expected: $${testCase.expected.baseCost.toFixed(2)}, Got: $${result.baseCost.toFixed(2)}`);
      console.log(`  Retail Price:    ${retailPriceStatus} Expected: $${testCase.expected.retailPrice.toFixed(2)}, Got: $${result.totalPrice.toFixed(2)}`);
      console.log(`  Per Piece:       ${perPieceStatus} Expected: $${testCase.expected.perPiece.toFixed(4)}, Got: $${result.unitPrice.toFixed(4)}`);

      console.log(`\n  📋 Calculation Details:`);
      console.log(`     Price/sq in:     $${result.pricePerSqIn.toFixed(10)}`);
      console.log(`     Square inches:   ${result.squareInches} (${testCase.input.width}×${testCase.input.height})`);
      console.log(`     Sides mult:      ${result.sidesMultiplier}x`);
      console.log(`     Turnaround mult: ${result.turnaroundMultiplier}x`);
      console.log(`     Markup mult:     ${result.markupMultiplier}x`);
      console.log(`     Markup amount:   $${result.markupAmount.toFixed(2)}`);

      if (baseCostMatch && retailPriceMatch && perPieceMatch) {
        console.log(`\n  ✅ PASS\n`);
        passed++;
      } else {
        console.log(`\n  ❌ FAIL\n`);
        failed++;
        failures.push(testCase.name);
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
      failed++;
      failures.push(`${testCase.name} (ERROR)`);
    }
  }

  console.log('='.repeat(100));
  console.log(`\n📈 TEST RESULTS:`);
  console.log(`  ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`  ❌ Failed: ${failed}/${testCases.length}`);

  if (failures.length > 0) {
    console.log(`\n❌ Failed Tests:`);
    failures.forEach(f => console.log(`   - ${f}`));
  }

  if (passed === testCases.length) {
    console.log(`\n🎉 ALL TESTS PASSED! Pricing calculations match documentation 100%.\n`);
  } else {
    console.log(`\n⚠️  Some tests failed. Review calculations and database seed data.\n`);
  }
}

// Run tests
runTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
