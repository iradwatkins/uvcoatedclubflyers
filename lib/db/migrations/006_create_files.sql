-- Create files table for design uploads (MinIO integration)
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    order_item_id INTEGER REFERENCES order_items(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('pdf', 'ai', 'psd', 'png', 'jpg', 'jpeg', 'eps', 'tiff')),
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    storage_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    file_hash VARCHAR(64),
    metadata JSONB,
    validation_status VARCHAR(50) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected', 'needs_review')),
    validation_notes TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_user ON files(user_id);
CREATE INDEX idx_files_order_item ON files(order_item_id);
CREATE INDEX idx_files_hash ON files(file_hash);
CREATE INDEX idx_files_validation ON files(validation_status);
CREATE INDEX idx_files_uploaded ON files(uploaded_at DESC);
