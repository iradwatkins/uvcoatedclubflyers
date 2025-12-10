-- Migration 026: Consolidate 6 design add-ons into 1 "Design" add-on with sub-options
-- This replaces the separate design add-ons with a single add-on that has a dropdown sub-option

-- Step 1: Delete existing design add-ons and their references
DELETE FROM add_on_sub_options WHERE add_on_id IN (1, 2, 3, 4, 5, 6);
DELETE FROM product_addons WHERE add_on_id IN (1, 2, 3, 4, 5, 6);
DELETE FROM add_ons WHERE id IN (1, 2, 3, 4, 5, 6);

-- Step 2: Create single "Design" add-on
INSERT INTO add_ons (
  id, name, slug, description,
  pricing_model, base_price, per_unit_price, percentage,
  ui_component, position, display_order,
  is_mandatory_default, is_enabled_default, turnaround_days_add, is_active
)
VALUES (
  1, 'Design', 'design', 'Select how you want to provide your artwork',
  'CUSTOM', 0, 0, 0,
  'dropdown', 'above_upload', 1,
  true, true, 0, true
);

-- Step 3: Create sub-option for design choice (the main dropdown)
INSERT INTO add_on_sub_options (
  add_on_id, field_name, field_label, field_type, options,
  default_value, is_required, affects_pricing, display_order
)
VALUES (
  1, 'design_choice', 'Design Option', 'select',
  '{"options": [
    {"value": "upload-my-artwork", "label": "Upload My Artwork", "price": 0, "description": "Upload your print-ready files"},
    {"value": "standard-custom-design", "label": "Standard Custom Design", "price": 90, "description": "Professional design - 72 hours", "requiresSides": true, "prices": {"one": 90, "two": 135}},
    {"value": "rush-custom-design", "label": "Rush Custom Design", "price": 160, "description": "Professional design - 24-36 hours", "requiresSides": true, "prices": {"one": 160, "two": 240}},
    {"value": "design-changes-minor", "label": "Design Changes - Minor", "price": 22.50, "description": "Text changes, color adjustments"},
    {"value": "design-changes-major", "label": "Design Changes - Major", "price": 45, "description": "Major layout changes"},
    {"value": "will-upload-later", "label": "Will Upload Later", "price": 0, "description": "Email files after order"}
  ]}',
  'upload-my-artwork', true, true, 1
);

-- Step 4: Create sub-option for design sides (shown when custom design selected)
INSERT INTO add_on_sub_options (
  add_on_id, field_name, field_label, field_type, options,
  default_value, is_required, affects_pricing, display_order, show_when
)
VALUES (
  1, 'design_sides', 'How many sides need design?', 'select',
  '{"options": [
    {"value": "one", "label": "One Side"},
    {"value": "two", "label": "Two Sides"}
  ]}',
  'one', false, true, 2, 'design_choice === "standard-custom-design" OR design_choice === "rush-custom-design"'
);

-- Step 5: Reset sequence to account for deleted IDs
SELECT setval('add_ons_id_seq', (SELECT COALESCE(MAX(id), 1) FROM add_ons));
SELECT setval('add_on_sub_options_id_seq', (SELECT COALESCE(MAX(id), 1) FROM add_on_sub_options));

-- Verify
DO $$
DECLARE
  design_addon_count INTEGER;
  design_suboption_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO design_addon_count FROM add_ons WHERE slug = 'design';
  SELECT COUNT(*) INTO design_suboption_count FROM add_on_sub_options WHERE add_on_id = 1;

  RAISE NOTICE 'Design add-on consolidation complete:';
  RAISE NOTICE '  - Design add-on created: %', design_addon_count;
  RAISE NOTICE '  - Sub-options created: %', design_suboption_count;
END $$;
