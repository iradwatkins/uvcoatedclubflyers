-- Create saved_payment_methods table for storing customer payment tokens
CREATE TABLE IF NOT EXISTS saved_payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('square', 'paypal')),
    provider_customer_id VARCHAR(255), -- Square customer ID or PayPal billing agreement ID
    payment_token VARCHAR(255) NOT NULL, -- Encrypted card token or payment method token
    card_brand VARCHAR(50), -- Visa, Mastercard, Amex, etc (for display only)
    last_four VARCHAR(4), -- Last 4 digits of card (for display only)
    expiry_month INTEGER, -- Card expiry month (1-12)
    expiry_year INTEGER, -- Card expiry year (YYYY)
    cardholder_name VARCHAR(255), -- Name on card
    is_default BOOLEAN DEFAULT false,
    is_expired BOOLEAN DEFAULT false,
    metadata JSONB, -- Additional provider-specific data
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX idx_saved_payment_methods_provider ON saved_payment_methods(provider);
CREATE INDEX idx_saved_payment_methods_is_default ON saved_payment_methods(user_id, is_default);

-- Add trigger for updated_at
CREATE TRIGGER update_saved_payment_methods_updated_at
    BEFORE UPDATE ON saved_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add default_payment_method_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS default_payment_method_id INTEGER REFERENCES saved_payment_methods(id) ON DELETE SET NULL;

-- Create index on default payment method
CREATE INDEX idx_users_default_payment_method ON users(default_payment_method_id);

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Unset all other default payment methods for this user
        UPDATE saved_payment_methods
        SET is_default = false
        WHERE user_id = NEW.user_id
          AND id != NEW.id
          AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one default
CREATE TRIGGER ensure_single_default_payment_method_trigger
    BEFORE INSERT OR UPDATE ON saved_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_payment_method();

-- Function to check if card is expired
CREATE OR REPLACE FUNCTION check_payment_method_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiry_year IS NOT NULL AND NEW.expiry_month IS NOT NULL THEN
        -- Check if card has expired
        IF (NEW.expiry_year < EXTRACT(YEAR FROM NOW())) OR
           (NEW.expiry_year = EXTRACT(YEAR FROM NOW()) AND NEW.expiry_month < EXTRACT(MONTH FROM NOW())) THEN
            NEW.is_expired = true;
        ELSE
            NEW.is_expired = false;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update expired status
CREATE TRIGGER check_payment_method_expiry_trigger
    BEFORE INSERT OR UPDATE ON saved_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION check_payment_method_expiry();
