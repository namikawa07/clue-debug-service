from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, JSON, ARRAY, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .epic import Priority
from .enums import Priority, TaskType, TaskStatus
from ..database import Base
from ..utils.id_generator import generate_task_id


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(10), primary_key=True, default=generate_task_id)
    space_id = Column(String(12), ForeignKey("spaces.id"), nullable=True)
    epic_id = Column(String(10), ForeignKey("epics.id"), nullable=False, index=True)  # Required: tasks must belong to an epic
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(SQLEnum(TaskType), default=TaskType.BACKEND)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM)
    assigned_to = Column(String(12), ForeignKey("users.id"), nullable=True)
    created_by = Column(String(12), ForeignKey("users.id"), nullable=False)
    estimated_hours = Column(Float, nullable=True)
    actual_hours = Column(Float, default=0.0)
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    dependencies = Column(JSON, default=list)  # [task_ids that must complete first]
    tags = Column(ARRAY(String), default=list)
    ai_confidence = Column(Float, nullable=True)  # how confident was AI in this estimate?
    additional_data = Column(JSON, default=dict)  # flexible field for task-specific data
    position = Column(Integer, nullable=True)  # for ordering
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    epic = relationship("Epic", back_populates="tasks")
    space = relationship("Space", foreign_keys="[Task.space_id]")
    assigned_user = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to])
    created_by_user = relationship("User", foreign_keys=[created_by])
    comments = relationship("Comment", back_populates="task")
    sprint_tasks = relationship("SprintTask", back_populates="task")
    time_logs = relationship("TimeEntry", back_populates="task")

    @property
    def assignee(self):
        return self.assigned_user

    def to_dict(self):
        return {
            "id": self.id,
            "space_id": self.space_id,
            "epic_id": self.epic_id,
            "title": self.title,
            "description": self.description,
            "task_type": self.task_type.value if self.task_type else None,
            "status": self.status.value if self.status else None,
            "priority": self.priority.value if self.priority else None,
            "assigned_to": str(self.assigned_to) if self.assigned_to else None,
            "created_by": str(self.created_by) if self.created_by else None,
            "estimated_hours": self.estimated_hours,
            "actual_hours": self.actual_hours,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "position": self.position,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
