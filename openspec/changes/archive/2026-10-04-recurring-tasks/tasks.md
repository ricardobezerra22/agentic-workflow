# Tasks

## 1. Database Schema Updates

- [ ] 1.1 Update Prisma schema with `recurrencePattern` enum and new Task fields; verify schema.prisma compiles and `npx prisma validate` passes
- [ ] 1.2 Create and test Prisma migration (add `recurrence_pattern`, `recurrence_end_date`, `parent_task_id` columns with index); verify migration runs and `npm run todo:db:init` succeeds on both dev and test databases
- [ ] 1.3 Regenerate Prisma types and verify TypeScript compilation succeeds with new Task type

## 2. Recurrence Utility Library

- [ ] 2.1 Create `lib/recurrence.ts` with `calculateNextDueDate()` function and unit tests covering DAILY, WEEKLY, MONTHLY patterns and month-end edge cases; verify `npm run test:unit` passes
- [ ] 2.2 Create `calculateNextDueDate()` tests for edge cases: Jan 31 → Feb 28, Feb 28 non-leap → Mar 28, year boundary; verify all tests pass
- [ ] 2.3 Create `isRecurrenceEndDatePassed()` validation utility and unit tests; verify logic handles inclusive end date correctly
- [ ] 2.4 Create `getRecurrenceDisplayLabel()` utility (e.g., "Repeats Daily", "Repeats Weekly on Monday") and unit tests; verify labels format correctly for all patterns

## 3. API: Create Task with Recurrence

- [ ] 3.1 Update `app/api/tasks/route.ts` POST handler to accept `recurrencePattern` and `recurrenceEndDate` in request body; update validation in `lib/validation.ts` to accept enum values; write integration tests covering creation with recurrence and verify `npm run test:integration` passes
- [ ] 3.2 Test creation with invalid recurrence pattern rejected (400 VALIDATION_ERROR); verify integration test passes
- [ ] 3.3 Test creation with end date in the past rejected; verify integration test passes
- [ ] 3.4 Test creation defaults to `recurrencePattern=NONE` when not provided; verify integration test passes

## 4. API: List Tasks with Recurrence Metadata

- [ ] 4.1 Update `app/api/tasks/route.ts` GET handler to include `recurrencePattern` and `recurrenceEndDate` in response; update response type; write integration tests verifying metadata is returned; verify tests pass
- [ ] 4.2 Add `recurringOnly` query parameter filter to GET /api/tasks; test that only tasks with recurrencePattern in [DAILY, WEEKLY, MONTHLY] AND dueDate=today are returned; verify integration tests pass
- [ ] 4.3 Test combined filters: `recurringOnly=true&status=open` returns only recurring, open tasks due today; verify integration test passes

## 5. API: Mark Complete with Auto-Create

- [ ] 5.1 Update `app/api/tasks/[id]/route.ts` PATCH handler to accept `completeAction` field (mark_done | mark_done_skip_next); write integration tests for each action on non-recurring tasks (should behave normally); verify tests pass
- [ ] 5.2 Implement auto-create logic: when non-recurring task is marked complete via mark_done or skip action on recurring task, call Prisma `$transaction` to: (a) update original task, (b) create next occurrence with calculated due date, (c) handle end-date boundary; write integration tests covering transactional behavior; verify tests pass
- [ ] 5.3 Test auto-create transactional safety: if second INSERT fails, original task stays incomplete; verify integration test confirms all-or-nothing behavior
- [ ] 5.4 Test mark_done_skip_next on non-recurring task rejected with 400 VALIDATION_ERROR; verify integration test passes
- [ ] 5.5 Test mark_done_skip_next respects recurrenceEndDate boundary; verify integration test passes

## 6. API: Delete with Series Option

- [ ] 6.1 Update `app/api/tasks/[id]/route.ts` DELETE handler to accept `deleteSeries` query parameter; implement logic to delete single task (set children's parentTaskId=null) or entire series; write integration tests for both paths; verify tests pass
- [ ] 6.2 Test deletion of parent task with deleteSeries=true cascades to all children; verify integration test confirms all tasks deleted
- [ ] 6.3 Test deletion of child task with deleteSeries=true deletes parent and siblings; verify integration test passes
- [ ] 6.4 Test deletion of non-recurring task ignores deleteSeries param; verify integration test passes

## 7. API: Edit Recurrence Series

- [ ] 7.1 Create new endpoint `PATCH /api/tasks/:id/recurrence` to update pattern and end date; accept `recurrencePattern`, `recurrenceEndDate`, `applyToFuture` (boolean); write integration tests; verify tests pass
- [ ] 7.2 Implement applyToFuture=true logic: update current task and all descendants; applyToFuture=false updates only current task; write integration tests for both paths; verify tests pass
- [ ] 7.3 Test editing pattern on non-recurring task (recurrencePattern=NONE) rejected with 400 VALIDATION_ERROR; verify integration test passes

## 8. API: List Series

- [ ] 8.1 Create new endpoint `GET /api/tasks/:id/series` to return all tasks in a series (parent + descendants) ordered by dueDate; write integration tests; verify tests pass
- [ ] 8.2 Test series endpoint on non-recurring task returns single task; verify integration test passes
- [ ] 8.3 Test series endpoint on 404 for non-existent id; verify integration test passes

## 9. Frontend: Recurrence Components

- [ ] 9.1 Create `components/ui/recurrence-selector.tsx` component (radio/dropdown for pattern + optional end-date picker using Radix UI Popover); write unit tests for component rendering; verify `npm run test:unit` passes
- [ ] 9.2 Create `components/ui/recurrence-badge.tsx` component (displays "Repeats Daily" inline); write unit tests; verify tests pass
- [ ] 9.3 Create `components/ui/recurrence-modal.tsx` component (edit pattern form + preview of next 5 occurrences); write unit tests; verify tests pass

## 10. Frontend: Task Creation with Recurrence

- [ ] 10.1 Update task creation form (InlineTaskCreator or modal) to include RecurrenceSelector; write integration tests verifying form accepts recurrence input; verify tests pass
- [ ] 10.2 Test POST /api/tasks includes recurrencePattern and recurrenceEndDate when user selects pattern; verify integration test passes

## 11. Frontend: Task Display with Recurrence Badge

- [ ] 11.1 Update TaskItem component to render RecurrenceBadge when task has recurrencePattern !== NONE; write E2E test creating recurring task and verifying badge appears; verify test passes
- [ ] 11.2 Update task list to render badges for all recurring tasks; verify visual check in browser (start `npm run dev` and manually verify)

## 12. Frontend: Task Completion with Actions

- [ ] 12.1 Update TaskItem or task detail modal to offer "Mark Done" and "Skip Next" actions for recurring tasks; only non-recurring tasks show "Mark Done"; write integration tests; verify tests pass
- [ ] 12.2 Update API call to include `completeAction=mark_done` or `completeAction=mark_done_skip_next`; write integration test verifying next occurrence created; verify test passes

## 13. Frontend: Delete Series Option

- [ ] 13.1 Update delete confirmation dialog to offer "Delete this task" vs. "Delete entire series" choice for recurring tasks; non-recurring tasks show only "Delete"; write integration tests; verify tests pass
- [ ] 13.2 Update API DELETE call to include `deleteSeries` parameter; write integration test confirming series deletion; verify test passes

## 14. Frontend: Recurrence Filter

- [ ] 14.1 Update FilterPopover component to add "Today's Recurring" filter; write integration tests; verify tests pass
- [ ] 14.2 Test filter=today+recurring returns only recurring tasks due today; verify integration test passes

## 15. Frontend: Edit Series Modal

- [ ] 15.1 Add "Edit Series" button in task detail view (for recurring tasks); open RecurrenceModal on click; write integration tests; verify tests pass
- [ ] 15.2 Implement form to update pattern and end date with applyToFuture toggle; write integration tests verifying PATCH /api/tasks/:id/recurrence is called; verify tests pass

## 16. Integration & E2E Tests

- [ ] 16.1 Write E2E test: Create daily task → Mark complete → Verify next occurrence created with correct date; use Playwright; verify `npm run test:e2e` passes
- [ ] 16.2 Write E2E test: Create weekly task → Skip next → Verify day-after created, current not marked done; verify test passes
- [ ] 16.3 Write E2E test: Create monthly task on 31st → Complete → Verify created on 30th next month; verify test passes
- [ ] 16.4 Write E2E test: Edit series pattern from DAILY to WEEKLY → Verify next 3 instances are weekly; verify test passes
- [ ] 16.5 Write E2E test: Delete entire series → Verify all tasks deleted; verify test passes
- [ ] 16.6 Write E2E test: Create recurring task with 5-day end date → Complete for 5 days → Verify no creation on 6th day; verify test passes

## 17. Quality & Validation

- [ ] 17.1 Run `npm run lint` and fix all issues; verify exit code 0
- [ ] 17.2 Run `npm test` (unit + integration) and verify coverage >= 80% on recurrence module; verify all tests pass
- [ ] 17.3 Run `npm run test:e2e` and verify all E2E tests pass
- [ ] 17.4 Run `npm run build` and verify TypeScript compilation succeeds with no errors
- [ ] 17.5 Verify `openspec validate recurring-tasks --strict` passes with no errors
