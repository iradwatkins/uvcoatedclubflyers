/**
 * Weight calculation utilities for shipping tests
 * Formula: paperWeight × width (inches) × height (inches) × quantity = weight (lbs)
 */

export interface WeightCalculationResult {
  totalWeight: number;
  packagingWeight: number;
  combinedWeight: number;
  numberOfBoxes: number;
  weightPerBox: number[];
  formula: string;
}

export class WeightCalculator {
  private static readonly PACKAGING_WEIGHT = 0.5; // lbs per box
  private static readonly MAX_BOX_WEIGHT = 36; // lbs

  /**
   * Calculate total weight for a print job
   */
  static calculateWeight(
    paperWeight: number,
    width: number,
    height: number,
    quantity: number
  ): WeightCalculationResult {
    // Core calculation: paperWeight × width × height × quantity
    const totalWeight = paperWeight * width * height * quantity;

    // Determine number of boxes needed
    const numberOfBoxes = Math.ceil(totalWeight / this.MAX_BOX_WEIGHT);

    // Add packaging weight
    const packagingWeight = numberOfBoxes * this.PACKAGING_WEIGHT;
    const combinedWeight = totalWeight + packagingWeight;

    // Calculate weight per box
    const weightPerBox: number[] = [];
    let remainingWeight = totalWeight;

    for (let i = 0; i < numberOfBoxes; i++) {
      const boxWeight = Math.min(remainingWeight, this.MAX_BOX_WEIGHT);
      weightPerBox.push(boxWeight + this.PACKAGING_WEIGHT);
      remainingWeight -= boxWeight;
    }

    const formula = `${paperWeight} × ${width}" × ${height}" × ${quantity} = ${totalWeight.toFixed(2)} lbs`;

    return {
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      packagingWeight: parseFloat(packagingWeight.toFixed(2)),
      combinedWeight: parseFloat(combinedWeight.toFixed(2)),
      numberOfBoxes,
      weightPerBox: weightPerBox.map(w => parseFloat(w.toFixed(2))),
      formula
    };
  }

  /**
   * Calculate weight for 9pt card stock (standard)
   * Paper weight: 0.000333333333 lbs/sq in (matches production /lib/paper-stocks/weights.ts)
   */
  static calculate9ptCardStock(width: number, height: number, quantity: number): WeightCalculationResult {
    return this.calculateWeight(0.000333333333, width, height, quantity);
  }

  /**
   * Validate weight calculation matches API response
   */
  static validateApiWeight(
    expected: WeightCalculationResult,
    apiWeight: number,
    tolerance: number = 0.5
  ): boolean {
    const difference = Math.abs(expected.combinedWeight - apiWeight);
    return difference <= tolerance;
  }
}

/**
 * Test helper for weight assertions
 */
export function assertWeightCalculation(
  paperWeight: number,
  width: number,
  height: number,
  quantity: number,
  expected: Partial<WeightCalculationResult>
) {
  const result = WeightCalculator.calculateWeight(paperWeight, width, height, quantity);

  if (expected.totalWeight !== undefined && result.totalWeight !== expected.totalWeight) {
    throw new Error(
      `Weight mismatch: expected ${expected.totalWeight} lbs, got ${result.totalWeight} lbs. Formula: ${result.formula}`
    );
  }

  if (expected.numberOfBoxes !== undefined && result.numberOfBoxes !== expected.numberOfBoxes) {
    throw new Error(
      `Box count mismatch: expected ${expected.numberOfBoxes} boxes, got ${result.numberOfBoxes} boxes`
    );
  }

  return result;
}
