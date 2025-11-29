from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models.user import User
from app.models.room import Room, room_members
from app.models.event import Event
from app.schemas.room import (
    RoomCreate,
    RoomResponse,
    RoomInviteRequest
)
from app.schemas.auth import MessageResponse
from app.schemas.event import (
    PrivateEventCreate,
    EventResponse,
    EventVoteRequest,
    EventVoteResponse
)
from app.services.room_service import create_room, get_user_rooms, get_room_detail
from app.services.event_service import create_private_event, vote_event, get_event_vote_stats
from app.services.discord_service import send_event_notification, send_room_notification
import json

router = APIRouter()


@router.post("", response_model=RoomResponse)
async def create_room_endpoint(
    room_data: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """建立房間"""
    result = await create_room(db, current_user.id, room_data)
    return result


@router.get("", response_model=list[RoomResponse])
async def get_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得使用者參與的房間列表（管理員可以看到所有房間）"""
    if current_user.is_admin:
        # 管理員可以看到所有房間
        result = await db.execute(select(Room).order_by(Room.created_at.desc()))
        all_rooms = result.scalars().all()
        rooms = []
        for r in all_rooms:
            # 取得房間成員資訊（包含姓名）
            members_result = await db.execute(
                select(room_members).where(room_members.c.room_id == r.id)
            )
            members_data = members_result.fetchall()
            member_ids = [row[1] for row in members_data]
            
            # 取得使用者資訊
            if member_ids:
                users_result = await db.execute(
                    select(User).where(User.id.in_(member_ids))
                )
                users = {u.id: u for u in users_result.scalars().all()}
            else:
                users = {}
            
            # 取得擁有者資訊
            owner_result = await db.execute(select(User).where(User.id == r.owner_id))
            owner = owner_result.scalar_one_or_none()
            
            members = [
                {
                    "user_id": row[1],
                    "name": users.get(row[1]).name if row[1] in users else None,
                    "role": row[2]
                }
                for row in members_data
            ]
            
            rooms.append({
                "id": r.id,
                "name": r.name,
                "owner_id": r.owner_id,
                "owner_name": owner.name if owner else None,
                "school": r.school,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
                "members": members
            })
        return rooms
    else:
        # 一般使用者只能看到自己參與的房間
        rooms = await get_user_rooms(db, current_user.id)
        # 為每個房間添加成員姓名和擁有者姓名
        for room in rooms:
            # 取得擁有者資訊
            owner_result = await db.execute(select(User).where(User.id == room["owner_id"]))
            owner = owner_result.scalar_one_or_none()
            room["owner_name"] = owner.name if owner else None
            
            members_result = await db.execute(
                select(room_members).where(room_members.c.room_id == room["id"])
            )
            members_data = members_result.fetchall()
            member_ids = [row[1] for row in members_data]
            
            if member_ids:
                users_result = await db.execute(
                    select(User).where(User.id.in_(member_ids))
                )
                users = {u.id: u for u in users_result.scalars().all()}
            else:
                users = {}
            
            room["members"] = [
                {
                    "user_id": row[1],
                    "name": users.get(row[1]).name if row[1] in users else None,
                    "role": row[2]
                }
                for row in members_data
            ]
        return rooms


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得房間詳細資訊"""
    try:
        result = await get_room_detail(db, room_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{room_id}/invite", response_model=MessageResponse)
async def invite_to_room(
    room_id: str,
    invite_data: RoomInviteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """邀請使用者加入房間"""
    # TODO: 實作邀請邏輯
    # 目前先簡單回傳成功訊息
    return {"message": f"Invitation sent to {invite_data.email}"}


@router.post("/{room_id}/events", response_model=EventResponse)
async def create_room_event(
    room_id: str,
    event_data: PrivateEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """建立房間活動"""
    # 檢查使用者是否為房間成員
    result = await db.execute(
        select(room_members).where(
            room_members.c.room_id == room_id,
            room_members.c.user_id == current_user.id
        )
    )
    if not result.fetchone():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a room member")
    
    result = await create_private_event(db, room_id, current_user.id, event_data)
    
    # 發送 Discord 通知
    await send_event_notification(
        db,
        room_id,
        f"新活動：{event_data.title}",
        event_data.description
    )
    
    return result


@router.get("/{room_id}/events", response_model=list[EventResponse])
async def get_room_events(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得房間活動列表"""
    result = await db.execute(
        select(Event).where(Event.room_id == room_id).order_by(Event.created_at.desc())
    )
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
        vote_stats = await get_event_vote_stats(db, e.id)
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
            "attendees": []
        })
    
    return events_list


@router.post("/{room_id}/events/{event_id}/vote", response_model=EventVoteResponse)
async def vote_room_event(
    room_id: str,
    event_id: str,
    vote_data: EventVoteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """對房間活動投票"""
    # 檢查活動是否屬於該房間
    result = await db.execute(
        select(Event).where(Event.id == event_id, Event.room_id == room_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    result = await vote_event(db, event_id, current_user.id, vote_data.vote)
    
    # 發送 Discord 通知
    try:
        await send_room_notification(
            db,
            room_id,
            f"{current_user.name or current_user.email} 對「{event.title}」投了 {vote_data.vote}"
        )
    except Exception as e:
        print(f"Failed to send Discord notification: {e}")
    
    return result


@router.delete("/{room_id}", response_model=MessageResponse)
async def delete_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """刪除房間（僅限管理員或房間擁有者）"""
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    
    # 檢查權限：管理員或房間擁有者
    if not current_user.is_admin and room.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room owner or admin can delete this room"
        )
    
    # 刪除相關的活動、成員、webhooks 等
    # 先刪除活動
    events_result = await db.execute(select(Event).where(Event.room_id == room_id))
    events = events_result.scalars().all()
    for event in events:
        # 刪除活動相關的投票和參加者
        from app.models.event import EventVote, event_attendees
        await db.execute(EventVote.__table__.delete().where(EventVote.event_id == event.id))
        await db.execute(event_attendees.delete().where(event_attendees.c.event_id == event.id))
        await db.delete(event)
    
    # 刪除成員關係
    await db.execute(room_members.delete().where(room_members.c.room_id == room_id))
    
    # 刪除 webhooks
    from app.models.room import RoomWebhook
    webhooks_result = await db.execute(
        select(RoomWebhook).where(RoomWebhook.room_id == room_id)
    )
    webhooks = webhooks_result.scalars().all()
    for webhook in webhooks:
        await db.delete(webhook)
    
    # 刪除房間
    await db.delete(room)
    await db.commit()
    
    return {"message": "Room deleted successfully"}

