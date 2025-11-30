from sqlalchemy import Column, String, Integer, DateTime, Text, Table, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

# 多對多關係表
event_attendees = Table(
    "event_attendees",
    Base.metadata,
    Column("event_id", String, ForeignKey("events.id"), primary_key=True),
    Column("user_id", String, ForeignKey("users.id"), primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True)
    room_id = Column(String, index=True)  # NULL for public events
    created_by = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)  # food, study, sport, etc.
    location = Column(String)
    public = Column(Integer, default=0)  # 0=private, 1=public
    proposed_times_json = Column(Text)  # JSON: [ { start, end }, ... ]
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EventVote(Base):
    __tablename__ = "event_votes"

    event_id = Column(String, ForeignKey("events.id"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    time_index = Column(Integer, primary_key=True)  # 候選時間的索引（0, 1, 2, ...）
    vote = Column(String, nullable=False)  # yes / no / maybe

