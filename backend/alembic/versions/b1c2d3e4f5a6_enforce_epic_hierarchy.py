"""enforce_epic_hierarchy_and_one_workspace_per_user

Revision ID: b1c2d3e4f5a6
Revises: a4e772247c09
Create Date: 2026-02-20 10:00:00.000000

Migration Summary:
- DATA MIGRATION: Orphan tasks (no epic_id/space_id) are moved to auto-created
  "Common Space" and "Migrated Tasks" epic within their respective workspaces.
- SCHEMA: tasks.epic_id made NOT NULL (tasks must live under an epic).
- SCHEMA: workspaces.owner_id gets a UNIQUE constraint (one workspace per user).
- SCHEMA: Index added on tasks.epic_id for query performance.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text
import random
import string

revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = 'a4e772247c09'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _gen_id(length: int = 12) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # ------------------------------------------------------------------ #
    # STEP 1: Data migration – assign all orphan tasks to valid epics      #
    # ------------------------------------------------------------------ #

    # 1a. For each workspace ensure at least one space exists
    workspaces = conn.execute(
        text("SELECT id, name, owner_id FROM workspaces ORDER BY created_at ASC")
    ).fetchall()

    for workspace_id, workspace_name, owner_id in workspaces:
        spaces = conn.execute(
            text("SELECT id FROM spaces WHERE workspace_id = :wid"),
            {"wid": workspace_id}
        ).fetchall()

        if not spaces:
            # Auto-create a "Common Space" for this workspace
            space_id = _gen_id(12)
            conn.execute(
                text("""
                    INSERT INTO spaces
                        (id, workspace_id, name, description, status,
                         ai_generated, created_by, created_at, updated_at)
                    VALUES
                        (:id, :wid, :name, :desc, 'PLANNING',
                         false, :owner, NOW(), NOW())
                """),
                {
                    "id": space_id,
                    "wid": workspace_id,
                    "name": f"{workspace_name} Common Space",
                    "desc": "Default space auto-created during migration",
                    "owner": owner_id,
                }
            )
            spaces = [(space_id,)]

        # 1b. For each space, migrate tasks that have no epic_id
        for (space_id,) in spaces:
            orphan_count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM tasks "
                    "WHERE space_id = :sid AND epic_id IS NULL"
                ),
                {"sid": space_id}
            ).scalar()

            if orphan_count and orphan_count > 0:
                # Find or create "Migrated Tasks" epic for this space
                existing = conn.execute(
                    text(
                        "SELECT id FROM epics "
                        "WHERE space_id = :sid AND title = 'Migrated Tasks' "
                        "LIMIT 1"
                    ),
                    {"sid": space_id}
                ).fetchone()

                if existing:
                    migration_epic_id = existing[0]
                else:
                    migration_epic_id = _gen_id(10)
                    conn.execute(
                        text("""
                            INSERT INTO epics
                                (id, space_id, title, description,
                                 priority, status, actual_hours, created_at, updated_at)
                            VALUES
                                (:id, :sid, 'Migrated Tasks',
                                 'Auto-created epic for tasks migrated from legacy structure',
                                 'MEDIUM', 'TODO', 0.0, NOW(), NOW())
                        """),
                        {"id": migration_epic_id, "sid": space_id}
                    )

                conn.execute(
                    text(
                        "UPDATE tasks SET epic_id = :eid "
                        "WHERE space_id = :sid AND epic_id IS NULL"
                    ),
                    {"eid": migration_epic_id, "sid": space_id}
                )

    # 1c. Handle tasks that have neither space_id nor epic_id (fully orphaned)
    fully_orphaned = conn.execute(
        text(
            "SELECT COUNT(*) FROM tasks "
            "WHERE space_id IS NULL AND epic_id IS NULL"
        )
    ).scalar()

    if fully_orphaned and fully_orphaned > 0:
        fallback_space = conn.execute(
            text("SELECT id FROM spaces ORDER BY created_at ASC LIMIT 1")
        ).fetchone()

        if fallback_space:
            fb_space_id = fallback_space[0]

            fb_epic = conn.execute(
                text(
                    "SELECT id FROM epics "
                    "WHERE space_id = :sid AND title = 'Migrated Tasks' LIMIT 1"
                ),
                {"sid": fb_space_id}
            ).fetchone()

            if fb_epic:
                fb_epic_id = fb_epic[0]
            else:
                fb_epic_id = _gen_id(10)
                conn.execute(
                    text("""
                        INSERT INTO epics
                            (id, space_id, title, description,
                             priority, status, actual_hours, created_at, updated_at)
                        VALUES
                            (:id, :sid, 'Migrated Tasks',
                             'Auto-created epic for fully orphaned tasks',
                             'MEDIUM', 'TODO', 0.0, NOW(), NOW())
                    """),
                    {"id": fb_epic_id, "sid": fb_space_id}
                )

            conn.execute(
                text(
                    "UPDATE tasks "
                    "SET space_id = :sid, epic_id = :eid "
                    "WHERE space_id IS NULL AND epic_id IS NULL"
                ),
                {"sid": fb_space_id, "eid": fb_epic_id}
            )

    # ------------------------------------------------------------------ #
    # STEP 2: Schema – tasks.epic_id NOT NULL                             #
    # ------------------------------------------------------------------ #
    task_cols = {c['name']: c for c in inspector.get_columns('tasks')}
    if task_cols.get('epic_id', {}).get('nullable', True):
        op.alter_column(
            'tasks', 'epic_id',
            existing_type=sa.String(10),
            nullable=False
        )

    # ------------------------------------------------------------------ #
    # STEP 3: Schema – unique constraint on workspaces.owner_id           #
    # ------------------------------------------------------------------ #
    existing_uq = [
        c['name'] for c in inspector.get_unique_constraints('workspaces')
    ]
    if 'uq_workspaces_owner_id' not in existing_uq:
        # Deduplicate: keep the oldest workspace per owner (in case of duplicates)
        dups = conn.execute(
            text("""
                SELECT owner_id
                FROM workspaces
                GROUP BY owner_id
                HAVING COUNT(*) > 1
            """)
        ).fetchall()

        for (dup_owner_id,) in dups:
            # Keep earliest created; delete the rest
            extra_workspaces = conn.execute(
                text("""
                    SELECT id FROM workspaces
                    WHERE owner_id = :oid
                    ORDER BY created_at ASC
                    OFFSET 1
                """),
                {"oid": dup_owner_id}
            ).fetchall()

            for (extra_id,) in extra_workspaces:
                conn.execute(
                    text("DELETE FROM workspaces WHERE id = :id"),
                    {"id": extra_id}
                )

        op.create_unique_constraint(
            'uq_workspaces_owner_id', 'workspaces', ['owner_id']
        )

    # ------------------------------------------------------------------ #
    # STEP 4: Performance index on tasks.epic_id                          #
    # ------------------------------------------------------------------ #
    existing_idx = [i['name'] for i in inspector.get_indexes('tasks')]
    if 'ix_tasks_epic_id' not in existing_idx:
        op.create_index('ix_tasks_epic_id', 'tasks', ['epic_id'])


def downgrade() -> None:
    """Reverse schema changes (data changes are not reversible)."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Drop performance index
    existing_idx = [i['name'] for i in inspector.get_indexes('tasks')]
    if 'ix_tasks_epic_id' in existing_idx:
        op.drop_index('ix_tasks_epic_id', table_name='tasks')

    # Drop unique constraint on workspaces.owner_id
    existing_uq = [
        c['name'] for c in inspector.get_unique_constraints('workspaces')
    ]
    if 'uq_workspaces_owner_id' in existing_uq:
        op.drop_constraint(
            'uq_workspaces_owner_id', 'workspaces', type_='unique'
        )

    # Make tasks.epic_id nullable again
    task_cols = {c['name']: c for c in inspector.get_columns('tasks')}
    if not task_cols.get('epic_id', {}).get('nullable', True):
        op.alter_column(
            'tasks', 'epic_id',
            existing_type=sa.String(10),
            nullable=True
        )
