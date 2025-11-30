from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProposedTime(BaseModel):
    start: datetime
    end: datetime


class PrivateEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    proposed_times: List[ProposedTime]


class PublicEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime


class EventVoteRequest(BaseModel):
    time_index: int  # 候選時間的索引（0, 1, 2, ...）
    vote: str  # yes / no / maybe


class EventVoteResponse(BaseModel):
    event_id: str
    user_id: str
    time_index: int
    vote: str


class EventVoteStats(BaseModel):
    yes: int
    no: int
    maybe: int


class EventAttendee(BaseModel):
    user_id: str
    name: Optional[str] = None
    school: Optional[str] = None


class EventVoter(BaseModel):
    user_id: str
    name: Optional[str] = None
    time_index: int  # 候選時間的索引
    vote: str  # yes / no / maybe


class TimeVoteStats(BaseModel):
    """單個候選時間的投票統計"""
    time_index: int
    start: str
    end: str
    yes: int
    no: int
    maybe: int
    voters: List[EventVoter] = []


class EventResponse(BaseModel):
    id: str
    room_id: Optional[str] = None
    created_by: str
    created_by_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    public: int
    proposed_times: Optional[List[ProposedTime]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    vote_stats: Optional[EventVoteStats] = None  # 保留向後兼容，但可能為空
    time_vote_stats: List[TimeVoteStats] = []  # 按候選時間分組的投票統計
    voters: List[EventVoter] = []
    attendees: List[EventAttendee] = []


class PublicEventQuery(BaseModel):
    school: Optional[str] = None
    category: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    sort: Optional[str] = "time"  # time / created_at

