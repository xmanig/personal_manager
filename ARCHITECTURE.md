# Personal Manager — Architecture

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 | SPA, dark mode, responsive UI |
| Backend | Node.js + Express 5 + TypeScript | REST API, Google integrations |
| Database | PostgreSQL 16 + Prisma 7 | Persistent storage, full-text search |
| AI | OpenAI-compatible API (custom endpoint) | Bill parsing, note summarization, smart search |
| Auth | Google OAuth 2.0 | Calendar, Drive, Gmail access |
| PDF | pdf-parse + AI extraction | Bill text extraction |
| Deploy | Docker Compose (multi-stage build) | Self-hosted, single-command setup |

## Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   Browser (SPA)                         │
│  React 19 + Tailwind CSS v4                            │
│                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────┐                    │
│  │  Notes   │ │ Calendar │ │ Bills │                    │
│  └────┬─────┘ └────┬─────┘ └──┬───┘                    │
│       │             │          │                         │
└───────┼─────────────┼──────────┼─────────────────────────┘
        │  HTTP/REST  │          │
┌───────▼─────────────▼──────────▼─────────────────────────┐
│                Node.js Backend (API)                     │
│                                                          │
│  /api/auth      → Google OAuth flow                      │
│  /api/notes     → CRUD + search + AI summarization       │
│  /api/calendar  → Google Calendar sync                   │
│  /api/bills     → Gmail fetch + PDF parse + AI extract   │
└───────┬──────────────────────────────┬───────────────────┘
        │                              │
   ┌────▼────┐                   ┌─────▼──────┐
   │PostgreSQL│                   │Google APIs │
   │  Prisma  │                   │ Calendar   │
   │  ORM     │                   │ Drive      │
   └─────────┘                   │ Gmail      │
                                 └────────────┘
```

## Google API Integration

### OAuth Scopes
- `https://www.googleapis.com/auth/calendar` — Two-way calendar sync
- `https://www.googleapis.com/auth/drive.readonly` — Read bills from Drive folder
- `https://www.googleapis.com/auth/gmail.readonly` — Read bill attachments from Gmail
- `https://www.googleapis.com/auth/userinfo.email` — User identification

### Calendar Sync Strategy
- **Two-way sync** triggered on-demand (user clicks refresh)
- Local PostgreSQL cache for offline viewing
- Last-write-wins conflict resolution by default
- `synced_at` timestamp per event for tracking

### Bill Fetching Strategy
- **On-demand only** (user triggers refresh from UI)
- **Gmail path**: User-defined filter rules (sender, subject, date range), fetch matching emails, extract PDF attachments
- Deduplication via `gmail_message_id`

## AI Pipeline

### Bill Parsing
1. PDF → raw text via `pdf-parse`
2. Raw text → structured data via OpenAI-compatible API
3. Extracted fields: vendor, amount, currency, due date, category, line items
4. Confidence score stored per extraction
5. Fallback to manual entry if extraction fails

### Note Features
- Summarization: Send note content → get concise summary
- Smart search: Natural language query → relevant notes

## Database Schema

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

// === Notes ===

model Note {
  id        String   @id @default(cuid())
  title     String
  content   String?  @db.Text
  folderId  String?
  folder    Folder?  @relation(fields: [folderId], references: [id])
  tags      Tag[]
  summary   String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([folderId])
}

model Folder {
  id       String  @id @default(cuid())
  name     String
  parentId String?
  parent   Folder? @relation("FolderTree", fields: [parentId], references: [id])
  children Folder[] @relation("FolderTree")
  notes    Note[]
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  notes Note[]
}

// === Bills ===

model Bill {
  id              String   @id @default(cuid())
  vendor          String?
  amount          Float?
  currency        String?  @default("EUR")
  dueDate         DateTime?
  category        String?
  source          String?
  gmailMessageId  String?  @unique
  driveFileId     String?  @unique
  pdfUrl          String?
  rawText         String?  @db.Text
  lineItems       Json?
  confidenceScore Float?
  isPaid          Boolean  @default(false)
  isRecurring     Boolean  @default(false)
  recurringFreq   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([dueDate])
  @@index([category])
  @@index([source])
}

// === Calendar ===

model CalendarEvent {
  id              String   @id @default(cuid())
  googleEventId   String   @unique
  title           String
  description     String?  @db.Text
  startTime       DateTime
  endTime         DateTime
  location        String?
  recurrenceRule  String?
  isAllDay        Boolean  @default(false)
  lastLocalEdit   DateTime?
  lastGoogleEdit  DateTime?
  syncedAt        DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([startTime])
  @@index([endTime])
}

// === Settings ===

model UserSetting {
  id    String @id @default(cuid())
  key   String @unique
  value String @db.Text
}
```

## Project Structure

```
personal_manager/
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Button, Modal, Badge, EmptyState, ThemeToggle
│   │   │   └── calendar/    # MonthView, WeekView, DayView, EventForm
│   │   ├── pages/           # NotesList, CalendarPage, BillsPage
│   │   ├── lib/             # API clients (api.ts, calendar-api.ts, bills-api.ts)
│   │   ├── types/           # TypeScript type definitions
│   │   ├── App.tsx          # Root component with routing + sidebar
│   │   ├── index.css        # Tailwind CSS + dark theme
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── routes/          # auth, notes, tags, folders, calendar, bills
│   │   ├── services/        # google-auth, gmail-bills, bill-extractor, pdf-parser, ai
│   │   ├── middleware/      # auth.ts (Google OAuth)
│   │   └── lib/             # google-clients, prisma
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Auto-generated migrations
│   │   └── seed.ts          # Seed data
│   ├── prisma.config.ts     # Prisma 7 config (datasource URL)
│   ├── package.json
│   └── tsconfig.json
│
├── Dockerfile               # Multi-stage build (frontend + backend)
├── Dockerfile.dev           # Development with hot-reload
├── docker-entrypoint.sh     # Auto-run migrations on start
├── docker-compose.yml       # PostgreSQL + app service
├── .dockerignore
├── ARCHITECTURE.md
├── README.md
└── TICKETS.md
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Pure web SPA | Simple, deploy anywhere, no native deps |
| Styling | Tailwind CSS v4 | Utility-first, dark mode built-in, small bundle |
| Notes format | Markdown | Simple, searchable, version-control friendly |
| Bill fetching | On-demand | Avoids API quota issues, user controls timing |
| Calendar sync | On-demand two-way | Consistent with bill fetching, less complexity |
| Conflict resolution | Last-write-wins | Simple default for local-only user |
| AI provider | OpenAI-compatible | Flexible, self-hostable |
| Auth | Google OAuth only | Local-only app, no user accounts needed |
| Database | PostgreSQL + Prisma 7 | Full-text search (tsvector), JSON support, type-safe queries |
| Deployment | Docker Compose | Self-hosted, single `docker compose up -d` |
| URL config | prisma.config.ts | Prisma 7 adapter pattern — URL separated from schema |
