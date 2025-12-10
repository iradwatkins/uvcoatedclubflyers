-- Migration 028: Consolidate 6 design add-ons into 1 "Design" add-on with choices
-- Depends on: 027_add_on_choices.sql

-- Step 1: Delete existing design add-ons (IDs 1-6) and their references
DELETE FROM add_on_sub_options WHERE add_on_id IN (1, 2, 3, 4, 5, 6);
DELETE FROM product_addons WHERE add_on_id IN (1, 2, 3, 4, 5, 6);
DELETE FROM add_ons WHERE id IN (1, 2, 3, 4, 5, 6);

-- Step 2: Create single "Design" add-on
INSERT INTO add_ons (
  id, name, slug, description,
  pricing_model, base_price, per_unit_price, percentage,
  ui_component, position, display_order,
  is_mandatory_default, is_enabled_default, turnaround_days_add, is_active,
  tooltip_text
)
VALUES (
  1, 'Design', 'design', 'Select how you want to provide your artwork',
  'CUSTOM', 0, 0, 0,
  'dropdown', 'above_upload', 1,
  true, true, 0, true,
  'Please select the design option you would like.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  ui_component = EXCLUDED.ui_component;

-- Step 3: Insert design choices
INSERT INTO add_on_choices (add_on_id, value, label, description, price_type, base_price, per_unit_price, requires_file_upload, requires_sides_selection, sides_pricing, display_order, is_default, is_active)
VALUES
  -- Upload My Artwork - FREE, shows file upload
  (1, 'upload-my-artwork', 'Upload My Artwork', 'Upload your print-ready files (PDF, JPG, PNG, AI, EPS, PSD)', 'flat', 0, 0, true, false, NULL, 1, true, true),

  -- Standard Custom Design - $90 one side, $135 two sides
  (1, 'standard-custom-design', 'Standard Custom Design', 'Professional design service - 72 hour turnaround', 'custom', 0, 0, false, true, '{"one": 90, "two": 135}', 2, false, true),

  -- Rush Custom Design - $160 one side, $240 two sides
  (1, 'rush-custom-design', 'Rush Custom Design', 'Professional design service - 24-36 hour turnaround', 'custom', 0, 0, false, true, '{"one": 160, "two": 240}', 3, false, true),

  -- Design Changes - Minor - $22.50 flat
  (1, 'design-changes-minor', 'Design Changes - Minor', 'Text changes, color adjustments, small layout tweaks', 'flat', 22.50, 0, true, false, NULL, 4, false, true),

  -- Design Changes - Major - $45 flat
  (1, 'design-changes-major', 'Design Changes - Major', 'Major redesign, extensive layout changes', 'flat', 45, 0, true, false, NULL, 5, false, true),

  -- Will Upload Later - FREE, no file upload
  (1, 'will-upload-later', 'Will Upload Later', 'Complete your order now and email files later', 'flat', 0, 0, false, false, NULL, 6, false, true)

ON CONFLICT (add_on_id, value) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  price_type = EXCLUDED.price_type,
  base_price = EXCLUDED.base_price,
  requires_file_upload = EXCLUDED.requires_file_upload,
  requires_sides_selection = EXCLUDED.requires_sides_selection,
  sides_pricing = EXCLUDED.sides_pricing,
  display_order = EXCLUDED.display_order;

-- Step 4: Reset sequences
SELECT setval('add_ons_id_seq', (SELECT COALESCE(MAX(id), 1) FROM add_ons));
SELECT setval('add_on_choices_id_seq', (SELECT COALESCE(MAX(id), 1) FROM add_on_choices));

-- Verify
DO $$
DECLARE
  design_addon_count INTEGER;
  design_choice_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO design_addon_count FROM add_ons WHERE slug = 'design';
  SELECT COUNT(*) INTO design_choice_count FROM add_on_choices WHERE add_on_id = 1;

  RAISE NOTICE 'Design add-on consolidation complete:';
  RAISE NOTICE '  - Design add-on: %', design_addon_count;
  RAISE NOTICE '  - Design choices: %', design_choice_count;
END $$;
