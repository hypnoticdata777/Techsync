-- TechSync SaaS Database Schema
-- Run this SQL in your Supabase SQL Editor (or via Alembic migrations, see server/alembic/)
--
-- Multi-tenancy model (RF-05):
--   Every tenant-scoped table carries an `organization_id` column. The backend
--   (server/repositories/*) always filters by organization_id at the application
--   layer. Row Level Security is additionally enabled on every tenant table as a
--   database-level backstop (RNF-05).
--
-- NOTE on RLS + Supabase service_role key:
--   The backend uses the Supabase service_role key for trusted server-side writes
--   (e.g. creating an organization's first admin), and the service_role key
--   bypasses RLS by design. That means, for this POC, application-layer scoping
--   in the repository layer is the PRIMARY enforcement mechanism, and RLS is the
--   secondary/backstop layer, active and ready for the moment any code path uses
--   the anon/authenticated key instead (e.g. a future direct-from-client Supabase
--   access path). To make RLS effective in that scenario, sign the JWT handed to
--   PostgREST with the Supabase project's JWT secret and include an
--   `organization_id` claim, then call `supabase.postgrest.auth(token)` before
--   querying -- PostgREST will expose the claim as
--   current_setting('request.jwt.claims', true)::json->>'organization_id', which
--   is what the policies below read.

-- =====================================================================
-- Extensions
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- Helper: read organization_id out of the PostgREST JWT claims
-- =====================================================================
CREATE OR REPLACE FUNCTION techsync_current_org_id()
RETURNS BIGINT AS $$
    SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'organization_id', '')::BIGINT
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- organizations (tenants)
-- =====================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    industry TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,  -- service_types, custom priorities, etc (RF-08)
    plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'free', 'pro')),
    subscription_status TEXT NOT NULL DEFAULT 'trialing'
        CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    technician_limit INT NOT NULL DEFAULT 3,  -- RF-29 plan restriction
    api_key TEXT UNIQUE,  -- RF-11: used to authenticate inbound webhook ingestion
    deleted_at TIMESTAMP WITH TIME ZONE,       -- RNF-13 soft delete on tenant removal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_api_key ON organizations(api_key);

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Organizations are only visible to members of that org (except inserts, which
-- happen server-side during onboarding using the service role key).
CREATE POLICY organizations_isolation ON organizations
    USING (id = techsync_current_org_id());

-- =====================================================================
-- users
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician'
        CHECK (role IN ('org_admin', 'coordinator', 'technician')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, role);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_isolation ON users
    USING (organization_id = techsync_current_org_id());

-- =====================================================================
-- password_reset_tokens (RF-03)
-- =====================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- =====================================================================
-- invitations (RF-07)
-- =====================================================================
CREATE TABLE IF NOT EXISTS invitations (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician'
        CHECK (role IN ('org_admin', 'coordinator', 'technician')),
    token_hash TEXT NOT NULL,
    invited_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_isolation ON invitations
    USING (organization_id = techsync_current_org_id());

-- =====================================================================
-- technicians: field-service profile attached to a technician user (RF-26)
-- =====================================================================
CREATE TABLE IF NOT EXISTS technicians (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT[] NOT NULL DEFAULT '{}',
    certifications TEXT[] NOT NULL DEFAULT '{}',
    zone TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    availability_status TEXT NOT NULL DEFAULT 'available'
        CHECK (availability_status IN ('available', 'busy', 'off_duty')),
    max_daily_jobs INT NOT NULL DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_technicians_org ON technicians(organization_id);

CREATE TRIGGER update_technicians_updated_at
    BEFORE UPDATE ON technicians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY technicians_isolation ON technicians
    USING (organization_id = techsync_current_org_id());

-- =====================================================================
-- work_orders (RF-18)
-- =====================================================================
CREATE TABLE IF NOT EXISTS work_orders (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    customer_name TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    service_type TEXT NOT NULL DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    assigned_technician_id BIGINT REFERENCES technicians(id) ON DELETE SET NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'csv', 'webhook', 'email', 'pdf')),
    external_ref TEXT,
    sla_due_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_org_status ON work_orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_org_tech ON work_orders(organization_id, assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at DESC);

CREATE TRIGGER update_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_orders_isolation ON work_orders
    USING (organization_id = techsync_current_org_id());

-- =====================================================================
-- work_order_events: audit log (RF-20)
-- =====================================================================
CREATE TABLE IF NOT EXISTS work_order_events (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,  -- created, status_changed, assigned, reassigned, attachment_added
    from_status TEXT,
    to_status TEXT,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wo_events_org ON work_order_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_wo_events_wo ON work_order_events(work_order_id, created_at DESC);

ALTER TABLE work_order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_order_events_isolation ON work_order_events
    USING (organization_id = techsync_current_org_id());

-- =====================================================================
-- work_order_attachments (RF-19)
-- =====================================================================
CREATE TABLE IF NOT EXISTS work_order_attachments (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    content_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wo_attachments_wo ON work_order_attachments(work_order_id);

ALTER TABLE work_order_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_order_attachments_isolation ON work_order_attachments
    USING (organization_id = techsync_current_org_id());

-- =====================================================================
-- org_priority_rules (RF-17, Could)
-- =====================================================================
CREATE TABLE IF NOT EXISTS org_priority_rules (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    forced_priority TEXT NOT NULL CHECK (forced_priority IN ('low', 'medium', 'high', 'emergency')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (organization_id, service_type)
);

ALTER TABLE org_priority_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_priority_rules_isolation ON org_priority_rules
    USING (organization_id = techsync_current_org_id());

-- =====================================================================
-- Seed data for local/demo use (idempotent)
-- =====================================================================
INSERT INTO organizations (name, slug, industry, timezone, plan, subscription_status, trial_ends_at, technician_limit)
VALUES ('TechSync Demo', 'techsync-demo', 'field-services', 'America/New_York', 'trial', 'trialing', TIMEZONE('utc'::text, NOW()) + INTERVAL '14 days', 3)
ON CONFLICT (slug) DO NOTHING;

-- Sample users for testing. Password is 'password123' hashed with bcrypt.
INSERT INTO users (organization_id, email, password_hash, full_name, role)
SELECT id, 'admin@techsync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lSN.qFi0KdUi', 'Admin User', 'org_admin'
FROM organizations WHERE slug = 'techsync-demo'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (organization_id, email, password_hash, full_name, role)
SELECT id, 'tech@techsync.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lSN.qFi0KdUi', 'John Technician', 'technician'
FROM organizations WHERE slug = 'techsync-demo'
ON CONFLICT (email) DO NOTHING;

INSERT INTO technicians (organization_id, user_id, skills, zone, availability_status)
SELECT o.id, u.id, ARRAY['plumbing', 'hvac'], 'north', 'available'
FROM organizations o JOIN users u ON u.organization_id = o.id
WHERE o.slug = 'techsync-demo' AND u.email = 'tech@techsync.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO work_orders (organization_id, title, description, status, priority, service_type, created_by, assigned_technician_id, source)
SELECT o.id, 'Leak under kitchen sink', 'Tenant reports slow drip. Check pipes and seals.', 'open', 'high', 'plumbing',
       (SELECT id FROM users WHERE email = 'admin@techsync.com'),
       (SELECT id FROM technicians WHERE organization_id = o.id LIMIT 1),
       'manual'
FROM organizations o
WHERE o.slug = 'techsync-demo'
  AND NOT EXISTS (SELECT 1 FROM work_orders WHERE title = 'Leak under kitchen sink');
