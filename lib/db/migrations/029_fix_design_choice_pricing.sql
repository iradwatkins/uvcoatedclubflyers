-- Migration 029: Fix Design Choice Pricing
-- Update design choices to correct flat pricing (no sides-based pricing)

-- Update Standard Custom Design to $125 flat (no sides selection)
UPDATE add_on_choices
SET price_type = 'flat',
    base_price = 125,
    requires_sides_selection = false,
    sides_pricing = NULL,
    updated_at = NOW()
WHERE add_on_id = 1 AND value = 'standard-custom-design';

-- Update Rush Custom Design to $150 flat (no sides selection)
UPDATE add_on_choices
SET price_type = 'flat',
    base_price = 150,
    requires_sides_selection = false,
    sides_pricing = NULL,
    updated_at = NOW()
WHERE add_on_id = 1 AND value = 'rush-custom-design';

-- Update Design Changes - Minor to $35 flat
UPDATE add_on_choices
SET base_price = 35,
    updated_at = NOW()
WHERE add_on_id = 1 AND value = 'design-changes-minor';

-- Update Design Changes - Major to $50 flat
UPDATE add_on_choices
SET base_price = 50,
    updated_at = NOW()
WHERE add_on_id = 1 AND value = 'design-changes-major';

-- Verify the updates
DO $$
DECLARE
  choice RECORD;
BEGIN
  RAISE NOTICE 'Design Choice Pricing Updated:';
  FOR choice IN
    SELECT value, label, price_type, base_price, requires_sides_selection
    FROM add_on_choices
    WHERE add_on_id = 1
    ORDER BY display_order
  LOOP
    RAISE NOTICE '  - %: $% (%)', choice.label, choice.base_price, choice.price_type;
  END LOOP;
END $$;
