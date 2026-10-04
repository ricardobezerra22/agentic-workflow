---
name: feature-with-playwright
description: Implement features as production-ready vertical slices with Playwright end-to-end tests, accessibility validation, and regression protection.
---

---

# Feature Development with Playwright

Implement features as production-ready vertical slices.

The goal is not only to make the code work, but to ensure the feature is usable, testable, accessible, and protected against regressions.

## Core Principle

Every feature should follow:

Requirement → Implementation → User Flow → Playwright Test → Validation → Refinement

Do not consider a feature complete merely because the implementation compiles or unit tests pass.

## 1. Understand Before Implementing

Before writing code:

1. Inspect the existing project structure.
2. Understand the application's architecture and conventions.
3. Identify relevant routes, pages, components, hooks, services, APIs, state management, database interactions, and existing tests.
4. Search for similar functionality before creating new abstractions.
5. Read relevant project documentation and instructions.
6. Identify the primary user journey affected by the feature.

Determine:

- What does the user want to accomplish?
- What is the expected successful flow?
- What can go wrong?
- What existing behavior must remain unchanged?

Do not immediately start coding.

## 2. Define Acceptance Criteria

Convert requirements into observable acceptance criteria.

Cover:

### Happy path

Expected successful user flow.

### Validation

Invalid inputs and expected behavior.

### Error states

API, network, permission, and unexpected failures.

### Edge cases

Important boundary conditions.

### Accessibility

Keyboard, focus, semantic, and screen-reader requirements.

### Regression risks

Existing functionality that could be affected.

## 3. Implement the Feature

Follow the existing project's architecture and conventions.

Requirements:

- Prefer existing components and utilities.
- Avoid unnecessary abstractions.
- Separate business logic from UI logic.
- Keep components composable.
- Avoid duplicated logic.
- Maintain strict TypeScript typing.
- Handle loading, success, empty, and error states.
- Do not introduce dependencies unless necessary.
- Do not modify unrelated functionality.

For UI features:

- Follow the existing design system.
- Maintain responsive behavior.
- Follow WCAG 2.1 AA.
- Ensure keyboard accessibility.
- Ensure visible focus states.
- Use semantic HTML.

## 4. Write Playwright Tests

Create Playwright tests based on real user behavior.

Prefer semantic locators:

1. `getByRole`
2. `getByLabel`
3. `getByPlaceholder`
4. `getByText`
5. `getByTestId` only when semantic selectors are not appropriate

Prefer:

```ts
await page.getByRole('button', { name: 'Create task' }).click()
```

Avoid brittle selectors based on:

- CSS implementation details
- Tailwind classes
- DOM hierarchy
- Generated class names
- Framework internals

## 5. Test the User Journey

Every feature should have at least one end-to-end happy-path test.

Example:

```ts
test('user can create a task', async ({ page }) => {
  await page.goto('/tasks')

  await page.getByRole('button', { name: 'Create task' }).click()

  await page.getByLabel('Task name').fill('Prepare release')

  await page.getByRole('button', { name: 'Create' }).click()

  await expect(page.getByText('Prepare release')).toBeVisible()
})
```

Tests should verify observable outcomes, not implementation details.

## 6. Test Important Failure Cases

Add tests for meaningful product behavior, including when relevant:

- Invalid input
- Empty states
- API failures
- Loading states
- Permissions
- Persistence
- Critical edge cases

Do not create meaningless tests simply to increase test count.

## 7. Accessibility Testing

Verify important accessibility behavior:

- Elements are accessible by role/name.
- Keyboard interaction works.
- Focus moves correctly.
- Dialogs can be closed using Escape when appropriate.
- Form fields have accessible labels.
- Error messages are exposed appropriately.
- Buttons and controls have meaningful names.
- Focus indicators are visible.

Example:

```ts
await page.getByRole('button', { name: 'Create task' }).focus()

await expect(page.getByRole('button', { name: 'Create task' })).toBeFocused()
```

## 8. Visual Validation

For user-facing UI changes, inspect the rendered result.

Check:

- Desktop
- Mobile
- Tablet when relevant
- Long content
- Empty states
- Error states
- Loading states
- Dialogs
- Dropdowns
- Overflow
- Typography
- Spacing
- Focus states

If Playwright visual regression testing exists, update snapshots only when the visual change is intentional.

Never update snapshots blindly just to make tests pass.

## 9. Test Isolation

Tests must be deterministic and independent.

Avoid:

- Depending on another test
- Shared mutable state
- Arbitrary fixed timeouts
- `waitForTimeout()`
- Assuming previous tests created data
- Depending on execution order

Prefer Playwright's auto-waiting and assertions:

```ts
await expect(page.getByText('Task created')).toBeVisible()
```

Never use:

```ts
await page.waitForTimeout(2000)
```

unless there is a documented and unavoidable reason.

## 10. API and External Dependencies

Use request mocking when appropriate.

Mock external systems when:

- They are unreliable.
- The test focuses on frontend behavior.
- Real requests would create unwanted side effects.
- The external service is unavailable in CI.

Do not mock the system under test unnecessarily.

For critical integration flows, prefer real backend integration when a reliable test environment exists.

## 11. Run Validation

After implementation:

1. Run TypeScript/type checking.
2. Run linting.
3. Run unit tests if applicable.
4. Run relevant Playwright tests.
5. Run the complete Playwright suite when appropriate.
6. Inspect failures.
7. Fix the implementation rather than weakening the test.
8. Re-run affected tests.
9. Verify there are no unexpected console errors.
10. Verify there are no unexpected network failures.

Do not mark a feature complete while relevant tests are failing.

## 12. Test Quality Rules

Playwright tests must be:

- Deterministic
- Readable
- Independent
- User-oriented
- Accessible
- Maintainable
- Fast enough for CI

Never test implementation details such as:

- React/Vue state
- Internal component variables
- Hook implementation
- CSS classes
- Component internals

Test behavior.

## 13. Feature Completion Checklist

### Implementation

- [ ] Requirement understood
- [ ] Existing architecture inspected
- [ ] Existing components reused where appropriate
- [ ] Feature implemented
- [ ] Loading state handled
- [ ] Empty state handled
- [ ] Error state handled
- [ ] Validation handled
- [ ] Responsive behavior verified
- [ ] Accessibility verified

### Tests

- [ ] Happy-path Playwright test
- [ ] Important validation cases tested
- [ ] Important error states tested
- [ ] Critical edge cases tested
- [ ] Tests use accessible/user-facing selectors
- [ ] No unnecessary `waitForTimeout`
- [ ] Tests are isolated
- [ ] Tests are deterministic

### Validation

- [ ] Type checking passes
- [ ] Lint passes
- [ ] Unit/integration tests pass
- [ ] Playwright tests pass
- [ ] No unexpected console errors
- [ ] No unexpected network errors
- [ ] UI manually inspected when relevant

## 14. Final Report

After completing the feature, report:

### Implemented

Briefly describe what was built.

### Tests

List the Playwright scenarios created.

### Validation

Report:

- Type checking
- Lint
- Unit/integration tests
- Playwright tests

### Files Changed

List the relevant files.

### Remaining Risks

Mention anything that could not be fully validated.

## Definition of Done

A feature is complete only when:

1. The feature works.
2. The user journey works end-to-end.
3. Important failure states are handled.
4. The UI is accessible.
5. Playwright covers the critical user journey.
6. Tests pass.
7. Existing functionality has not regressed.
8. The implementation follows the project's architecture and conventions.

**Never claim that a test passed unless it was actually executed.**
