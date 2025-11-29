from pydantic import BaseModel
from typing import Optional
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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

