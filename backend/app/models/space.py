from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, JSON, ARRAY, Text, ForeignKey, Table, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .enums import SpaceStatus
from ..database import Base
from ..utils.id_generator import generate_space_id



# Association table for Space Teams (Many-to-Many)
space_teams = Table(
    "space_teams",
    Base.metadata,
    Column("space_id", String(12), ForeignKey("spaces.id", ondelete="CASCADE"), primary_key=True),
    Column("team_id", String(12), ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
)

class Space(Base):
    __tablename__ = "spaces"

    id = Column(String(12), primary_key=True, default=generate_space_id)
    workspace_id = Column(String(12), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tech_stack = Column(JSON, default=dict)  # frontend, backend, database, hosting
    status = Column(SQLEnum(SpaceStatus, name="projectstatus", create_type=False), default=SpaceStatus.PLANNING)
    ai_generated = Column(Boolean, default=False)
    complexity_score = Column(Float, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    target_end_date = Column(DateTime(timezone=True), nullable=True)
    actual_end_date = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(12), ForeignKey("users.id"), nullable=False)
    moderator_id = Column(String(12), ForeignKey("users.id"), nullable=True) # Space Moderator
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workspace = relationship("Workspace", back_populates="spaces")
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="created_spaces")
    moderator = relationship("User", foreign_keys=[moderator_id])
    epics = relationship("Epic", back_populates="space")
    sprints = relationship("Sprint", back_populates="space")
    teams = relationship("Team", secondary=space_teams, back_populates="spaces")
