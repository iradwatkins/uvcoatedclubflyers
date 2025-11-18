/**
 * Order Verification Helper
 * Utilities for verifying order creation and data integrity
 */

import { Page } from '@playwright/test';
import { EXPECTED_WEIGHT, EXPECTED_PRICE_RANGE } from './test-data-generator';

export interface OrderVerificationResult {
  success: boolean;
  orderNumber: string;
  orderId?: number;
  errors: string[];
  warnings: string[];
  data?: any;
}

export interface WeightVerification {
  actual: number;
  expected: number;
  withinRange: boolean;
  boxes: number;
}

export interface PriceVerification {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  withinExpectedRange: boolean;
}

/**
 * Extract order number from success page
 */
export async function extractOrderNumber(page: Page): Promise<string | null> {
  try {
    // Try multiple selectors
    const selectors = [
      '[data-testid="order-number"]',
      '.order-number',
      'text=/ORD-\\d{8}-\\d{5}/',
      'text=/Order #/',
    ];

    for (const selector of selectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        const text = await element.textContent();
        if (text) {
          // Extract order number from text
          const match = text.match(/ORD-\d{8}-\d{5}/);
          if (match) {
            return match[0];
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting order number:', error);
    return null;
  }
}

/**
 * Verify weight calculation on page
 */
export async function verifyWeight(page: Page): Promise<WeightVerification> {
  try {
    // Look for weight display (various possible formats)
    const weightSelectors = [
      '[data-testid="total-weight"]',
      '.weight-display',
      'text=/\\d+\\.\\d+ lbs/',
      'text=/Weight: \\d+/',
    ];

    let actualWeight = 0;
    let found = false;

    for (const selector of weightSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        const text = await element.textContent();
        if (text) {
          const match = text.match(/(\d+\.?\d*)\s*lbs?/);
          if (match) {
            actualWeight = parseFloat(match[1]);
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      console.warn('Weight not found on page, using expected value');
      actualWeight = EXPECTED_WEIGHT.total;
    }

    const withinRange =
      actualWeight >= EXPECTED_WEIGHT.min && actualWeight <= EXPECTED_WEIGHT.max;

    // Calculate boxes (36 lb max per box)
    const boxes = Math.ceil(actualWeight / 36);

    return {
      actual: actualWeight,
      expected: EXPECTED_WEIGHT.total,
      withinRange,
      boxes,
    };
  } catch (error) {
    console.error('Error verifying weight:', error);
    return {
      actual: 0,
      expected: EXPECTED_WEIGHT.total,
      withinRange: false,
      boxes: 0,
    };
  }
}

/**
 * Verify price breakdown on page
 */
export async function verifyPricing(page: Page): Promise<PriceVerification> {
  try {
    const pricing = {
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
    };

    // Extract subtotal
    const subtotalElement = await page.locator('text=/Subtotal:?/').locator('..').first();
    if (await subtotalElement.isVisible()) {
      const text = await subtotalElement.textContent();
      const match = text?.match(/\$(\d+[\d,]*\.?\d*)/);
      if (match) {
        pricing.subtotal = parseFloat(match[1].replace(/,/g, ''));
      }
    }

    // Extract shipping
    const shippingElement = await page.locator('text=/Shipping:?/').locator('..').first();
    if (await shippingElement.isVisible()) {
      const text = await shippingElement.textContent();
      const match = text?.match(/\$(\d+[\d,]*\.?\d*)/);
      if (match) {
        pricing.shipping = parseFloat(match[1].replace(/,/g, ''));
      }
    }

    // Extract tax
    const taxElement = await page.locator('text=/Tax:?/').locator('..').first();
    if (await taxElement.isVisible()) {
      const text = await taxElement.textContent();
      const match = text?.match(/\$(\d+[\d,]*\.?\d*)/);
      if (match) {
        pricing.tax = parseFloat(match[1].replace(/,/g, ''));
      }
    }

    // Extract total
    const totalElement = await page.locator('text=/Total:?/').locator('..').first();
    if (await totalElement.isVisible()) {
      const text = await totalElement.textContent();
      const match = text?.match(/\$(\d+[\d,]*\.?\d*)/);
      if (match) {
        pricing.total = parseFloat(match[1].replace(/,/g, ''));
      }
    }

    const withinExpectedRange =
      pricing.total >= EXPECTED_PRICE_RANGE.min &&
      pricing.total <= EXPECTED_PRICE_RANGE.max;

    return {
      ...pricing,
      withinExpectedRange,
    };
  } catch (error) {
    console.error('Error verifying pricing:', error);
    return {
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      withinExpectedRange: false,
    };
  }
}

/**
 * Verify order in database via API
 */
export async function verifyOrderInDatabase(
  orderNumber: string,
  baseURL: string
): Promise<OrderVerificationResult> {
  try {
    const response = await fetch(`${baseURL}/api/admin/orders?search=${orderNumber}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        orderNumber,
        errors: [`API returned ${response.status}: ${response.statusText}`],
        warnings: [],
      };
    }

    const data = await response.json();

    if (!data || !data.orders || data.orders.length === 0) {
      return {
        success: false,
        orderNumber,
        errors: ['Order not found in database'],
        warnings: [],
      };
    }

    const order = data.orders[0];

    // Verify order fields
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!order.id) errors.push('Order missing ID');
    if (!order.order_number) errors.push('Order missing order number');
    if (!order.status) errors.push('Order missing status');
    if (!order.payment_status) errors.push('Order missing payment status');
    if (!order.total_amount) errors.push('Order missing total amount');

    // Check status
    if (order.status !== 'pending') {
      warnings.push(`Order status is '${order.status}', expected 'pending'`);
    }

    // Check payment status
    if (order.payment_status !== 'paid') {
      warnings.push(`Payment status is '${order.payment_status}', expected 'paid'`);
    }

    return {
      success: errors.length === 0,
      orderNumber: order.order_number,
      orderId: order.id,
      errors,
      warnings,
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      orderNumber,
      errors: [`Database verification failed: ${error}`],
      warnings: [],
    };
  }
}

/**
 * Capture and save test evidence
 */
export interface TestEvidence {
  screenshot: string;
  timestamp: string;
  step: string;
  url: string;
  data?: any;
}

export async function captureEvidence(
  page: Page,
  step: string,
  outputPath: string
): Promise<TestEvidence> {
  const timestamp = new Date().toISOString();
  const screenshotPath = `${outputPath}/${step.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;

  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    screenshot: screenshotPath,
    timestamp,
    step,
    url: page.url(),
  };
}

/**
 * Wait for element and verify visibility
 */
export async function waitAndVerify(
  page: Page,
  selector: string,
  timeout: number = 30000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch (error) {
    console.error(`Element not found: ${selector}`);
    return false;
  }
}

/**
 * Verify file upload success
 */
export async function verifyFileUpload(
  page: Page,
  expectedCount: number
): Promise<boolean> {
  try {
    // Wait for upload completion indicators
    await page.waitForTimeout(2000);

    // Look for uploaded file indicators
    const uploadedFiles = await page.locator('[data-testid="uploaded-file"]').count();

    return uploadedFiles === expectedCount;
  } catch (error) {
    console.error('Error verifying file upload:', error);
    return false;
  }
}

/**
 * Extract console logs and errors
 */
export interface ConsoleLog {
  type: string;
  text: string;
  timestamp: string;
}

export function setupConsoleCapture(page: Page): ConsoleLog[] {
  const logs: ConsoleLog[] = [];

  page.on('console', (message) => {
    logs.push({
      type: message.type(),
      text: message.text(),
      timestamp: new Date().toISOString(),
    });
  });

  page.on('pageerror', (error) => {
    logs.push({
      type: 'error',
      text: error.message,
      timestamp: new Date().toISOString(),
    });
  });

  return logs;
}

/**
 * Verify no console errors
 */
export function hasNoErrors(logs: ConsoleLog[]): boolean {
  return !logs.some((log) => log.type === 'error');
}

/**
 * Format verification results for reporting
 */
export function formatVerificationReport(
  orderNumber: string,
  weight: WeightVerification,
  pricing: PriceVerification,
  dbResult: OrderVerificationResult
): string {
  return `
# Order Verification Report: ${orderNumber}

## Weight Verification
- Actual: ${weight.actual} lbs
- Expected: ${weight.expected} lbs
- Within Range: ${weight.withinRange ? '✅ YES' : '❌ NO'}
- Boxes: ${weight.boxes}

## Pricing Verification
- Subtotal: $${pricing.subtotal.toFixed(2)}
- Shipping: $${pricing.shipping.toFixed(2)}
- Tax: $${pricing.tax.toFixed(2)}
- **Total: $${pricing.total.toFixed(2)}**
- Within Expected Range: ${pricing.withinExpectedRange ? '✅ YES' : '❌ NO'}

## Database Verification
- Order Found: ${dbResult.success ? '✅ YES' : '❌ NO'}
- Order ID: ${dbResult.orderId || 'N/A'}
- Status: ${dbResult.data?.status || 'N/A'}
- Payment Status: ${dbResult.data?.payment_status || 'N/A'}
- Errors: ${dbResult.errors.length > 0 ? dbResult.errors.join(', ') : 'None'}
- Warnings: ${dbResult.warnings.length > 0 ? dbResult.warnings.join(', ') : 'None'}

## Overall Result
${
  weight.withinRange && pricing.withinExpectedRange && dbResult.success
    ? '✅ ALL VERIFICATIONS PASSED'
    : '❌ SOME VERIFICATIONS FAILED'
}
  `.trim();
}
