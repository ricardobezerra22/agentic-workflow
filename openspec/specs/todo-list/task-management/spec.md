# task-management Specification

## Purpose

REST API for managing personal tasks persisted in a local PostgreSQL database,
with server-side filtering, CRUD, and completion tracking.

## Requirements

### Requirement: Database schema initialisation
The system SHALL provide an idempotent `npm run todo:db:init` command that creates
the `tasks` table and required indexes; running it multiple times MUST NOT
produce an error or duplicate objects.

#### Scenario: First run creates table
- **WHEN** `npm run todo:db:init` is run against an empty database
- **THEN** the `tasks` table and its indexes exist

#### Scenario: Repeated run is safe
- **WHEN** `npm run todo:db:init` is run a second time
- **THEN** the command exits 0 with no error

### Requirement: Create task
The system SHALL create a task when `POST /api/tasks` is called with valid data
and SHALL return 201 with the created task object (camelCase fields).

#### Scenario: Valid creation with all fields
- **WHEN** `POST /api/tasks` is called with `title`, `description`, `priority`, and `dueDate`
- **THEN** the response is 201 and the body contains the created task with a generated `id`, `createdAt`, and `updatedAt`

#### Scenario: Creation with defaults
- **WHEN** `POST /api/tasks` is called with only `title`
- **THEN** `priority` defaults to `"medium"`, `description` is `null`, `dueDate` is `null`, `completed` is `false`

#### Scenario: Title required
- **WHEN** `POST /api/tasks` is called without `title`
- **THEN** the response is 400 with `error.code` = `"VALIDATION_ERROR"` and `details` naming the `title` field

#### Scenario: Blank title rejected
- **WHEN** `POST /api/tasks` is called with a title containing only whitespace
- **THEN** the response is 400 with `error.code` = `"VALIDATION_ERROR"`

#### Scenario: Title too long
- **WHEN** `POST /api/tasks` is called with a title longer than 200 characters
- **THEN** the response is 400 with `error.code` = `"VALIDATION_ERROR"`

#### Scenario: Invalid priority
- **WHEN** `POST /api/tasks` is called with `priority` not in `["low","medium","high"]`
- **THEN** the response is 400 with `error.code` = `"VALIDATION_ERROR"`

#### Scenario: Invalid date format
- **WHEN** `POST /api/tasks` is called with `dueDate` not matching `YYYY-MM-DD`
- **THEN** the response is 400 with `error.code` = `"VALIDATION_ERROR"`

#### Scenario: Impossible date rejected
- **WHEN** `POST /api/tasks` is called with `dueDate` = `"2026-02-30"`
- **THEN** the response is 400 with `error.code` = `"VALIDATION_ERROR"`

#### Scenario: Malformed JSON
- **WHEN** `POST /api/tasks` is called with a body that is not valid JSON
- **THEN** the response is 400 with `error.code` = `"INVALID_JSON"`

### Requirement: List tasks with filtering
The system SHALL return tasks ordered by: open before done, then `due_date`
ascending (nulls last), then `created_at` descending. Results SHALL be limited
to 500. Optional query params `status`, `priority`, and `q` filter the result.

#### Scenario: Default listing
- **WHEN** `GET /api/tasks` is called with no params
- **THEN** all tasks are returned in the defined sort order

#### Scenario: Filter by status open
- **WHEN** `GET /api/tasks?status=open` is called
- **THEN** only tasks with `completed = false` are returned

#### Scenario: Filter by status done
- **WHEN** `GET /api/tasks?status=done` is called
- **THEN** only tasks with `completed = true` are returned

#### Scenario: Filter by priority
- **WHEN** `GET /api/tasks?priority=high` is called
- **THEN** only tasks with `priority = "high"` are returned

#### Scenario: Full-text search
- **WHEN** `GET /api/tasks?q=rent` is called
- **THEN** only tasks whose `title` or `description` contains "rent" (case-insensitive) are returned

#### Scenario: Search with special characters
- **WHEN** `GET /api/tasks?q=foo%25bar` is called (q = "foo%bar")
- **THEN** `%` is treated as a literal character, not an SQL wildcard

#### Scenario: Combined filters
- **WHEN** `GET /api/tasks?status=open&priority=high&q=rent` is called
- **THEN** only open, high-priority tasks matching "rent" are returned

#### Scenario: Invalid status value
- **WHEN** `GET /api/tasks?status=unknown` is called
- **THEN** the response is 400 with `error.code` = `"VALIDATION_ERROR"`

#### Scenario: Invalid priority value
- **WHEN** `GET /api/tasks?priority=critical` is called
- **THEN** the response is 400 with `error.code` = `"VALIDATION_ERROR"`

### Requirement: Get single task
The system SHALL return a single task when `GET /api/tasks/:id` is called with
a valid, existing numeric id.

#### Scenario: Existing task
- **WHEN** `GET /api/tasks/:id` is called with a valid, existing id
- **THEN** the response is 200 with the task object

#### Scenario: Non-existent id
- **WHEN** `GET /api/tasks/:id` is called with an id that does not exist
- **THEN** the response is 404 with `error.code` = `"NOT_FOUND"`

#### Scenario: Non-numeric id
- **WHEN** `GET /api/tasks/abc` is called
- **THEN** the response is 400 with `error.code` = `"INVALID_ID"`

### Requirement: Update task partially
The system SHALL update only the fields provided in `PATCH /api/tasks/:id` and
always set `updated_at` to the current timestamp on success.

#### Scenario: Partial update
- **WHEN** `PATCH /api/tasks/:id` is called with only `title`
- **THEN** only `title` and `updatedAt` change; other fields are unchanged

#### Scenario: Mark complete sets completedAt
- **WHEN** `PATCH /api/tasks/:id` is called with `completed: true`
- **THEN** `completedAt` is set to a non-null timestamp

#### Scenario: Reopen clears completedAt
- **WHEN** `PATCH /api/tasks/:id` is called with `completed: false`
- **THEN** `completedAt` is `null`

#### Scenario: Idempotent complete
- **WHEN** `PATCH /api/tasks/:id` is called with `completed: true` on an already-completed task
- **THEN** `completedAt` retains its original value

#### Scenario: Empty body rejected
- **WHEN** `PATCH /api/tasks/:id` is called with a body containing no known fields
- **THEN** the response is 400 with `error.code` = `"VALIDATION_ERROR"`

#### Scenario: Non-existent task
- **WHEN** `PATCH /api/tasks/:id` is called for an id that does not exist
- **THEN** the response is 404 with `error.code` = `"NOT_FOUND"`

### Requirement: Delete task
The system SHALL permanently delete a task when `DELETE /api/tasks/:id` is
called with a valid existing id, returning 204 with no body.

#### Scenario: Successful delete
- **WHEN** `DELETE /api/tasks/:id` is called for an existing task
- **THEN** the response is 204 and a subsequent `GET /api/tasks/:id` returns 404

#### Scenario: Non-existent task
- **WHEN** `DELETE /api/tasks/:id` is called for an id that does not exist
- **THEN** the response is 404 with `error.code` = `"NOT_FOUND"`

### Requirement: Date fields returned without timezone shift
The system SHALL return `dueDate` as a `YYYY-MM-DD` string that matches the
stored date exactly, regardless of the server's local timezone.

#### Scenario: dueDate round-trips
- **WHEN** a task is created with `dueDate = "2026-10-05"` and then retrieved
- **THEN** the returned `dueDate` is `"2026-10-05"`

### Requirement: Health check
The system SHALL respond to `GET /api/health` with 200 when the server and
database connection are operational.

#### Scenario: Healthy state
- **WHEN** `GET /api/health` is called while the server and DB are up
- **THEN** the response is 200

### Requirement: Test isolation
The system SHALL use `TEST_DATABASE_URL` for all test runs so that the
development database is never modified by the test suite.

#### Scenario: Tests use test database
- **WHEN** `npm run test:todo` is run
- **THEN** queries target the database specified by `TEST_DATABASE_URL`, not `DATABASE_URL`
