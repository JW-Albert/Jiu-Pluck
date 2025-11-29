from pydantic import BaseModel
from typing import Optional


class GoogleAuthResponse(BaseModel):
    auth_url: str


class AppleConnectRequest(BaseModel):
    apple_id_email: str
    app_specific_password: str


class CalendarStatusResponse(BaseModel):
    google_connected: bool
    apple_connected: bool


class SyncEventRequest(BaseModel):
    event_id: str
    action: str  # create / update / delete

