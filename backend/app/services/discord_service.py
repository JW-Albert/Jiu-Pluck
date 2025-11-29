import httpx
from typing import List
from app.models.room import RoomWebhook
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


async def send_room_notification(db: AsyncSession, room_id: str, message: str) -> None:
    """發送 Discord Webhook 通知"""
    # 取得房間的所有 webhooks
    result = await db.execute(
        select(RoomWebhook).where(RoomWebhook.room_id == room_id)
    )
    webhooks = result.scalars().all()
    
    if not webhooks:
        return
    
    # 準備 Discord webhook payload
    payload = {
        "content": message
    }
    
    # 對每個 webhook 發送
    async with httpx.AsyncClient() as client:
        for webhook in webhooks:
            try:
                await client.post(webhook.url, json=payload, timeout=5.0)
            except Exception as e:
                # 記錄錯誤但不中斷流程
                print(f"Failed to send Discord webhook to {webhook.url}: {e}")


async def send_event_notification(
    db: AsyncSession,
    room_id: str,
    title: str,
    description: str = None
) -> None:
    """發送活動通知（使用 Discord embed）"""
    result = await db.execute(
        select(RoomWebhook).where(RoomWebhook.room_id == room_id)
    )
    webhooks = result.scalars().all()
    
    if not webhooks:
        return
    
    # Discord embed 格式
    embed = {
        "title": title,
        "description": description or "",
        "color": 0x5865F2  # Discord 藍色
    }
    
    payload = {
        "embeds": [embed]
    }
    
    async with httpx.AsyncClient() as client:
        for webhook in webhooks:
            try:
                await client.post(webhook.url, json=payload, timeout=5.0)
            except Exception as e:
                print(f"Failed to send Discord webhook to {webhook.url}: {e}")

