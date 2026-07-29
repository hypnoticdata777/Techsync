"""Expand work-order lifecycle states.

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-29
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE work_orders
            DROP CONSTRAINT IF EXISTS work_orders_status_check;
        ALTER TABLE work_orders
            ADD CONSTRAINT work_orders_status_check
            CHECK (status IN (
                'open',
                'in_progress',
                'paused',
                'escalated',
                'completed',
                'cancelled',
                'archived'
            ));
        CREATE INDEX IF NOT EXISTS idx_work_orders_org_status_updated
            ON work_orders(organization_id, status, updated_at);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE work_orders
        SET status = 'open'
        WHERE status IN ('paused', 'escalated');

        UPDATE work_orders
        SET status = 'cancelled'
        WHERE status = 'archived';

        DROP INDEX IF EXISTS idx_work_orders_org_status_updated;
        ALTER TABLE work_orders
            DROP CONSTRAINT IF EXISTS work_orders_status_check;
        ALTER TABLE work_orders
            ADD CONSTRAINT work_orders_status_check
            CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled'));
        """
    )
