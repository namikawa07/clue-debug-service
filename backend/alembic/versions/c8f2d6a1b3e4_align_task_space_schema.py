"""align_task_space_schema

Revision ID: c8f2d6a1b3e4
Revises: b1c2d3e4f5a6
Create Date: 2026-05-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c8f2d6a1b3e4'
down_revision: Union[str, Sequence[str], None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_foreign_key(
    inspector: sa.Inspector,
    table_name: str,
    constrained_columns: list[str],
    referred_table: str,
) -> bool:
    return any(
        fk.get('constrained_columns') == constrained_columns
        and fk.get('referred_table') == referred_table
        for fk in inspector.get_foreign_keys(table_name)
    )


def upgrade() -> None:
    """Align migrated schema details with the current SQLAlchemy models."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    op.execute("ALTER TYPE tasktype ADD VALUE IF NOT EXISTS 'TASK'")
    op.execute("ALTER TYPE entitytype ADD VALUE IF NOT EXISTS 'SPACE'")

    status_type = conn.execute(sa.text("""
        SELECT udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'spaces'
          AND column_name = 'status'
    """)).scalar()

    if status_type == 'spacestatus':
        op.execute(
            "ALTER TABLE spaces "
            "ALTER COLUMN status TYPE projectstatus "
            "USING status::text::projectstatus"
        )
        op.execute("DROP TYPE IF EXISTS spacestatus")

    if not _has_foreign_key(inspector, 'tasks', ['epic_id'], 'epics'):
        op.create_foreign_key(
            'tasks_epic_id_fkey',
            'tasks',
            'epics',
            ['epic_id'],
            ['id'],
        )


def downgrade() -> None:
    """Reverse only constraints that can be safely removed."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if _has_foreign_key(inspector, 'tasks', ['epic_id'], 'epics'):
        op.drop_constraint('tasks_epic_id_fkey', 'tasks', type_='foreignkey')

    status_type = conn.execute(sa.text("""
        SELECT udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'spaces'
          AND column_name = 'status'
    """)).scalar()

    if status_type == 'projectstatus':
        op.execute(
            "DO $$ BEGIN CREATE TYPE spacestatus AS ENUM "
            "('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED'); "
            "EXCEPTION WHEN duplicate_object THEN null; END $$;"
        )
        op.execute(
            "ALTER TABLE spaces "
            "ALTER COLUMN status TYPE spacestatus "
            "USING status::text::spacestatus"
        )
