# Jiu-Pluck - University Student Outing Platform

**Version**: 1.0.1  
**License**: MIT

A comprehensive platform for university students to organize group outings, manage schedules, and coordinate activities. Supports both private group events (room-based) and public activities (open registration).

## Features

- **User Authentication**: OTP (One-Time Password) login via email, email verification
- **Private Rooms**: Create rooms and invite friends using invite codes
- **Public Activities**: Browse and join open events
- **Timetable Management**:
  - Manage personal timetables with automatic free slot calculation
  - Support for multiple school timetable templates
  - Users can submit templates for admin review
  - Free time calculation outside class hours uses hourly intervals
  - Dashboard displays personal timetable
- **Event Voting System**:
  - Private events can have multiple proposed times
  - Vote on each proposed time separately (yes/no/maybe)
  - Set vote deadline, automatically closes voting when deadline passes
  - View voting statistics and voter lists
- **Member Free Time**: View room members' free time slots for better coordination
- **Calendar Integration**: Sync with Google Calendar and Apple Calendar (CalDAV)
- **Discord Notifications**: Automatic notifications for room events
- **Admin Panel**:
  - User management (create, edit, delete)
  - Template management (review, create, edit, delete)
  - View all rooms and events (including private ones)

## Technology Stack

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Database**: SQLite with SQLAlchemy + Alembic
- **Authentication**: JWT (access token + refresh token)
- **HTTP Client**: httpx/requests
- **Calendar Integration**: 
  - Google Calendar: google-auth + google-api-python-client
  - Apple Calendar: caldav (CalDAV over iCloud)
- **Email**: smtplib/aiosmtplib

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query + Zustand
- **Routing**: React Router

## Project Structure

```
Jiu-Pluck/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   │   └── routes/
│   │   └── services/
│   ├── migrations/
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── pages/
│   │   ├── components/
│   │   └── hooks/
│   └── dist/
├── ENV/
│   ├── .env
│   └── .env.example
├── boot/
│   ├── start_production.sh
│   ├── jiu-pluck.service
│   └── setup_service.sh
├── deploy.sh
├── run.sh
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Jiu-Pluck
   ```

2. **Run deployment script** (Ubuntu/Debian)
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   The script will automatically:
   - Install Node.js if not present
   - Install Python 3, pip, and venv if not present
   - Set up backend virtual environment
   - Install backend dependencies
   - Install frontend dependencies
   - Build frontend for production

3. **Configure environment variables**
   ```bash
   cp ENV/.env.example ENV/.env
   # Edit ENV/.env with your configuration
   ```

   Required environment variables:
   - `APP_SECRET_KEY`: Secret key for JWT tokens
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`: SMTP settings for email
   - `ADMIN_EMAIL`: Admin account email (optional)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google Calendar OAuth (optional)

4. **Run the application**

   **Development mode:**
   ```bash
   ./run.sh
   ```

   **Production mode with systemd:**
   ```bash
   sudo ./boot/setup_service.sh
   ```

## Environment Variables

Create `ENV/.env` file with the following variables:

```env
# Application
APP_ENV=dev
APP_SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database
DATABASE_URL=sqlite+aiosqlite:///./app.db

# SMTP (for email verification and OTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=your_app@domain.com
SMTP_USE_SSL=false

# Google Calendar OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:8000/api/google/callback
GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly

# Admin Account (optional)
ADMIN_EMAIL=admin@example.com
```

## Running the Application

### Development Mode

**Backend:**
```bash
cd backend
source venv/bin/activate
python run.py
# Or: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Production Mode

**Using systemd service:**
```bash
sudo ./boot/setup_service.sh
```

**Manual start:**
```bash
./boot/start_production.sh
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/request-login-otp` - Request login OTP
- `POST /api/auth/login` - Login with OTP
- `POST /api/auth/refresh` - Refresh access token

### Timetable
- `GET /api/timetable/templates` - Get approved timetable templates
- `POST /api/timetable/templates/submit` - Submit template for review
- `GET /api/timetable` - Get user's timetable
- `POST /api/timetable` - Save user's timetable
- `GET /api/timetable/free-slots` - Get free time slots

### Rooms
- `POST /api/rooms` - Create a room
- `GET /api/rooms` - Get user's rooms (admin can see all rooms)
- `GET /api/rooms/{room_id}` - Get room details
- `POST /api/rooms/join` - Join room by invite code
- `GET /api/rooms/{room_id}/invite-code` - Get room invite code
- `POST /api/rooms/{room_id}/regenerate-invite-code` - Regenerate invite code
- `GET /api/rooms/{room_id}/members/free-slots` - Get room members' free slots
- `POST /api/rooms/{room_id}/events` - Create room event (with proposed times and vote deadline)
- `GET /api/rooms/{room_id}/events` - Get room events (with voters and attendees)
- `POST /api/rooms/{room_id}/events/{event_id}/vote` - Vote on specific proposed time
- `DELETE /api/rooms/{room_id}` - Delete room (admin/owner only)

### Events
- `GET /api/events/public` - Get public events (admin can see all events)
- `POST /api/events/public` - Create public event
- `GET /api/events/{event_id}` - Get event details (with time-based vote stats and voters)
- `POST /api/events/{event_id}/join` - Join public event
- `POST /api/events/{event_id}/leave` - Leave event
- `GET /api/events/{event_id}/attendees` - Get event attendees
- `DELETE /api/events/{event_id}` - Delete event (admin/creator/room owner only)

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/users/{user_id}` - Get user details
- `PUT /api/admin/users/{user_id}` - Update user
- `DELETE /api/admin/users/{user_id}` - Delete user
- `GET /api/admin/templates/pending` - Get pending templates
- `GET /api/admin/templates` - Get all templates (with optional status filter)
- `GET /api/admin/templates/{template_id}` - Get template details
- `POST /api/admin/templates` - Create template (admin only)
- `PUT /api/admin/templates/{template_id}` - Update template
- `DELETE /api/admin/templates/{template_id}` - Delete template
- `POST /api/admin/templates/{template_id}/review` - Review template (approve/reject)

## Features in Detail

### User Authentication
- One-time password (OTP) sent via email for login
- No password storage required
- Email verification required for account activation

### Timetable Management
- Users can create and submit timetable templates for review
- Administrators can approve/reject templates
- Administrators can create, edit, and delete templates
- Default template: "Feng Chia University - General Semester" with 14 periods
- Automatic free slot calculation based on timetable
- Free time calculation outside class hours uses hourly intervals
- Dashboard displays personal timetable
- Events voted by user are displayed on the timetable

### Room System
- Create private rooms for group activities
- Invite members using 8-character invite codes
- View all members' free time slots
- Create events with multiple proposed times
- Vote on each proposed time separately (yes/no/maybe)
- Set vote deadline, automatically closes voting when deadline passes
- View voting statistics and voter lists for each proposed time

### Event System
- **Private Events**: Room-based events with time-based voting
  - Multiple proposed times per event
  - Vote on each time slot separately
  - Vote deadline support
  - Time-based vote statistics
- **Public Events**: Open events anyone can join
- Event details include creator name, attendees, and voting statistics
- Events appear on user's timetable after voting

### Admin Panel
- User management (view, edit, delete)
- Template management (review, create, edit, delete)
- View all rooms and events (including private ones)

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Database Migrations

The database schema is automatically created on first startup. For manual migrations:

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

## Deployment

### Systemd Service Setup

1. **Run setup script:**
   ```bash
   sudo ./boot/setup_service.sh
   ```

2. **Service management:**
   ```bash
   sudo systemctl start jiu-pluck    # Start service
   sudo systemctl stop jiu-pluck      # Stop service
   sudo systemctl restart jiu-pluck   # Restart service
   sudo systemctl status jiu-pluck    # Check status
   sudo journalctl -u jiu-pluck -f    # View logs
   ```

The service will automatically:
- Start on system boot
- Restart on failure
- Run both frontend and backend

### Production Build

The frontend is automatically built during deployment. To manually build:

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/` and served via Vite preview.

## Security

- Passwords are hashed using bcrypt (for OTP system, no passwords stored)
- JWT tokens with expiration
- Apple Calendar app-specific passwords are encrypted
- Environment variables for sensitive configuration
- Email verification required for account activation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file in the root directory for details.

## Support

For issues and questions, please open an issue on the repository.

