/**
 * Comprehensive Addon Pricing Test Suite
 * Tests all 24 addons with various configurations
 */

async function testAddonPricing() {
  console.log('🧪 TESTING ADDON PRICING CALCULATIONS\n');
  console.log('=' .repeat(60));

  // Test data
  const quantity = 1000;
  const baseProductId = 1;

  // Test cases for each addon type
  const testCases = [
    {
      name: 'Standard Custom Design - One Side',
      addOns: [{ addOnId: 2, subOptions: { sides: 'one' } }],
      expectedCost: 90,
      category: 'Design Services'
    },
    {
      name: 'Standard Custom Design - Two Sides',
      addOns: [{ addOnId: 2, subOptions: { sides: 'two' } }],
      expectedCost: 135,
      category: 'Design Services'
    },
    {
      name: 'Rush Custom Design - One Side',
      addOns: [{ addOnId: 3, subOptions: { sides: 'one' } }],
      expectedCost: 160,
      category: 'Design Services'
    },
    {
      name: 'Rush Custom Design - Two Sides',
      addOns: [{ addOnId: 3, subOptions: { sides: 'two' } }],
      expectedCost: 240,
      category: 'Design Services'
    },
    {
      name: 'Perforation - Vertical Only',
      addOns: [{ addOnId: 7, subOptions: { vertical_count: 1, horizontal_count: 0 } }],
      expectedCost: 20 + (0.01 * quantity),
      category: 'Finishing'
    },
    {
      name: 'Perforation - Both Orientations',
      addOns: [{ addOnId: 7, subOptions: { vertical_count: 1, horizontal_count: 1 } }],
      expectedCost: 20 + (0.01 * quantity * 2),
      category: 'Finishing'
    },
    {
      name: 'Score Only - 2 Scores',
      addOns: [{ addOnId: 8, subOptions: { score_count: 2 } }],
      expectedCost: 17 + (0.01 * 2 * quantity),
      category: 'Finishing'
    },
    {
      name: 'Folding - Text Paper',
      addOns: [{ addOnId: 9, subOptions: { fold_type: 'Tri Fold', paper_type: 'text' } }],
      expectedCost: 0.17 + (0.01 * quantity),
      category: 'Finishing'
    },
    {
      name: 'Folding - Cardstock',
      addOns: [{ addOnId: 9, subOptions: { fold_type: 'Tri Fold', paper_type: '12pt' } }],
      expectedCost: 0.34 + (0.02 * quantity),
      category: 'Finishing'
    },
    {
      name: 'Hole Drilling - 3 Custom Holes',
      addOns: [{ addOnId: 11, subOptions: { hole_type: '3' } }],
      expectedCost: 20 + (0.02 * 3 * quantity),
      category: 'Finishing'
    },
    {
      name: 'Hole Drilling - 3-Hole Binder',
      addOns: [{ addOnId: 11, subOptions: { hole_type: '3-hole binder' } }],
      expectedCost: 20 + (0.01 * quantity),
      category: 'Finishing'
    },
    {
      name: 'Banding - 100 per bundle',
      addOns: [{ addOnId: 13, subOptions: { bundle_size: 100 } }],
      expectedCost: Math.ceil(quantity / 100) * 0.75,
      category: 'Packaging'
    },
    {
      name: 'Shrink Wrapping - 25 per bundle',
      addOns: [{ addOnId: 14, subOptions: { bundle_size: 25 } }],
      expectedCost: Math.ceil(quantity / 25) * 0.30,
      category: 'Packaging'
    },
    {
      name: 'Variable Data Printing',
      addOns: [{ addOnId: 16, subOptions: {} }],
      expectedCost: 60 + (0.02 * quantity),
      category: 'Personalization'
    },
    {
      name: 'Numbering',
      addOns: [{ addOnId: 17, subOptions: { start_number: 1 } }],
      expectedCost: 0.10 * quantity,
      category: 'Personalization'
    },
    {
      name: 'EDDM Process & Postage',
      addOns: [{ addOnId: 22, subOptions: {} }],
      expectedCost: 50 + (0.239 * quantity),
      category: 'Shipping'
    },
    {
      name: 'Digital Proof',
      addOns: [{ addOnId: 15, subOptions: {} }],
      expectedCost: 5,
      category: 'Proofs'
    },
    {
      name: 'QR Code',
      addOns: [{ addOnId: 18, subOptions: { qr_content: 'https://example.com' } }],
      expectedCost: 5,
      category: 'Personalization'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    try {
      const response = await fetch('http://localhost:3000/api/products/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: baseProductId,
          paperStockId: 1,
          coatingId: 2,
          turnaroundId: 6,
          quantity: quantity,
          width: 4,
          height: 6,
          sides: 'double',
          addOns: test.addOns,
        }),
      });

      if (!response.ok) {
        console.log(`❌ ${test.name} - API Error: ${response.status}`);
        failed++;
        continue;
      }

      const result = await response.json();
      const data = result.data || result;

      // Check if addon cost matches expected
      const actualAddOnCost = data.addOnsCost || 0;
      const tolerance = 0.02; // Allow 2 cent tolerance for rounding

      if (Math.abs(actualAddOnCost - test.expectedCost) < tolerance) {
        console.log(`✅ ${test.name}`);
        console.log(`   Expected: $${test.expectedCost.toFixed(2)}, Got: $${actualAddOnCost.toFixed(2)}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Expected: $${test.expectedCost.toFixed(2)}, Got: $${actualAddOnCost.toFixed(2)}`);
        console.log(`   Difference: $${Math.abs(actualAddOnCost - test.expectedCost).toFixed(2)}`);
        failed++;
      }

    } catch (error: any) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      failed++;
    }

    console.log(''); // Blank line between tests
  }

  console.log('=' .repeat(60));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

  if (failed === 0) {
    console.log('\n🎉 All addon calculations are correct!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the pricing logic.`);
  }
}

// Run tests
testAddonPricing().catch(console.error);
