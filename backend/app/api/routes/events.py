from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.event import (
    PrivateEventCreate,
    PublicEventCreate,
    EventResponse,
    EventVoteRequest,
    EventVoteResponse,
    EventAttendee,
    MessageResponse
)
from app.services.event_service import (
    create_private_event,
    create_public_event,
    vote_event,
    get_event_vote_stats,
    get_public_events,
    join_event,
    leave_event,
    get_event_attendees
)
from app.services.discord_service import send_event_notification
from typing import Optional
from datetime import datetime

router = APIRouter()


@router.post("/public", response_model=EventResponse)
async def create_public_event_endpoint(
    event_data: PublicEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """建立公開活動"""
    result = await create_public_event(db, current_user.id, event_data)
    
    # TODO: 發送 Discord 通知（如果有相關設定）
    
    return result


@router.get("/public", response_model=list[EventResponse])
async def get_public_events_endpoint(
    school: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    sort: str = Query("time"),
    db: AsyncSession = Depends(get_db)
):
    """取得公開活動列表"""
    events = await get_public_events(db, school, category, from_date, to_date, sort)
    return events


@router.post("/{event_id}/join", response_model=MessageResponse)
async def join_event_endpoint(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """報名公開活動"""
    try:
        result = await join_event(db, event_id, current_user.id)
        
        # TODO: 同步到行事曆
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{event_id}/leave", response_model=MessageResponse)
async def leave_event_endpoint(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """退出活動"""
    result = await leave_event(db, event_id, current_user.id)
    
    # TODO: 從行事曆刪除
    
    return result


@router.get("/{event_id}", response_model=EventResponse)
async def get_event_endpoint(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """取得活動詳細資訊"""
    from sqlalchemy import select
    from app.models.event import Event
    from app.services.event_service import get_event_vote_stats, get_event_attendees
    import json
    
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    vote_stats = None
    if event.public == 0 and event.proposed_times_json:
        vote_stats = await get_event_vote_stats(db, event.id)
    
    attendees = []
    if event.public == 1:
        attendees = await get_event_attendees(db, event.id)
    
    return {
        "id": event.id,
        "room_id": event.room_id,
        "created_by": event.created_by,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "location": event.location,
        "public": event.public,
        "proposed_times": json.loads(event.proposed_times_json) if event.proposed_times_json else None,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
        "vote_stats": vote_stats,
        "attendees": attendees
    }


@router.get("/{event_id}/attendees", response_model=list[EventAttendee])
async def get_event_attendees_endpoint(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """取得活動參加者"""
    attendees = await get_event_attendees(db, event_id)
    return attendees

