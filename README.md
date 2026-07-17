# Personal Manager

A self-hosted desktop application for managing notes, calendars, and bills with Google integrations and AI-powered features.

![License](https://img.shields.io/badge/license-ISC-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.x-blue)
![React](https://img.shields.io/badge/React-18-blue)

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

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop | Tauri 2.x |
| Frontend | React 18 + TypeScript |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL 16 + Prisma 7 |
| AI | OpenAI-compatible API |
| Auth | Google OAuth 2.0 |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop App (Tauri)                    │
├─────────────────────────────────────────────────────────┤
│                    React Frontend                        │
├─────────────────────────────────────────────────────────┤
│                    Express Backend                       │
├─────────────────────────────────────────────────────────┤
│              PostgreSQL + Prisma ORM                     │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  Google   │   │  Google   │   │    AI     │
    │ Calendar  │   │   Drive   │   │   API     │
    └───────────┘   └───────────┘   └───────────┘
```

## Project Structure

```
personal_manager/
├── frontend/              # Tauri + React app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # API clients
│   │   └── types/         # TypeScript types
│   └── src-tauri/         # Tauri configuration
├── backend/               # Node.js API
│   ├── src/
│   │   ├── routes/        # Express route handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── lib/           # Utilities
│   └── prisma/            # Database schema
├── ARCHITECTURE.md        # Architecture decisions
├── TICKETS.md             # Issue breakdown
└── docker-compose.yml     # Docker services
```

## Getting Started

### Prerequisites

- Node.js 20+
- Rust and Cargo (for Tauri)
- PostgreSQL 16+
- Google Cloud Project (for OAuth)

### Development

1. **Clone the repository**
   ```bash
   git clone git@github.com:xmanig/personal_manager.git
   cd personal_manager
   ```

2. **Install dependencies**
   ```bash
   npm install
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
   docker compose up -d postgres
   ```

5. **Run migrations**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Docker Deployment

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
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
- `GET /api/notes` - List notes
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `GET /api/notes/search?q=` - Search notes
- `POST /api/notes/:id/summarize` - AI summarize

### Calendar
- `GET /api/calendar/events` - List events (with Google sync)
- `POST /api/calendar/events` - Create event
- `PUT /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event

### Bills
- `GET /api/bills` - List bills
- `POST /api/bills` - Create bill
- `PUT /api/bills/:id` - Update bill
- `DELETE /api/bills/:id` - Delete bill
- `POST /api/bills/fetch-gmail` - Fetch from Gmail
- `POST /api/bills/parse` - AI parse bill text

### Auth
- `GET /api/auth/google` - Start Google OAuth
- `GET /api/auth/callback` - OAuth callback

## License

ISC
