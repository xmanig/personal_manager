# Personal Manager — Architecture

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop | Tauri 2.x + React + TypeScript | Native shell, lightweight (~5MB) |
| Backend | Node.js + Express + TypeScript | REST API, Google integrations |
| Database | PostgreSQL + Prisma ORM | Persistent storage, full-text search |
| AI | OpenAI-compatible API (custom endpoint) | Bill parsing, note summarization, smart search |
| Auth | Google OAuth 2.0 | Calendar, Drive, Gmail access |
| PDF | pdf-parse + AI extraction | Bill text extraction |
| Deploy | Docker Compose | Self-hosted, single-command setup |

## Data Flow

```
┌─────────────────────────────────────┐
│     Tauri Desktop (React + TS)      │
│                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │  Notes   │ │ Calendar │ │ Bills ││
│  └────┬─────┘ └────┬─────┘ └──┬───┘│
│       │             │          │     │
└───────┼─────────────┼──────────┼─────┘
        │  HTTP/REST  │          │
┌───────▼─────────────▼──────────▼─────┐
│        Node.js Backend (API)         │
│                                     │
│  /api/auth    — Google OAuth flow    │
│  /api/notes   — CRUD + search + AI   │
│  /api/calendar — Google Calendar sync│
│  /api/bills   — Drive/Gmail + AI     │
│  /api/ai      — Summarize, extract   │
└───────┬─────────────┬──────────┬─────┘
        │             │          │
   ┌────▼────┐  ┌─────▼─────┐  ┌▼──────────┐
   │PostgreSQL│  │Google APIs│  │OpenAI API │
   │  (ORM)  │  │Calendar   │  │(compatible)│
   │         │  │Drive      │  └───────────┘
   │         │  │Gmail      │
   └─────────┘  └───────────┘
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
- Manual conflict resolution option when both sides changed
- `synced_at` timestamp per event for tracking

### Bill Fetching Strategy
- **On-demand only** (user triggers refresh)
- **Google Drive path**: Monitor a dedicated folder, list PDFs, download and parse
- **Gmail path**: User-defined filter rules (sender, subject, date range), fetch matching emails, extract PDF attachments
- Deduplication via `gmail_message_id` or `drive_file_id`

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
- Auto-tagging: Suggest tags based on note content

## Database Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
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
  source          String?  // "gmail" | "drive"
  gmailMessageId  String?  @unique
  driveFileId     String?  @unique
  pdfUrl          String?
  rawText         String?  @db.Text
  lineItems       Json?
  confidenceScore Float?
  isPaid          Boolean  @default(false)
  isRecurring     Boolean  @default(false)
  recurringFreq   String?  // "monthly" | "quarterly" | "yearly"
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

  // Stores: google tokens, AI config, Gmail rules, Drive folder ID, etc.
}
```

## Project Structure

```
personal_manager/
├── ARCHITECTURE.md          # This file
├── TICKETS.md               # Issue breakdown
├── docker-compose.yml       # Docker services
├── .env.example             # Environment template
│
├── frontend/                # Tauri + React app
│   ├── src-tauri/           # Tauri/Rust config
│   ├── src/                 # React components
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Notes, Calendar, Bills views
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client, utilities
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── routes/          # Express route handlers
│   │   ├── services/        # Business logic
│   │   ├── lib/             # Google API clients, AI helpers
│   │   ├── middleware/       # Auth, error handling
│   │   └── types/           # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   └── tsconfig.json
│
└── .opencode/
    ├── skills/
    │   └── fetch-issue/
    │       └── SKILL.md     # Skill: fetch GitHub issue → sub-agent
    └── agent/
        └── issue-worker.md  # Agent: implement single ticket
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Desktop framework | Tauri | ~5MB bundle, Rust security, system webview |
| Notes format | Markdown | Simple, searchable, version-control friendly |
| Bill fetching | On-demand | Avoids API quota issues, user controls timing |
| Calendar sync | On-demand two-way | Consistent with bill fetching, less complexity |
| Conflict resolution | Last-write-wins + manual | Simple default, escape hatch for edge cases |
| AI provider | OpenAI-compatible | User has custom dev instance, flexible |
| Auth | Google OAuth only | Local-only app, no user accounts needed |
| Database | PostgreSQL | Full-text search (tsvector), JSON support, reliability |
| Deployment | Docker Compose | Self-hosted, single `docker compose up` command |
