from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class GoogleToken(Base):
    __tablename__ = "google_tokens"

    user_id = Column(String, primary_key=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expiry = Column(DateTime(timezone=True), nullable=False)


class AppleCalendarCredential(Base):
    __tablename__ = "apple_calendar_credentials"

    user_id = Column(String, primary_key=True)
    apple_id_email = Column(String, nullable=False)
    encrypted_app_password = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    event_id = Column(String, ForeignKey("events.id"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    provider = Column(String, primary_key=True)  # 'google' | 'apple'
    external_event_id = Column(String, nullable=False)

