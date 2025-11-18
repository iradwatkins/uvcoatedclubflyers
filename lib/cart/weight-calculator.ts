/**
 * Cart Weight Calculator
 *
 * Calculates actual weight from cart items using paper stock specifications
 */

import { calculateWeightFromConfig, getPaperStockSlugFromMaterial } from '../paper-stocks/weights';

export interface CartItem {
  quantity: number;
  options?: Record<string, any>;
  [key: string]: any;
}

interface ProductDimensions {
  width: number;
  height: number;
}

/**
 * Parse size string (e.g., "4x6", "4 x 6", "4" x 6"") into dimensions
 */
function parseSizeString(sizeStr: string): ProductDimensions | null {
  // Remove quotes and extra spaces
  const cleaned = sizeStr.replace(/['"]/g, '').trim().toLowerCase();

  // Try to match patterns like "4x6", "4 x 6", "4×6"
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/);

  if (match) {
    return {
      width: parseFloat(match[1]),
      height: parseFloat(match[2]),
    };
  }

  // Handle special cases
  const specialCases: Record<string, ProductDimensions> = {
    '4x6': { width: 4, height: 6 },
    '5x7': { width: 5, height: 7 },
    '6x9': { width: 6, height: 9 },
    '8.5x11': { width: 8.5, height: 11 },
    '11x17': { width: 11, height: 17 },
  };

  return specialCases[cleaned] || null;
}

/**
 * Extract material name from cart item options
 */
function getMaterialFromOptions(options: Record<string, any> = {}): string {
  // Check common option keys
  const materialKeys = ['material', 'paperStock', 'paper_stock', 'stock', 'cardstock'];

  for (const key of materialKeys) {
    if (options[key]) {
      return String(options[key]);
    }
  }

  // Default to 9pt cardstock if not specified
  return '9pt Card Stock';
}

/**
 * Extract size from cart item options
 */
function getSizeFromOptions(options: Record<string, any> = {}): ProductDimensions | null {
  // Check common option keys
  const sizeKeys = ['size', 'dimensions', 'productSize'];

  for (const key of sizeKeys) {
    if (options[key]) {
      const size = parseSizeString(String(options[key]));
      if (size) return size;
    }
  }

  return null;
}

/**
 * Get default size from product name (e.g., "4x6 Flyers" -> {width: 4, height: 6})
 */
function getSizeFromProductName(productName: string): ProductDimensions | null {
  return parseSizeString(productName);
}

/**
 * Calculate weight for a single cart item
 *
 * @param item - Cart item with quantity and options
 * @param productName - Optional product name for fallback size detection
 * @returns Weight in pounds
 */
export function calculateItemWeight(item: CartItem, productName?: string): number {
  try {
    // Get material
    const material = getMaterialFromOptions(item.options);

    // Get size from options first, then from product name
    let dimensions = getSizeFromOptions(item.options);

    if (!dimensions && productName) {
      dimensions = getSizeFromProductName(productName);
    }

    if (!dimensions) {
      console.warn('Could not determine product size, using default 4x6');
      dimensions = { width: 4, height: 6 };
    }

    // Calculate weight
    const weight = calculateWeightFromConfig({
      material,
      width: dimensions.width,
      height: dimensions.height,
      quantity: item.quantity,
    });

    return weight;
  } catch (error) {
    console.error('Error calculating item weight:', error);
    // Fallback to a reasonable default (4x6 @ 9pt, 100 qty ≈ 0.8 lbs)
    return item.quantity * 0.008;
  }
}

/**
 * Calculate total weight for all items in cart
 *
 * @param items - Array of cart items
 * @returns Total weight in pounds
 */
export function calculateCartWeight(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const itemWeight = calculateItemWeight(item, item.productName);
    return total + itemWeight;
  }, 0);
}

/**
 * Calculate weight with packaging
 *
 * Adds packaging weight based on total weight (approximately 0.5 lbs per 50 lbs of product)
 *
 * @param productWeight - Weight of products in pounds
 * @returns Total weight including packaging
 */
export function calculateWeightWithPackaging(productWeight: number): number {
  const packagingWeight = Math.ceil(productWeight / 50) * 0.5;
  return productWeight + packagingWeight;
}

/**
 * Format weight for display
 *
 * @param weight - Weight in pounds
 * @returns Formatted weight string (e.g., "40.0 lbs")
 */
export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)} lbs`;
}

/**
 * Calculate weight for shipping method selector
 *
 * Returns weight formatted for API calls
 *
 * @param items - Cart items
 * @returns Weight object with product and total weight
 */
export function getShippingWeight(items: CartItem[]): {
  productWeight: number;
  packagingWeight: number;
  totalWeight: number;
  formatted: string;
} {
  const productWeight = calculateCartWeight(items);
  const totalWeight = calculateWeightWithPackaging(productWeight);
  const packagingWeight = totalWeight - productWeight;

  return {
    productWeight: Math.round(productWeight * 100) / 100, // Round to 2 decimals
    packagingWeight: Math.round(packagingWeight * 100) / 100,
    totalWeight: Math.round(totalWeight * 100) / 100,
    formatted: formatWeight(totalWeight),
  };
}
