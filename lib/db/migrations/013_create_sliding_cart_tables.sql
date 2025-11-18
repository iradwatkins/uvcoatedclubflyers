-- Migration: Sliding Cart & Abandoned Cart Infrastructure
-- Created: 2025-11-17
-- Description: Tables for AJAX cart, cart sessions, upsells, and abandonment tracking

-- ============================================================================
-- CART SESSIONS
-- Track Redis cart sessions for abandonment detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    cart_data JSONB NOT NULL DEFAULT '{}',
    total_value INTEGER DEFAULT 0, -- in cents
    item_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- active, abandoned, converted, recovered

    -- Tracking timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    abandoned_at TIMESTAMP,
    converted_at TIMESTAMP,
    recovered_at TIMESTAMP,

    -- Recovery tracking
    recovery_emails_sent INTEGER DEFAULT 0,
    last_recovery_email_at TIMESTAMP,
    recovery_token VARCHAR(500),
    recovery_token_expires_at TIMESTAMP,

    -- Analytics
    source VARCHAR(100), -- direct, search, social, email
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    device_type VARCHAR(50), -- mobile, tablet, desktop

    CONSTRAINT check_total_value CHECK (total_value >= 0),
    CONSTRAINT check_item_count CHECK (item_count >= 0)
);

-- Indexes for performance
CREATE INDEX idx_cart_sessions_session_id ON cart_sessions(session_id);
CREATE INDEX idx_cart_sessions_user_id ON cart_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cart_sessions_email ON cart_sessions(email) WHERE email IS NOT NULL;
CREATE INDEX idx_cart_sessions_status ON cart_sessions(status);
CREATE INDEX idx_cart_sessions_last_activity ON cart_sessions(last_activity_at);
CREATE INDEX idx_cart_sessions_abandoned ON cart_sessions(abandoned_at) WHERE abandoned_at IS NOT NULL;
CREATE INDEX idx_cart_sessions_recovery_token ON cart_sessions(recovery_token) WHERE recovery_token IS NOT NULL;

-- Auto-update updated_at timestamp
CREATE TRIGGER update_cart_sessions_updated_at
    BEFORE UPDATE ON cart_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cart_sessions IS 'Tracks cart sessions from Redis for abandonment detection and recovery';
COMMENT ON COLUMN cart_sessions.session_id IS 'Unique session identifier from Redis/cookies';
COMMENT ON COLUMN cart_sessions.cart_data IS 'Snapshot of cart contents (products, quantities, options)';
COMMENT ON COLUMN cart_sessions.recovery_token IS 'JWT token for one-click cart recovery via email link';

-- ============================================================================
-- CART UPSELLS
-- Product recommendations shown in sliding cart
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_upsells (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Trigger conditions
    trigger_type VARCHAR(50) NOT NULL, -- cart_value, product_category, specific_product, cart_empty
    trigger_config JSONB NOT NULL DEFAULT '{}',

    -- Upsell products
    upsell_products JSONB NOT NULL DEFAULT '[]', -- Array of product IDs with optional discounts
    max_display INTEGER DEFAULT 3, -- Maximum number to show
    display_order INTEGER DEFAULT 0,

    -- Display settings
    display_mode VARCHAR(50) DEFAULT 'automatic', -- automatic, manual
    display_position VARCHAR(50) DEFAULT 'in_cart', -- in_cart, cart_footer, cart_header

    -- Status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5,

    -- Analytics
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    revenue_generated INTEGER DEFAULT 0, -- in cents

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_max_display CHECK (max_display > 0 AND max_display <= 10),
    CONSTRAINT check_priority CHECK (priority >= 0 AND priority <= 10)
);

CREATE INDEX idx_cart_upsells_active ON cart_upsells(is_active, priority DESC);
CREATE INDEX idx_cart_upsells_trigger_type ON cart_upsells(trigger_type);

CREATE TRIGGER update_cart_upsells_updated_at
    BEFORE UPDATE ON cart_upsells
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cart_upsells IS 'Configuration for in-cart product recommendations and upsells';
COMMENT ON COLUMN cart_upsells.trigger_config IS 'JSON config like {"min_cart_value": 5000, "product_ids": [1,2,3]}';
COMMENT ON COLUMN cart_upsells.upsell_products IS 'Array of {product_id, discount_percent} objects';

-- ============================================================================
-- CART INTERACTIONS
-- Track user interactions with cart for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_interactions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Event details
    event_type VARCHAR(50) NOT NULL, -- cart_opened, cart_closed, item_added, item_removed, quantity_changed, upsell_viewed, upsell_clicked, upsell_added, checkout_clicked
    event_data JSONB DEFAULT '{}',

    -- Context
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER,
    price_at_time INTEGER, -- in cents

    -- Metadata
    page_url TEXT,
    referrer TEXT,
    device_type VARCHAR(50),

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_quantity CHECK (quantity IS NULL OR quantity > 0)
);

-- Indexes for analytics queries
CREATE INDEX idx_cart_interactions_session ON cart_interactions(session_id, created_at DESC);
CREATE INDEX idx_cart_interactions_user ON cart_interactions(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cart_interactions_event_type ON cart_interactions(event_type, created_at DESC);
CREATE INDEX idx_cart_interactions_product ON cart_interactions(product_id, event_type) WHERE product_id IS NOT NULL;
CREATE INDEX idx_cart_interactions_created_at ON cart_interactions(created_at DESC);

COMMENT ON TABLE cart_interactions IS 'Analytics tracking for all cart-related user interactions';
COMMENT ON COLUMN cart_interactions.event_data IS 'Additional event-specific data like upsell_id, cart_value_before, cart_value_after';

-- ============================================================================
-- ABANDONED CARTS
-- Carts that have been inactive for 15+ minutes
-- ============================================================================

CREATE TABLE IF NOT EXISTS abandoned_carts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Cart snapshot
    cart_data JSONB NOT NULL,
    total_value INTEGER NOT NULL, -- in cents
    item_count INTEGER NOT NULL,

    -- Product details for emails
    product_images JSONB DEFAULT '[]', -- Array of image URLs for email display
    product_names JSONB DEFAULT '[]', -- Array of product names

    -- Status tracking
    status VARCHAR(50) DEFAULT 'abandoned', -- abandoned, email_sent_1, email_sent_2, email_sent_3, recovered, converted, lost
    abandonment_stage VARCHAR(50), -- browsing, cart, checkout_started, checkout_shipping, checkout_payment

    -- Timestamps
    abandoned_at TIMESTAMP DEFAULT NOW(),
    first_email_sent_at TIMESTAMP,
    second_email_sent_at TIMESTAMP,
    third_email_sent_at TIMESTAMP,
    recovered_at TIMESTAMP,
    converted_at TIMESTAMP,
    expired_at TIMESTAMP,

    -- Recovery data
    recovery_token VARCHAR(500) UNIQUE,
    recovery_token_expires_at TIMESTAMP,
    recovery_discount_code VARCHAR(100), -- Optional discount to incentivize return
    recovery_discount_percent INTEGER DEFAULT 0,

    -- Conversion tracking
    recovered_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    recovered_revenue INTEGER DEFAULT 0, -- in cents

    -- Email performance
    email_open_count INTEGER DEFAULT 0,
    email_click_count INTEGER DEFAULT 0,
    last_email_opened_at TIMESTAMP,
    last_email_clicked_at TIMESTAMP,

    -- Analytics
    source VARCHAR(100),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    device_type VARCHAR(50),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_item_count CHECK (item_count > 0),
    CONSTRAINT check_total_value CHECK (total_value > 0),
    CONSTRAINT check_discount CHECK (recovery_discount_percent >= 0 AND recovery_discount_percent <= 100)
);

-- Indexes
CREATE INDEX idx_abandoned_carts_session ON abandoned_carts(session_id);
CREATE INDEX idx_abandoned_carts_user ON abandoned_carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_abandoned_carts_email ON abandoned_carts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX idx_abandoned_carts_abandoned_at ON abandoned_carts(abandoned_at DESC);
CREATE INDEX idx_abandoned_carts_recovery_token ON abandoned_carts(recovery_token) WHERE recovery_token IS NOT NULL;
CREATE INDEX idx_abandoned_carts_recovered ON abandoned_carts(recovered_at DESC) WHERE recovered_at IS NOT NULL;

CREATE TRIGGER update_abandoned_carts_updated_at
    BEFORE UPDATE ON abandoned_carts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE abandoned_carts IS 'Carts abandoned for 15+ minutes with recovery email tracking';
COMMENT ON COLUMN abandoned_carts.abandonment_stage IS 'Where in funnel the cart was abandoned';
COMMENT ON COLUMN abandoned_carts.recovery_token IS 'JWT for one-click recovery link in email';

-- ============================================================================
-- CART UPSELL ANALYTICS
-- Detailed tracking of upsell performance
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_upsell_analytics (
    id SERIAL PRIMARY KEY,
    upsell_id INTEGER REFERENCES cart_upsells(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Event tracking
    event_type VARCHAR(50) NOT NULL, -- viewed, clicked, added, removed
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,

    -- Context
    cart_value_before INTEGER, -- in cents
    cart_value_after INTEGER, -- in cents
    position_shown INTEGER, -- Which position in upsell list (1, 2, 3)

    -- Revenue attribution
    revenue_attributed INTEGER DEFAULT 0, -- in cents, if converted

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_position CHECK (position_shown >= 1 AND position_shown <= 10)
);

CREATE INDEX idx_upsell_analytics_upsell ON cart_upsell_analytics(upsell_id, created_at DESC);
CREATE INDEX idx_upsell_analytics_session ON cart_upsell_analytics(session_id);
CREATE INDEX idx_upsell_analytics_event ON cart_upsell_analytics(event_type, created_at DESC);
CREATE INDEX idx_upsell_analytics_product ON cart_upsell_analytics(product_id) WHERE product_id IS NOT NULL;

COMMENT ON TABLE cart_upsell_analytics IS 'Granular tracking of each upsell impression and interaction';

-- ============================================================================
-- SAMPLE DATA (Optional - for development)
-- ============================================================================

-- Example upsell rule: Show bestsellers when cart is empty
INSERT INTO cart_upsells (name, description, trigger_type, trigger_config, upsell_products, is_active)
VALUES (
    'Empty Cart Bestsellers',
    'Show bestselling products when cart is empty',
    'cart_empty',
    '{"min_items": 0, "max_items": 0}'::jsonb,
    '[{"product_id": 1, "discount_percent": 0}]'::jsonb,
    true
);

-- Example upsell rule: Show related products when cart value > $50
INSERT INTO cart_upsells (name, description, trigger_type, trigger_config, upsell_products, is_active)
VALUES (
    'High Value Cart Upsells',
    'Show premium add-ons for carts over $50',
    'cart_value',
    '{"min_cart_value": 5000, "max_cart_value": null}'::jsonb,
    '[{"product_id": 1, "discount_percent": 10}]'::jsonb,
    true
);
