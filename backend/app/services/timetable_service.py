from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
from typing import List, Dict
from datetime import datetime
from app.models.timetable import Timetable, TimetableTemplate
from app.schemas.timetable import TimetableData, FreeSlot


async def get_templates(db: AsyncSession) -> List[Dict]:
    """取得所有已通過審核的課表模板"""
    result = await db.execute(
        select(TimetableTemplate)
        .where(TimetableTemplate.status == "approved")
    )
    templates = result.scalars().all()
    
    return [
        {
            "id": t.id,
            "school": t.school,
            "name": t.name,
            "periods": json.loads(t.periods_json),
            "created_by": t.created_by,
            "status": t.status,
            "submitted_at": t.submitted_at,
            "reviewed_at": t.reviewed_at,
            "reviewed_by": t.reviewed_by,
            "created_at": t.created_at,
            "updated_at": t.updated_at
        }
        for t in templates
    ]


async def submit_template(
    db: AsyncSession,
    user_id: str,
    school: str,
    name: str,
    periods: List[Dict]
) -> Dict:
    """提交課表模板供審核"""
    periods_json = json.dumps(periods)
    
    template = TimetableTemplate(
        school=school,
        name=name,
        periods_json=periods_json,
        created_by=user_id,
        status="pending",
        submitted_at=datetime.utcnow()
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    return {
        "id": template.id,
        "school": template.school,
        "name": template.name,
        "periods": json.loads(template.periods_json),
        "created_by": template.created_by,
        "status": template.status,
        "submitted_at": template.submitted_at
    }


async def create_template(
    db: AsyncSession,
    admin_id: str,
    school: str,
    name: str,
    periods: List[Dict]
) -> Dict:
    """管理員直接建立課表模板（自動通過）"""
    periods_json = json.dumps(periods)
    now = datetime.utcnow()
    
    template = TimetableTemplate(
        school=school,
        name=name,
        periods_json=periods_json,
        created_by=admin_id,
        status="approved",
        submitted_at=now,
        reviewed_at=now,
        reviewed_by=admin_id
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    return {
        "id": template.id,
        "school": template.school,
        "name": template.name,
        "periods": json.loads(template.periods_json),
        "created_by": template.created_by,
        "status": template.status,
        "submitted_at": template.submitted_at,
        "reviewed_at": template.reviewed_at,
        "reviewed_by": template.reviewed_by,
        "created_at": template.created_at,
        "updated_at": template.updated_at
    }


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
    """取得使用者課表，如果不存在則自動建立空的課表"""
    result = await db.execute(select(Timetable).where(Timetable.user_id == user_id))
    timetable = result.scalar_one_or_none()
    
    if not timetable:
        # 自動建立空的課表
        empty_data = TimetableData()
        data_json = json.dumps(empty_data.dict(exclude_none=True))
        timetable = Timetable(user_id=user_id, data_json=data_json)
        db.add(timetable)
        await db.commit()
        await db.refresh(timetable)
    
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

