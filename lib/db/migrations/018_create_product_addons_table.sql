-- Create product_addons junction table
-- Links products with their available add-ons
-- Allows admins to control which add-ons appear for each product

CREATE TABLE IF NOT EXISTS product_addons (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id INTEGER NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, addon_id)
);

-- Create index for faster lookups
CREATE INDEX idx_product_addons_product_id ON product_addons(product_id);
CREATE INDEX idx_product_addons_addon_id ON product_addons(addon_id);

-- Add comment
COMMENT ON TABLE product_addons IS 'Junction table linking products with their available add-ons';
COMMENT ON COLUMN product_addons.is_default IS 'Whether this add-on should be pre-selected for this product';
COMMENT ON COLUMN product_addons.display_order IS 'Order in which add-on appears for this product';
