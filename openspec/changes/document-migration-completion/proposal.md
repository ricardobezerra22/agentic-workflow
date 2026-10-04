# Proposal: Document Migration Completion & Update Workflows

## Why

The Next.js migration from the original Vite + vanilla JS setup is functionally 95% complete with sophisticated feature components, Radix UI integration, and full Tailwind styling—but this completion state is not documented. The `MIGRATION_STATUS.md` is stale (dated 2026-10-04, written before Radix integration), the OpenSpec project context still claims "Vite + vanilla JS," and the clickup-ship workflow documentation doesn't reference the `feature-with-playwright` skill for E2E test development. Before the team proceeds with finalizing tests and polish, we need accurate documentation of what's done, what's remaining, and updated workflow guidance.

## What Changes

- **Update MIGRATION_STATUS.md** — Document actual 95% completion state: list all feature components that exist (13 components across 5 hooks), clarify Radix UI integration, update remaining work to reflect reality (tests, DB init, E2E coverage)
- **Update openspec/config.yaml context** — Change from "Tiny Vite + vanilla JS app" to "Next.js 16 + TypeScript + Prisma + Tailwind v4 + Radix UI app with production-grade testing infrastructure"
- **Update clickup-ship.md workflow** — Add reference to `feature-with-playwright` skill in step 5 to guide E2E test development
- **Create completion audit document** — `COMPLETION_AUDIT.md` to verify 95% state against spec requirements and identify the specific blockers for 100%

## Capabilities

### New Capabilities
None. This is pure documentation and workflow update; no new spec-level behavior is introduced.

### Modified Capabilities
None. The underlying system behavior (frontend, task management API) remains unchanged.

## Impact

- **Documentation** — Project documentation (MIGRATION_STATUS.md, openspec/config.yaml, clickup-ship.md) will be updated to reflect current state
- **Workflow** — clickup-ship workflow will reference the feature-with-playwright skill for E2E test tasks
- **No code changes** — This change does not modify implementation, only documentation and workflow references
- **Next phase clarity** — Provides clear baseline for the next phase: finalizing test coverage and database initialization

## Decision Log

**Documentation-only change** — This change includes `skip_specs: true` because it makes no spec-level behavior changes. The existing specs (farewell-message, todo-list/frontend, todo-list/task-management) remain unchanged; this is purely documentation and workflow guidance.

**Audit document scope** — COMPLETION_AUDIT.md will reference the existing specs to verify coverage and identify any gaps, but will not introduce new requirements.
