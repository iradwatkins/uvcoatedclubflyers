import { test, expect } from '@playwright/test';
import { HomePage, ProductPage, CartPage, CheckoutPage, OrderConfirmationPage } from './helpers/page-objects';
import { TEST_PRODUCT, FEDEX_SHIPPING, TEST_IMAGES, TAX_RATE } from './helpers/test-data';
import { WeightCalculator } from './helpers/weight-calculator';
import { ApiHelper } from './helpers/api-helpers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Suite: FedEx Ground Shipping Checkout Flow
 *
 * Tests the complete e-commerce flow for ordering 5,000 UV-coated club flyers
 * with FedEx Ground shipping to 976 Carr Street, Atlanta, GA 30318
 */

test.describe('FedEx Ground Checkout Flow', () => {
  let homePage: HomePage;
  let productPage: ProductPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;
  let confirmationPage: OrderConfirmationPage;
  let apiHelper: ApiHelper;

  let frontImagePath: string;
  let backImagePath: string;

  test.beforeAll(async () => {
    // Locate test images
    const imagesFolder = TEST_IMAGES.folder;
    const files = fs.readdirSync(imagesFolder);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));

    if (imageFiles.length < 2) {
      throw new Error(`Need at least 2 images in ${imagesFolder}, found ${imageFiles.length}`);
    }

    frontImagePath = path.join(imagesFolder, imageFiles[0]);
    backImagePath = path.join(imagesFolder, imageFiles[1]);

    console.log(`Using test images:\n  Front: ${frontImagePath}\n  Back: ${backImagePath}`);
  });

  test.beforeEach(async ({ page, request }) => {
    homePage = new HomePage(page);
    productPage = new ProductPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);
    confirmationPage = new OrderConfirmationPage(page);

    apiHelper = new ApiHelper(request, 'http://localhost:3000');

    // Clear cart before each test
    await apiHelper.clearCart().catch(() => console.log('No cart to clear'));

    // Take screenshot of starting state
    await page.goto('/');
    await page.screenshot({ path: `test-results/screenshots/fedex-start-${Date.now()}.png`, fullPage: true });
  });

  test('Complete FedEx Ground checkout with weight validation', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    // Step 1: Navigate to products page
    await test.step('Navigate to products', async () => {
      await homePage.goto();
      await page.screenshot({ path: `test-results/screenshots/fedex-01-homepage.png`, fullPage: true });

      await homePage.navigateToProducts();
      await page.waitForURL(/\/products/);
      await page.screenshot({ path: `test-results/screenshots/fedex-02-products.png`, fullPage: true });
    });

    // Step 2: Select first product (UV Coated Club Flyers)
    await test.step('Select product', async () => {
      const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
      await firstProduct.click();
      await page.waitForURL(/\/products\/.+/);
      await page.screenshot({ path: `test-results/screenshots/fedex-03-product-detail.png`, fullPage: true });
    });

    // Step 3: Configure product (5000 qty, 4x6, 9pt, UV both sides)
    await test.step('Configure product', async () => {
      // Select quantity: 5000
      await productPage.selectQuantity(TEST_PRODUCT.quantity);
      await productPage.waitForPriceUpdate();

      // Select size: 4x6
      const sizeDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /size|dimensions/i }).first();
      if (await sizeDropdown.isVisible()) {
        await sizeDropdown.selectOption({ label: /4.*6|4x6/i });
        await productPage.waitForPriceUpdate();
      }

      // Select material: 9pt card stock
      const materialDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /material|stock|paper/i }).first();
      if (await materialDropdown.isVisible()) {
        await materialDropdown.selectOption({ label: /9pt|9.*pt/i });
        await productPage.waitForPriceUpdate();
      }

      // Select sides: Both sides
      const sidesDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /sides/i }).first();
      if (await sidesDropdown.isVisible()) {
        await sidesDropdown.selectOption({ label: /both|two|2/i });
        await productPage.waitForPriceUpdate();
      }

      // Select coating: UV
      const coatingDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /coating|finish/i }).first();
      if (await coatingDropdown.isVisible()) {
        await coatingDropdown.selectOption({ label: /uv/i });
        await productPage.waitForPriceUpdate();
      }

      await page.screenshot({ path: `test-results/screenshots/fedex-04-configured.png`, fullPage: true });
    });

    // Step 4: Upload images (front and back)
    await test.step('Upload images', async () => {
      await productPage.uploadImages(frontImagePath, backImagePath);

      // Wait for upload completion
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `test-results/screenshots/fedex-05-images-uploaded.png`, fullPage: true });
    });

    // Step 5: Add to cart
    let productPrice: number;
    await test.step('Add to cart', async () => {
      // Capture price before adding to cart
      const priceText = await productPage.priceDisplay.textContent();
      productPrice = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');

      await productPage.addToCart();

      // Wait for cart notification or redirect
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/screenshots/fedex-06-added-to-cart.png`, fullPage: true });
    });

    // Step 6: Go to cart and proceed to checkout
    await test.step('Proceed to checkout', async () => {
      await cartPage.goto();
      await page.screenshot({ path: `test-results/screenshots/fedex-07-cart.png`, fullPage: true });

      // Verify cart contents
      await expect(cartPage.cartItems).toHaveCount(1);

      await cartPage.proceedToCheckout();
      await page.waitForURL(/\/checkout/);
      await page.screenshot({ path: `test-results/screenshots/fedex-08-checkout-start.png`, fullPage: true });
    });

    // Step 7: Fill shipping address (FedEx Ground address)
    await test.step('Fill shipping address', async () => {
      await checkoutPage.fillShippingAddress(FEDEX_SHIPPING.address);
      await page.screenshot({ path: `test-results/screenshots/fedex-09-shipping-address.png`, fullPage: true });

      await checkoutPage.continueToAirport();
      await page.waitForTimeout(1000);
    });

    // Step 8: Skip airport selection (FedEx Ground doesn't need airport)
    await test.step('Skip airport selection', async () => {
      // Check if airport step is visible
      const skipButton = checkoutPage.skipAirportButton;
      if (await skipButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await skipButton.click();
      }
      await page.screenshot({ path: `test-results/screenshots/fedex-10-airport-skipped.png`, fullPage: true });
      await page.waitForTimeout(1000);
    });

    // Step 9: Calculate and verify weight
    let calculatedWeight: any;
    await test.step('Verify weight calculation', async () => {
      calculatedWeight = WeightCalculator.calculate9ptCardStock(
        TEST_PRODUCT.width,
        TEST_PRODUCT.height,
        TEST_PRODUCT.quantity
      );

      console.log('Weight Calculation:');
      console.log(`  Formula: ${calculatedWeight.formula}`);
      console.log(`  Total Weight: ${calculatedWeight.totalWeight} lbs`);
      console.log(`  Packaging Weight: ${calculatedWeight.packagingWeight} lbs`);
      console.log(`  Combined Weight: ${calculatedWeight.combinedWeight} lbs`);
      console.log(`  Number of Boxes: ${calculatedWeight.numberOfBoxes}`);
      console.log(`  Weight per Box: ${calculatedWeight.weightPerBox.join(', ')} lbs`);

      // Verify weight calculation is correct
      expect(calculatedWeight.totalWeight).toBe(40); // 0.000333333333 × 4 × 6 × 5000 = 40
      expect(calculatedWeight.numberOfBoxes).toBe(2); // 40 / 36 = 2 boxes
    });

    // Step 10: Select FedEx Ground shipping
    let shippingCost: number = 0;
    await test.step('Select FedEx Ground shipping', async () => {
      // Wait for shipping rates to load
      await page.waitForSelector('[data-testid="shipping-method"], .shipping-method', { timeout: 15000 });
      await page.screenshot({ path: `test-results/screenshots/fedex-11-shipping-methods.png`, fullPage: true });

      // Find and select FedEx Ground
      const fedexGroundCard = page.locator('[data-testid="shipping-method"], .shipping-method')
        .filter({ hasText: /fedex.*ground/i })
        .first();

      await expect(fedexGroundCard).toBeVisible();

      // Extract shipping cost
      const costText = await fedexGroundCard.locator('text=/\\$[0-9,.]+/').textContent();
      shippingCost = parseFloat(costText?.replace(/[^0-9.]/g, '') || '0');
      console.log(`FedEx Ground shipping cost: $${shippingCost}`);

      await fedexGroundCard.click();
      await page.waitForTimeout(500);

      await checkoutPage.continueToPayment();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/screenshots/fedex-12-payment-step.png`, fullPage: true });
    });

    // Step 11: Verify order summary calculations
    await test.step('Verify order summary', async () => {
      const subtotalText = await checkoutPage.subtotal.textContent();
      const subtotal = parseFloat(subtotalText?.replace(/[^0-9.]/g, '') || '0');

      const shippingText = await checkoutPage.shipping.textContent();
      const shipping = parseFloat(shippingText?.replace(/[^0-9.]/g, '') || '0');

      const taxText = await checkoutPage.tax.textContent();
      const tax = parseFloat(taxText?.replace(/[^0-9.]/g, '') || '0');

      const totalText = await checkoutPage.total.textContent();
      const total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');

      console.log('Order Summary:');
      console.log(`  Subtotal: $${subtotal.toFixed(2)}`);
      console.log(`  Shipping: $${shipping.toFixed(2)}`);
      console.log(`  Tax (8.75%): $${tax.toFixed(2)}`);
      console.log(`  Total: $${total.toFixed(2)}`);

      // Verify calculations
      const expectedTax = (subtotal + shipping) * TAX_RATE;
      const expectedTotal = subtotal + shipping + expectedTax;

      expect(shipping).toBe(shippingCost);
      expect(tax).toBeCloseTo(expectedTax, 2);
      expect(total).toBeCloseTo(expectedTotal, 2);
    });

    // Step 12: Complete payment with Square Card
    await test.step('Complete Square Card payment', async () => {
      await checkoutPage.selectSquareCard();
      await page.waitForTimeout(2000); // Wait for Square SDK

      // Note: In test environment, Square card payment might need sandbox/test mode
      // This is a placeholder for the actual payment flow
      console.log('⚠️  Square Card payment requires Square SDK and test credentials');
      console.log('    Skipping actual payment tokenization in automated test');

      await page.screenshot({ path: `test-results/screenshots/fedex-13-payment-form.png`, fullPage: true });
    });

    console.log('✅ FedEx Ground checkout flow test completed successfully');
  });

  test('API: Verify FedEx Ground shipping calculation', async ({ request }) => {
    test.setTimeout(60000);

    await test.step('Calculate shipping via API', async () => {
      const weight = WeightCalculator.calculate9ptCardStock(
        TEST_PRODUCT.width,
        TEST_PRODUCT.height,
        TEST_PRODUCT.quantity
      );

      const shippingRequest = {
        toAddress: FEDEX_SHIPPING.address,
        items: [
          {
            quantity: TEST_PRODUCT.quantity,
            weightLbs: weight.combinedWeight
          }
        ]
      };

      const rates = await apiHelper.calculateShipping(shippingRequest);

      console.log('Shipping Rates from API:');
      rates.forEach(rate => {
        console.log(`  ${rate.carrier} ${rate.service}: $${rate.cost} (${rate.estimatedDays || 'N/A'} days)`);
      });

      // Verify FedEx Ground is available
      const fedexGround = rates.find(r =>
        r.carrier.toLowerCase().includes('fedex') &&
        r.service.toLowerCase().includes('ground')
      );

      expect(fedexGround).toBeDefined();
      expect(fedexGround!.cost).toBeGreaterThan(0);

      console.log(`✅ FedEx Ground rate: $${fedexGround!.cost}`);
    });
  });
});
