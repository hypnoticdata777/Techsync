"""Add client approval state to work orders.

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-28
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE work_orders
            ADD COLUMN IF NOT EXISTS client_approval_status TEXT NOT NULL DEFAULT 'not_required'
                CHECK (client_approval_status IN ('not_required', 'pending', 'approved', 'declined'));
        ALTER TABLE work_orders
            ADD COLUMN IF NOT EXISTS client_approval_requested_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE work_orders
            ADD COLUMN IF NOT EXISTS client_approval_requested_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE work_orders
            ADD COLUMN IF NOT EXISTS client_approval_decision_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE work_orders
            ADD COLUMN IF NOT EXISTS client_approval_decision_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE work_orders
            ADD COLUMN IF NOT EXISTS client_approval_notes TEXT;

        CREATE INDEX IF NOT EXISTS idx_work_orders_org_client_approval
            ON work_orders(organization_id, client_approval_status);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS idx_work_orders_org_client_approval;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS client_approval_notes;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS client_approval_decision_by;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS client_approval_decision_at;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS client_approval_requested_by;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS client_approval_requested_at;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS client_approval_status;
        """
    )
