# Spec Delta

## Purpose

Produces and displays a personalised farewell string below the greeting, using the same `?name=` query parameter with whitespace trimming and a "stranger" fallback.

## ADDED Requirements

### Requirement: Farewell string production
The system SHALL export a `farewell(name)` function that returns a farewell string for the given name.

#### Scenario: Named farewell
- **WHEN** `farewell` is called with a non-empty string (e.g. `"Ana"`)
- **THEN** it returns `"Goodbye, Ana!"`

#### Scenario: Whitespace trimming
- **WHEN** `farewell` is called with a name containing leading or trailing spaces (e.g. `"  Ana  "`)
- **THEN** it returns `"Goodbye, Ana!"` (trimmed)

#### Scenario: Empty name fallback
- **WHEN** `farewell` is called with an empty string `""`
- **THEN** it returns `"Goodbye, stranger!"`

#### Scenario: Undefined name fallback
- **WHEN** `farewell` is called with `undefined`
- **THEN** it returns `"Goodbye, stranger!"`

### Requirement: Farewell display on page
The system SHALL render the farewell string below the greeting on the home page, using the same `?name=` query parameter.

#### Scenario: Named farewell on page
- **WHEN** the page loads with `?name=Ana`
- **THEN** the farewell element displays `"Goodbye, Ana!"`

#### Scenario: Fallback farewell on page
- **WHEN** the page loads without a `?name=` parameter or with a blank value
- **THEN** the farewell element displays `"Goodbye, stranger!"`
