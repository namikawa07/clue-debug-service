from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime


from ..models.enums import SpaceStatus
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .epic import EpicResponse


class SpaceBase(BaseModel):
    name: str
    description: Optional[str] = None
    tech_stack: Dict[str, Any] = {}
    status: SpaceStatus = SpaceStatus.PLANNING
    ai_generated: bool = False
    complexity_score: Optional[float] = None
    start_date: Optional[datetime] = None
    target_end_date: Optional[datetime] = None


class SpaceCreateRequest(SpaceBase):
    pass  # Only needs fields from SpaceBase (name, description, etc.)


class SpaceCreate(SpaceBase):
    workspace_id: str
    created_by: str


class SpaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[Dict[str, Any]] = None
    status: Optional[SpaceStatus] = None
    ai_generated: Optional[bool] = None
    complexity_score: Optional[float] = None
    start_date: Optional[datetime] = None
    target_end_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None


class SpaceResponse(SpaceBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    workspace_id: str
    created_by: str
    actual_end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class SpaceWithEpics(SpaceResponse):
    """Space with its epics included"""
    epics: List[dict] = []  # Will be populated with EpicResponse dicts
