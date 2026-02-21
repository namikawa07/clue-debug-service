from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base
from ..utils.id_generator import generate_team_id

# Association table for Team Members (Many-to-Many between Member and Team)
# member_id references the workspace membership record (members.id), not users.id
team_members = Table(
    "team_members",
    Base.metadata,
    Column("team_id", String(12), ForeignKey("teams.id"), primary_key=True),
    Column("member_id", String(12), ForeignKey("members.id"), primary_key=True),
    Column("joined_at", DateTime(timezone=True), server_default=func.now())
)

class Team(Base):
    __tablename__ = "teams"

    id = Column(String(12), primary_key=True, default=generate_team_id)
    workspace_id = Column(String(12), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workspace = relationship("Workspace", backref="teams")
    # team_members joins through workspace Member records
    team_memberships = relationship("Member", secondary=team_members, backref="teams")
    spaces = relationship("Space", secondary="space_teams", back_populates="teams")
