"""Add work-order cost summary fields.

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-30
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE work_orders
            ADD COLUMN IF NOT EXISTS estimated_cost_cents BIGINT,
            ADD COLUMN IF NOT EXISTS actual_cost_cents BIGINT,
            ADD COLUMN IF NOT EXISTS invoice_reference TEXT;

        ALTER TABLE work_orders
            DROP CONSTRAINT IF EXISTS work_orders_estimated_cost_cents_check;
        ALTER TABLE work_orders
            ADD CONSTRAINT work_orders_estimated_cost_cents_check
            CHECK (estimated_cost_cents IS NULL OR estimated_cost_cents >= 0);

        ALTER TABLE work_orders
            DROP CONSTRAINT IF EXISTS work_orders_actual_cost_cents_check;
        ALTER TABLE work_orders
            ADD CONSTRAINT work_orders_actual_cost_cents_check
            CHECK (actual_cost_cents IS NULL OR actual_cost_cents >= 0);

        CREATE INDEX IF NOT EXISTS idx_work_orders_org_cost_created
            ON work_orders(organization_id, created_at)
            WHERE estimated_cost_cents IS NOT NULL OR actual_cost_cents IS NOT NULL;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS idx_work_orders_org_cost_created;
        ALTER TABLE work_orders
            DROP CONSTRAINT IF EXISTS work_orders_actual_cost_cents_check;
        ALTER TABLE work_orders
            DROP CONSTRAINT IF EXISTS work_orders_estimated_cost_cents_check;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS invoice_reference;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS actual_cost_cents;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS estimated_cost_cents;
        """
    )
