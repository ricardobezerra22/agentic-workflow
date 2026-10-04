# Spec Delta

## Purpose

A slide-in drawer providing a full editing surface for a single task without leaving the task list view.

## ADDED Requirements

### Requirement: Open drawer by clicking a task row
The system SHALL open the Task Detail Drawer when the user clicks anywhere on a `TaskItem` row
except the completion checkbox or the `⋯` action menu.

#### Scenario: Row click opens drawer
- **WHEN** the user clicks a task row (not the checkbox or actions menu)
- **THEN** the Task Detail Drawer opens with that task's current data

#### Scenario: Checkbox click does not open drawer
- **WHEN** the user clicks the completion checkbox
- **THEN** the drawer does NOT open; the task completion state toggles

#### Scenario: Actions menu click does not open drawer
- **WHEN** the user clicks the `⋯` actions menu trigger
- **THEN** the drawer does NOT open; the dropdown menu opens

### Requirement: Edit task fields from the drawer
The system SHALL allow editing `title`, `description`, `priority`, and `dueDate` from the drawer
and SHALL persist changes via `PATCH /api/tasks/:id` when the Save button is pressed.

#### Scenario: Save button calls PATCH with correct body
- **WHEN** the user edits fields and clicks Save
- **THEN** `PATCH /api/tasks/:id` is called with only the changed fields and the task list reflects the update

#### Scenario: Title is required
- **WHEN** the user clears the title field and clicks Save
- **THEN** an inline validation error is shown and no API call is made

#### Scenario: Optimistic update on Save
- **WHEN** the user clicks Save
- **THEN** the save fires immediately; on API error the previous value is restored and an error message is shown

### Requirement: Delete task from the drawer
The system SHALL delete a task when the user clicks "Delete task" in the drawer and confirms.

#### Scenario: Delete triggers confirmation
- **WHEN** the user clicks "Delete task"
- **THEN** a confirmation dialog is shown before `DELETE /api/tasks/:id` is called

### Requirement: Close the drawer with discard guard
The system SHALL close the drawer on Escape key or overlay click, with a discard-changes guard
when there are unsaved edits.

#### Scenario: Escape with unsaved changes shows discard guard
- **WHEN** the user has made unsaved edits and presses Escape
- **THEN** a confirmation is required before the drawer closes and changes are discarded

#### Scenario: Escape without unsaved changes closes immediately
- **WHEN** the user has NOT made unsaved edits and presses Escape
- **THEN** the drawer closes immediately

#### Scenario: Overlay click with unsaved changes shows discard guard
- **WHEN** the user has unsaved edits and clicks outside the drawer
- **THEN** a confirmation is required before the drawer closes

### Requirement: Keyboard navigation inside the drawer
The system SHALL support Tab/Shift+Tab to cycle through all form controls and Escape to close.

#### Scenario: Focus trapped inside drawer while open
- **WHEN** the drawer is open and the user presses Tab on the last focusable element
- **THEN** focus wraps to the first focusable element inside the drawer

### Requirement: Accessible drawer implementation
The system SHALL implement the drawer as a modal dialog with proper ARIA roles and focus management.

#### Scenario: Dialog role and labelling
- **WHEN** the drawer is open
- **THEN** the element has `role="dialog"` and `aria-labelledby` pointing to the task title heading

#### Scenario: All controls have labels
- **WHEN** the drawer is open
- **THEN** every form control has a visible `<label>` or `aria-label`

### Requirement: Responsive layout
The system SHALL anchor the drawer to the right side of the viewport on desktop (≥ `md`) and
slide it up from the bottom on mobile (< `md`), full width, max-height 90 vh, scrollable.

#### Scenario: Desktop layout
- **WHEN** the viewport is ≥ 768 px wide and the drawer is open
- **THEN** the drawer is a 320 px wide panel anchored to the right edge

#### Scenario: Mobile layout
- **WHEN** the viewport is < 768 px wide and the drawer is open
- **THEN** the drawer slides up from the bottom, is full width, and has a max-height of 90 vh
