# Spec Delta

## Purpose

Lets users find tasks by typing part of a title or description into a persistent
search bar above the task list, with results filtered server-side in real time.

## ADDED Requirements

### Requirement: Free-text search input
The system SHALL render a visible text input above the task list that accepts a
free-text query. The input MUST be reachable via keyboard shortcut (`Cmd+K` on
macOS, `Ctrl+K` on other platforms) from anywhere on the page.

#### Scenario: Search input is visible
- **WHEN** the task list page loads
- **THEN** a text input with placeholder "Search tasks..." is visible above the list

#### Scenario: Keyboard shortcut focuses search
- **WHEN** the user presses `Cmd+K` (macOS) or `Ctrl+K` (other)
- **THEN** the search input receives focus

### Requirement: Server-side title and description filter
The system SHALL filter the task list by sending the query string as the `q`
parameter to `GET /api/tasks`. The API MUST perform a case-insensitive substring
match on both `title` and `description`. An empty or absent `q` MUST return all
tasks subject to other active filters.

#### Scenario: Matching tasks are shown
- **WHEN** the user types a query that matches part of a task title (case-insensitive)
- **THEN** only tasks whose title or description contains the query are displayed

#### Scenario: No results shown for unmatched query
- **WHEN** the user types a query that matches no tasks
- **THEN** the task list is empty

#### Scenario: Empty query restores full list
- **WHEN** the user clears the search input
- **THEN** all tasks (subject to other active filters) are displayed again
