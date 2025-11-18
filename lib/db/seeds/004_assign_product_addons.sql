-- Assign all add-ons to UV Coated Club Flyers product (product_id = 1)
-- Feature Shrink Wrapping as the first add-on in Packaging category

-- First, clear any existing assignments for this product
DELETE FROM product_addons WHERE product_id = 1;

-- Packaging & Bundling (display_order: 1-2, Shrink Wrapping featured first)
INSERT INTO product_addons (product_id, addon_id, is_default, display_order) VALUES
  (1, 14, false, 1),  -- Shrink Wrapping (FEATURED)
  (1, 13, false, 2);  -- Banding

-- Finishing Options (display_order: 3-8)
INSERT INTO product_addons (product_id, addon_id, is_default, display_order) VALUES
  (1, 8, false, 3),   -- Perforation
  (1, 9, false, 4),   -- Score Only
  (1, 10, false, 5),  -- Folding
  (1, 11, false, 6),  -- Corner Rounding
  (1, 12, false, 7),  -- Hole Drilling
  (1, 15, false, 8);  -- Wafer Seal

-- Design Services (display_order: 9-14)
INSERT INTO product_addons (product_id, addon_id, is_default, display_order) VALUES
  (1, 1, false, 9),   -- Upload My Artwork
  (1, 2, false, 10),  -- Standard Custom Design
  (1, 3, false, 11),  -- Rush Custom Design
  (1, 4, false, 12),  -- Mailing List/EDDM
  (1, 5, false, 13),  -- Advanced Variable Data
  (1, 7, false, 14);  -- High-Res Image Enhancement

-- Proofs & Quality Control (display_order: 15)
INSERT INTO product_addons (product_id, addon_id, is_default, display_order) VALUES
  (1, 6, false, 15);  -- Hard Copy Proof

-- Personalization (display_order: 16-18)
INSERT INTO product_addons (product_id, addon_id, is_default, display_order) VALUES
  (1, 18, false, 16), -- Consecutive Numbering
  (1, 19, false, 17), -- Custom QR Codes
  (1, 20, false, 18); -- Personalized Names/Addresses

-- Premium Finishes (display_order: 19-20)
INSERT INTO product_addons (product_id, addon_id, is_default, display_order) VALUES
  (1, 22, false, 19), -- Spot UV Coating
  (1, 23, false, 20); -- Foil Stamping

-- Pricing & Discounts (display_order: 21-22)
INSERT INTO product_addons (product_id, addon_id, is_default, display_order) VALUES
  (1, 16, false, 21), -- Bulk Order Discount
  (1, 17, false, 22); -- Loyalty/Repeat Customer Discount

-- Shipping & Mailing (display_order: 23-24)
INSERT INTO product_addons (product_id, addon_id, is_default, display_order) VALUES
  (1, 21, false, 23), -- Direct Mail Service
  (1, 24, false, 24); -- Expedited Shipping

-- Verify assignments
SELECT COUNT(*) as total_addons_assigned FROM product_addons WHERE product_id = 1;
