"""
Space Service - Business logic for space operations
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import Optional, List


from app.models.space import Space
from app.models.member import Member
from app.models.enums import SpaceStatus, ActionType, EntityType
from app.schemas.space import SpaceCreate, SpaceUpdate
from app.services.activity_service import ActivityService


class SpaceService:
    """Service for space CRUD operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.activity_service = ActivityService(db)
    
    async def get_by_id(self, space_id: str) -> Optional[Space]:
        """Get space by ID with relationships"""
        result = await self.db.execute(
            select(Space)
            .options(selectinload(Space.epics))
            .where(Space.id == space_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_workspace(self, workspace_id: str) -> List[Space]:
        """Get all spaces in a workspace"""
        result = await self.db.execute(
            select(Space)
            .where(Space.workspace_id == workspace_id)
            .order_by(Space.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def get_all_spaces(self) -> List[Space]:
        """Get all spaces (for monitoring inactive spaces)"""
        result = await self.db.execute(
            select(Space)
            .order_by(Space.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def create(
        self,
        workspace_id: str,
        data: SpaceCreate,
        user_id: str
    ) -> Space:
        """Create a new space"""
        space = Space(
            workspace_id=workspace_id,
            name=data.name,
            description=data.description,
            tech_stack=data.tech_stack or {},
            status=data.status,
            created_by=user_id
        )
        
        self.db.add(space)
        await self.db.commit()
        await self.db.refresh(space)
        
        # Log activity
        await self.activity_service.log(
            user_id=user_id,
            action=ActionType.CREATED,
            entity_type=EntityType.SPACE,
            entity_id=space.id,
            changes={"name": space.name, "workspace_id": str(workspace_id)}
        )
        
        return space
    
    async def update(self, space_id: str, data: SpaceUpdate, user_id: str) -> Optional[Space]:
        """Update a space"""
        space = await self.get_by_id(space_id)
        if not space:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(space, field, value)
        
        await self.db.commit()
        await self.db.refresh(space)
        
        # Log activity
        await self.activity_service.log(
            user_id=user_id,
            action=ActionType.UPDATED,
            entity_type=EntityType.SPACE,
            entity_id=space.id,
            changes=update_data
        )
        
        return space
    
    async def delete(self, space_id: str, user_id: str) -> bool:
        """Delete a space"""
        result = await self.db.execute(
            delete(Space).where(Space.id == space_id)
        )
        await self.db.commit()
        
        if result.rowcount > 0:
            # Log activity
            await self.activity_service.log(
                user_id=user_id,
                action=ActionType.DELETED,
                entity_type=EntityType.SPACE,
                entity_id=space_id
            )
            return True
        return False
    
    async def verify_access(
        self,
        space_id: str,
        user_id: str
    ) -> bool:
        """Verify user has access to space via workspace membership"""
        space = await self.get_by_id(space_id)
        if not space:
            return False
        
        result = await self.db.execute(
            select(Member).where(
                Member.workspace_id == space.workspace_id,
                Member.user_id == user_id
            )
        )
        member = result.scalar_one_or_none()
        return member is not None

    async def has_access(self, space_id: str, user_id: str) -> bool:
        """Alias for verify_access"""
        return await self.verify_access(space_id, user_id)
