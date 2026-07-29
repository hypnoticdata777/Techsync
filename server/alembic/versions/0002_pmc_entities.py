"""Add PMC property, client, and vendor foundation.

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-28
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check
            CHECK (role IN ('org_admin', 'coordinator', 'technician', 'vendor', 'client', 'viewer'));

        ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_role_check;
        ALTER TABLE invitations ADD CONSTRAINT invitations_role_check
            CHECK (role IN ('org_admin', 'coordinator', 'technician', 'vendor', 'client', 'viewer'));

        CREATE TABLE IF NOT EXISTS clients (
            id BIGSERIAL PRIMARY KEY,
            organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            display_name TEXT NOT NULL,
            contact_name TEXT,
            email TEXT,
            phone TEXT,
            client_type TEXT NOT NULL DEFAULT 'homeowner'
                CHECK (client_type IN ('homeowner', 'owner', 'tenant', 'board_member', 'other')),
            notes TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
        CREATE INDEX IF NOT EXISTS idx_clients_org_email ON clients(organization_id, email);

        DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
        CREATE TRIGGER update_clients_updated_at
            BEFORE UPDATE ON clients
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS clients_isolation ON clients;
        CREATE POLICY clients_isolation ON clients
            USING (organization_id = techsync_current_org_id());

        CREATE TABLE IF NOT EXISTS properties (
            id BIGSERIAL PRIMARY KEY,
            organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
            name TEXT NOT NULL,
            address_line1 TEXT NOT NULL,
            address_line2 TEXT,
            city TEXT,
            state TEXT,
            postal_code TEXT,
            country TEXT NOT NULL DEFAULT 'US',
            unit TEXT,
            access_notes TEXT,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_properties_org ON properties(organization_id);
        CREATE INDEX IF NOT EXISTS idx_properties_org_client ON properties(organization_id, client_id);
        CREATE INDEX IF NOT EXISTS idx_properties_org_active ON properties(organization_id, is_active);

        DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
        CREATE TRIGGER update_properties_updated_at
            BEFORE UPDATE ON properties
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS properties_isolation ON properties;
        CREATE POLICY properties_isolation ON properties
            USING (organization_id = techsync_current_org_id());

        CREATE TABLE IF NOT EXISTS vendors (
            id BIGSERIAL PRIMARY KEY,
            organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            contact_name TEXT,
            email TEXT,
            phone TEXT,
            service_types TEXT[] NOT NULL DEFAULT '{}',
            coverage_area TEXT,
            notes TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors(organization_id);
        CREATE INDEX IF NOT EXISTS idx_vendors_org_active ON vendors(organization_id, is_active);

        DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
        CREATE TRIGGER update_vendors_updated_at
            BEFORE UPDATE ON vendors
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS vendors_isolation ON vendors;
        CREATE POLICY vendors_isolation ON vendors
            USING (organization_id = techsync_current_org_id());

        ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS property_id BIGINT;
        ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS client_id BIGINT;
        ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vendor_id BIGINT;

        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_property_id_fkey'
            ) THEN
                ALTER TABLE work_orders
                    ADD CONSTRAINT work_orders_property_id_fkey
                    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_client_id_fkey'
            ) THEN
                ALTER TABLE work_orders
                    ADD CONSTRAINT work_orders_client_id_fkey
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_vendor_id_fkey'
            ) THEN
                ALTER TABLE work_orders
                    ADD CONSTRAINT work_orders_vendor_id_fkey
                    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;
            END IF;
        END $$;

        CREATE INDEX IF NOT EXISTS idx_work_orders_org_property ON work_orders(organization_id, property_id);
        CREATE INDEX IF NOT EXISTS idx_work_orders_org_client ON work_orders(organization_id, client_id);
        CREATE INDEX IF NOT EXISTS idx_work_orders_org_vendor ON work_orders(organization_id, vendor_id);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_vendor_id_fkey;
        ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_client_id_fkey;
        ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_property_id_fkey;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS vendor_id;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS client_id;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS property_id;

        DROP TABLE IF EXISTS vendors CASCADE;
        DROP TABLE IF EXISTS properties CASCADE;
        DROP TABLE IF EXISTS clients CASCADE;

        ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_role_check;
        ALTER TABLE invitations ADD CONSTRAINT invitations_role_check
            CHECK (role IN ('org_admin', 'coordinator', 'technician'));

        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check
            CHECK (role IN ('org_admin', 'coordinator', 'technician'));
        """
    )
