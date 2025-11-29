from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import base64
import hashlib
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """驗證密碼"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """產生密碼 hash"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """建立 JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.APP_SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """建立 JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.APP_SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """解碼 JWT token"""
    try:
        payload = jwt.decode(token, settings.APP_SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        return None


# 加密 Apple app-specific password
def get_encryption_key() -> bytes:
    """從 SECRET_KEY 產生加密金鑰"""
    key = hashlib.sha256(settings.APP_SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key)


def encrypt_app_password(password: str) -> str:
    """加密 Apple app-specific password"""
    key = get_encryption_key()
    f = Fernet(key)
    encrypted = f.encrypt(password.encode())
    return encrypted.decode()


def decrypt_app_password(encrypted_password: str) -> str:
    """解密 Apple app-specific password"""
    key = get_encryption_key()
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_password.encode())
    return decrypted.decode()

