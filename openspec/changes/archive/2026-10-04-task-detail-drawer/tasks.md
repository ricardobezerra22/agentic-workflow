# Tasks

## Implementation Tasks

- [x] **unit-tests-recurrence-selector** — Write failing unit tests for `RecurrenceSelector`: renders all frequency options, disabled state shown correctly
- [x] **unit-tests-discard-guard** — Write failing unit tests for `TaskDetailDrawer` discard guard: fires when `isDirty` + Escape; skips when clean
- [x] **integration-tests-patch** — Write failing integration tests: `PATCH /api/tasks/:id` called with correct body on Save (title, description, priority, dueDate)
- [x] **scaffold-recurrence-selector** — Create `features/tasks/components/RecurrenceSelector.tsx` (disabled select, tooltip)
- [x] **implement-task-detail-drawer** — Create `features/tasks/components/TaskDetailDrawer.tsx` with form state, Save, Delete, discard guard
- [x] **update-task-item** — Add `onOpen` prop and row click handler to `TaskItem.tsx`; keyboard (Enter/Space)
- [x] **update-task-list-minimal** — Pass `onOpen` prop through `TaskListMinimal.tsx`
- [x] **update-tasks-client** — Add `openTaskId` state to `TasksClientRedesigned.tsx`; render `<TaskDetailDrawer>`
- [x] **add-slide-animations** — Add `slide-in-from-right` keyframe + class to `globals.css` with `prefers-reduced-motion` guard
- [x] **e2e-tests** — Write E2E tests: click task → drawer opens → edit priority → Save → list reflects change
- [x] **quality-gate** — `npm run lint && npm test && npm run build` all green
