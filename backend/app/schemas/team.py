from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .user import UserResponse

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

class TeamWithMembers(TeamResponse):
    members: List[UserResponse] = []
