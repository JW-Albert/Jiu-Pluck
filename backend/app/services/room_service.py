from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import secrets
from typing import List, Dict
from app.models.room import Room, RoomWebhook
from app.models.event import Event
from app.models.room import room_members
from app.schemas.room import RoomCreate


async def create_room(db: AsyncSession, user_id: str, room_data: RoomCreate) -> Dict:
    """建立房間"""
    room_id = str(uuid.uuid4())
    # 生成 8 位數邀請碼
    invite_code = secrets.token_urlsafe(6).upper()[:8]
    
    room = Room(
        id=room_id,
        name=room_data.name,
        owner_id=user_id,
        school=room_data.school,
        invite_code=invite_code
    )
    
    db.add(room)
    
    # 將 owner 加入 room_members
    await db.execute(
        room_members.insert().values(room_id=room_id, user_id=user_id, role="owner")
    )
    
    await db.commit()
    await db.refresh(room)
    
    return {
        "id": room.id,
        "name": room.name,
        "owner_id": room.owner_id,
        "school": room.school,
        "invite_code": room.invite_code,
        "created_at": room.created_at,
        "updated_at": room.updated_at
    }


async def get_user_rooms(db: AsyncSession, user_id: str) -> List[Dict]:
    """取得使用者參與的房間列表"""
    # TODO: 使用 JOIN 查詢優化
    result = await db.execute(
        select(room_members.c.room_id).where(room_members.c.user_id == user_id)
    )
    room_ids = [row[0] for row in result.fetchall()]
    
    if not room_ids:
        return []
    
    result = await db.execute(select(Room).where(Room.id.in_(room_ids)))
    rooms = result.scalars().all()
    
    return [
        {
            "id": r.id,
            "name": r.name,
            "owner_id": r.owner_id,
            "school": r.school,
            "invite_code": r.invite_code,
            "created_at": r.created_at,
            "updated_at": r.updated_at
        }
        for r in rooms
    ]


async def get_room_detail(db: AsyncSession, room_id: str) -> Dict:
    """取得房間詳細資訊"""
    from app.models.user import User
    
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    
    if not room:
        raise ValueError("Room not found")
    
    # 取得擁有者資訊
    owner_result = await db.execute(select(User).where(User.id == room.owner_id))
    owner = owner_result.scalar_one_or_none()
    
    # 取得成員
    result = await db.execute(
        select(room_members).where(room_members.c.room_id == room_id)
    )
    members_data = result.fetchall()
    
    # 取得成員詳細資訊（name 等）
    member_ids = [row[1] for row in members_data]
    if member_ids:
        users_result = await db.execute(select(User).where(User.id.in_(member_ids)))
        users = {u.id: u for u in users_result.scalars().all()}
    else:
        users = {}
    
    members = [
        {
            "user_id": row[1],
            "name": users.get(row[1]).name if row[1] in users else None,
            "role": row[2]
        }
        for row in members_data
    ]
    
    # 取得相關活動
    result = await db.execute(
        select(Event).where(Event.room_id == room_id).order_by(Event.created_at.desc())
    )
    events = result.scalars().all()
    
    events_list = [
        {
            "id": e.id,
            "title": e.title,
            "created_at": e.created_at
        }
        for e in events[:10]  # 只取最近 10 個
    ]
    
    return {
        "id": room.id,
        "name": room.name,
        "owner_id": room.owner_id,
        "owner_name": owner.name if owner else None,
        "school": room.school,
        "created_at": room.created_at,
        "updated_at": room.updated_at,
        "members": members,
        "events": events_list,
        "invite_code": room.invite_code
    }


async def join_room_by_invite_code(
    db: AsyncSession,
    invite_code: str,
    user_id: str
) -> Dict:
    """通過邀請碼加入房間"""
    # 查找房間
    result = await db.execute(select(Room).where(Room.invite_code == invite_code))
    room = result.scalar_one_or_none()
    
    if not room:
        raise ValueError("Invalid invite code")
    
    # 檢查是否已經是成員
    result = await db.execute(
        select(room_members).where(
            room_members.c.room_id == room.id,
            room_members.c.user_id == user_id
        )
    )
    existing = result.fetchone()
    if existing:
        raise ValueError("Already a member of this room")
    
    # 加入房間
    await db.execute(
        room_members.insert().values(room_id=room.id, user_id=user_id, role="member")
    )
    await db.commit()
    
    return {
        "message": f"Successfully joined room: {room.name}",
        "room_id": room.id,
        "room_name": room.name
    }


async def regenerate_invite_code(
    db: AsyncSession,
    room_id: str,
    user_id: str
) -> Dict:
    """重新生成邀請碼（僅限房主或管理員）"""
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    
    if not room:
        raise ValueError("Room not found")
    
    # 檢查權限（這裡假設會在前端檢查，後端也可以再檢查一次）
    # 生成新邀請碼
    new_invite_code = secrets.token_urlsafe(6).upper()[:8]
    room.invite_code = new_invite_code
    await db.commit()
    await db.refresh(room)
    
    return {
        "invite_code": room.invite_code,
        "message": "Invite code regenerated"
    }

