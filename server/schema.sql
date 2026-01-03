-- TechSync Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
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

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO work_orders (title, description, status) VALUES
    ('Leak under kitchen sink', 'Tenant reports slow drip. Check pipes and seals.', 'pending'),
    ('Turnover cleaning – Unit 3B', 'Full clean between tenants. Kitchen, bath, floors.', 'in_progress'),
    ('Replace air filter – Unit 12A', 'Quarterly HVAC maintenance.', 'pending')
ON CONFLICT DO NOTHING;
