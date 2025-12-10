/**
 * Test data and constants for UV Coated Club Flyers testing
 */

export const TEST_PRODUCT = {
  name: 'UV Coated Club Flyers',
  quantity: 5000,
  size: '4x6',
  paperStock: '9pt card stock',
  coating: 'UV coating',
  sides: 'Both sides',

  // Weight calculation: paperWeight × width × height × quantity
  paperWeight: 0.009, // lbs per square inch
  width: 4, // inches
  height: 6, // inches

  get calculatedWeight() {
    return this.paperWeight * this.width * this.height * this.quantity;
  },

  // Box splitting (max 36 lbs per box)
  maxBoxWeight: 36,

  get numberOfBoxes() {
    return Math.ceil(this.calculatedWeight / this.maxBoxWeight);
  }
};

export const FEDEX_SHIPPING = {
  name: 'FedEx Ground',
  address: {
    fullName: 'John Doe',
    street: '976 Carr Street',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30318',
    country: 'US',
    isResidential: false
  }
};

export const SOUTHWEST_CARGO_SHIPPING = {
  name: 'Southwest Cargo',
  address: {
    fullName: 'Jane Smith',
    street: '6000 North Terminal Parkway',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30320',
    country: 'US',
    isResidential: false
  },
  airport: {
    code: 'ATL',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    state: 'Georgia'
  }
};

export const TEST_IMAGES = {
  folder: '/Users/irawatkins/Desktop/images for testing',
  frontSide: '', // Will be populated during test
  backSide: ''   // Will be populated during test
};

export const TEST_CUSTOMER = {
  email: 'test@uvcoatedflyers.com',
  phone: '555-123-4567'
};

export const PAYMENT_METHODS = {
  square: {
    name: 'Square Card',
    testCard: {
      number: '4111 1111 1111 1111',
      expiry: '12/25',
      cvv: '123',
      zip: '30318'
    }
  },
  cashApp: {
    name: 'Cash App Pay'
  },
  paypal: {
    name: 'PayPal',
    testAccount: {
      email: 'sb-test@personal.example.com',
      password: 'testpassword'
    }
  }
};

export const API_ENDPOINTS = {
  cart: '/api/cart',
  cartAdd: '/api/cart/add',
  cartUpdate: '/api/cart/update',
  cartRemove: '/api/cart/remove',
  cartClear: '/api/cart/clear',

  ordersCreate: '/api/orders/create',
  ordersGet: (id: string) => `/api/orders/${id}`,

  shippingCalculate: '/api/shipping/calculate',
  shippingAirports: '/api/shipping/airports',

  squarePayment: '/api/checkout/process-square-payment',
  paypalCreate: '/api/checkout/create-paypal-order',
  paypalCapture: '/api/checkout/capture-paypal-order',

  upload: '/api/upload',
  health: '/api/health'
};

export const EXPECTED_CHECKOUT_STEPS = [
  'Shipping Address',
  'Airport Selection',
  'Shipping Method',
  'Payment'
];

export const TAX_RATE = 0.0875; // 8.75%

export const WAREHOUSE_ADDRESS = {
  street: '251 Little Falls Dr',
  city: 'Wilmington',
  state: 'DE',
  zipCode: '19808',
  country: 'US'
};
