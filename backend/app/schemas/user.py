from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    school: Optional[str] = None
    major: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    email_verified: bool
    is_admin: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    school: Optional[str] = None
    major: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int

