# Design

## Context

The task management application uses Next.js with Server Components, Prisma ORM, and PostgreSQL. Current task model supports basic CRUD, filtering, and completion tracking with `dueDate` stored as a database DATE (timezone-independent). The application uses transactional operations and cascade deletes where appropriate.

See proposal.md - Why for motivation behind recurring tasks.

## Goals / Non-Goals

**Goals:**
- Support recurring tasks (daily, weekly, monthly) with transactional safety
- Auto-create next occurrence on completion without user intervention
- Allow editing recurrence pattern for future tasks only
- Provide efficient queries without N+1 problems
- Integrate seamlessly with existing task filtering and UI

**Non-Goals:**
- Cron jobs or background scheduling - recurrence happens on completion, not at specific times
- Custom recurrence (e.g., "every 3 days" or "2nd Tuesday of month") - only four patterns
- Timezone-aware scheduling - rely on database DATE type as-is
- Bulk operations on series - single-task endpoints handle series logic
- Export/import of series metadata

## Decisions

### 1. Store recurrence in Task model (not separate RecurrenceRule table)
**Decision:** Add `recurrencePattern`, `recurrenceEndDate`, and `parentTaskId` directly to Task model.

**Rationale:** Recurrence is a property of a task instance, not a separate entity. All needed state (pattern, end date, parent reference) fits in the Task table. Keeps the data model simpler and queries efficient (no join needed for list operations).

**Alternative:** Separate RecurrenceRule table with foreign key. Would add complexity (join overhead on every list query) without benefit for this scope.

### 2. Auto-create on completion via transactional POST
**Decision:** When `PATCH /api/tasks/:id` is called with `completed: true`, the API route handler checks `recurrencePattern`; if recurring and within `recurrenceEndDate`, it calls Prisma `$transaction` to atomically update the original and create the new task.

**Rationale:** Avoids race conditions and partial failures. If creation fails, the original task stays incomplete. Keeps the logic in one place (API route) instead of splitting between route and middleware.

**Alternative:** Database trigger to auto-create. Would be database-specific (PostgreSQL-only) and harder to unit test; would also require a function that Prisma doesn't currently call, making it harder to track in tests.

### 3. Recurrence pattern calculated in TypeScript utility
**Decision:** Implement `calculateNextDueDate(currentDueDate, pattern, today)` in `lib/recurrence.ts`. Handle edge cases (month-end, leap years) in TypeScript.

**Rationale:** Easier to unit test, version-control, and reason about than SQL. Avoids database-specific date math (e.g., PostgreSQL `date_trunc`). Reusable across API routes.

**Alternative:** SQL-based calculation in queries. Harder to test and prone to timezone bugs.

### 4. Series queried via index on parentTaskId
**Decision:** Add index on `parentTaskId` to the Prisma schema. Queries for series (list children of a parent) will use `findMany({ where: { parentTaskId } })`.

**Rationale:** Prevents N+1 when fetching list of tasks with their children. Index supports efficient filtering.

**Alternative:** No index. Would result in full table scan when querying series; unacceptable at scale.

### 5. Cascade delete (soft) for orphaned children
**Decision:** When deleting a parent task with `deleteSeries=false`, set `parentTaskId=null` on all children (soft cascade).

**Rationale:** Preserves the child tasks (user may want to keep them) but breaks the series link. Allows incremental deletion.

**Alternative:** Hard cascade (delete children). Loses data; users would have to re-create.

**Alternative:** Prevent deletion if children exist. Limits user flexibility; users expect delete to always work.

### 6. Edit pattern only on current and future, not past
**Decision:** `PATCH /api/tasks/:id/recurrence` updates the task and all descendants (future tasks created from this one) but does NOT update siblings or the parent.

**Rationale:** Past occurrences already happened with their original pattern; changing them is confusing. Future tasks should inherit the new pattern to avoid surprise pattern changes mid-series.

**Rationale:** Users can intentionally break out a task by editing it in isolation (`applyToFuture=false`).

### 7. Frontend components: RecurrenceSelector, RecurrenceBadge, RecurrenceModal
**Decision:** Build three React components (Client Components) to handle UI:
- **RecurrenceSelector**: Radio group or select dropdown for pattern + optional date picker for end date
- **RecurrenceBadge**: Displays "Repeats Daily" or "Repeats Weekly on Monday" inline in task list
- **RecurrenceModal**: Shows current pattern, preview of next 5 occurrences, and edit form

**Rationale:** Matches project's use of Radix UI primitives and Client Components for interactivity. RecurrenceBadge can be rendered server-side or client-side; preview requires client-side calculation. Modal keeps edit UI separate.

**Alternative:** Inline edit in task card. Would clutter the card; modal is cleaner.

### 8. Validation: no recurrence on child tasks
**Decision:** API rejects `PATCH /api/tasks/:id` with `recurrencePattern` if the task already has a `parentTaskId`.

**Rationale:** Child tasks are part of a series; changing their recurrence would break the series contract. Root tasks can change their own pattern via `/api/tasks/:id/recurrence`.

### 9. Test isolation: use existing TEST_DATABASE_URL
**Decision:** Existing tests already use `TEST_DATABASE_URL` via Prisma client singleton. Recurrence tests will use the same setup; no changes needed.

**Rationale:** Keeps test infrastructure consistent.

## Risks / Trade-offs

**[Risk] Month-end date edge case leads to confusing behavior**
- *Mitigation:* Unit test all patterns including edge cases (Jan 31 → Feb 28, Dec 31 → Jan 31). Document in code comment what month-end safety means.

**[Risk] Large series (many occurrences) slow to query**
- *Mitigation:* Index on `parentTaskId` handles this. If series grow to 1000+ tasks, add query pagination or archive old occurrences. Not required for MVP.

**[Risk] Transactional auto-create fails silently if user is offline**
- *Mitigation:* API returns 201 or 500; frontend displays error if needed. Not applicable for offline-first use.

**[Risk] Users confused about which task is "the recurring task" vs. instance**
- *Mitigation:* RecurrenceBadge labels instances as "Repeats Daily". Modal shows the series context.

**[Risk] Deleting a parent task with many children is slow**
- *Mitigation:* Delete is typically infrequent. If needed, batch delete in the API route or add async background job later.

## Migration Plan

1. **Schema migration**: Add three columns to `tasks` table:
   - `recurrence_pattern` VARCHAR(20) DEFAULT 'NONE'
   - `recurrence_end_date` DATE
   - `parent_task_id` INT (nullable, with index)

2. **Backward compatibility**: Existing tasks get `recurrence_pattern='NONE'` (default). No data loss.

3. **API**: Deploy new API routes and updated handlers. No breaking changes to existing endpoints; new fields are optional.

4. **Frontend**: Deploy components incrementally. RecurrenceBadge appears in task list. RecurrenceSelector appears in create/edit modal. RecurrenceModal is secondary.

5. **Testing**: All new code must pass `npm test` and `npm run lint`. E2E tests cover critical paths.

6. **Rollback**: Revert schema migration and code. No state loss (old tasks unaffected).

## Open Questions

- Should completed tasks stay in the list, or be hidden by default? (Affects UI filter logic, not spec.)
- Do users need to export series metadata? (Out of scope for MVP; can add later.)
