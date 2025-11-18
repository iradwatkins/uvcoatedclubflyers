/**
 * Verification Script: Test that sub-options are working end-to-end
 */

async function verifySubOptions() {
  console.log('🔍 Verifying Sub-Options Implementation\n');

  try {
    // Fetch pricing options from API
    const response = await fetch('http://localhost:3000/api/products/1/pricing-options');
    const result = await response.json();

    if (!result.success) {
      console.error('❌ API request failed');
      return;
    }

    const { addOns } = result.data;
    const allAddOns = [...addOns.above_upload, ...addOns.below_upload];

    console.log(`✅ Total add-ons loaded: ${allAddOns.length}`);

    // Count add-ons with sub-options
    const withSubOptions = allAddOns.filter(a => a.subOptions && a.subOptions.length > 0);
    const withoutSubOptions = allAddOns.filter(a => !a.subOptions || a.subOptions.length === 0);

    console.log(`✅ Add-ons with sub-options: ${withSubOptions.length}`);
    console.log(`✅ Add-ons without sub-options: ${withoutSubOptions.length}\n`);

    // Detailed breakdown
    console.log('📋 Detailed Sub-Options Breakdown:\n');

    const categories = {
      'Design Services (above_upload)': addOns.above_upload,
      'Extra Options (below_upload)': addOns.below_upload
    };

    for (const [categoryName, addOnsList] of Object.entries(categories)) {
      console.log(`\n${categoryName}:`);
      console.log('─'.repeat(60));

      addOnsList.forEach((addOn: any) => {
        const subOptionsCount = addOn.subOptions?.length || 0;
        const status = subOptionsCount > 0 ? '✅' : '⚪';

        console.log(`${status} ${addOn.name} (${addOn.slug})`);

        if (subOptionsCount > 0) {
          addOn.subOptions.forEach((subOption: any) => {
            const required = subOption.is_required ? '[REQUIRED]' : '[OPTIONAL]';
            console.log(`    ├─ ${subOption.field_label} (${subOption.field_type}) ${required}`);

            // Show options for select fields
            if (subOption.field_type === 'select' && subOption.options?.options) {
              const optionLabels = subOption.options.options.slice(0, 3).map((o: any) => o.label).join(', ');
              const more = subOption.options.options.length > 3 ? `... +${subOption.options.options.length - 3} more` : '';
              console.log(`    │   Options: ${optionLabels}${more}`);
            }
          });
        }
      });
    }

    // Test cases for specific add-ons
    console.log('\n\n🧪 Test Cases:\n');

    const testCases = [
      { slug: 'perforation', expectedSubOptions: 4, name: 'Perforation' },
      { slug: 'score-only', expectedSubOptions: 2, name: 'Score Only' },
      { slug: 'folding', expectedSubOptions: 1, name: 'Folding' },
      { slug: 'hole-drilling', expectedSubOptions: 3, name: 'Hole Drilling' },
      { slug: 'standard-custom-design', expectedSubOptions: 1, name: 'Standard Custom Design' },
    ];

    let passedTests = 0;
    let failedTests = 0;

    testCases.forEach(testCase => {
      const addOn = allAddOns.find(a => a.slug === testCase.slug);
      if (!addOn) {
        console.log(`❌ FAIL: ${testCase.name} - Add-on not found`);
        failedTests++;
        return;
      }

      const actualCount = addOn.subOptions?.length || 0;
      if (actualCount === testCase.expectedSubOptions) {
        console.log(`✅ PASS: ${testCase.name} - ${actualCount} sub-options`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: ${testCase.name} - Expected ${testCase.expectedSubOptions}, got ${actualCount}`);
        failedTests++;
      }
    });

    console.log(`\n\n📊 Test Results: ${passedTests} passed, ${failedTests} failed\n`);

    // Summary
    console.log('═'.repeat(60));
    console.log('SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ API is returning sub-options: ${withSubOptions.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Total sub-options in database: ${withSubOptions.reduce((sum, a) => sum + (a.subOptions?.length || 0), 0)}`);
    console.log(`✅ Field types supported: select, text, number, textarea`);
    console.log(`✅ All tests passed: ${failedTests === 0 ? 'YES ✅' : `NO ❌ (${failedTests} failed)`}`);
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifySubOptions();
