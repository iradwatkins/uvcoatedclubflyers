-- Seed Data Part 4: First Product - 4×6 Postcards
-- Creates a fully configured postcard product with all add-ons properly arranged

-- ========================================
-- INSERT FIRST PRODUCT: 4×6 POSTCARDS
-- ========================================
INSERT INTO products (
  id,
  name,
  slug,
  description,
  category,
  base_price,
  image_url,
  is_active,
  is_featured,
  display_order,
  -- Product configuration
  default_paper_stock_id,
  default_coating_id,
  default_turnaround_id,
  -- Size options
  has_custom_size,
  min_width,
  max_width,
  min_height,
  max_height,
  -- SEO
  meta_title,
  meta_description
)
VALUES (
  1,
  '4×6 Postcards',
  '4x6-postcards',
  'Premium 4×6 postcards perfect for marketing, invitations, and announcements. Choose from multiple paper stocks and finishes.',
  'POSTCARDS',
  0, -- Base price calculated dynamically
  '/images/products/4x6-postcard.jpg',
  true,
  true,
  1,
  -- Defaults: 12pt C2S Cardstock, Matte Aqueous, 2-4 Days Standard
  5, -- 12pt C2S Cardstock (ID: 5)
  3, -- Matte Aqueous (ID: 3)
  6, -- 2-4 Days Standard (ID: 6)
  -- Size restrictions
  false, -- Only standard 4×6 size allowed
  4.0,
  4.0,
  6.0,
  6.0,
  -- SEO
  '4x6 Postcards - Premium Printing | UV Coated Club Flyers',
  'Order high-quality 4x6 postcards with custom designs. Choose from multiple paper stocks, UV coating options, and fast turnaround times. Free shipping on orders over $75.'
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  default_paper_stock_id = EXCLUDED.default_paper_stock_id,
  default_coating_id = EXCLUDED.default_coating_id,
  default_turnaround_id = EXCLUDED.default_turnaround_id;

-- ========================================
-- ASSIGN STANDARD SIZE: 4×6
-- ========================================
INSERT INTO product_standard_sizes (product_id, standard_size_id, is_default)
VALUES (1, 2, true) -- 4×6 Postcard (standard_sizes ID: 2)
ON CONFLICT (product_id, standard_size_id) DO NOTHING;

-- ========================================
-- CONFIGURE PRODUCT ADD-ONS
-- Organized by position: above_upload first, then below_upload
-- ========================================

-- ==========================================
-- ABOVE UPLOAD (Design Services) - Order 1-6
-- ==========================================

-- 1. Upload My Artwork (FREE - Default enabled)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 1, true, false, 'above_upload', 1)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 2. Standard Custom Design ($75/$120)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 2, true, false, 'above_upload', 2)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 3. Rush Custom Design ($125/$200)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 3, true, false, 'above_upload', 3)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 4. Minor Design Changes ($15)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 4, true, false, 'above_upload', 4)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 5. Major Design Changes ($40)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 5, true, false, 'above_upload', 5)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 6. Upload Artwork Later
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 6, true, false, 'above_upload', 6)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- ==========================================
-- BELOW UPLOAD (Finishing & Options) - Order 1-18
-- ==========================================

-- 7. Perforation ($20 + $0.01/piece)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 7, true, false, 'below_upload', 1)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 8. Folding ($20 + $0.01/piece)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 8, true, false, 'below_upload', 2)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 9. Drilling ($30 + $0.015/piece)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 9, true, false, 'below_upload', 3)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 10. Padding ($35 + $0.08/pad)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 10, true, false, 'below_upload', 4)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 11. Corner Rounding ($25 + $0.015/piece)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 11, true, false, 'below_upload', 5)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 12. Numbering ($35 + $0.02/piece)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 12, true, false, 'below_upload', 6)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 13. Shrink Wrapping ($25 + $0.10/bundle)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 13, true, false, 'below_upload', 7)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 14. Custom Packaging ($50)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 14, true, false, 'below_upload', 8)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 15. Hard Proof ($20)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 15, true, false, 'below_upload', 9)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 16. PDF Proof (FREE - Default enabled)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 16, true, false, 'below_upload', 10)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 17. Variable Data Printing ($75 setup)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 17, true, false, 'below_upload', 11)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 18. Sequential Numbering ($45)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 18, true, false, 'below_upload', 12)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 19. Our Tagline (5% discount)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 19, true, false, 'below_upload', 13)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 20. Exact Size (+12.5% markup)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 20, true, false, 'below_upload', 14)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 21. Ship to Multiple Addresses ($25 + $0.50/address)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 21, true, false, 'below_upload', 15)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 22. Blind Shipping ($15)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 22, true, false, 'below_upload', 16)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 23. Premium Paper Upgrade (+25%)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 23, true, false, 'below_upload', 17)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- 24. Color Matching Service ($50)
INSERT INTO product_add_ons (product_id, add_on_id, is_enabled, is_mandatory, position, display_order)
VALUES (1, 24, true, false, 'below_upload', 18)
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  display_order = EXCLUDED.display_order;

-- ========================================
-- VERIFICATION
-- ========================================
DO $$
DECLARE
  product_count INTEGER;
  addon_count INTEGER;
  above_count INTEGER;
  below_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products WHERE id = 1;
  SELECT COUNT(*) INTO addon_count FROM product_add_ons WHERE product_id = 1;
  SELECT COUNT(*) INTO above_count FROM product_add_ons WHERE product_id = 1 AND position = 'above_upload';
  SELECT COUNT(*) INTO below_count FROM product_add_ons WHERE product_id = 1 AND position = 'below_upload';

  IF product_count = 1 THEN
    RAISE NOTICE 'SUCCESS: Created product "4×6 Postcards"';
    RAISE NOTICE '  - Total add-ons configured: %', addon_count;
    RAISE NOTICE '  - Above upload (Design): %', above_count;
    RAISE NOTICE '  - Below upload (Finishing): %', below_count;
    RAISE NOTICE '  - Default paper: 12pt C2S Cardstock';
    RAISE NOTICE '  - Default coating: Matte Aqueous';
    RAISE NOTICE '  - Default turnaround: 2-4 Days Standard';
  ELSE
    RAISE WARNING 'Product creation may have failed';
  END IF;
END $$;
