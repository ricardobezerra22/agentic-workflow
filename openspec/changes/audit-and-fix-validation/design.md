# Design

## Context

See [proposal.md](proposal.md) for motivation. Current validation in `lib/validation.ts` doesn't distinguish between `null` (explicitly sent or from empty query params) and `undefined` (not provided). This causes crashes when `.toLowerCase()` or similar string/enum methods are called on null values.

Affected files:
- `lib/validation.ts`: `validateTask()`, `validatePatchTask()`, `validateListParams()`
- `app/api/tasks/route.ts`: POST and GET handlers
- `app/api/tasks/[id]/route.ts`: PATCH handler

## Goals / Non-Goals

**Goals:**
- Fix crashes when null values are passed for enum fields (priority, status)
- Establish consistent guard patterns for null/undefined in validation functions and route handlers
- Add test coverage for edge cases: empty query params, null in request body, missing fields
- Prevent similar bugs from recurring elsewhere in the codebase

**Non-Goals:**
- Change API validation behavior from a user perspective (valid inputs work as before)
- Validate or reject null values differently than before (nulls in body should still be treated as "not provided")
- Add new validation rules or stricter constraints

## Decisions

**1. Guard before type-unsafe operations**

In validation functions, check `null` before calling methods like `.toLowerCase()`:

```typescript
// Before (crashes on null)
if (queryObj.priority !== undefined) {
  const priorityLower = (queryObj.priority as string).toLowerCase()
}

// After (safe)
if (queryObj.priority != null) {  // checks both null and undefined
  const priorityLower = (queryObj.priority as string).toLowerCase()
}
```

Rationale: Null values flow from two sources:
- Query params: `searchParams.get('priority')` returns `null` for missing/empty params
- Request bodies: `JSON.parse()` can include `null` explicitly

Using loose equality (`!=`) is idiomatic for this pattern and covers both cases.

**Alternative considered:** Treat null and undefined differently in different contexts (query vs body). Rejected as complex and error-prone; unified null safety is simpler.

**2. No default coercion in validation**

Validation functions report errors; they don't coerce. Route handlers decide defaults (e.g., `priority || 'medium'`). This keeps concerns separated.

Rationale: Validation functions are reusable and should fail fast on bad input. Handlers know the domain defaults.

**Alternative considered:** Coerce null to undefined in validation. Rejected; loses information about what was actually sent.

**3. Audit scope: lib/validation.ts and all route handlers**

Scan for:
- `.toLowerCase()` / `.toUpperCase()` without guards
- Direct array/object property access on unguarded values
- Method calls on values that could be null

Rationale: Systematic audit prevents pockets of unguarded code elsewhere.

**4. Add test cases**

Unit tests for validation functions:
- `validateListParams({ priority: null })` → error or valid?
- `validateTask({ priority: null })` → error or valid?
- Empty query param: `?priority=` (results in `null` from `searchParams.get()`)

Integration tests for API routes:
- POST /api/tasks with `{ priority: null }` in body
- GET /api/tasks?priority= (empty param)
- GET /api/tasks?status= (empty param)

Rationale: Edge cases are where null safety bugs hide. Explicit test coverage prevents regression.

## Risks / Trade-offs

**Risk:** Loose equality (`!=`) is less explicit than dual checks (`!== undefined && !== null`).
→ **Mitigation:** Document the pattern in comments; it's a well-known JavaScript idiom for null-checking.

**Risk:** Changing how validation functions report errors (null vs valid) could surprise downstream code.
→ **Mitigation:** Audit current callers and test behavior; validation functions are new, low usage risk.

**Risk:** Tests might not catch all edge cases (e.g., unusual JSON structures).
→ **Mitigation:** Include scenarios like `{ priority: 0 }` (falsy but valid), empty strings, nested nulls.

## Migration Plan

1. **Phase 1 (this change):**
   - Fix validation functions: add null guards
   - Fix route handlers: add null guards
   - Add comprehensive test coverage

2. **Phase 2 (follow-up):**
   - Monitor for similar issues in other validation contexts
   - Consider a linting rule or TypeScript stricter settings to catch unsafe method calls

**No deployment complexity:** Fix is internal validation logic. No API changes, fully backwards compatible.

**Rollback:** None needed; fix prevents crashes on invalid input that already failed.
