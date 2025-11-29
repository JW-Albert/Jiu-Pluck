from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.calendar_integration import AppleCalendarCredential
from app.schemas.calendar import AppleConnectRequest, CalendarStatusResponse
from app.schemas.auth import MessageResponse
from app.core.security import encrypt_app_password
import caldav

# TODO: 實作 CalDAV 連線測試

router = APIRouter()


@router.post("/connect", response_model=MessageResponse)
async def apple_connect(
    connect_data: AppleConnectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """連線 Apple Calendar"""
    # TODO: 測試 CalDAV 連線
    # try:
    #     client = caldav.DAVClient(
    #         url="https://caldav.icloud.com/",
    #         username=connect_data.apple_id_email,
    #         password=connect_data.app_specific_password
    #     )
    #     principal = client.principal()
    #     calendars = principal.calendars()
    # except Exception as e:
    #     raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")
    
    # 加密並儲存
    encrypted_password = encrypt_app_password(connect_data.app_specific_password)
    
    # 檢查是否已存在
    result = await db.execute(
        select(AppleCalendarCredential).where(AppleCalendarCredential.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        existing.apple_id_email = connect_data.apple_id_email
        existing.encrypted_app_password = encrypted_password
    else:
        cred = AppleCalendarCredential(
            user_id=current_user.id,
            apple_id_email=connect_data.apple_id_email,
            encrypted_app_password=encrypted_password
        )
        db.add(cred)
    
    await db.commit()
    
    return {"message": "Apple Calendar connected successfully"}


@router.get("/status", response_model=CalendarStatusResponse)
async def apple_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """檢查 Apple Calendar 連線狀態"""
    result = await db.execute(
        select(AppleCalendarCredential).where(AppleCalendarCredential.user_id == current_user.id)
    )
    cred = result.scalar_one_or_none()
    
    # TODO: 也檢查 Google
    return {
        "google_connected": False,
        "apple_connected": cred is not None
    }

