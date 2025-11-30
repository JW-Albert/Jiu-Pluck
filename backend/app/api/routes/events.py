from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from sqlalchemy import select
from app.models.event import Event
from app.schemas.event import (
    PrivateEventCreate,
    PublicEventCreate,
    EventResponse,
    EventVoteRequest,
    EventVoteResponse,
    EventAttendee
)
from app.schemas.auth import MessageResponse
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
import json

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
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得公開活動列表（管理員可以看到所有活動，包含私人活動）"""
    # 如果是管理員，顯示所有活動（包含私人活動）
    if current_user and current_user.is_admin:
        query = select(Event)
        
        if category:
            query = query.where(Event.category == category)
        
        if from_date:
            query = query.where(Event.start_time >= from_date)
        
        if to_date:
            query = query.where(Event.start_time <= to_date)
        
        if sort == "time":
            query = query.order_by(Event.start_time)
        else:
            query = query.order_by(Event.created_at.desc())
        
        result = await db.execute(query)
        events = result.scalars().all()
        
        # 取得所有建立者的資訊
        creator_ids = list(set([e.created_by for e in events]))
        if creator_ids:
            users_result = await db.execute(select(User).where(User.id.in_(creator_ids)))
            users = {u.id: u for u in users_result.scalars().all()}
        else:
            users = {}
        
        events_list = []
        for e in events:
            creator = users.get(e.created_by)
            vote_stats = None
            attendees = []
            
            if e.public == 0 and e.proposed_times_json:
                vote_stats = await get_event_vote_stats(db, e.id)
            elif e.public == 1:
                attendees = await get_event_attendees(db, e.id)
            
            events_list.append({
                "id": e.id,
                "room_id": e.room_id,
                "created_by": e.created_by,
                "created_by_name": creator.name if creator else None,
                "title": e.title,
                "description": e.description,
                "category": e.category,
                "location": e.location,
                "public": e.public,
                "proposed_times": json.loads(e.proposed_times_json) if e.proposed_times_json else None,
                "start_time": e.start_time,
                "end_time": e.end_time,
                "created_at": e.created_at,
                "updated_at": e.updated_at,
                "vote_stats": vote_stats,
                "attendees": attendees
            })
        
        return events_list
    else:
        # 一般使用者只能看到公開活動
        events = await get_public_events(db, school, category, from_date, to_date, sort)
        # 為每個活動添加建立者姓名
        creator_ids = list(set([e.get("created_by") for e in events if e.get("created_by")]))
        if creator_ids:
            users_result = await db.execute(select(User).where(User.id.in_(creator_ids)))
            users = {u.id: u for u in users_result.scalars().all()}
        else:
            users = {}
        
        for event in events:
            creator = users.get(event.get("created_by"))
            event["created_by_name"] = creator.name if creator else None
        
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
    from app.services.event_service import get_event_vote_stats, get_event_attendees, get_event_voters
    import json
    
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    vote_stats = None
    voters = []
    if event.public == 0 and event.proposed_times_json:
        vote_stats = await get_event_vote_stats(db, event.id)
        voters = await get_event_voters(db, event.id)
    
    attendees = []
    if event.public == 1:
        attendees = await get_event_attendees(db, event.id)
    
    # 取得建立者資訊
    creator_result = await db.execute(select(User).where(User.id == event.created_by))
    creator = creator_result.scalar_one_or_none()
    
    return {
        "id": event.id,
        "room_id": event.room_id,
        "created_by": event.created_by,
        "created_by_name": creator.name if creator else None,
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
        "voters": voters,
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


@router.delete("/{event_id}", response_model=MessageResponse)
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """刪除活動（僅限管理員或活動建立者）"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    # 檢查權限：管理員或活動建立者
    if not current_user.is_admin and event.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only event creator or admin can delete this event"
        )
    
    # 如果是房間活動，檢查是否為房間擁有者
    if event.room_id:
        from app.models.room import Room
        room_result = await db.execute(select(Room).where(Room.id == event.room_id))
        room = room_result.scalar_one_or_none()
        if room and (current_user.is_admin or room.owner_id == current_user.id):
            # 管理員或房間擁有者可以刪除
            pass
        elif event.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only event creator, room owner or admin can delete this event"
            )
    
    # 刪除相關的投票和參加者
    from app.models.event import EventVote, event_attendees
    await db.execute(EventVote.__table__.delete().where(EventVote.event_id == event_id))
    await db.execute(event_attendees.delete().where(event_attendees.c.event_id == event_id))
    
    # 刪除活動
    await db.delete(event)
    await db.commit()
    
    return {"message": "Event deleted successfully"}

