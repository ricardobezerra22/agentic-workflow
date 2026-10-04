# Design

## Architecture

No new routes or API endpoints. The drawer uses the existing `PATCH /api/tasks/:id` and `DELETE /api/tasks/:id`.

### State ownership

`TasksClientRedesigned` adds `openTaskId: number | null`. It passes `onOpen` to each `TaskItem` via `TaskListMinimal`. `TaskDetailDrawer` receives the full `Task` object looked up from the `useTasks` cache by `openTaskId`.

```
TasksClientRedesigned
  openTaskId state
  ├── TaskListMinimal → TaskItem (onOpen prop)
  └── TaskDetailDrawer (task from cache, onClose, onSave, onDelete)
```

### Component map

```
features/tasks/components/
  TaskDetailDrawer.tsx      ← new
  RecurrenceSelector.tsx    ← new (scaffolded, disabled until feat/recurring-tasks merges)
  TaskItem.tsx              ← add onOpen prop + click handler on the row container
  TaskListMinimal.tsx       ← pass onOpen down from props
  TasksClientRedesigned.tsx ← add openTaskId state, render <TaskDetailDrawer>
```

## Implementation Details

### TaskDetailDrawer

Built on `@radix-ui/react-dialog` (already in `components/ui/dialog.tsx`). `DialogContent` is overridden with custom positioning classes to achieve the right-side panel layout on desktop and bottom sheet on mobile.

```tsx
// desktop: fixed right panel
className="fixed inset-y-0 right-0 z-50 w-80 ... md:slide-in-from-right"
// mobile: bottom sheet
className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] ... slide-in-from-bottom md:hidden"
```

Uses `Dialog.Root` `open`/`onOpenChange` for Radix-managed focus trap and Escape key. Discard guard: intercept `onOpenChange(false)` and show a native `window.confirm` (sufficient for now, upgrade to a custom dialog if needed).

Local form state (`useState` per field) mirrors the incoming `task` prop. `isDirty` is `true` when any field differs from the prop.

Save flow:
1. Validate title non-empty client-side.
2. Build diff (only changed fields).
3. `updateTask(task.id, diff)` from `useTaskMutation` (optimistic: assume success, roll back on error).
4. Call `refetch()` from `useTasks` to sync list.
5. Close drawer on success.

### TaskItem changes

Add `onOpen?: () => void` prop. The outer `div` gets `onClick` that calls `onOpen` if the click target is not the checkbox or the dropdown trigger. Use `e.target` closest check:

```tsx
const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const target = e.target as HTMLElement
  if (target.closest('input[type="checkbox"]') || target.closest('[data-radix-collection-item]') || target.closest('[role="menu"]')) return
  onOpen?.()
}
```

Also add `role="button"` and `tabIndex={0}` on the outer div and `onKeyDown` (Enter/Space → `onOpen?.()`) for keyboard access.

### RecurrenceSelector (scaffolded)

Renders a disabled `<select>` with a tooltip: "Recurrence configuration available after recurring-tasks feature merges." No API calls made. The `Task` type has no recurrence fields on main.

### Animations

Add `slide-in-from-right` keyframe and class to `globals.css`:

```css
@keyframes slide-in-from-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
.slide-in-from-right { animation: slide-in-from-right 0.2s ease-out; }
```

`prefers-reduced-motion`: wrap the animation class with `@media (prefers-reduced-motion: no-preference)`.

## Testing Strategy

| Type        | File                                              | What                                                       |
|-------------|---------------------------------------------------|------------------------------------------------------------|
| Unit        | `tests/RecurrenceSelector.unit.test.tsx`          | Renders frequency options; disabled state                  |
| Unit        | `tests/TaskDetailDrawer.unit.test.tsx`            | Discard guard fires when `isDirty` + Escape                |
| Integration | `tests/tasks-db.integration.test.ts`              | `PATCH /api/tasks/:id` called with correct body on Save    |
| E2E         | `tests/e2e/task-detail-drawer.e2e.test.ts`        | Open drawer → edit priority → Save → list reflects change  |
