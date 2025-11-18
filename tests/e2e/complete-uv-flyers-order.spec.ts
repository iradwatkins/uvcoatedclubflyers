/**
 * COMPREHENSIVE E2E TEST SUITE
 * UV Coated Club Flyers - Complete Order Workflow
 *
 * Test Scenarios:
 * 1. FedEx Ground Shipping to 976 Carr Street, Atlanta, GA 30318
 * 2. Southwest Cargo Airport Pickup at Hartsfield-Jackson Atlanta International
 *
 * Product Configuration:
 * - 5,000 flyers
 * - 4x6 size
 * - 9pt C2S Cardstock
 * - UV Both Sides
 * - 2 different images (front and back)
 *
 * Weight Verification:
 * - Formula: 0.000333333333 × 24 × 5000 = 40 lbs
 * - Expected: 2 boxes (36 lb max per box)
 *
 * Created with: Playwright, MCP Servers, Sequential Thinking
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import {
  getFedExTestData,
  getSouthwestCargoTestData,
  TEST_IMAGES,
  EXPECTED_WEIGHT,
  SQUARE_TEST_CARD,
  WAIT_TIMES,
  SELECTORS,
  getTestRunMetadata,
} from '../helpers/test-data-generator';
import {
  extractOrderNumber,
  verifyWeight,
  verifyPricing,
  verifyOrderInDatabase,
  captureEvidence,
  setupConsoleCapture,
  formatVerificationReport,
  waitAndVerify,
  verifyFileUpload,
  hasNoErrors,
  type ConsoleLog,
  type OrderVerificationResult,
  type WeightVerification,
  type PriceVerification,
} from '../helpers/order-verification';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_OUTPUT_DIR = 'test-results/complete-order-tests';

// Performance metrics tracking
interface PerformanceMetrics {
  pageLoadTime: number;
  productConfigTime: number;
  fileUploadTime: number;
  checkoutTime: number;
  paymentTime: number;
  totalTestTime: number;
  apiCalls: number;
}

// Test evidence collection
interface TestRun {
  scenario: string;
  runNumber: number;
  startTime: Date;
  endTime?: Date;
  orderNumber?: string;
  orderId?: number;
  performance: PerformanceMetrics;
  screenshots: string[];
  consoleLogs: ConsoleLog[];
  weightVerification?: WeightVerification;
  priceVerification?: PriceVerification;
  dbVerification?: OrderVerificationResult;
  success: boolean;
  errors: string[];
}

/**
 * Configure product with all options
 */
async function configureProduct(page: Page): Promise<void> {
  const startTime = Date.now();

  console.log('🔧 Configuring product options...');

  // Select quantity: 5000
  await page.selectOption(SELECTORS.quantitySelect, '5000');
  await page.waitForTimeout(500);
  console.log('  ✓ Quantity: 5000');

  // Select size: 4x6
  await page.selectOption(SELECTORS.sizeSelect, '4x6');
  await page.waitForTimeout(500);
  console.log('  ✓ Size: 4x6');

  // Select paper stock: 9pt C2S Cardstock
  const paperStockRadio = page.locator('input[type="radio"]').filter({
    hasText: /9pt.*C2S.*Cardstock/i
  }).first();
  await paperStockRadio.check();
  await page.waitForTimeout(500);
  console.log('  ✓ Paper Stock: 9pt C2S Cardstock');

  // Select coating: UV Both Sides
  const coatingRadio = page.locator('input[type="radio"]').filter({
    hasText: /UV.*Both.*Sides/i
  }).first();
  await coatingRadio.check();
  await page.waitForTimeout(500);
  console.log('  ✓ Coating: UV Both Sides');

  // Select turnaround: 2-4 Days Standard
  const turnaroundRadio = page.locator('input[type="radio"]').filter({
    hasText: /2-4.*Days/i
  }).first();
  await turnaroundRadio.check();
  await page.waitForTimeout(WAIT_TIMES.priceCalculation);
  console.log('  ✓ Turnaround: 2-4 Days Standard');

  const configTime = Date.now() - startTime;
  console.log(`  ⏱️  Configuration completed in ${configTime}ms`);
}

/**
 * Upload front and back images
 */
async function uploadImages(page: Page): Promise<boolean> {
  const startTime = Date.now();

  console.log('📤 Uploading images...');

  const frontImagePath = path.join(__dirname, '..', TEST_IMAGES.front.replace('tests/', ''));
  const backImagePath = path.join(__dirname, '..', TEST_IMAGES.back.replace('tests/', ''));

  console.log(`  Front: ${frontImagePath}`);
  console.log(`  Back: ${backImagePath}`);

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles([frontImagePath, backImagePath]);

  // Wait for upload completion
  await page.waitForTimeout(WAIT_TIMES.fileUpload);

  // Verify upload success
  const uploadSuccess = await verifyFileUpload(page, 2);

  const uploadTime = Date.now() - startTime;

  if (uploadSuccess) {
    console.log(`  ✓ 2 files uploaded successfully in ${uploadTime}ms`);
  } else {
    console.log(`  ⚠️  Upload verification uncertain (${uploadTime}ms)`);
  }

  return uploadSuccess;
}

/**
 * Fill shipping address form
 */
async function fillShippingAddress(page: Page, address: any): Promise<void> {
  console.log('📝 Filling shipping address...');

  // Fill name
  const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
  await nameInput.fill(address.name);
  console.log(`  ✓ Name: ${address.name}`);

  // Fill email
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  await emailInput.fill(address.email);
  console.log(`  ✓ Email: ${address.email}`);

  // Fill phone
  const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
  await phoneInput.fill(address.phone);
  console.log(`  ✓ Phone: ${address.phone}`);

  // Fill address
  await page.fill(SELECTORS.addressInput, address.address1);
  console.log(`  ✓ Address: ${address.address1}`);

  // Fill city
  await page.fill(SELECTORS.cityInput, address.city);
  console.log(`  ✓ City: ${address.city}`);

  // Select state
  await page.selectOption(SELECTORS.stateSelect, address.state);
  console.log(`  ✓ State: ${address.state}`);

  // Fill ZIP
  await page.fill(SELECTORS.zipInput, address.zip);
  console.log(`  ✓ ZIP: ${address.zip}`);

  await page.waitForTimeout(1000);
}

/**
 * Complete Square card payment
 */
async function completeSquarePayment(page: Page): Promise<void> {
  console.log('💳 Processing Square payment...');

  // Wait for Square iframe to load
  await page.waitForTimeout(3000);

  // Look for Square card input iframe
  const cardFrame = page.frameLocator('iframe[name*="card"], iframe[title*="card"]').first();

  // Fill card number
  const cardInput = cardFrame.locator('input[name="cardNumber"], input[aria-label*="Card number"]').first();
  await cardInput.fill(SQUARE_TEST_CARD.number);
  console.log('  ✓ Card number entered');

  // Fill CVV
  const cvvInput = cardFrame.locator('input[name="cvv"], input[aria-label*="CVV"]').first();
  await cvvInput.fill(SQUARE_TEST_CARD.cvv);
  console.log('  ✓ CVV entered');

  // Fill expiration
  const expInput = cardFrame.locator('input[name="expiration"], input[aria-label*="Expiration"]').first();
  await expInput.fill(`${SQUARE_TEST_CARD.expMonth}/${SQUARE_TEST_CARD.expYear}`);
  console.log('  ✓ Expiration entered');

  // Fill ZIP
  const zipInput = cardFrame.locator('input[name="postalCode"], input[aria-label*="Postal"]').first();
  await zipInput.fill(SQUARE_TEST_CARD.zip);
  console.log('  ✓ ZIP entered');

  await page.waitForTimeout(1000);
}

/**
 * Test suite for FedEx Ground shipping
 */
test.describe('Complete Order Flow - FedEx Ground', () => {
  let consoleLogs: ConsoleLog[];
  let testRun: TestRun;

  test.beforeEach(async ({ page }) => {
    // Initialize test run tracking
    testRun = {
      scenario: 'FedEx Ground',
      runNumber: 1,
      startTime: new Date(),
      performance: {
        pageLoadTime: 0,
        productConfigTime: 0,
        fileUploadTime: 0,
        checkoutTime: 0,
        paymentTime: 0,
        totalTestTime: 0,
        apiCalls: 0,
      },
      screenshots: [],
      consoleLogs: [],
      success: false,
      errors: [],
    };

    // Setup console capture
    consoleLogs = setupConsoleCapture(page);

    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Scenario 1: FedEx Ground to Atlanta, GA', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📦 SCENARIO 1: FedEx Ground Shipping');
    console.log('═══════════════════════════════════════════════════════\n');

    const testData = getFedExTestData();
    const metadata = getTestRunMetadata('fedex-ground', 1);

    console.log(`Test ID: ${metadata.testId}`);
    console.log(`Customer: ${testData.customer.name} <${testData.customer.email}>`);
    console.log(`Shipping to: ${testData.address.address1}, ${testData.address.city}, ${testData.address.state} ${testData.address.zip}\n`);

    // STEP 1: Navigate to product page
    console.log('📍 Step 1: Navigate to product page');
    const pageLoadStart = Date.now();
    await page.goto(`${BASE_URL}/products/1`);
    await expect(page).toHaveTitle(/UV Coated|Flyer|Product/i, { timeout: 10000 });
    testRun.performance.pageLoadTime = Date.now() - pageLoadStart;
    console.log(`  ✓ Page loaded in ${testRun.performance.pageLoadTime}ms\n`);

    // Capture screenshot
    const evidence1 = await captureEvidence(page, 'product-page', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence1.screenshot);

    // STEP 2: Configure product
    console.log('📍 Step 2: Configure product options');
    const configStart = Date.now();
    await configureProduct(page);
    testRun.performance.productConfigTime = Date.now() - configStart;
    console.log('');

    // STEP 3: Upload images
    console.log('📍 Step 3: Upload images');
    const uploadStart = Date.now();
    const uploadSuccess = await uploadImages(page);
    testRun.performance.fileUploadTime = Date.now() - uploadStart;

    if (!uploadSuccess) {
      testRun.errors.push('File upload verification failed');
    }
    console.log('');

    // Capture configured product screenshot
    const evidence2 = await captureEvidence(page, 'product-configured', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence2.screenshot);

    // STEP 4: Add to cart
    console.log('📍 Step 4: Add to cart');
    const addToCartButton = page.locator(SELECTORS.addToCartButton).first();
    await addToCartButton.click();
    await page.waitForTimeout(WAIT_TIMES.pageLoad);
    console.log('  ✓ Added to cart\n');

    // STEP 5: Navigate to checkout
    console.log('📍 Step 5: Navigate to checkout');
    const checkoutStart = Date.now();
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForTimeout(1000);

    const checkoutButton = page.locator(SELECTORS.checkoutButton).first();
    await checkoutButton.click();
    await page.waitForURL(/checkout/i, { timeout: 10000 });
    console.log('  ✓ Navigated to checkout\n');

    // STEP 6: Fill shipping address
    console.log('📍 Step 6: Fill shipping address');
    await fillShippingAddress(page, testData.address);
    console.log('');

    // Capture address form
    const evidence3 = await captureEvidence(page, 'shipping-address', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence3.screenshot);

    // STEP 7: Continue to shipping method
    console.log('📍 Step 7: Select shipping method');
    const continueButton = page.locator(SELECTORS.continueButton).first();
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await page.waitForTimeout(WAIT_TIMES.shippingCalculation);
    }

    // Select FedEx Ground
    const fedexRadio = page.locator(SELECTORS.shippingMethodRadio).filter({
      hasText: /FedEx.*Ground/i
    }).first();

    if (await fedexRadio.isVisible()) {
      await fedexRadio.check();
      console.log('  ✓ Selected FedEx Ground');
      await page.waitForTimeout(WAIT_TIMES.shippingCalculation);
    }
    console.log('');

    testRun.performance.checkoutTime = Date.now() - checkoutStart;

    // Verify weight display
    console.log('📍 Step 8: Verify weight calculation');
    const weightVerification = await verifyWeight(page);
    testRun.weightVerification = weightVerification;

    console.log(`  Actual Weight: ${weightVerification.actual} lbs`);
    console.log(`  Expected Weight: ${weightVerification.expected} lbs`);
    console.log(`  Within Range: ${weightVerification.withinRange ? '✅ YES' : '❌ NO'}`);
    console.log(`  Boxes Required: ${weightVerification.boxes}`);

    if (!weightVerification.withinRange) {
      testRun.errors.push(`Weight verification failed: ${weightVerification.actual} lbs`);
    }
    console.log('');

    // Verify pricing
    console.log('📍 Step 9: Verify pricing breakdown');
    const priceVerification = await verifyPricing(page);
    testRun.priceVerification = priceVerification;

    console.log(`  Subtotal: $${priceVerification.subtotal.toFixed(2)}`);
    console.log(`  Shipping: $${priceVerification.shipping.toFixed(2)}`);
    console.log(`  Tax: $${priceVerification.tax.toFixed(2)}`);
    console.log(`  Total: $${priceVerification.total.toFixed(2)}`);
    console.log(`  Within Expected Range: ${priceVerification.withinExpectedRange ? '✅ YES' : '❌ NO'}`);

    if (!priceVerification.withinExpectedRange) {
      testRun.errors.push(`Price verification failed: $${priceVerification.total}`);
    }
    console.log('');

    // Capture checkout review
    const evidence4 = await captureEvidence(page, 'checkout-review', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence4.screenshot);

    // STEP 10: Complete payment
    console.log('📍 Step 10: Complete Square payment');
    const paymentStart = Date.now();

    await completeSquarePayment(page);

    // Click place order
    const placeOrderButton = page.locator(SELECTORS.placeOrderButton).first();
    await placeOrderButton.click();
    console.log('  ✓ Order submitted');

    // Wait for success page
    await page.waitForURL(/success|confirmation|thank-you/i, { timeout: 30000 });
    testRun.performance.paymentTime = Date.now() - paymentStart;
    console.log(`  ✓ Payment processed in ${testRun.performance.paymentTime}ms\n`);

    // STEP 11: Extract order number
    console.log('📍 Step 11: Extract order information');
    const orderNumber = await extractOrderNumber(page);

    if (orderNumber) {
      testRun.orderNumber = orderNumber;
      console.log(`  ✓ Order Number: ${orderNumber}`);
    } else {
      testRun.errors.push('Failed to extract order number');
      console.log('  ⚠️  Could not extract order number');
    }
    console.log('');

    // Capture success page
    const evidence5 = await captureEvidence(page, 'order-success', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence5.screenshot);

    // STEP 12: Verify order in database
    if (orderNumber) {
      console.log('📍 Step 12: Verify order in database');
      const dbVerification = await verifyOrderInDatabase(orderNumber, BASE_URL);
      testRun.dbVerification = dbVerification;

      if (dbVerification.success) {
        testRun.orderId = dbVerification.orderId;
        console.log(`  ✓ Order found in database`);
        console.log(`  Order ID: ${dbVerification.orderId}`);
        console.log(`  Status: ${dbVerification.data?.status}`);
        console.log(`  Payment Status: ${dbVerification.data?.payment_status}`);

        if (dbVerification.warnings.length > 0) {
          console.log(`  ⚠️  Warnings: ${dbVerification.warnings.join(', ')}`);
        }
      } else {
        testRun.errors.push('Database verification failed');
        console.log(`  ❌ Database verification failed: ${dbVerification.errors.join(', ')}`);
      }
    }
    console.log('');

    // Check for console errors
    testRun.consoleLogs = consoleLogs;
    const noErrors = hasNoErrors(consoleLogs);
    if (!noErrors) {
      const errorCount = consoleLogs.filter(log => log.type === 'error').length;
      testRun.errors.push(`${errorCount} console errors detected`);
      console.log(`  ⚠️  ${errorCount} console errors detected`);
    }

    // Calculate total test time
    testRun.endTime = new Date();
    testRun.performance.totalTestTime = testRun.endTime.getTime() - testRun.startTime.getTime();

    // Determine success
    testRun.success = testRun.errors.length === 0 &&
                      weightVerification.withinRange &&
                      priceVerification.withinExpectedRange &&
                      testRun.orderNumber !== undefined;

    // Print summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Status: ${testRun.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Order Number: ${testRun.orderNumber || 'N/A'}`);
    console.log(`Total Time: ${testRun.performance.totalTestTime}ms`);
    console.log(`Screenshots: ${testRun.screenshots.length}`);
    console.log(`Errors: ${testRun.errors.length}`);

    if (testRun.errors.length > 0) {
      console.log('\nErrors:');
      testRun.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('═══════════════════════════════════════════════════════\n');

    // Assert test success
    expect(testRun.success).toBe(true);
    expect(testRun.orderNumber).toBeDefined();
    expect(weightVerification.withinRange).toBe(true);
    expect(priceVerification.withinExpectedRange).toBe(true);
  });
});

/**
 * Test suite for Southwest Cargo airport pickup
 */
test.describe('Complete Order Flow - Southwest Cargo', () => {
  let consoleLogs: ConsoleLog[];
  let testRun: TestRun;

  test.beforeEach(async ({ page }) => {
    testRun = {
      scenario: 'Southwest Cargo',
      runNumber: 1,
      startTime: new Date(),
      performance: {
        pageLoadTime: 0,
        productConfigTime: 0,
        fileUploadTime: 0,
        checkoutTime: 0,
        paymentTime: 0,
        totalTestTime: 0,
        apiCalls: 0,
      },
      screenshots: [],
      consoleLogs: [],
      success: false,
      errors: [],
    };

    consoleLogs = setupConsoleCapture(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Scenario 2: Southwest Cargo Airport Pickup at ATL', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✈️  SCENARIO 2: Southwest Cargo Airport Pickup');
    console.log('═══════════════════════════════════════════════════════\n');

    const testData = getSouthwestCargoTestData();
    const metadata = getTestRunMetadata('southwest-cargo', 1);

    console.log(`Test ID: ${metadata.testId}`);
    console.log(`Customer: ${testData.customer.name} <${testData.customer.email}>`);
    console.log(`Airport: ${testData.airport.airportName} (${testData.airport.airportCode})\n`);

    // STEP 1: Navigate to product page
    console.log('📍 Step 1: Navigate to product page');
    const pageLoadStart = Date.now();
    await page.goto(`${BASE_URL}/products/1`);
    await expect(page).toHaveTitle(/UV Coated|Flyer|Product/i, { timeout: 10000 });
    testRun.performance.pageLoadTime = Date.now() - pageLoadStart;
    console.log(`  ✓ Page loaded in ${testRun.performance.pageLoadTime}ms\n`);

    const evidence1 = await captureEvidence(page, 'airport-product-page', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence1.screenshot);

    // STEP 2: Configure product
    console.log('📍 Step 2: Configure product options');
    const configStart = Date.now();
    await configureProduct(page);
    testRun.performance.productConfigTime = Date.now() - configStart;
    console.log('');

    // STEP 3: Upload images
    console.log('📍 Step 3: Upload images');
    const uploadStart = Date.now();
    const uploadSuccess = await uploadImages(page);
    testRun.performance.fileUploadTime = Date.now() - uploadStart;

    if (!uploadSuccess) {
      testRun.errors.push('File upload verification failed');
    }
    console.log('');

    const evidence2 = await captureEvidence(page, 'airport-product-configured', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence2.screenshot);

    // STEP 4: Add to cart
    console.log('📍 Step 4: Add to cart');
    const addToCartButton = page.locator(SELECTORS.addToCartButton).first();
    await addToCartButton.click();
    await page.waitForTimeout(WAIT_TIMES.pageLoad);
    console.log('  ✓ Added to cart\n');

    // STEP 5: Navigate to checkout
    console.log('📍 Step 5: Navigate to checkout');
    const checkoutStart = Date.now();
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForTimeout(1000);

    const checkoutButton = page.locator(SELECTORS.checkoutButton).first();
    await checkoutButton.click();
    await page.waitForURL(/checkout/i, { timeout: 10000 });
    console.log('  ✓ Navigated to checkout\n');

    // STEP 6: Fill shipping address
    console.log('📍 Step 6: Fill customer information');
    await fillShippingAddress(page, testData.address);
    console.log('');

    const evidence3 = await captureEvidence(page, 'airport-shipping-address', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence3.screenshot);

    // STEP 7: Continue and select airport pickup
    console.log('📍 Step 7: Select Southwest Cargo airport pickup');
    const continueButton = page.locator(SELECTORS.continueButton).first();
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await page.waitForTimeout(2000);
    }

    // Select Southwest Cargo
    const southwestRadio = page.locator(SELECTORS.shippingMethodRadio).filter({
      hasText: /Southwest.*Cargo|Airport/i
    }).first();

    if (await southwestRadio.isVisible()) {
      await southwestRadio.check();
      console.log('  ✓ Selected Southwest Cargo');
      await page.waitForTimeout(2000);

      // Select airport
      const airportSelect = page.locator(SELECTORS.airportSelect).first();
      if (await airportSelect.isVisible()) {
        await airportSelect.selectOption({ label: /Atlanta.*Hartsfield/i });
        console.log(`  ✓ Selected ${testData.airport.airportName}`);
        await page.waitForTimeout(WAIT_TIMES.shippingCalculation);
      }
    }
    console.log('');

    testRun.performance.checkoutTime = Date.now() - checkoutStart;

    // STEP 8: Verify weight
    console.log('📍 Step 8: Verify weight calculation');
    const weightVerification = await verifyWeight(page);
    testRun.weightVerification = weightVerification;

    console.log(`  Actual Weight: ${weightVerification.actual} lbs`);
    console.log(`  Expected Weight: ${weightVerification.expected} lbs`);
    console.log(`  Within Range: ${weightVerification.withinRange ? '✅ YES' : '❌ NO'}`);
    console.log(`  Boxes Required: ${weightVerification.boxes}`);

    if (!weightVerification.withinRange) {
      testRun.errors.push(`Weight verification failed: ${weightVerification.actual} lbs`);
    }
    console.log('');

    // STEP 9: Verify pricing
    console.log('📍 Step 9: Verify pricing breakdown');
    const priceVerification = await verifyPricing(page);
    testRun.priceVerification = priceVerification;

    console.log(`  Subtotal: $${priceVerification.subtotal.toFixed(2)}`);
    console.log(`  Shipping: $${priceVerification.shipping.toFixed(2)}`);
    console.log(`  Tax: $${priceVerification.tax.toFixed(2)}`);
    console.log(`  Total: $${priceVerification.total.toFixed(2)}`);
    console.log(`  Within Expected Range: ${priceVerification.withinExpectedRange ? '✅ YES' : '❌ NO'}`);

    if (!priceVerification.withinExpectedRange) {
      testRun.errors.push(`Price verification failed: $${priceVerification.total}`);
    }
    console.log('');

    const evidence4 = await captureEvidence(page, 'airport-checkout-review', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence4.screenshot);

    // STEP 10: Complete payment
    console.log('📍 Step 10: Complete Square payment');
    const paymentStart = Date.now();

    await completeSquarePayment(page);

    const placeOrderButton = page.locator(SELECTORS.placeOrderButton).first();
    await placeOrderButton.click();
    console.log('  ✓ Order submitted');

    await page.waitForURL(/success|confirmation|thank-you/i, { timeout: 30000 });
    testRun.performance.paymentTime = Date.now() - paymentStart;
    console.log(`  ✓ Payment processed in ${testRun.performance.paymentTime}ms\n`);

    // STEP 11: Extract order number
    console.log('📍 Step 11: Extract order information');
    const orderNumber = await extractOrderNumber(page);

    if (orderNumber) {
      testRun.orderNumber = orderNumber;
      console.log(`  ✓ Order Number: ${orderNumber}`);
    } else {
      testRun.errors.push('Failed to extract order number');
      console.log('  ⚠️  Could not extract order number');
    }
    console.log('');

    const evidence5 = await captureEvidence(page, 'airport-order-success', TEST_OUTPUT_DIR);
    testRun.screenshots.push(evidence5.screenshot);

    // STEP 12: Verify order in database
    if (orderNumber) {
      console.log('📍 Step 12: Verify order in database');
      const dbVerification = await verifyOrderInDatabase(orderNumber, BASE_URL);
      testRun.dbVerification = dbVerification;

      if (dbVerification.success) {
        testRun.orderId = dbVerification.orderId;
        console.log(`  ✓ Order found in database`);
        console.log(`  Order ID: ${dbVerification.orderId}`);
        console.log(`  Status: ${dbVerification.data?.status}`);
        console.log(`  Payment Status: ${dbVerification.data?.payment_status}`);

        if (dbVerification.warnings.length > 0) {
          console.log(`  ⚠️  Warnings: ${dbVerification.warnings.join(', ')}`);
        }
      } else {
        testRun.errors.push('Database verification failed');
        console.log(`  ❌ Database verification failed: ${dbVerification.errors.join(', ')}`);
      }
    }
    console.log('');

    // Check console errors
    testRun.consoleLogs = consoleLogs;
    const noErrors = hasNoErrors(consoleLogs);
    if (!noErrors) {
      const errorCount = consoleLogs.filter(log => log.type === 'error').length;
      testRun.errors.push(`${errorCount} console errors detected`);
      console.log(`  ⚠️  ${errorCount} console errors detected`);
    }

    // Calculate total time
    testRun.endTime = new Date();
    testRun.performance.totalTestTime = testRun.endTime.getTime() - testRun.startTime.getTime();

    // Determine success
    testRun.success = testRun.errors.length === 0 &&
                      weightVerification.withinRange &&
                      priceVerification.withinExpectedRange &&
                      testRun.orderNumber !== undefined;

    // Print summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Status: ${testRun.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Order Number: ${testRun.orderNumber || 'N/A'}`);
    console.log(`Total Time: ${testRun.performance.totalTestTime}ms`);
    console.log(`Screenshots: ${testRun.screenshots.length}`);
    console.log(`Errors: ${testRun.errors.length}`);

    if (testRun.errors.length > 0) {
      console.log('\nErrors:');
      testRun.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('═══════════════════════════════════════════════════════\n');

    // Assert test success
    expect(testRun.success).toBe(true);
    expect(testRun.orderNumber).toBeDefined();
    expect(weightVerification.withinRange).toBe(true);
    expect(priceVerification.withinExpectedRange).toBe(true);
  });
});
