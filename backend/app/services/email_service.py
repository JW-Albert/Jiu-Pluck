import aiosmtplib
from email.mime.text import MIMEText
from app.core.config import settings


async def send_verification_email(email: str, code: str) -> None:
    """寄送驗證碼 email"""
    if not settings.SMTP_HOST:
        # 開發環境：只印出驗證碼
        print(f"[DEV] Verification code for {email}: {code}")
        return
    
    message = MIMEText(f"Your verification code is: {code}\n\nThis code will expire in 10 minutes.")
    message["Subject"] = "Jiu-Pluck Email Verification"
    message["From"] = settings.SMTP_FROM
    message["To"] = email
    
    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USERNAME,
        password=settings.SMTP_PASSWORD,
        use_tls=settings.SMTP_USE_TLS,
    )


async def send_notification_email(email: str, subject: str, body: str) -> None:
    """寄送通知 email"""
    if not settings.SMTP_HOST:
        print(f"[DEV] Notification to {email}: {subject}\n{body}")
        return
    
    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = email
    
    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USERNAME,
        password=settings.SMTP_PASSWORD,
        use_tls=settings.SMTP_USE_TLS,
    )

