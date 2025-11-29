from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, users, timetable, rooms, events, webhooks, calendar_google, calendar_apple
from app.core.database import engine, Base

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


@app.on_event("startup")
async def startup():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    return {"message": "Jiu-Pluck API"}


@app.get("/health")
async def health():
    return {"status": "ok"}

