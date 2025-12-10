-- Migration 027: Create add_on_choices table for dropdown options with pricing
-- This allows add-ons (like "Design") to have multiple selectable options with individual pricing

-- Create the choices table
CREATE TABLE IF NOT EXISTS add_on_choices (
  id SERIAL PRIMARY KEY,
  add_on_id INTEGER NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,
  value VARCHAR(100) NOT NULL,              -- Internal identifier: 'upload-my-artwork'
  label VARCHAR(255) NOT NULL,              -- Display text: 'Upload My Artwork'
  description TEXT,                         -- Helper text shown when selected

  -- Pricing configuration
  price_type VARCHAR(50) DEFAULT 'flat',    -- 'flat', 'per_unit', 'percentage', 'custom'
  base_price DECIMAL(10,4) DEFAULT 0,       -- Base/flat price
  per_unit_price DECIMAL(10,6) DEFAULT 0,   -- Per-piece price
  percentage DECIMAL(5,2) DEFAULT 0,        -- Percentage of product price

  -- Special behaviors
  requires_file_upload BOOLEAN DEFAULT false,      -- Show file upload when selected
  requires_sides_selection BOOLEAN DEFAULT false,  -- Show sides dropdown when selected
  sides_pricing JSONB,                             -- {"one": 90, "two": 135} for sides-based pricing

  -- Display
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,         -- Pre-selected option
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(add_on_id, value)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_add_on_choices_add_on_id ON add_on_choices(add_on_id);
CREATE INDEX IF NOT EXISTS idx_add_on_choices_active ON add_on_choices(is_active);
CREATE INDEX IF NOT EXISTS idx_add_on_choices_order ON add_on_choices(add_on_id, display_order);

-- Add comment
COMMENT ON TABLE add_on_choices IS 'Dropdown options for add-ons with individual pricing configurations';

-- Verify
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'add_on_choices') THEN
    RAISE NOTICE 'add_on_choices table created successfully';
  END IF;
END $$;
