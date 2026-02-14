from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .enums import JoinRequestStatus
from ..database import Base
from ..utils.id_generator import generate_request_id

class JoinRequest(Base):
    __tablename__ = "join_requests"

    id = Column(String(12), primary_key=True, default=generate_request_id)
    workspace_id = Column(String(12), ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(String(12), ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(JoinRequestStatus), default=JoinRequestStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workspace = relationship("Workspace", backref="join_requests")
    user = relationship("User", backref="join_requests")
