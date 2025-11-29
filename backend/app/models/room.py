from sqlalchemy import Column, String, DateTime, Table, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

# 使用 Table 定義多對多關係
room_members = Table(
    "room_members",
    Base.metadata,
    Column("room_id", String, ForeignKey("rooms.id"), primary_key=True),
    Column("user_id", String, ForeignKey("users.id"), primary_key=True),
    Column("role", String, default="member"),  # owner / member
)


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    owner_id = Column(String, nullable=False, index=True)
    school = Column(String)
    invite_code = Column(String, unique=True, nullable=True, index=True)  # 邀請碼
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RoomWebhook(Base):
    __tablename__ = "room_webhooks"

    id = Column(String, primary_key=True)
    room_id = Column(String, nullable=False, index=True)
    url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

