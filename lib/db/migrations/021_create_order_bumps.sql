-- Migration: Order Bumps System
-- Created: 2025-12-08
-- Description: Tables for checkout order bumps (pre-purchase offers)

-- ============================================================================
-- ORDER BUMPS
-- Product offers displayed during checkout
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_bumps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,

    -- Discount configuration
    discount_type VARCHAR(20) DEFAULT 'none', -- 'percentage', 'fixed', 'none'
    discount_value DECIMAL(10,2) DEFAULT 0,

    -- Display content
    headline TEXT NOT NULL,
    description TEXT,
    checkbox_label VARCHAR(255) DEFAULT 'Yes! Add this to my order',
    image_url TEXT,

    -- Display settings
    display_position VARCHAR(50) DEFAULT 'before_payment', -- 'before_payment', 'after_order_summary', 'in_order_summary'
    layout VARCHAR(20) DEFAULT 'layout_1', -- layout_1 through layout_7
    background_color VARCHAR(20) DEFAULT '#FEF3C7', -- Soft yellow by default
    border_color VARCHAR(20) DEFAULT '#F59E0B',
    highlight_text VARCHAR(100), -- e.g., "SPECIAL OFFER", "LIMITED TIME"

    -- Status & ordering
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 10, -- Higher = shown first

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_bumps_active ON order_bumps(is_active, priority DESC);
CREATE INDEX idx_order_bumps_product ON order_bumps(product_id) WHERE product_id IS NOT NULL;

-- Auto-update updated_at timestamp
CREATE TRIGGER update_order_bumps_updated_at
    BEFORE UPDATE ON order_bumps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE order_bumps IS 'Checkout order bumps - product offers shown before payment';
COMMENT ON COLUMN order_bumps.layout IS 'Visual layout style: layout_1 (classic), layout_2 (highlighted), etc.';

-- ============================================================================
-- ORDER BUMP RULES
-- Conditions for when to display a bump
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_bump_rules (
    id SERIAL PRIMARY KEY,
    bump_id INTEGER REFERENCES order_bumps(id) ON DELETE CASCADE,

    -- Rule type and configuration
    rule_type VARCHAR(50) NOT NULL, -- 'cart_contains', 'cart_total_min', 'cart_total_max', 'cart_item_count', 'product_category', 'all'
    rule_value JSONB NOT NULL DEFAULT '{}',

    -- Logical operator for multiple rules on same bump
    operator VARCHAR(10) DEFAULT 'AND', -- 'AND', 'OR'

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_bump_rules_bump ON order_bump_rules(bump_id);
CREATE INDEX idx_order_bump_rules_type ON order_bump_rules(rule_type);

COMMENT ON TABLE order_bump_rules IS 'Rules determining when to show an order bump';
COMMENT ON COLUMN order_bump_rules.rule_value IS 'JSON config: {"product_ids": [1,2]}, {"min_value": 50}, {"category_id": 5}';

-- ============================================================================
-- ORDER BUMP STATISTICS
-- Track impressions and conversions
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_bump_stats (
    id SERIAL PRIMARY KEY,
    bump_id INTEGER REFERENCES order_bumps(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    session_id VARCHAR(255),

    -- Event tracking
    event_type VARCHAR(20) NOT NULL, -- 'impression', 'conversion', 'declined'

    -- Revenue tracking (for conversions)
    bump_price DECIMAL(10,2) DEFAULT 0,
    discount_applied DECIMAL(10,2) DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0, -- bump_price - discount_applied

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_bump_stats_bump ON order_bump_stats(bump_id, created_at DESC);
CREATE INDEX idx_order_bump_stats_event ON order_bump_stats(event_type, created_at DESC);
CREATE INDEX idx_order_bump_stats_order ON order_bump_stats(order_id) WHERE order_id IS NOT NULL;

COMMENT ON TABLE order_bump_stats IS 'Analytics for order bump performance';

-- ============================================================================
-- SAMPLE ORDER BUMPS (for development/testing)
-- ============================================================================

-- Sample order bump: Add 100 business cards for $10
INSERT INTO order_bumps (
    name,
    product_id,
    discount_type,
    discount_value,
    headline,
    description,
    checkbox_label,
    display_position,
    layout,
    highlight_text,
    is_active,
    priority
) VALUES (
    'Business Cards Upsell',
    1, -- Assuming product_id 1 exists
    'fixed',
    5.00,
    'Add 100 Business Cards to Your Order!',
    'Get 100 premium business cards at a special checkout-only price. Perfect for networking events!',
    'Yes! Add 100 Business Cards for only $19.99',
    'before_payment',
    'layout_2',
    'SPECIAL OFFER',
    true,
    100
);

-- Add rule: Show when cart total is over $25
INSERT INTO order_bump_rules (bump_id, rule_type, rule_value)
SELECT id, 'cart_total_min', '{"min_value": 25}'::jsonb
FROM order_bumps
WHERE name = 'Business Cards Upsell';

-- Sample order bump: Design services
INSERT INTO order_bumps (
    name,
    headline,
    description,
    checkbox_label,
    display_position,
    layout,
    background_color,
    border_color,
    is_active,
    priority
) VALUES (
    'Design Services Bump',
    'Need Help With Your Design?',
    'Our professional designers can polish your artwork for print-ready perfection. Includes unlimited revisions!',
    'Yes! Add Professional Design Review ($24.99)',
    'before_payment',
    'layout_1',
    '#EDE9FE', -- Light purple
    '#8B5CF6', -- Purple
    true,
    50
);

-- Add rule: Show for all orders
INSERT INTO order_bump_rules (bump_id, rule_type, rule_value)
SELECT id, 'all', '{}'::jsonb
FROM order_bumps
WHERE name = 'Design Services Bump';
