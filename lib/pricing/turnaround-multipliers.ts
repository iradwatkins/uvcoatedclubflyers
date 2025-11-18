/**
 * Turnaround Multipliers by Paper Stock and Quantity
 * These multipliers are applied during base cost calculation
 * Based on printing-website-seed-document.md
 */

export type TurnaroundCategory = 'economy' | 'fast' | 'faster' | 'crazyFast';

export interface TurnaroundMultipliers {
  [quantity: string]: {
    economy: number;
    fast: number;
    faster: number;
    crazyFast: number;
  };
}

export interface PaperStockMultipliers {
  [paperStockId: string]: TurnaroundMultipliers;
}

/**
 * Turnaround multipliers for all paper stocks
 * Note: Data shown is complete for 9pt C2S. Other stocks would have similar structures.
 */
export const TURNAROUND_MULTIPLIERS: PaperStockMultipliers = {
  '9pt-c2s-cardstock': {
    '25': {
      economy: 14.10,
      fast: 16.70,
      faster: 21.80,
      crazyFast: 152.93,
    },
    '50': {
      economy: 8.35,
      fast: 9.39,
      faster: 12.62,
      crazyFast: 93.67,
    },
    '100': {
      economy: 5.22,
      fast: 5.87,
      faster: 8.17,
      crazyFast: 50.45,
    },
    '250': {
      economy: 3.49,
      fast: 3.80,
      faster: 5.32,
      crazyFast: 24.05,
    },
    '500': {
      economy: 2.37,
      fast: 3.64,
      faster: 5.44,
      crazyFast: 15.42,
    },
    '1000': {
      economy: 1.34,
      fast: 1.92,
      faster: 2.84,
      crazyFast: 11.09,
    },
    '2500': {
      economy: 0.89,
      fast: 1.11,
      faster: 1.65,
      crazyFast: 8.45,
    },
    '5000': {
      economy: 0.72,
      fast: 0.84,
      faster: 1.25,
      crazyFast: 7.74,
    },
  },
  // 12pt uses 9pt pricing (same multipliers)
  '12pt-c2s-cardstock': {
    '25': {
      economy: 14.10,
      fast: 16.70,
      faster: 21.80,
      crazyFast: 152.93,
    },
    '50': {
      economy: 8.35,
      fast: 9.39,
      faster: 12.62,
      crazyFast: 93.67,
    },
    '100': {
      economy: 5.22,
      fast: 5.87,
      faster: 8.17,
      crazyFast: 50.45,
    },
    '250': {
      economy: 3.49,
      fast: 3.80,
      faster: 5.32,
      crazyFast: 24.05,
    },
    '500': {
      economy: 2.37,
      fast: 3.64,
      faster: 5.44,
      crazyFast: 15.42,
    },
    '1000': {
      economy: 1.34,
      fast: 1.92,
      faster: 2.84,
      crazyFast: 11.09,
    },
    '2500': {
      economy: 0.89,
      fast: 1.11,
      faster: 1.65,
      crazyFast: 8.45,
    },
    '5000': {
      economy: 0.72,
      fast: 0.84,
      faster: 1.25,
      crazyFast: 7.74,
    },
  },
  // Placeholder multipliers for other stocks (would need actual data)
  '16pt-c2s-cardstock': {
    '25': { economy: 14.10, fast: 16.70, faster: 21.80, crazyFast: 152.93 },
    '50': { economy: 8.35, fast: 9.39, faster: 12.62, crazyFast: 93.67 },
    '100': { economy: 5.22, fast: 5.87, faster: 8.17, crazyFast: 50.45 },
    '250': { economy: 3.49, fast: 3.80, faster: 5.32, crazyFast: 24.05 },
    '500': { economy: 2.37, fast: 3.64, faster: 5.44, crazyFast: 15.42 },
    '1000': { economy: 1.34, fast: 1.92, faster: 2.84, crazyFast: 11.09 },
    '2500': { economy: 0.89, fast: 1.11, faster: 1.65, crazyFast: 8.45 },
    '5000': { economy: 0.72, fast: 0.84, faster: 1.25, crazyFast: 7.74 },
  },
  '14pt-c2s-cardstock': {
    '25': { economy: 14.10, fast: 16.70, faster: 21.80, crazyFast: 152.93 },
    '50': { economy: 8.35, fast: 9.39, faster: 12.62, crazyFast: 93.67 },
    '100': { economy: 5.22, fast: 5.87, faster: 8.17, crazyFast: 50.45 },
    '250': { economy: 3.49, fast: 3.80, faster: 5.32, crazyFast: 24.05 },
    '500': { economy: 2.37, fast: 3.64, faster: 5.44, crazyFast: 15.42 },
    '1000': { economy: 1.34, fast: 1.92, faster: 2.84, crazyFast: 11.09 },
    '2500': { economy: 0.89, fast: 1.11, faster: 1.65, crazyFast: 8.45 },
    '5000': { economy: 0.72, fast: 0.84, faster: 1.25, crazyFast: 7.74 },
  },
  '60lb-offset': {
    '25': { economy: 14.10, fast: 16.70, faster: 21.80, crazyFast: 152.93 },
    '50': { economy: 8.35, fast: 9.39, faster: 12.62, crazyFast: 93.67 },
    '100': { economy: 5.22, fast: 5.87, faster: 8.17, crazyFast: 50.45 },
    '250': { economy: 3.49, fast: 3.80, faster: 5.32, crazyFast: 24.05 },
    '500': { economy: 2.37, fast: 3.64, faster: 5.44, crazyFast: 15.42 },
    '1000': { economy: 1.34, fast: 1.92, faster: 2.84, crazyFast: 11.09 },
    '2500': { economy: 0.89, fast: 1.11, faster: 1.65, crazyFast: 8.45 },
    '5000': { economy: 0.72, fast: 0.84, faster: 1.25, crazyFast: 7.74 },
  },
  '100lb-gloss-text': {
    '25': { economy: 14.10, fast: 16.70, faster: 21.80, crazyFast: 152.93 },
    '50': { economy: 8.35, fast: 9.39, faster: 12.62, crazyFast: 93.67 },
    '100': { economy: 5.22, fast: 5.87, faster: 8.17, crazyFast: 50.45 },
    '250': { economy: 3.49, fast: 3.80, faster: 5.32, crazyFast: 24.05 },
    '500': { economy: 2.37, fast: 3.64, faster: 5.44, crazyFast: 15.42 },
    '1000': { economy: 1.34, fast: 1.92, faster: 2.84, crazyFast: 11.09 },
    '2500': { economy: 0.89, fast: 1.11, faster: 1.65, crazyFast: 8.45 },
    '5000': { economy: 0.72, fast: 0.84, faster: 1.25, crazyFast: 7.74 },
  },
  '100lb-uncoated-cover': {
    '25': { economy: 14.10, fast: 16.70, faster: 21.80, crazyFast: 152.93 },
    '50': { economy: 8.35, fast: 9.39, faster: 12.62, crazyFast: 93.67 },
    '100': { economy: 5.22, fast: 5.87, faster: 8.17, crazyFast: 50.45 },
    '250': { economy: 3.49, fast: 3.80, faster: 5.32, crazyFast: 24.05 },
    '500': { economy: 2.37, fast: 3.64, faster: 5.44, crazyFast: 15.42 },
    '1000': { economy: 1.34, fast: 1.92, faster: 2.84, crazyFast: 11.09 },
    '2500': { economy: 0.89, fast: 1.11, faster: 1.65, crazyFast: 8.45 },
    '5000': { economy: 0.72, fast: 0.84, faster: 1.25, crazyFast: 7.74 },
  },
};

export const AVAILABLE_QUANTITIES = [25, 50, 100, 250, 500, 1000, 2500, 5000];

/**
 * Get the turnaround multiplier for a specific paper stock, quantity, and category
 * Handles quantities > 5000 by using 5000 multiplier
 */
export function getTurnaroundMultiplier(
  paperStockId: string,
  quantity: number,
  category: TurnaroundCategory
): number {
  // For quantities > 5000, use 5000 multiplier
  const lookupQuantity = quantity > 5000 ? 5000 : quantity;

  // Find the closest quantity tier
  const tier = AVAILABLE_QUANTITIES.reduce((prev, curr) =>
    Math.abs(curr - lookupQuantity) < Math.abs(prev - lookupQuantity) ? curr : prev
  );

  const multipliers = TURNAROUND_MULTIPLIERS[paperStockId];
  if (!multipliers) {
    throw new Error(`No turnaround multipliers found for paper stock: ${paperStockId}`);
  }

  const tierMultipliers = multipliers[tier.toString()];
  if (!tierMultipliers) {
    throw new Error(`No multipliers found for quantity tier: ${tier}`);
  }

  return tierMultipliers[category];
}
