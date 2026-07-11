"""Initial multi-tenant schema: organizations, users, invitations,
password reset tokens, technicians, work orders, audit log, attachments,
priority rules, RLS policies (RF-05, RNF-05, RNF-10).

Revision ID: 0001
Revises:
Create Date: 2026-07-08
"""

from pathlib import Path
from typing import Sequence, Union

from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Single source of truth for the schema lives in server/schema.sql so it can
# be applied to any managed Postgres database.
SCHEMA_SQL_PATH = Path(__file__).resolve().parents[2] / "schema.sql"


def upgrade() -> None:
    sql = SCHEMA_SQL_PATH.read_text()
    op.execute(sql)


def downgrade() -> None:
    op.execute(
        """
        DROP TABLE IF EXISTS org_priority_rules CASCADE;
        DROP TABLE IF EXISTS work_order_attachments CASCADE;
        DROP TABLE IF EXISTS work_order_events CASCADE;
        DROP TABLE IF EXISTS work_orders CASCADE;
        DROP TABLE IF EXISTS technicians CASCADE;
        DROP TABLE IF EXISTS invitations CASCADE;
        DROP TABLE IF EXISTS password_reset_tokens CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS organizations CASCADE;
        DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
        DROP FUNCTION IF EXISTS techsync_current_org_id CASCADE;
        """
    )
