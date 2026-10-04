# Agentic Sandbox

Vite + vanilla JS demo app for an end-to-end agentic workflow:
ClickUp task -> OpenSpec proposal -> TDD implementation -> PR -> GitHub Actions CI/CD.

Also contains a Todo List app (Express + PostgreSQL + vanilla JS frontend) served at `http://localhost:3000`.

## Commands

### Frontend / Vite
- `npm run dev` / `npm run build`

### Todo List app
- `npm run todo:start` — start the Express server
- `npm run todo:dev` — start with nodemon (auto-reload)
- `npm run todo:db:init` — apply `db/schema.sql` to the database (idempotent)

### Docker (Postgres + app together)
- `docker compose up -d db` — start only Postgres
- `docker compose up` — start Postgres + app

### Quality
- `npm run lint` / `npm test`

### OpenSpec workflow
- `/clickup-ship <task-id-or-url> [--review-spec]` runs the whole loop
- `/opsx:propose`, `/opsx:apply`, `/opsx:archive` are the individual OpenSpec steps

## Environment

Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — dev Postgres connection string
- `TEST_DATABASE_URL` — test Postgres connection string (needs a separate DB)
- `PORT` — defaults to 3000

## Conventions
- Source in `src/`, tests colocated as `*.test.js`.
- Always run `npm test` (and `npm run lint`) before committing. No commits with failing tests.
- Behavior changes go through an OpenSpec change in `openspec/changes/`. Archive it
  in the same PR so `openspec/specs/` stays current.
- Tests first. Do not weaken tests or lint rules to get green.
- Never push to `main`, never edit `.github/workflows/` inside a feature branch.
