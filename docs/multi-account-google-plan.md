# Multi-Account Google Support — Implementation Plan

## Problem

The app is hardcoded for a single Google account. OAuth tokens are stored in flat
key-value `UserSetting` rows with no account ID. Connecting a second account
overwrites the first. Bills and calendar events have no way to indicate which
Google account they came from.

## Solution Overview

Introduce a `GoogleAccount` model, migrate tokens from `UserSetting` into it,
add a foreign key on `Bill` and `CalendarEvent`, and scope all Google API calls
to a specific account. Add UI to manage multiple accounts, fetch bills from
individual or all accounts, and view calendars per-account or aggregated.

---

## Phase 0 — Foundation

### 0.1 Database: New `GoogleAccount` model

**Prisma schema changes:**

```prisma
model GoogleAccount {
  id           String   @id @default(cuid())
  email        String   @unique
  label        String?
  accessToken  String
  refreshToken String
  tokenExpiry  DateTime
  scopes       String[]
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  bills          Bill[]
  calendarEvents CalendarEvent[]
}
```

**Add FK to `Bill`:**
```prisma
model Bill {
  ...
  googleAccountId String?
  googleAccount   GoogleAccount? @relation(fields: [googleAccountId], references: [id])
}
```

**Add FK to `CalendarEvent`:**
```prisma
model CalendarEvent {
  ...
  googleAccountId String?
  googleAccount   GoogleAccount? @relation(fields: [googleAccountId], references: [id])
}
```

**Remove old UserSetting keys after migration:**
- `google_access_token`
- `google_refresh_token`
- `google_token_expiry`
- `gmail_filter_rules` → move to per-account filter rules (stored as JSON on `GoogleAccount`)

### 0.2 Token Encryption

Encrypt `accessToken` and `refreshToken` at rest using Node.js `crypto` with
AES-256-GCM. Add `ENCRYPTION_KEY` env var (32-byte hex).

### 0.3 Migration Script

One-time migration that:
1. Reads old tokens from `UserSetting`
2. Fetches the user email via Google `userinfo.get` using the stored token
3. Creates a `GoogleAccount` row with `isDefault: true`
4. Tags existing `Bill` and `CalendarEvent` records with the new `googleAccountId`
5. Removes old `UserSetting` token keys

---

## Phase 1 — Backend: Core Multi-Account Support

### 1.1 Multi-Account Auth Service

Refactor `google-auth.ts` to be account-aware:

| Function | Purpose |
|----------|---------|
| `getAuthUrl(state?: string)` | Generate OAuth URL; optional `state` tracks which account is being connected |
| `getTokensFromCode(code)` | Exchange auth code for tokens |
| `saveAccount(email, tokens, label?)` | Create/update `GoogleAccount` row |
| `loadAccount(accountId)` | Load decrypted tokens for specific account |
| `refreshAccountTokens(accountId)` | Refresh tokens for specific account |
| `getAccountByEmail(email)` | Look up account by email |
| `listAccounts()` | Return all connected accounts |
| `deleteAccount(accountId)` | Disconnect account, revoke tokens |
| `setDefaultAccount(accountId)` | Set `isDefault` (unset others) |

### 1.2 Account-Scoped Auth Middleware

Update `middleware/auth.ts`:
- Accept `X-Google-Account-Id` header
- Load tokens for that specific account (not global)
- Auto-refresh if expired
- If header omitted, use the default account
- Attach `req.googleAccount` (the full account record) and `req.oauth2Client`

### 1.3 Auth Routes — Account Management

New endpoints in `routes/auth.ts`:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/auth/accounts` | List all connected accounts (id, email, label, isDefault) |
| `POST` | `/api/auth/accounts` | Initiate OAuth connect for a new account (body: `{ label? }`) |
| `DELETE` | `/api/auth/accounts/:id` | Disconnect a specific account |
| `PUT` | `/api/auth/accounts/:id/default` | Set as default account |
| `PUT` | `/api/auth/accounts/:id/label` | Update account label |

The existing `/api/auth/google` and `/api/auth/callback` remain but accept an
optional `state` param to track which account label is being connected.

### 1.4 Multi-Account Gmail Bill Fetch

**`POST /api/bills/fetch-gmail`:** Accept optional `googleAccountId` in body.
If provided, use that account's Gmail. If omitted, use default account.

**`POST /api/bills/fetch-gmail-all`:** New endpoint that iterates all connected
Google accounts, runs the fetch pipeline for each in parallel (with individual
error handling), and returns combined results grouped by account.

### 1.5 Multi-Account Calendar Support

Update `routes/calendar.ts`:
- Accept `googleAccountId` on all endpoints
- When specified, use that account's Google Calendar
- When omitted, use the default account
- Each `CalendarEvent` is tagged with `googleAccountId`

---

## Phase 2 — Frontend

### 2.1 Account Management UI

New section in the sidebar or a settings page:
- List of connected accounts (email + label + status)
- "Add Google Account" button → triggers OAuth flow
- Per-account actions: edit label, set as default, disconnect
- Connection status indicator (connected / token expired)

### 2.2 Account Selector — Bills Page

Dropdown next to "Fetch from Gmail" button:
- Option per account (by label/email)
- "All Accounts" option → calls `fetch-gmail-all`
- Show which account each bill came from in the bills table

### 2.3 Account Selector — Calendar Page

Dropdown next to the Sync button:
- "All Accounts" (aggregated, color-coded)
- Per-account selection
- Events color-coded by account in the aggregated view

---

## Phase 3 — Polish & Migration

### 3.1 Migration Script

Run on app startup or via a CLI command; migrates existing single-account data
to the new `GoogleAccount` model.

### 3.2 Error Handling Per Account

- Detect when an account's token is revoked/expired and unrecoverable
- Show "Reconnect" badge on the affected account in the UI
- Gracefully skip failed accounts during "fetch all" operations
- Per-account toast notifications for sync/fetch status

---

## API Design Summary

```
GET    /api/auth/accounts                  → list accounts
POST   /api/auth/accounts                  → initiate OAuth
DELETE /api/auth/accounts/:id              → disconnect
PUT    /api/auth/accounts/:id/default       → set default
PUT    /api/auth/accounts/:id/label         → rename

POST   /api/bills/fetch-gmail              → fetch for one account
POST   /api/bills/fetch-gmail-all          → fetch for all accounts

GET    /api/calendar/events?accountId=X    → events for one account
POST   /api/calendar/events                → create (with accountId)
PUT    /api/calendar/events/:id            → update
DELETE /api/calendar/events/:id            → delete
```

---

## Migration Path

1. Deploy schema migration (add `GoogleAccount` table, nullable FKs)
2. Run data migration script (tokens → `GoogleAccount`, tag existing records)
3. Deploy backend changes (new auth service, account-scoped middleware, new routes)
4. Deploy frontend changes (account management UI, selectors)
5. Remove old `UserSetting` token keys (cleanup migration)

Backward compatible: until the migration runs, the app continues to work with
the old single-account flow. After migration, the `isDefault` flag ensures
existing API calls without an account header work transparently.
