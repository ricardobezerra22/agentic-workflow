# Proposal

## Why

The sandbox has no persistent data layer. Adding a local todo-list app wires up a
real PostgreSQL backend and a single-file frontend, giving the agentic workflow a
full-stack target for future experiments.

## What Changes

- New standalone sub-application `todo-list/` (Node.js + Express + pg + vanilla JS).
- REST API at `/api/tasks` — CRUD, completion toggle, server-side filtering.
- `public/index.html` — single file with inline CSS and JS, no build step.
- `db/schema.sql` + `db/init.js` — idempotent schema initialisation.
- `tests/tasks.test.js` — Vitest + supertest suite against an isolated test database.
- New `npm` scripts: `db:init`, `dev`, `start`.

## Capabilities

### New Capabilities

- `todo-list/task-management`: CRUD operations and completion toggle for tasks stored in PostgreSQL, including server-side filtering by status, priority, and full-text search.
- `todo-list/frontend`: Single-file frontend (`public/index.html`) that renders tasks, handles inline editing, and communicates with the REST API without a build step.

### Modified Capabilities

_(none — this is an entirely new application)_

## Impact

- Adds `express`, `pg`, `dotenv`, `nodemon` as production/dev dependencies to the repo.
- Introduces `todo-list/` directory alongside the existing Vite app; the two are
  independent and do not share code.
- No changes to the existing Vite app, CI workflows, or repository settings.
