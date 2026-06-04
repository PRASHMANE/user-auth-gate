from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Todo(Base):
    __tablename__ = "todos"

    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String, nullable=False)
    description = Column(String, nullable=True)
    completed  = Column(Boolean, default=False)
    owner_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="todos")