# Spec Delta

## Purpose

Defines recurring task patterns (daily, weekly, monthly), calculates due dates for next occurrences, and manages task series where completing one instance auto-creates the next.

## ADDED Requirements

### Requirement: Recurrence patterns supported
The system SHALL support four recurrence patterns: NONE (no recurrence), DAILY (every day), WEEKLY (every 7 days), and MONTHLY (same calendar day next month, with month-end safety).

#### Scenario: Pattern enum exists
- **WHEN** a task is created with `recurrencePattern` in [DAILY, WEEKLY, MONTHLY, NONE]
- **THEN** the pattern is stored and retrievable; invalid patterns are rejected with 400 VALIDATION_ERROR

#### Scenario: Daily recurrence calculates correctly
- **WHEN** a task with recurrencePattern=DAILY and dueDate=2026-10-04 is completed
- **THEN** the next task's dueDate is 2026-10-05

#### Scenario: Weekly recurrence calculates correctly
- **WHEN** a task with recurrencePattern=WEEKLY and dueDate=2026-10-04 (Saturday) is completed
- **THEN** the next task's dueDate is 2026-10-11 (Saturday, 7 days later)

#### Scenario: Monthly recurrence calculates correctly
- **WHEN** a task with recurrencePattern=MONTHLY and dueDate=2026-10-31 is completed
- **THEN** the next task's dueDate is 2026-11-30 (month-end safety: Nov has 30 days)

#### Scenario: Month-end edge case handled
- **WHEN** a task with recurrencePattern=MONTHLY and dueDate=2026-01-31 is completed
- **THEN** the next task's dueDate is 2026-02-28 (February has 28 days)

### Requirement: Recurrence end date limits series
The system SHALL stop auto-creating occurrences after `recurrenceEndDate` is reached (inclusive).

#### Scenario: End date respected
- **WHEN** a task with recurrencePattern=DAILY, recurrenceEndDate=2026-10-10, and dueDate=2026-10-09 is completed
- **THEN** the next task is created with dueDate=2026-10-10 and no further task is created

#### Scenario: No creation after end date
- **WHEN** a task with recurrencePattern=DAILY, recurrenceEndDate=2026-10-10, and dueDate=2026-10-10 is completed
- **THEN** no next task is created

#### Scenario: End date in past rejects creation
- **WHEN** a new task is created with recurrencePattern=DAILY, recurrenceEndDate in the past, and dueDate after that date
- **THEN** the response is 400 VALIDATION_ERROR

### Requirement: Task series linked via parent ID
The system SHALL store a `parentTaskId` on child tasks to establish the recurrence series relationship. Parent tasks have `parentTaskId=null`.

#### Scenario: Child tasks linked to parent
- **WHEN** a task with recurrencePattern=DAILY is completed
- **THEN** the created next task has `parentTaskId` pointing to the original task's id

#### Scenario: Parent task identified
- **WHEN** a task has parentTaskId=null and recurrencePattern in [DAILY, WEEKLY, MONTHLY]
- **THEN** it is a parent/series root

#### Scenario: Non-recurring tasks have no parent
- **WHEN** a task with recurrencePattern=NONE is queried
- **THEN** `parentTaskId` is null and no child tasks are linked

### Requirement: Auto-create next occurrence on completion
The system SHALL create the next task occurrence when a recurring task is marked complete, using the calculated due date and series parent reference.

#### Scenario: Completion triggers auto-creation
- **WHEN** a recurring task with recurrencePattern=DAILY and dueDate=2026-10-04 is updated with completed=true via completeAction="mark_done"
- **THEN** a new task is created with title matching the original, recurrencePattern=DAILY, dueDate=2026-10-05, parentTaskId=<original id>, completed=false

#### Scenario: Auto-created task inherits series properties
- **WHEN** a task with recurrencePattern=WEEKLY, recurrenceEndDate=2026-12-31 is completed
- **THEN** the next task has recurrencePattern=WEEKLY, recurrenceEndDate=2026-12-31

#### Scenario: Completion is transactional
- **WHEN** a recurring task is marked complete and auto-creation fails (e.g., database constraint violation)
- **THEN** the original task remains incomplete and no partial write occurs

#### Scenario: Reopening task does not create another
- **WHEN** a completed task is reopened via completed=false
- **THEN** the completed task is unchanged; no new task is created

### Requirement: Skip action defers completion without gap
The system SHALL support a "skip next" action (completeAction="mark_done_skip_next") that creates the next occurrence without marking the current as complete.

#### Scenario: Skip creates next without completing
- **WHEN** a task is updated with completeAction="mark_done_skip_next"
- **THEN** the current task remains completed=false, and the next occurrence is created as if completion had occurred

#### Scenario: Skip respects end date
- **WHEN** a task with recurrencePattern=DAILY, recurrenceEndDate=2026-10-04, dueDate=2026-10-04 is skipped
- **THEN** the next task is not created (end date reached)

#### Scenario: Skip on non-recurring task fails
- **WHEN** a non-recurring task (recurrencePattern=NONE) is updated with completeAction="mark_done_skip_next"
- **THEN** the response is 400 VALIDATION_ERROR

### Requirement: Edit recurrence pattern for future tasks only
The system SHALL update the recurrence pattern on the current task and all future children without affecting past siblings.

#### Scenario: Pattern change propagates forward
- **WHEN** a task in a series is updated via PATCH /api/tasks/:id/recurrence with recurrencePattern=MONTHLY, applyToFuture=true
- **THEN** the current task and all descendent tasks have recurrencePattern=MONTHLY; sibling tasks before it are unchanged

#### Scenario: Changing parent task pattern affects all children
- **WHEN** the root parent task is updated with new recurrencePattern and applyToFuture=true
- **THEN** all child tasks in the series inherit the new pattern

#### Scenario: End date change on parent propagates
- **WHEN** a parent task's recurrenceEndDate is changed and applyToFuture=true
- **THEN** all children inherit the new end date

#### Scenario: applyToFuture false updates only current
- **WHEN** a task is updated via PATCH /api/tasks/:id/recurrence with applyToFuture=false
- **THEN** only the current task's pattern changes; child tasks retain the old pattern

### Requirement: Delete series or single task
The system SHALL offer users a choice when deleting a recurring task: delete only that occurrence or the entire series.

#### Scenario: Delete single task succeeds
- **WHEN** DELETE /api/tasks/:id is called with a query param deleteSeries=false (or omitted)
- **THEN** only that task is deleted; its parent and siblings remain; if it has children, they are orphaned (parentTaskId set to null if applicable)

#### Scenario: Delete entire series succeeds
- **WHEN** DELETE /api/tasks/:id is called with query param deleteSeries=true for a parent or any child in a series
- **THEN** the entire series (parent and all descendants) is deleted

#### Scenario: Delete cascade sets parentTaskId=null
- **WHEN** the parent of a series is deleted with deleteSeries=true
- **THEN** all children's parentTaskId is set to null (soft cascade) before deletion OR all children are also deleted (hard cascade, per implementation)

#### Scenario: Non-recurring task delete unaffected
- **WHEN** a non-recurring task (recurrencePattern=NONE, parentTaskId=null) is deleted
- **THEN** it is removed; deleteSeries param has no effect

### Requirement: Recurrence info displayed in list
The system SHALL include recurrence pattern details in task list responses so the frontend can display labels like "Repeats Daily" or "Repeats Weekly on Monday".

#### Scenario: Recurrence metadata in list response
- **WHEN** GET /api/tasks is called
- **THEN** each task response includes recurrencePattern and recurrenceEndDate

#### Scenario: Parent task marked in list
- **WHEN** a parent task (recurrencePattern in [DAILY, WEEKLY, MONTHLY]) is in the response
- **THEN** it is distinguishable from non-recurring tasks and from child tasks

### Requirement: Filter to recurring tasks
The system SHALL support a query parameter to filter task list to only recurring tasks created today.

#### Scenario: Recurring-only filter
- **WHEN** GET /api/tasks?recurringOnly=true is called on 2026-10-04
- **THEN** only tasks with dueDate=2026-10-04 AND recurrencePattern in [DAILY, WEEKLY, MONTHLY] are returned

#### Scenario: Recurr only filter with other filters
- **WHEN** GET /api/tasks?recurringOnly=true&status=open is called
- **THEN** recurring tasks created today that are also open are returned

### Requirement: Recurrence not allowed on existing tasks
The system SHALL NOT allow adding recurrence to a task that already has a `parentTaskId`.

#### Scenario: Cannot recur a recurring task
- **WHEN** PATCH /api/tasks/:id is called on a child task (parentTaskId is not null) with recurrencePattern=DAILY
- **THEN** the response is 400 VALIDATION_ERROR

#### Scenario: Series root can change its own recurrence
- **WHEN** PATCH /api/tasks/:id is called on a parent task (parentTaskId=null) with a new recurrencePattern
- **THEN** the change is applied and propagates to children via the recurrence edit endpoint
