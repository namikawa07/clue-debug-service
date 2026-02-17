"""
Space API Endpoints - Full CRUD operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.space import SpaceCreate, SpaceUpdate, SpaceResponse, SpaceCreateRequest
from app.services.space_service import SpaceService
from app.services.activity_feed_service import activity_feed_service

router = APIRouter()


@router.get("/workspaces/{workspace_id}/spaces", response_model=List[SpaceResponse])
async def list_spaces(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all spaces in a workspace"""
    service = SpaceService(db)
    spaces = await service.get_by_workspace(workspace_id)
    return spaces


@router.post("/workspaces/{workspace_id}/spaces", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
async def create_space(
    workspace_id: str,
    space_data: SpaceCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new space in a workspace"""
    service = SpaceService(db)
    
    # Map request data to internal create model
    internal_data = SpaceCreate(
        **space_data.model_dump(),
        workspace_id=workspace_id,
        created_by=current_user.id
    )
    
    space = await service.create(
        workspace_id=workspace_id,
        data=internal_data,
        user_id=current_user.id
    )
    return space


@router.get("/spaces/{space_id}", response_model=SpaceResponse)
async def get_space(
    space_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single space by ID"""
    service = SpaceService(db)
    space = await service.get_by_id(space_id)
    
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )
    
    return space


@router.patch("/spaces/{space_id}", response_model=SpaceResponse)
async def update_space(
    space_id: str,
    space_data: SpaceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a space"""
    service = SpaceService(db)
    space = await service.update(space_id, space_data, current_user.id)
    
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )
    
    return space


@router.delete("/spaces/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_space(
    space_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a space"""
    service = SpaceService(db)
    deleted = await service.delete(space_id, current_user.id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )
    
    return None


@router.get("/spaces/{space_id}/analytics")
async def get_space_analytics(
    space_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get space analytics and progress"""
    # Verify space exists first
    service = SpaceService(db)
    space = await service.get_by_id(space_id)
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )
        
    analytics = await activity_feed_service.get_space_progress(str(space_id))
    return analytics
