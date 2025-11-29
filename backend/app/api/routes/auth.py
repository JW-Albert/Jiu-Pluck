from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.auth import (
    SignupRequest,
    VerifyEmailRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    MessageResponse
)
from app.services.auth_service import signup, verify_email, login
from app.core.security import decode_token, create_access_token

router = APIRouter()


@router.post("/signup", response_model=MessageResponse)
async def signup_endpoint(
    signup_data: SignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """註冊"""
    try:
        result = await signup(db, signup_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email_endpoint(
    verify_data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    """驗證 email"""
    try:
        result = await verify_email(db, verify_data.email, verify_data.code)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login_endpoint(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """登入"""
    try:
        result = await login(db, login_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """刷新 access token"""
    payload = decode_token(refresh_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_data.refresh_token,  # 通常 refresh token 不變
        "token_type": "bearer"
    }

