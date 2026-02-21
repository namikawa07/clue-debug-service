from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.models.team import Team, team_members
from app.models.member import Member
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate


class TeamService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, team_id: str) -> Optional[Team]:
        result = await self.db.execute(
            select(Team)
            .options(
                selectinload(Team.team_memberships).selectinload(Member.user)
            )
            .where(Team.id == team_id)
        )
        return result.scalar_one_or_none()

    async def list_workspace_teams(self, workspace_id: str) -> List[Team]:
        result = await self.db.execute(
            select(Team)
            .where(Team.workspace_id == workspace_id)
            .order_by(Team.name.asc())
        )
        return list(result.scalars().all())

    async def create(self, data: TeamCreate) -> Team:
        team = Team(
            workspace_id=data.workspace_id,
            name=data.name,
            description=data.description
        )
        self.db.add(team)
        await self.db.commit()
        await self.db.refresh(team)
        return team

    async def update(self, team_id: str, data: TeamUpdate) -> Optional[Team]:
        result = await self.db.execute(
            select(Team).where(Team.id == team_id)
        )
        team = result.scalar_one_or_none()
        if not team:
            return None

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(team, field, value)

        await self.db.commit()
        await self.db.refresh(team)
        return team

    async def add_member(self, team_id: str, member_id: str) -> bool:
        """Add a workspace member to a team by their member ID."""
        # Verify the team exists
        result = await self.db.execute(
            select(Team).where(Team.id == team_id)
        )
        team = result.scalar_one_or_none()
        if not team:
            return False

        # Check if already in team
        result = await self.db.execute(
            select(team_members).where(
                and_(
                    team_members.c.team_id == team_id,
                    team_members.c.member_id == member_id
                )
            )
        )
        if result.first():
            return True  # Already a team member

        # Verify the member exists
        member = await self.db.get(Member, member_id)
        if not member:
            return False

        # Insert into association table
        await self.db.execute(
            team_members.insert().values(
                team_id=team_id,
                member_id=member_id
            )
        )
        await self.db.commit()
        return True

    async def remove_member(self, team_id: str, member_id: str) -> bool:
        """Remove a workspace member from a team."""
        result = await self.db.execute(
            delete(team_members).where(
                and_(
                    team_members.c.team_id == team_id,
                    team_members.c.member_id == member_id
                )
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    async def delete_team(self, team_id: str) -> bool:
        result = await self.db.execute(
            select(Team).where(Team.id == team_id)
        )
        team = result.scalar_one_or_none()
        if not team:
            return False

        await self.db.delete(team)
        await self.db.commit()
        return True
