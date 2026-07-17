# Personal Manager — Tickets

All 30 tickets organized by phase. Each ticket maps to a GitHub issue.

---

## Phase 1 — Foundation

### T1.1 — Initialize monorepo structure (#1)
Set up the project root with a monorepo layout:
- `/frontend` — Tauri 2.x + React + TypeScript app
- `/backend` - Node.js + Express + TypeScript API
- Root `package.json` with workspace config
- `.gitignore`, `README.md`, `docker-compose.yml` placeholder

**Acceptance Criteria:**
- [ ] Tauri app scaffolded with React template
- [ ] Backend project initialized with TypeScript config
- [ ] Monorepo workspace configured at root
- [ ] `.gitignore` covers node_modules, dist, .env, target/

---

### T1.2 — Set up backend: Express + TypeScript + Prisma + PostgreSQL (#2)
Scaffold the Node.js backend with:
- Express with TypeScript
- Prisma ORM connected to PostgreSQL
- Basic health check endpoint (`GET /api/health`)
- Environment variable config (dotenv)

**Acceptance Criteria:**
- [ ] Express server runs on configurable port
- [ ] Prisma schema created and `prisma db push` works
- [ ] Health check endpoint returns 200
- [ ] `.env.example` with all required vars

---

### T1.3 — Set up Docker Compose (#3)
Create `docker-compose.yml` at project root:
- `db` service: PostgreSQL 16 with persistent volume
- `backend` service: Node.js API (build from `/backend/Dockerfile`)
- Shared network, health checks
- Volume mount for dev mode (hot reload)

**Acceptance Criteria:**
- [ ] `docker compose up` starts both services
- [ ] PostgreSQL is accessible from backend container
- [ ] Data persists across container restarts (named volume)
- [ ] Dev mode with hot reload works

---

### T1.4 — Create database schema (#4)
Design and implement the full Prisma schema covering all modules:
- `notes` — id, title, content (markdown), tags, folder, created_at, updated_at
- `bills` — id, vendor, amount, currency, due_date, category, source, metadata
- `calendar_events` — id, google_event_id, title, description, start_time, end_time, location, recurrence_rule, synced_at
- `folders` — id, name, parent_id (nested)
- `tags` — id, name
- `note_tags` — join table
- `user_settings` — key/value for app config

**Acceptance Criteria:**
- [ ] Prisma schema covers all entities
- [ ] Migrations run cleanly
- [ ] `prisma db push` succeeds against local PostgreSQL
- [ ] Seed script for testing (optional)

---

### T1.5 — Set up Google OAuth 2.0 flow (#5)
Implement Google OAuth 2.0 for desktop app (Tauri):
- Register Google Cloud project with Calendar, Drive, Gmail APIs enabled
- OAuth flow using `googleapis` npm package
- Scopes: calendar, drive.readonly, gmail.readonly, userinfo.email
- Store refresh/access tokens securely in DB
- Token refresh logic

**Acceptance Criteria:**
- [ ] Google OAuth flow opens in system browser
- [ ] Callback exchanges code for tokens
- [ ] Tokens stored in `user_settings` table
- [ ] Auto-refresh of expired access tokens
- [ ] Environment variables for client ID/secret

---

### T1.6 — Create auth middleware + token storage/refresh logic (#6)
Backend middleware to:
- Check if Google tokens exist and are valid
- Auto-refresh expired tokens before API calls
- Expose helper functions: `getCalendarClient()`, `getDriveClient()`, `getGmailClient()`
- Return 401 if tokens missing/invalid

**Acceptance Criteria:**
- [ ] Middleware validates token state on protected routes
- [ ] Token refresh happens transparently
- [ ] Google API clients are reusable helpers
- [ ] Error handling for revoked/invalid tokens

---

## Phase 2 — Notes

### T2.1 — Notes CRUD API (#7)
Build REST API endpoints for notes:
- `GET /api/notes` — list all (with pagination, search, tag/folder filters)
- `GET /api/notes/:id` — single note
- `POST /api/notes` — create note
- `PUT /api/notes/:id` — update note
- `DELETE /api/notes/:id` — delete note

**Acceptance Criteria:**
- [ ] All endpoints work with Prisma + PostgreSQL
- [ ] Pagination and filtering support
- [ ] Input validation (title required, content optional)
- [ ] Proper HTTP status codes

---

### T2.2 — Notes list UI (#8)
React component for notes overview:
- Sidebar with folder tree
- Note list with title, preview, tags, date
- Search bar at top
- Click to open note in editor
- Tag filter chips

**Acceptance Criteria:**
- [ ] Folder navigation works
- [ ] Search filters notes in real-time
- [ ] Tags displayed as colored chips
- [ ] Responsive layout

---

### T2.3 — Markdown editor component (#9)
Implement a Markdown editor for notes:
- Split pane: editor on left, rendered preview on right
- Use `react-markdown` or similar for rendering
- Syntax highlighting in editor (CodeMirror or similar)
- Auto-save on edit (debounced)
- Toolbar: bold, italic, heading, link, code block

**Acceptance Criteria:**
- [ ] Live preview updates as you type
- [ ] Auto-saves to backend
- [ ] Supports standard Markdown + GFM
- [ ] Keyboard shortcuts for formatting

---

### T2.4 — Full-text search (#10)
Implement full-text search for notes:
- Add `tsvector` column to notes table
- GIN index for fast search
- Search across title + content
- Trigram similarity for fuzzy matching
- API endpoint: `GET /api/notes/search?q=term`

**Acceptance Criteria:**
- [ ] Search returns ranked results
- [ ] Fast performance with 1000+ notes
- [ ] Handles partial matches
- [ ] Search highlights matching terms

---

### T2.5 — Tagging & folder system (#11)
Implement organizational system for notes:
- CRUD API for tags and folders
- Assign/remove tags from notes
- Move notes between folders
- Nested folders (tree structure)
- Rename/delete folders (cascade or move children)

**Acceptance Criteria:**
- [ ] Tags: create, rename, delete, assign to notes
- [ ] Folders: create, rename, delete, nest, move notes
- [ ] Cascade behavior defined and implemented
- [ ] UI: folder tree in sidebar, tag picker in editor

---

### T2.6 — AI: Note summarization endpoint (#12)
Add AI-powered note summarization:
- `POST /api/notes/:id/summarize`
- Send note content to OpenAI-compatible API
- Return concise summary
- Store summary in note record
- UI button: "Summarize this note"

**Acceptance Criteria:**
- [ ] Works with configurable OpenAI-compatible endpoint
- [ ] Summary stored alongside note
- [ ] Loading state while AI processes
- [ ] Error handling for API failures

---

### T2.7 — AI: Smart search (#13)
Implement AI-powered semantic search for notes:
- `POST /api/notes/smart-search`
- Accept natural language query (e.g. "notes about project deadlines from last month")
- Use AI to interpret query and return relevant notes
- Combine with full-text search for best results
- UI: dedicated smart search mode toggle

**Acceptance Criteria:**
- [ ] Natural language queries work
- [ ] Results ranked by relevance
- [ ] Fallback to standard search if AI unavailable
- [ ] Response time under 3 seconds

---

## Phase 3 — Calendar

### T3.1 — Google Calendar API integration (#14)
Integrate Google Calendar read access:
- `GET /api/calendar/events?from=...&to=...`
- Fetch events from Google Calendar API
- Store in local PostgreSQL cache
- Return combined local + Google events

**Acceptance Criteria:**
- [ ] Fetches events for date range from Google
- [ ] Caches events locally
- [ ] Handles recurring events
- [ ] Pagination for large date ranges

---

### T3.2 — Calendar UI — month view (#15)
Build month view calendar component:
- Grid layout showing days of month
- Events displayed as colored bars
- Click day to see events
- Click event to view/edit details
- Navigation: prev/next month, today button

**Acceptance Criteria:**
- [ ] Renders correct days per month
- [ ] Events shown on correct dates
- [ ] Navigation between months
- [ ] Responsive grid layout

---

### T3.3 — Calendar UI — week/day views (#20)
Build week and day view calendar components:
- Week view: 7-column grid, hourly rows, event blocks
- Day view: single column, hourly rows, event blocks
- All-day events displayed at top
- Time indicator line (current time)

**Acceptance Criteria:**
- [ ] Week view shows 7 days with time slots
- [ ] Day view shows single day hourly breakdown
- [ ] Events rendered at correct time positions
- [ ] Switch between week/day/month views

---

### T3.4 — Create/edit/delete events (#16)
Implement event management with Google sync:
- `POST /api/calendar/events` — create event (local + Google)
- `PUT /api/calendar/events/:id` — update event (both)
- `DELETE /api/calendar/events/:id` — delete event (both)
- Event creation form (title, time, location, description, recurrence)
- Optimistic UI updates

**Acceptance Criteria:**
- [ ] Creating event in app appears in Google Calendar
- [ ] Editing event syncs changes to Google
- [ ] Deleting event removes from Google
- [ ] Optimistic updates with rollback on error

---

### T3.5 — Two-way sync logic (#17)
Implement bidirectional calendar sync:
- On-demand sync trigger (user clicks refresh)
- Fetch Google events since last sync timestamp
- Update local DB with Google changes
- Push local changes to Google
- Handle deletions on both sides
- Track `last_synced_at` per event

**Acceptance Criteria:**
- [ ] Changes made in Google Calendar appear in app
- [ ] Changes made in app appear in Google Calendar
- [ ] Deletions sync both directions
- [ ] Conflict detection (same event edited both places)

---

### T3.6 — Conflict resolution strategy (#18)
Define and implement conflict resolution for calendar sync:
- Strategy: last-write-wins by default
- Show conflict notification to user when both sides changed
- Option to manually resolve (keep local / keep Google / merge)
- Log conflicts for debugging

**Acceptance Criteria:**
- [ ] Conflicts detected when both local and Google changed since last sync
- [ ] User notified of conflicts
- [ ] Manual resolution UI
- [ ] Default behavior is last-write-wins

---

### T3.7 — Local cache + offline event viewing (#19)
Ensure calendar works offline:
- All synced events cached in PostgreSQL
- UI reads from local cache (fast)
- Show offline indicator when no internet
- Queue local changes for sync when back online
- Last sync timestamp displayed

**Acceptance Criteria:**
- [ ] Calendar loads instantly from local cache
- [ ] Offline indicator visible when disconnected
- [ ] Local edits queued and synced on reconnect
- [ ] Sync status shown (last synced X minutes ago)

---

## Phase 4 — Bills

### T4.1 — Google Drive API integration (#33)
Integrate Google Drive for bill fetching:
- `GET /api/bills/drive/files` — list PDFs in designated folder
- User configures folder ID in settings
- Fetch file metadata (name, date, size, download URL)
- Filter for PDF files only
- Cache file list locally

**Acceptance Criteria:**
- [ ] Lists PDFs from configured Google Drive folder
- [ ] Folder ID configurable in app settings
- [ ] File metadata stored locally
- [ ] On-demand fetch (user triggers refresh)

---

### T4.2 — Gmail API integration (#21)
Implement Gmail-based bill fetching:
- `GET /api/bills/gmail/search` — search emails by user-defined rules
- Rules: sender contains, subject contains, has attachment, date range
- Download PDF attachments from matching emails
- Store `gmail_message_id` on bill record
- Prevent re-processing same email

**Acceptance Criteria:**
- [ ] User can define filter rules in settings
- [ ] Emails matching rules are found
- [ ] PDF attachments downloaded and stored
- [ ] Deduplication via `gmail_message_id`
- [ ] On-demand fetch

---

### T4.3 — PDF parsing pipeline (#22)
Build PDF parsing infrastructure:
- Use `pdf-parse` npm package to extract text from PDFs
- Handle multi-page documents
- Clean and normalize extracted text
- Store raw text in `bills.raw_text` column
- Handle scanned PDFs (image-based) — flag for manual entry

**Acceptance Criteria:**
- [ ] PDF text extracted correctly
- [ ] Multi-page support
- [ ] Raw text stored in DB
- [ ] Error handling for corrupt/scanned PDFs

---

### T4.4 — AI extraction: Parse bill text → structured data (#23)
Use AI to extract structured data from bill text:
- `POST /api/bills/parse`
- Send raw bill text to OpenAI-compatible API
- Extract: vendor name, amount, currency, due date, category, line items
- Store structured data in bills table
- Confidence score for each extraction

**Acceptance Criteria:**
- [ ] Vendor, amount, date extracted correctly (>90% accuracy)
- [ ] Auto-categorization (utilities, rent, insurance, etc.)
- [ ] Line items parsed when available
- [ ] Confidence score stored
- [ ] Fallback to manual entry if extraction fails

---

### T4.5 — Bills CRUD API (#24)
Build bill management API:
- `GET /api/bills` — list bills (filter by category, date, status)
- `GET /api/bills/:id` — single bill detail
- `PUT /api/bills/:id` — edit bill (correct AI extraction errors)
- `DELETE /api/bills/:id` — delete bill
- `POST /api/bills/refresh` — trigger fetch from Drive/Gmail

**Acceptance Criteria:**
- [ ] Full CRUD operations
- [ ] Filter by category, date range, amount range
- [ ] Sort by date, amount, vendor
- [ ] Refresh endpoint triggers Drive + Gmail fetch

---

### T4.6 — Bills list UI (#27)
Build bills management interface:
- Table/list view of all bills
- Filter sidebar: category, date range, amount range, source
- Sort by any column
- Bulk actions: mark as paid, delete, re-categorize
- Quick stats bar: total this month, upcoming, overdue

**Acceptance Criteria:**
- [ ] All filters work and combine
- [ ] Sorting toggles ascending/descending
- [ ] Bulk selection with checkboxes
- [ ] Responsive table layout

---

### T4.7 — Bill detail view (#25)
Build bill detail page:
- Show all extracted fields (vendor, amount, date, category)
- Link to original PDF (Google Drive or Gmail attachment)
- Editable fields for correcting AI extraction
- Line items table
- Source indicator (Gmail/Drive)
- Mark as paid/unpaid toggle

**Acceptance Criteria:**
- [ ] All bill data displayed
- [ ] Edit mode for corrections
- [ ] PDF opens in new tab/link
- [ ] Paid status toggleable

---

### T4.8 — Dashboard: spending overview (#26)
Build bills dashboard:
- Upcoming bills (next 7/30 days) with countdown
- Monthly spending summary chart (bar/line)
- Spending by category (pie chart)
- Total paid this month vs last month
- Overdue bills alert section

**Acceptance Criteria:**
- [ ] Charts render with real data
- [ ] Date range selector for summaries
- [ ] Overdue bills highlighted in red
- [ ] Responsive dashboard layout

---

### T4.9 — Recurring bill detection (#29)
Implement recurring bill detection:
- Analyze bill history for patterns (same vendor, similar amounts)
- Use AI to identify recurring bills and frequency
- Tag recurring bills with frequency (monthly, quarterly, yearly)
- Predict next due date
- UI: recurring bills section with predictions

**Acceptance Criteria:**
- [ ] Recurring patterns detected from history
- [ ] Frequency classified correctly
- [ ] Next due date predicted
- [ ] Recurring bills shown in dedicated section

---

## Phase 5 — Polish & Deploy

### T5.1 — Error handling + loading states (#28)
Standardize UX patterns across the app:
- Global error boundary component
- Loading spinners/skeletons for all async operations
- Toast notifications for success/error actions
- Empty state illustrations for no-data views

**Acceptance Criteria:**
- [ ] No unhandled errors crash the app
- [ ] Loading states for all API calls
- [ ] Toast notifications for CRUD operations
- [ ] Empty states with helpful messages

---

### T5.2 — Offline indicator + sync status (#29)
Add connectivity and sync status:
- Detect online/offline status
- Show indicator in UI (green/red dot)
- Queue actions when offline, sync when back online
- Show last sync timestamp

**Acceptance Criteria:**
- [ ] Online/offline detection works
- [ ] Indicator visible in header/sidebar
- [ ] Offline actions queued and retried
- [ ] Sync timestamp shown

---

### T5.3 — Docker deployment hardening (#31)
Production-ready Docker setup:
- All secrets in `.env` (not hardcoded)
- Health checks for all services
- Restart policies
- Resource limits
- Backup script for PostgreSQL

**Acceptance Criteria:**
- [ ] `docker compose up -d` works in production
- [ ] Health checks pass
- [ ] Secrets not in `docker-compose.yml`
- [ ] Backup/restore documented

---

### T5.4 — Final integration testing (#32)
End-to-end testing of all features:
- Test Google OAuth flow end-to-end
- Test notes CRUD + search + AI features
- Test calendar sync both directions
- Test bill fetching from Drive and Gmail
- Test PDF parsing and AI extraction
- Test offline mode and sync recovery

**Acceptance Criteria:**
- [ ] All major user flows tested
- [ ] Critical bugs fixed
- [ ] Test results documented
- [ ] Known issues listed in README

---

### T5.5 — App icon + branding (#34)
Design and implement app branding:
- Custom app icon for Tauri (desktop)
- App name and window title
- Consistent color scheme in UI
- README with screenshots

**Acceptance Criteria:**
- [ ] Custom icon in taskbar/dock
- [ ] Consistent theming
- [ ] README updated with project description

---

## Dependency Graph

```
T1.1 → T1.2 → T1.3 → T1.4 → T1.5 → T1.6
                                    ↓
                              ┌─────┴─────┐
                              ↓           ↓
                           T2.1→T2.2→T2.3→T2.4→T2.5→T2.6→T2.7
                              ↓
                           T3.1→T3.2→T3.3
                              ↓
                           T3.4→T3.5→T3.6→T3.7
                              ↓
                           T4.1→T4.2→T4.3→T4.4→T4.5→T4.6→T4.7→T4.8→T4.9
                              ↓
                           T5.1→T5.2→T5.3→T5.4→T5.5
```
