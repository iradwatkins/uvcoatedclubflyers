-- Migration: Abandoned Cart Recovery
-- Created: 2025-12-08
-- Description: Tables for abandoned cart tracking and recovery email sequences

-- ============================================================================
-- ABANDONED CARTS
-- Track abandoned shopping carts for recovery emails
-- ============================================================================

CREATE TABLE IF NOT EXISTS abandoned_carts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Customer info (may be captured at checkout start)
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),

    -- Cart snapshot
    cart_data JSONB NOT NULL, -- Full cart items snapshot
    cart_total DECIMAL(10,2) NOT NULL,
    item_count INTEGER DEFAULT 0,

    -- Recovery status
    recovery_status VARCHAR(30) DEFAULT 'active', -- 'active', 'email_scheduled', 'email_sent', 'recovered', 'expired', 'unsubscribed'
    emails_sent INTEGER DEFAULT 0,
    max_emails INTEGER DEFAULT 3,

    -- Timing
    last_activity_at TIMESTAMP DEFAULT NOW(),
    abandonment_detected_at TIMESTAMP, -- Set when cart becomes "abandoned"
    first_email_sent_at TIMESTAMP,
    last_email_sent_at TIMESTAMP,
    recovered_at TIMESTAMP,

    -- Recovery tracking
    recovery_token VARCHAR(100) UNIQUE,
    recovered_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,

    -- Discount applied for recovery
    recovery_coupon_code VARCHAR(50),
    recovery_discount_amount DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_abandoned_carts_session ON abandoned_carts(session_id);
CREATE INDEX idx_abandoned_carts_email ON abandoned_carts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_abandoned_carts_status ON abandoned_carts(recovery_status);
CREATE INDEX idx_abandoned_carts_activity ON abandoned_carts(last_activity_at);
CREATE INDEX idx_abandoned_carts_abandonment ON abandoned_carts(abandonment_detected_at) WHERE abandonment_detected_at IS NOT NULL;
CREATE INDEX idx_abandoned_carts_token ON abandoned_carts(recovery_token) WHERE recovery_token IS NOT NULL;

CREATE TRIGGER update_abandoned_carts_updated_at
    BEFORE UPDATE ON abandoned_carts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE abandoned_carts IS 'Track abandoned shopping carts for email recovery campaigns';
COMMENT ON COLUMN abandoned_carts.cart_data IS 'Full JSON snapshot of cart items at abandonment time';
COMMENT ON COLUMN abandoned_carts.recovery_token IS 'Unique token for recovery links in emails';

-- ============================================================================
-- ABANDONED CART EMAILS
-- Track individual emails sent for cart recovery
-- ============================================================================

CREATE TABLE IF NOT EXISTS abandoned_cart_emails (
    id SERIAL PRIMARY KEY,
    abandoned_cart_id INTEGER REFERENCES abandoned_carts(id) ON DELETE CASCADE,

    -- Email details
    email_number INTEGER NOT NULL, -- 1, 2, 3 (sequence number)
    subject VARCHAR(255) NOT NULL,
    template_name VARCHAR(100) NOT NULL,

    -- Recipient
    recipient_email VARCHAR(255) NOT NULL,

    -- Coupon included (if any)
    coupon_code VARCHAR(50),
    discount_type VARCHAR(20),
    discount_value DECIMAL(10,2),

    -- Scheduling
    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,

    -- Engagement tracking
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    click_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'failed', 'opened', 'clicked'
    error_message TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cart_emails_cart ON abandoned_cart_emails(abandoned_cart_id);
CREATE INDEX idx_cart_emails_scheduled ON abandoned_cart_emails(scheduled_for, status) WHERE status = 'scheduled';
CREATE INDEX idx_cart_emails_status ON abandoned_cart_emails(status);

COMMENT ON TABLE abandoned_cart_emails IS 'Track individual recovery emails sent per abandoned cart';

-- ============================================================================
-- ABANDONED CART EMAIL TEMPLATES
-- Configure email sequence timing and content
-- ============================================================================

CREATE TABLE IF NOT EXISTS abandoned_cart_email_templates (
    id SERIAL PRIMARY KEY,
    email_number INTEGER NOT NULL UNIQUE, -- 1, 2, 3

    -- Template details
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    preview_text VARCHAR(255),
    template_key VARCHAR(50) NOT NULL, -- Reference to email template file

    -- Timing (hours after abandonment)
    delay_hours INTEGER NOT NULL,

    -- Discount configuration
    include_discount BOOLEAN DEFAULT false,
    discount_type VARCHAR(20), -- 'percentage', 'fixed'
    discount_value DECIMAL(10,2),

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_cart_email_templates_updated_at
    BEFORE UPDATE ON abandoned_cart_email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default email sequence
INSERT INTO abandoned_cart_email_templates (email_number, name, subject, preview_text, template_key, delay_hours, include_discount, discount_type, discount_value)
VALUES
(1, 'Reminder Email', 'You left something in your cart!', 'Complete your order before your items sell out', 'abandoned-cart-1', 1, false, NULL, NULL),
(2, 'Follow-up Email', 'Still thinking about it? Here''s 10% off!', 'Use code COMEBACK10 for 10% off your order', 'abandoned-cart-2', 24, true, 'percentage', 10),
(3, 'Final Reminder', 'Last chance! 15% off expires soon', 'Your cart and discount expire in 24 hours', 'abandoned-cart-3', 72, true, 'percentage', 15);

COMMENT ON TABLE abandoned_cart_email_templates IS 'Configuration for abandoned cart email sequence';

-- ============================================================================
-- ABANDONED CART STATISTICS
-- Aggregate stats for tracking recovery performance
-- ============================================================================

CREATE TABLE IF NOT EXISTS abandoned_cart_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,

    -- Volume metrics
    carts_abandoned INTEGER DEFAULT 0,
    carts_recovered INTEGER DEFAULT 0,
    carts_expired INTEGER DEFAULT 0,

    -- Email metrics
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,

    -- Revenue metrics
    abandoned_value DECIMAL(15,2) DEFAULT 0,
    recovered_value DECIMAL(15,2) DEFAULT 0,

    -- Rates (pre-calculated for dashboard)
    recovery_rate DECIMAL(5,2), -- recovered / abandoned * 100
    email_open_rate DECIMAL(5,2),
    email_click_rate DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cart_stats_date ON abandoned_cart_stats(date DESC);

CREATE TRIGGER update_cart_stats_updated_at
    BEFORE UPDATE ON abandoned_cart_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE abandoned_cart_stats IS 'Daily aggregate statistics for abandoned cart recovery';
