# Agentic Sandbox

Production-grade Next.js todo-list app wired for a fully automated agentic development
workflow. A single command takes a ClickUp task from spec to production — with TDD,
OpenSpec contracts, multi-layer quality gates, CI/CD, and a post-deploy blog agent.

```
/clickup-ship <task-id>
       │
       ▼
ClickUp task read → branch → OpenSpec propose → TDD → quality gate
       → OpenSpec archive → commit (hooks) → PR → CI + preview deploy
       → merge gate → production deploy → blog post agent
```

---

## Stack

| Layer         | Technology                                                       |
| ------------- | ---------------------------------------------------------------- |
| Frontend      | Next.js 14+ (App Router), React, Server Components               |
| Styling       | Tailwind CSS v4, Radix UI primitives, `class-variance-authority` |
| Backend       | Next.js Route Handlers, TypeScript strict                        |
| Database      | PostgreSQL 17 + Prisma ORM                                       |
| Testing       | Vitest (unit + integration), Playwright (E2E)                    |
| Deploy        | Vercel (preview per PR, production on merge to main)             |
| Spec          | OpenSpec (`openspec/`) — behavioral contracts, change tracking   |
| CI            | GitHub Actions — lint, test, build, AI code review, deploy       |
| Task tracking | ClickUp via MCP                                                  |

---

## One-time Setup

### 1. Repository

```bash
git clone <this-repo>
cp .env.example .env       # fill in DATABASE_URL and TEST_DATABASE_URL
npm install
npm run todo:db:init       # push Prisma schema to the dev database
npm run dev                # http://localhost:3000
```

### 2. GitHub + Vercel

1. Push to GitHub and verify `gh auth status` is green.
2. In Vercel, create a project linked to the repo and note the org/project IDs.
3. Add repository secrets:

| Secret               | Description                                  |
| -------------------- | -------------------------------------------- |
| `VERCEL_TOKEN`       | Vercel personal access token                 |
| `VERCEL_ORG_ID`      | Vercel team/org ID                           |
| `VERCEL_PROJECT_ID`  | Vercel project ID                            |
| `DATABASE_URL`       | Production Postgres connection string        |
| `OPENROUTER_API_KEY` | OpenRouter key (AI review + blog post agent) |
| `BLOG_POST_API_KEY`  | API key for the post-deploy blog endpoint    |

4. Add a repository variable `BLOG_POST_API_URL` (the blog post endpoint URL).
5. Create a GitHub environment named `production` (add required reviewers for a manual gate).
6. Protect `main`: require the `verify` CI check and a PR before merging.

### 3. Claude Code

1. Install [Claude Code](https://claude.ai/code).
2. Connect the **ClickUp MCP server** in Claude Code settings.
3. Open this directory in Claude Code — the hooks and skills are auto-loaded.

---

## The Agentic Workflow

### Invoke

```
/clickup-ship 86abc123
```

Pass `--review-spec` to stop after the OpenSpec proposal so you can approve the spec
before any code is written.

### What the agent does — step by step

**1. Read the ClickUp task**
Fetches title, description, and checklists via MCP (`clickup_get_task`). Sets the task
status to "In Progress". Derives a kebab-case change name from the task title.

**2. Create a branch**

```bash
git switch -c feat/<task-id>-<change-name>
```

Aborts if the working tree is dirty.

**3. OpenSpec — Propose**
Creates four planning artifacts in `openspec/changes/<change-name>/`:

| Artifact                     | Purpose                                                           |
| ---------------------------- | ----------------------------------------------------------------- |
| `proposal.md`                | Why + what changes + decision log with explicit ceilings          |
| `specs/<capability>/spec.md` | Behavioral delta — WHEN/THEN scenarios, no implementation details |
| `design.md`                  | How — architecture, data flow, component changes                  |
| `tasks.md`                   | Implementation checklist, checked off as work progresses          |

```bash
openspec validate <change-name> --strict   # must pass before apply
```

**4. TDD — Apply**
For each spec scenario: write the failing test → confirm it fails for the right reason →
implement → confirm it passes. Every scenario has a test. `tasks.md` is updated as work
completes.

Three test types are mandatory (`.claude/rules.md`):

- Unit — logic, utilities, pure functions
- Integration — at least one per API route or Prisma query
- E2E (Playwright) — at least one per user-facing flow

**5. Quality gate**

```bash
npm run lint && npm test && npm run build
```

If any step fails after three attempts, the agent reports the blocker rather than
weakening tests or disabling lint rules.

**6. OpenSpec — Archive**

```bash
openspec archive <change-name> --yes
```

Merges the spec delta into `openspec/specs/<capability>/spec.md` and moves the change
directory to `openspec/changes/archive/`. The spec is now part of the permanent record.

**7. Commit (with hooks)**

`git commit` triggers two Claude Code hooks defined in `.claude/settings.json`:

- **PreToolUse — `pre-commit-gathe.sh`**: runs lint + test + AI code review before the
  commit is created. Exit 2 blocks the commit.
- **PostToolUse — `post-commit-changelog.sh`**: after a successful commit, appends an
  entry to `CHANGELOG.md` under `## [Unreleased]` and amends the commit to include it.

**8. Push + PR**

```bash
git push -u origin feat/...
gh pr create --base main --title "feat: <task name> (CU-<id>)"
```

PR body includes the ClickUp link, proposal summary, spec scenarios covered, and
verification instructions. `Closes CU-<task-id>` links GitHub to ClickUp.

**9. GitHub Actions — CI**

Two jobs run in parallel on every PR:

| Job           | What it does                                                                  |
| ------------- | ----------------------------------------------------------------------------- |
| `verify`      | lint → test (with real Postgres) → build → `openspec validate --all --strict` |
| `code-review` | AI security/performance review (grade A–F) → posts comment on PR              |

If tests fail, `test-explainer.mjs` posts an LLM-generated explanation to the PR so the
cause is immediately readable. `pr-summary.mjs` posts a human-readable PR summary.

**Deploy — preview**
On every PR, `deploy.yml` runs tests, builds, and deploys to a Vercel preview URL,
posted automatically as a PR comment.

**10. ClickUp update**
Posts a comment on the task with the PR link and a three-line summary. Sets the task
status to "In Review".

**11. Merge gate (PreToolUse hook)**

When the agent runs `gh pr merge`, `pre-merge-gate.sh` fires and blocks unless:

1. All CI checks are green (no failures, no pending)
2. The AI review grade (from `github-actions[bot]` comments only — anti-spoofing) is **A**

Grade B or lower → the agent must address the review issues and re-push before merging.

**12. Production deploy**
Merge to `main` triggers the `production` job in `deploy.yml`:

```
lint → test → build → vercel deploy --prod
```

Zero-downtime deploy via Vercel. No manual step required.

**13. Blog post agent**
After a successful production deploy, `blog-post-agent.mjs` runs:

1. Reads the commits in the deploy
2. Uses an LLM (via OpenRouter) to write a plain-language post
3. POSTs it to `BLOG_POST_API_URL`

**14. Stop gate**
At the end of every Claude Code session, `stop-gate.sh` fires:

- Uncommitted changes → error, session ends loudly
- Missing integration or E2E test files → warning (not a hard block — enforces
  coverage incrementally over time)

---

## Quality Gates Summary

| Gate                         | Trigger            | Blocks                                    |
| ---------------------------- | ------------------ | ----------------------------------------- |
| `pre-commit-gathe.sh`        | `git commit`       | lint failure, test failure, AI review < D |
| `post-commit-changelog.sh`   | after `git commit` | — (amends CHANGELOG)                      |
| `pre-merge-gate.sh`          | `gh pr merge`      | CI not green, AI review grade < A         |
| `stop-gate.sh`               | session end        | uncommitted changes                       |
| GitHub Actions `verify`      | PR / push to main  | lint, test, build, openspec               |
| GitHub Actions `code-review` | PR                 | posts grade; grade < D fails CI           |
| GitHub Actions `deploy.yml`  | PR / merge to main | preview / production                      |

---

## Commands

```bash
npm run dev              # dev server on :3000 (Turbopack)
npm run build            # production build + TS check
npm run start            # run production build
npm run lint             # ESLint
npm test                 # Vitest unit + integration
npm run test:unit        # unit only
npm run test:integration # integration only
npm run test:e2e         # Playwright E2E
npm run todo:db:init     # push Prisma schema to database

docker compose up -d db  # start only Postgres
docker compose up        # start Postgres + app
```

---

## Project Structure

```
app/
  api/tasks/          ← REST API (GET, POST, PATCH, DELETE)
  page.tsx            ← main page

components/ui/        ← design system primitives (Button, Input, Card, …)
features/tasks/
  components/         ← TaskHeader, TaskCard, TaskDetailDrawer, …
  hooks/              ← useTasks, useTaskMutation, useTaskFilters, …
  types/              ← Task, Priority, CreateTaskInput, …

lib/
  prisma.ts           ← Prisma Client singleton
  validation.ts       ← shared validation logic

prisma/
  schema.prisma       ← Task model (title, priority, dueDate, recurrence, …)

tests/
  *.integration.test.ts   ← API + DB integration tests (Vitest)
  e2e/                    ← Playwright E2E tests

openspec/
  specs/              ← canonical behavioral specs (source of truth)
  changes/archive/    ← completed change artifacts (proposal, design, tasks)
  config.yaml         ← OpenSpec project config

.claude/
  settings.json       ← hooks config (PreToolUse, PostToolUse, Stop)
  hooks/              ← pre-commit-gathe, post-commit-changelog, pre-merge-gate, stop-gate
  rules.md            ← mandatory test coverage + PR merge criteria
  commands/           ← clickup-ship, opsx/* skills

scripts/
  ci-review.mjs       ← AI code review (security + performance, grade A–F)
  pr-summary.mjs      ← AI PR summary posted to GitHub
  test-explainer.mjs  ← AI test failure explainer posted to GitHub
  blog-post-agent.mjs ← post-deploy blog post generator

.github/workflows/
  ci.yml              ← verify (lint/test/build/openspec) + code-review
  deploy.yml          ← preview (PR) + production (main)
```

---

## OpenSpec

All behavioral changes go through OpenSpec before any code is written. This keeps the
"why" and the behavioral contract separate from the implementation.

```bash
openspec list --specs             # list all capabilities and requirement counts
openspec validate --all --strict  # validate all specs
```

Specs live in `openspec/specs/` and are the authoritative record of what the system
is supposed to do. They are validated in CI on every PR and push to main.

---

## Swapping the Deploy Target

`deploy.yml` uses Vercel. For other targets, replace the three `npx vercel` steps:

```bash
# Netlify
netlify deploy --build --prod

# Cloudflare Pages
wrangler pages deploy dist
```

Remove or replace the `VERCEL_*` secrets accordingly.
