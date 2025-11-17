-- Create print_jobs table for production tracking
CREATE TABLE IF NOT EXISTS print_jobs (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    job_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'prepress', 'printing', 'finishing', 'quality_check', 'completed', 'on_hold')),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    estimated_completion TIMESTAMP,
    completed_at TIMESTAMP,
    production_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_print_jobs_order_item ON print_jobs(order_item_id);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_print_jobs_assigned ON print_jobs(assigned_to);
CREATE INDEX idx_print_jobs_priority ON print_jobs(priority DESC, created_at ASC);

-- Create trigger for print_jobs table
CREATE TRIGGER update_print_jobs_updated_at
    BEFORE UPDATE ON print_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create print_job_history table for status tracking
CREATE TABLE IF NOT EXISTS print_job_history (
    id SERIAL PRIMARY KEY,
    print_job_id INTEGER NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_history_job ON print_job_history(print_job_id);
CREATE INDEX idx_job_history_created ON print_job_history(created_at DESC);
