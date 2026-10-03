# Agentic Sandbox

Vite + vanilla JS demo app for an end-to-end agentic workflow:
ClickUp task -> OpenSpec proposal -> TDD implementation -> PR -> GitHub Actions CI/CD.

## Commands
- `npm run dev` / `npm run build`
- `npm run lint` / `npm test`
- `/clickup-ship <task-id-or-url> [--review-spec]` runs the whole loop
- `/opsx:propose`, `/opsx:apply`, `/opsx:archive` are the individual OpenSpec steps

## Conventions
- Source in `src/`, tests colocated as `*.test.js`.
- Behavior changes go through an OpenSpec change in `openspec/changes/`. Archive it
  in the same PR so `openspec/specs/` stays current.
- Tests first. Do not weaken tests or lint rules to get green.
- Never push to `main`, never edit `.github/workflows/` inside a feature branch.
