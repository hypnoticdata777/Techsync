-- TechSync Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at for work_orders
CREATE TRIGGER update_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample users for testing
-- Note: Password is 'password123' hashed with bcrypt
INSERT INTO users (email, password_hash, full_name, role) VALUES
    ('admin@techsync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lSN.qFi0KdUi', 'Admin User', 'admin'),
    ('tech@techsync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lSN.qFi0KdUi', 'John Technician', 'technician')
ON CONFLICT (email) DO NOTHING;

-- Insert sample work orders for testing
INSERT INTO work_orders (title, description, status, created_by, assigned_to)
SELECT
    'Leak under kitchen sink',
    'Tenant reports slow drip. Check pipes and seals.',
    'pending',
    (SELECT id FROM users WHERE email = 'admin@techsync.com'),
    (SELECT id FROM users WHERE email = 'tech@techsync.com')
WHERE NOT EXISTS (SELECT 1 FROM work_orders WHERE title = 'Leak under kitchen sink');

INSERT INTO work_orders (title, description, status, created_by, assigned_to)
SELECT
    'Turnover cleaning – Unit 3B',
    'Full clean between tenants. Kitchen, bath, floors.',
    'in_progress',
    (SELECT id FROM users WHERE email = 'admin@techsync.com'),
    (SELECT id FROM users WHERE email = 'tech@techsync.com')
WHERE NOT EXISTS (SELECT 1 FROM work_orders WHERE title = 'Turnover cleaning – Unit 3B');

INSERT INTO work_orders (title, description, status, created_by)
SELECT
    'Replace air filter – Unit 12A',
    'Quarterly HVAC maintenance.',
    'pending',
    (SELECT id FROM users WHERE email = 'admin@techsync.com')
WHERE NOT EXISTS (SELECT 1 FROM work_orders WHERE title = 'Replace air filter – Unit 12A');
