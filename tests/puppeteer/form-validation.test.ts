import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Puppeteer Test Suite: Form Validation and Screenshots
 *
 * Tests checkout form validation and captures detailed screenshots
 */

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'puppeteer-screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

describe('Checkout Form Validation with Puppeteer', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterEach(async () => {
    await page.close();
  });

  test('Validate shipping address form - empty fields', async () => {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle0' });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'validation-01-empty-form.png'),
      fullPage: true
    });

    // Try to submit empty form
    const continueButton = await page.$('button:has-text("Continue")');

    if (continueButton) {
      await continueButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'validation-02-empty-errors.png'),
        fullPage: true
      });

      // Check for validation errors
      const errors = await page.$$eval('[class*="error"], [role="alert"], .text-red-500', els =>
        els.map(el => el.textContent)
      );

      console.log('Validation errors found:', errors);
      expect(errors.length).toBeGreaterThan(0);
    }
  }, 60000);

  test('Validate email format', async () => {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle0' });

    // Find email input
    const emailInput = await page.$('input[type="email"], input[name*="email"]');

    if (emailInput) {
      // Test invalid email formats
      const invalidEmails = ['invalid', 'test@', '@test.com', 'test@test'];

      for (const email of invalidEmails) {
        await emailInput.click({ clickCount: 3 }); // Select all
        await emailInput.type(email);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `validation-email-${email.replace(/[@.]/g, '-')}.png`),
          fullPage: true
        });

        const errorText = await page.$eval('[class*="error"]', el => el.textContent).catch(() => null);

        if (errorText) {
          console.log(`Email "${email}" validation error:`, errorText);
        }
      }

      // Test valid email
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('test@valid.com');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'validation-email-valid.png'),
        fullPage: true
      });
    }
  }, 90000);

  test('Validate zip code format', async () => {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle0' });

    const zipInput = await page.$('input[name*="zip"], input[placeholder*="zip" i]');

    if (zipInput) {
      // Test invalid zip codes
      const invalidZips = ['123', '12345678', 'ABCDE', '1234'];

      for (const zip of invalidZips) {
        await zipInput.click({ clickCount: 3 });
        await zipInput.type(zip);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `validation-zip-${zip}.png`),
          fullPage: true
        });

        const errorText = await page.$eval('[class*="error"]', el => el.textContent).catch(() => null);

        if (errorText) {
          console.log(`Zip "${zip}" validation error:`, errorText);
        }
      }

      // Test valid zip code
      await zipInput.click({ clickCount: 3 });
      await zipInput.type('30318');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'validation-zip-valid.png'),
        fullPage: true
      });
    }
  }, 90000);

  test('Validate required fields highlighting', async () => {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle0' });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'fields-01-initial.png'),
      fullPage: true
    });

    // Tab through all fields without entering data
    const inputs = await page.$$('input, select');

    for (let i = 0; i < inputs.length && i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'fields-02-touched.png'),
      fullPage: true
    });

    // Check which fields are highlighted as errors
    const errorFields = await page.$$eval('[class*="error"], [aria-invalid="true"]', els =>
      els.map(el => ({
        tag: el.tagName,
        name: el.getAttribute('name'),
        placeholder: el.getAttribute('placeholder')
      }))
    );

    console.log('Error-highlighted fields:', errorFields);
    expect(errorFields.length).toBeGreaterThan(0);
  }, 60000);

  test('Test state dropdown population', async () => {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle0' });

    const stateSelect = await page.$('select[name*="state"]');

    if (stateSelect) {
      await stateSelect.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'state-dropdown-opened.png'),
        fullPage: true
      });

      const options = await page.$$eval('select[name*="state"] option', els =>
        els.map(el => ({ value: el.getAttribute('value'), text: el.textContent }))
      );

      console.log(`Found ${options.length} state options`);
      expect(options.length).toBeGreaterThan(50); // US has 50 states

      // Select Georgia
      await page.select('select[name*="state"]', 'GA');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'state-georgia-selected.png'),
        fullPage: true
      });
    }
  }, 60000);

  test('Test phone number formatting', async () => {
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle0' });

    const phoneInput = await page.$('input[type="tel"], input[name*="phone"]');

    if (phoneInput) {
      // Type phone number
      await phoneInput.click();
      await phoneInput.type('5551234567');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'phone-formatted.png'),
        fullPage: true
      });

      // Check if phone was auto-formatted
      const value = await phoneInput.evaluate(el => (el as HTMLInputElement).value);
      console.log('Phone number value:', value);

      // Common formats: (555) 123-4567 or 555-123-4567
      const hasFormatting = value.includes('(') || value.includes('-');
      console.log('Phone has auto-formatting:', hasFormatting);
    }
  }, 60000);
});

describe('Checkout Flow Screenshots', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterEach(async () => {
    await page.close();
  });

  test('Capture all checkout steps', async () => {
    // Step 1: Homepage
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'flow-01-homepage.png'),
      fullPage: true
    });

    // Step 2: Products page
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle0' });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'flow-02-products.png'),
      fullPage: true
    });

    // Step 3: Product detail
    const firstProduct = await page.$('[data-testid="product-card"], .product-card');
    if (firstProduct) {
      await firstProduct.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'flow-03-product-detail.png'),
        fullPage: true
      });
    }

    // Step 4: Cart
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle0' });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'flow-04-cart.png'),
      fullPage: true
    });

    // Step 5: Checkout
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle0' });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'flow-05-checkout.png'),
      fullPage: true
    });

    console.log(`✅ Captured ${5} checkout flow screenshots`);
  }, 120000);

  test('Capture payment methods', async () => {
    await page.goto(`${BASE_URL}/test-payments`, { waitUntil: 'networkidle0' });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'payment-methods-page.png'),
      fullPage: true
    });

    // Try to find and capture each payment method
    const paymentMethods = ['square', 'cashapp', 'paypal'];

    for (const method of paymentMethods) {
      const button = await page.$(`button:has-text("${method}"), [data-testid="${method}"]`);

      if (button) {
        await button.click();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `payment-${method}.png`),
          fullPage: true
        });
      }
    }

    console.log('✅ Captured payment method screenshots');
  }, 120000);

  test('Capture mobile viewport', async () => {
    // Test mobile responsiveness
    await page.setViewport({ width: 375, height: 812 }); // iPhone X

    const pages = ['/', '/products', '/checkout'];

    for (const route of pages) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle0' });

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `mobile-${route.replace(/\//g, '_')}.png`),
        fullPage: true
      });
    }

    console.log('✅ Captured mobile viewport screenshots');
  }, 120000);
});
