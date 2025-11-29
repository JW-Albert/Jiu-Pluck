from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
from typing import List, Dict
from app.models.timetable import Timetable, TimetableTemplate
from app.schemas.timetable import TimetableData, FreeSlot


async def get_templates(db: AsyncSession) -> List[Dict]:
    """取得所有課表模板"""
    result = await db.execute(select(TimetableTemplate))
    templates = result.scalars().all()
    
    return [
        {
            "id": t.id,
            "school": t.school,
            "name": t.name,
            "periods": json.loads(t.periods_json)
        }
        for t in templates
    ]


async def save_timetable(db: AsyncSession, user_id: str, data: TimetableData) -> Dict:
    """儲存使用者課表"""
    # 檢查是否已有課表
    result = await db.execute(select(Timetable).where(Timetable.user_id == user_id))
    existing = result.scalar_one_or_none()
    
    data_json = json.dumps(data.dict(exclude_none=True))
    
    if existing:
        existing.data_json = data_json
        timetable = existing
    else:
        timetable = Timetable(user_id=user_id, data_json=data_json)
        db.add(timetable)
    
    await db.commit()
    await db.refresh(timetable)
    
    return {
        "id": timetable.id,
        "user_id": timetable.user_id,
        "data": json.loads(timetable.data_json)
    }


async def get_timetable(db: AsyncSession, user_id: str) -> Dict:
    """取得使用者課表"""
    result = await db.execute(select(Timetable).where(Timetable.user_id == user_id))
    timetable = result.scalar_one_or_none()
    
    if not timetable:
        return {"id": None, "user_id": user_id, "data": {}}
    
    return {
        "id": timetable.id,
        "user_id": timetable.user_id,
        "data": json.loads(timetable.data_json)
    }


async def get_free_slots(
    db: AsyncSession,
    user_id: str,
    weekday: str,
    periods: List[Dict]
) -> List[FreeSlot]:
    """計算空堂時間"""
    # 取得使用者課表
    result = await db.execute(select(Timetable).where(Timetable.user_id == user_id))
    timetable = result.scalar_one_or_none()
    
    if not timetable:
        # 沒有課表，回傳所有時段
        return [FreeSlot(start=p["start"], end=p["end"]) for p in periods]
    
    data = json.loads(timetable.data_json)
    weekday_key = weekday.lower()
    
    # 取得該天的課程
    courses = data.get(weekday_key, [])
    occupied_periods = {c.get("period") for c in courses if c.get("period")}
    
    # 找出空堂
    free_slots = []
    for period in periods:
        period_name = period.get("name", "")
        if period_name not in occupied_periods:
            free_slots.append(FreeSlot(start=period["start"], end=period["end"]))
    
    return free_slots

