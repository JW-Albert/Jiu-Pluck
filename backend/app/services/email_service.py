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
    
    # 建立 SMTP 連接
    smtp = aiosmtplib.SMTP(
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        use_tls=False,  # 先不使用 TLS，稍後使用 STARTTLS
    )
    
    await smtp.connect()
    
    # 如果使用 TLS，執行 STARTTLS
    if settings.SMTP_USE_TLS:
        await smtp.starttls()
    
    # 登入
    await smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
    
    # 發送郵件
    await smtp.send_message(message)
    
    # 關閉連接
    await smtp.quit()


async def send_login_otp_email(email: str, code: str) -> None:
    """寄送登入 OTP email"""
    if not settings.SMTP_HOST:
        # 開發環境：只印出 OTP
        print(f"[DEV] Login OTP for {email}: {code}")
        return
    
    message = MIMEText(f"Your login code is: {code}\n\nThis code will expire in 10 minutes.")
    message["Subject"] = "Jiu-Pluck Login Code"
    message["From"] = settings.SMTP_FROM
    message["To"] = email
    
    # 建立 SMTP 連接
    smtp = aiosmtplib.SMTP(
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        use_tls=False,  # 先不使用 TLS，稍後使用 STARTTLS
    )
    
    await smtp.connect()
    
    # 如果使用 TLS，執行 STARTTLS
    if settings.SMTP_USE_TLS:
        await smtp.starttls()
    
    # 登入
    await smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
    
    # 發送郵件
    await smtp.send_message(message)
    
    # 關閉連接
    await smtp.quit()


async def send_notification_email(email: str, subject: str, body: str) -> None:
    """寄送通知 email"""
    if not settings.SMTP_HOST:
        print(f"[DEV] Notification to {email}: {subject}\n{body}")
        return
    
    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = email
    
    # 建立 SMTP 連接
    smtp = aiosmtplib.SMTP(
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        use_tls=False,  # 先不使用 TLS，稍後使用 STARTTLS
    )
    
    await smtp.connect()
    
    # 如果使用 TLS，執行 STARTTLS
    if settings.SMTP_USE_TLS:
        await smtp.starttls()
    
    # 登入
    await smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
    
    # 發送郵件
    await smtp.send_message(message)
    
    # 關閉連接
    await smtp.quit()

