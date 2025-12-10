-- Migration 026: Add category column to group related add-ons in admin
-- Groups design services under "Design" category for admin display

-- Add category column to add_ons table
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Update design-related add-ons to have the same category
UPDATE add_ons
SET category = 'Design Services'
WHERE slug IN (
  'upload-my-artwork',
  'standard-custom-design',
  'rush-custom-design',
  'design-changes-minor',
  'design-changes-major',
  'will-upload-later'
);

-- Update finishing add-ons
UPDATE add_ons
SET category = 'Finishing Options'
WHERE slug IN (
  'perforation',
  'score-only',
  'folding',
  'corner-rounding',
  'hole-drilling',
  'wafer-seal'
);

-- Update packaging add-ons
UPDATE add_ons
SET category = 'Packaging & Bundling'
WHERE slug IN ('banding', 'shrink-wrapping');

-- Update premium add-ons
UPDATE add_ons
SET category = 'Premium Finishes'
WHERE slug IN ('foil-stamping', 'spot-uv');

-- Update personalization add-ons
UPDATE add_ons
SET category = 'Personalization'
WHERE slug IN ('variable-data-printing', 'numbering', 'qr-code');

-- Update pricing add-ons
UPDATE add_ons
SET category = 'Pricing Adjustments'
WHERE slug IN ('our-tagline', 'exact-size');

-- Update proofs add-ons
UPDATE add_ons
SET category = 'Proofs & QC'
WHERE slug IN ('digital-proof');

-- Create index for category
CREATE INDEX IF NOT EXISTS idx_add_ons_category ON add_ons(category);

-- Verify
DO $$
DECLARE
  design_count INTEGER;
  finishing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO design_count FROM add_ons WHERE category = 'Design Services';
  SELECT COUNT(*) INTO finishing_count FROM add_ons WHERE category = 'Finishing Options';

  RAISE NOTICE 'Add-on categories updated:';
  RAISE NOTICE '  - Design Services: %', design_count;
  RAISE NOTICE '  - Finishing Options: %', finishing_count;
END $$;
