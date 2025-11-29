from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class TimetableTemplate(Base):
    __tablename__ = "timetable_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    school = Column(String, nullable=False)
    name = Column(String, nullable=False)
    periods_json = Column(Text, nullable=False)  # JSON: [ { name, start, end }, ... ]
    created_by = Column(String, nullable=True)  # 提交者的 user_id，NULL 表示系統預設
    status = Column(String, default="pending")  # pending=待審核, approved=已通過, rejected=已拒絕
    submitted_at = Column(DateTime(timezone=True), nullable=True)  # 提交時間
    reviewed_at = Column(DateTime(timezone=True), nullable=True)  # 審核時間
    reviewed_by = Column(String, nullable=True)  # 審核者的 user_id
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    data_json = Column(Text, nullable=False)  # JSON: 按星期 + 節次
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

