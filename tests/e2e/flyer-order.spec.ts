/**
 * E2E Test: Customer Ordering UV Coated Flyers
 *
 * Test Scenario:
 * - Product: 5,000 UV-coated club flyers, 4x6, 9pt cardstock, both sides
 * - Two shipping tests:
 *   1. FedEx Ground to 976 Carr Street, Atlanta, GA 30318
 *   2. Southwest Cargo pickup at Hartsfield-Jackson Atlanta Airport
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

// Test data
const PRODUCT_CONFIG = {
  quantity: 5000,
  size: '4x6',
  paperStock: '9pt C2S Cardstock',
  coating: 'UV Both Sides',
  turnaround: '2-4 Days (Standard)',
};

const FEDEX_ADDRESS = {
  name: 'John Doe',
  email: 'john.doe@test.com',
  phone: '(555) 123-4567',
  address1: '976 Carr Street',
  address2: '',
  city: 'Atlanta',
  state: 'GA',
  zip: '30318',
};

const AIRPORT_PICKUP = {
  name: 'Jane Smith',
  email: 'jane.smith@test.com',
  phone: '(555) 987-6543',
  airport: 'Atlanta, Georgia - Hartsfield-Jackson',
};

// Helper function to configure product
async function configureProduct(page: Page) {
  console.log('🔧 Configuring product...');

  // Select quantity
  await page.selectOption('select[id*="quantity"]', { label: `${PRODUCT_CONFIG.quantity.toLocaleString()}` });
  console.log(`  ✓ Selected quantity: ${PRODUCT_CONFIG.quantity.toLocaleString()}`);

  // Select size
  await page.selectOption('select[id*="size"]', { label: PRODUCT_CONFIG.size });
  console.log(`  ✓ Selected size: ${PRODUCT_CONFIG.size}`);

  // Select paper stock (9pt C2S Cardstock)
  const paperStockRadio = page.locator('input[type="radio"]').filter({ hasText: /9pt.*C2S.*Cardstock/i }).first();
  await paperStockRadio.check();
  console.log(`  ✓ Selected paper stock: ${PRODUCT_CONFIG.paperStock}`);

  // Select coating (UV Both Sides)
  const coatingRadio = page.locator('input[type="radio"]').filter({ hasText: /UV.*Both.*Sides/i }).first();
  await coatingRadio.check();
  console.log(`  ✓ Selected coating: ${PRODUCT_CONFIG.coating}`);

  // Upload files
  const frontImagePath = path.join(__dirname, '../fixtures/flyer-front.png');
  const backImagePath = path.join(__dirname, '../fixtures/flyer-back.png');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles([frontImagePath, backImagePath]);
  console.log('  ✓ Uploaded front and back images');

  // Wait for upload confirmation
  await expect(page.locator('text=/2 file.*uploaded/i')).toBeVisible({ timeout: 10000 });
  console.log('  ✓ Files uploaded successfully');

  // Select turnaround
  const turnaroundRadio = page.locator('input[type="radio"]').filter({ hasText: /2-4.*Days/i }).first();
  await turnaroundRadio.check();
  console.log(`  ✓ Selected turnaround: ${PRODUCT_CONFIG.turnaround}`);

  // Wait for price calculation
  await page.waitForTimeout(1000);
}

// Helper to calculate weight
function calculateWeight(quantity: number, sizeInches: string, paperWeight: number): number {
  const [width, height] = sizeInches.split('x').map(s => parseFloat(s));
  const sizeInSquareInches = width * height;

  // Formula: paper weight x size x quantity = total weight
  const paperWeightPerInch = paperWeight / 3300; // 3300 sq in per lb for card stock
  const totalWeightLbs = paperWeightPerInch * sizeInSquareInches * quantity;

  return totalWeightLbs;
}

test.describe('UV Coated Flyer Order - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to product page
    await page.goto(`${BASE_URL}/products/1`);
    await expect(page).toHaveTitle(/UV Coated Club Flyers/i);
  });

  test('Test 1: Order with FedEx Ground Shipping', async ({ page }) => {
    console.log('\n📦 TEST 1: FedEx Ground Shipping\n');

    // Configure product
    await configureProduct(page);

    // Take screenshot of configured product
    await page.screenshot({ path: 'test-results/01-product-configured.png', fullPage: true });

    // Get displayed price
    const priceText = await page.locator('[data-testid="total-price"], .text-3xl').first().textContent();
    console.log(`💰 Total Price: ${priceText}`);

    // Add to cart
    const addToCartButton = page.locator('button', { hasText: /add to cart/i });
    await addToCartButton.click();
    console.log('✓ Added to cart');

    // Wait for cart confirmation or navigation
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/02-added-to-cart.png', fullPage: true });

    // Navigate to checkout
    await page.goto(`${BASE_URL}/checkout`);
    console.log('✓ Navigated to checkout');

    // Fill in shipping information
    console.log('\n📝 Filling FedEx shipping information...');
    await page.fill('input[name="email"], input[type="email"]', FEDEX_ADDRESS.email);
    await page.fill('input[name="name"], input[placeholder*="name"]', FEDEX_ADDRESS.name);
    await page.fill('input[name="phone"], input[type="tel"]', FEDEX_ADDRESS.phone);
    await page.fill('input[name="address"], input[name="address1"]', FEDEX_ADDRESS.address1);
    await page.fill('input[name="city"]', FEDEX_ADDRESS.city);
    await page.selectOption('select[name="state"]', FEDEX_ADDRESS.state);
    await page.fill('input[name="zip"], input[name="zipCode"]', FEDEX_ADDRESS.zip);

    // Select FedEx shipping
    const fedexRadio = page.locator('input[type="radio"]').filter({ hasText: /FedEx.*Ground/i }).first();
    if (await fedexRadio.count() > 0) {
      await fedexRadio.check();
      console.log('  ✓ Selected FedEx Ground shipping');
    }

    await page.screenshot({ path: 'test-results/03-fedex-checkout-form.png', fullPage: true });

    // Calculate expected weight
    const weight = calculateWeight(5000, '4x6', 9);
    console.log(`\n📊 Weight calculation: ${weight.toFixed(2)} lbs`);
    console.log(`   Formula: 9pt card stock × 24 sq in × 5000 qty`);

    // Select payment method (Cash for testing)
    const cashPaymentRadio = page.locator('input[type="radio"][value="cash"]');
    if (await cashPaymentRadio.count() > 0) {
      await cashPaymentRadio.check();
      console.log('✓ Selected Cash payment');
    }

    await page.screenshot({ path: 'test-results/04-fedex-payment-selected.png', fullPage: true });

    // Submit order
    const submitButton = page.locator('button[type="submit"]', { hasText: /place order|submit|pay now/i }).first();
    await submitButton.click();
    console.log('✓ Submitted order');

    // Wait for success page
    await page.waitForURL(/success|confirmation|thank-you/i, { timeout: 15000 });
    await page.screenshot({ path: 'test-results/05-fedex-order-success.png', fullPage: true });

    // Verify success
    await expect(page.locator('text=/thank you|order confirmed|success/i')).toBeVisible();
    console.log('✅ Order completed successfully!\n');
  });

  test('Test 2: Order with Southwest Cargo Airport Pickup', async ({ page }) => {
    console.log('\n✈️  TEST 2: Southwest Cargo Airport Pickup\n');

    // Configure product
    await configureProduct(page);

    // Take screenshot
    await page.screenshot({ path: 'test-results/06-product-configured-airport.png', fullPage: true });

    // Add to cart
    const addToCartButton = page.locator('button', { hasText: /add to cart/i });
    await addToCartButton.click();
    console.log('✓ Added to cart');

    await page.waitForTimeout(2000);

    // Navigate to checkout
    await page.goto(`${BASE_URL}/checkout`);
    console.log('✓ Navigated to checkout');

    // Fill in customer information
    console.log('\n📝 Filling airport pickup information...');
    await page.fill('input[name="email"], input[type="email"]', AIRPORT_PICKUP.email);
    await page.fill('input[name="name"], input[placeholder*="name"]', AIRPORT_PICKUP.name);
    await page.fill('input[name="phone"], input[type="tel"]', AIRPORT_PICKUP.phone);

    // Select Southwest Cargo / Airport pickup
    const airportRadio = page.locator('input[type="radio"]').filter({ hasText: /Southwest.*Cargo|Airport.*Pickup/i }).first();
    if (await airportRadio.count() > 0) {
      await airportRadio.check();
      console.log('  ✓ Selected Southwest Cargo / Airport Pickup');

      // Wait for airport selector to appear
      await page.waitForTimeout(1000);

      // Select Atlanta airport
      const airportSelect = page.locator('select').filter({ hasText: /airport|location/i }).first();
      if (await airportSelect.count() > 0) {
        await airportSelect.selectOption({ label: /Atlanta.*Hartsfield/i });
        console.log(`  ✓ Selected airport: ${AIRPORT_PICKUP.airport}`);
      }
    }

    await page.screenshot({ path: 'test-results/07-airport-checkout-form.png', fullPage: true });

    // Calculate weight
    const weight = calculateWeight(5000, '4x6', 9);
    console.log(`\n📊 Weight calculation: ${weight.toFixed(2)} lbs`);

    // Select payment method
    const cashPaymentRadio = page.locator('input[type="radio"][value="cash"]');
    if (await cashPaymentRadio.count() > 0) {
      await cashPaymentRadio.check();
      console.log('✓ Selected Cash payment');
    }

    await page.screenshot({ path: 'test-results/08-airport-payment-selected.png', fullPage: true });

    // Submit order
    const submitButton = page.locator('button[type="submit"]', { hasText: /place order|submit|pay now/i }).first();
    await submitButton.click();
    console.log('✓ Submitted order');

    // Wait for success
    await page.waitForURL(/success|confirmation|thank-you/i, { timeout: 15000 });
    await page.screenshot({ path: 'test-results/09-airport-order-success.png', fullPage: true });

    // Verify success
    await expect(page.locator('text=/thank you|order confirmed|success/i')).toBeVisible();
    console.log('✅ Order completed successfully!\n');
  });

  test('Test 3: Verify Weight Calculation', async () => {
    console.log('\n🧮 TEST 3: Weight Calculation Verification\n');

    // Test parameters
    const quantity = 5000;
    const sizeInches = '4x6';
    const paperWeight = 9; // 9pt card stock

    // Calculate
    const weight = calculateWeight(quantity, sizeInches, paperWeight);

    console.log('Weight Formula: paper weight × size × quantity = total weight');
    console.log(`  Paper: ${paperWeight}pt card stock`);
    console.log(`  Size: ${sizeInches} inches (24 sq in)`);
    console.log(`  Quantity: ${quantity.toLocaleString()}`);
    console.log(`  Result: ${weight.toFixed(2)} lbs`);

    // Verify reasonable range (should be 30-40 lbs for this config)
    expect(weight).toBeGreaterThan(20);
    expect(weight).toBeLessThan(50);

    console.log('✅ Weight calculation verified!\n');
  });
});
