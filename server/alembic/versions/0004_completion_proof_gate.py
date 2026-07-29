"""Add completion proof and manager override fields.

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-28
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE work_orders
            ADD COLUMN IF NOT EXISTS completion_proof_verified_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE work_orders
            ADD COLUMN IF NOT EXISTS completion_override_reason TEXT;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE work_orders DROP COLUMN IF EXISTS completion_override_reason;
        ALTER TABLE work_orders DROP COLUMN IF EXISTS completion_proof_verified_at;
        """
    )
