# Design

## Context

The Next.js migration is functionally complete with:
- 14 UI components (6 Radix-based, 8 Tailwind-only) with full accessibility
- 13 feature components (TaskCard, TaskForm, TaskFilters, TaskHeader, etc.)
- 5 sophisticated hooks (useTaskFilters, useTasks, useTaskMutation, useUndoStack, useKeyboardShortcuts)
- Complete REST API with Prisma ORM integration
- 2 integration test files (validation tests, API route tests)

But documentation is stale:
- MIGRATION_STATUS.md (dated Oct 4) was written before Radix integration and doesn't reflect actual feature component count
- openspec/config.yaml context still says "Vite + vanilla JS"
- clickup-ship.md workflow doesn't reference feature-with-playwright skill for E2E tests

## Goals / Non-Goals

**Goals:**
- Update MIGRATION_STATUS.md to accurately reflect 95% completion with all actual components listed
- Update openspec/config.yaml context to describe the actual Next.js + TypeScript + Prisma + Tailwind + Radix stack
- Update clickup-ship.md to reference feature-with-playwright skill in step 5
- Create COMPLETION_AUDIT.md to verify 95% state against existing specs and identify blockers to 100%

**Non-Goals:**
- Change any implementation code
- Add new features or components
- Modify spec-level requirements
- Implement the remaining work (tests, DB init) — just identify it clearly

## Decisions

**Document updates are priority order by impact:**
1. **MIGRATION_STATUS.md** — Primary source of truth; update to reflect actual codebase state
2. **openspec/config.yaml** — Project identity; must be accurate for future work
3. **COMPLETION_AUDIT.md** — New artifact to verify against existing specs and clarify blockers
4. **clickup-ship.md** — Workflow guidance; add skill reference to step 5

**Audit criteria:**
- Compare current feature components against MIGRATION_STATUS.md "Remaining" section
- Map existing code to spec requirements from farewell-message, todo-list/frontend, todo-list/task-management
- Identify specific gaps: test coverage, database initialization, polish items
- Note: This is verification only, not implementation

## Risks / Trade-offs

**[Risk]** MIGRATION_STATUS.md becomes a dual source of truth (alongside code) → **Mitigation**: Document is now accurate reflection of code at merge; future updates must keep them in sync (comment in the file)

**[Risk]** Completion audit reveals gaps not yet documented → **Mitigation**: That's the point—audit will identify them clearly for the next phase

## Open Questions

- Should COMPLETION_AUDIT.md be a permanent project doc or just archived with this change?
  - (Recommendation: permanent project doc in `./COMPLETION_AUDIT.md`, kept up to date as work progresses)
