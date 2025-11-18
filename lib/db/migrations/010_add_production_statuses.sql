-- Add new production statuses to order status check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'processing',
    'printing',
    'quality_check',
    'ready_to_ship',
    'shipped',
    'completed',
    'cancelled'
  ));

-- Add shipped_at timestamp column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipped_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP;
  END IF;
END $$;
