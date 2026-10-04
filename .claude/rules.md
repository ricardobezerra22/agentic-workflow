# Agentic Workflow Rules

## Mandatory Test Coverage

Every feature branch must ship all three test types before merging:

| Type | Pattern | Runner |
|------|---------|--------|
| Unit | `src/**/*.test.js` | `npm run test:unit` |
| Integration | `src/**/*.integration.test.js` | `npm run test:integration` |
| E2E | `tests/**/*.e2e.test.js` | `npm run test:e2e` |

Rules:
- At least one integration test per new API route or DB query.
- At least one E2E test per new user-facing flow.
- All three must pass before a commit that introduces new behavior.
- `npm test` runs all three — keep it green.

## PR Merge Gate

A PR may only be merged when:
1. All CI checks pass.
2. The CI code review grade is **A**.

Grade < A → address the issues in the CI review comment, then re-run CI.

## CHANGELOG

Every commit is auto-appended to `CHANGELOG.md` under `## [Unreleased]` via PostToolUse hook.
When cutting a release, promote `[Unreleased]` to a versioned section manually.
