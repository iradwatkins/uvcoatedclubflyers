-- Seed Data Part 3: Add-ons (24 add-ons with positioning and ordering)
-- Organized by type: Design Services, Finishing, Packaging, Premium, Personalization, etc.

-- Clear existing add-ons
DELETE FROM add_on_sub_options;
DELETE FROM add_ons;

-- ========================================
-- DESIGN SERVICES (Above Upload) - 6 add-ons
-- Position: above_upload, Display Order: 1-6
-- ========================================

-- 1. Upload My Artwork (FREE)
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(1, 'Upload My Artwork', 'upload-my-artwork', 'Upload your print-ready files (PDF, JPG, PNG, EPS, AI)', 'FLAT', 0, 0, 0, 'checkbox', 'above_upload', 1, false, true, 0);

-- 2. Standard Custom Design
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(2, 'Standard Custom Design', 'standard-custom-design', 'Professional design service - standard turnaround', 'CUSTOM', 75, 0, 0, 'dropdown', 'above_upload', 2, false, true, 2);

-- Sub-options for Standard Custom Design
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(2, 'sides', 'Design Sides', 'select', '{"options": [{"value": "one", "label": "One Side - $75"}, {"value": "two", "label": "Two Sides - $120"}]}', 'one', true, 1);

-- 3. Rush Custom Design
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(3, 'Rush Custom Design', 'rush-custom-design', 'Professional design service - rush turnaround (24-36 hours)', 'CUSTOM', 125, 0, 0, 'dropdown', 'above_upload', 3, false, true, 1);

-- Sub-options for Rush Custom Design
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(3, 'sides', 'Design Sides', 'select', '{"options": [{"value": "one", "label": "One Side - $125"}, {"value": "two", "label": "Two Sides - $200"}]}', 'one', true, 1);

-- 4. Design Changes - Minor
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(4, 'Design Changes - Minor', 'design-changes-minor', 'Text changes, color adjustments, small layout tweaks', 'FLAT', 22.50, 0, 0, 'checkbox', 'above_upload', 4, false, true, 1);

-- 5. Design Changes - Major
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(5, 'Design Changes - Major', 'design-changes-major', 'Major redesign, extensive layout changes', 'FLAT', 45, 0, 0, 'checkbox', 'above_upload', 5, false, true, 2);

-- 6. Will Upload Images Later
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(6, 'Will Upload Images Later', 'will-upload-later', 'Complete order now, email files to us later', 'FLAT', 0, 0, 0, 'checkbox', 'above_upload', 6, false, true, 0);

-- ========================================
-- FINISHING OPTIONS (Below Upload) - 6 add-ons
-- Position: below_upload, Display Order: 7-12
-- ========================================

-- 7. Perforation
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(7, 'Perforation', 'perforation', 'Add perforations for easy tear-off sections', 'CUSTOM', 20, 0.01, 0, 'checkbox', 'below_upload', 7, false, true, 1);

-- Sub-options for Perforation
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(7, 'vertical_count', 'How Many Vertical', 'select', '{"options": [
  {"value": "0", "label": "0"},
  {"value": "1", "label": "1"},
  {"value": "2", "label": "2"},
  {"value": "3", "label": "3"},
  {"value": "4", "label": "4"},
  {"value": "5", "label": "5"}
]}', '0', false, 1),
(7, 'vertical_position', 'Vertical Position', 'text', NULL, NULL, false, 2),
(7, 'horizontal_count', 'How Many Horizontal', 'select', '{"options": [
  {"value": "0", "label": "0"},
  {"value": "1", "label": "1"},
  {"value": "2", "label": "2"},
  {"value": "3", "label": "3"},
  {"value": "4", "label": "4"},
  {"value": "5", "label": "5"}
]}', '0', false, 3),
(7, 'horizontal_position', 'Horizontal Position', 'text', NULL, NULL, false, 4);

-- 8. Score Only
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(8, 'Score Only', 'score-only', 'Add score lines for easier folding', 'CUSTOM', 17, 0.01, 0, 'checkbox', 'below_upload', 8, false, true, 1);

-- Sub-options for Score Only
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(8, 'score_count', 'How Many Scores', 'select', '{"options": [
  {"value": "1", "label": "1"},
  {"value": "2", "label": "2"},
  {"value": "3", "label": "3"},
  {"value": "4", "label": "4"},
  {"value": "5", "label": "5"}
]}', '1', true, 1),
(8, 'score_position', 'Score Position', 'text', NULL, NULL, true, 2);

-- 9. Folding
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(9, 'Folding', 'folding', 'Professional folding service (minimum size 5" × 6")', 'CUSTOM', 0.17, 0.01, 0, 'dropdown', 'below_upload', 9, false, true, 3);

-- Sub-options for Folding
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(9, 'fold_type', 'Fold Type', 'select', '{"options": [
  {"value": "half", "label": "Half Fold"},
  {"value": "tri", "label": "Tri Fold"},
  {"value": "z", "label": "Z Fold"},
  {"value": "gate", "label": "Gate Fold"},
  {"value": "double_parallel", "label": "Double Parallel"},
  {"value": "double_parallel_reverse", "label": "Double Parallel Reverse"},
  {"value": "double_gate", "label": "Double Gate"},
  {"value": "roll", "label": "Roll Fold"},
  {"value": "accordion", "label": "Accordion Fold"}
]}', 'half', true, 1);

-- 10. Corner Rounding
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(10, 'Corner Rounding', 'corner-rounding', 'Rounded corners for professional finish', 'CUSTOM', 20, 0.01, 0, 'dropdown', 'below_upload', 10, false, true, 1);

-- Sub-options for Corner Rounding
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(10, 'corners', 'Which Corners', 'select', '{"options": [
  {"value": "all_four", "label": "All Four Corners"},
  {"value": "top_two", "label": "Top Two Corners"},
  {"value": "bottom_two", "label": "Bottom Two Corners"},
  {"value": "left_two", "label": "Left Two Corners"},
  {"value": "right_two", "label": "Right Two Corners"}
]}', 'all_four', true, 1),
(10, 'radius', 'Corner Radius', 'select', '{"options": [
  {"value": "1/8", "label": "1/8 inch"},
  {"value": "1/4", "label": "1/4 inch"},
  {"value": "3/16", "label": "3/16 inch"},
  {"value": "3/8", "label": "3/8 inch"},
  {"value": "1/2", "label": "1/2 inch"}
]}', '1/4', true, 2);

-- 11. Hole Drilling
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(11, 'Hole Drilling', 'hole-drilling', 'Custom hole drilling or binder punch', 'CUSTOM', 20, 0.02, 0, 'dropdown', 'below_upload', 11, false, true, 1);

-- Sub-options for Hole Drilling
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(11, 'hole_type', 'Hole Type', 'select', '{"options": [
  {"value": "custom_1", "label": "1 Custom Hole"},
  {"value": "custom_2", "label": "2 Custom Holes"},
  {"value": "custom_3", "label": "3 Custom Holes"},
  {"value": "binder_2", "label": "2-Hole Binder Punch"},
  {"value": "binder_3", "label": "3-Hole Binder Punch"}
]}', 'binder_3', true, 1),
(11, 'hole_position', 'Hole Position', 'text', NULL, NULL, false, 2),
(11, 'hole_size', 'Hole Size (diameter)', 'select', '{"options": [
  {"value": "5/16", "label": "5/16 inch (standard)"},
  {"value": "1/8", "label": "1/8 inch"},
  {"value": "1/4", "label": "1/4 inch"}
]}', '5/16', false, 3);

-- 12. Wafer Seal
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(12, 'Wafer Seal', 'wafer-seal', 'Clear adhesive seals for mailers', 'CUSTOM', 25, 0.02, 0, 'checkbox', 'below_upload', 12, false, true, 1);

-- Sub-options for Wafer Seal
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(12, 'seal_count', 'Number of Seals', 'number', NULL, '1', true, 1),
(12, 'seal_position', 'Seal Position', 'text', NULL, NULL, true, 2);

-- ========================================
-- PACKAGING OPTIONS (Below Upload) - 2 add-ons
-- Display Order: 13-14
-- ========================================

-- 13. Banding
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(13, 'Banding', 'banding', 'Bundle your prints with paper or rubber bands ($0.75/bundle)', 'CUSTOM', 0, 0.75, 0, 'checkbox', 'below_upload', 13, false, true, 1);

-- Sub-options for Banding
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(13, 'band_type', 'Band Type', 'select', '{"options": [{"value": "paper", "label": "Paper Bands"}, {"value": "rubber", "label": "Rubber Bands"}]}', 'paper', true, 1),
(13, 'bundle_size', 'Items Per Bundle', 'number', NULL, '100', true, 2);

-- 14. Shrink Wrapping
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(14, 'Shrink Wrapping', 'shrink-wrapping', 'Shrink wrap bundles for protection ($0.30/bundle)', 'CUSTOM', 0, 0.30, 0, 'checkbox', 'below_upload', 14, false, true, 1);

-- Sub-options for Shrink Wrapping
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(14, 'bundle_size', 'Items Per Bundle', 'number', NULL, '25', true, 1);

-- ========================================
-- PROOFS & QUALITY (Below Upload) - 1 add-on
-- Display Order: 15
-- ========================================

-- 15. Digital Proof
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(15, 'Digital Proof', 'digital-proof', 'PDF proof emailed before production', 'FLAT', 5, 0, 0, 'checkbox', 'below_upload', 15, false, true, 1);

-- ========================================
-- PERSONALIZATION (Below Upload) - 3 add-ons
-- Display Order: 16-18
-- ========================================

-- 16. Variable Data Printing
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(16, 'Variable Data Printing', 'variable-data-printing', 'Personalize each piece with unique data (names, addresses, QR codes)', 'CUSTOM', 60, 0.02, 0, 'checkbox', 'below_upload', 16, false, true, 2);

-- Sub-options for Variable Data
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(16, 'variable_count', 'Number of Variable Locations', 'number', NULL, '1', true, 1),
(16, 'variable_positions', 'Variable Data Positions', 'textarea', NULL, NULL, true, 2);

-- 17. Numbering
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(17, 'Numbering', 'numbering', 'Sequential numbering for tickets, invoices, etc.', 'PER_UNIT', 0, 0.03, 0, 'checkbox', 'below_upload', 17, false, true, 2);

-- Sub-options for Numbering
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(17, 'start_number', 'Starting Number', 'number', NULL, '1', true, 1),
(17, 'placement', 'Number Placement', 'select', '{"options": [{"value": "top_right", "label": "Top Right"}, {"value": "bottom_right", "label": "Bottom Right"}, {"value": "custom", "label": "Custom Position"}]}', 'top_right', true, 2);

-- 18. QR Code
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(18, 'QR Code', 'qr-code', 'Add a QR code to your design', 'FLAT', 5, 0, 0, 'checkbox', 'below_upload', 18, false, true, 0);

-- Sub-options for QR Code
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(18, 'qr_content', 'QR Code Content/URL', 'text', NULL, NULL, true, 1);

-- ========================================
-- DISCOUNTS & PRICING (Below Upload) - 2 add-ons
-- Display Order: 19-20
-- ========================================

-- 19. Our Tagline (Discount)
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(19, 'Our Tagline', 'our-tagline', 'Add our tagline for 5% discount on base price', 'PERCENTAGE', 0, 0, -5.00, 'checkbox', 'below_upload', 19, false, true, 0);

-- 20. Exact Size (Markup)
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(20, 'Exact Size', 'exact-size', 'Precise cutting to exact specifications (+12.5% markup)', 'PERCENTAGE', 0, 0, 12.50, 'checkbox', 'below_upload', 20, false, true, 0);

-- ========================================
-- SHIPPING & MAILING (Below Upload) - 2 add-ons
-- Display Order: 21-22
-- ========================================

-- 21. Postal Delivery (DDU)
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(21, 'Postal Delivery (DDU)', 'postal-delivery-ddu', 'EDDM postal delivery service ($30/box)', 'CUSTOM', 30, 0, 0, 'checkbox', 'below_upload', 21, false, false, 1);

-- 22. EDDM Process & Postage
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add, depends_on_add_on_id)
VALUES
(22, 'EDDM Process & Postage', 'eddm-process-postage', 'Every Door Direct Mail service with postage ($50 setup + $0.239/piece)', 'CUSTOM', 50, 0.239, 0, 'checkbox', 'below_upload', 22, false, false, 2, 13);

-- Sub-options for EDDM
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(22, 'route_selection', 'Route Selection', 'select', '{"options": [{"value": "customer", "label": "I Will Provide Routes"}, {"value": "provider", "label": "Select Routes For Me"}]}', 'customer', true, 1),
(22, 'routes', 'Route Numbers', 'textarea', NULL, NULL, false, 2);

-- ========================================
-- PREMIUM FINISHES (Below Upload) - 2 add-ons
-- Display Order: 23-24
-- ========================================

-- 23. Foil Stamping
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(23, 'Foil Stamping', 'foil-stamping', 'Metallic foil stamping (+25% on base price)', 'PERCENTAGE', 0, 0, 25.00, 'dropdown', 'below_upload', 23, false, true, 3);

-- Sub-options for Foil Stamping
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(23, 'foil_color', 'Foil Color', 'select', '{"options": [
  {"value": "gold", "label": "Gold"},
  {"value": "silver", "label": "Silver"},
  {"value": "rose_gold", "label": "Rose Gold"},
  {"value": "copper", "label": "Copper"}
]}', 'gold', true, 1);

-- 24. Spot UV
INSERT INTO add_ons (id, name, slug, description, pricing_model, base_price, per_unit_price, percentage, ui_component, position, display_order, is_mandatory_default, is_enabled_default, turnaround_days_add)
VALUES
(24, 'Spot UV', 'spot-uv', 'Raised UV coating for premium look (+20% on base price)', 'PERCENTAGE', 0, 0, 20.00, 'dropdown', 'below_upload', 24, false, true, 2);

-- Sub-options for Spot UV
INSERT INTO add_on_sub_options (add_on_id, field_name, field_label, field_type, options, default_value, is_required, display_order)
VALUES
(24, 'uv_coverage', 'Coverage Area', 'select', '{"options": [
  {"value": "logo", "label": "Logo Only"},
  {"value": "text", "label": "Text Only"},
  {"value": "custom", "label": "Custom Pattern"}
]}', 'logo', true, 1);

-- Reset sequence
SELECT setval('add_ons_id_seq', (SELECT MAX(id) FROM add_ons));
SELECT setval('add_on_sub_options_id_seq', (SELECT MAX(id) FROM add_on_sub_options));

-- Verify counts
DO $$
DECLARE
  addon_count INTEGER;
  suboption_count INTEGER;
  above_upload_count INTEGER;
  below_upload_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO addon_count FROM add_ons;
  SELECT COUNT(*) INTO suboption_count FROM add_on_sub_options;
  SELECT COUNT(*) INTO above_upload_count FROM add_ons WHERE position = 'above_upload';
  SELECT COUNT(*) INTO below_upload_count FROM add_ons WHERE position = 'below_upload';

  RAISE NOTICE 'Add-ons seeding complete:';
  RAISE NOTICE '  - Total add-ons: %', addon_count;
  RAISE NOTICE '  - Above upload: %', above_upload_count;
  RAISE NOTICE '  - Below upload: %', below_upload_count;
  RAISE NOTICE '  - Sub-options: %', suboption_count;
END $$;
