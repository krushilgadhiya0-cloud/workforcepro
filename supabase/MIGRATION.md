# Supabase Migration Plan

Move from a single JSON blob (`app_storage`) to normalized relational tables.

## Overview

| Phase | What | Command / Action |
|-------|------|------------------|
| 1 | Create tables | Run `supabase/schema.sql` in Supabase SQL Editor |
| 2 | Read JSON | `npm run migrate:json-to-tables` |
| 3 | Split into tables | Same script (employees, tasks, attendance, payments, + all other entities) |
| 4 | Switch app to tables | Set `USE_SUPABASE_RELATIONAL=true` in Vercel, redeploy |
| 5 | Verify | `npm run migrate:verify` |
| 6 | Remove JSON blob | `CONFIRM_JSON_CLEANUP=true npm run migrate:cleanup-json` |

## Phase 1 — Create tables

1. Open Supabase Dashboard → your project → **SQL Editor**
2. Paste and run the full contents of `supabase/schema.sql`
3. Confirm tables exist: `users`, `companies`, `employees`, `tasks`, `attendance`, `payments`, etc.

## Phase 2 & 3 — Migrate data

Add to `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run:

```bash
npm run migrate:json-to-tables
```

This reads `app_storage` JSON and writes:

| JSON field | Table |
|------------|-------|
| `workers` | `employees` |
| `tasks` | `tasks` |
| worker `attendanceStatus` | `attendance` (today's record per employee) |
| `payments` | `payments` |
| `users`, `companies`, `admins`, `leaves`, `notifications`, etc. | matching tables |

## Phase 4 — Update application

Set in **Vercel** (and `.env.local` for local dev):

```env
USE_SUPABASE_RELATIONAL=true
```

Redeploy. The API (`lib/app-store.ts`) will load/save via relational tables. The React app is unchanged.

## Phase 5 — Test

```bash
npm run migrate:verify
```

Checklist:

- Login as super admin, owner, admin, worker
- Add / edit / delete an employee — confirm they stay deleted after refresh
- Create and complete a task
- Record a payment
- Apply and approve leave
- Run verify script — all counts should match

## Phase 6 — Remove old JSON storage

Only after Phase 5 passes:

```bash
CONFIRM_JSON_CLEANUP=true npm run migrate:cleanup-json
```

This deletes the `workforce:app-data` row from `app_storage`.

## Rollback

Before Phase 6:

1. Set `USE_SUPABASE_RELATIONAL=false`
2. Redeploy — app falls back to `app_storage` JSON
