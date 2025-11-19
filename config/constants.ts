/**
 * Application Constants
 * Central configuration for Square integration and pricing
 */

// Square API Configuration
export const SQUARE_CONFIG = {
  API_VERSION: '2024-01-18',
  WEBHOOK_SIGNATURE_ALGORITHM: 'sha256',
} as const;

// Pricing Configuration
export const PRICING = {
  // Default tax rate (8.25% for Georgia)
  SQUARE_TAX_RATE: 0.0825,

  // Minimum order amount in cents
  MIN_ORDER_AMOUNT: 100,

  // Free shipping threshold in cents
  FREE_SHIPPING_THRESHOLD: 10000,

  // Default markup multiplier
  DEFAULT_MARKUP: 2.0,
} as const;

// Shipping Configuration
export const SHIPPING = {
  // Shipping methods
  METHODS: {
    STANDARD: 'standard',
    EXPRESS: 'express',
    OVERNIGHT: 'overnight',
  },

  // Default shipping rates in cents
  RATES: {
    STANDARD: 999,
    EXPRESS: 1999,
    OVERNIGHT: 3999,
  },
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Production Status
export const PRODUCTION_STATUS = {
  PENDING: 'pending',
  IN_PRODUCTION: 'in_production',
  QUALITY_CHECK: 'quality_check',
  READY_TO_SHIP: 'ready_to_ship',
  SHIPPED: 'shipped',
} as const;
