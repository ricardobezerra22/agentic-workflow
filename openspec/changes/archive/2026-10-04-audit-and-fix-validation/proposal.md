# Proposal

## Why

The Tasks API has a critical null-safety bug in query parameter validation. When an empty priority parameter is sent (`GET /api/tasks?priority=`), the validation function attempts to call `.toLowerCase()` on `null`, crashing with `TypeError: Cannot read properties of null`. This reveals a systemic issue: validation functions don't consistently distinguish between `null` and `undefined`, leaving similar bugs elsewhere in the codebase.

## What Changes

- Fix the null-safety bug in `validateListParams` and `validatePatchTask` in `lib/validation.ts`
- Audit all validation functions and API route handlers for similar null/undefined edge cases
- Add defensive guards to ensure null values are handled consistently before type-unsafe operations
- Add test coverage for edge cases: empty query parameters, null values in request bodies, and boundary conditions

The fix is internal to validation logic—no API contract changes, just correctness and robustness.

## Capabilities

### New Capabilities
(None — this is a quality fix)

### Modified Capabilities
(None — behavior changes are bug fixes, not requirement changes. This change sets `skip_specs: true`.)

## Impact

- **Files affected**: `lib/validation.ts`, `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`
- **Tests affected**: Integration and unit tests for validation functions
- **Backwards compatibility**: Fully compatible. Fix prevents crashes; valid inputs work as before.
- **No API changes**: Fix prevents internal errors before they reach the API contract.

## Decision Log

**Skip specs** — This is a bug-fix and robustness improvement, not a requirement change. Validation behavior doesn't change from an external perspective; we're fixing crashes on invalid/edge-case inputs. No new capability to spec.

**Null vs. undefined** — Query parameters return `null` from `searchParams.get()` when empty; form bodies may have `null` explicitly sent. Validation must handle both. Chosen: guard before calling methods on string/enum types.
