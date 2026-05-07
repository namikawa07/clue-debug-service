"""Keep users.supabase_id aligned with Supabase auth

Revision ID: add_supabase_auth_id
Revises: 3d6e688386ba
Create Date: 2026-01-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_supabase_auth_id'
down_revision: Union[str, Sequence[str], None] = '3d6e688386ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Ensure the app keeps using the users.supabase_id column."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = {column['name'] for column in inspector.get_columns('users')}
    indexes = {index['name'] for index in inspector.get_indexes('users')}

    if 'supabase_id' not in columns:
        op.add_column('users', sa.Column('supabase_id', sa.String(255), nullable=True))

    if 'ix_users_supabase_id' not in indexes:
        op.create_index('ix_users_supabase_id', 'users', ['supabase_id'], unique=True)

    if 'auth_id' in columns:
        op.execute('DROP INDEX IF EXISTS ix_users_auth_id')
        op.drop_column('users', 'auth_id')


def downgrade() -> None:
    """Reverse the compatibility migration."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = {column['name'] for column in inspector.get_columns('users')}
    indexes = {index['name'] for index in inspector.get_indexes('users')}

    if 'ix_users_supabase_id' in indexes:
        op.drop_index('ix_users_supabase_id', table_name='users')

    if 'supabase_id' in columns:
        op.drop_column('users', 'supabase_id')
