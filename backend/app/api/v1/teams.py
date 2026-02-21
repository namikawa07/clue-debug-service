from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamWithMembers
from app.services.team_service import TeamService
from app.services.member_service import MemberService

router = APIRouter()

@router.get("/workspaces/{workspace_id}/teams", response_model=List[TeamResponse])
async def list_teams(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all teams in a workspace"""
    member_service = MemberService(db)
    if not await member_service.get_membership(current_user.id, workspace_id):
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    
    service = TeamService(db)
    return await service.list_workspace_teams(workspace_id)

@router.post("/workspaces/{workspace_id}/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    workspace_id: str,
    team_data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new team (Admin only)"""
    member_service = MemberService(db)
    if not await member_service.is_admin(current_user.id, workspace_id):
        raise HTTPException(status_code=403, detail="Admin permissions required")
    
    service = TeamService(db)
    # Ensure workspace_id matches
    team_data.workspace_id = workspace_id
    return await service.create(team_data)

@router.get("/teams/{team_id}", response_model=TeamWithMembers)
async def get_team(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get team details and members"""
    try:
        service = TeamService(db)
        team = await service.get_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")

        # Check permission
        member_service = MemberService(db)
        membership = await member_service.get_membership(current_user.id, team.workspace_id)
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this workspace")

        return team
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error getting team {team_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/teams/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: str,
    team_data: TeamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update team details (Admin only)"""
    service = TeamService(db)
    team = await service.get_by_id(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    member_service = MemberService(db)
    if not await member_service.is_admin(current_user.id, team.workspace_id):
        raise HTTPException(status_code=403, detail="Admin permissions required")
        
    return await service.update(team_id, team_data)

@router.post("/teams/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_team_member(
    team_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a member to a team (Admin only)"""
    service = TeamService(db)
    team = await service.get_by_id(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    member_service = MemberService(db)
    if not await member_service.is_admin(current_user.id, team.workspace_id):
        raise HTTPException(status_code=403, detail="Admin permissions required")
        
    await service.add_member(team_id, user_id)
    return None

@router.delete("/teams/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    team_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a member from a team (Admin only)"""
    service = TeamService(db)
    team = await service.get_by_id(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    member_service = MemberService(db)
    if not await member_service.is_admin(current_user.id, team.workspace_id):
        raise HTTPException(status_code=403, detail="Admin permissions required")
        
    await service.remove_member(team_id, user_id)
    return None

@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a team (Admin only)"""
    service = TeamService(db)
    team = await service.get_by_id(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    member_service = MemberService(db)
    if not await member_service.is_admin(current_user.id, team.workspace_id):
        raise HTTPException(status_code=403, detail="Admin permissions required")
        
    await service.delete_team(team_id)
    return None
