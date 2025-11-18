-- Migration 014: Product System with Paper Stocks, Add-ons, and Pricing
-- Square inch based pricing model for printing products

-- =====================================================
-- PAPER STOCKS TABLE
-- Stores paper types with per square inch pricing and weight
-- =====================================================
CREATE TABLE IF NOT EXISTS paper_stocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  -- Pricing (per square inch)
  base_cost_per_sq_in DECIMAL(10, 10) NOT NULL, -- e.g., 0.0010 for 9pt C2S

  -- Weight (per square inch in pounds)
  weight_per_sq_in DECIMAL(12, 12) NOT NULL, -- e.g., 0.000333333333 for 9pt C2S

  -- Stock properties
  type VARCHAR(50) NOT NULL, -- TEXT, CARDSTOCK, COVER
  thickness VARCHAR(50), -- e.g., "9pt", "Text weight"

  -- Sides multipliers
  sides_multiplier_single DECIMAL(4, 2) NOT NULL DEFAULT 1.0, -- 4/0 (one-sided)
  sides_multiplier_double DECIMAL(4, 2) NOT NULL DEFAULT 1.0, -- 4/4 (both-sided)

  -- Special pricing rules
  special_markup DECIMAL(4, 2), -- e.g., 2.0 for 12pt and 14pt
  pricing_group_id INTEGER REFERENCES paper_stocks(id), -- 12pt uses 9pt pricing, 14pt uses 16pt pricing

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_paper_stocks_slug ON paper_stocks(slug);
CREATE INDEX idx_paper_stocks_type ON paper_stocks(type);
CREATE INDEX idx_paper_stocks_active ON paper_stocks(is_active);

-- =====================================================
-- COATINGS TABLE
-- Coating/finishing options for paper stocks
-- =====================================================
CREATE TABLE IF NOT EXISTS coatings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coatings_slug ON coatings(slug);

-- =====================================================
-- PAPER STOCK COATINGS (Junction Table)
-- Defines which coatings are compatible with which paper stocks
-- =====================================================
CREATE TABLE IF NOT EXISTS paper_stock_coatings (
  paper_stock_id INTEGER NOT NULL REFERENCES paper_stocks(id) ON DELETE CASCADE,
  coating_id INTEGER NOT NULL REFERENCES coatings(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,

  PRIMARY KEY (paper_stock_id, coating_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_paper_stock_coatings_paper ON paper_stock_coatings(paper_stock_id);
CREATE INDEX idx_paper_stock_coatings_coating ON paper_stock_coatings(coating_id);

-- =====================================================
-- TURNAROUNDS TABLE
-- Production turnaround time options
-- =====================================================
CREATE TABLE IF NOT EXISTS turnarounds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  production_days INTEGER NOT NULL, -- Business days for production
  cutoff_time TIME NOT NULL DEFAULT '22:00:00', -- Order cutoff time (EST)

  -- Category for markup rules
  category VARCHAR(50) NOT NULL, -- economy, fast, faster, crazy_fast

  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_turnarounds_slug ON turnarounds(slug);
CREATE INDEX idx_turnarounds_category ON turnarounds(category);

-- =====================================================
-- TURNAROUND MULTIPLIERS TABLE
-- Quantity-specific pricing multipliers for each turnaround/paper combination
-- 224 records: 7 papers × 8 quantities × 4 categories
-- =====================================================
CREATE TABLE IF NOT EXISTS turnaround_multipliers (
  id SERIAL PRIMARY KEY,
  paper_stock_id INTEGER NOT NULL REFERENCES paper_stocks(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL, -- 25, 50, 100, 250, 500, 1000, 2500, 5000
  turnaround_category VARCHAR(50) NOT NULL, -- economy, fast, faster, crazy_fast
  multiplier DECIMAL(10, 2) NOT NULL, -- e.g., 14.10 for 25 qty economy on 9pt

  UNIQUE (paper_stock_id, quantity, turnaround_category),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_turnaround_mult_paper ON turnaround_multipliers(paper_stock_id);
CREATE INDEX idx_turnaround_mult_qty ON turnaround_multipliers(quantity);
CREATE INDEX idx_turnaround_mult_category ON turnaround_multipliers(turnaround_category);

-- =====================================================
-- ADD-ONS TABLE
-- Product add-ons with positioning and ordering
-- =====================================================
CREATE TABLE IF NOT EXISTS add_ons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,

  -- Pricing model
  pricing_model VARCHAR(50) NOT NULL, -- FLAT, PERCENTAGE, PER_UNIT, CUSTOM
  base_price DECIMAL(10, 2) DEFAULT 0, -- Setup fee or flat price
  per_unit_price DECIMAL(10, 4) DEFAULT 0, -- Per-piece price
  percentage DECIMAL(5, 2) DEFAULT 0, -- Percentage markup/discount

  -- UI configuration
  ui_component VARCHAR(50) NOT NULL, -- checkbox, dropdown, radio, textarea

  -- Positioning on product page
  position VARCHAR(50) NOT NULL DEFAULT 'below_upload', -- above_upload, below_upload
  display_order INTEGER NOT NULL DEFAULT 0, -- For drag-and-drop ordering

  -- Default settings
  is_mandatory_default BOOLEAN NOT NULL DEFAULT false,
  is_enabled_default BOOLEAN NOT NULL DEFAULT true,

  -- Turnaround impact
  turnaround_days_add INTEGER DEFAULT 0, -- Additional days added to production

  -- Dependencies
  depends_on_add_on_id INTEGER REFERENCES add_ons(id), -- Auto-enabled when another add-on is selected
  conflicts_with_add_on_id INTEGER REFERENCES add_ons(id), -- Cannot be selected with another add-on

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_add_ons_slug ON add_ons(slug);
CREATE INDEX idx_add_ons_position ON add_ons(position);
CREATE INDEX idx_add_ons_order ON add_ons(display_order);

-- =====================================================
-- ADD-ON SUB-OPTIONS TABLE
-- Dynamic fields for complex add-ons (perforation, folding, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS add_on_sub_options (
  id SERIAL PRIMARY KEY,
  add_on_id INTEGER NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,

  field_name VARCHAR(100) NOT NULL, -- e.g., "how_many_vertical", "fold_type"
  field_label VARCHAR(150) NOT NULL, -- Display label for UI
  field_type VARCHAR(50) NOT NULL, -- text, number, select, radio, checkbox

  -- Field configuration
  options JSONB, -- For select/radio/checkbox: {options: [{value, label}]}
  default_value TEXT,

  -- Validation
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_value DECIMAL(10, 2),
  max_value DECIMAL(10, 2),
  pattern VARCHAR(255), -- Regex pattern for text validation

  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_add_on_sub_options_add_on ON add_on_sub_options(add_on_id);

-- =====================================================
-- PRODUCTS TABLE
-- Alter existing products table to add printing-specific columns
-- =====================================================
-- Note: products table already exists from earlier migration
-- Adding new columns for printing product system

DO $$
BEGIN
  -- Add slug column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
    ALTER TABLE products ADD COLUMN slug VARCHAR(200);
    -- Generate slugs from existing product names
    UPDATE products SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));
    ALTER TABLE products ALTER COLUMN slug SET NOT NULL;
    CREATE UNIQUE INDEX idx_products_slug ON products(slug);
  END IF;

  -- Add default configuration columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'default_paper_stock_id') THEN
    ALTER TABLE products ADD COLUMN default_paper_stock_id INTEGER REFERENCES paper_stocks(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'default_coating_id') THEN
    ALTER TABLE products ADD COLUMN default_coating_id INTEGER REFERENCES coatings(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'default_turnaround_id') THEN
    ALTER TABLE products ADD COLUMN default_turnaround_id INTEGER REFERENCES turnarounds(id);
  END IF;

  -- Add size options columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_custom_size') THEN
    ALTER TABLE products ADD COLUMN has_custom_size BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'min_width') THEN
    ALTER TABLE products ADD COLUMN min_width DECIMAL(8, 2) DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'max_width') THEN
    ALTER TABLE products ADD COLUMN max_width DECIMAL(8, 2) DEFAULT 48.0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'min_height') THEN
    ALTER TABLE products ADD COLUMN min_height DECIMAL(8, 2) DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'max_height') THEN
    ALTER TABLE products ADD COLUMN max_height DECIMAL(8, 2) DEFAULT 48.0;
  END IF;

  -- Add display columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_featured') THEN
    ALTER TABLE products ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'display_order') THEN
    ALTER TABLE products ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- Add SEO columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'meta_title') THEN
    ALTER TABLE products ADD COLUMN meta_title VARCHAR(200);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'meta_description') THEN
    ALTER TABLE products ADD COLUMN meta_description TEXT;
  END IF;
END $$;

-- =====================================================
-- PRODUCT ADD-ONS (Junction Table)
-- Controls which add-ons appear on which products with ordering
-- Note: Table might exist from earlier migration - adding columns if needed
-- =====================================================
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_add_ons') THEN
    CREATE TABLE product_add_ons (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      add_on_id INTEGER NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,
      is_enabled BOOLEAN NOT NULL DEFAULT true,
      is_mandatory BOOLEAN NOT NULL DEFAULT false,
      position VARCHAR(50) NOT NULL DEFAULT 'below_upload',
      display_order INTEGER NOT NULL DEFAULT 0,
      override_base_price DECIMAL(10, 2),
      override_per_unit_price DECIMAL(10, 4),
      override_percentage DECIMAL(5, 2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (product_id, add_on_id)
    );

    CREATE INDEX idx_product_add_ons_product ON product_add_ons(product_id);
    CREATE INDEX idx_product_add_ons_add_on ON product_add_ons(add_on_id);
    CREATE INDEX idx_product_add_ons_position ON product_add_ons(position);
    CREATE INDEX idx_product_add_ons_order ON product_add_ons(display_order);
  ELSE
    -- Table exists, add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_add_ons' AND column_name = 'position') THEN
      ALTER TABLE product_add_ons ADD COLUMN position VARCHAR(50) NOT NULL DEFAULT 'below_upload';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_add_ons' AND column_name = 'display_order') THEN
      ALTER TABLE product_add_ons ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_add_ons' AND column_name = 'override_base_price') THEN
      ALTER TABLE product_add_ons ADD COLUMN override_base_price DECIMAL(10, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_add_ons' AND column_name = 'override_per_unit_price') THEN
      ALTER TABLE product_add_ons ADD COLUMN override_per_unit_price DECIMAL(10, 4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_add_ons' AND column_name = 'override_percentage') THEN
      ALTER TABLE product_add_ons ADD COLUMN override_percentage DECIMAL(5, 2);
    END IF;
  END IF;
END $$;

-- =====================================================
-- STANDARD SIZES TABLE
-- Predefined size presets (4×6, 8.5×11, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS standard_sizes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  width DECIMAL(8, 2) NOT NULL,
  height DECIMAL(8, 2) NOT NULL,
  description TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_standard_sizes_dimensions ON standard_sizes(width, height);

-- =====================================================
-- PRODUCT STANDARD SIZES (Junction Table)
-- Which standard sizes are available for which products
-- Note: Table might exist from earlier migration
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_standard_sizes') THEN
    CREATE TABLE product_standard_sizes (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      standard_size_id INTEGER NOT NULL REFERENCES standard_sizes(id) ON DELETE CASCADE,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (product_id, standard_size_id)
    );

    CREATE INDEX idx_product_std_sizes_product ON product_standard_sizes(product_id);
    CREATE INDEX idx_product_std_sizes_size ON product_standard_sizes(standard_size_id);
  END IF;
END $$;

-- =====================================================
-- MARKUP RULES TABLE
-- Retail markup percentages by turnaround category
-- =====================================================
CREATE TABLE IF NOT EXISTS markup_rules (
  id SERIAL PRIMARY KEY,
  turnaround_category VARCHAR(50) NOT NULL UNIQUE,
  markup_percentage DECIMAL(5, 2) NOT NULL, -- e.g., 130.8 for 2.308x
  multiplier DECIMAL(4, 3) NOT NULL, -- e.g., 2.308
  description TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE paper_stocks IS 'Paper stock types with per square inch pricing and weight';
COMMENT ON TABLE coatings IS 'Coating and finishing options';
COMMENT ON TABLE turnarounds IS 'Production turnaround time options';
COMMENT ON TABLE turnaround_multipliers IS 'Quantity-specific pricing multipliers';
COMMENT ON TABLE add_ons IS 'Product add-ons with positioning and drag-drop ordering';
COMMENT ON TABLE add_on_sub_options IS 'Dynamic configuration fields for complex add-ons';
COMMENT ON TABLE products IS 'Product catalog';
COMMENT ON TABLE product_add_ons IS 'Junction table controlling add-on visibility and ordering per product';

COMMENT ON COLUMN paper_stocks.base_cost_per_sq_in IS 'Base cost per square inch in dollars';
COMMENT ON COLUMN paper_stocks.weight_per_sq_in IS 'Weight per square inch in pounds';
COMMENT ON COLUMN paper_stocks.pricing_group_id IS 'Reference to another paper stock for pricing (12pt uses 9pt, 14pt uses 16pt)';
COMMENT ON COLUMN add_ons.position IS 'Where add-on appears: above_upload or below_upload';
COMMENT ON COLUMN add_ons.display_order IS 'Order for drag-and-drop arrangement';
COMMENT ON COLUMN product_add_ons.display_order IS 'Product-specific ordering (overrides add_on default order)';
