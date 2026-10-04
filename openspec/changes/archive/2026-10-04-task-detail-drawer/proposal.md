# Proposal

## Why

Task editing is limited to inline title rename via double-click. Priority, due date, and
description can only be set at creation time. Users who want to change these fields must
delete and recreate the task. The `TaskItem` row is intentionally compact — adding more
inline controls would destroy list scanability. A secondary surface is needed.

## What Changes

A slide-in drawer opens when the user clicks a task row (anywhere except the checkbox or
the `⋯` menu). The drawer shows all task fields and lets the user edit title, description,
priority, and due date in place. A Save button commits changes via `PATCH /api/tasks/:id`.
Delete from the drawer calls `DELETE /api/tasks/:id`.

A `RecurrenceSelector` component is scaffolded but rendered as disabled/informational until
`feat/recurring-tasks` is merged into main (the recurrence API endpoint does not currently
exist on main).

## Capabilities

### New Capabilities
- `todo-list/task-detail-drawer`: Slide-in drawer for viewing and editing all task fields.

### Modified Capabilities
- `todo-list/frontend`: `TaskItem` gains an `onOpen` prop and a click handler that opens the drawer. `TasksClientRedesigned` gains `openTaskId` state and renders `TaskDetailDrawer`.

## Impact

- **Components added**: `TaskDetailDrawer.tsx`, `RecurrenceSelector.tsx`
- **Components modified**: `TaskItem.tsx`, `TaskListMinimal.tsx`, `TasksClientRedesigned.tsx`
- **API**: No new routes. Uses existing `PATCH /api/tasks/:id` and `DELETE /api/tasks/:id`.
- **Recurrence API** (`PATCH /api/tasks/:id/recurrence`) is not available on `main` — recurrence
  section is UI-only until `feat/recurring-tasks` is merged.

## Decision Log

**Explicit Save button over auto-save on blur** — auto-save conflicts with the Escape-to-discard
pattern; a discard guard that triggers on every blur creates surprising UX. Ceiling: if the app
adds collaborative editing later, auto-save would be the right default. Match existing form
conventions (InlineTaskCreator uses an explicit Save).

**Radix Dialog as the drawer shell** — already installed, provides focus trapping and
`aria-modal` for free. Custom `DialogContent` class overrides positioning to right-side
fixed panel. Ceiling: if a true `Sheet` primitive is added to the design system, migrate then.

**`openTaskId: number | null` owned by `TasksClientRedesigned`** — keeps drawer state
alongside task list state; both depend on the same `useTasks` cache. Ceiling: if drawers
appear on multiple pages, lift state to a context.

**Skip recurrence in this PR** — the Prisma schema has no recurrence model on main and the
API endpoint does not exist. Implementing it here would contradict "no new API routes" and
add Prisma migration scope. RecurrenceSelector is scaffolded for the follow-up merge.
