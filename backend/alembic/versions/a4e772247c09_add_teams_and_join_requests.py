"""add_teams_and_join_requests

Revision ID: a4e772247c09
Revises: 8e4e984fc0f9
Create Date: 2026-02-14 18:09:25.449103

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4e772247c09'
down_revision: Union[str, Sequence[str], None] = '8e4e984fc0f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Create JoinRequestStatus enum - assumed already created or handled by sa.Enum

    if 'join_requests' not in tables:
        op.create_table('join_requests',
        sa.Column('id', sa.String(length=12), nullable=False),
        sa.Column('workspace_id', sa.String(length=12), nullable=False),
        sa.Column('user_id', sa.String(length=12), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='joinrequeststatus'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.PrimaryKeyConstraint('id')
        )

    if 'teams' not in tables:
        op.create_table('teams',
        sa.Column('id', sa.String(length=12), nullable=False),
        sa.Column('workspace_id', sa.String(length=12), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.PrimaryKeyConstraint('id')
        )

    if 'team_members' not in tables:
        op.create_table('team_members',
        sa.Column('team_id', sa.String(length=12), nullable=False),
        sa.Column('member_id', sa.String(length=12), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ),
        sa.PrimaryKeyConstraint('team_id', 'member_id')
        )

    if 'space_teams' not in tables:
        op.create_table('space_teams',
        sa.Column('space_id', sa.String(length=12), nullable=False),
        sa.Column('team_id', sa.String(length=12), nullable=False),
        sa.ForeignKeyConstraint(['space_id'], ['spaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('space_id', 'team_id')
        )

    # Update Spaces with moderator_id
    space_columns = [c['name'] for c in inspector.get_columns('spaces')]
    if 'moderator_id' not in space_columns:
        op.add_column('spaces', sa.Column('moderator_id', sa.String(length=12), nullable=True))
        op.create_foreign_key('fk_spaces_moderator', 'spaces', 'users', ['moderator_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_spaces_moderator', 'spaces', type_='foreignkey')
    op.drop_column('spaces', 'moderator_id')
    op.drop_table('space_teams')
    op.drop_table('team_members')
    op.drop_table('teams')
    op.drop_table('join_requests')
    op.execute("DROP TYPE IF EXISTS joinrequeststatus;")
