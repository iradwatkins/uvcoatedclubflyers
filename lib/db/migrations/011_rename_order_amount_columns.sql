-- Migration: Rename order amount columns to match application expectations
-- Date: 2025-11-17
-- Description: Renames tax -> tax_amount and total -> total_amount for consistency

-- Rename columns
ALTER TABLE orders RENAME COLUMN tax TO tax_amount;
ALTER TABLE orders RENAME COLUMN total TO total_amount;

-- Update comments
COMMENT ON COLUMN orders.tax_amount IS 'Tax amount in cents (stored as decimal but represents cents)';
COMMENT ON COLUMN orders.total_amount IS 'Total order amount in cents (stored as decimal but represents cents)';
