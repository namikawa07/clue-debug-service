from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.models.team import Team, team_members
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate

class TeamService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, team_id: str) -> Optional[Team]:
        result = await self.db.execute(
            select(Team).options(selectinload(Team.members)).where(Team.id == team_id)
        )
        return result.scalar_one_or_none()

    async def list_workspace_teams(self, workspace_id: str) -> List[Team]:
        result = await self.db.execute(
            select(Team).where(Team.workspace_id == workspace_id).order_by(Team.name.asc())
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
        team = await self.get_by_id(team_id)
        if not team:
            return None
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(team, field, value)
        
        await self.db.commit()
        await self.db.refresh(team)
        return team

    async def add_member(self, team_id: str, user_id: str) -> bool:
        team = await self.get_by_id(team_id)
        if not team:
            return False
        
        # Check if already a member
        result = await self.db.execute(
            select(User).join(team_members).where(
                team_members.c.team_id == team_id,
                team_members.c.user_id == user_id
            )
        )
        if result.scalar_one_or_none():
            return True # Already there
        
        # Direct insert into association table or append to relationship
        user = await self.db.get(User, user_id)
        if not user:
            return False
        
        team.members.append(user)
        await self.db.commit()
        return True

    async def remove_member(self, team_id: str, user_id: str) -> bool:
        team = await self.get_by_id(team_id)
        if not team:
            return False
        
        user = await self.db.get(User, user_id)
        if not user or user not in team.members:
            return False
        
        team.members.remove(user)
        await self.db.commit()
        return True

    async def delete_team(self, team_id: str) -> bool:
        team = await self.get_by_id(team_id)
        if not team:
            return False
        
        await self.db.delete(team)
        await self.db.commit()
        return True
