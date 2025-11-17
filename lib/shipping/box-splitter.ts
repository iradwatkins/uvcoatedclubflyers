import type { ShippingPackage } from './interfaces'

/**
 * Standard box dimensions for all shipments
 * Using 12x12x12 box (common for printing materials)
 */
export const STANDARD_BOX_DIMENSIONS = {
  width: 12, // inches
  height: 12, // inches
  length: 12, // inches (depth)
}

/**
 * Maximum weight per box (FedEx/UPS limit for standard shipping)
 */
export const MAX_BOX_WEIGHT = 36 // pounds

/**
 * Packaging weight (box, bubble wrap, etc.)
 */
export const PACKAGING_WEIGHT = 0.5 // pounds per box

/**
 * Split total weight into multiple boxes if needed
 * Each box will have standard dimensions and max 36 lbs
 *
 * @param totalProductWeight - Total weight of all products (lbs)
 * @param declaredValue - Optional declared value for insurance
 * @returns Array of ShippingPackage objects
 */
export function splitIntoBoxes(
  totalProductWeight: number,
  declaredValue?: number
): ShippingPackage[] {
  const packages: ShippingPackage[] = []

  // If total weight (including packaging) fits in one box
  if (totalProductWeight + PACKAGING_WEIGHT <= MAX_BOX_WEIGHT) {
    return [
      {
        weight: totalProductWeight + PACKAGING_WEIGHT,
        dimensions: STANDARD_BOX_DIMENSIONS,
        value: declaredValue,
      },
    ]
  }

  // Calculate how many boxes we need
  // Each box can hold MAX_BOX_WEIGHT - PACKAGING_WEIGHT of product
  const maxProductPerBox = MAX_BOX_WEIGHT - PACKAGING_WEIGHT
  const numBoxes = Math.ceil(totalProductWeight / maxProductPerBox)

  // Distribute weight evenly across boxes (avoids one super light box at the end)
  const weightPerBox = totalProductWeight / numBoxes

  // Create the boxes
  for (let i = 0; i < numBoxes; i++) {
    const isLastBox = i === numBoxes - 1
    const boxProductWeight = isLastBox
      ? totalProductWeight - weightPerBox * (numBoxes - 1) // Remaining weight
      : weightPerBox

    packages.push({
      weight: boxProductWeight + PACKAGING_WEIGHT,
      dimensions: STANDARD_BOX_DIMENSIONS,
      value: declaredValue ? declaredValue / numBoxes : undefined, // Split value across boxes
    })
  }

  return packages
}

/**
 * Format box split info for logging/display
 */
export function getBoxSplitSummary(packages: ShippingPackage[]): string {
  if (packages.length === 1) {
    return `1 box (${packages[0].weight.toFixed(2)} lbs)`
  }

  const boxWeights = packages.map((p) => `${p.weight.toFixed(2)} lbs`).join(', ')
  return `${packages.length} boxes (${boxWeights})`
}
