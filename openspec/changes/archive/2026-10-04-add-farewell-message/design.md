# Design

## Context

`src/greeting.js` already exports `greeting(name)` with the exact trim-and-fallback pattern needed. `src/main.js` reads `?name=` and writes to `#app`. `index.html` has a single `<main id="app">`.

## Goals / Non-Goals

**Goals:**
- Add `farewell(name)` to the existing module — same file, same pattern, no new dependency.
- Render the farewell in a second DOM element below the greeting.

**Non-Goals:**
- Styling, i18n, or animations.
- Extracting shared logic into a helper (three lines don't warrant it).

## Decisions

**Extend `greeting.js`, not a new file.** Both functions share the same domain (personalized strings from a name) and the same implementation shape. One file is simpler.

**New `<p id="farewell">` in `index.html`, targeted by `main.js`.** Mirrors how the greeting element works — no framework needed.

## Risks / Trade-offs

None material. The change is additive and isolated to three small files.
