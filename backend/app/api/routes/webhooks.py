from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.room import RoomWebhook, Room
from app.schemas.room import WebhookCreate, WebhookResponse, MessageResponse

router = APIRouter()


@router.post("/{room_id}/webhooks", response_model=WebhookResponse)
async def create_webhook(
    room_id: str,
    webhook_data: WebhookCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """新增 Discord Webhook"""
    # 檢查房間是否存在且使用者有權限
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    
    if room.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    webhook_id = str(uuid.uuid4())
    webhook = RoomWebhook(
        id=webhook_id,
        room_id=room_id,
        url=webhook_data.url
    )
    
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    
    return {
        "id": webhook.id,
        "room_id": webhook.room_id,
        "url": webhook.url,
        "created_at": webhook.created_at
    }


@router.get("/{room_id}/webhooks", response_model=list[WebhookResponse])
async def get_webhooks(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得房間的 Webhooks"""
    result = await db.execute(
        select(RoomWebhook).where(RoomWebhook.room_id == room_id)
    )
    webhooks = result.scalars().all()
    
    return [
        {
            "id": w.id,
            "room_id": w.room_id,
            "url": w.url,
            "created_at": w.created_at
        }
        for w in webhooks
    ]


@router.delete("/{room_id}/webhooks/{webhook_id}", response_model=MessageResponse)
async def delete_webhook(
    room_id: str,
    webhook_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """刪除 Webhook"""
    result = await db.execute(
        select(RoomWebhook).where(
            RoomWebhook.id == webhook_id,
            RoomWebhook.room_id == room_id
        )
    )
    webhook = result.scalar_one_or_none()
    
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")
    
    # 檢查權限
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one()
    if room.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await db.delete(webhook)
    await db.commit()
    
    return {"message": "Webhook deleted successfully"}

