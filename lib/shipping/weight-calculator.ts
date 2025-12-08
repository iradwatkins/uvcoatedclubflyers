/**
 * Weight calculation parameters
 */
interface WeightCalculationParams {
  paperStockWeight: number
  width: number
  height: number
  quantity: number
}

/**
 * Calculate the weight of printed materials in pounds
 * Formula: Paper Stock Weight × Size (sq inches) × Quantity = Weight (lbs)
 */
export function calculateWeight(params: WeightCalculationParams): number {
  const { paperStockWeight, width, height, quantity } = params

  // Calculate area in square inches
  const areaInSquareInches = width * height

  // Calculate total weight
  // paperStockWeight is already in units per square inch
  const totalWeight = paperStockWeight * areaInSquareInches * quantity

  // Convert to pounds if needed (assuming paperStockWeight is already in pounds per sq inch)
  return totalWeight
}

/**
 * Calculate weight for multiple items
 */
export function calculateTotalWeight(items: WeightCalculationParams[]): number {
  return items.reduce((total, item) => total + calculateWeight(item), 0)
}

/**
 * Add packaging weight to the calculated weight
 */
export function calculatePackageWeight(
  itemWeight: number,
  packagingWeight: number = 0.5 // default 0.5 lbs for packaging
): number {
  return itemWeight + packagingWeight
}

/**
 * Round weight to specified decimal places (shipping carriers typically use 1 decimal)
 */
export function roundWeight(weight: number, decimals: number = 1): number {
  return Math.round(weight * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Ensure minimum weight (most carriers have a minimum billable weight)
 */
export function ensureMinimumWeight(weight: number, minimum: number = 1.0): number {
  return Math.max(weight, minimum)
}

/**
 * Calculate dimensional weight (for carriers that use it)
 */
export function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number,
  divisor: number = 139 // Standard divisor for domestic shipments
): number {
  return (length * width * height) / divisor
}

/**
 * Get billable weight (greater of actual or dimensional weight)
 */
export function getBillableWeight(
  actualWeight: number,
  length?: number,
  width?: number,
  height?: number,
  useDimensionalWeight: boolean = true
): number {
  if (!useDimensionalWeight || !length || !width || !height) {
    return actualWeight
  }

  const dimWeight = calculateDimensionalWeight(length, width, height)
  return Math.max(actualWeight, dimWeight)
}
