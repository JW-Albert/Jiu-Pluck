from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, users, timetable, rooms, events, webhooks, calendar_google, calendar_apple, admin
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.config import settings
from app.models.user import User
from app.models.timetable import TimetableTemplate
from sqlalchemy import select
import uuid
import json
from datetime import datetime

app = FastAPI(title="Jiu-Pluck API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(timetable.router, prefix="/api/timetable", tags=["timetable"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(webhooks.router, prefix="/api/rooms", tags=["webhooks"])
app.include_router(calendar_google.router, prefix="/api/calendar/google", tags=["calendar-google"])
app.include_router(calendar_apple.router, prefix="/api/calendar/apple", tags=["calendar-apple"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.on_event("startup")
async def startup():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create admin account if configured
    if settings.ADMIN_EMAIL:
        async with AsyncSessionLocal() as db:
            # Check if admin user already exists
            result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                # Create admin user (no password needed, uses OTP)
                admin_id = str(uuid.uuid4())
                
                admin_user = User(
                    id=admin_id,
                    email=settings.ADMIN_EMAIL,
                    password_hash="",  # No password, uses OTP
                    name="Admin",
                    is_active=1,
                    email_verified=1,  # Admin email is pre-verified
                    is_admin=1  # 設定為管理員
                )
                
                db.add(admin_user)
                await db.commit()
                print(f"Admin account created: {settings.ADMIN_EMAIL}")
            else:
                # Ensure admin email is verified and is_admin is set
                if not admin_user.email_verified:
                    admin_user.email_verified = 1
                if not admin_user.is_admin:
                    admin_user.is_admin = 1
                await db.commit()
                print(f"Admin account already exists: {settings.ADMIN_EMAIL}")
    
    # Create default timetable template: 逢甲大學 - 一般學期
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(TimetableTemplate).where(
                TimetableTemplate.school == "逢甲大學",
                TimetableTemplate.name == "一般學期"
            )
        )
        existing_template = result.scalar_one_or_none()
        
        if not existing_template:
            # 逢甲大學一般學期的14個節次
            default_periods = [
                {"name": "1", "start": "08:10", "end": "09:00"},
                {"name": "2", "start": "09:10", "end": "10:00"},
                {"name": "3", "start": "10:10", "end": "11:00"},
                {"name": "4", "start": "11:10", "end": "12:00"},
                {"name": "5", "start": "12:10", "end": "13:00"},
                {"name": "6", "start": "13:10", "end": "14:00"},
                {"name": "7", "start": "14:10", "end": "15:00"},
                {"name": "8", "start": "15:10", "end": "16:00"},
                {"name": "9", "start": "16:10", "end": "17:00"},
                {"name": "10", "start": "17:10", "end": "18:00"},
                {"name": "11", "start": "18:30", "end": "19:20"},
                {"name": "12", "start": "19:25", "end": "20:15"},
                {"name": "13", "start": "20:25", "end": "21:15"},
                {"name": "14", "start": "21:20", "end": "22:10"},
            ]
            
            now = datetime.utcnow()
            default_template = TimetableTemplate(
                school="逢甲大學",
                name="一般學期",
                periods_json=json.dumps(default_periods),
                created_by=None,  # NULL 表示系統預設
                status="approved",  # 系統預設模板直接通過
                submitted_at=now,
                reviewed_at=now,
                reviewed_by=None  # 系統預設不需要審核者
            )
            
            db.add(default_template)
            await db.commit()
            print("Default timetable template created: 逢甲大學 - 一般學期")
        else:
            print("Default timetable template already exists: 逢甲大學 - 一般學期")


@app.get("/")
async def root():
    return {"message": "Jiu-Pluck API"}


@app.get("/health")
async def health():
    return {"status": "ok"}

