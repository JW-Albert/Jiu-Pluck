from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import time


class PeriodTemplate(BaseModel):
    name: str
    start: str  # "HH:MM"
    end: str


class TimetableTemplateResponse(BaseModel):
    id: int
    school: str
    name: str
    periods: List[PeriodTemplate]


class TimetableData(BaseModel):
    # 格式: { "monday": [{ "period": "1", "course": "Calculus" }, ...], ... }
    monday: Optional[List[Dict[str, str]]] = None
    tuesday: Optional[List[Dict[str, str]]] = None
    wednesday: Optional[List[Dict[str, str]]] = None
    thursday: Optional[List[Dict[str, str]]] = None
    friday: Optional[List[Dict[str, str]]] = None
    saturday: Optional[List[Dict[str, str]]] = None
    sunday: Optional[List[Dict[str, str]]] = None


class TimetableCreate(BaseModel):
    data: TimetableData


class TimetableResponse(BaseModel):
    id: int
    user_id: str
    data: TimetableData


class FreeSlot(BaseModel):
    start: str  # "HH:MM"
    end: str


class FreeSlotsResponse(BaseModel):
    weekday: str
    slots: List[FreeSlot]

