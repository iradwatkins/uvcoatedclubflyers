/**
 * Pricing Calculation Engine
 * Square inch based pricing model for printing products
 *
 * Formula:
 * Step 1: baseCost = paperStockPrice × sidesMultiplier × (width × height) × quantity
 * Step 2: markedUpCost = baseCost × paperStockMarkup (admin configurable per paper stock)
 * Step 3: subtotal = markedUpCost × turnaroundMultiplier
 * Step 4: totalPrice = subtotal + addOnsCost
 *
 * Special Rules:
 * - 12pt uses 9pt pricing base
 * - 14pt uses 16pt pricing base
 * - Paper stock markup applied BEFORE turnaround multiplier
 * - Turnaround multiplier applied AFTER markup
 * - Add-ons applied AFTER turnaround
 */

import { query } from '@/lib/db';

// ========================================
// TYPES
// ========================================

export interface PriceCalculationInput {
  productId: number;
  paperStockId: number;
  coatingId: number;
  turnaroundId: number;
  quantity: number;
  width: number;
  height: number;
  sides: 'single' | 'double'; // 4/0 or 4/4
  addOns?: AddOnSelection[];
}

export interface AddOnSelection {
  addOnId: number;
  subOptions?: Record<string, any>; // Dynamic sub-option values
  choiceId?: number; // Selected choice ID for dropdown add-ons
  choiceValue?: string; // Selected choice value for dropdown add-ons
}

export interface PriceBreakdown {
  // Base pricing
  baseCost: number;
  pricePerSqIn: number;
  squareInches: number;
  sidesMultiplier: number;
  turnaroundMultiplier: number;

  // Markup
  markupMultiplier: number;
  markupAmount: number;
  subtotal: number;

  // Add-ons
  addOnsCost: number;
  addOnsDetails: AddOnCostDetail[];

  // Final totals
  discountAmount: number;
  totalBeforeDiscount: number;
  totalPrice: number;
  unitPrice: number;

  // Metadata
  paperStock: string;
  coating: string;
  turnaround: string;
  quantity: number;
  size: string;
}

export interface AddOnCostDetail {
  addOnId: number;
  name: string;
  cost: number;
  pricingModel: string;
  description: string;
}

// ========================================
// PRICING ENGINE
// ========================================

export class PricingEngine {
  /**
   * Calculate price for a printing product
   */
  static async calculatePrice(input: PriceCalculationInput): Promise<PriceBreakdown> {
    // 1. Get paper stock with pricing group handling
    const paperStock = await this.getPaperStock(input.paperStockId);
    if (!paperStock) {
      throw new Error(`Paper stock not found: ${input.paperStockId}`);
    }

    // 2. Get turnaround multiplier for this paper/quantity/category
    const turnaround = await this.getTurnaround(input.turnaroundId);
    if (!turnaround) {
      throw new Error(`Turnaround not found: ${input.turnaroundId}`);
    }

    const turnaroundMultiplier = await this.getTurnaroundMultiplier(
      paperStock.id,
      input.quantity,
      turnaround.category
    );

    // 3. Get coating
    const coating = await this.getCoating(input.coatingId);
    if (!coating) {
      throw new Error(`Coating not found: ${input.coatingId}`);
    }

    // 4. Calculate square inches
    const squareInches = input.width * input.height;

    // 5. Get sides multiplier
    const sidesMultiplier =
      input.sides === 'double'
        ? parseFloat(paperStock.sides_multiplier_double)
        : parseFloat(paperStock.sides_multiplier_single);

    // 6. Determine base price per square inch
    // If paper has pricing_group_id, use that paper's price, otherwise use its own
    let pricePerSqIn = parseFloat(paperStock.base_cost_per_sq_in);
    if (paperStock.pricing_group_id) {
      const pricingGroup = await this.getPaperStock(paperStock.pricing_group_id);
      if (pricingGroup) {
        pricePerSqIn = parseFloat(pricingGroup.base_cost_per_sq_in);
      }
    }

    // 7. Calculate base cost (Step 1: paperStockPrice × sidesMultiplier × squareInches × quantity)
    const baseCost = pricePerSqIn * sidesMultiplier * squareInches * input.quantity;

    // 8. Apply paper stock markup (Step 2: baseCost × paperStockMarkup)
    // Admin can configure markup per paper stock (default 1.0 = no markup)
    const paperStockMarkup = parseFloat(paperStock.markup) || 1.0;
    const markedUpCost = baseCost * paperStockMarkup;

    // 9. Apply turnaround multiplier (Step 3: markedUpCost × turnaroundMultiplier)
    const subtotal = markedUpCost * turnaroundMultiplier;

    // 10. Calculate add-ons (Step 4: subtotal + addOnsCost)
    const { addOnsCost, addOnsDetails, discountPercentage } = await this.calculateAddOns(
      input.addOns || [],
      subtotal,
      input.quantity
    );

    // 11. Apply discount if any (percentage discount on subtotal)
    const discountAmount = discountPercentage > 0 ? (subtotal * discountPercentage) / 100 : 0;

    // 12. Calculate totals
    const totalBeforeDiscount = subtotal + addOnsCost;
    const totalPrice = subtotal - discountAmount + addOnsCost;
    const unitPrice = totalPrice / input.quantity;

    // For backward compatibility, keep markup fields but set to turnaround values
    const markupMultiplier = turnaroundMultiplier;
    const markupAmount = subtotal - baseCost;

    return {
      baseCost: parseFloat(baseCost.toFixed(2)),
      pricePerSqIn: parseFloat(pricePerSqIn.toFixed(10)),
      squareInches: parseFloat(squareInches.toFixed(2)),
      sidesMultiplier: parseFloat(sidesMultiplier.toFixed(2)),
      turnaroundMultiplier: parseFloat(turnaroundMultiplier.toFixed(2)),

      markupMultiplier: parseFloat(markupMultiplier.toFixed(3)),
      markupAmount: parseFloat(markupAmount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),

      addOnsCost: parseFloat(addOnsCost.toFixed(2)),
      addOnsDetails,

      discountAmount: parseFloat(discountAmount.toFixed(2)),
      totalBeforeDiscount: parseFloat(totalBeforeDiscount.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      unitPrice: parseFloat(unitPrice.toFixed(4)),

      paperStock: paperStock.name,
      coating: coating.name,
      turnaround: turnaround.name,
      quantity: input.quantity,
      size: `${input.width}×${input.height}"`,
    };
  }

  /**
   * Calculate add-ons cost and extract discount percentage
   */
  private static async calculateAddOns(
    selections: AddOnSelection[],
    subtotal: number,
    quantity: number
  ): Promise<{ addOnsCost: number; addOnsDetails: AddOnCostDetail[]; discountPercentage: number }> {
    if (!selections || selections.length === 0) {
      return { addOnsCost: 0, addOnsDetails: [], discountPercentage: 0 };
    }

    let addOnsCost = 0;
    const addOnsDetails: AddOnCostDetail[] = [];
    let discountPercentage = 0;

    for (const selection of selections) {
      const result = await query('SELECT * FROM add_ons WHERE id = $1 AND is_active = true', [
        selection.addOnId,
      ]);

      const addOn = result.rows[0];
      if (!addOn) continue;

      let cost = 0;
      let description = '';
      let displayName = addOn.name;

      // Check if this is a dropdown add-on with a choice selected
      if (addOn.ui_component === 'dropdown' && (selection.choiceId || selection.choiceValue)) {
        // Get the selected choice
        let choiceResult;
        if (selection.choiceId) {
          choiceResult = await query(
            'SELECT * FROM add_on_choices WHERE id = $1 AND add_on_id = $2 AND is_active = true',
            [selection.choiceId, addOn.id]
          );
        } else if (selection.choiceValue) {
          choiceResult = await query(
            'SELECT * FROM add_on_choices WHERE value = $1 AND add_on_id = $2 AND is_active = true',
            [selection.choiceValue, addOn.id]
          );
        }

        const choice = choiceResult?.rows[0];
        if (choice) {
          displayName = choice.label;
          const choicePriceResult = this.calculateChoicePrice(choice, selection.subOptions, quantity);
          cost = choicePriceResult.cost;
          description = choicePriceResult.description;
        }
      } else {
        // Standard add-on pricing (non-dropdown)
        switch (addOn.pricing_model) {
          case 'FLAT':
            // Simple flat fee
            cost = parseFloat(addOn.base_price) || 0;
            description = `$${cost.toFixed(2)} flat fee`;
            break;

          case 'PER_UNIT':
            // Base fee + per-piece charge
            const basePrice = parseFloat(addOn.base_price) || 0;
            const perUnitPrice = parseFloat(addOn.per_unit_price) || 0;
            cost = basePrice + perUnitPrice * quantity;
            description = `$${basePrice.toFixed(2)} + $${perUnitPrice.toFixed(4)}/piece`;
            break;

          case 'PERCENTAGE':
            // Percentage markup or discount
            const percentage = parseFloat(addOn.percentage) || 0;
            if (percentage < 0) {
              // Discount - accumulate percentage
              discountPercentage += Math.abs(percentage);
              description = `${Math.abs(percentage)}% discount`;
            } else {
              // Markup - calculate on subtotal
              cost = subtotal * (percentage / 100);
              description = `${percentage}% markup`;
            }
            break;

          case 'CUSTOM':
            // Complex pricing based on sub-options
            cost = this.calculateCustomAddOn(addOn, selection.subOptions, quantity);
            description = this.getCustomAddOnDescription(addOn, selection.subOptions);
            break;
        }
      }

      addOnsCost += cost;
      addOnsDetails.push({
        addOnId: addOn.id,
        name: displayName,
        cost: parseFloat(cost.toFixed(2)),
        pricingModel: addOn.pricing_model,
        description,
      });
    }

    return {
      addOnsCost,
      addOnsDetails,
      discountPercentage,
    };
  }

  /**
   * Calculate price for a dropdown choice
   */
  private static calculateChoicePrice(
    choice: any,
    subOptions: Record<string, any> = {},
    quantity: number
  ): { cost: number; description: string } {
    const basePrice = parseFloat(choice.base_price) || 0;
    const perUnitPrice = parseFloat(choice.per_unit_price) || 0;
    const percentage = parseFloat(choice.percentage) || 0;
    let cost = 0;
    let description = '';

    switch (choice.price_type) {
      case 'flat':
        cost = basePrice;
        if (cost === 0) {
          description = 'FREE';
        } else {
          description = `$${cost.toFixed(2)} flat fee`;
        }
        break;

      case 'per_unit':
        cost = basePrice + perUnitPrice * quantity;
        description = `$${basePrice.toFixed(2)} + $${perUnitPrice.toFixed(4)}/piece`;
        break;

      case 'percentage':
        // Note: percentage pricing would need subtotal passed in
        description = `${percentage}%`;
        break;

      case 'custom':
        // Custom pricing - typically sides-based
        if (choice.requires_sides_selection && choice.sides_pricing) {
          const sidesPricing =
            typeof choice.sides_pricing === 'string'
              ? JSON.parse(choice.sides_pricing)
              : choice.sides_pricing;

          const selectedSides = subOptions?.sides || subOptions?.designSides || 'one';
          if (selectedSides === 'two' || selectedSides === '2') {
            cost = parseFloat(sidesPricing.two) || 0;
            description = `Two sides - $${cost.toFixed(2)}`;
          } else {
            cost = parseFloat(sidesPricing.one) || 0;
            description = `One side - $${cost.toFixed(2)}`;
          }
        } else {
          cost = basePrice;
          description = cost > 0 ? `$${cost.toFixed(2)}` : 'Custom pricing';
        }
        break;

      default:
        cost = basePrice;
        description = cost > 0 ? `$${cost.toFixed(2)}` : '-';
    }

    return { cost, description };
  }

  /**
   * Calculate custom add-on pricing based on sub-options
   */
  private static calculateCustomAddOn(
    addOn: any,
    subOptions: Record<string, any> = {},
    quantity: number
  ): number {
    let cost = parseFloat(addOn.base_price) || 0;

    // Handle specific custom add-ons
    switch (addOn.slug) {
      case 'standard-custom-design':
        // Design services with sides option
        // One side: $90, Two sides: $135
        cost = subOptions.sides === 'two' || subOptions.sides === '2' ? 135 : 90;
        break;

      case 'rush-custom-design':
        // Rush design services with sides option
        // One side: $160, Two sides: $240
        cost = subOptions.sides === 'two' || subOptions.sides === '2' ? 240 : 160;
        break;

      case 'design-changes-minor':
        // Minor design changes: $22.50 flat fee
        cost = 22.5;
        break;

      case 'design-changes-major':
        // Major design changes: $45.00 flat fee
        cost = 45.0;
        break;

      case 'perforation':
        // Perforation: $20 setup + $0.01/piece
        // Orientation is just for specification (vertical or horizontal)
        cost = 20.0 + 0.01 * quantity;
        break;

      case 'score-only':
        // Score Only: $17 setup + $0.01/score/piece
        const scoreCount = parseInt(subOptions.score_count) || 1;
        cost += (parseFloat(addOn.per_unit_price) || 0.01) * scoreCount * quantity;
        break;

      case 'folding':
        // Folding has different pricing based on paper type
        // Text paper: $0.17 setup + $0.01/piece
        // Cardstock: $0.34 setup + $0.02/piece (includes scoring)
        // Paper type should be passed in subOptions or detected from product
        const paperType = subOptions.paper_type || 'text';
        const isCardstock =
          paperType.includes('card') ||
          paperType.includes('16pt') ||
          paperType.includes('18pt') ||
          paperType.includes('12pt') ||
          paperType.includes('14pt') ||
          paperType.includes('9pt');

        if (isCardstock) {
          cost = 0.34 + 0.02 * quantity;
        } else {
          cost = 0.17 + 0.01 * quantity;
        }
        break;

      case 'hole-drilling':
        // Hole Drilling: $20 setup + variable per-piece
        // Custom holes (1-5): $0.02/hole/piece
        // Binder punch (2-5 hole): $0.01/piece
        const holeType = subOptions.hole_type || '1';
        const isBinder = holeType.includes('binder') || holeType.includes('Binder');

        if (isBinder) {
          // Binder punch: $20 + $0.01/piece
          cost += 0.01 * quantity;
        } else {
          // Custom holes: $20 + $0.02/hole/piece
          const numberOfHoles = parseInt(holeType) || 1;
          cost += 0.02 * numberOfHoles * quantity;
        }
        break;

      case 'banding':
        // Banding: $15 setup + $2.00/bundle
        // Calculate number of bundles based on items per bundle
        const itemsPerBundleBanding = parseInt(subOptions.bundle_size) || 100;
        const numberOfBundles = Math.ceil(quantity / itemsPerBundleBanding);
        cost = 15.0 + numberOfBundles * 2.0;
        break;

      case 'shrink-wrapping':
        // Shrink Wrapping: $0.30/bundle
        const itemsPerBundleShrink = parseInt(subOptions.bundle_size) || 25;
        const bundles = Math.ceil(quantity / itemsPerBundleShrink);
        cost = bundles * 0.3;
        break;

      case 'variable-data-printing':
        // Variable Data Printing: $60 setup + $0.02/piece
        cost = 60.0 + 0.02 * quantity;
        break;

      case 'corner-rounding':
        // Corner Rounding: $25 setup + $0.02/piece
        cost = 25.0 + 0.02 * quantity;
        break;

      case 'wafer-seal':
        // Generic per-piece addons: setup + per-piece cost
        cost += (parseFloat(addOn.per_unit_price) || 0) * quantity;
        break;

      case 'padding':
        // Padding charges per pad (e.g., 25 sheets/pad)
        const sheetsPerPad = parseInt(subOptions.sheets_per_pad) || 25;
        const pads = Math.ceil(quantity / sheetsPerPad);
        cost += (parseFloat(addOn.per_unit_price) || 0) * pads;
        break;

      case 'ship-to-multiple-addresses':
        // Multiple addresses charge
        const addressCount = parseInt(subOptions.address_count) || 1;
        cost += (parseFloat(addOn.per_unit_price) || 0) * addressCount;
        break;
    }

    return cost;
  }

  /**
   * Generate description for custom add-ons
   */
  private static getCustomAddOnDescription(
    addOn: any,
    subOptions: Record<string, any> = {}
  ): string {
    switch (addOn.slug) {
      case 'standard-custom-design':
        const standardSides = subOptions.sides === 'two' || subOptions.sides === '2';
        return standardSides ? 'Two sides - $135' : 'One side - $90';

      case 'rush-custom-design':
        const rushSides = subOptions.sides === 'two' || subOptions.sides === '2';
        return rushSides ? 'Two sides - $240' : 'One side - $160';

      case 'design-changes-minor':
        return 'Minor design changes - $22.50';

      case 'design-changes-major':
        return 'Major design changes - $45.00';

      case 'perforation':
        const v = subOptions.vertical_count || 0;
        const h = subOptions.horizontal_count || 0;
        return `${v} vertical, ${h} horizontal`;

      case 'score-only':
        const scoreCount = subOptions.score_count || 1;
        return `${scoreCount} score line${scoreCount > 1 ? 's' : ''}`;

      case 'folding':
        return subOptions.fold_type || 'Standard fold';

      case 'hole-drilling':
        return subOptions.hole_type || '1 hole';

      case 'banding':
        const bundleSizeBanding = subOptions.bundle_size || 100;
        const bundleType = subOptions.band_type || 'Paper Bands';
        return `${bundleType} - ${bundleSizeBanding}/bundle`;

      case 'shrink-wrapping':
        const bundleSizeShrink = subOptions.bundle_size || 25;
        return `${bundleSizeShrink} per bundle`;

      case 'variable-data-printing':
        const varCount = subOptions.variable_count || 1;
        return `${varCount} variable field${varCount > 1 ? 's' : ''}`;

      case 'padding':
        const sheetsPerPad = subOptions.sheets_per_pad || 25;
        return `${sheetsPerPad} sheets per pad`;

      default:
        return addOn.description || '';
    }
  }

  // ========================================
  // DATABASE HELPERS
  // ========================================

  private static async getPaperStock(id: number) {
    const result = await query('SELECT * FROM paper_stocks WHERE id = $1', [id]);
    return result.rows[0];
  }

  private static async getTurnaround(id: number) {
    const result = await query('SELECT * FROM turnarounds WHERE id = $1', [id]);
    return result.rows[0];
  }

  private static async getCoating(id: number) {
    const result = await query('SELECT * FROM coatings WHERE id = $1', [id]);
    return result.rows[0];
  }

  private static async getMarkupRule(category: string) {
    const result = await query('SELECT * FROM markup_rules WHERE turnaround_category = $1', [
      category,
    ]);
    return result.rows[0];
  }

  private static async getTurnaroundMultiplier(
    paperStockId: number,
    quantity: number,
    category: string
  ): Promise<number> {
    // Standard quantity tiers
    const quantityTiers = [25, 50, 100, 250, 500, 1000, 2500, 5000];

    // For quantities > 5000, use the 5000 multiplier (per documentation)
    if (quantity >= 5000) {
      const result = await query(
        'SELECT multiplier FROM turnaround_multipliers WHERE paper_stock_id = $1 AND quantity = $2 AND turnaround_category = $3',
        [paperStockId, 5000, category]
      );
      return result.rows[0]?.multiplier ? parseFloat(result.rows[0].multiplier) : 1.0;
    }

    // For quantities < 25, extrapolate based on the trend between 25 and 50
    // Small quantities have HIGHER multipliers (more expensive per piece)
    // The pattern shows ~40% decrease from 25->50, so we extrapolate upward for < 25
    if (quantity < 25) {
      const [tier25Result, tier50Result] = await Promise.all([
        query(
          'SELECT multiplier FROM turnaround_multipliers WHERE paper_stock_id = $1 AND quantity = $2 AND turnaround_category = $3',
          [paperStockId, 25, category]
        ),
        query(
          'SELECT multiplier FROM turnaround_multipliers WHERE paper_stock_id = $1 AND quantity = $2 AND turnaround_category = $3',
          [paperStockId, 50, category]
        ),
      ]);

      const mult25 = tier25Result.rows[0]?.multiplier ? parseFloat(tier25Result.rows[0].multiplier) : 1.0;
      const mult50 = tier50Result.rows[0]?.multiplier ? parseFloat(tier50Result.rows[0].multiplier) : 1.0;

      // Calculate the rate of change per quantity unit between 25 and 50
      // As quantity decreases, multiplier increases
      const rateOfChange = (mult25 - mult50) / (50 - 25);

      // Extrapolate for quantities below 25
      // multiplier = mult25 + rateOfChange * (25 - quantity)
      const extrapolatedMultiplier = mult25 + rateOfChange * (25 - quantity);

      // Cap at a reasonable maximum (e.g., 2x the 25 multiplier)
      return Math.min(extrapolatedMultiplier, mult25 * 2);
    }

    // Find the tier that contains this quantity (use exact tier or interpolate)
    // For custom quantities between tiers, use linear interpolation for accurate pricing
    let lowerTier = quantityTiers[0];
    let upperTier = quantityTiers[quantityTiers.length - 1];

    for (let i = 0; i < quantityTiers.length - 1; i++) {
      if (quantity >= quantityTiers[i] && quantity < quantityTiers[i + 1]) {
        lowerTier = quantityTiers[i];
        upperTier = quantityTiers[i + 1];
        break;
      }
    }

    // If quantity matches a tier exactly, return that multiplier
    if (quantityTiers.includes(quantity)) {
      const result = await query(
        'SELECT multiplier FROM turnaround_multipliers WHERE paper_stock_id = $1 AND quantity = $2 AND turnaround_category = $3',
        [paperStockId, quantity, category]
      );
      return result.rows[0]?.multiplier ? parseFloat(result.rows[0].multiplier) : 1.0;
    }

    // Get multipliers for both tiers and interpolate
    const [lowerResult, upperResult] = await Promise.all([
      query(
        'SELECT multiplier FROM turnaround_multipliers WHERE paper_stock_id = $1 AND quantity = $2 AND turnaround_category = $3',
        [paperStockId, lowerTier, category]
      ),
      query(
        'SELECT multiplier FROM turnaround_multipliers WHERE paper_stock_id = $1 AND quantity = $2 AND turnaround_category = $3',
        [paperStockId, upperTier, category]
      ),
    ]);

    const lowerMultiplier = lowerResult.rows[0]?.multiplier
      ? parseFloat(lowerResult.rows[0].multiplier)
      : 1.0;
    const upperMultiplier = upperResult.rows[0]?.multiplier
      ? parseFloat(upperResult.rows[0].multiplier)
      : 1.0;

    // Linear interpolation between tiers
    // As quantity increases, multiplier decreases (volume discount)
    const ratio = (quantity - lowerTier) / (upperTier - lowerTier);
    const interpolatedMultiplier = lowerMultiplier - ratio * (lowerMultiplier - upperMultiplier);

    return interpolatedMultiplier;
  }
}

import { PAPER_STOCK_COATING_MAP } from '@/lib/pricing/paper-stock-coatings';

/**
 * Get all available pricing options for a product
 * NOW USES PRODUCT CONFIGURATION from admin settings
 */
export async function getProductPricingOptions(productId: number) {
  // Get product with configuration fields
  const productResult = await query('SELECT * FROM products WHERE id = $1', [productId]);
  const product = productResult.rows[0];

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  // Parse quantities from product configuration (comma-separated string)
  const quantities = product.quantities
    ? product.quantities.split(',').map((q: string) => parseInt(q.trim()))
    : [25, 50, 100, 250, 500, 1000, 2500, 5000];

  // Parse sizes from product configuration (comma-separated string to StandardSize format)
  const sizeStrings = product.sizes
    ? product.sizes.split(',').map((s: string) => s.trim())
    : ['4x6', '5x7', '6x9', '8.5x11'];

  const sizes = sizeStrings.map((sizeStr: string, index: number) => {
    const parts = sizeStr.split('x');
    const width = parseFloat(parts[0]);
    const height = parseFloat(parts[1]);
    return {
      id: index + 1,
      name: sizeStr,
      width,
      height,
      is_default: index === 0,
    };
  });

  // Get available paper stocks from product configuration
  const availablePaperStockIds = product.available_paper_stocks || [1, 2, 3, 4, 5, 6, 7];

  // Fetch only the paper stocks configured for this product
  const paperStocksResult = await query(
    `SELECT ps.*
     FROM paper_stocks ps
     WHERE ps.id = ANY($1) AND ps.is_active = true
     ORDER BY ps.display_order`,
    [availablePaperStockIds]
  );

  // Map paper stocks to include their allowed coatings from hardcoded mapping
  const paperStocks = paperStocksResult.rows.map((ps: any) => {
    const coatingMap = PAPER_STOCK_COATING_MAP[ps.id];
    if (!coatingMap) {
      return {
        ...ps,
        coatings: [],
      };
    }

    const coatings = coatingMap.coatingIds.map((coatingId: number, index: number) => ({
      id: coatingId,
      name: coatingMap.coatingNames[index],
      description: coatingMap.coatingNames[index],
    }));

    return {
      ...ps,
      coatings,
    };
  });

  // Get available turnarounds from product configuration
  const availableTurnaroundIds = product.available_turnarounds || [6, 7, 8, 2];

  // Fetch only the turnarounds configured for this product
  const turnaroundsResult = await query(
    `SELECT * FROM turnarounds
     WHERE id = ANY($1) AND is_active = true
     ORDER BY display_order`,
    [availableTurnaroundIds]
  );

  // Get product add-ons with details
  const addOnsResult = await query(
    `SELECT
      ao.id,
      ao.name,
      ao.slug,
      ao.description,
      ao.pricing_model,
      ao.base_price,
      ao.per_unit_price,
      ao.percentage,
      ao.ui_component,
      pao.position,
      pao.is_mandatory,
      pao.is_enabled,
      pao.display_order,
      pao.override_base_price,
      pao.override_per_unit_price,
      pao.override_percentage
     FROM product_add_ons pao
     JOIN add_ons ao ON ao.id = pao.add_on_id
     WHERE pao.product_id = $1 AND pao.is_enabled = true
     ORDER BY pao.display_order, ao.display_order`,
    [productId]
  );

  // Get all sub-options for these add-ons
  const addOnIds = addOnsResult.rows.map((ao: any) => ao.id);
  const subOptionsResult =
    addOnIds.length > 0
      ? await query(
          `SELECT * FROM add_on_sub_options
         WHERE add_on_id = ANY($1)
         ORDER BY display_order`,
          [addOnIds]
        )
      : { rows: [] };

  // Transform sub-options from snake_case to camelCase and map to parent add-ons
  const subOptionsByAddOn = subOptionsResult.rows.reduce((acc: any, subOption: any) => {
    if (!acc[subOption.add_on_id]) {
      acc[subOption.add_on_id] = [];
    }
    // Transform snake_case database columns to camelCase for frontend
    acc[subOption.add_on_id].push({
      id: subOption.id,
      addOnId: subOption.add_on_id,
      fieldName: subOption.field_name,
      fieldLabel: subOption.field_label,
      fieldType: subOption.field_type,
      options: subOption.options,
      defaultValue: subOption.default_value,
      isRequired: subOption.is_required,
      affectsPricing: subOption.affects_pricing,
      tooltip: subOption.tooltip,
      displayOrder: subOption.display_order,
      showWhen: subOption.show_when,
    });
    return acc;
  }, {});

  // Get choices for dropdown add-ons
  const dropdownAddOnIds = addOnsResult.rows
    .filter((ao: any) => ao.ui_component === 'dropdown')
    .map((ao: any) => ao.id);

  const choicesResult =
    dropdownAddOnIds.length > 0
      ? await query(
          `SELECT * FROM add_on_choices
           WHERE add_on_id = ANY($1) AND is_active = true
           ORDER BY display_order`,
          [dropdownAddOnIds]
        )
      : { rows: [] };

  // Map choices by add-on ID
  const choicesByAddOn = choicesResult.rows.reduce((acc: any, choice: any) => {
    if (!acc[choice.add_on_id]) {
      acc[choice.add_on_id] = [];
    }
    // Transform to camelCase for frontend
    acc[choice.add_on_id].push({
      id: choice.id,
      addOnId: choice.add_on_id,
      value: choice.value,
      label: choice.label,
      description: choice.description,
      priceType: choice.price_type,
      basePrice: choice.base_price,
      perUnitPrice: choice.per_unit_price,
      percentage: choice.percentage,
      requiresFileUpload: choice.requires_file_upload,
      requiresSidesSelection: choice.requires_sides_selection,
      sidesPricing: choice.sides_pricing,
      displayOrder: choice.display_order,
      isDefault: choice.is_default,
      isActive: choice.is_active,
    });
    return acc;
  }, {});

  // Attach sub-options and choices to add-ons
  const addOnsWithSubOptions = addOnsResult.rows.map((ao: any) => ({
    ...ao,
    subOptions: subOptionsByAddOn[ao.id] || [],
    choices: choicesByAddOn[ao.id] || [],
  }));

  // Group add-ons by position
  const addOns = {
    above_upload: addOnsWithSubOptions.filter((ao: any) => ao.position === 'above_upload'),
    below_upload: addOnsWithSubOptions.filter((ao: any) => ao.position === 'below_upload'),
  };

  return {
    product,
    paperStocks,
    turnarounds: turnaroundsResult.rows,
    quantities,
    sizes,
    addOns,
  };
}
