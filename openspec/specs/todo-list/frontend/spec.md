# frontend Specification

## Purpose

Single-file browser frontend (`todo-list/public/index.html`) served by the backend that
lets the user manage their tasks without a build step or external requests.

## Requirements

### Requirement: Self-contained HTML delivery
The system SHALL serve `todo-list/public/index.html` at `GET /` with all CSS and
JavaScript inline; the page MUST NOT require any external network requests
to load or operate.

#### Scenario: Root path serves HTML with inline assets
- **WHEN** `GET /` is requested
- **THEN** the response is an HTML document whose body contains at least one `<style>` block and one `<script>` block

### Requirement: Task CRUD without page reload
The system SHALL allow the user to create, inline-edit, toggle completion, and
delete tasks entirely within a single page without triggering a full navigation.

#### Scenario: Create a task
- **WHEN** the user fills the creation form and submits
- **THEN** the new task appears in the list without a page reload

#### Scenario: Edit a task inline
- **WHEN** the user edits a task's title, priority, or due date inline and saves
- **THEN** the updated values are reflected immediately without a page reload

#### Scenario: Toggle completion
- **WHEN** the user checks or unchecks a task's checkbox
- **THEN** the task's completed state updates immediately without a page reload

#### Scenario: Delete a task
- **WHEN** the user confirms deletion of a task
- **THEN** the task is removed from the list without a page reload

### Requirement: Overdue task highlighting
Open tasks whose `dueDate` is before today's local date SHALL be visually
distinguished from non-overdue tasks. Completed tasks MUST NOT be shown as
overdue regardless of their `dueDate`.

#### Scenario: Overdue open task is highlighted
- **WHEN** an open task has a `dueDate` in the past
- **THEN** the task is rendered with a visual overdue indicator

#### Scenario: Completed task is not highlighted as overdue
- **WHEN** a task is completed and has a past `dueDate`
- **THEN** no overdue indicator is shown

### Requirement: XSS-safe rendering
The system SHALL render all user-supplied content using `textContent`
assignment (or equivalent DOM-text method) and MUST NOT use `innerHTML`
to insert task data.

#### Scenario: HTML in title is not executed
- **WHEN** a task is created with a title containing `<script>alert(1)</script>`
- **THEN** the text is displayed literally and no script executes

### Requirement: Filter and search
The system SHALL provide controls to filter the task list by status, priority,
and free-text query; the filter request SHALL be sent to the server (not applied
client-side); a debounce of approximately 300 ms SHALL be applied to the text
search input before sending a request.

#### Scenario: Filter by status
- **WHEN** the user selects a status filter
- **THEN** only tasks matching that status are displayed

#### Scenario: Filter by priority
- **WHEN** the user selects a priority filter
- **THEN** only tasks matching that priority are displayed

#### Scenario: Text search
- **WHEN** the user types in the search box and stops typing
- **THEN** the task list updates to show only matching tasks after ~300 ms
