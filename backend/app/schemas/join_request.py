from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from ..models.enums import JoinRequestStatus
from .user import UserResponse

class JoinRequestBase(BaseModel):
    status: JoinRequestStatus = JoinRequestStatus.PENDING

class JoinRequestCreate(BaseModel):
    workspace_id: str

class JoinRequestUpdate(BaseModel):
    status: JoinRequestStatus

class JoinRequestResponse(JoinRequestBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    workspace_id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: Optional[UserResponse] = None
