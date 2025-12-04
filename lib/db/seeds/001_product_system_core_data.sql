-- Seed Data Part 1: Core Product System Data
-- Paper Stocks, Coatings, Turnarounds, Markup Rules, Standard Sizes

-- ========================================
-- 1. PAPER STOCKS (7 stocks)
-- ========================================
-- Note: For 12pt and 14pt, we store their ACTUAL costs but reference their pricing groups

-- 9pt C2S Cardstock (base for 12pt pricing)
INSERT INTO paper_stocks (id, name, slug, description, base_cost_per_sq_in, weight_per_sq_in, type, thickness, sides_multiplier_single, sides_multiplier_double, special_markup, pricing_group_id, markup, is_active, display_order)
VALUES
(1, '9pt C2S Cardstock', '9pt-c2s-cardstock', '9pt thick - Standard cardstock, coated both sides. Best for: flyers, promotional materials, budget-friendly projects. Coating: Gloss Aqueous.', 0.0010, 0.000333333333, 'CARDSTOCK', '9pt', 1.0, 1.0, NULL, NULL, 1.7, true, 2)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  base_cost_per_sq_in = EXCLUDED.base_cost_per_sq_in,
  weight_per_sq_in = EXCLUDED.weight_per_sq_in,
  markup = EXCLUDED.markup;

-- 16pt C2S Cardstock (base for 14pt pricing)
INSERT INTO paper_stocks (id, name, slug, description, base_cost_per_sq_in, weight_per_sq_in, type, thickness, sides_multiplier_single, sides_multiplier_double, special_markup, pricing_group_id, markup, is_active, display_order)
VALUES
(2, '16pt C2S Cardstock', '16pt-c2s-cardstock', '16pt thick - Extra premium cardstock with luxury feel. Best for: executive business cards, VIP invitations, premium marketing. Coatings: Matte or High Gloss UV.', 0.0015, 0.000415, 'CARDSTOCK', '16pt', 1.0, 1.0, NULL, NULL, 1.0, true, 6)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  base_cost_per_sq_in = EXCLUDED.base_cost_per_sq_in,
  weight_per_sq_in = EXCLUDED.weight_per_sq_in,
  markup = EXCLUDED.markup;

-- 60 lb Offset
INSERT INTO paper_stocks (id, name, slug, description, base_cost_per_sq_in, weight_per_sq_in, type, thickness, sides_multiplier_single, sides_multiplier_double, special_markup, pricing_group_id, markup, is_active, display_order)
VALUES
(3, '60 lb Offset', '60lb-offset', 'Text weight - Lightweight uncoated paper, writable surface. Best for: letterhead, NCR forms, inserts, booklets. No coating available.', 0.0008, 0.000133333333, 'TEXT', 'Text weight', 1.0, 1.75, NULL, NULL, 1.0, true, 1)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  base_cost_per_sq_in = EXCLUDED.base_cost_per_sq_in,
  weight_per_sq_in = EXCLUDED.weight_per_sq_in,
  markup = EXCLUDED.markup;

-- 100 lb Gloss Text
INSERT INTO paper_stocks (id, name, slug, description, base_cost_per_sq_in, weight_per_sq_in, type, thickness, sides_multiplier_single, sides_multiplier_double, special_markup, pricing_group_id, markup, is_active, display_order)
VALUES
(4, '100 lb Gloss Text', '100lb-gloss-text', 'Heavy text weight - Glossy coated paper, vibrant colors. Best for: brochures, catalogs, magazine inserts. Coating: Gloss Aqueous.', 0.0010, 0.000225, 'TEXT', 'Text weight (heavy)', 1.0, 1.75, NULL, NULL, 1.0, true, 3)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  base_cost_per_sq_in = EXCLUDED.base_cost_per_sq_in,
  weight_per_sq_in = EXCLUDED.weight_per_sq_in,
  markup = EXCLUDED.markup;

-- 12pt C2S Cardstock (uses 9pt pricing with 2.0x markup)
INSERT INTO paper_stocks (id, name, slug, description, base_cost_per_sq_in, weight_per_sq_in, type, thickness, sides_multiplier_single, sides_multiplier_double, special_markup, pricing_group_id, markup, is_active, display_order)
VALUES
(5, '12pt C2S Cardstock', '12pt-c2s-cardstock', '12pt thick - Popular medium cardstock, good rigidity. Best for: postcards, door hangers, rack cards. Coatings: Matte or High Gloss UV.', 0.0012, 0.00035, 'CARDSTOCK', '12pt', 1.0, 1.0, 2.0, 1, 1.0, true, 4)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  base_cost_per_sq_in = EXCLUDED.base_cost_per_sq_in,
  weight_per_sq_in = EXCLUDED.weight_per_sq_in,
  special_markup = EXCLUDED.special_markup,
  pricing_group_id = EXCLUDED.pricing_group_id,
  markup = EXCLUDED.markup;

-- 100 lb Uncoated Cover
INSERT INTO paper_stocks (id, name, slug, description, base_cost_per_sq_in, weight_per_sq_in, type, thickness, sides_multiplier_single, sides_multiplier_double, special_markup, pricing_group_id, markup, is_active, display_order)
VALUES
(6, '100 lb Uncoated Cover', '100lb-uncoated-cover', 'Cover weight - Natural uncoated finish, writable surface. Best for: letterhead, presentation folders, eco-friendly materials. No coating available.', 0.0013, 0.000383333333, 'COVER', '~14pt', 1.0, 1.0, NULL, NULL, 1.0, true, 5)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  base_cost_per_sq_in = EXCLUDED.base_cost_per_sq_in,
  weight_per_sq_in = EXCLUDED.weight_per_sq_in,
  markup = EXCLUDED.markup;

-- 14pt C2S Cardstock (uses 16pt pricing with 2.0x markup)
INSERT INTO paper_stocks (id, name, slug, description, base_cost_per_sq_in, weight_per_sq_in, type, thickness, sides_multiplier_single, sides_multiplier_double, special_markup, pricing_group_id, markup, is_active, display_order)
VALUES
(7, '14pt C2S Cardstock', '14pt-c2s-cardstock', '14pt thick - Premium cardstock, excellent durability. Best for: business cards, postcards, hang tags. Coatings: Matte or High Gloss UV.', 0.0013, 0.000415, 'CARDSTOCK', '14pt', 1.0, 1.0, 2.0, 2, 1.0, true, 7)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  base_cost_per_sq_in = EXCLUDED.base_cost_per_sq_in,
  weight_per_sq_in = EXCLUDED.weight_per_sq_in,
  special_markup = EXCLUDED.special_markup,
  pricing_group_id = EXCLUDED.pricing_group_id,
  markup = EXCLUDED.markup;

-- Reset sequence
SELECT setval('paper_stocks_id_seq', (SELECT MAX(id) FROM paper_stocks));

-- ========================================
-- 2. COATINGS (5 coatings)
-- ========================================
INSERT INTO coatings (id, name, slug, description, is_active, display_order)
VALUES
(1, 'No Coating', 'no-coating', 'Uncoated - natural paper finish, writable surface', true, 1),
(2, 'Gloss Aqueous', 'gloss-aqueous', 'Standard glossy coating - protects and adds shine', true, 2),
(3, 'Matte Aqueous', 'matte-aqueous', 'Non-reflective matte finish - elegant appearance', true, 3),
(4, 'High Gloss UV (One Side)', 'high-gloss-uv-one-side', 'Premium UV coating on front only - maximum shine', true, 4),
(5, 'High Gloss UV (Both Sides)', 'high-gloss-uv-both-sides', 'Premium UV coating on both sides - ultimate protection', true, 5)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

SELECT setval('coatings_id_seq', (SELECT MAX(id) FROM coatings));

-- ========================================
-- 3. PAPER STOCK COATINGS (Compatibility)
-- ========================================
-- Clear existing compatibility and rebuild
DELETE FROM paper_stock_coatings;

-- 60 lb Offset → No Coating (only option)
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (3, 1, true);

-- 9pt C2S Cardstock → Gloss Aqueous (only option)
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (1, 2, true);

-- 100 lb Gloss Text → Gloss Aqueous (only option)
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (4, 2, true);

-- 12pt C2S Cardstock → Matte Aqueous, High Gloss UV (One Side), High Gloss UV (Both Sides)
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (5, 3, true);
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (5, 4, false);
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (5, 5, false);

-- 100 lb Uncoated Cover → No Coating (only option)
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (6, 1, true);

-- 14pt C2S Cardstock → Matte Aqueous, High Gloss UV (One Side), High Gloss UV (Both Sides)
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (7, 3, true);
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (7, 4, false);
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (7, 5, false);

-- 16pt C2S Cardstock → Matte Aqueous, High Gloss UV (One Side), High Gloss UV (Both Sides)
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (2, 3, true);
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (2, 4, false);
INSERT INTO paper_stock_coatings (paper_stock_id, coating_id, is_default) VALUES (2, 5, false);

-- ========================================
-- 4. TURNAROUNDS (8 turnaround options)
-- ========================================
INSERT INTO turnarounds (id, name, slug, description, production_days, cutoff_time, category, is_active, display_order)
VALUES
(1, 'Same Day', 'same-day', 'Ships same business day (order before 9 AM EST)', 0, '09:00:00', 'crazy_fast', true, 1),
(2, 'Next Day', 'next-day', 'Variable 1-2 day turnaround', 1, '22:00:00', 'faster', true, 2),
(3, 'Next Day Guaranteed', 'next-day-guaranteed', 'Guaranteed 1 business day', 1, '22:00:00', 'faster', true, 3),
(4, '1-2 Days', '1-2-days', '2 business days', 2, '22:00:00', 'fast', true, 4),
(5, '2-3 Days', '2-3-days', '3 business days', 3, '22:00:00', 'fast', true, 5),
(6, '2-4 Days (Standard)', '2-4-days', 'Standard turnaround - 4 business days', 4, '22:00:00', 'economy', true, 6),
(7, '3-4 Days', '3-4-days', '4 business days', 4, '22:00:00', 'economy', true, 7),
(8, '5-7 Days', '5-7-days', '7 business days - best value', 7, '22:00:00', 'economy', true, 8)
ON CONFLICT (name) DO UPDATE SET
  production_days = EXCLUDED.production_days,
  cutoff_time = EXCLUDED.cutoff_time,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order;

SELECT setval('turnarounds_id_seq', (SELECT MAX(id) FROM turnarounds));

-- ========================================
-- 5. MARKUP RULES (4 categories)
-- ========================================
INSERT INTO markup_rules (id, turnaround_category, markup_percentage, multiplier, description)
VALUES
(1, 'economy', 130.8, 2.308, 'Economy turnaround markup (2-7 days)'),
(2, 'fast', 130.8, 2.308, 'Fast turnaround markup (1-3 days)'),
(3, 'faster', 126.6, 2.266, 'Faster turnaround markup (Next Day)'),
(4, 'crazy_fast', 0.0, 1.0, 'Same Day - no markup, base cost only')
ON CONFLICT (turnaround_category) DO UPDATE SET
  markup_percentage = EXCLUDED.markup_percentage,
  multiplier = EXCLUDED.multiplier,
  description = EXCLUDED.description;

SELECT setval('markup_rules_id_seq', (SELECT MAX(id) FROM markup_rules));

-- ========================================
-- 6. STANDARD SIZES (Common print sizes)
-- ========================================
INSERT INTO standard_sizes (id, name, width, height, description, is_active, display_order)
VALUES
(1, 'Business Card', 3.5, 2.0, 'Standard business card size', true, 1),
(2, '4×6 Postcard', 4.0, 6.0, 'Standard postcard size', true, 2),
(3, '5×7 Postcard', 5.0, 7.0, 'Large postcard size', true, 3),
(4, '5.5×8.5', 5.5, 8.5, 'Half letter size', true, 4),
(5, '6×9 Postcard', 6.0, 9.0, 'Extra large postcard', true, 5),
(6, '6×11 Postcard', 6.0, 11.0, 'Oversized postcard', true, 6),
(7, '4.25×5.5 (Quarter Page)', 4.25, 5.5, 'Quarter page flyer', true, 7),
(8, '5.33×8.83 (Half Page)', 5.33, 8.83, 'Half page flyer', true, 8),
(9, '8.5×11 (Letter)', 8.5, 11.0, 'Standard letter size', true, 9),
(10, '8.5×14 (Legal)', 8.5, 14.0, 'Legal size', true, 10),
(11, '11×17 (Tabloid)', 11.0, 17.0, 'Tabloid size', true, 11)
ON CONFLICT (name) DO UPDATE SET
  width = EXCLUDED.width,
  height = EXCLUDED.height,
  description = EXCLUDED.description;

SELECT setval('standard_sizes_id_seq', (SELECT MAX(id) FROM standard_sizes));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Core product system data seeded successfully:';
  RAISE NOTICE '  - 7 Paper Stocks with precise pricing and weights';
  RAISE NOTICE '  - 5 Coating options';
  RAISE NOTICE '  - Paper stock coating compatibility configured';
  RAISE NOTICE '  - 8 Turnaround time options';
  RAISE NOTICE '  - 4 Markup rules';
  RAISE NOTICE '  - 11 Standard sizes';
END $$;
