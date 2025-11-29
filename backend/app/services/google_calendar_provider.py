from typing import List, Optional
from datetime import datetime
from app.services.calendar_service import CalendarProvider, BusySlot
from app.models.user import User
from app.models.event import Event
from app.core.config import settings

# TODO: 實作 Google Calendar API 整合
# 需要安裝: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client


class GoogleCalendarProvider(CalendarProvider):
    """Google Calendar Provider"""
    
    def __init__(self):
        # TODO: 初始化 Google API client
        pass
    
    async def create_event(self, user: User, event: Event) -> str:
        """建立 Google Calendar 事件"""
        # TODO: 實作 Google Calendar Events API
        # 1. 取得 user 的 access_token (從 google_tokens 表)
        # 2. 使用 google-api-python-client 建立事件
        # 3. 回傳 event.id
        raise NotImplementedError("Google Calendar integration not implemented yet")
    
    async def update_event(self, user: User, event: Event, external_event_id: str) -> None:
        """更新 Google Calendar 事件"""
        # TODO: 實作
        raise NotImplementedError("Google Calendar integration not implemented yet")
    
    async def delete_event(self, user: User, external_event_id: str) -> None:
        """刪除 Google Calendar 事件"""
        # TODO: 實作
        raise NotImplementedError("Google Calendar integration not implemented yet")
    
    async def get_busy_slots(
        self,
        user: User,
        start_time: datetime,
        end_time: datetime
    ) -> List[BusySlot]:
        """取得 Google Calendar 忙碌時段"""
        # TODO: 使用 freebusy.query API
        raise NotImplementedError("Google Calendar integration not implemented yet")

