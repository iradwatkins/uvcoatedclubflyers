-- Migration: Add Product Configuration Fields
-- Allows admins to configure quantities, sizes, paper stocks, turnarounds per product

-- Add configuration fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS quantities TEXT DEFAULT '25,50,100,250,500,1000,2500,5000',
ADD COLUMN IF NOT EXISTS sizes TEXT DEFAULT '4x6,5x7,6x9,8.5x11',
ADD COLUMN IF NOT EXISTS available_paper_stocks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS available_turnarounds JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mandatory_addons JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS available_addons JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN products.quantities IS 'Comma-separated list of available quantities (e.g., "25,50,100,250,500,1000,2500,5000")';
COMMENT ON COLUMN products.sizes IS 'Comma-separated list of available sizes (e.g., "4x6,5x7,6x9,8.5x11")';
COMMENT ON COLUMN products.available_paper_stocks IS 'Array of paper stock IDs available for this product';
COMMENT ON COLUMN products.available_turnarounds IS 'Array of turnaround IDs to show as checkboxes (max 4)';
COMMENT ON COLUMN products.mandatory_addons IS 'Array of addon configurations that are pre-selected and required';
COMMENT ON COLUMN products.available_addons IS 'Array of addon IDs available for this product';

-- Update existing product (ID 1) with default configuration
UPDATE products
SET
  quantities = '25,50,100,250,500,1000,2500,5000',
  sizes = '4x6,5x7,6x9,8.5x11',
  available_paper_stocks = '[1,2,3,4,5,6,7]'::jsonb, -- All 7 paper stocks
  available_turnarounds = '[6,7,8,2]'::jsonb, -- 2-4 Days, 3-4 Days, 5-7 Days, Next Day
  mandatory_addons = '[]'::jsonb,
  available_addons = '[]'::jsonb
WHERE id = 1;
