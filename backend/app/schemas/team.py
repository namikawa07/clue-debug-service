from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    workspace_id: str

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamResponse(TeamBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class TeamMemberResponse(BaseModel):
    """Slim user representation used inside TeamWithMembers.
    Only contains columns that are guaranteed non-null, avoiding
    Pydantic v2 validation failures when nullable DB columns are None."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None


class TeamWithMembers(TeamResponse):
    members: List[TeamMemberResponse] = []
