from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.calendar import GoogleAuthResponse, CalendarStatusResponse
from app.schemas.auth import MessageResponse
from app.core.config import settings

# TODO: 實作 Google OAuth
# from google_auth_oauthlib.flow import Flow
# from google.oauth2.credentials import Credentials

router = APIRouter()


@router.get("/auth", response_model=GoogleAuthResponse)
async def google_auth(
    current_user: User = Depends(get_current_user)
):
    """取得 Google OAuth 授權 URL"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Calendar integration not configured"
        )
    
    # TODO: 實作 OAuth flow
    # flow = Flow.from_client_config(...)
    # authorization_url, state = flow.authorization_url(...)
    # return {"auth_url": authorization_url}
    
    raise NotImplementedError("Google OAuth not implemented yet")


@router.get("/callback")
async def google_callback(
    code: str = Query(...),
    state: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Google OAuth callback"""
    # TODO: 實作
    # 1. Exchange code for tokens
    # 2. 儲存到 google_tokens 表
    # 3. Redirect to frontend
    
    raise NotImplementedError("Google OAuth callback not implemented yet")


@router.get("/status", response_model=CalendarStatusResponse)
async def google_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """檢查 Google Calendar 連線狀態"""
    # TODO: 從 google_tokens 表查詢
    return {"google_connected": False, "apple_connected": False}

