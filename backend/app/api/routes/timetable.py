from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.timetable import (
    TimetableTemplateResponse,
    TimetableCreate,
    TimetableResponse,
    FreeSlotsResponse,
    TimetableTemplateCreate
)
from app.services.timetable_service import (
    get_templates,
    save_timetable,
    get_timetable,
    get_free_slots,
    submit_template
)

router = APIRouter()


@router.get("/templates", response_model=list[TimetableTemplateResponse])
async def get_timetable_templates(db: AsyncSession = Depends(get_db)):
    """取得已通過審核的課表模板"""
    templates = await get_templates(db)
    return [
        TimetableTemplateResponse(
            id=t["id"],
            school=t["school"],
            name=t["name"],
            periods=t["periods"],
            created_by=t.get("created_by"),
            status=t.get("status"),
            submitted_at=t.get("submitted_at"),
            reviewed_at=t.get("reviewed_at"),
            reviewed_by=t.get("reviewed_by"),
            created_at=t.get("created_at"),
            updated_at=t.get("updated_at")
        )
        for t in templates
    ]


@router.post("/templates/submit", response_model=TimetableTemplateResponse)
async def submit_timetable_template(
    template_data: TimetableTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """提交課表模板供管理員審核"""
    result = await submit_template(
        db,
        current_user.id,
        template_data.school,
        template_data.name,
        [p.dict() for p in template_data.periods]
    )
    
    return TimetableTemplateResponse(
        id=result["id"],
        school=result["school"],
        name=result["name"],
        periods=result["periods"],
        created_by=result["created_by"],
        status=result["status"],
        submitted_at=result["submitted_at"]
    )


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
    template_id: int = Query(None, description="Template ID to use for periods"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得空堂時間"""
    periods = []
    
    if template_id:
        # 從模板取得 periods
        from app.models.timetable import TimetableTemplate
        result = await db.execute(
            select(TimetableTemplate).where(TimetableTemplate.id == template_id)
        )
        template = result.scalar_one_or_none()
        if template and template.status == "approved":
            import json
            periods = json.loads(template.periods_json)
    
    # 如果沒有指定模板或模板不存在，使用預設節次
    if not periods:
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

