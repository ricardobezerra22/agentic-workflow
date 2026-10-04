# Tasks

## 1. Project scaffold

- [x] 1.1 Add `express`, `pg`, `dotenv` (deps) and `supertest`, `nodemon` (devDeps) to root `package.json`; add `todo:start`, `todo:dev`, `todo:db:init` scripts; verify `npm install` exits 0
- [x] 1.2 Create `.env.example` in `todo-list/` documenting `DATABASE_URL`, `TEST_DATABASE_URL`, and `PORT`; verify the file exists
- [x] 1.3 Add `todo-list/**` to the root `eslint.config.js` with Node.js globals (`process`, `Buffer`, `__dirname`, `__filename`, `setInterval`, `clearInterval`, `setTimeout`, `clearTimeout`) so root `npm run lint` does not error on server-side code; verify `npm run lint` passes

## 2. Database layer

- [x] 2.1 Write the failing test: `todo-list/tests/tasks.test.js` — "db:init creates tasks table and indexes idempotently" (`describe('DB init')`) — verify the test fails with "cannot find module" or "table does not exist"
- [x] 2.2 Create `todo-list/db/schema.sql` with the `tasks` table and indexes from the spec; create `todo-list/db/init.js` that reads and executes `schema.sql` via `pg`; verify `npm run db:init --prefix todo-list` exits 0 on a real local database
- [x] 2.3 Create `todo-list/src/db.js` exporting a `pg.Pool` configured from `DATABASE_URL` / `TEST_DATABASE_URL`, with a custom DATE type parser (OID 1082) that returns the raw string; verify the db:init test passes

## 3. App scaffold and health endpoint

- [x] 3.1 Write the failing test: `describe('GET /api/health')` — expects 200; verify it fails
- [x] 3.2 Create `todo-list/src/app.js` (Express app, JSON body limit 100 kb, request logger, error handler) and `todo-list/src/server.js` (listens on `127.0.0.1`); add `GET /api/health` route; verify the health test passes

## 4. Validation helpers

- [x] 4.1 Write failing unit tests for `todo-list/src/validation.js` covering: blank title, title > 200 chars, invalid priority, invalid dueDate format, impossible date (`2026-02-30`), unknown status filter; verify tests fail
- [x] 4.2 Implement `todo-list/src/validation.js` with `validateTask(body)` and `validateListParams(query)` returning `{valid, errors}`; verify validation tests pass

## 5. Create task endpoint

- [x] 5.1 Write failing tests for `POST /api/tasks`: happy path, default values, no title, blank title, title too long, invalid priority, invalid dueDate, `2026-02-30`, malformed JSON; verify all fail
- [x] 5.2 Create `todo-list/src/routes/tasks.js` — `POST /api/tasks` handler using `validation.js` and `db.js`; wire into `app.js`; verify all create tests pass

## 6. List tasks endpoint

- [x] 6.1 Write failing tests for `GET /api/tasks`: default ordering (open before done, due_date asc, nulls last, created_at desc), `status=open`, `status=done`, `priority=high`, `q` text match, `q` with `%` and `_` literals, combined filters, invalid status, invalid priority; verify all fail
- [x] 6.2 Implement `GET /api/tasks` in `tasks.js` with dynamic SQL WHERE builder and parameterised ILIKE; verify all list tests pass

## 7. Get single task endpoint

- [x] 7.1 Write failing tests for `GET /api/tasks/:id`: existing task, non-existent id (404), non-numeric id (400 INVALID_ID); verify all fail
- [x] 7.2 Implement `GET /api/tasks/:id` in `tasks.js`; verify all get-by-id tests pass

## 8. Update task endpoint

- [x] 8.1 Write failing tests for `PATCH /api/tasks/:id`: partial update only changes sent fields, `completed: true` sets `completedAt`, `completed: false` clears it, idempotent `completed: true` keeps original `completedAt`, empty body returns 400, non-existent id returns 404; verify all fail
- [x] 8.2 Implement `PATCH /api/tasks/:id` in `tasks.js` using `COALESCE(completed_at, now())` for idempotent completion; verify all update tests pass

## 9. Delete task endpoint

- [x] 9.1 Write failing tests for `DELETE /api/tasks/:id`: success returns 204 and subsequent GET returns 404; non-existent id returns 404; verify all fail
- [x] 9.2 Implement `DELETE /api/tasks/:id` in `tasks.js`; verify all delete tests pass

## 10. Static serving and dueDate round-trip

- [x] 10.1 Write failing test: `GET /` returns HTML containing `<style` and `<script`; verify it fails
- [x] 10.2 Write failing test: task created with `dueDate = "2026-10-05"` — retrieved `dueDate` equals `"2026-10-05"` exactly; verify it fails
- [x] 10.3 Create `todo-list/public/index.html` as a placeholder (one `<style>` and one `<script>` block); serve via `express.static('public')` in `app.js`; verify both tests pass

## 11. Frontend (index.html)

- [x] 11.1 Build the full `todo-list/public/index.html`: creation form (title, description, priority, dueDate), task list with checkbox, inline edit (title, priority, date), delete button with `confirm()`; all user content via `textContent` only; verify AC-15 manually (XSS literal display)
- [x] 11.2 Add filter bar (status select, priority select, search input with ~300 ms debounce); add overdue highlighting (open tasks with past dueDate get a visual class); add empty-state and error-state messages; verify AC-13, AC-14 manually

## 12. Quality gate

- [x] 12.1 Run `npm run lint` from the repo root and fix any errors; verify exit 0
- [x] 12.2 Run `npm test` from the repo root; verify existing sandbox tests still pass
- [x] 12.3 Run `npm test --prefix todo-list` (requires local PostgreSQL — skipped in CI, run locally with `npm run test:todo`) (requires local PostgreSQL with `todo_test` DB); verify all todo-list tests pass with exit 0
- [x] 12.4 Run `npm run build` from the repo root; verify Vite build exits 0 and `dist/` is produced
