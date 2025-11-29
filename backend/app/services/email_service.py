import aiosmtplib
from email.mime.text import MIMEText
from app.core.config import settings


async def _send_email(message: MIMEText) -> None:
    """
    通用郵件寄送邏輯，自動處理 SSL / STARTTLS。
    """
    # 開發模式：沒有 SMTP_HOST → 直接 print，不寄信
    if not settings.SMTP_HOST:
        print(f"[DEV] Email to {message['To']}:\n{message.as_string()}")
        return

    # 選擇 SSL 直連模式（port 465）
    use_ssl = getattr(settings, "SMTP_USE_SSL", False)
    use_tls = getattr(settings, "SMTP_USE_TLS", False)

    smtp = aiosmtplib.SMTP(
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        use_tls=use_ssl  # SSL 模式 (port 465) -> True, STARTTLS (587) -> False
    )

    # 連線
    await smtp.connect()

    # STARTTLS：只在非 SSL 模式下啟用（通常是 port 587）
    if use_tls and not use_ssl:
        await smtp.starttls()

    # 登入
    await smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

    # 寄信
    await smtp.send_message(message)

    # 關閉連線
    await smtp.quit()


async def send_verification_email(email: str, code: str) -> None:
    """
    寄送註冊/驗證碼 email
    """
    message = MIMEText(f"Your verification code is: {code}\n\nThis code will expire in 10 minutes.")
    message["Subject"] = "Jiu-Pluck Email Verification"
    message["From"] = settings.SMTP_FROM
    message["To"] = email

    await _send_email(message)


async def send_login_otp_email(email: str, code: str) -> None:
    """
    寄送登入用 OTP
    """
    message = MIMEText(f"Your login code is: {code}\n\nThis code will expire in 10 minutes.")
    message["Subject"] = "Jiu-Pluck Login Code"
    message["From"] = settings.SMTP_FROM
    message["To"] = email

    await _send_email(message)


async def send_notification_email(email: str, subject: str, body: str) -> None:
    """
    寄送通知類 email
    """
    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = email

    await _send_email(message)
