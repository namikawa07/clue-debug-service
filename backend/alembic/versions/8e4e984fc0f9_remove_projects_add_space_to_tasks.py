"""remove_projects_add_space_to_tasks

Revision ID: 8e4e984fc0f9
Revises: add_supabase_auth_id
Create Date: 2026-02-14 16:21:18.247924

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '8e4e984fc0f9'
down_revision: Union[str, Sequence[str], None] = 'add_supabase_auth_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Helper for idempotent enum creation
    def create_enum_if_not_exists(name, values):
        val_str = ", ".join(f"'{v}'" for v in values)
        op.execute(f"DO $$ BEGIN CREATE TYPE {name} AS ENUM ({val_str}); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    # Create Enums safely
    create_enum_if_not_exists('spacestatus', ['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED'])
    create_enum_if_not_exists('priority', ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
    create_enum_if_not_exists('epicstatus', ['TODO', 'IN_PROGRESS', 'DONE'])
    create_enum_if_not_exists('sprintstatus', ['PLANNING', 'ACTIVE', 'COMPLETED'])
    # Note: userrole, memberrole, actiontype, entitytype, tasktype, taskstatus likely exist or not relevant for this migration's scoped tables, 
    # but 'priority' is shared.

    # Drop old tables handling dependencies
    op.execute("DROP TABLE IF EXISTS projects CASCADE")
    
    op.execute("DROP TABLE IF EXISTS epics CASCADE")
    op.execute("DROP TABLE IF EXISTS sprints CASCADE")
    op.execute("DROP TABLE IF EXISTS sprint_task_details CASCADE")
    
    if 'spaces' not in tables:
        op.create_table('spaces',
        sa.Column('id', sa.String(length=12), nullable=False),
        sa.Column('workspace_id', sa.String(length=12), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tech_stack', sa.JSON(), nullable=True),
        sa.Column('status', postgresql.ENUM('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', name='spacestatus', create_type=False), nullable=True),
        sa.Column('ai_generated', sa.Boolean(), nullable=True),
        sa.Column('complexity_score', sa.Float(), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('target_end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=12), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.PrimaryKeyConstraint('id')
        )
    
    # I dropped epics, so I create it.
    op.create_table('epics',
    sa.Column('id', sa.String(length=10), nullable=False),
    sa.Column('space_id', sa.String(length=12), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('priority', postgresql.ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', name='priority', create_type=False), nullable=True),
    sa.Column('status', postgresql.ENUM('TODO', 'IN_PROGRESS', 'DONE', name='epicstatus', create_type=False), nullable=True),
    sa.Column('estimated_hours', sa.Float(), nullable=True),
    sa.Column('actual_hours', sa.Float(), nullable=True),
    sa.Column('sequence_order', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['space_id'], ['spaces.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    
    # I dropped sprints, so I create it.
    op.create_table('sprints',
    sa.Column('id', sa.String(length=10), nullable=False),
    sa.Column('space_id', sa.String(length=12), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('status', postgresql.ENUM('PLANNING', 'ACTIVE', 'COMPLETED', name='sprintstatus', create_type=False), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['space_id'], ['spaces.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    
    # I dropped sprint_task_details, so I create it.
    op.create_table('sprint_task_details',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('sprint_id', sa.String(length=10), nullable=False),
    sa.Column('task_id', sa.String(length=10), nullable=False),
    sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['sprint_id'], ['sprints.id'], ),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # Alter tasks table
    # Check if space_id column exists
    columns = [c['name'] for c in inspector.get_columns('tasks')]
    if 'space_id' not in columns:
        op.add_column('tasks', sa.Column('space_id', sa.String(length=12), nullable=True))
        op.create_foreign_key(None, 'tasks', 'spaces', ['space_id'], ['id'])
    
    # Drop project_id if exists
    if 'project_id' in columns:
        op.execute('ALTER TABLE tasks DROP COLUMN project_id')


def downgrade() -> None:
    """Downgrade schema."""
    # This is valid for simple revert, but data loss will occur on upgrade again.
    # Note: checks for existence could be added here too but acceptable to fail if data inconsistent.
    op.drop_column('tasks', 'space_id')
    op.drop_table('sprint_task_details')
    op.drop_table('sprints')
    op.drop_table('epics')
    op.drop_table('spaces')
    # Use execute to handle potential missing table errors in downgrade if needed, but standard drop is fine if we assume it succeeded.
    # Note: We are NOT recreating 'projects' table here because we don't have the definition easily available and it's a destructive migration.
