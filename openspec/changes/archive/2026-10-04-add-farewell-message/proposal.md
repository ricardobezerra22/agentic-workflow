# Proposal

## Why

The home page only greets the visitor. Adding a farewell message below the greeting completes the interaction and exercises the agentic SDD workflow end-to-end with a second, independent UI element.

## What Changes

- New `farewell(name)` function in `src/greeting.js` (same module, same trim-and-fallback pattern as `greeting`).
- `src/main.js` renders the farewell string below the greeting via a second DOM element.
- `index.html` adds a `<p id="farewell"></p>` element.
- Tests for all four checklist scenarios added to `src/greeting.test.js`.

## Capabilities

### New Capabilities

- `farewell-message`: System ability to produce and display a personalised farewell string using the URL `?name=` parameter, with whitespace trimming and a "stranger" fallback.

### Modified Capabilities

*(none — greeting behavior is unchanged)*

## Impact

- `src/greeting.js`: one new exported function.
- `src/greeting.test.js`: four new test cases.
- `src/main.js`: one additional DOM write.
- `index.html`: one new element.
- No new dependencies.
