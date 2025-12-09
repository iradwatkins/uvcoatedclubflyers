-- Migration: Contact CRM System
-- Created: 2025-12-09
-- Description: Contact management, tags, notes, activity tracking, and automation events

-- ============================================================================
-- CONTACTS
-- Central contact record (extends users but can exist independently for guests)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Contact info
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    company VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',

    -- Custom fields (JSONB for flexibility)
    custom_fields JSONB DEFAULT '{}',

    -- Engagement metrics
    lifetime_value DECIMAL(12,2) DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    last_order_at TIMESTAMP,
    first_order_at TIMESTAMP,
    average_order_value DECIMAL(10,2) DEFAULT 0,

    -- Email engagement
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    last_email_sent_at TIMESTAMP,
    last_email_opened_at TIMESTAMP,

    -- Status
    status VARCHAR(30) DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced', 'spam_complaint'
    email_subscribed BOOLEAN DEFAULT true,
    sms_subscribed BOOLEAN DEFAULT false,

    -- Source tracking
    source VARCHAR(50), -- 'checkout', 'signup', 'import', 'manual'
    source_details VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint on email
CREATE UNIQUE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_user ON contacts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_lifetime_value ON contacts(lifetime_value DESC);
CREATE INDEX idx_contacts_last_order ON contacts(last_order_at DESC);

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE contacts IS 'Central CRM contact records with engagement metrics';

-- ============================================================================
-- CONTACT TAGS
-- Tag definitions for categorizing contacts
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color
    description TEXT,

    -- Auto-tag rules (JSONB for flexibility)
    auto_rules JSONB, -- e.g., {"lifetime_value_gt": 500, "order_count_gt": 3}

    contact_count INTEGER DEFAULT 0, -- Denormalized for performance

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contact_tags_slug ON contact_tags(slug);

CREATE TRIGGER update_contact_tags_updated_at
    BEFORE UPDATE ON contact_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE contact_tags IS 'Tag definitions for categorizing contacts (VIP, repeat-buyer, etc.)';

-- ============================================================================
-- CONTACT TAG ASSIGNMENTS
-- Many-to-many relationship between contacts and tags
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_tag_assignments (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,

    -- Who/what assigned the tag
    assigned_by VARCHAR(50) DEFAULT 'manual', -- 'manual', 'automation', 'import', 'rule'
    assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    automation_id INTEGER, -- Reference to automation if auto-assigned

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(contact_id, tag_id)
);

CREATE INDEX idx_tag_assignments_contact ON contact_tag_assignments(contact_id);
CREATE INDEX idx_tag_assignments_tag ON contact_tag_assignments(tag_id);

COMMENT ON TABLE contact_tag_assignments IS 'Many-to-many relationship between contacts and tags';

-- ============================================================================
-- CONTACT NOTES
-- Internal notes about contacts
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_notes (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    note TEXT NOT NULL,
    note_type VARCHAR(30) DEFAULT 'general', -- 'general', 'support', 'sales', 'complaint'

    -- Who created the note
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(255),

    -- Pinned notes stay at top
    is_pinned BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contact_notes_contact ON contact_notes(contact_id);
CREATE INDEX idx_contact_notes_pinned ON contact_notes(contact_id, is_pinned) WHERE is_pinned = true;

CREATE TRIGGER update_contact_notes_updated_at
    BEFORE UPDATE ON contact_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE contact_notes IS 'Internal notes about contacts for CRM';

-- ============================================================================
-- CONTACT ACTIVITY
-- Activity timeline tracking all interactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_activity (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    -- Activity type
    activity_type VARCHAR(50) NOT NULL,
    -- Types: 'order_placed', 'order_shipped', 'order_completed',
    --        'email_sent', 'email_opened', 'email_clicked',
    --        'cart_abandoned', 'cart_recovered',
    --        'tag_added', 'tag_removed',
    --        'note_added', 'profile_updated',
    --        'subscription_changed', 'automation_triggered'

    -- Activity details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}', -- Additional context data

    -- Related entities
    order_id INTEGER,
    email_id INTEGER,
    automation_id INTEGER,

    -- Icon for display
    icon VARCHAR(50),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contact_activity_contact ON contact_activity(contact_id);
CREATE INDEX idx_contact_activity_type ON contact_activity(activity_type);
CREATE INDEX idx_contact_activity_created ON contact_activity(contact_id, created_at DESC);

COMMENT ON TABLE contact_activity IS 'Activity timeline for contacts - all interactions and events';

-- ============================================================================
-- AUTOMATION EVENTS
-- Event triggers for marketing automations
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_events (
    id SERIAL PRIMARY KEY,

    -- Event definition
    event_type VARCHAR(50) NOT NULL,
    -- Types: 'order_created', 'order_status_changed', 'order_completed',
    --        'days_after_order', 'days_since_last_order',
    --        'cart_abandoned', 'cart_recovered',
    --        'tag_added', 'tag_removed',
    --        'contact_created', 'subscription_changed'

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Enabled/disabled
    is_active BOOLEAN DEFAULT true,

    -- Event conditions (JSONB for flexibility)
    conditions JSONB DEFAULT '{}',
    -- e.g., {"status": "completed", "min_value": 100}

    -- Actions to take (JSONB array)
    actions JSONB DEFAULT '[]',
    -- e.g., [{"type": "send_email", "template": "thank-you", "delay_hours": 0}]

    -- Stats
    times_triggered INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_automation_events_type ON automation_events(event_type) WHERE is_active = true;

CREATE TRIGGER update_automation_events_updated_at
    BEFORE UPDATE ON automation_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE automation_events IS 'Automation event definitions and their actions';

-- ============================================================================
-- AUTOMATION QUEUE
-- Queued automation actions to be processed
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_queue (
    id SERIAL PRIMARY KEY,

    automation_event_id INTEGER REFERENCES automation_events(id) ON DELETE SET NULL,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,

    -- Action details
    action_type VARCHAR(50) NOT NULL, -- 'send_email', 'add_tag', 'remove_tag', 'send_sms', 'webhook'
    action_data JSONB NOT NULL,

    -- Scheduling
    scheduled_for TIMESTAMP NOT NULL,

    -- Status
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'

    -- Processing info
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,

    -- Context
    trigger_event VARCHAR(50), -- What triggered this
    trigger_data JSONB, -- Context from the trigger

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_automation_queue_scheduled ON automation_queue(scheduled_for, status)
    WHERE status = 'pending';
CREATE INDEX idx_automation_queue_contact ON automation_queue(contact_id);
CREATE INDEX idx_automation_queue_status ON automation_queue(status);

CREATE TRIGGER update_automation_queue_updated_at
    BEFORE UPDATE ON automation_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE automation_queue IS 'Queue of automation actions to be processed';

-- ============================================================================
-- AUTOMATION LOG
-- Log of all automation actions taken
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_log (
    id SERIAL PRIMARY KEY,

    automation_event_id INTEGER,
    automation_queue_id INTEGER,
    contact_id INTEGER,

    -- Action details
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB,

    -- Result
    status VARCHAR(30) NOT NULL, -- 'success', 'failed', 'skipped'
    result_data JSONB,
    error_message TEXT,

    -- Timing
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_ms INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_automation_log_contact ON automation_log(contact_id);
CREATE INDEX idx_automation_log_event ON automation_log(automation_event_id);
CREATE INDEX idx_automation_log_created ON automation_log(created_at DESC);

COMMENT ON TABLE automation_log IS 'Historical log of all automation actions';

-- ============================================================================
-- EMAIL CAMPAIGNS (Broadcasts)
-- One-time email campaigns/broadcasts
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
    id SERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    preview_text VARCHAR(255),

    -- Content
    template_key VARCHAR(100),
    html_content TEXT,
    text_content TEXT,

    -- Targeting
    target_tags INTEGER[], -- Tag IDs to include
    exclude_tags INTEGER[], -- Tag IDs to exclude
    target_filters JSONB, -- Additional filters

    -- Status
    status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'cancelled'
    scheduled_for TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Stats
    total_recipients INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    emails_unsubscribed INTEGER DEFAULT 0,

    -- Created by
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_for)
    WHERE status = 'scheduled';

CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE email_campaigns IS 'One-time email broadcast campaigns';

-- ============================================================================
-- INSERT DEFAULT TAGS
-- ============================================================================

INSERT INTO contact_tags (name, slug, color, description, auto_rules) VALUES
('VIP', 'vip', '#8B5CF6', 'High-value customers with lifetime value > $500', '{"lifetime_value_gt": 500}'),
('Repeat Buyer', 'repeat-buyer', '#3B82F6', 'Customers with 2+ orders', '{"order_count_gt": 1}'),
('First Time', 'first-time', '#10B981', 'New customers with only 1 order', '{"order_count_eq": 1}'),
('At Risk', 'at-risk', '#F59E0B', 'Haven''t ordered in 90+ days', '{"days_since_order_gt": 90}'),
('Abandoned Cart', 'abandoned-cart', '#EF4444', 'Has abandoned cart', NULL),
('Email Engaged', 'email-engaged', '#06B6D4', 'Opens/clicks emails regularly', '{"email_open_rate_gt": 0.3}'),
('Wholesale', 'wholesale', '#6366F1', 'Wholesale/bulk buyer', NULL),
('Newsletter', 'newsletter', '#EC4899', 'Subscribed to newsletter', NULL)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- INSERT DEFAULT AUTOMATION EVENTS
-- ============================================================================

INSERT INTO automation_events (event_type, name, description, is_active, conditions, actions) VALUES
(
    'order_completed',
    'Thank You Email',
    'Send thank you email after order is completed',
    true,
    '{}',
    '[{"type": "send_email", "template": "thank-you", "delay_hours": 0}]'
),
(
    'days_after_order',
    'Review Request (7 days)',
    'Ask for product review 7 days after order',
    true,
    '{"days": 7, "order_status": "completed"}',
    '[{"type": "send_email", "template": "review-request", "delay_hours": 0}]'
),
(
    'days_since_last_order',
    'Win-Back Campaign (60 days)',
    'Re-engage customers who haven''t ordered in 60 days',
    true,
    '{"days": 60}',
    '[{"type": "send_email", "template": "winback", "delay_hours": 0}, {"type": "add_tag", "tag": "at-risk"}]'
),
(
    'contact_created',
    'Welcome Series',
    'Send welcome email to new contacts',
    true,
    '{"source": "signup"}',
    '[{"type": "send_email", "template": "welcome", "delay_hours": 0}]'
),
(
    'order_created',
    'Tag First Time Buyer',
    'Add first-time tag to new customers',
    true,
    '{"is_first_order": true}',
    '[{"type": "add_tag", "tag": "first-time"}]'
),
(
    'order_created',
    'Tag Repeat Buyer',
    'Add repeat-buyer tag when customer places 2nd order',
    true,
    '{"order_count": 2}',
    '[{"type": "add_tag", "tag": "repeat-buyer"}, {"type": "remove_tag", "tag": "first-time"}]'
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE automation_events IS 'Pre-configured automation events for common scenarios';
