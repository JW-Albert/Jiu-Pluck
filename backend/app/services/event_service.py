from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
import uuid
import json
from typing import List, Dict, Optional
from datetime import datetime
from app.models.event import Event, EventVote, event_attendees
from app.models.user import User
from app.schemas.event import PrivateEventCreate, PublicEventCreate, ProposedTime


async def create_private_event(
    db: AsyncSession,
    room_id: str,
    user_id: str,
    event_data: PrivateEventCreate
) -> Dict:
    """建立私人活動"""
    event_id = str(uuid.uuid4())
    
    proposed_times_json = json.dumps([
        {"start": pt.start.isoformat(), "end": pt.end.isoformat()}
        for pt in event_data.proposed_times
    ])
    
    event = Event(
        id=event_id,
        room_id=room_id,
        created_by=user_id,
        title=event_data.title,
        description=event_data.description,
        category=event_data.category,
        location=event_data.location,
        public=0,
        proposed_times_json=proposed_times_json
    )
    
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    return {
        "id": event.id,
        "room_id": event.room_id,
        "created_by": event.created_by,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "location": event.location,
        "public": event.public,
        "proposed_times": json.loads(event.proposed_times_json),
        "created_at": event.created_at,
        "updated_at": event.updated_at
    }


async def create_public_event(
    db: AsyncSession,
    user_id: str,
    event_data: PublicEventCreate
) -> Dict:
    """建立公開活動"""
    event_id = str(uuid.uuid4())
    
    event = Event(
        id=event_id,
        room_id=None,
        created_by=user_id,
        title=event_data.title,
        description=event_data.description,
        category=event_data.category,
        location=event_data.location,
        public=1,
        start_time=event_data.start_time,
        end_time=event_data.end_time
    )
    
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    return {
        "id": event.id,
        "created_by": event.created_by,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "location": event.location,
        "public": event.public,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "created_at": event.created_at,
        "updated_at": event.updated_at
    }


async def vote_event(
    db: AsyncSession,
    event_id: str,
    user_id: str,
    vote: str
) -> Dict:
    """投票"""
    if vote not in ["yes", "no", "maybe"]:
        raise ValueError("Invalid vote value")
    
    # 檢查活動是否存在
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise ValueError("Event not found")
    
    # 更新或建立投票
    result = await db.execute(
        select(EventVote).where(
            and_(EventVote.event_id == event_id, EventVote.user_id == user_id)
        )
    )
    existing_vote = result.scalar_one_or_none()
    
    if existing_vote:
        existing_vote.vote = vote
    else:
        new_vote = EventVote(event_id=event_id, user_id=user_id, vote=vote)
        db.add(new_vote)
    
    await db.commit()
    
    return {"event_id": event_id, "user_id": user_id, "vote": vote}


async def get_event_vote_stats(db: AsyncSession, event_id: str) -> Dict:
    """取得投票統計"""
    result = await db.execute(select(EventVote).where(EventVote.event_id == event_id))
    votes = result.scalars().all()
    
    stats = {"yes": 0, "no": 0, "maybe": 0}
    for vote in votes:
        stats[vote.vote] = stats.get(vote.vote, 0) + 1
    
    return stats


async def get_event_voters(db: AsyncSession, event_id: str) -> List[Dict]:
    """取得活動投票者名單（包含姓名）"""
    result = await db.execute(select(EventVote).where(EventVote.event_id == event_id))
    votes = result.scalars().all()
    
    if not votes:
        return []
    
    user_ids = [vote.user_id for vote in votes]
    result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users = result.scalars().all()
    user_dict = {u.id: u for u in users}
    
    return [
        {
            "user_id": vote.user_id,
            "name": user_dict.get(vote.user_id).name if vote.user_id in user_dict else None,
            "vote": vote.vote
        }
        for vote in votes
    ]


async def get_public_events(
    db: AsyncSession,
    school: Optional[str] = None,
    category: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    sort: str = "time"
) -> List[Dict]:
    """取得公開活動列表"""
    query = select(Event).where(Event.public == 1)
    
    if school:
        # TODO: 需要 JOIN users 表來過濾 school
        pass
    
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
    
    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "category": e.category,
            "location": e.location,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "created_at": e.created_at
        }
        for e in events
    ]


async def join_event(db: AsyncSession, event_id: str, user_id: str) -> Dict:
    """報名公開活動"""
    # 檢查活動是否存在且為公開
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise ValueError("Event not found")
    if event.public != 1:
        raise ValueError("Event is not public")
    
    # 檢查是否已報名
    result = await db.execute(
        select(event_attendees).where(
            and_(event_attendees.c.event_id == event_id, event_attendees.c.user_id == user_id)
        )
    )
    existing = result.fetchone()
    if existing:
        raise ValueError("Already joined")
    
    # 加入
    await db.execute(
        event_attendees.insert().values(event_id=event_id, user_id=user_id)
    )
    await db.commit()
    
    return {"message": "Joined event successfully"}


async def leave_event(db: AsyncSession, event_id: str, user_id: str) -> Dict:
    """退出活動"""
    await db.execute(
        event_attendees.delete().where(
            and_(event_attendees.c.event_id == event_id, event_attendees.c.user_id == user_id)
        )
    )
    await db.commit()
    
    return {"message": "Left event successfully"}


async def get_event_attendees(db: AsyncSession, event_id: str) -> List[Dict]:
    """取得活動參加者"""
    result = await db.execute(
        select(event_attendees).where(event_attendees.c.event_id == event_id)
    )
    attendee_rows = result.fetchall()
    
    if not attendee_rows:
        return []
    
    user_ids = [row[1] for row in attendee_rows]
    
    result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users = result.scalars().all()
    
    user_dict = {u.id: u for u in users}
    
    return [
        {
            "user_id": user_id,
            "name": user_dict.get(user_id).name if user_id in user_dict else None,
            "school": user_dict.get(user_id).school if user_id in user_dict else None
        }
        for user_id in user_ids
    ]

