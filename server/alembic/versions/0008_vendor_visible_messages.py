"""Add vendor-visible work-order messages.

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-30
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE work_order_messages
            DROP CONSTRAINT IF EXISTS work_order_messages_visibility_check;
        ALTER TABLE work_order_messages
            ADD CONSTRAINT work_order_messages_visibility_check
            CHECK (visibility IN ('internal', 'client', 'vendor'));
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE work_order_messages
        SET visibility = 'internal'
        WHERE visibility = 'vendor';

        ALTER TABLE work_order_messages
            DROP CONSTRAINT IF EXISTS work_order_messages_visibility_check;
        ALTER TABLE work_order_messages
            ADD CONSTRAINT work_order_messages_visibility_check
            CHECK (visibility IN ('internal', 'client'));
        """
    )
