# SDD — Task Detail Drawer

**Date:** 2026-10-04  
**Branch:** feat/task-detail-drawer  
**Status:** Draft

---

## 1. Problem

The app exposes recurring tasks at the API level (`/api/tasks/:id/recurrence`) but there is no way for a user to configure them. Editing a task is also limited to renaming inline — priority, due date, and description can only be set at creation time. Any deeper edit requires a full page refresh or raw API calls.

**Root cause:** `TaskItem` is intentionally compact. Adding more controls inline would destroy the list's scanability. We need a secondary surface.

---

## 2. Proposed Feature

A **slide-in drawer** anchored to the right side of the viewport. Clicking anywhere on a `TaskItem` row (not the checkbox or the `⋯` menu) opens the drawer with that task's full details. All fields are editable in place.

---

## 3. Scope

### In
- View and edit: `title`, `description`, `priority`, `dueDate`
- View and configure: recurrence rule (frequency, interval, days, end date)
- Delete task from drawer
- Keyboard: `Escape` closes, `Tab` cycles fields, `Enter` saves on text inputs

### Out (YAGNI)
- File attachments
- Comments / activity feed
- Subtasks
- Drag-to-reorder inside the drawer
- Bulk edit via multi-select

---

## 4. UI Anatomy

```
┌─────────────────────────────── Viewport ───────────────────────────────┐
│                                                                         │
│  ┌──────── Task List ────────┐  ┌──── Task Detail Drawer (320px) ────┐ │
│  │  ☐  Buy groceries   high  │  │  ✕                                 │ │
│  │  ☑  Pay rent        low  ◀──│  # Buy groceries                   │ │
│  │  ☐  Fix the bug     med   │  │                                    │ │
│  └──────────────────────────┘  │  Description                       │ │
│                                │  ┌──────────────────────────────┐  │ │
│                                │  │ Add a description…           │  │ │
│                                │  └──────────────────────────────┘  │ │
│                                │                                    │ │
│                                │  Priority      Due Date            │ │
│                                │  [● High ▾]   [Oct 10 ▾]         │ │
│                                │                                    │ │
│                                │  Recurrence                       │ │
│                                │  [None ▾]                         │ │
│                                │                                    │ │
│                                │  ─────────────────────────────── │ │
│                                │  [Delete task]         [Save →]  │ │
│                                └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

Mobile (< `md`): drawer slides up from the bottom, full width, max-height 90vh, scrollable.

---

## 5. Component Map

```
features/tasks/components/
  TaskDetailDrawer.tsx      ← new: full drawer shell + form state
  RecurrenceSelector.tsx    ← new: recurrence frequency picker
  TaskItem.tsx              ← change: add onClick → openDrawer(task.id)
  TasksClientRedesigned.tsx ← change: hold openTaskId state, render drawer
```

No new routes. No new API endpoints — uses existing `PATCH /api/tasks/:id` and `PATCH /api/tasks/:id/recurrence`.

---

## 6. State Design

`TasksClientRedesigned` owns `openTaskId: number | null`. Passes `onOpen` down to each `TaskItem`. `TaskDetailDrawer` receives the full `Task` object (from the existing `useTasks` cache) and calls `useTaskMutation` for saves.

Optimistic update: save fires immediately; on error the drawer re-opens with the previous value and shows an inline error message.

---

## 7. Recurrence Selector

Wraps the existing recurrence model (`DAILY | WEEKLY | MONTHLY | YEARLY`, `interval`, `daysOfWeek`, `endDate`). Three states:

| UI state      | Rendered as                                     |
|---------------|-------------------------------------------------|
| None          | Single `<select>` showing "Does not repeat"     |
| Simple        | Frequency + interval row ("Every 2 weeks")      |
| Advanced      | Full panel: days of week checkboxes, end date   |

"Advanced" appears when the user picks WEEKLY (to pick days) or sets an end date. Everything else is Simple.

---

## 8. Accessibility

- Drawer implemented as a `<dialog>` (`role="dialog"`, `aria-labelledby` pointing to task title).
- Focus trapped inside while open (`focus-trap` — already installed via Radix DialogContent; reuse it).
- `Escape` closes without saving (with a discard confirmation if there are unsaved changes).
- Overlay click closes with same discard check.
- All form controls have `<label>` associations or `aria-label`.

---

## 9. Animation

Tailwind `data-[state=open]:animate-in data-[state=closed]:animate-out` with `slide-in-from-right` / `slide-out-to-right` (desktop) and `slide-in-from-bottom` / `slide-out-to-bottom` (mobile). Respects `prefers-reduced-motion` via the Tailwind `motion-safe:` variant.

---

## 10. Tests Required

| Type        | What to cover                                                     |
|-------------|-------------------------------------------------------------------|
| Unit        | `RecurrenceSelector` renders all frequency options correctly      |
| Unit        | Discard guard fires when there are unsaved changes on Escape      |
| Integration | `PATCH /api/tasks/:id` called with correct body on Save           |
| Integration | `PATCH /api/tasks/:id/recurrence` called when recurrence changes  |
| E2E         | Click task → drawer opens → edit priority → Save → list reflects change |
| E2E         | Set WEEKLY recurrence → save → reopen drawer → recurrence shown   |

---

## 11. Open Questions

1. **Save trigger:** auto-save on blur vs. explicit Save button. Auto-save is nicer UX but conflicts with the discard-on-Escape pattern. Recommendation: explicit Save button, matching the rest of the form conventions in the app.
2. **Unsaved-changes guard scope:** warn only on Escape/overlay-click, or also on navigating to a different task row? Simpler to warn only on explicit close gestures.
3. **Recurrence editing scope:** editing recurrence for a single occurrence vs. the whole series (already handled by the `PATCH /series` endpoint). Out of scope for this SDD; surfaced here as a future decision point.
