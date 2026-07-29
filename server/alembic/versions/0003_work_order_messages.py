"""Add work order messages with internal/client visibility.

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-28
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS work_order_messages (
            id BIGSERIAL PRIMARY KEY,
            organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
            author_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
            visibility TEXT NOT NULL DEFAULT 'internal'
                CHECK (visibility IN ('internal', 'client')),
            body TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_wo_messages_org
            ON work_order_messages(organization_id);
        CREATE INDEX IF NOT EXISTS idx_wo_messages_work_order
            ON work_order_messages(work_order_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_wo_messages_org_visibility
            ON work_order_messages(organization_id, visibility);

        ALTER TABLE work_order_messages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS work_order_messages_isolation ON work_order_messages;
        CREATE POLICY work_order_messages_isolation ON work_order_messages
            USING (organization_id = techsync_current_org_id());
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS work_order_messages CASCADE;")
