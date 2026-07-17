# Personal Manager

A self-hosted web application for managing notes, calendars, and bills with Google integrations and AI-powered features.

![License](https://img.shields.io/badge/license-ISC-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-blue)

## Features

### Notes
- Markdown editor with live preview
- Full-text search with PostgreSQL tsvector
- Organize with folders and tags
- AI-powered note summarization
- Smart search with natural language queries

### Calendar
- Two-way sync with Google Calendar
- Month, week, and day views
- Create, edit, and delete events
- Conflict resolution with last-write-wins strategy
- Offline support with sync status

### Bills
- Auto-fetch bills from Gmail (PDF attachments)
- AI-powered bill data extraction (vendor, amount, due date)
- PDF text parsing pipeline
- Track bill status (pending, paid, overdue)
- Filter by category and status

### UI
- Dark mode with persistent toggle
- Responsive sidebar navigation
- Modern design with Tailwind CSS v4

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL 16 + Prisma 7 |
| AI | OpenAI-compatible API |
| Auth | Google OAuth 2.0 |

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Browser (SPA)                         │
├────────────────────────────────────────────────────────┤
│              React 19 + Tailwind CSS                    │
└────────────────────────┬───────────────────────────────┘
                         │  HTTP/REST
┌────────────────────────▼───────────────────────────────┐
│                  Express Backend                        │
│                                                        │
│  /api/auth      → Google OAuth                         │
│  /api/notes     → CRUD + search + AI                   │
│  /api/calendar  → Google Calendar sync                 │
│  /api/bills     → Gmail + PDF + AI extraction          │
├────────────────────────────────────────────────────────┤
│              PostgreSQL + Prisma ORM                    │
└────────┬───────────────────────────────┬───────────────┘
         │                               │
    ┌────▼────┐                   ┌──────▼──────┐
    │Google   │                   │  AI API     │
    │Calendar │                   │(OpenAI-     │
    │Drive    │                   │ compatible) │
    │Gmail    │                   └─────────────┘
    └─────────┘
```

## Project Structure

```
personal_manager/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # Button, Modal, Badge, etc.
│   │   │   └── calendar/  # MonthView, WeekView, DayView
│   │   ├── pages/         # Notes, Calendar, Bills pages
│   │   ├── lib/           # API clients
│   │   └── types/         # TypeScript definitions
│   └── index.html
├── backend/               # Node.js API
│   ├── src/
│   │   ├── routes/        # Express route handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/     # Auth middleware
│   │   └── lib/           # Utilities & API clients
│   └── prisma/            # Database schema + migrations
├── Dockerfile             # Multi-stage production build
├── docker-compose.yml     # PostgreSQL + app containers
├── ARCHITECTURE.md        # Design decisions & schema
└── TICKETS.md             # Issue breakdown
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Google Cloud Project (for OAuth)

### Development

1. **Clone the repository**
   ```bash
   git clone git@github.com:xmanig/personal_manager.git
   cd personal_manager
   ```

2. **Install dependencies**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Set up environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Start the database**
   ```bash
   docker compose up -d db
   ```

5. **Run migrations**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 — Backend
   cd backend && npm run dev

   # Terminal 2 — Frontend
   cd frontend && npm run dev
   ```

### Docker Deployment (Production)

```bash
# Start all services
docker compose up -d

# Open http://localhost:3001
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `http://localhost:3001/api/auth/callback` |
| `AI_API_KEY` | OpenAI-compatible API key | - |
| `AI_BASE_URL` | Custom AI API base URL | `https://api.openai.com/v1` |
| `AI_MODEL` | Model to use | `gpt-4` |

## API Endpoints

### Notes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes` | List notes (with search/filter params) |
| POST | `/api/notes` | Create note |
| GET | `/api/notes/:id` | Get note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |
| GET | `/api/notes/search?q=` | Search notes |
| POST | `/api/notes/:id/summarize` | AI summarize |

### Calendar
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/calendar/events` | List events (with Google sync) |
| POST | `/api/calendar/events` | Create event (syncs to Google) |
| PUT | `/api/calendar/events/:id` | Update event |
| DELETE | `/api/calendar/events/:id` | Delete event |

### Bills
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bills` | List bills |
| GET | `/api/bills/:id` | Get bill |
| PUT | `/api/bills/:id` | Update bill |
| DELETE | `/api/bills/:id` | Delete bill |
| POST | `/api/bills/fetch-gmail` | Fetch bills from Gmail |
| POST | `/api/bills/parse` | AI parse bill text |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/callback` | OAuth callback |

## License

ISC
