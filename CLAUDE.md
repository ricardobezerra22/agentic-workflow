# Agentic Sandbox

Production-grade Next.js + TypeScript + Prisma + Tailwind CSS app for an end-to-end agentic workflow:
ClickUp task → OpenSpec proposal → TDD implementation → PR → GitHub Actions CI/CD.

A full-stack Todo List application served at `http://localhost:3000`.

## Commands

### Development
- `npm run dev` — start Next.js dev server with Turbopack on `localhost:3000`
- `npm run build` — production build

### Production / Deployment
- `npm run start` — run production build
- `npm run todo:db:init` — initialize/push Prisma schema to database

### Quality & Testing
- `npm run lint` — run ESLint
- `npm test` — run Vitest (unit + integration tests)
- `npm run test:unit` — run unit tests only
- `npm run test:integration` — run integration tests only
- `npm run test:e2e` — run Playwright E2E tests
- `npm run build` — verify TS types and build

### Docker (Postgres + app together)
- `docker compose up -d db` — start only Postgres
- `docker compose up` — start Postgres + app

### OpenSpec workflow
- `/clickup-ship <task-id-or-url> [--review-spec]` runs the whole loop
- `/opsx:propose`, `/opsx:apply`, `/opsx:archive` are the individual OpenSpec steps

## Environment

Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — dev Postgres connection string (for Prisma)
- `TEST_DATABASE_URL` — test Postgres connection string (needs a separate DB)
- `NODE_ENV` — defaults to `development`

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), React, Server Components by default
- **Styling**: Tailwind CSS, @tailwindcss/forms
- **Backend**: Next.js Route Handlers, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest (unit + integration), Playwright (E2E)
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Accessibility**: WCAG 2.1 AA target

## Architecture

### Folder Structure
```
app/               ← Next.js App Router (pages, layouts, route handlers)
  api/             ← REST API route handlers
  page.tsx         ← main page

components/        ← Reusable React components
  ui/              ← design system primitives (Button, Input, etc.)
  layout/          ← layout components (Header, Footer, etc.)

features/          ← feature modules (Tasks, etc.)
  tasks/
    components/    ← Task-specific components
    hooks/         ← Task-specific hooks (useTasks, useTaskMutation)
    types/         ← Task-specific types

lib/               ← utilities
  prisma.ts        ← Prisma Client singleton
  validation.ts    ← form/API validation logic
  greeting.ts      ← greeting utility functions

prisma/
  schema.prisma    ← Prisma schema (database models)

tests/
  e2e/             ← Playwright E2E tests
```

### Key Conventions

**TypeScript:**
- Strict mode enabled (`strict: true` in tsconfig.json)
- No `any` types — use specific types or generics
- Type all component props, API responses, form data

**React/Next.js:**
- Server Components by default (no `"use client"` unless necessary)
- Server-side data fetching in Server Components
- Client Components for interactivity or browser APIs
- Use `"use client"` sparingly — not on entire pages

**Prisma:**
- All database access via Prisma Client (no raw SQL except migrations)
- Types auto-generated from `prisma/schema.prisma`
- Never access `.env` secrets in the browser — only in server code and API routes

**Forms & Validation:**
- Validate on both client (UX) and server (security)
- Client validation in React components
- Server validation in API route handlers
- Use `lib/validation.ts` for reusable validation logic

**Components:**
- Create primitives in `components/ui/` for repeated patterns
- Feature-specific components in `features/[feature]/components/`
- Prefer composition over prop drilling
- Always include semantic HTML, keyboard navigation, ARIA labels

**Styling:**
- Use Tailwind CSS for all styling (no CSS-in-JS libraries)
- Define design tokens in `tailwind.config.ts`
- Avoid `arbitrary values` (e.g., `w-[437px]`) — use consistent spacing scale
- Responsive: mobile-first (start with base styles, add larger screen utilities)

**Testing:**
- Write tests **before** implementing features (TDD)
- Unit tests: logic, utilities, pure functions
- Integration tests: API routes, Prisma queries (against real test DB)
- E2E tests: critical user flows (create, edit, delete, filter)
- Minimum coverage: 80% (critical paths 100%)

**Accessibility (WCAG 2.1 AA):**
- Semantic HTML always (`<button>`, `<form>`, `<label>`, `<main>`, etc.)
- Keyboard navigation: Tab, Shift+Tab, Enter, Escape work everywhere
- Focus indicators: always visible, never removed
- Labels: every form control must have a label (visible or programmatic)
- Errors: announced via `aria-describedby`, never color-only
- Contrast: minimum 4.5:1 for normal text, 3:1 for large text
- Motion: respect `prefers-reduced-motion`, never autoplay animations

## Important

- Always run `npm test` and `npm run lint` before committing. No commits with failing tests.
- Behavior changes go through an OpenSpec change in `openspec/changes/`. Archive in the same PR.
- Tests first. Do not weaken tests or lint rules to get green.
- Never push to `main`, never edit `.github/workflows/` in a feature branch.
- See `.claude/rules.md` for mandatory test-type requirements and PR merge criteria.
- Use the `frontend-design` skill before building any UI component — establish visual direction first.
