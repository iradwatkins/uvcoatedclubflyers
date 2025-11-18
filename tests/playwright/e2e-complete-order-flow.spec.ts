import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive E2E Test: UV Coated Club Flyers - Complete Order Flow
 *
 * Tests two complete ordering scenarios:
 * 1. 5000 qty 4x6 UV both sides flyers → FedEx Ground to Atlanta (976 Carr Street)
 * 2. 5000 qty 4x6 UV both sides flyers → Southwest Cargo Airport Pickup at ATL
 *
 * Product Specifications:
 * - Quantity: 5000
 * - Size: 4x6
 * - Material: 9pt C2S Cardstock
 * - Coating: UV Both Sides
 * - Sides: Double-Sided (different images front/back)
 * - Weight: 40 lbs (0.000333333333 × 4 × 6 × 5000)
 * - Boxes: 2 (40 lbs ÷ 36 lb max = 2 boxes)
 */

test.describe('Complete Order Flow - UV Coated Flyers', () => {
  const TEST_IMAGES_DIR = '/Users/irawatkins/Desktop/images for testing';
  let frontImage: string;
  let backImage: string;

  test.beforeAll(async () => {
    // Get test images
    const files = fs.readdirSync(TEST_IMAGES_DIR);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));

    if (imageFiles.length < 2) {
      throw new Error(`Need at least 2 images in ${TEST_IMAGES_DIR}, found ${imageFiles.length}`);
    }

    frontImage = path.join(TEST_IMAGES_DIR, imageFiles[0]);
    backImage = path.join(TEST_IMAGES_DIR, imageFiles[1]);

    console.log('\n📦 Test Configuration:');
    console.log(`  Product: 5000 qty 4x6 UV Coated Flyers (9pt cardstock, double-sided)`);
    console.log(`  Expected Weight: 40 lbs (2 boxes)`);
    console.log(`  Front Image: ${path.basename(frontImage)}`);
    console.log(`  Back Image: ${path.basename(backImage)}\n`);
  });

  test('Scenario 1: FedEx Ground to 976 Carr Street, Atlanta, GA 30318', async ({ page }) => {
    test.setTimeout(240000); // 4 minutes

    console.log('\n🚀 Starting Scenario 1: FedEx Ground Shipping\n');

    // Step 1: Navigate to homepage
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/fedex-01-homepage.png', fullPage: true });
      console.log('✓ Loaded homepage');
    });

    // Step 2: Navigate to Products
    await test.step('Navigate to products page', async () => {
      // Navigate directly to products page to avoid Next.js dev overlay issues
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/fedex-02-products-page.png', fullPage: true });
      console.log('✓ Navigated to products page');
    });

    // Step 3: Select Flyer Pricing product
    await test.step('Select Flyer Pricing product', async () => {
      // Find and click first product card
      const productCard = page.locator('[data-testid="product-card"]').first();
      await productCard.waitFor({ state: 'visible' });
      await productCard.click();
      await page.waitForURL(/\/products\/.+/);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/fedex-03-product-detail.png', fullPage: true });
      console.log('✓ Opened product detail page');
    });

    // Step 4: Configure product - 5000 qty, 4x6, 9pt, UV Both Sides, Double-Sided
    await test.step('Configure product options', async () => {
      // Wait for configurator to load
      await page.waitForSelector('select, input[type="number"]', { timeout: 5000 });

      // Set quantity to 5000
      const quantityInput = page.locator('input[type="number"]').first();
      await quantityInput.fill('5000');
      await page.waitForTimeout(500);

      // Select Size: 4x6
      const sizeSelect = page.locator('select').filter({ has: page.locator('option:has-text("4x6"), option:has-text("4 x 6")')}).first();
      if (await sizeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sizeSelect.selectOption({ label: /4.*x.*6|4x6/i });
        await page.waitForTimeout(500);
      }

      // Select Material: 9pt
      const materialSelect = page.locator('select').filter({ has: page.locator('option:has-text("9pt")')}).first();
      if (await materialSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await materialSelect.selectOption({ label: /9.*pt/i });
        await page.waitForTimeout(500);
      }

      // Select Coating: UV Both Sides
      const coatingSelect = page.locator('select').filter({ has: page.locator('option:has-text("UV")')}).first();
      if (await coatingSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await coatingSelect.selectOption({ label: /uv.*both/i });
        await page.waitForTimeout(500);
      }

      // Select Sides: Double-Sided
      const sidesSelect = page.locator('select').filter({ has: page.locator('option:has-text("Double"), option:has-text("Both")')}).first();
      if (await sidesSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sidesSelect.selectOption({ label: /double|both|two/i });
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: 'test-results/fedex-04-configured.png', fullPage: true });
      console.log('✓ Configured product options');
    });

    // Step 5: Upload images
    await test.step('Upload front and back images', async () => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([frontImage, backImage]);
      await page.waitForTimeout(2000); // Wait for upload
      await page.screenshot({ path: 'test-results/fedex-05-images-uploaded.png', fullPage: true });
      console.log('✓ Uploaded front and back images');
    });

    // Step 6: Add to cart
    await test.step('Add product to cart', async () => {
      const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
      await addToCartBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'test-results/fedex-06-added-to-cart.png', fullPage: true });
      console.log('✓ Added to cart');
    });

    // Step 7: Navigate to cart
    await test.step('View shopping cart', async () => {
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/fedex-07-cart-page.png', fullPage: true });
      console.log('✓ Viewing cart');
    });

    // Step 8: Proceed to checkout
    await test.step('Proceed to checkout', async () => {
      const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i }).first();
      await checkoutBtn.click();
      await page.waitForURL(/\/checkout/);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/fedex-08-checkout-start.png', fullPage: true });
      console.log('✓ Started checkout');
    });

    // Step 9: Fill shipping address - FedEx Ground Address
    await test.step('Fill shipping address', async () => {
      await page.fill('input[name="fullName"], input[placeholder*="name" i]', 'John Doe');
      await page.fill('input[name="street"], input[placeholder*="street" i], input[placeholder*="address" i]', '976 Carr Street');
      await page.fill('input[name="city"], input[placeholder*="city" i]', 'Atlanta');

      const stateSelect = page.locator('select[name="state"], select:has(option:has-text("GA")), select:has(option:has-text("Georgia"))').first();
      await stateSelect.selectOption({ label: /GA|Georgia/i });

      await page.fill('input[name="zipCode"], input[name="zip"], input[placeholder*="zip" i]', '30318');

      await page.screenshot({ path: 'test-results/fedex-09-shipping-address.png', fullPage: true });
      console.log('✓ Filled shipping address: 976 Carr Street, Atlanta, GA 30318');

      // Continue to next step
      const continueBtn = page.getByRole('button', { name: /continue|next/i }).first();
      await continueBtn.click();
      await page.waitForTimeout(1000);
    });

    // Step 10: Skip airport selection (FedEx doesn't need airport)
    await test.step('Skip airport selection', async () => {
      const skipBtn = page.getByRole('button', { name: /skip/i });
      if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(1000);
        console.log('✓ Skipped airport selection');
      }
      await page.screenshot({ path: 'test-results/fedex-10-airport-skipped.png', fullPage: true });
    });

    // Step 11: Select FedEx Ground shipping
    let shippingCost = 0;
    await test.step('Select FedEx Ground shipping', async () => {
      // Wait for shipping rates to load
      await page.waitForSelector('[data-testid="shipping-method"], [class*="shipping"]', { timeout: 20000 });
      await page.screenshot({ path: 'test-results/fedex-11-shipping-options.png', fullPage: true });

      // Find FedEx Ground option
      const fedexOption = page.locator('[data-testid="shipping-method"], div, label').filter({ hasText: /fedex.*ground/i }).first();
      await fedexOption.click();

      // Extract cost
      const costText = await page.locator('text=/\\$\\d+\\.\\d+/').first().textContent();
      shippingCost = parseFloat(costText?.replace('$', '') || '0');
      console.log(`✓ Selected FedEx Ground - Cost: $${shippingCost}`);

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/fedex-12-shipping-selected.png', fullPage: true });

      // Continue to payment
      const continueBtn = page.getByRole('button', { name: /continue|next|payment/i }).first();
      await continueBtn.click();
      await page.waitForTimeout(1500);
    });

    // Step 12: Payment page reached
    await test.step('Verify payment page', async () => {
      await page.screenshot({ path: 'test-results/fedex-13-payment-page.png', fullPage: true });

      // Verify order summary
      const orderSummary = await page.locator('text=/total|summary/i').first().isVisible().catch(() => false);
      expect(orderSummary).toBeTruthy();

      console.log('✓ Reached payment page');
      console.log('✅ Scenario 1 Complete: FedEx Ground checkout flow validated\n');
    });
  });

  test('Scenario 2: Southwest Cargo Airport Pickup at ATL (Hartsfield-Jackson)', async ({ page }) => {
    test.setTimeout(240000); // 4 minutes

    console.log('\n🚀 Starting Scenario 2: Southwest Cargo Airport Pickup\n');

    // Step 1: Navigate to homepage
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/southwest-01-homepage.png', fullPage: true });
      console.log('✓ Loaded homepage');
    });

    // Step 2: Navigate to Products
    await test.step('Navigate to products page', async () => {
      // Navigate directly to products page to avoid Next.js dev overlay issues
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/southwest-02-products-page.png', fullPage: true });
      console.log('✓ Navigated to products page');
    });

    // Step 3: Select Flyer Pricing product
    await test.step('Select Flyer Pricing product', async () => {
      const productCard = page.locator('[data-testid="product-card"]').first();
      await productCard.waitFor({ state: 'visible' });
      await productCard.click();
      await page.waitForURL(/\/products\/.+/);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/southwest-03-product-detail.png', fullPage: true });
      console.log('✓ Opened product detail page');
    });

    // Step 4: Configure product - 5000 qty, 4x6, 9pt, UV Both Sides, Double-Sided
    await test.step('Configure product options', async () => {
      await page.waitForSelector('select, input[type="number"]', { timeout: 5000 });

      // Set quantity
      const quantityInput = page.locator('input[type="number"]').first();
      await quantityInput.fill('5000');
      await page.waitForTimeout(500);

      // Select Size: 4x6
      const sizeSelect = page.locator('select').filter({ has: page.locator('option:has-text("4x6"), option:has-text("4 x 6")')}).first();
      if (await sizeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sizeSelect.selectOption({ label: /4.*x.*6|4x6/i });
        await page.waitForTimeout(500);
      }

      // Select Material: 9pt
      const materialSelect = page.locator('select').filter({ has: page.locator('option:has-text("9pt")')}).first();
      if (await materialSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await materialSelect.selectOption({ label: /9.*pt/i });
        await page.waitForTimeout(500);
      }

      // Select Coating: UV Both Sides
      const coatingSelect = page.locator('select').filter({ has: page.locator('option:has-text("UV")')}).first();
      if (await coatingSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await coatingSelect.selectOption({ label: /uv.*both/i });
        await page.waitForTimeout(500);
      }

      // Select Sides: Double-Sided
      const sidesSelect = page.locator('select').filter({ has: page.locator('option:has-text("Double"), option:has-text("Both")')}).first();
      if (await sidesSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sidesSelect.selectOption({ label: /double|both|two/i });
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: 'test-results/southwest-04-configured.png', fullPage: true });
      console.log('✓ Configured product options');
    });

    // Step 5: Upload images
    await test.step('Upload front and back images', async () => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([frontImage, backImage]);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/southwest-05-images-uploaded.png', fullPage: true });
      console.log('✓ Uploaded front and back images');
    });

    // Step 6: Add to cart
    await test.step('Add product to cart', async () => {
      const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
      await addToCartBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'test-results/southwest-06-added-to-cart.png', fullPage: true });
      console.log('✓ Added to cart');
    });

    // Step 7: Navigate to cart
    await test.step('View shopping cart', async () => {
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/southwest-07-cart-page.png', fullPage: true });
      console.log('✓ Viewing cart');
    });

    // Step 8: Proceed to checkout
    await test.step('Proceed to checkout', async () => {
      const checkoutBtn = page.getByRole('button', { name: /checkout|proceed/i }).first();
      await checkoutBtn.click();
      await page.waitForURL(/\/checkout/);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/southwest-08-checkout-start.png', fullPage: true });
      console.log('✓ Started checkout');
    });

    // Step 9: Fill shipping address - Atlanta Airport Area
    await test.step('Fill shipping address', async () => {
      await page.fill('input[name="fullName"], input[placeholder*="name" i]', 'Jane Smith');
      await page.fill('input[name="street"], input[placeholder*="street" i], input[placeholder*="address" i]', '6000 North Terminal Parkway');
      await page.fill('input[name="city"], input[placeholder*="city" i]', 'Atlanta');

      const stateSelect = page.locator('select[name="state"], select:has(option:has-text("GA")), select:has(option:has-text("Georgia"))').first();
      await stateSelect.selectOption({ label: /GA|Georgia/i });

      await page.fill('input[name="zipCode"], input[name="zip"], input[placeholder*="zip" i]', '30320');

      await page.screenshot({ path: 'test-results/southwest-09-shipping-address.png', fullPage: true });
      console.log('✓ Filled shipping address: 6000 N Terminal Parkway, Atlanta, GA 30320');

      // Continue to airport selection
      const continueBtn = page.getByRole('button', { name: /continue|next/i }).first();
      await continueBtn.click();
      await page.waitForTimeout(1500);
    });

    // Step 10: Select ATL Airport
    await test.step('Select Hartsfield-Jackson Atlanta Airport', async () => {
      // Wait for airport selector
      await page.waitForSelector('select, [role="listbox"], [role="combobox"]', { timeout: 10000 });
      await page.screenshot({ path: 'test-results/southwest-10-airport-selector.png', fullPage: true });

      // Find and select ATL airport
      const atlOption = page.locator('option, [role="option"]').filter({ hasText: /ATL|Hartsfield|Atlanta.*International/i }).first();
      await atlOption.click();

      console.log('✓ Selected ATL - Hartsfield-Jackson Atlanta International Airport');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/southwest-11-airport-selected.png', fullPage: true });

      // Continue to shipping methods
      const continueBtn = page.getByRole('button', { name: /continue|next/i }).first();
      await continueBtn.click();
      await page.waitForTimeout(1500);
    });

    // Step 11: Select Southwest Cargo shipping
    let shippingCost = 0;
    await test.step('Select Southwest Cargo pickup', async () => {
      // Wait for shipping rates
      await page.waitForSelector('[data-testid="shipping-method"], [class*="shipping"]', { timeout: 20000 });
      await page.screenshot({ path: 'test-results/southwest-12-shipping-options.png', fullPage: true });

      // Find Southwest Cargo option
      const southwestOption = page.locator('[data-testid="shipping-method"], div, label').filter({ hasText: /southwest.*cargo/i }).first();
      await southwestOption.click();

      // Extract cost
      const costText = await page.locator('text=/\\$\\d+\\.\\d+/').first().textContent();
      shippingCost = parseFloat(costText?.replace('$', '') || '0');
      console.log(`✓ Selected Southwest Cargo Pickup - Cost: $${shippingCost}`);

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/southwest-13-shipping-selected.png', fullPage: true });

      // Continue to payment
      const continueBtn = page.getByRole('button', { name: /continue|next|payment/i }).first();
      await continueBtn.click();
      await page.waitForTimeout(1500);
    });

    // Step 12: Payment page reached
    await test.step('Verify payment page', async () => {
      await page.screenshot({ path: 'test-results/southwest-14-payment-page.png', fullPage: true });

      // Verify order summary
      const orderSummary = await page.locator('text=/total|summary/i').first().isVisible().catch(() => false);
      expect(orderSummary).toBeTruthy();

      console.log('✓ Reached payment page');
      console.log('✅ Scenario 2 Complete: Southwest Cargo airport pickup flow validated\n');
    });
  });
});
