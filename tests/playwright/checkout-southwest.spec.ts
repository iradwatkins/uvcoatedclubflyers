import { test, expect } from '@playwright/test';
import { HomePage, ProductPage, CartPage, CheckoutPage, OrderConfirmationPage } from './helpers/page-objects';
import { TEST_PRODUCT, SOUTHWEST_CARGO_SHIPPING, TEST_IMAGES, TAX_RATE } from './helpers/test-data';
import { WeightCalculator } from './helpers/weight-calculator';
import { ApiHelper } from './helpers/api-helpers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Suite: Southwest Cargo Airport Pickup Checkout Flow
 *
 * Tests the complete e-commerce flow for ordering 5,000 UV-coated club flyers
 * with Southwest Cargo airport pickup at Hartsfield-Jackson Atlanta International Airport
 */

test.describe('Southwest Cargo Airport Pickup Flow', () => {
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
    await page.screenshot({ path: `test-results/screenshots/southwest-start-${Date.now()}.png`, fullPage: true });
  });

  test('Complete Southwest Cargo airport pickup with weight validation', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    // Step 1: Navigate to products page
    await test.step('Navigate to products', async () => {
      await homePage.goto();
      await page.screenshot({ path: `test-results/screenshots/southwest-01-homepage.png`, fullPage: true });

      await homePage.navigateToProducts();
      await page.waitForURL(/\/products/);
      await page.screenshot({ path: `test-results/screenshots/southwest-02-products.png`, fullPage: true });
    });

    // Step 2: Select first product (UV Coated Club Flyers)
    await test.step('Select product', async () => {
      const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
      await firstProduct.click();
      await page.waitForURL(/\/products\/.+/);
      await page.screenshot({ path: `test-results/screenshots/southwest-03-product-detail.png`, fullPage: true });
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

      await page.screenshot({ path: `test-results/screenshots/southwest-04-configured.png`, fullPage: true });
    });

    // Step 4: Upload images (front and back)
    await test.step('Upload images', async () => {
      await productPage.uploadImages(frontImagePath, backImagePath);

      // Wait for upload completion
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `test-results/screenshots/southwest-05-images-uploaded.png`, fullPage: true });
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
      await page.screenshot({ path: `test-results/screenshots/southwest-06-added-to-cart.png`, fullPage: true });
    });

    // Step 6: Go to cart and proceed to checkout
    await test.step('Proceed to checkout', async () => {
      await cartPage.goto();
      await page.screenshot({ path: `test-results/screenshots/southwest-07-cart.png`, fullPage: true });

      // Verify cart contents
      await expect(cartPage.cartItems).toHaveCount(1);

      await cartPage.proceedToCheckout();
      await page.waitForURL(/\/checkout/);
      await page.screenshot({ path: `test-results/screenshots/southwest-08-checkout-start.png`, fullPage: true });
    });

    // Step 7: Fill shipping address (for reference/delivery)
    await test.step('Fill shipping address', async () => {
      await checkoutPage.fillShippingAddress(SOUTHWEST_CARGO_SHIPPING.address);
      await page.screenshot({ path: `test-results/screenshots/southwest-09-shipping-address.png`, fullPage: true });

      await checkoutPage.continueToAirport();
      await page.waitForTimeout(1000);
    });

    // Step 8: Select Hartsfield-Jackson Atlanta Airport (ATL)
    await test.step('Select Atlanta airport (ATL)', async () => {
      // Wait for airports to load
      await page.waitForSelector('[data-testid="airport-card"], .airport-card', { timeout: 10000 });
      await page.screenshot({ path: `test-results/screenshots/southwest-10-airports.png`, fullPage: true });

      // Find and select ATL (Hartsfield-Jackson)
      const atlAirport = page.locator('[data-testid="airport-card"], .airport-card')
        .filter({ hasText: /ATL|hartsfield|atlanta/i })
        .first();

      await expect(atlAirport).toBeVisible();

      // Verify airport details
      const airportText = await atlAirport.textContent();
      console.log('Selected Airport:', airportText);

      expect(airportText).toMatch(/ATL|Hartsfield/i);
      expect(airportText).toMatch(/Atlanta/i);

      await atlAirport.click();
      await page.waitForTimeout(500);

      await checkoutPage.continueToShipping();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/screenshots/southwest-11-airport-selected.png`, fullPage: true });
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

    // Step 10: Select Southwest Cargo shipping
    let shippingCost: number = 0;
    await test.step('Select Southwest Cargo shipping', async () => {
      // Wait for shipping rates to load
      await page.waitForSelector('[data-testid="shipping-method"], .shipping-method', { timeout: 15000 });
      await page.screenshot({ path: `test-results/screenshots/southwest-12-shipping-methods.png`, fullPage: true });

      // Find and select Southwest Cargo
      const southwestCard = page.locator('[data-testid="shipping-method"], .shipping-method')
        .filter({ hasText: /southwest.*cargo/i })
        .first();

      await expect(southwestCard).toBeVisible();

      // Extract shipping cost
      const costText = await southwestCard.locator('text=/\\$[0-9,.]+/').textContent();
      shippingCost = parseFloat(costText?.replace(/[^0-9.]/g, '') || '0');
      console.log(`Southwest Cargo shipping cost: $${shippingCost}`);

      await southwestCard.click();
      await page.waitForTimeout(500);

      await checkoutPage.continueToPayment();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/screenshots/southwest-13-payment-step.png`, fullPage: true });
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

    // Step 12: Test all payment methods
    await test.step('Test payment methods', async () => {
      // Test Square Card
      await checkoutPage.selectSquareCard();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `test-results/screenshots/southwest-14-payment-square.png`, fullPage: true });

      // Test Cash App
      if (await checkoutPage.cashAppTab.isVisible().catch(() => false)) {
        await checkoutPage.selectCashApp();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `test-results/screenshots/southwest-15-payment-cashapp.png`, fullPage: true });
      }

      // Test PayPal
      if (await checkoutPage.paypalTab.isVisible().catch(() => false)) {
        await checkoutPage.selectPayPal();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `test-results/screenshots/southwest-16-payment-paypal.png`, fullPage: true });
      }

      console.log('⚠️  Payment methods require actual credentials and test mode');
      console.log('    Verified UI for all payment options');
    });

    console.log('✅ Southwest Cargo airport pickup flow test completed successfully');
  });

  test('API: Verify Southwest Cargo airport lookup and shipping calculation', async ({ request }) => {
    test.setTimeout(60000);

    await test.step('Get Georgia airports from API', async () => {
      const airports = await apiHelper.getAirportsByState('GA');

      console.log(`Found ${airports.length} Southwest Cargo airports in Georgia:`);
      airports.forEach(airport => {
        console.log(`  ${airport.code} - ${airport.name} (${airport.city})`);
      });

      // Verify ATL is in the list
      const atlAirport = airports.find(a => a.code === 'ATL' || a.name.includes('Hartsfield'));

      expect(atlAirport).toBeDefined();
      expect(atlAirport!.code).toBe('ATL');
      expect(atlAirport!.city).toMatch(/atlanta/i);

      console.log('✅ ATL airport found:', atlAirport);

      // Get ATL details
      console.log('ATL Airport Details:');
      console.log(`  Name: ${atlAirport!.name}`);
      console.log(`  Address: ${atlAirport!.address}, ${atlAirport!.city}, ${atlAirport!.state} ${atlAirport!.zip}`);
      console.log(`  Hours:`, atlAirport!.hours);
    });

    await test.step('Calculate Southwest Cargo shipping via API', async () => {
      const weight = WeightCalculator.calculate9ptCardStock(
        TEST_PRODUCT.width,
        TEST_PRODUCT.height,
        TEST_PRODUCT.quantity
      );

      // Get ATL airport ID first
      const airports = await apiHelper.getAirportsByState('GA');
      const atlAirport = airports.find(a => a.code === 'ATL');

      const shippingRequest = {
        toAddress: SOUTHWEST_CARGO_SHIPPING.address,
        items: [
          {
            quantity: TEST_PRODUCT.quantity,
            weightLbs: weight.combinedWeight
          }
        ],
        selectedAirportId: atlAirport!.id
      };

      const rates = await apiHelper.calculateShipping(shippingRequest);

      console.log('Shipping Rates from API:');
      rates.forEach(rate => {
        console.log(`  ${rate.carrier} ${rate.service}: $${rate.cost} (${rate.estimatedDays || 'N/A'} days)`);
      });

      // Verify Southwest Cargo is available
      const southwestRate = rates.find(r =>
        r.carrier.toLowerCase().includes('southwest') ||
        r.service.toLowerCase().includes('cargo')
      );

      expect(southwestRate).toBeDefined();
      expect(southwestRate!.cost).toBeGreaterThan(0);

      console.log(`✅ Southwest Cargo rate: $${southwestRate!.cost}`);
    });
  });
});
