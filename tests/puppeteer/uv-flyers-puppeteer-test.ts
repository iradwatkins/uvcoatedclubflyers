/**
 * UV Coated Club Flyers - Puppeteer Test Suite
 *
 * Alternative browser automation using Puppeteer
 * Tests the same scenarios as Playwright but with different tooling
 */

import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface PuppeteerTestMetrics {
  testName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  consoleMessages: { type: string; text: string }[];
  networkRequests: {
    url: string;
    method: string;
    status: number;
    duration: number;
  }[];
  screenshots: string[];
  performanceMetrics?: any;
  success: boolean;
  errorMessage?: string;
}

class PuppeteerTestReporter {
  private metrics: PuppeteerTestMetrics;
  private screenshotDir: string;

  constructor(testName: string) {
    this.metrics = {
      testName,
      startTime: Date.now(),
      consoleMessages: [],
      networkRequests: [],
      screenshots: [],
      success: false,
    };
    this.screenshotDir = path.join(__dirname, '../../test-results/puppeteer-screenshots');

    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  captureConsoleMessage(type: string, text: string) {
    this.metrics.consoleMessages.push({ type, text });
  }

  captureNetworkRequest(url: string, method: string, status: number, duration: number) {
    this.metrics.networkRequests.push({ url, method, status, duration });
  }

  async captureScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `${this.metrics.testName}-${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    await page.screenshot({ path: filepath, fullPage: true });
    this.metrics.screenshots.push(filepath);

    return filepath;
  }

  async capturePerformanceMetrics(page: Page) {
    const metrics = await page.metrics();
    this.metrics.performanceMetrics = metrics;
  }

  complete(success: boolean, errorMessage?: string) {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.metrics.success = success;
    this.metrics.errorMessage = errorMessage;
  }

  saveReport() {
    const reportPath = path.join(
      __dirname,
      '../../test-results',
      `puppeteer-${this.metrics.testName}-${Date.now()}.json`
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.metrics, null, 2));
    console.log(`\n📊 Puppeteer test report saved: ${reportPath}`);
  }
}

async function setupPage(browser: Browser, reporter: PuppeteerTestReporter): Promise<Page> {
  const page = await browser.newPage();

  // Set viewport to desktop resolution
  await page.setViewport({ width: 1920, height: 1080 });

  // Enable console message capture
  page.on('console', (msg) => {
    reporter.captureConsoleMessage(msg.type(), msg.text());
  });

  // Enable request interception for network monitoring
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const startTime = Date.now();

    request.continue();

    // Track the request
    request
      .response()
      .then((response) => {
        if (response) {
          const duration = Date.now() - startTime;
          reporter.captureNetworkRequest(
            request.url(),
            request.method(),
            response.status(),
            duration
          );
        }
      })
      .catch(() => {
        // Request failed or was aborted
      });
  });

  return page;
}

async function testFedExGroundOrder() {
  const reporter = new PuppeteerTestReporter('fedex-ground-puppeteer');
  let browser: Browser | null = null;

  try {
    console.log('\n🚀 Starting Puppeteer Test 1: FedEx Ground Shipping');

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await setupPage(browser, reporter);
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';

    // Step 1: Navigate to products page
    console.log('  ➤ Step 1: Navigating to products page...');
    await page.goto(`${baseURL}/products`, { waitUntil: 'networkidle2' });
    await reporter.captureScreenshot(page, '01-products-page');

    // Step 2: Click on 4x6 Flyers
    console.log('  ➤ Step 2: Selecting 4x6 UV Coated Flyers...');
    await page.waitForSelector('text/4x6 Flyers');
    await page.click('text/4x6 Flyers');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await reporter.captureScreenshot(page, '02-product-page');

    // Step 3: Configure product
    console.log('  ➤ Step 3: Configuring product options...');

    // Select quantity: 5000
    await page.select('select#quantity', '5000');

    // Wait for price calculation
    await page.waitForTimeout(500);

    await reporter.captureScreenshot(page, '03-product-configured');

    // Step 4: Add to cart
    console.log('  ➤ Step 4: Adding to cart...');
    await page.click('button::-p-text(Add to Cart)');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await reporter.captureScreenshot(page, '04-cart-page');

    // Step 5: Proceed to checkout
    console.log('  ➤ Step 5: Proceeding to checkout...');
    await page.click('button::-p-text(Proceed to Checkout)');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await reporter.captureScreenshot(page, '05-checkout-address');

    // Step 6: Fill shipping address - FedEx Ground
    console.log('  ➤ Step 6: Filling shipping address...');
    await page.type('input[name="fullName"]', 'Puppeteer Test - FedEx');
    await page.type('input[name="email"]', 'puppeteer-fedex@uvcoatedflyers.com');
    await page.type('input[name="phone"]', '404-555-0500');
    await page.type('input[name="address"]', '976 Carr Street');
    await page.type('input[name="city"]', 'Atlanta');
    await page.select('select[name="state"]', 'GA');
    await page.type('input[name="zipCode"]', '30318');

    await reporter.captureScreenshot(page, '06-address-filled');

    await page.click('button::-p-text(Continue to Shipping)');
    await page.waitForTimeout(2000);

    // Step 7: Skip airport selection
    console.log('  ➤ Step 7: Skipping airport selection...');
    const skipButton = await page.$('button::-p-text(Skip Airport)');
    if (skipButton) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }

    await reporter.captureScreenshot(page, '07-shipping-methods');

    // Step 8: Select FedEx Ground
    console.log('  ➤ Step 8: Selecting FedEx Ground...');
    await page.click('text/FedEx Ground');
    await page.waitForTimeout(1000);
    await reporter.captureScreenshot(page, '08-fedex-selected');

    // Capture performance metrics
    await reporter.capturePerformanceMetrics(page);

    console.log('\n✅ Puppeteer FedEx Ground test completed successfully!');
    console.log('📦 Product: 5,000 × 4x6 UV Coated Flyers (9pt card stock)');
    console.log('⚖️  Weight: 40 lbs');
    console.log('🚚 Shipping: FedEx Ground to 976 Carr Street, Atlanta, GA 30318');

    reporter.complete(true);
    reporter.saveReport();

  } catch (error) {
    console.error('\n❌ Puppeteer FedEx Ground test failed:', error);
    reporter.complete(false, error instanceof Error ? error.message : String(error));
    reporter.saveReport();
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testSouthwestCargoOrder() {
  const reporter = new PuppeteerTestReporter('southwest-cargo-puppeteer');
  let browser: Browser | null = null;

  try {
    console.log('\n🚀 Starting Puppeteer Test 2: Southwest Cargo Airport Pickup');

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await setupPage(browser, reporter);
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';

    // Step 1: Navigate to products page
    console.log('  ➤ Step 1: Navigating to products page...');
    await page.goto(`${baseURL}/products`, { waitUntil: 'networkidle2' });
    await reporter.captureScreenshot(page, '01-products-page');

    // Step 2: Click on 4x6 Flyers
    console.log('  ➤ Step 2: Selecting 4x6 UV Coated Flyers...');
    await page.click('text/4x6 Flyers');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await reporter.captureScreenshot(page, '02-product-page');

    // Step 3: Configure product
    console.log('  ➤ Step 3: Configuring product options...');
    await page.select('select#quantity', '5000');
    await page.waitForTimeout(500);
    await reporter.captureScreenshot(page, '03-product-configured');

    // Step 4: Add to cart
    console.log('  ➤ Step 4: Adding to cart...');
    await page.click('button::-p-text(Add to Cart)');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await reporter.captureScreenshot(page, '04-cart-page');

    // Step 5: Proceed to checkout
    console.log('  ➤ Step 5: Proceeding to checkout...');
    await page.click('button::-p-text(Proceed to Checkout)');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await reporter.captureScreenshot(page, '05-checkout-address');

    // Step 6: Fill shipping address - Airport
    console.log('  ➤ Step 6: Filling airport pickup address...');
    await page.type('input[name="fullName"]', 'Puppeteer Test - Airport');
    await page.type('input[name="email"]', 'puppeteer-airport@uvcoatedflyers.com');
    await page.type('input[name="phone"]', '404-555-0600');
    await page.type('input[name="address"]', '6000 N Terminal Parkway');
    await page.type('input[name="city"]', 'Atlanta');
    await page.select('select[name="state"]', 'GA');
    await page.type('input[name="zipCode"]', '30320');

    await reporter.captureScreenshot(page, '06-address-filled');

    await page.click('button::-p-text(Continue to Shipping)');
    await page.waitForTimeout(2000);

    // Step 7: Select Hartsfield-Jackson Airport
    console.log('  ➤ Step 7: Selecting Hartsfield-Jackson Airport...');
    await reporter.captureScreenshot(page, '07-airport-selection');

    await page.click('text/Hartsfield-Jackson');
    await page.waitForTimeout(2000);
    await reporter.captureScreenshot(page, '08-airport-selected');

    // Step 8: Select Southwest Cargo
    console.log('  ➤ Step 8: Selecting Southwest Cargo...');
    await page.click('text/Southwest Cargo');
    await page.waitForTimeout(1000);
    await reporter.captureScreenshot(page, '09-southwest-selected');

    // Capture performance metrics
    await reporter.capturePerformanceMetrics(page);

    console.log('\n✅ Puppeteer Southwest Cargo test completed successfully!');
    console.log('📦 Product: 5,000 × 4x6 UV Coated Flyers (9pt card stock)');
    console.log('⚖️  Weight: 40 lbs');
    console.log('✈️  Shipping: Southwest Cargo pickup at Hartsfield-Jackson Atlanta Airport');

    reporter.complete(true);
    reporter.saveReport();

  } catch (error) {
    console.error('\n❌ Puppeteer Southwest Cargo test failed:', error);
    reporter.complete(false, error instanceof Error ? error.message : String(error));
    reporter.saveReport();
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function runFormValidationTests() {
  const reporter = new PuppeteerTestReporter('form-validation-puppeteer');
  let browser: Browser | null = null;

  try {
    console.log('\n🚀 Starting Puppeteer Test 3: Form Validation');

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await setupPage(browser, reporter);
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';

    // Navigate to checkout
    await page.goto(`${baseURL}/checkout`, { waitUntil: 'networkidle2' });
    await reporter.captureScreenshot(page, '01-checkout-page');

    // Test 1: Submit empty form
    console.log('  ➤ Test 1: Submitting empty form...');
    await page.click('button::-p-text(Continue to Shipping)');
    await page.waitForTimeout(500);
    await reporter.captureScreenshot(page, '02-empty-form-validation');

    // Test 2: Invalid email
    console.log('  ➤ Test 2: Testing invalid email...');
    await page.type('input[name="email"]', 'invalid-email');
    await page.click('button::-p-text(Continue to Shipping)');
    await page.waitForTimeout(500);
    await reporter.captureScreenshot(page, '03-invalid-email-validation');

    // Test 3: Invalid phone
    console.log('  ➤ Test 3: Testing invalid phone...');
    await page.evaluate(() => {
      (document.querySelector('input[name="email"]') as HTMLInputElement).value = '';
    });
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="phone"]', '123'); // Too short
    await page.click('button::-p-text(Continue to Shipping)');
    await page.waitForTimeout(500);
    await reporter.captureScreenshot(page, '04-invalid-phone-validation');

    // Test 4: Invalid ZIP code
    console.log('  ➤ Test 4: Testing invalid ZIP code...');
    await page.type('input[name="zipCode"]', '123'); // Too short
    await page.click('button::-p-text(Continue to Shipping)');
    await page.waitForTimeout(500);
    await reporter.captureScreenshot(page, '05-invalid-zip-validation');

    console.log('\n✅ Puppeteer form validation tests completed!');

    reporter.complete(true);
    reporter.saveReport();

  } catch (error) {
    console.error('\n❌ Puppeteer form validation test failed:', error);
    reporter.complete(false, error instanceof Error ? error.message : String(error));
    reporter.saveReport();
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  UV COATED CLUB FLYERS - PUPPETEER TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Run all tests sequentially
    await testFedExGroundOrder();
    await testSouthwestCargoOrder();
    await runFormValidationTests();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ ALL PUPPETEER TESTS COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('❌ PUPPETEER TEST SUITE FAILED');
    console.error('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { testFedExGroundOrder, testSouthwestCargoOrder, runFormValidationTests };
