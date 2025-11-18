/**
 * Paper Stock Data - Complete specifications for all 7 paper stocks
 * Based on printing-website-seed-document.md
 */

export type PaperStockType = 'TEXT' | 'CARDSTOCK' | 'COVER';
export type SidesType = '4/0' | '4/4';

export interface PaperStock {
  id: string;
  name: string;
  type: PaperStockType;
  baseCostPerSqIn: number;
  weightPerSqIn: number;
  thickness: string;
  description: string;
  coatings: string[];
  sidesMultiplier: {
    '4/0': number;
    '4/4': number;
  };
  pricingGroup?: string; // References another paper stock for pricing
  specialMarkup?: number; // e.g., 2.0 for 100% markup
  sortOrder: number;
}

export const PAPER_STOCKS: Record<string, PaperStock> = {
  '60lb-offset': {
    id: '60lb-offset',
    name: '60 lb Offset',
    type: 'TEXT',
    baseCostPerSqIn: 0.0008,
    weightPerSqIn: 0.000133333333,
    thickness: 'Text weight',
    description: 'Standard text weight paper - ideal for flyers and everyday printing',
    coatings: ['no-coating'],
    sidesMultiplier: {
      '4/0': 1.0,
      '4/4': 1.75,
    },
    sortOrder: 5,
  },

  '9pt-c2s-cardstock': {
    id: '9pt-c2s-cardstock',
    name: '9pt C2S Cardstock',
    type: 'CARDSTOCK',
    baseCostPerSqIn: 0.0010,
    weightPerSqIn: 0.000333333333,
    thickness: '9pt',
    description: 'Economical option for postcards and mailers',
    coatings: ['gloss-aqueous'],
    sidesMultiplier: {
      '4/0': 1.0,
      '4/4': 1.0,
    },
    sortOrder: 1,
  },

  '100lb-gloss-text': {
    id: '100lb-gloss-text',
    name: '100 lb Gloss Text',
    type: 'TEXT',
    baseCostPerSqIn: 0.0010,
    weightPerSqIn: 0.000225,
    thickness: 'Text weight (heavy)',
    description: 'Glossy text paper - great for brochures and full-color documents',
    coatings: ['gloss-aqueous'],
    sidesMultiplier: {
      '4/0': 1.0,
      '4/4': 1.75,
    },
    sortOrder: 6,
  },

  '12pt-c2s-cardstock': {
    id: '12pt-c2s-cardstock',
    name: '12pt C2S Cardstock',
    type: 'CARDSTOCK',
    baseCostPerSqIn: 0.0012,
    weightPerSqIn: 0.00035,
    thickness: '12pt',
    description: 'Standard postcard stock - good balance of quality and affordability',
    coatings: ['matte-aqueous', 'uv-one-side', 'uv-both-sides'],
    sidesMultiplier: {
      '4/0': 1.0,
      '4/4': 1.0,
    },
    pricingGroup: '9pt-c2s-cardstock', // Uses 9pt pricing
    specialMarkup: 2.0, // 100% markup
    sortOrder: 2,
  },

  '100lb-uncoated-cover': {
    id: '100lb-uncoated-cover',
    name: '100 lb Uncoated Cover',
    type: 'COVER',
    baseCostPerSqIn: 0.0013,
    weightPerSqIn: 0.000383333333,
    thickness: 'Cover weight (~14pt)',
    description: 'Thick uncoated cover stock - perfect for natural finish products',
    coatings: ['no-coating'],
    sidesMultiplier: {
      '4/0': 1.0,
      '4/4': 1.0,
    },
    sortOrder: 7,
  },

  '14pt-c2s-cardstock': {
    id: '14pt-c2s-cardstock',
    name: '14pt C2S Cardstock',
    type: 'CARDSTOCK',
    baseCostPerSqIn: 0.0013,
    weightPerSqIn: 0.000415,
    thickness: '14pt',
    description: 'Premium thick cardstock - popular for business cards and postcards',
    coatings: ['matte-aqueous', 'uv-one-side', 'uv-both-sides'],
    sidesMultiplier: {
      '4/0': 1.0,
      '4/4': 1.0,
    },
    pricingGroup: '16pt-c2s-cardstock', // Uses 16pt pricing
    specialMarkup: 2.0, // 100% markup
    sortOrder: 3,
  },

  '16pt-c2s-cardstock': {
    id: '16pt-c2s-cardstock',
    name: '16pt C2S Cardstock',
    type: 'CARDSTOCK',
    baseCostPerSqIn: 0.0015,
    weightPerSqIn: 0.000415,
    thickness: '16pt',
    description: 'Extra thick premium cardstock - luxury feel for high-end products',
    coatings: ['matte-aqueous', 'uv-one-side', 'uv-both-sides'],
    sidesMultiplier: {
      '4/0': 1.0,
      '4/4': 1.0,
    },
    sortOrder: 4,
  },
};

export const COATINGS = {
  'no-coating': {
    id: 'no-coating',
    name: 'No Coating',
    description: 'Uncoated - natural paper finish, writable surface',
  },
  'gloss-aqueous': {
    id: 'gloss-aqueous',
    name: 'Gloss Aqueous',
    description: 'Standard glossy coating - protects and adds shine',
  },
  'matte-aqueous': {
    id: 'matte-aqueous',
    name: 'Matte Aqueous',
    description: 'Non-reflective matte finish - elegant appearance',
  },
  'uv-one-side': {
    id: 'uv-one-side',
    name: 'High Gloss UV (One Side)',
    description: 'Premium UV coating on front only - maximum shine and protection',
  },
  'uv-both-sides': {
    id: 'uv-both-sides',
    name: 'High Gloss UV (Both Sides)',
    description: 'Premium UV coating on both sides - maximum shine and protection',
  },
};

/**
 * Get the base paper stock to use for pricing
 * 12pt uses 9pt pricing, 14pt uses 16pt pricing
 */
export function getBasePaperStock(paperStockId: string): PaperStock {
  const paperStock = PAPER_STOCKS[paperStockId];
  if (!paperStock) {
    throw new Error(`Paper stock not found: ${paperStockId}`);
  }

  if (paperStock.pricingGroup) {
    return PAPER_STOCKS[paperStock.pricingGroup];
  }

  return paperStock;
}
