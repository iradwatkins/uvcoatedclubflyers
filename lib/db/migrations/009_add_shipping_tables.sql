-- Migration: Add shipping support to orders and create airports table
-- Date: 2025-11-17
-- Description: Adds shipping fields to orders table and creates airports table for Southwest Cargo

-- Add shipping columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_service VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_rate_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tracking_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_airport_id VARCHAR(50);

-- Add comments to columns
COMMENT ON COLUMN orders.shipping_carrier IS 'Shipping carrier code (FEDEX, SOUTHWEST_CARGO, etc.)';
COMMENT ON COLUMN orders.shipping_service IS 'Shipping service code (FEDEX_GROUND, SOUTHWEST_CARGO_DASH, etc.)';
COMMENT ON COLUMN orders.shipping_rate_amount IS 'Shipping cost in dollars';
COMMENT ON COLUMN orders.shipping_tracking_number IS 'Tracking number from carrier';
COMMENT ON COLUMN orders.pickup_airport_id IS 'Airport ID for Southwest Cargo pickup';

-- Create airports table for Southwest Cargo locations
CREATE TABLE IF NOT EXISTS airports (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  carrier VARCHAR(50) NOT NULL DEFAULT 'SOUTHWEST_CARGO',
  operator VARCHAR(255),
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  hours JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  latitude DECIMAL(10,7),
  longitude DECIMAL(11,7),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add comments to airports table
COMMENT ON TABLE airports IS 'Southwest Cargo airport pickup locations';
COMMENT ON COLUMN airports.code IS '3-letter IATA airport code';
COMMENT ON COLUMN airports.name IS 'Full airport name';
COMMENT ON COLUMN airports.carrier IS 'Cargo carrier operating at this airport';
COMMENT ON COLUMN airports.operator IS 'Cargo facility operator name';
COMMENT ON COLUMN airports.hours IS 'JSON object with operating hours by day of week';
COMMENT ON COLUMN airports.is_active IS 'Whether this airport is currently accepting cargo';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_airports_code ON airports(code);
CREATE INDEX IF NOT EXISTS idx_airports_state ON airports(state);
CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
CREATE INDEX IF NOT EXISTS idx_airports_carrier ON airports(carrier);
CREATE INDEX IF NOT EXISTS idx_airports_active ON airports(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_carrier ON orders(shipping_carrier);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_service ON orders(shipping_service);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_airport ON orders(pickup_airport_id);

-- Add foreign key constraint (optional - orders can exist without pickup airport)
ALTER TABLE orders ADD CONSTRAINT fk_orders_pickup_airport
  FOREIGN KEY (pickup_airport_id) REFERENCES airports(id)
  ON DELETE SET NULL;
