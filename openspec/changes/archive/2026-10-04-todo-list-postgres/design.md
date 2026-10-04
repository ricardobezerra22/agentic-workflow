# Design

## Context

See proposal.md — Why. The existing repo is a Vite + vanilla JS sandbox. The
todo-list app lives in a new `todo-list/` subdirectory that shares no code with
the Vite app; it has its own `package.json`, source tree, and test suite.

## Goals / Non-Goals

**Goals:**
- Local-only todo app: Express backend + pg + single-file frontend, no build.
- Full test coverage of the REST API via supertest against a real test database.
- `npm run lint && npm test && npm run build` green in the repo root.

**Non-Goals:**
- Auth, multi-user, cloud deploy (see proposal.md Scope).
- Frontend E2E tests (manual verification for v1 per SDD §12).
- Pagination, soft delete, notifications.

## Decisions

### 1 — Integrate into root project (no nested package.json)

All dependencies (`express`, `pg`, `supertest`, etc.) live in the root
`package.json`. `todo-list/` is just a directory of source files; the root
`npm test` (Vitest) picks up `todo-list/tests/tasks.test.js` automatically,
and `npm run build` (Vite) is unaffected because Vite only bundles what is
imported from `index.html`.

Alternative considered: nested `package.json` inside `todo-list/`. Rejected:
adds a second package boundary that complicates `npm test` in CI and in the
root quality gate.

### 2 — `app.js` / `server.js` split for testability

`app.js` creates and exports the Express app without calling `.listen()`.
`server.js` imports it and calls `app.listen(3000, '127.0.0.1')`. Supertest
imports `app.js` directly, so no port conflicts in test runs.

### 3 — `pg` type parser for DATE

`pg` converts `DATE` columns to JS `Date` objects, which causes timezone
shifts when serialised with `.toISOString()`. Setting a custom type parser for
OID 1082 to return the raw string avoids this without any extra dependencies.

Alternative considered: `.toISOString().slice(0, 10)` at the serialisation
layer. Rejected: fragile — any code path that forgets the slice re-introduces
the bug.

### 4 — Server-side filtering via SQL WHERE clauses

Filters (`status`, `priority`, `q`) are applied in a single parameterised SQL
query with dynamically composed WHERE conditions. `q` escapes `%` and `_`
before interpolating into `ILIKE '%...%'`.

Alternative considered: fetch all, filter in JS. Rejected: defeats the 500-row
limit intent and is slower.

### 5 — Inline CSS and JS in `public/index.html`

Required by spec (no build step, no external requests). The file is served by
Express's `express.static('public')` middleware.

### 6 — `completed_at` idempotency via SQL COALESCE

`PATCH completed: true` uses `COALESCE(completed_at, now())` so that a second
`true` call preserves the original timestamp without an extra round-trip SELECT.

## Risks / Trade-offs

- **Single HTML file size**: Inline CSS + JS in one file grows unbounded. Not
  a concern at personal-use scale.  
  Mitigation: if it grows beyond ~1 000 lines, split into separate static files
  served by Express.

- **No connection pooling tuning**: default `pg.Pool` settings are used.  
  Mitigation: acceptable for a single-user local app; `pg.Pool` defaults are
  generous enough.

- **`process.env` read at module load**: if `DATABASE_URL` is unset, pool
  construction fails at import time. Clear error message covers this.
  Mitigation: `.env.example` documents required vars.

## Open Questions

_(none — all decisions needed for task breakdown have been resolved)_
