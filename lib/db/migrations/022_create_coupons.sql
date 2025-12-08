-- Migration: Coupon/Discount System
-- Created: 2025-12-08
-- Description: Tables for promotional codes and discounts

-- ============================================================================
-- COUPONS
-- Promotional discount codes
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    description TEXT,

    -- Discount configuration
    discount_type VARCHAR(30) NOT NULL, -- 'percentage', 'fixed_cart', 'fixed_product', 'free_shipping'
    discount_value DECIMAL(10,2) NOT NULL,

    -- Usage limits
    min_order_amount DECIMAL(10,2), -- Minimum cart value to apply
    max_discount_amount DECIMAL(10,2), -- Cap on percentage discounts
    usage_limit INTEGER, -- Total uses allowed (null = unlimited)
    usage_count INTEGER DEFAULT 0, -- Current usage count
    usage_limit_per_user INTEGER, -- Uses per email/user (null = unlimited)

    -- Product restrictions
    product_ids INTEGER[], -- Only apply to these products (null = all)
    exclude_product_ids INTEGER[], -- Exclude these products
    category_ids INTEGER[], -- Only apply to these categories
    exclude_category_ids INTEGER[], -- Exclude these categories

    -- Time restrictions
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,

    -- Combination rules
    can_combine BOOLEAN DEFAULT false, -- Can be used with other coupons
    exclude_sale_items BOOLEAN DEFAULT false, -- Don't apply to discounted items

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Auto-generation info (for abandoned cart recovery)
    auto_generated BOOLEAN DEFAULT false,
    source VARCHAR(50), -- 'manual', 'abandoned_cart', 'loyalty', 'referral'

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_coupons_code ON coupons(code) WHERE is_active = true;
CREATE INDEX idx_coupons_active ON coupons(is_active, starts_at, expires_at);
CREATE INDEX idx_coupons_source ON coupons(source) WHERE source IS NOT NULL;

-- Auto-update updated_at timestamp
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE coupons IS 'Promotional discount codes';
COMMENT ON COLUMN coupons.discount_type IS 'Type: percentage (% off), fixed_cart ($ off total), fixed_product ($ off each item), free_shipping';

-- ============================================================================
-- COUPON USAGE
-- Track each coupon redemption
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupon_usage (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    email VARCHAR(255),

    -- Discount applied
    discount_amount DECIMAL(10,2) NOT NULL,
    order_total_before DECIMAL(10,2), -- Cart total before discount
    order_total_after DECIMAL(10,2), -- Cart total after discount

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_order ON coupon_usage(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_coupon_usage_email ON coupon_usage(email) WHERE email IS NOT NULL;
CREATE INDEX idx_coupon_usage_session ON coupon_usage(session_id);

COMMENT ON TABLE coupon_usage IS 'Track each coupon redemption for analytics and limits';

-- ============================================================================
-- CART COUPONS (Applied but not yet converted)
-- Track coupons in active carts
-- ============================================================================

CREATE TABLE IF NOT EXISTS cart_coupons (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
    coupon_code VARCHAR(50) NOT NULL, -- Stored separately in case coupon is deleted

    -- Calculated discount (recalculated on cart changes)
    discount_amount DECIMAL(10,2) DEFAULT 0,

    applied_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(session_id, coupon_id)
);

CREATE INDEX idx_cart_coupons_session ON cart_coupons(session_id);
CREATE INDEX idx_cart_coupons_coupon ON cart_coupons(coupon_id);

CREATE TRIGGER update_cart_coupons_updated_at
    BEFORE UPDATE ON cart_coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cart_coupons IS 'Coupons applied to active carts (pre-checkout)';

-- ============================================================================
-- SAMPLE COUPONS (for development/testing)
-- ============================================================================

-- 10% off first order
INSERT INTO coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    usage_limit_per_user,
    is_active,
    source
) VALUES (
    'WELCOME10',
    'Welcome Discount',
    '10% off your first order',
    'percentage',
    10.00,
    1,
    true,
    'manual'
);

-- $5 off orders over $50
INSERT INTO coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    is_active,
    source
) VALUES (
    'SAVE5',
    '$5 Off $50+',
    'Save $5 on orders over $50',
    'fixed_cart',
    5.00,
    50.00,
    true,
    'manual'
);

-- 15% off for abandoned cart recovery (template)
INSERT INTO coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    max_discount_amount,
    usage_limit,
    auto_generated,
    is_active,
    source,
    expires_at
) VALUES (
    'COMEBACK15-TEMPLATE',
    'Abandoned Cart Recovery 15%',
    '15% off - come back and complete your order',
    'percentage',
    15.00,
    50.00, -- Max $50 discount
    1, -- Single use
    true,
    false, -- Template, not active
    'abandoned_cart',
    NOW() + INTERVAL '7 days'
);

-- Free shipping promo
INSERT INTO coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    is_active,
    source
) VALUES (
    'FREESHIP',
    'Free Shipping',
    'Free shipping on orders over $75',
    'free_shipping',
    0,
    75.00,
    true,
    'manual'
);
