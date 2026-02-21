from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, JSON, ARRAY, Text, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .enums import MemberRole
from ..database import Base
from ..utils.id_generator import generate_workspace_id, generate_invite_code


class Workspace(Base):
    __tablename__ = "workspaces"
    __table_args__ = (
        UniqueConstraint('owner_id', name='uq_workspaces_owner_id'),
    )

    id = Column(String(12), primary_key=True, default=generate_workspace_id)
    name = Column(String(255), nullable=False)
    invite_code = Column(String(8), unique=True, index=True, nullable=True, default=generate_invite_code)
    owner_id = Column(String(12), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="owned_workspaces")
    members = relationship("Member", back_populates="workspace")
    spaces = relationship("Space", back_populates="workspace")