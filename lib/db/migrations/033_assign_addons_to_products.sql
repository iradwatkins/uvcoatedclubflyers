-- Migration 033: Assign all 20 addons to all 5 products
-- This enables addon selection on product configuration pages

-- Clear existing assignments (except Design which is already assigned)
DELETE FROM product_add_ons WHERE add_on_id != 1;

-- Insert all addon assignments for all products
-- Products: 1=Flyer Pricing, 2=4x6 Postcards, 3=5.5x8.5 Half-Page, 4=8.5x11 Full-Page, 5=4x9 Rack Cards
-- Addons: 1=Design, 2=Color Critical, 3=Perforation, ... 20=Spot UV

-- Helper: Insert addon for all products at once
INSERT INTO product_add_ons (product_id, add_on_id, position, is_mandatory, is_enabled, display_order)
SELECT
  p.id as product_id,
  a.id as add_on_id,
  CASE WHEN a.slug = 'design' THEN 'above_upload' ELSE 'below_upload' END as position,
  false as is_mandatory,
  true as is_enabled,
  a.display_order as display_order
FROM products p
CROSS JOIN add_ons a
WHERE a.is_active = true
ON CONFLICT (product_id, add_on_id) DO UPDATE SET
  position = EXCLUDED.position,
  is_enabled = EXCLUDED.is_enabled,
  display_order = EXCLUDED.display_order;

-- Verify counts
DO $$
DECLARE
  product_count INTEGER;
  addon_count INTEGER;
  assignment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  SELECT COUNT(*) INTO addon_count FROM add_ons WHERE is_active = true;
  SELECT COUNT(*) INTO assignment_count FROM product_add_ons;

  RAISE NOTICE 'Addon assignment complete:';
  RAISE NOTICE '  - Products: %', product_count;
  RAISE NOTICE '  - Active addons: %', addon_count;
  RAISE NOTICE '  - Total assignments: % (expected: %)', assignment_count, product_count * addon_count;
END $$;

-- Show summary by product
SELECT
  p.name as product,
  COUNT(pao.add_on_id) as addon_count
FROM products p
LEFT JOIN product_add_ons pao ON p.id = pao.product_id
GROUP BY p.id, p.name
ORDER BY p.id;
