from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.user import User
from app.models.timetable import TimetableTemplate
from app.schemas.user import UserResponse, UserUpdate, UserListResponse
from app.schemas.timetable import TimetableTemplateResponse, TimetableTemplateReview
from app.schemas.auth import MessageResponse
from datetime import datetime
import json

router = APIRouter()


# 使用者管理
@router.get("/users", response_model=UserListResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """取得使用者列表（管理員）"""
    # 取得總數
    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar()
    
    # 取得使用者列表
    result = await db.execute(
        select(User)
        .offset(skip)
        .limit(limit)
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    
    return {
        "users": [
            UserResponse(
                id=u.id,
                email=u.email,
                name=u.name,
                school=u.school,
                major=u.major,
                email_verified=bool(u.email_verified),
                is_admin=bool(u.is_admin),
                is_active=bool(u.is_active),
                created_at=u.created_at,
                updated_at=u.updated_at
            )
            for u in users
        ],
        "total": total
    }


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """取得使用者詳情（管理員）"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        school=user.school,
        major=user.major,
        email_verified=bool(user.email_verified),
        is_admin=bool(user.is_admin),
        is_active=bool(user.is_active),
        created_at=user.created_at,
        updated_at=user.updated_at
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """更新使用者（管理員）"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 更新欄位
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.school is not None:
        user.school = user_data.school
    if user_data.major is not None:
        user.major = user_data.major
    if user_data.is_active is not None:
        user.is_active = 1 if user_data.is_active else 0
    if user_data.is_admin is not None:
        # 防止管理員移除自己的管理員權限
        if user_id == current_admin.id and not user_data.is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove your own admin privileges"
            )
        user.is_admin = 1 if user_data.is_admin else 0
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        school=user.school,
        major=user.major,
        email_verified=bool(user.email_verified),
        is_admin=bool(user.is_admin),
        is_active=bool(user.is_active),
        created_at=user.created_at,
        updated_at=user.updated_at
    )


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """刪除使用者（管理員）"""
    # 防止刪除自己
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await db.delete(user)
    await db.commit()
    
    return {"message": "User deleted successfully"}


# 課表模板審核
@router.get("/templates/pending", response_model=list[TimetableTemplateResponse])
async def get_pending_templates(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """取得待審核的課表模板（管理員）"""
    result = await db.execute(
        select(TimetableTemplate)
        .where(TimetableTemplate.status == "pending")
        .order_by(TimetableTemplate.submitted_at.desc())
    )
    templates = result.scalars().all()
    
    return [
        TimetableTemplateResponse(
            id=t.id,
            school=t.school,
            name=t.name,
            periods=json.loads(t.periods_json),
            created_by=t.created_by,
            status=t.status,
            submitted_at=t.submitted_at,
            reviewed_at=t.reviewed_at,
            reviewed_by=t.reviewed_by,
            created_at=t.created_at,
            updated_at=t.updated_at
        )
        for t in templates
    ]


@router.post("/templates/{template_id}/review", response_model=MessageResponse)
async def review_template(
    template_id: int,
    review_data: TimetableTemplateReview,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """審核課表模板（管理員）"""
    if review_data.status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'approved' or 'rejected'"
        )
    
    result = await db.execute(
        select(TimetableTemplate).where(TimetableTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    template.status = review_data.status
    template.reviewed_at = datetime.utcnow()
    template.reviewed_by = current_admin.id
    
    await db.commit()
    
    return {"message": f"Template {review_data.status} successfully"}

