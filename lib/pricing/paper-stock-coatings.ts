/**
 * Paper Stock → Coating Mapping
 * Defines which coatings are available for each paper stock
 * Based on user requirements and paper stock specifications
 */

export interface PaperStockCoatingMap {
  paperStockId: number;
  paperStockName: string;
  coatingIds: number[];
  coatingNames: string[];
  doubledSidedMultiplier: number; // 1.0 for cardstock/cover, 1.75 for text
}

/**
 * Complete mapping of paper stocks to their available coatings
 */
export const PAPER_STOCK_COATING_MAP: Record<number, PaperStockCoatingMap> = {
  // 60 lb Offset - Text paper
  3: {
    paperStockId: 3,
    paperStockName: '60 lb Offset',
    coatingIds: [1], // No Coating only
    coatingNames: ['No Coating'],
    doubledSidedMultiplier: 1.75,
  },

  // 9pt C2S Cardstock
  1: {
    paperStockId: 1,
    paperStockName: '9pt C2S Cardstock',
    coatingIds: [2], // Gloss Aqueous only
    coatingNames: ['Gloss Aqueous'],
    doubledSidedMultiplier: 1.0,
  },

  // 100 lb Gloss Text - Text paper
  4: {
    paperStockId: 4,
    paperStockName: '100 lb Gloss Text',
    coatingIds: [2], // Gloss Aqueous only
    coatingNames: ['Gloss Aqueous'],
    doubledSidedMultiplier: 1.75,
  },

  // 12pt C2S Cardstock
  5: {
    paperStockId: 5,
    paperStockName: '12pt C2S Cardstock',
    coatingIds: [3, 4, 5], // Matte Aqueous, UV One Side, UV Both Sides
    coatingNames: ['Matte Aqueous', 'High Gloss UV (One Side)', 'High Gloss UV (Both Sides)'],
    doubledSidedMultiplier: 1.0,
  },

  // 100 lb Uncoated Cover
  6: {
    paperStockId: 6,
    paperStockName: '100 lb Uncoated Cover',
    coatingIds: [1], // No Coating only
    coatingNames: ['No Coating'],
    doubledSidedMultiplier: 1.0,
  },

  // 14pt C2S Cardstock
  7: {
    paperStockId: 7,
    paperStockName: '14pt C2S Cardstock',
    coatingIds: [3, 4, 5], // Matte Aqueous, UV One Side, UV Both Sides
    coatingNames: ['Matte Aqueous', 'High Gloss UV (One Side)', 'High Gloss UV (Both Sides)'],
    doubledSidedMultiplier: 1.0,
  },

  // 16pt C2S Cardstock
  2: {
    paperStockId: 2,
    paperStockName: '16pt C2S Cardstock',
    coatingIds: [3, 4, 5], // Matte Aqueous, UV One Side, UV Both Sides
    coatingNames: ['Matte Aqueous', 'High Gloss UV (One Side)', 'High Gloss UV (Both Sides)'],
    doubledSidedMultiplier: 1.0,
  },
};

/**
 * Get available coating IDs for a paper stock
 */
export function getAvailableCoatingsForPaperStock(paperStockId: number): number[] {
  const mapping = PAPER_STOCK_COATING_MAP[paperStockId];
  return mapping ? mapping.coatingIds : [];
}

/**
 * Check if a coating is valid for a paper stock
 */
export function isCoatingValidForPaperStock(paperStockId: number, coatingId: number): boolean {
  const availableCoatings = getAvailableCoatingsForPaperStock(paperStockId);
  return availableCoatings.includes(coatingId);
}

/**
 * Get the doubled-sided multiplier for a paper stock
 */
export function getDoubleSidedMultiplier(paperStockId: number): number {
  const mapping = PAPER_STOCK_COATING_MAP[paperStockId];
  return mapping ? mapping.doubledSidedMultiplier : 1.0;
}

/**
 * Sides Options for Customer Selection
 */
export const SIDES_OPTIONS = [
  {
    value: 'same-both',
    label: 'Same Image Both Sides',
    pricingValue: 'double', // Maps to pricing engine
  },
  {
    value: 'different-both',
    label: 'Different Image Both Sides',
    pricingValue: 'double', // Maps to pricing engine
  },
  {
    value: 'front-only',
    label: 'Image Front Only',
    pricingValue: 'single', // Maps to pricing engine
  },
] as const;

/**
 * Convert sides selection to pricing engine format
 */
export function sidesOptionToPricing(sidesValue: string): 'single' | 'double' {
  const option = SIDES_OPTIONS.find((opt) => opt.value === sidesValue);
  return option ? (option.pricingValue as 'single' | 'double') : 'double';
}
