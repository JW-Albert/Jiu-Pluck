from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.timetable import (
    TimetableTemplateResponse,
    TimetableCreate,
    TimetableResponse,
    FreeSlotsResponse
)
from app.services.timetable_service import (
    get_templates,
    save_timetable,
    get_timetable,
    get_free_slots
)

router = APIRouter()


@router.get("/templates", response_model=list[TimetableTemplateResponse])
async def get_timetable_templates(db: AsyncSession = Depends(get_db)):
    """取得課表模板"""
    templates = await get_templates(db)
    return templates


@router.post("", response_model=TimetableResponse)
async def create_timetable(
    timetable_data: TimetableCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """儲存課表"""
    result = await save_timetable(db, current_user.id, timetable_data.data)
    return result


@router.get("", response_model=TimetableResponse)
async def get_user_timetable(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得使用者課表"""
    result = await get_timetable(db, current_user.id)
    return result


@router.get("/free-slots", response_model=FreeSlotsResponse)
async def get_free_slots_endpoint(
    weekday: str = Query(..., description="Weekday: mon, tue, wed, thu, fri, sat, sun"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得空堂時間"""
    # TODO: 從模板取得 periods，目前先硬編碼一個範例
    # 實際應該從 timetable_templates 表查詢
    periods = [
        {"name": "1", "start": "08:10", "end": "09:00"},
        {"name": "2", "start": "09:10", "end": "10:00"},
        {"name": "3", "start": "10:10", "end": "11:00"},
        {"name": "4", "start": "11:10", "end": "12:00"},
        {"name": "5", "start": "13:10", "end": "14:00"},
        {"name": "6", "start": "14:10", "end": "15:00"},
        {"name": "7", "start": "15:10", "end": "16:00"},
        {"name": "8", "start": "16:10", "end": "17:00"},
    ]
    
    slots = await get_free_slots(db, current_user.id, weekday, periods)
    return {"weekday": weekday, "slots": [{"start": s.start, "end": s.end} for s in slots]}

