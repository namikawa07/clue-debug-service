from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime


from ..models.enums import Priority, TaskType, TaskStatus
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .comment import CommentResponse



class SpaceSummary(BaseModel):
    id: str
    name: str
    # image_url: Optional[str] = None

class UserSummary(BaseModel):
    id: str
    name: str


class TaskBase(BaseModel):
    """Base class for Task schemas with common fields"""
    title: str
    description: Optional[str] = None
    task_type: TaskType = TaskType.TASK
    status: TaskStatus = TaskStatus.TODO
    priority: Priority = Priority.MEDIUM
    story_points: Optional[int] = None
    position: Optional[int] = 0
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    additional_data: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    ai_confidence: Optional[float] = None


class TaskCreateRequest(TaskBase):
    epic_id: Optional[str] = None
    assigned_to: Optional[str] = None
    space_id: Optional[str] = None # Optional in request, logic might enforce it
    # created_by is inferred from current_user


class TaskCreate(TaskBase):
    epic_id: Optional[str] = None
    assigned_to: Optional[str] = None
    space_id: Optional[str] = None
    created_by: str


class TaskUpdate(BaseModel):
    """Task update schema - all fields optional for partial updates"""
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[TaskType] = None
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    story_points: Optional[int] = None
    position: Optional[int] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    epic_id: Optional[str] = None
    assigned_to: Optional[str] = None
    space_id: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    ai_confidence: Optional[float] = None


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    epic_id: Optional[str]
    space_id: Optional[str]
    assigned_to: Optional[str]
    created_by: str
    actual_hours: Optional[float] = 0.0
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Expanded details for frontend
    space: Optional['SpaceSummary'] = None
    assignee: Optional['UserSummary'] = None





class TaskWithComments(TaskResponse):
    """Task with its comments included"""
    comments: List[dict] = []  # Will be populated with CommentResponse dicts


class BulkTaskUpdateItem(BaseModel):
    id: str
    position: int
    status: TaskStatus


class BulkTaskUpdate(BaseModel):
    tasks: List[BulkTaskUpdateItem]