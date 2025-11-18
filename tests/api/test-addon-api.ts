/**
 * Test script for add-ons API
 */

async function testAddOnsAPI() {
  try {
    console.log('Testing /api/products/1/pricing-options...');

    const response = await fetch('http://localhost:3000/api/products/1/pricing-options');

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();

    console.log('\n✅ API Response received');
    console.log('\nProduct:', data.data?.product?.name || data.product?.name);

    const addOns = data.data?.addOns || data.addOns;

    if (addOns) {
      console.log('\n📦 Add-Ons Structure:');
      console.log('  - Above Upload:', addOns.above_upload?.length || 0, 'items');
      console.log('  - Below Upload:', addOns.below_upload?.length || 0, 'items');

      if (addOns.above_upload?.length > 0) {
        console.log('\n📝 Above Upload Add-Ons:');
        addOns.above_upload.slice(0, 3).forEach((addon: any) => {
          console.log(`  - ${addon.name} (${addon.slug})`);
        });
      }

      if (addOns.below_upload?.length > 0) {
        console.log('\n📝 Below Upload Add-Ons:');
        addOns.below_upload.slice(0, 3).forEach((addon: any) => {
          console.log(`  - ${addon.name} (${addon.slug})`);
        });
      }
    } else {
      console.log('\n❌ No add-ons found in response');
    }

    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAddOnsAPI();
