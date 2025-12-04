-- Migration: Add markup column to paper_stocks table
-- This allows admin to set a markup multiplier on each paper stock
-- The markup is applied BEFORE the turnaround multiplier in the pricing calculation

-- Add markup column with default of 1.0 (no markup)
ALTER TABLE paper_stocks
ADD COLUMN IF NOT EXISTS markup DECIMAL(10, 4) DEFAULT 1.0;

-- Add comment explaining the column
COMMENT ON COLUMN paper_stocks.markup IS 'Markup multiplier applied before turnaround calculation. Default 1.0 = no markup, 1.7 = 70% markup';

-- Set default markups for existing paper stocks
-- 9pt C2S Cardstock: 1.7x markup (as requested)
UPDATE paper_stocks SET markup = 1.7 WHERE slug = '9pt-c2s-cardstock';

-- Other paper stocks default to 1.0 (no additional markup beyond base price)
UPDATE paper_stocks SET markup = 1.0 WHERE markup IS NULL;

-- Verify the update
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE 'Paper Stock Markups:';
  FOR rec IN SELECT name, markup FROM paper_stocks ORDER BY display_order LOOP
    RAISE NOTICE '  - %: %x', rec.name, rec.markup;
  END LOOP;
END $$;
