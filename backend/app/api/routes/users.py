from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """取得當前使用者資訊"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "school": current_user.school,
        "major": current_user.major,
        "email_verified": bool(current_user.email_verified),
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

