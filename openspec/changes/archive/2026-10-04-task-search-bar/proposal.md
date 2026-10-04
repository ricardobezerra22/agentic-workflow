# Proposal

## Why

The task list has no text search. As the list grows, users must scroll to find a task
by name. Filtering and priority sorting exist, but neither replaces a free-text search
for users who remember part of a task title but not its priority or date.

## What Changes

A search input in `TaskHeader` lets the user type a query; `TasksClientRedesigned`
holds `searchValue` state and passes it through `useTaskFilters` as the `q` param,
which `useTasks` sends to `GET /api/tasks?q=<value>`. The API filters by Prisma
`contains` (case-insensitive) on both `title` and `description`. Clearing the input
re-fetches the full list. `Cmd/Ctrl+K` focuses the search input from anywhere.

## Capabilities

### New Capabilities
- `todo-list/task-search`: Free-text server-side search on task title and description.

### Modified Capabilities
- `todo-list/frontend`: `TaskHeader` renders the search input; `TasksClientRedesigned`
  owns `searchValue` state and routes it through `useTaskFilters`; `useTasks` appends
  `?q=<value>` to the fetch URL. Keyboard shortcut `Cmd/Ctrl+K` focuses the input.

## Impact

- **Components modified**: `TaskHeader.tsx`, `TasksClientRedesigned.tsx`
- **Hooks modified**: `useTaskFilters.ts` (added `q` field), `useTasks.ts` (appends `?q=`)
- **API modified**: `GET /api/tasks` handles `?q=` with Prisma `contains` filter.
- **DB**: No schema changes.

## Decision Log

**Server-side search over client-side filter** — the full task list is re-fetched per
keystroke, so the server always returns the filtered set. Scales beyond what fits in
memory; `take: 500` cap on the API remains safe. Ceiling: add debounce if perceived
latency increases.

**Prisma `contains` with `mode: 'insensitive'`** — one query, case-insensitive by the
DB engine, no application-level lowercasing needed.

**Controlled input in `TasksClientRedesigned`, not `TaskHeader`** — keeps search state
next to task list state, same owner as `openTaskId`. Ceiling: if search is needed on a
second page, lift to context then.
