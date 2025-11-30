-- Migration 019: Quick 9pt Products System
-- Creates "Quick 9pt Sizes" category with simplified fixed-size products

-- =====================================================
-- CREATE QUICK 9PT CATEGORY
-- =====================================================
INSERT INTO categories (name, slug, description, sort_order, is_active)
VALUES (
  'Quick 9pt Sizes',
  'quick-9pt-sizes',
  'Fast ordering for popular 9pt cardstock sizes. Pre-configured for quick checkout.',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- ADD is_quick_product FLAG TO PRODUCTS TABLE
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_quick_product') THEN
    ALTER TABLE products ADD COLUMN is_quick_product BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fixed_width') THEN
    ALTER TABLE products ADD COLUMN fixed_width DECIMAL(8, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fixed_height') THEN
    ALTER TABLE products ADD COLUMN fixed_height DECIMAL(8, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fixed_paper_stock_id') THEN
    ALTER TABLE products ADD COLUMN fixed_paper_stock_id INTEGER REFERENCES paper_stocks(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fixed_coating_id') THEN
    ALTER TABLE products ADD COLUMN fixed_coating_id INTEGER REFERENCES coatings(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fixed_sides') THEN
    ALTER TABLE products ADD COLUMN fixed_sides VARCHAR(20) DEFAULT 'double';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_quick ON products(is_quick_product) WHERE is_quick_product = true;

-- =====================================================
-- CREATE 4x6 QUICK 9PT PRODUCT
-- =====================================================
INSERT INTO products (
  sku,
  name,
  slug,
  description,
  base_price,
  status,
  product_type,
  category_id,
  is_quick_product,
  fixed_width,
  fixed_height,
  fixed_paper_stock_id,
  fixed_coating_id,
  fixed_sides,
  has_custom_size,
  is_featured,
  display_order
)
SELECT
  'QUICK-9PT-4X6',
  '4×6 Postcards',
  'quick-4x6-postcards',
  '4×6 postcards on 9pt C2S cardstock with Gloss Aqueous coating. Perfect for direct mail, event promotions, and marketing.',
  8.46,
  'active',
  'flyer',
  c.id,
  true,
  4.0,
  6.0,
  3,  -- 9pt C2S paper_stock_id
  2,  -- Gloss Aqueous coating_id
  'double',
  false,
  true,
  1
FROM categories c WHERE c.slug = 'quick-9pt-sizes'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  is_quick_product = EXCLUDED.is_quick_product,
  fixed_width = EXCLUDED.fixed_width,
  fixed_height = EXCLUDED.fixed_height,
  fixed_paper_stock_id = EXCLUDED.fixed_paper_stock_id,
  fixed_coating_id = EXCLUDED.fixed_coating_id,
  fixed_sides = EXCLUDED.fixed_sides,
  has_custom_size = EXCLUDED.has_custom_size,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order;

-- =====================================================
-- CREATE 5.5x8.5 QUICK 9PT PRODUCT
-- =====================================================
INSERT INTO products (
  sku,
  name,
  slug,
  description,
  base_price,
  status,
  product_type,
  category_id,
  is_quick_product,
  fixed_width,
  fixed_height,
  fixed_paper_stock_id,
  fixed_coating_id,
  fixed_sides,
  has_custom_size,
  is_featured,
  display_order
)
SELECT
  'QUICK-9PT-5.5X8.5',
  '5.5×8.5 Half-Page Flyers',
  'quick-5-5x8-5-flyers',
  '5.5×8.5 flyers on 9pt C2S cardstock with Gloss Aqueous coating. Great for handouts and promotional materials.',
  12.50,
  'active',
  'flyer',
  c.id,
  true,
  5.5,
  8.5,
  3,
  2,
  'double',
  false,
  true,
  2
FROM categories c WHERE c.slug = 'quick-9pt-sizes'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  is_quick_product = EXCLUDED.is_quick_product,
  fixed_width = EXCLUDED.fixed_width,
  fixed_height = EXCLUDED.fixed_height,
  fixed_paper_stock_id = EXCLUDED.fixed_paper_stock_id,
  fixed_coating_id = EXCLUDED.fixed_coating_id,
  fixed_sides = EXCLUDED.fixed_sides,
  has_custom_size = EXCLUDED.has_custom_size,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order;

-- =====================================================
-- CREATE 8.5x11 QUICK 9PT PRODUCT
-- =====================================================
INSERT INTO products (
  sku,
  name,
  slug,
  description,
  base_price,
  status,
  product_type,
  category_id,
  is_quick_product,
  fixed_width,
  fixed_height,
  fixed_paper_stock_id,
  fixed_coating_id,
  fixed_sides,
  has_custom_size,
  is_featured,
  display_order
)
SELECT
  'QUICK-9PT-8.5X11',
  '8.5×11 Full-Page Flyers',
  'quick-8-5x11-flyers',
  '8.5×11 full-page flyers on 9pt C2S cardstock with Gloss Aqueous coating. Standard letter size for maximum impact.',
  18.75,
  'active',
  'flyer',
  c.id,
  true,
  8.5,
  11.0,
  3,
  2,
  'double',
  false,
  true,
  3
FROM categories c WHERE c.slug = 'quick-9pt-sizes'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  is_quick_product = EXCLUDED.is_quick_product,
  fixed_width = EXCLUDED.fixed_width,
  fixed_height = EXCLUDED.fixed_height,
  fixed_paper_stock_id = EXCLUDED.fixed_paper_stock_id,
  fixed_coating_id = EXCLUDED.fixed_coating_id,
  fixed_sides = EXCLUDED.fixed_sides,
  has_custom_size = EXCLUDED.has_custom_size,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order;

-- =====================================================
-- CREATE 4x9 RACK CARD QUICK 9PT PRODUCT
-- =====================================================
INSERT INTO products (
  sku,
  name,
  slug,
  description,
  base_price,
  status,
  product_type,
  category_id,
  is_quick_product,
  fixed_width,
  fixed_height,
  fixed_paper_stock_id,
  fixed_coating_id,
  fixed_sides,
  has_custom_size,
  is_featured,
  display_order
)
SELECT
  'QUICK-9PT-4X9',
  '4×9 Rack Cards',
  'quick-4x9-rack-cards',
  '4×9 rack cards on 9pt C2S cardstock with Gloss Aqueous coating. Perfect for brochure stands and information displays.',
  10.50,
  'active',
  'flyer',
  c.id,
  true,
  4.0,
  9.0,
  3,
  2,
  'double',
  false,
  true,
  4
FROM categories c WHERE c.slug = 'quick-9pt-sizes'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  is_quick_product = EXCLUDED.is_quick_product,
  fixed_width = EXCLUDED.fixed_width,
  fixed_height = EXCLUDED.fixed_height,
  fixed_paper_stock_id = EXCLUDED.fixed_paper_stock_id,
  fixed_coating_id = EXCLUDED.fixed_coating_id,
  fixed_sides = EXCLUDED.fixed_sides,
  has_custom_size = EXCLUDED.has_custom_size,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN products.is_quick_product IS 'Quick products have fixed configurations for faster checkout';
COMMENT ON COLUMN products.fixed_width IS 'Fixed width in inches for quick products';
COMMENT ON COLUMN products.fixed_height IS 'Fixed height in inches for quick products';
COMMENT ON COLUMN products.fixed_paper_stock_id IS 'Fixed paper stock for quick products';
COMMENT ON COLUMN products.fixed_coating_id IS 'Fixed coating for quick products';
COMMENT ON COLUMN products.fixed_sides IS 'Fixed sides option for quick products (single/double)';
