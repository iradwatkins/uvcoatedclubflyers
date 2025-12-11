-- Migration 032: Fix product_addons schema to match pricing engine expectations
-- The pricing engine in lib/services/pricing-engine.ts queries 'product_add_ons' (with underscores)
-- but the table is named 'product_addons'. Also need to add missing columns.

-- Step 1: Add missing columns to existing table
ALTER TABLE product_addons
ADD COLUMN IF NOT EXISTS position VARCHAR(20) DEFAULT 'below_upload',
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS override_base_price DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS override_per_unit_price DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS override_percentage DECIMAL(10,4);

-- Step 2: Rename table to match code expectations
ALTER TABLE product_addons RENAME TO product_add_ons;

-- Step 3: Rename sequence
ALTER SEQUENCE IF EXISTS product_addons_id_seq RENAME TO product_add_ons_id_seq;

-- Step 4: Rename indexes
ALTER INDEX IF EXISTS product_addons_pkey RENAME TO product_add_ons_pkey;
ALTER INDEX IF EXISTS idx_product_addons_addon_id RENAME TO idx_product_add_ons_addon_id;
ALTER INDEX IF EXISTS idx_product_addons_product_id RENAME TO idx_product_add_ons_product_id;
ALTER INDEX IF EXISTS product_addons_product_id_addon_id_key RENAME TO product_add_ons_product_id_addon_id_key;

-- Step 5: Update existing records - set Design addon to above_upload position
UPDATE product_add_ons
SET position = 'above_upload'
WHERE addon_id = (SELECT id FROM add_ons WHERE slug = 'design');

-- Verify
DO $$
DECLARE
  table_exists BOOLEAN;
  col_count INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'product_add_ons'
  ) INTO table_exists;

  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'product_add_ons';

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Table product_add_ons exists: %', table_exists;
  RAISE NOTICE '  - Column count: %', col_count;
END $$;
