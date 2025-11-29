from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import secrets
import uuid
from app.models.user import User, EmailVerificationCode
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth import SignupRequest, LoginRequest
from app.services.email_service import send_verification_email, send_login_otp_email


async def signup(db: AsyncSession, signup_data: SignupRequest) -> dict:
    """註冊新使用者"""
    # 檢查 email 是否已存在
    result = await db.execute(select(User).where(User.email == signup_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise ValueError("Email already registered")
    
    # 建立使用者（不需要密碼）
    user_id = str(uuid.uuid4())
    
    user = User(
        id=user_id,
        email=signup_data.email,
        password_hash="",  # 不再使用密碼
        name=signup_data.name,
        school=signup_data.school,
        major=signup_data.major,
        is_active=1,
        email_verified=0
    )
    
    db.add(user)
    
    # 產生驗證碼
    code = secrets.token_hex(3).upper()  # 6 位數驗證碼
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    verification_code = EmailVerificationCode(
        email=signup_data.email,
        code=code,
        expires_at=expires_at,
        used=0
    )
    
    db.add(verification_code)
    await db.commit()
    
    # 寄送驗證碼（非同步，不等待）
    # TODO: 使用背景任務處理
    try:
        await send_verification_email(signup_data.email, code)
    except Exception as e:
        # 記錄錯誤但不影響註冊流程
        print(f"Failed to send verification email: {e}")
    
    return {"message": "Registration successful. Please check your email for verification code."}


async def verify_email(db: AsyncSession, email: str, code: str) -> dict:
    """驗證 email"""
    result = await db.execute(
        select(EmailVerificationCode)
        .where(EmailVerificationCode.email == email)
        .where(EmailVerificationCode.code == code)
        .where(EmailVerificationCode.used == 0)
        .where(EmailVerificationCode.expires_at > datetime.utcnow())
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        raise ValueError("Invalid or expired verification code")
    
    # 標記為已使用
    verification.used = 1
    
    # 更新使用者 email_verified
    user_result = await db.execute(select(User).where(User.email == email))
    user = user_result.scalar_one()
    user.email_verified = 1
    
    await db.commit()
    
    return {"message": "Email verified successfully"}


async def request_login_otp(db: AsyncSession, email: str) -> dict:
    """請求登入 OTP"""
    # 檢查使用者是否存在
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise ValueError("User not found")
    
    if not user.is_active:
        raise ValueError("User account is inactive")
    
    if not user.email_verified:
        raise ValueError("Email not verified. Please verify your email first.")
    
    # 產生 6 位數 OTP
    code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # 將舊的未使用 OTP 標記為已使用
    old_otps_result = await db.execute(
        select(EmailVerificationCode)
        .where(EmailVerificationCode.email == email)
        .where(EmailVerificationCode.used == 0)
    )
    old_otps = old_otps_result.scalars().all()
    for old_otp in old_otps:
        old_otp.used = 1
    
    # 建立新的 OTP
    otp_code = EmailVerificationCode(
        email=email,
        code=code,
        expires_at=expires_at,
        used=0
    )
    
    db.add(otp_code)
    await db.commit()
    
    # 寄送 OTP
    try:
        await send_login_otp_email(email, code)
    except Exception as e:
        print(f"Failed to send login OTP email: {e}")
        raise ValueError("Failed to send login code. Please try again later.")
    
    return {"message": "Login code sent to your email"}


async def login(db: AsyncSession, login_data: LoginRequest) -> dict:
    """使用 OTP 登入"""
    # 驗證 OTP
    result = await db.execute(
        select(EmailVerificationCode)
        .where(EmailVerificationCode.email == login_data.email)
        .where(EmailVerificationCode.code == login_data.code)
        .where(EmailVerificationCode.used == 0)
        .where(EmailVerificationCode.expires_at > datetime.utcnow())
    )
    otp = result.scalar_one_or_none()
    
    if not otp:
        raise ValueError("Invalid or expired login code")
    
    # 取得使用者
    user_result = await db.execute(select(User).where(User.email == login_data.email))
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise ValueError("User not found")
    
    if not user.is_active:
        raise ValueError("User account is inactive")
    
    # 標記 OTP 為已使用
    otp.used = 1
    await db.commit()
    
    # 產生 tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

