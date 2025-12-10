-- Migration: Add sub-option for Design add-on sides selection
-- This creates a "design_sides" field that shows when custom design choices require sides selection

-- Insert sub-option for Design sides selection
INSERT INTO add_on_sub_options (
  add_on_id,
  field_name,
  field_label,
  field_type,
  options,
  default_value,
  is_required,
  display_order
)
SELECT
  1, -- Design add-on ID
  'design_sides',
  'How many sides need design?',
  'select',
  '{"options": [{"value": "one", "label": "One Side"}, {"value": "two", "label": "Two Sides"}]}'::jsonb,
  'one',
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM add_on_sub_options
  WHERE add_on_id = 1 AND field_name = 'design_sides'
);

-- Add show_when column if it doesn't exist (to conditionally show based on choice)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'add_on_sub_options' AND column_name = 'show_when'
  ) THEN
    ALTER TABLE add_on_sub_options ADD COLUMN show_when JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'add_on_sub_options' AND column_name = 'affects_pricing'
  ) THEN
    ALTER TABLE add_on_sub_options ADD COLUMN affects_pricing BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'add_on_sub_options' AND column_name = 'tooltip'
  ) THEN
    ALTER TABLE add_on_sub_options ADD COLUMN tooltip TEXT;
  END IF;
END $$;

-- Update the design_sides sub-option with conditional display
-- Show only when a choice that requires sides selection is selected
UPDATE add_on_sub_options
SET
  show_when = '{"choiceRequiresSides": true}'::jsonb,
  affects_pricing = true,
  tooltip = 'Select how many sides you need designed. Two-sided design costs more.'
WHERE add_on_id = 1 AND field_name = 'design_sides';
