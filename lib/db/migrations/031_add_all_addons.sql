-- Migration 031: Add all addon options from documentation
-- Reference: 1111111Printing/1printing_options_documentation.md

-- ========================================
-- FINISHING OPTIONS (6 addons)
-- ========================================

-- 1. Perforation
-- Pricing: $20 setup + $0.01/piece
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Perforation',
  'perforation',
  'A straight row of tiny holes punched in the paper so that a part can be torn off easily. The perforation row goes completely across the sheet from one side to the other. Perfect for tickets, coupons, or tear-off sections.',
  'CUSTOM',
  20.00,
  0.01,
  0,
  'checkbox',
  'below_upload',
  10,
  false,
  true,
  1,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 2. Score Only
-- Pricing: $17 setup + $0.01/score/piece
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Score Only',
  'score-only',
  'Create fold lines without cutting. Score lines make folding easier and more professional.',
  'CUSTOM',
  17.00,
  0.01,
  0,
  'checkbox',
  'below_upload',
  11,
  false,
  true,
  1,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 3. Folding
-- Pricing: Text $0.17 setup + $0.01/piece, Card $0.34 setup + $0.02/piece
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Folding',
  'folding',
  'Professional folding service with various fold patterns. Minimum size: 5" x 6". Card stock folding includes mandatory basic scoring.',
  'CUSTOM',
  0.17,
  0.01,
  0,
  'dropdown',
  'below_upload',
  12,
  false,
  true,
  3,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 4. Corner Rounding
-- Pricing: $20-25 setup + $0.01-0.02/piece
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Corner Rounding',
  'corner-rounding',
  'Round the corners of your prints for a professional, modern look. Removes sharp corners and adds a radius. Business cards: 1/4" radius, Other products: 3/16" radius.',
  'CUSTOM',
  20.00,
  0.01,
  0,
  'dropdown',
  'below_upload',
  13,
  false,
  true,
  1,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 5. Hole Drilling
-- Pricing: $20 setup + $0.02/hole for custom, $0.01 for binder punch
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Hole Drilling',
  'hole-drilling',
  'Add holes for hanging, display, or binder storage. Professional hole drilling service. Standard hole size is 5/16".',
  'CUSTOM',
  20.00,
  0.02,
  0,
  'dropdown',
  'below_upload',
  14,
  false,
  true,
  1,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 6. Wafer Seal
-- Pricing: $25 setup + $0.02/piece
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Wafer Seal',
  'wafer-seal',
  'Adhesive seals used to keep folded materials closed. Commonly used for brochures and folded materials. Number of seals does not affect price.',
  'CUSTOM',
  25.00,
  0.02,
  0,
  'checkbox',
  'below_upload',
  15,
  false,
  true,
  1,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- ========================================
-- PACKAGING OPTIONS (2 addons)
-- ========================================

-- 7. Banding
-- Pricing: $0.75/bundle
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Banding',
  'banding',
  'Bundle your flyers with paper or rubber bands. Have your product bundled in specific individual quantity groups. Price is per bundle ($0.75/bundle).',
  'CUSTOM',
  0,
  0.75,
  0,
  'checkbox',
  'below_upload',
  16,
  false,
  true,
  1,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 8. Shrink Wrapping
-- Pricing: $0.30/bundle
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Shrink Wrapping',
  'shrink-wrapping',
  'Protective plastic wrapping for bundles. Weather-resistant shrink wrap to protect your flyers. Price is per bundle ($0.30/bundle).',
  'CUSTOM',
  0,
  0.30,
  0,
  'checkbox',
  'below_upload',
  17,
  false,
  true,
  1,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- ========================================
-- PROOFS & QUALITY (1 addon)
-- ========================================

-- 9. Digital Proof
-- Pricing: $5 flat
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Digital Proof',
  'digital-proof',
  'PDF proof sent before production begins. We will email you a digital proof for your approval. Helps ensure order is exactly as desired.',
  'FLAT',
  5.00,
  0,
  0,
  'checkbox',
  'below_upload',
  18,
  false,
  true,
  1,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- ========================================
-- PERSONALIZATION (3 addons)
-- ========================================

-- 10. Variable Data Printing
-- Pricing: $60 setup + $0.02/piece
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Variable Data Printing',
  'variable-data-printing',
  'Personalized printing with unique names, numbers, or text on each piece. Requires customer to provide spreadsheet/CSV with data. Perfect for personalized mailers, tickets with unique codes.',
  'CUSTOM',
  60.00,
  0.02,
  0,
  'checkbox',
  'below_upload',
  19,
  false,
  true,
  2,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 11. Numbering
-- Pricing: $0.10/piece (PER_UNIT)
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Numbering',
  'numbering',
  'Sequential numbering for tracking, tickets, or invoices. Price is $0.10 per piece.',
  'PER_UNIT',
  0,
  0.10,
  0,
  'checkbox',
  'below_upload',
  20,
  false,
  true,
  2,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 12. QR Code
-- Pricing: $5 flat
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'QR Code',
  'qr-code',
  'Custom QR code generation and placement on your design. Staff manually creates QR code from customer content. For unique QR codes per piece, use Variable Data Printing.',
  'FLAT',
  5.00,
  0,
  0,
  'checkbox',
  'below_upload',
  21,
  false,
  true,
  0,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- ========================================
-- DISCOUNTS & PRICING (2 addons)
-- ========================================

-- 13. Our Tagline
-- Pricing: -5% discount
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Our Tagline',
  'our-tagline',
  'Add our company tagline to your design for a 5% discount on base printing costs. Cannot combine with broker discount.',
  'PERCENTAGE',
  0,
  0,
  -5.00,
  'checkbox',
  'below_upload',
  22,
  false,
  true,
  0,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 14. Exact Size
-- Pricing: +12.5% markup
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Exact Size',
  'exact-size',
  'Precise cutting to your exact specifications. Ensures your flyers are cut to exact dimensions with no variance.',
  'PERCENTAGE',
  0,
  0,
  12.50,
  'checkbox',
  'below_upload',
  24,
  false,
  true,
  0,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- ========================================
-- SHIPPING & MAILING (2 addons)
-- ========================================

-- 15. Postal Delivery (DDU)
-- Pricing: $30/box
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Postal Delivery (DDU)',
  'postal-delivery-ddu',
  'Direct delivery to post office for EDDM campaigns. We deliver directly to the post office. Only available for EDDM-eligible products. Price is $30 per shipping box.',
  'CUSTOM',
  30.00,
  0,
  0,
  'checkbox',
  'below_upload',
  25,
  false,
  true,
  1,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 16. EDDM Process & Postage
-- Pricing: $50 setup + $0.239/piece (includes postage)
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'EDDM Process & Postage',
  'eddm-process-postage',
  'Complete Every Door Direct Mail processing and postage. Full EDDM service including route selection and postage. Per-piece cost includes USPS postage. Mandatory paper banding is included.',
  'CUSTOM',
  50.00,
  0.239,
  0,
  'checkbox',
  'below_upload',
  26,
  false,
  true,
  2,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- ========================================
-- PREMIUM FINISHES (2 addons)
-- ========================================

-- 17. Foil Stamping
-- Pricing: +25% markup
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Foil Stamping',
  'foil-stamping',
  'Add metallic foil accents. Premium metallic foil in gold, silver, rose gold, copper, or custom colors.',
  'PERCENTAGE',
  0,
  0,
  25.00,
  'dropdown',
  'below_upload',
  27,
  false,
  true,
  3,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- 18. Spot UV
-- Pricing: +20% markup
INSERT INTO add_ons (name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, is_active)
VALUES (
  'Spot UV',
  'spot-uv',
  'Selective UV coating for emphasis. Add glossy UV coating to specific areas. Creates contrast with raised, glossy areas.',
  'PERCENTAGE',
  0,
  0,
  20.00,
  'dropdown',
  'below_upload',
  28,
  false,
  true,
  2,
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = true;

-- ========================================
-- SUB-OPTIONS FOR ADDONS
-- ========================================

-- Get addon IDs for sub-options (using subqueries)

-- Perforation sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'vertical_count', 'How Many Vertical', 'select',
  '{"options": [{"value": "0", "label": "0"}, {"value": "1", "label": "1"}, {"value": "2", "label": "2"}, {"value": "3", "label": "3"}, {"value": "4", "label": "4"}, {"value": "5", "label": "5"}]}'::jsonb,
  '0', false, 1
FROM add_ons WHERE slug = 'perforation'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'vertical_position', 'Vertical Position', 'text', NULL, NULL, false, 2
FROM add_ons WHERE slug = 'perforation'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'horizontal_count', 'How Many Horizontal', 'select',
  '{"options": [{"value": "0", "label": "0"}, {"value": "1", "label": "1"}, {"value": "2", "label": "2"}, {"value": "3", "label": "3"}, {"value": "4", "label": "4"}, {"value": "5", "label": "5"}]}'::jsonb,
  '0', false, 3
FROM add_ons WHERE slug = 'perforation'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'horizontal_position', 'Horizontal Position', 'text', NULL, NULL, false, 4
FROM add_ons WHERE slug = 'perforation'
ON CONFLICT DO NOTHING;

-- Score Only sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'score_count', 'How Many Scores', 'select',
  '{"options": [{"value": "1", "label": "1"}, {"value": "2", "label": "2"}, {"value": "3", "label": "3"}, {"value": "4", "label": "4"}, {"value": "5", "label": "5"}]}'::jsonb,
  '1', true, 1
FROM add_ons WHERE slug = 'score-only'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'score_position', 'Score Position', 'text', NULL, NULL, false, 2
FROM add_ons WHERE slug = 'score-only'
ON CONFLICT DO NOTHING;

-- Folding sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'fold_type', 'Fold Type', 'select',
  '{"options": [{"value": "half", "label": "Half Fold (2 Panel)"}, {"value": "tri", "label": "Tri Fold (3 Panel)"}, {"value": "z", "label": "Z Fold (3 Panel)"}, {"value": "gate", "label": "Gate Fold (3 Panel)"}, {"value": "double_parallel", "label": "Double Parallel Fold (4 Panel)"}, {"value": "double_parallel_reverse", "label": "Double Parallel Reverse Fold (4 Panel)"}, {"value": "double_gate", "label": "Double Gate Fold (4 Panel)"}, {"value": "roll", "label": "Roll Fold (4 Panel)"}, {"value": "accordion", "label": "Accordion Fold (4 Panel)"}]}'::jsonb,
  'half', true, 1
FROM add_ons WHERE slug = 'folding'
ON CONFLICT DO NOTHING;

-- Corner Rounding sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'corners', 'Corners to Round', 'select',
  '{"options": [{"value": "all_four", "label": "All Four"}, {"value": "top_two", "label": "Top Two"}, {"value": "bottom_two", "label": "Bottom Two"}, {"value": "left_two", "label": "Left Two"}, {"value": "right_two", "label": "Right Two"}, {"value": "top_left", "label": "Top Left"}, {"value": "top_right", "label": "Top Right"}, {"value": "bottom_left", "label": "Bottom Left"}, {"value": "bottom_right", "label": "Bottom Right"}]}'::jsonb,
  'all_four', true, 1
FROM add_ons WHERE slug = 'corner-rounding'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'radius', 'Corner Radius', 'select',
  '{"options": [{"value": "1/8", "label": "1/8 inch"}, {"value": "3/16", "label": "3/16 inch"}, {"value": "1/4", "label": "1/4 inch (business cards)"}, {"value": "3/8", "label": "3/8 inch"}, {"value": "1/2", "label": "1/2 inch"}]}'::jsonb,
  '1/4', true, 2
FROM add_ons WHERE slug = 'corner-rounding'
ON CONFLICT DO NOTHING;

-- Hole Drilling sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'hole_type', 'Number of Holes', 'select',
  '{"options": [{"value": "1", "label": "1 Custom Hole"}, {"value": "2", "label": "2 Custom Holes"}, {"value": "3", "label": "3 Custom Holes"}, {"value": "4", "label": "4 Custom Holes"}, {"value": "5", "label": "5 Custom Holes"}, {"value": "binder_2", "label": "2 Hole Binder Punch"}, {"value": "binder_3", "label": "3 Hole Binder Punch"}, {"value": "binder_4", "label": "4 Hole Binder Punch"}, {"value": "binder_5", "label": "5 Hole Binder Punch"}]}'::jsonb,
  '1', true, 1
FROM add_ons WHERE slug = 'hole-drilling'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'hole_position', 'Position of Holes', 'text', NULL, NULL, false, 2
FROM add_ons WHERE slug = 'hole-drilling'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'hole_size', 'Size of Holes', 'select',
  '{"options": [{"value": "1/8", "label": "1/8 inch"}, {"value": "3/16", "label": "3/16 inch"}, {"value": "1/4", "label": "1/4 inch"}, {"value": "5/16", "label": "5/16 inch (Standard)"}, {"value": "3/8", "label": "3/8 inch"}, {"value": "7/16", "label": "7/16 inch"}, {"value": "1/2", "label": "1/2 inch"}]}'::jsonb,
  '5/16', true, 3
FROM add_ons WHERE slug = 'hole-drilling'
ON CONFLICT DO NOTHING;

-- Wafer Seal sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'seal_count', 'How Many Seals?', 'number', NULL, '1', true, 1
FROM add_ons WHERE slug = 'wafer-seal'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'seal_position', 'Where Do You Want the Seals?', 'text', NULL, NULL, true, 2
FROM add_ons WHERE slug = 'wafer-seal'
ON CONFLICT DO NOTHING;

-- Banding sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'band_type', 'Banding Type', 'select',
  '{"options": [{"value": "paper", "label": "Paper Bands"}, {"value": "rubber", "label": "Rubber Bands"}]}'::jsonb,
  'paper', true, 1
FROM add_ons WHERE slug = 'banding'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'items_per_bundle', 'Items Per Bundle', 'number', NULL, '100', true, 2
FROM add_ons WHERE slug = 'banding'
ON CONFLICT DO NOTHING;

-- Shrink Wrapping sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'items_per_bundle', 'Items Per Bundle', 'number', NULL, '25', true, 1
FROM add_ons WHERE slug = 'shrink-wrapping'
ON CONFLICT DO NOTHING;

-- Variable Data Printing sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'variable_count', 'How Many Locations for Variables?', 'number', NULL, '1', true, 1
FROM add_ons WHERE slug = 'variable-data-printing'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'variable_positions', 'Where Are the Variable Locations?', 'textarea', NULL, NULL, true, 2
FROM add_ons WHERE slug = 'variable-data-printing'
ON CONFLICT DO NOTHING;

-- Numbering sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'start_number', 'Starting Number', 'number', NULL, '1', true, 1
FROM add_ons WHERE slug = 'numbering'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'placement', 'Number Placement', 'select',
  '{"options": [{"value": "top_right", "label": "Top Right"}, {"value": "bottom_right", "label": "Bottom Right"}, {"value": "top_left", "label": "Top Left"}, {"value": "bottom_left", "label": "Bottom Left"}, {"value": "custom", "label": "Custom Position"}]}'::jsonb,
  'top_right', true, 2
FROM add_ons WHERE slug = 'numbering'
ON CONFLICT DO NOTHING;

-- QR Code sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'qr_content', 'QR Code Content/URL', 'text', NULL, NULL, true, 1
FROM add_ons WHERE slug = 'qr-code'
ON CONFLICT DO NOTHING;

-- EDDM sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'route_selection', 'Route Selection Method', 'select',
  '{"options": [{"value": "customer_provides", "label": "Customer Provides Routes"}, {"value": "we_select", "label": "We Select Routes"}]}'::jsonb,
  'we_select', true, 1
FROM add_ons WHERE slug = 'eddm-process-postage'
ON CONFLICT DO NOTHING;

INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'routes', 'Routes (if providing)', 'textarea', NULL, NULL, false, 2
FROM add_ons WHERE slug = 'eddm-process-postage'
ON CONFLICT DO NOTHING;

-- Foil Stamping sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'foil_color', 'Foil Color', 'select',
  '{"options": [{"value": "gold", "label": "Gold"}, {"value": "silver", "label": "Silver"}, {"value": "rose_gold", "label": "Rose Gold"}, {"value": "copper", "label": "Copper"}, {"value": "custom", "label": "Custom"}]}'::jsonb,
  'gold', true, 1
FROM add_ons WHERE slug = 'foil-stamping'
ON CONFLICT DO NOTHING;

-- Spot UV sub-options
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
SELECT id, 'uv_coverage', 'Coverage Area', 'select',
  '{"options": [{"value": "logo", "label": "Logo Only"}, {"value": "text", "label": "Text Only"}, {"value": "custom", "label": "Custom Pattern"}]}'::jsonb,
  'logo', true, 1
FROM add_ons WHERE slug = 'spot-uv'
ON CONFLICT DO NOTHING;

-- Verify counts
DO $$
DECLARE
  addon_count INTEGER;
  suboption_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO addon_count FROM add_ons;
  SELECT COUNT(*) INTO suboption_count FROM add_on_sub_options;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Total add-ons: %', addon_count;
  RAISE NOTICE '  - Total sub-options: %', suboption_count;
END $$;
