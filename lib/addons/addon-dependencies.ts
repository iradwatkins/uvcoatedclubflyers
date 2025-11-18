/**
 * Addon Dependencies and Validation
 * Manages relationships between addons and validates configurations
 */

export interface AddOnDependency {
  triggerSlug: string;
  requiredSlug: string;
  reason: string;
}

export interface AddOnConflict {
  addon1Slug: string;
  addon2Slug: string;
  reason: string;
}

export interface SizeRequirement {
  addonSlug: string;
  minWidth: number;
  minHeight: number;
  reason: string;
}

/**
 * Define addon dependencies
 * When trigger is selected, required addon is automatically enabled
 */
export const ADDON_DEPENDENCIES: AddOnDependency[] = [
  {
    triggerSlug: 'eddm-process-postage',
    requiredSlug: 'banding',
    reason: 'EDDM service includes mandatory paper banding',
  },
];

/**
 * Define addon conflicts
 * These addons cannot be selected together
 */
export const ADDON_CONFLICTS: AddOnConflict[] = [
  {
    addon1Slug: 'eddm-process-postage',
    addon2Slug: 'banding',
    reason: 'EDDM service already includes banding - cannot manually add banding',
  },
];

/**
 * Define size requirements for addons
 */
export const SIZE_REQUIREMENTS: SizeRequirement[] = [
  {
    addonSlug: 'folding',
    minWidth: 5,
    minHeight: 6,
    reason: 'Folding requires minimum size of 5" × 6"',
  },
];

/**
 * Get required addons based on selected addons
 */
export function getRequiredAddOns(
  selectedSlugs: string[],
  allAddOns: Array<{ id: number; slug: string }>
): number[] {
  const requiredAddOnIds: number[] = [];

  for (const dependency of ADDON_DEPENDENCIES) {
    if (selectedSlugs.includes(dependency.triggerSlug)) {
      const requiredAddOn = allAddOns.find((a) => a.slug === dependency.requiredSlug);
      if (requiredAddOn && !selectedSlugs.includes(requiredAddOn.slug)) {
        requiredAddOnIds.push(requiredAddOn.id);
      }
    }
  }

  return requiredAddOnIds;
}

/**
 * Check if two addons conflict
 */
export function checkAddOnConflicts(
  newSlug: string,
  selectedSlugs: string[]
): { hasConflict: boolean; reason?: string } {
  for (const conflict of ADDON_CONFLICTS) {
    if (
      (conflict.addon1Slug === newSlug && selectedSlugs.includes(conflict.addon2Slug)) ||
      (conflict.addon2Slug === newSlug && selectedSlugs.includes(conflict.addon1Slug))
    ) {
      return { hasConflict: true, reason: conflict.reason };
    }
  }

  return { hasConflict: false };
}

/**
 * Validate size requirements for addons
 */
export function validateSizeRequirements(
  selectedSlugs: string[],
  width: number,
  height: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const requirement of SIZE_REQUIREMENTS) {
    if (selectedSlugs.includes(requirement.addonSlug)) {
      if (width < requirement.minWidth || height < requirement.minHeight) {
        errors.push(
          `${requirement.addonSlug}: ${requirement.reason}. Current size: ${width}" × ${height}"`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required sub-options for an addon
 */
export function validateRequiredSubOptions(
  addOn: {
    id: number;
    name: string;
    subOptions?: Array<{
      fieldName: string;
      fieldLabel: string;
      isRequired: boolean;
    }>;
  },
  subOptionValues: Record<string, any>
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  if (!addOn.subOptions) {
    return { isValid: true, missingFields: [] };
  }

  for (const subOption of addOn.subOptions) {
    if (subOption.isRequired) {
      const value = subOptionValues[subOption.fieldName];
      if (value === null || value === undefined || value === '') {
        missingFields.push(subOption.fieldLabel);
      }
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get paper type from paper stock name for folding logic
 */
export function getPaperType(paperStockName: string): 'text' | 'cardstock' {
  const lowerName = paperStockName.toLowerCase();

  if (
    lowerName.includes('card') ||
    lowerName.includes('16pt') ||
    lowerName.includes('18pt') ||
    lowerName.includes('12pt') ||
    lowerName.includes('14pt') ||
    lowerName.includes('9pt')
  ) {
    return 'cardstock';
  }

  return 'text';
}
