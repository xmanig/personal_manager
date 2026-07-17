# Personal Manager

A desktop application for managing notes, calendars, and bills with Google integrations and AI-powered features.

## Features

- **Notes** — Markdown editor, tagging, folders, full-text search, AI summarization
- **Calendar** — Two-way sync with Google Calendar, month/week/day views
- **Bills** — Auto-fetch from Google Drive/Gmail, AI-powered PDF parsing, spending dashboard

## Tech Stack

- **Frontend**: Tauri 2.x + React + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenAI-compatible API
- **Auth**: Google OAuth 2.0

## Project Structure

```
personal_manager/
├── frontend/          # Tauri + React app
├── backend/           # Node.js API
├── ARCHITECTURE.md    # Architecture decisions and schema
├── TICKETS.md         # Issue breakdown
└── docker-compose.yml # Docker services
```

## Getting Started

### Prerequisites

- Node.js 20+
- Rust (for Tauri)
- PostgreSQL 16+

### Development

```bash
# Install dependencies
npm install

# Start backend
npm run dev:backend

# Start frontend (in another terminal)
npm run dev:frontend
```

### Docker

```bash
docker compose up
```

## License

ISC
