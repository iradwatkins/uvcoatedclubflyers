import { Page, Locator } from '@playwright/test';

/**
 * Page Object Models for UV Coated Club Flyers application
 */

export class HomePage {
  readonly page: Page;
  readonly productsLink: Locator;
  readonly shopNowButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use header navigation link specifically to avoid strict mode violation
    this.productsLink = page.getByRole('banner').getByRole('link', { name: /products/i });
    this.shopNowButton = page.getByRole('button', { name: /shop now/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async navigateToProducts() {
    await this.productsLink.first().click();
  }
}

export class ProductPage {
  readonly page: Page;
  readonly quantitySelect: Locator;
  readonly sizeSelect: Locator;
  readonly materialSelect: Locator;
  readonly sidesSelect: Locator;
  readonly coatingSelect: Locator;
  readonly turnaroundSelect: Locator;
  readonly fileUploadInput: Locator;
  readonly addToCartButton: Locator;
  readonly priceDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.quantitySelect = page.locator('select[name="quantity"]');
    this.sizeSelect = page.locator('select').filter({ hasText: /size/i }).first();
    this.materialSelect = page.locator('select').filter({ hasText: /material|stock/i }).first();
    this.sidesSelect = page.locator('select').filter({ hasText: /sides/i }).first();
    this.coatingSelect = page.locator('select').filter({ hasText: /coating/i }).first();
    this.turnaroundSelect = page.locator('button').filter({ hasText: /turnaround|express|standard/i }).first();
    this.fileUploadInput = page.locator('input[type="file"]');
    this.addToCartButton = page.getByRole('button', { name: /add to cart/i });
    this.priceDisplay = page.locator('[data-testid="price"], .price, text=/\\$[0-9,]+/');
  }

  async goto(productId?: string) {
    if (productId) {
      await this.page.goto(`/products/${productId}`);
    } else {
      await this.page.goto('/products');
    }
  }

  async selectQuantity(quantity: number) {
    await this.quantitySelect.selectOption(quantity.toString());
  }

  async uploadImages(frontPath: string, backPath: string) {
    // Multi-file upload
    await this.fileUploadInput.setInputFiles([frontPath, backPath]);
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async waitForPriceUpdate() {
    await this.page.waitForTimeout(500); // Wait for price recalculation
  }
}

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly subtotalDisplay: Locator;
  readonly removeItemButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('[data-testid="cart-item"], .cart-item');
    this.checkoutButton = page.getByRole('button', { name: /checkout|proceed/i });
    this.subtotalDisplay = page.locator('[data-testid="subtotal"], text=/subtotal/i');
    this.removeItemButton = page.getByRole('button', { name: /remove/i });
  }

  async goto() {
    await this.page.goto('/cart');
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}

export class CheckoutPage {
  readonly page: Page;

  // Step 1: Shipping Address
  readonly fullNameInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateSelect: Locator;
  readonly zipCodeInput: Locator;
  readonly countrySelect: Locator;
  readonly isResidentialCheckbox: Locator;
  readonly continueToAirportButton: Locator;

  // Step 2: Airport Selection
  readonly airportCards: Locator;
  readonly skipAirportButton: Locator;
  readonly continueToShippingButton: Locator;

  // Step 3: Shipping Method
  readonly shippingMethodCards: Locator;
  readonly continueToPaymentButton: Locator;

  // Step 4: Payment
  readonly squareCardTab: Locator;
  readonly cashAppTab: Locator;
  readonly paypalTab: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvvInput: Locator;
  readonly zipInput: Locator;
  readonly placeOrderButton: Locator;

  // Order Summary
  readonly orderNumber: Locator;
  readonly subtotal: Locator;
  readonly shipping: Locator;
  readonly tax: Locator;
  readonly total: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1 fields
    this.fullNameInput = page.locator('input[name="fullName"], input[placeholder*="name" i]');
    this.streetInput = page.locator('input[name="street"], input[placeholder*="address" i]');
    this.cityInput = page.locator('input[name="city"], input[placeholder*="city" i]');
    this.stateSelect = page.locator('select[name="state"]');
    this.zipCodeInput = page.locator('input[name="zipCode"], input[name="zip"]');
    this.countrySelect = page.locator('select[name="country"]');
    this.isResidentialCheckbox = page.locator('input[name="isResidential"], input[type="checkbox"]');
    this.continueToAirportButton = page.getByRole('button', { name: /continue/i }).first();

    // Step 2 fields
    this.airportCards = page.locator('[data-testid="airport-card"], .airport-card');
    this.skipAirportButton = page.getByRole('button', { name: /skip/i });
    this.continueToShippingButton = page.getByRole('button', { name: /continue/i });

    // Step 3 fields
    this.shippingMethodCards = page.locator('[data-testid="shipping-method"], .shipping-method');
    this.continueToPaymentButton = page.getByRole('button', { name: /continue to payment/i });

    // Step 4 fields
    this.squareCardTab = page.getByRole('tab', { name: /card|credit/i });
    this.cashAppTab = page.getByRole('tab', { name: /cash app/i });
    this.paypalTab = page.getByRole('tab', { name: /paypal/i });
    this.cardNumberInput = page.frameLocator('iframe[name*="card"]').locator('input[name="cardNumber"]');
    this.expiryInput = page.frameLocator('iframe[name*="card"]').locator('input[name="expiry"]');
    this.cvvInput = page.frameLocator('iframe[name*="card"]').locator('input[name="cvv"]');
    this.zipInput = page.frameLocator('iframe[name*="card"]').locator('input[name="zip"]');
    this.placeOrderButton = page.getByRole('button', { name: /place order|pay now/i });

    // Order summary
    this.orderNumber = page.locator('[data-testid="order-number"], text=/UVC-/');
    this.subtotal = page.locator('[data-testid="subtotal"]');
    this.shipping = page.locator('[data-testid="shipping"]');
    this.tax = page.locator('[data-testid="tax"]');
    this.total = page.locator('[data-testid="total"]');
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  async fillShippingAddress(address: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    isResidential?: boolean;
  }) {
    await this.fullNameInput.fill(address.fullName);
    await this.streetInput.fill(address.street);
    await this.cityInput.fill(address.city);
    await this.stateSelect.selectOption(address.state);
    await this.zipCodeInput.fill(address.zipCode);

    if (address.country) {
      await this.countrySelect.selectOption(address.country);
    }

    if (address.isResidential !== undefined) {
      if (address.isResidential) {
        await this.isResidentialCheckbox.check();
      } else {
        await this.isResidentialCheckbox.uncheck();
      }
    }
  }

  async continueToAirport() {
    await this.continueToAirportButton.click();
  }

  async selectAirport(airportCode: string) {
    await this.airportCards.filter({ hasText: airportCode }).click();
  }

  async skipAirport() {
    await this.skipAirportButton.click();
  }

  async continueToShipping() {
    await this.continueToShippingButton.click();
  }

  async selectShippingMethod(methodName: string) {
    await this.shippingMethodCards.filter({ hasText: methodName }).click();
  }

  async continueToPayment() {
    await this.continueToPaymentButton.click();
  }

  async selectSquareCard() {
    await this.squareCardTab.click();
  }

  async selectCashApp() {
    await this.cashAppTab.click();
  }

  async selectPayPal() {
    await this.paypalTab.click();
  }

  async fillCardDetails(card: { number: string; expiry: string; cvv: string; zip: string }) {
    // Wait for Square SDK to load
    await this.page.waitForTimeout(2000);

    // Fill card details in Square iframe
    await this.cardNumberInput.fill(card.number);
    await this.expiryInput.fill(card.expiry);
    await this.cvvInput.fill(card.cvv);
    await this.zipInput.fill(card.zip);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }

  async getOrderNumber(): Promise<string> {
    const text = await this.orderNumber.textContent();
    return text || '';
  }

  async getTotal(): Promise<number> {
    const text = await this.total.textContent();
    const amount = text?.replace(/[^0-9.]/g, '');
    return parseFloat(amount || '0');
  }
}

export class OrderConfirmationPage {
  readonly page: Page;
  readonly successMessage: Locator;
  readonly orderNumber: Locator;
  readonly orderDetails: Locator;

  constructor(page: Page) {
    this.page = page;
    this.successMessage = page.locator('text=/success|confirmed|thank you/i');
    this.orderNumber = page.locator('[data-testid="order-number"], text=/UVC-/');
    this.orderDetails = page.locator('[data-testid="order-details"], .order-details');
  }

  async waitForSuccess() {
    await this.successMessage.waitFor({ state: 'visible', timeout: 30000 });
  }
}
