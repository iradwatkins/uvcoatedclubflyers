-- Update Design Addon Pricing to Match Industry Standards
-- Migration: 017
-- Description: Updates Standard and Rush Custom Design addon pricing to most common values

-- Update Standard Custom Design pricing
-- One side: $75 -> $90
-- Two sides: $120 -> $135 (handled in pricing engine logic)
UPDATE add_ons
SET base_price = 90.00,
    updated_at = now()
WHERE slug = 'standard-custom-design';

-- Update Rush Custom Design pricing
-- One side: $125 -> $160
-- Two sides: $200 -> $240 (handled in pricing engine logic)
UPDATE add_ons
SET base_price = 160.00,
    updated_at = now()
WHERE slug = 'rush-custom-design';

-- Optional: Update Numbering to most common industry standard
-- $0.03 -> $0.10 per piece
UPDATE add_ons
SET per_unit_price = 0.10,
    updated_at = now()
WHERE slug = 'numbering';

-- Verify updates
SELECT slug, name, base_price, per_unit_price
FROM add_ons
WHERE slug IN ('standard-custom-design', 'rush-custom-design', 'numbering');
