"""
Tests for Team Management - TDD approach.
Tests team CRUD, member management, and permission checks.
"""
import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone

from app.models.team import Team
from app.schemas.team import (
    TeamCreate, TeamUpdate, TeamResponse,
    TeamWithMembers, TeamMemberResponse,
)


# ---------------------------------------------------------------------------
# Schema / serialization tests (no DB needed)
# ---------------------------------------------------------------------------

class TestTeamSchemas:
    """Test Pydantic schemas serialize correctly."""

    def test_team_response_from_attributes(self):
        team = MagicMock()
        team.id = "tea_abc12345"
        team.workspace_id = "ws_xyz12345"
        team.name = "Backend Team"
        team.description = "Handles API"
        team.created_at = datetime.now(timezone.utc)
        team.updated_at = None

        resp = TeamResponse.model_validate(team, from_attributes=True)
        assert resp.id == "tea_abc12345"
        assert resp.name == "Backend Team"

    def test_team_with_members_empty(self):
        team = MagicMock()
        team.id = "tea_abc12345"
        team.workspace_id = "ws_xyz12345"
        team.name = "Backend Team"
        team.description = None
        team.created_at = datetime.now(timezone.utc)
        team.updated_at = None
        team.members = []

        resp = TeamWithMembers.model_validate(team, from_attributes=True)
        assert resp.members == []

    def test_team_with_members_populated(self):
        member = TeamMemberResponse(
            id="mem_test1234",
            name="Alice",
            email="alice@test.com",
            avatar_url=None,
        )
        data = {
            "id": "tea_abc12345",
            "workspace_id": "ws_xyz12345",
            "name": "Backend Team",
            "description": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": None,
            "members": [member],
        }
        resp = TeamWithMembers(**data)
        assert len(resp.members) == 1
        assert resp.members[0].name == "Alice"

    def test_team_member_response(self):
        member = TeamMemberResponse(
            id="mem_test1234",
            name="Alice",
            email="alice@test.com",
            avatar_url=None,
        )
        assert member.id == "mem_test1234"

    def test_team_create_schema(self):
        data = TeamCreate(workspace_id="ws_abc", name="Design", description="UI team")
        assert data.name == "Design"
        assert data.workspace_id == "ws_abc"

    def test_team_update_schema_partial(self):
        data = TeamUpdate(name="New Name")
        dumped = data.model_dump(exclude_unset=True)
        assert dumped == {"name": "New Name"}
        assert "description" not in dumped


# ---------------------------------------------------------------------------
# Model definition tests
# ---------------------------------------------------------------------------

class TestTeamModel:
    """Verify the Team SQLAlchemy model is configured correctly."""

    def test_team_tablename(self):
        assert Team.__tablename__ == "teams"

    def test_team_has_required_columns(self):
        col_names = [c.name for c in Team.__table__.columns]
        assert "id" in col_names
        assert "workspace_id" in col_names
        assert "name" in col_names
        assert "description" in col_names
        assert "created_at" in col_names
        assert "updated_at" in col_names

    def test_team_memberships_relationship_exists(self):
        assert hasattr(Team, "team_memberships")

    def test_team_memberships_uses_team_members_table(self):
        """The team_memberships relationship must go through the team_members table."""
        rel = Team.__mapper__.relationships["team_memberships"]
        assert rel.secondary is not None


# ---------------------------------------------------------------------------
# Integration test: team_members column alignment with actual DB
# ---------------------------------------------------------------------------

class TestTeamMembersTableAlignment:
    """Verify that the team_members model columns match the actual DB schema."""

    def test_team_members_table_columns(self):
        """The association table must define team_id and member_id columns
        matching the actual database schema (member_id -> members.id)."""
        from app.models.team import team_members
        col_names = [c.name for c in team_members.columns]
        assert "team_id" in col_names, f"Missing team_id, found: {col_names}"
        assert "member_id" in col_names, (
            f"Column should be 'member_id' to match DB, found: {col_names}. "
            "The database uses 'member_id' referencing members.id, not users.id."
        )
        assert "joined_at" in col_names, f"Missing joined_at, found: {col_names}"

    def test_member_id_foreign_key_points_to_members(self):
        """The member_id FK should reference the members table, not users."""
        from app.models.team import team_members
        member_col = team_members.c.member_id
        fk = list(member_col.foreign_keys)[0]
        assert str(fk.column) == "members.id", (
            f"member_id FK should point to members.id, got: {fk.column}"
        )


# ---------------------------------------------------------------------------
# Service tests (unit)
# ---------------------------------------------------------------------------

class TestTeamServiceUnit:
    """Unit tests for TeamService with mocked database."""

    def test_create_team_builds_correct_model(self):
        data = TeamCreate(workspace_id="ws_abc", name="Design", description="UI")
        team = Team(
            workspace_id=data.workspace_id,
            name=data.name,
            description=data.description,
        )
        assert team.name == "Design"
        assert team.workspace_id == "ws_abc"


# ---------------------------------------------------------------------------
# Endpoint helper tests
# ---------------------------------------------------------------------------

class TestTeamWithMembersHelper:
    """Test the _team_with_members conversion function."""

    def test_converts_team_memberships_to_members(self):
        from app.api.v1.teams import _team_with_members

        user_mock = MagicMock()
        user_mock.name = "Alice"
        user_mock.email = "alice@test.com"
        user_mock.avatar_url = None

        membership_mock = MagicMock()
        membership_mock.id = "mem_12345"
        membership_mock.user = user_mock

        team = MagicMock()
        team.id = "tea_abc"
        team.workspace_id = "ws_xyz"
        team.name = "Backend"
        team.description = None
        team.created_at = datetime.now(timezone.utc)
        team.updated_at = None
        team.team_memberships = [membership_mock]

        result = _team_with_members(team)
        assert len(result["members"]) == 1
        assert result["members"][0].name == "Alice"
        assert result["members"][0].id == "mem_12345"

    def test_empty_memberships(self):
        from app.api.v1.teams import _team_with_members

        team = MagicMock()
        team.id = "tea_abc"
        team.workspace_id = "ws_xyz"
        team.name = "Empty"
        team.description = None
        team.created_at = datetime.now(timezone.utc)
        team.updated_at = None
        team.team_memberships = []

        result = _team_with_members(team)
        assert result["members"] == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
