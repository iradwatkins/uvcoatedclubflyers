/**
 * Test Data Generator
 * Generates unique test data for each test run to avoid conflicts
 */

export interface TestCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface TestAddress {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  residential: boolean;
}

export interface TestProduct {
  quantity: number;
  size: string;
  paperStock: string;
  coating: string;
  turnaround: string;
}

export interface TestAirport {
  state: string;
  airportName: string;
  airportCode: string;
}

/**
 * Generates a unique timestamp-based email
 */
export function generateUniqueEmail(prefix: string): string {
  const timestamp = Date.now();
  return `${prefix}.${timestamp}@uvcoatedtest.com`;
}

/**
 * Get test data for FedEx Ground shipping scenario
 */
export function getFedExTestData(): {
  customer: TestCustomer;
  address: TestAddress;
  product: TestProduct;
} {
  const timestamp = Date.now();

  return {
    customer: {
      name: 'Bill Blast',
      email: 'appvillagellc@gmail.com',
      phone: '(555) 123-4567',
    },
    address: {
      name: 'Bill Blast',
      email: 'appvillagellc@gmail.com',
      phone: '(555) 123-4567',
      address1: '976 Carr Street',
      city: 'Atlanta',
      state: 'GA',
      zip: '30318',
      residential: false,
    },
    product: {
      quantity: 5000,
      size: '4x6',
      paperStock: '9pt C2S Cardstock',
      coating: 'UV Both Sides',
      turnaround: '2-4 Days Standard',
    },
  };
}

/**
 * Get test data for Southwest Cargo airport pickup scenario
 */
export function getSouthwestCargoTestData(): {
  customer: TestCustomer;
  address: TestAddress;
  airport: TestAirport;
  product: TestProduct;
} {
  return {
    customer: {
      name: 'Bill Blast',
      email: 'appvillagellc@gmail.com',
      phone: '(555) 987-6543',
    },
    address: {
      name: 'Bill Blast',
      email: 'appvillagellc@gmail.com',
      phone: '(555) 987-6543',
      address1: '123 Peachtree St',
      city: 'Atlanta',
      state: 'GA',
      zip: '30303',
      residential: false,
    },
    airport: {
      state: 'GA',
      airportName: 'Hartsfield-Jackson Atlanta International',
      airportCode: 'ATL',
    },
    product: {
      quantity: 5000,
      size: '4x6',
      paperStock: '9pt C2S Cardstock',
      coating: 'UV Both Sides',
      turnaround: '2-4 Days Standard',
    },
  };
}

/**
 * Test image file paths
 */
export const TEST_IMAGES = {
  front: 'tests/fixtures/flyer-front.png',
  back: 'tests/fixtures/flyer-back.png',
};

/**
 * Expected weight calculation for 5000 qty, 4x6, 9pt cardstock
 * Formula: 0.000333333333 (paper weight per sq in) × 24 (sq in) × 5000 (qty) = 40 lbs
 */
export const EXPECTED_WEIGHT = {
  total: 40.0,
  min: 39.0,
  max: 41.0,
  boxes: 2, // 36 lb max per box
};

/**
 * Square test card (always succeeds)
 */
export const SQUARE_TEST_CARD = {
  number: '4111 1111 1111 1111',
  cvv: '123',
  expMonth: '12',
  expYear: '2025',
  zip: '30318',
};

/**
 * Expected price range (approximate)
 * Actual price depends on real-time calculations
 */
export const EXPECTED_PRICE_RANGE = {
  min: 3000,
  max: 6000,
};

/**
 * Wait times for various operations (ms)
 */
export const WAIT_TIMES = {
  fileUpload: 5000,
  priceCalculation: 3000,
  shippingCalculation: 5000,
  paymentProcessing: 10000,
  orderCreation: 5000,
  pageLoad: 2000,
};

/**
 * Selectors for common elements
 */
export const SELECTORS = {
  // Product page
  quantitySelect: 'select[name="quantity"]',
  sizeSelect: 'select[name="size"]',
  paperStockSelect: 'select[name="paperStock"]',
  coatingSelect: 'select[name="coating"]',
  turnaroundRadio: 'input[type="radio"][name="turnaround"]',
  fileUploadDropzone: '[data-testid="file-upload-dropzone"]',
  addToCartButton: 'button:has-text("Add to Cart")',

  // Cart page
  checkoutButton: 'button:has-text("Proceed to Checkout")',

  // Checkout page
  shippingAddressForm: 'form[data-testid="shipping-address-form"]',
  addressInput: 'input[name="address1"]',
  cityInput: 'input[name="city"]',
  stateSelect: 'select[name="state"]',
  zipInput: 'input[name="zip"]',
  continueButton: 'button:has-text("Continue")',

  // Airport selection
  airportSelect: 'select[name="airport"]',

  // Shipping method
  shippingMethodRadio: 'input[type="radio"][name="shippingMethod"]',

  // Payment
  paymentForm: 'form[data-testid="payment-form"]',
  cardNumberInput: '#card-number',
  cvvInput: '#cvv',
  expMonthInput: '#exp-month',
  expYearInput: '#exp-year',
  placeOrderButton: 'button:has-text("Place Order")',

  // Success page
  orderConfirmation: '[data-testid="order-confirmation"]',
  orderNumber: '[data-testid="order-number"]',
};

/**
 * Generate test run metadata
 */
export function getTestRunMetadata(scenario: string, runNumber: number) {
  return {
    scenario,
    runNumber,
    timestamp: new Date().toISOString(),
    testId: `${scenario}-run${runNumber}-${Date.now()}`,
  };
}

/**
 * Format currency for assertions
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  return parseFloat(currencyString.replace(/[$,]/g, ''));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate order number format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  // Expected format: ORD-YYYYMMDD-XXXXX
  const orderRegex = /^ORD-\d{8}-\d{5}$/;
  return orderRegex.test(orderNumber);
}
