-- Add additional product image fields
-- Products can have 1 main image + up to 3 additional images

ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url_2 TEXT,
ADD COLUMN IF NOT EXISTS image_url_3 TEXT,
ADD COLUMN IF NOT EXISTS image_url_4 TEXT;

-- Add comments for clarity
COMMENT ON COLUMN products.image_url IS 'Main product image';
COMMENT ON COLUMN products.image_url_2 IS 'Additional product image 2';
COMMENT ON COLUMN products.image_url_3 IS 'Additional product image 3';
COMMENT ON COLUMN products.image_url_4 IS 'Additional product image 4';
