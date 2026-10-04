# Tasks

## 1. Fix Validation Functions (TDD)

- [x] 1.1 Write failing unit tests for `validateListParams` edge cases (null priority, empty query params, null status) and verify tests fail with current implementation
- [x] 1.2 Fix `validateListParams` in `lib/validation.ts` to guard with `!= null` before calling `.toLowerCase()` and verify tests pass
- [x] 1.3 Write failing unit tests for `validateTask` edge cases (null priority in body) and verify tests fail
- [x] 1.4 Fix `validateTask` in `lib/validation.ts` to guard null before `.toLowerCase()` and verify tests pass
- [x] 1.5 Write failing unit tests for `validatePatchTask` edge cases (null priority, null status in update body) and verify tests pass
- [x] 1.6 Verify all new validation unit tests pass and existing validation tests still pass: `npm run test:unit`

## 2. Audit and Fix Route Handlers (TDD)

- [x] 2.1 Write failing integration tests for `GET /api/tasks` with edge cases (empty priority query, empty status query, null priority in request) and verify tests fail
- [x] 2.2 Fix `GET /api/tasks` in `app/api/tasks/route.ts` to add null guard before `.toLowerCase()` on priority parameter and verify integration tests pass
- [x] 2.3 Write failing integration tests for `POST /api/tasks` with edge cases (null priority in body, missing priority field) and verify tests fail
- [x] 2.4 Fix `POST /api/tasks` in `app/api/tasks/route.ts` to ensure priority handling is null-safe and verify integration tests pass
- [x] 2.5 Write failing integration tests for `PATCH /api/tasks/[id]` with edge cases (null priority in body, empty update) and verify tests fail
- [x] 2.6 Fix `PATCH /api/tasks/[id]/route.ts` to add null guard before `.toLowerCase()` on priority parameter and verify integration tests pass
- [x] 2.7 Run all integration tests: `npm run test:integration` and verify all pass

## 3. Audit for Similar Patterns

- [x] 3.1 Grep codebase for unsafe method calls on potentially null values (`.toLowerCase()`, `.toUpperCase()`, array/object access) outside of lib/validation.ts and route handlers and document findings
- [x] 3.2 Review findings and add guards or fix any similar issues found; add tests for those too

## 4. Final Integration and Verification

- [x] 4.1 Run full test suite: `npm run lint && npm test && npm run build` and verify all pass
- [x] 4.2 Manual smoke test: Start dev server (`npm run dev`), make API requests with edge cases (empty params, null body values) and verify no crashes, proper error responses
- [x] 4.3 Verify all tests combined have adequate coverage for validation logic and edge cases: `npm test -- --coverage` and review report
