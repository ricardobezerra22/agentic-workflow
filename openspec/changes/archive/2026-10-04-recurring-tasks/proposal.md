# Proposal

## Why

Recurring tasks are essential for habit tracking, routine work, and regular reminders. Currently, users must manually recreate tasks after completion, creating friction. Auto-generating the next occurrence reduces friction and enables "set and forget" workflows for tasks like daily standups, weekly 1-on-1s, or monthly reviews.

## What Changes

- Add `recurrencePattern` enum (NONE, DAILY, WEEKLY, MONTHLY) to Task model
- Add `recurrenceEndDate` (optional) to stop recurring after a specified date
- Add `parentTaskId` (optional) to link task instances in a recurrence series
- When a task is marked complete, automatically create the next occurrence with the calculated due date
- Add "Skip next" action to create the next occurrence without marking current complete
- Allow editing recurrence pattern for future tasks only (past unaffected)
- Add recurrence display in task list ("Repeats Daily", "Repeats Weekly on Mon")
- Add filter to show only today's recurring tasks
- Add delete action choice: "Delete this task" vs. "Delete entire series"
- Ensure cascade deletion of child tasks if series parent is deleted

## Capabilities

### New Capabilities
- `todo-list/task-recurrence`: Recurrence pattern definitions, due date calculation by pattern, and series management for recurring tasks.

### Modified Capabilities
- `todo-list/task-management`: Extends Create task endpoint to accept `recurrencePattern` and `recurrenceEndDate`; modifies Update endpoint with completion action handling (mark_done vs. mark_done_skip_next); adds recurrence series endpoints (edit pattern, view series, delete series).

## Impact

**Database**: Prisma schema extended with 3 new fields on Task model; new index on `parentTaskId`.

**API**:
- `POST /api/tasks` accepts `recurrencePattern` and `recurrenceEndDate`
- `PATCH /api/tasks/:id/complete` accepts `completeAction` to distinguish mark-complete from skip-next
- New `PATCH /api/tasks/:id/recurrence` to update pattern (future tasks only)
- New `GET /api/tasks/:id/series` to list all tasks in a series
- `GET /api/tasks` accepts `recurringOnly` filter
- `DELETE /api/tasks/:id` response indicates cascade when deleting parent

**Frontend**:
- RecurrenceSelector component (pattern + end date picker)
- RecurrenceBadge component (displays pattern in task list)
- RecurrenceModal component (edit series with preview of next 5 occurrences)
- Delete dialog extended to offer delete this vs. delete series

**Transactional Integrity**: Auto-creation on completion must be atomic (all-or-nothing).

**Testing**: Unit tests for date calculations, integration tests for parent-child relationships and cascade deletes, E2E tests for full workflows (create → complete → skip → edit series).
