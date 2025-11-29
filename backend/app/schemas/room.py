from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RoomCreate(BaseModel):
    name: str
    school: Optional[str] = None


class RoomMember(BaseModel):
    user_id: str
    name: Optional[str] = None
    role: str


class RoomResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    owner_name: Optional[str] = None
    school: Optional[str] = None
    invite_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    members: List[RoomMember] = []


class RoomInviteRequest(BaseModel):
    email: str


class RoomJoinByCodeRequest(BaseModel):
    invite_code: str


class RoomJoinResponse(BaseModel):
    message: str
    room_id: str
    room_name: str


class WebhookCreate(BaseModel):
    url: str


class WebhookResponse(BaseModel):
    id: str
    room_id: str
    url: str
    created_at: datetime

