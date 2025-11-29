from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from app.models.user import User
from app.models.event import Event


class BusySlot:
    """忙碌時段"""
    def __init__(self, start: datetime, end: datetime):
        self.start = start
        self.end = end


class CalendarProvider(ABC):
    """行事曆 Provider 抽象介面"""
    
    @abstractmethod
    async def create_event(self, user: User, event: Event) -> str:
        """建立事件，回傳 external_event_id"""
        pass
    
    @abstractmethod
    async def update_event(self, user: User, event: Event, external_event_id: str) -> None:
        """更新事件"""
        pass
    
    @abstractmethod
    async def delete_event(self, user: User, external_event_id: str) -> None:
        """刪除事件"""
        pass
    
    @abstractmethod
    async def get_busy_slots(
        self,
        user: User,
        start_time: datetime,
        end_time: datetime
    ) -> List[BusySlot]:
        """取得忙碌時段"""
        pass


async def sync_event_to_calendars(
    db,
    user: User,
    event: Event,
    action: str,  # create / update / delete
    providers: List[CalendarProvider]
) -> None:
    """同步事件到使用者的所有行事曆"""
    # TODO: 從 calendar_events 表查詢已同步的事件
    # 根據 action 呼叫對應的 provider 方法
    
    for provider in providers:
        try:
            if action == "create":
                external_id = await provider.create_event(user, event)
                # 儲存到 calendar_events 表
                # TODO: 實作
            elif action == "update":
                # TODO: 取得 external_event_id
                # await provider.update_event(user, event, external_event_id)
                pass
            elif action == "delete":
                # TODO: 取得 external_event_id
                # await provider.delete_event(user, external_event_id)
                pass
        except Exception as e:
            print(f"Failed to sync event to calendar: {e}")

