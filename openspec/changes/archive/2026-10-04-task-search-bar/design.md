# Design

## Architecture

No new files. All changes are additive to existing modules.

```
TasksClientRedesigned (state owner)
  ├── searchValue: string  ─────────────────────────────────────────┐
  ├── handleSearchChange → updateFilters({ q: value })              │
  └── TaskHeader(searchValue, onSearchChange)  ◄────── renders input┘
        └── <input aria-label="Search tasks" />

useTaskFilters
  └── filters.q  ────────────► useTasks(filters)
                                  └── fetch /api/tasks?q=<value>
                                        └── Prisma where.OR title/description contains
```

## Component changes

**`TaskHeader`** — already has the `<input type="search">` with `aria-label="Search tasks"`, `value={searchValue}`, `onChange` wired to `onSearchChange`. No further changes needed.

**`TasksClientRedesigned`** — already has `searchValue` state, `handleSearchChange` calling `updateFilters({ q: value })`, and a keyboard shortcut that focuses the input via `querySelector('[aria-label="Search tasks"]')`.

## Hook changes

**`useTaskFilters`** — already includes `q: string` in `TaskFilters`; `updateFilters` and `clearFilters` handle it.

**`useTasks`** — already appends `params.append('q', filters.q)` when non-empty.

## API changes

**`GET /api/tasks`** — already reads `?q`, builds `where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }]`.

## Accessibility

- Input has `aria-label="Search tasks"` (visible label via placeholder + keyboard hint in `title`).
- `type="search"` provides native clear button on supported browsers.
- Focus indicator via `focus:ring-2 focus:ring-primary/40`.
