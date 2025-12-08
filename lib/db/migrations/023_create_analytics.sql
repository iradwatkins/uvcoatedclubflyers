-- Migration: Enhanced Analytics & Funnel Tracking
-- Created: 2025-12-08
-- Description: Tables for comprehensive conversion tracking and funnel analytics

-- ============================================================================
-- FUNNEL EVENTS
-- Track user journey through the site
-- ============================================================================

CREATE TABLE IF NOT EXISTS funnel_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'product_view', 'add_to_cart', 'cart_view', 'checkout_start', 'checkout_shipping', 'checkout_payment', 'checkout_complete', 'upsell_view', 'upsell_accept', 'upsell_decline', 'order_bump_view', 'order_bump_accept'
    event_data JSONB DEFAULT '{}',

    -- Page context
    page_url TEXT,
    page_title VARCHAR(255),
    referrer TEXT,

    -- UTM tracking
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),

    -- Device info
    device_type VARCHAR(20), -- 'mobile', 'tablet', 'desktop'
    browser VARCHAR(50),
    os VARCHAR(50),
    screen_width INTEGER,

    -- IP & geo (for fraud detection)
    ip_address INET,
    country_code CHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_funnel_events_session ON funnel_events(session_id, created_at);
CREATE INDEX idx_funnel_events_user ON funnel_events(user_id, created_at) WHERE user_id IS NOT NULL;
CREATE INDEX idx_funnel_events_type ON funnel_events(event_type, created_at DESC);
CREATE INDEX idx_funnel_events_created ON funnel_events(created_at DESC);
CREATE INDEX idx_funnel_events_utm ON funnel_events(utm_source, utm_medium, utm_campaign) WHERE utm_source IS NOT NULL;

COMMENT ON TABLE funnel_events IS 'Granular event tracking for funnel analysis';
COMMENT ON COLUMN funnel_events.event_data IS 'Event-specific data: product_id, cart_value, order_id, etc.';

-- ============================================================================
-- CONVERSION GOALS
-- Define what constitutes a conversion
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversion_goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Goal configuration
    goal_type VARCHAR(50) NOT NULL, -- 'purchase', 'signup', 'cart_value', 'specific_product', 'category_purchase'
    goal_value JSONB DEFAULT '{}', -- Configuration for the goal

    -- Revenue tracking
    track_revenue BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO conversion_goals (name, description, goal_type, goal_value, track_revenue) VALUES
('Purchase Complete', 'Any completed purchase', 'purchase', '{}', true),
('Cart Over $100', 'Cart value exceeds $100', 'cart_value', '{"min_value": 100}', true),
('First Purchase', 'First-time customer purchase', 'purchase', '{"first_purchase": true}', true),
('Repeat Purchase', 'Returning customer purchase', 'purchase', '{"repeat_purchase": true}', true);

-- ============================================================================
-- DAILY ANALYTICS AGGREGATES
-- Pre-computed daily metrics for fast dashboard loading
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'page_views', 'unique_visitors', 'add_to_carts', 'checkouts_started', 'orders_completed', 'revenue', 'aov', 'conversion_rate', 'cart_abandonment_rate'

    -- Metric value
    metric_value DECIMAL(15,4),

    -- Dimensions for filtering (e.g., by source, device)
    dimensions JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(date, metric_type, dimensions)
);

CREATE INDEX idx_analytics_daily_date ON analytics_daily(date DESC);
CREATE INDEX idx_analytics_daily_metric ON analytics_daily(metric_type, date DESC);
CREATE INDEX idx_analytics_daily_dimensions ON analytics_daily USING gin(dimensions);

CREATE TRIGGER update_analytics_daily_updated_at
    BEFORE UPDATE ON analytics_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE analytics_daily IS 'Pre-aggregated daily metrics for dashboard performance';
COMMENT ON COLUMN analytics_daily.dimensions IS 'Breakdown dimensions: {"utm_source": "google"}, {"device": "mobile"}';

-- ============================================================================
-- REVENUE ATTRIBUTION
-- Track revenue by marketing source
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_attribution (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    session_id VARCHAR(255),

    -- Attribution model
    attribution_model VARCHAR(30) DEFAULT 'last_touch', -- 'first_touch', 'last_touch', 'linear'

    -- Source data
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    referrer TEXT,

    -- Revenue
    order_revenue DECIMAL(10,2),
    attributed_revenue DECIMAL(10,2), -- May differ for linear attribution

    -- Timestamps
    first_touch_at TIMESTAMP,
    conversion_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_attribution_order ON revenue_attribution(order_id);
CREATE INDEX idx_revenue_attribution_source ON revenue_attribution(utm_source, utm_medium);
CREATE INDEX idx_revenue_attribution_date ON revenue_attribution(conversion_at DESC);

COMMENT ON TABLE revenue_attribution IS 'Track which marketing sources drive revenue';

-- ============================================================================
-- CHECKOUT FUNNEL SNAPSHOTS
-- Daily snapshots of funnel performance
-- ============================================================================

CREATE TABLE IF NOT EXISTS checkout_funnel_snapshots (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,

    -- Funnel stages
    cart_views INTEGER DEFAULT 0,
    checkouts_started INTEGER DEFAULT 0,
    shipping_completed INTEGER DEFAULT 0,
    payment_started INTEGER DEFAULT 0,
    orders_completed INTEGER DEFAULT 0,

    -- Conversion rates (pre-calculated)
    cart_to_checkout_rate DECIMAL(5,2),
    checkout_to_shipping_rate DECIMAL(5,2),
    shipping_to_payment_rate DECIMAL(5,2),
    payment_to_complete_rate DECIMAL(5,2),
    overall_conversion_rate DECIMAL(5,2),

    -- Revenue metrics
    total_revenue DECIMAL(15,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,

    -- Order bump metrics
    order_bumps_shown INTEGER DEFAULT 0,
    order_bumps_accepted INTEGER DEFAULT 0,
    order_bump_revenue DECIMAL(10,2) DEFAULT 0,

    -- Upsell metrics
    upsells_shown INTEGER DEFAULT 0,
    upsells_accepted INTEGER DEFAULT 0,
    upsell_revenue DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(date)
);

CREATE INDEX idx_checkout_funnel_date ON checkout_funnel_snapshots(date DESC);

COMMENT ON TABLE checkout_funnel_snapshots IS 'Daily snapshots of checkout funnel performance';

-- ============================================================================
-- PRODUCT ANALYTICS
-- Track product-level metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_analytics_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,

    -- View metrics
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,

    -- Cart metrics
    add_to_carts INTEGER DEFAULT 0,
    removed_from_carts INTEGER DEFAULT 0,

    -- Purchase metrics
    purchases INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,

    -- Conversion rate
    view_to_cart_rate DECIMAL(5,2),
    cart_to_purchase_rate DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(date, product_id)
);

CREATE INDEX idx_product_analytics_date ON product_analytics_daily(date DESC);
CREATE INDEX idx_product_analytics_product ON product_analytics_daily(product_id, date DESC);

COMMENT ON TABLE product_analytics_daily IS 'Daily product-level performance metrics';

-- ============================================================================
-- A/B TEST TABLES (For future implementation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ab_experiments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Test configuration
    test_type VARCHAR(50) NOT NULL, -- 'checkout', 'order_bump', 'upsell', 'landing_page', 'pricing'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'

    -- Traffic allocation
    traffic_allocation JSONB NOT NULL DEFAULT '{}', -- {"control": 50, "variant_a": 50}

    -- Goal
    primary_goal VARCHAR(50) DEFAULT 'conversion', -- 'conversion', 'revenue', 'aov', 'click_rate'
    secondary_goals JSONB DEFAULT '[]',

    -- Statistical settings
    min_sample_size INTEGER DEFAULT 100,
    confidence_level DECIMAL(4,2) DEFAULT 0.95,

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    winner_variant_id INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_variants (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES ab_experiments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Variant configuration
    config JSONB NOT NULL DEFAULT '{}', -- Variant-specific settings
    is_control BOOLEAN DEFAULT false,

    -- Results (updated during test)
    visitors INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,
    conversion_rate DECIMAL(8,4),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_assignments (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES ab_variants(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Conversion tracking
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2),
    converted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(experiment_id, session_id)
);

CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_variants_experiment ON ab_variants(experiment_id);
CREATE INDEX idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX idx_ab_assignments_session ON ab_assignments(session_id);

COMMENT ON TABLE ab_experiments IS 'A/B test experiment definitions';
COMMENT ON TABLE ab_variants IS 'Variants within an A/B test';
COMMENT ON TABLE ab_assignments IS 'Track which variant each visitor sees';
