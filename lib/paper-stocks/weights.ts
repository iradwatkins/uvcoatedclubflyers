/**
 * Paper Stock Weight Configuration
 *
 * Source: /Users/irawatkins/Desktop/1_IRA_FOLDER/Printing/printing-website-seed-document.md
 *
 * Weight values are in pounds per square inch and are used for shipping calculations.
 * These values are separate from the base cost values used for pricing.
 */

export interface PaperStockWeight {
  slug: string;
  name: string;
  weightPerSqIn: number; // pounds per square inch
  type: 'TEXT' | 'CARDSTOCK' | 'COVER';
}

/**
 * All paper stock weights from seed document
 * Reference: 4×6 (24 sq in), 5000 qty calculations
 */
export const PAPER_STOCK_WEIGHTS: Record<string, PaperStockWeight> = {
  '60lb-offset': {
    slug: '60lb-offset',
    name: '60 lb Offset',
    weightPerSqIn: 0.000133333333,
    type: 'TEXT',
    // 4x6, 5000 qty = 16.0 lbs
  },
  '9pt-c2s-cardstock': {
    slug: '9pt-c2s-cardstock',
    name: '9pt C2S Cardstock',
    weightPerSqIn: 0.000333333333,
    type: 'CARDSTOCK',
    // 4x6, 5000 qty = 40.0 lbs
  },
  '100lb-gloss-text': {
    slug: '100lb-gloss-text',
    name: '100 lb Gloss Text',
    weightPerSqIn: 0.000225,
    type: 'TEXT',
    // 4x6, 5000 qty = 27.0 lbs
  },
  '12pt-c2s-cardstock': {
    slug: '12pt-c2s-cardstock',
    name: '12pt C2S Cardstock',
    weightPerSqIn: 0.00035,
    type: 'CARDSTOCK',
    // 4x6, 5000 qty = 42.0 lbs
  },
  '100lb-uncoated-cover': {
    slug: '100lb-uncoated-cover',
    name: '100 lb Uncoated Cover',
    weightPerSqIn: 0.000383333333,
    type: 'COVER',
    // 4x6, 5000 qty = 46.0 lbs
  },
  '14pt-c2s-cardstock': {
    slug: '14pt-c2s-cardstock',
    name: '14pt C2S Cardstock',
    weightPerSqIn: 0.000415,
    type: 'CARDSTOCK',
    // 4x6, 5000 qty = 49.8 lbs
  },
  '16pt-c2s-cardstock': {
    slug: '16pt-c2s-cardstock',
    name: '16pt C2S Cardstock',
    weightPerSqIn: 0.000415,
    type: 'CARDSTOCK',
    // 4x6, 5000 qty = 49.8 lbs
  },
};

/**
 * Get weight per square inch for a given paper stock
 */
export function getWeightPerSqIn(slug: string): number {
  const stock = PAPER_STOCK_WEIGHTS[slug];
  if (!stock) {
    console.warn(`Unknown paper stock: ${slug}, using default 9pt weight`);
    return PAPER_STOCK_WEIGHTS['9pt-c2s-cardstock'].weightPerSqIn;
  }
  return stock.weightPerSqIn;
}

/**
 * Calculate total weight for a given paper stock, size, and quantity
 *
 * @param paperStockSlug - Slug of the paper stock (e.g., '9pt-c2s-cardstock')
 * @param width - Width in inches
 * @param height - Height in inches
 * @param quantity - Number of pieces
 * @returns Total weight in pounds
 */
export function calculateWeight(
  paperStockSlug: string,
  width: number,
  height: number,
  quantity: number
): number {
  const weightPerSqIn = getWeightPerSqIn(paperStockSlug);
  const size = width * height; // square inches
  const totalWeight = weightPerSqIn * size * quantity;

  return totalWeight; // in pounds
}

/**
 * Calculate weight for scaled quantities (> 5000)
 *
 * @param paperStockSlug - Slug of the paper stock
 * @param width - Width in inches
 * @param height - Height in inches
 * @param quantity - Number of pieces
 * @returns Total weight in pounds
 */
export function calculateWeightScaled(
  paperStockSlug: string,
  width: number,
  height: number,
  quantity: number
): number {
  if (quantity <= 5000) {
    return calculateWeight(paperStockSlug, width, height, quantity);
  }

  const weight5000 = calculateWeight(paperStockSlug, width, height, 5000);
  const scaleFactor = quantity / 5000;

  return weight5000 * scaleFactor;
}

/**
 * Get paper stock by material option name (for compatibility with product options)
 *
 * Maps common material names to paper stock slugs
 */
export function getPaperStockSlugFromMaterial(materialName: string): string {
  const normalizedName = materialName.toLowerCase();

  // Map material option names to paper stock slugs
  const mappings: Record<string, string> = {
    '9pt cardstock': '9pt-c2s-cardstock',
    '9pt card stock': '9pt-c2s-cardstock',
    '9pt c2s cardstock': '9pt-c2s-cardstock',
    '12pt cardstock': '12pt-c2s-cardstock',
    '12pt card stock': '12pt-c2s-cardstock',
    '12pt c2s cardstock': '12pt-c2s-cardstock',
    '14pt cardstock': '14pt-c2s-cardstock',
    '14pt card stock': '14pt-c2s-cardstock',
    '14pt c2s cardstock': '14pt-c2s-cardstock',
    '16pt cardstock': '16pt-c2s-cardstock',
    '16pt card stock': '16pt-c2s-cardstock',
    '16pt c2s cardstock': '16pt-c2s-cardstock',
    '100lb gloss text': '100lb-gloss-text',
    '100 lb gloss text': '100lb-gloss-text',
    '100lb uncoated cover': '100lb-uncoated-cover',
    '100 lb uncoated cover': '100lb-uncoated-cover',
    '60lb offset': '60lb-offset',
    '60 lb offset': '60lb-offset',
  };

  const slug = mappings[normalizedName];
  if (!slug) {
    console.warn(`Unknown material: ${materialName}, using default 9pt`);
    return '9pt-c2s-cardstock';
  }

  return slug;
}

/**
 * Calculate weight from product configuration
 *
 * @param config - Product configuration with material, size, and quantity
 * @returns Total weight in pounds
 */
export function calculateWeightFromConfig(config: {
  material: string;
  width: number;
  height: number;
  quantity: number;
}): number {
  const slug = getPaperStockSlugFromMaterial(config.material);
  return calculateWeight(slug, config.width, config.height, config.quantity);
}

/**
 * Verification function - calculates 4x6, 5000 qty for all stocks
 * Use this to verify weights match the seed document
 */
export function verifyWeights(): void {
  console.log('Paper Stock Weight Verification (4x6, 5000 qty):');
  console.log('─'.repeat(60));

  Object.entries(PAPER_STOCK_WEIGHTS).forEach(([slug, stock]) => {
    const weight = calculateWeight(slug, 4, 6, 5000);
    console.log(`${stock.name.padEnd(30)} ${weight.toFixed(1)} lbs`);
  });

  console.log('─'.repeat(60));
  console.log('Expected from seed document:');
  console.log('60 lb Offset                   16.0 lbs');
  console.log('9pt C2S                        40.0 lbs');
  console.log('100 lb Gloss Text              27.0 lbs');
  console.log('12pt C2S                       42.0 lbs');
  console.log('100 lb Uncoated Cover          46.0 lbs');
  console.log('14pt C2S                       49.8 lbs');
  console.log('16pt C2S                       49.8 lbs');
}
