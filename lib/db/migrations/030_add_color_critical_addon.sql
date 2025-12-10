-- Migration 030: Add Color Critical addon
-- This addon is for customers who need specific color matching with custom proofs

-- Insert the Color Critical addon
INSERT INTO add_ons (
  name,
  slug,
  description,
  pricing_model,
  base_price,
  per_unit_price,
  percentage,
  ui_component,
  position,
  display_order,
  is_mandatory_default,
  is_enabled_default,
  turnaround_days_add,
  is_active
)
VALUES (
  'Color Critical',
  'color-critical',
  'Production time dependent on approval of color proof. Because of limitations with the gang run printing process, the accuracy of color reproduction is not guaranteed. Only select this option if you are looking for a specific color match custom run with proofs that will not gang up with other jobs.',
  'CUSTOM',
  0,
  0,
  0,
  'checkbox',
  'below_upload',
  23,
  false,
  true,
  0,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true;

-- Verify
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM add_ons WHERE slug = 'color-critical') THEN
    RAISE NOTICE 'Color Critical addon created/updated successfully';
  END IF;
END $$;
