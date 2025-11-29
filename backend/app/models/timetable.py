from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class TimetableTemplate(Base):
    __tablename__ = "timetable_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    school = Column(String, nullable=False)
    name = Column(String, nullable=False)
    periods_json = Column(Text, nullable=False)  # JSON: [ { name, start, end }, ... ]


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    data_json = Column(Text, nullable=False)  # JSON: 按星期 + 節次
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

