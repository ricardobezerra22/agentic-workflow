# Tasks

All items below were already implemented before this change was formally proposed.
This change documents the existing behavior and archives it into the spec.

## Implementation

- [x] Add `q: string` to `TaskFilters` in `useTaskFilters.ts`
- [x] Append `?q=<value>` in `useTasks.ts` when `filters.q` is non-empty
- [x] Handle `?q=` in `GET /api/tasks` with Prisma `contains` case-insensitive filter on title and description
- [x] Render search input in `TaskHeader` with `aria-label="Search tasks"` and `type="search"`
- [x] Own `searchValue` state in `TasksClientRedesigned`; wire `handleSearchChange` to `updateFilters({ q: value })`
- [x] Add `Cmd/Ctrl+K` keyboard shortcut to focus the search input

## Tests

- [x] Integration test: `GET /api/tasks?q=<value>` returns only matching tasks (`tests/api-routes.integration.test.ts`)
- [x] E2E test: search by text filters list case-insensitively (`tests/e2e/tasks.e2e.test.ts`)
- [x] E2E test: `Cmd+K` focuses the search input (`tests/e2e/tasks.e2e.test.ts`)
