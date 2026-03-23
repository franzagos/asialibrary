---
description: Build a complete app from scratch — interview, spec, starter-prompt doc, then auto-build
---

# Starter Prompt

Builds a full application from a conversation. Interviews the user, creates all spec files, generates a persistent `docs/business/starter-prompt.md` context document, then builds everything automatically using parallel wave execution.

**Use this when starting a brand new app.** For adding features to an existing app, use `/create-spec` instead.

---

## Phase 1 + 1.5 + 2: Interview and Spec Generation

Read `.claude/commands/create-spec.md` and follow its **Phase 1** (Interview), **Phase 1.5** (Research), and **Phase 2** (Generate Spec) exactly — including all interview rules, research agents, polling, and spec file generation.

When Phase 2 is complete you will have created:
- `specs/{feature-name}/requirements.md`
- `specs/{feature-name}/implementation-plan.md`
- `specs/{feature-name}/action-required.md`
- `specs/{feature-name}/decisions.md`
- `specs/{feature-name}/research-notes.md` (if research completed)

**Stop before create-spec's "After Creating" section** — this command has its own handoff.

---

## Phase 2.5: Generate Starter Prompt Document

Create `docs/business/` if it doesn't exist: `mkdir -p docs/business`

Write `docs/business/starter-prompt.md` using everything gathered in the interview:

```markdown
# {App Name} — Project Context

> Paste this file into any new Claude session to restore full context about this project instantly.

## What This App Does
{one sentence from interview — the problem it solves}

## Users & Roles
{who uses the app, their roles, what each role can do}

## Authentication
{login methods — signup policy (open or invite-only) — what the user sees on first login}

## Key Screens
{from interview question 6 — list each screen with a one-line description}
- Pre-login: {landing page or straight to login}
- {Screen}: {what's on it}

## Core Features
{numbered list from requirements.md — specific, not vague}

## Design Direction
{paste the ## Design Direction section from requirements.md verbatim — aesthetic, colors, tone, dark/light mode, reference apps}

## Integrations
{third-party services used, or "None"}

## Tech Stack
Next.js 16 · React 19 · TypeScript · Better Auth · PostgreSQL + Drizzle ORM · shadcn/ui · Tailwind 4{· OpenRouter}{· Resend}

---

## Context for Claude

This project was scaffolded from Simo's Agentic Coding Boilerplate. Important rules:

- **Do NOT restore boilerplate placeholder content**. The following default pages exist in the boilerplate and must be completely replaced — not appended to:
  - `/` — setup checklist and feature overview (replace with the actual landing page)
  - `/dashboard` — placeholder dashboard (replace with the real app dashboard)
  - `/chat` — demo AI chat interface (replace or remove entirely)
- Read `src/lib/schema.ts` to understand the data model before any database work.
- Check `specs/{feature-name}/` for implementation decisions and task status.
- Follow all conventions in `CLAUDE.md`.
- Use `src/lib/api-utils.ts` helpers for all API routes (applyRateLimit, requireApiAuth, parseBody, apiResponse, apiError).

## Spec Location
`specs/{feature-name}/`
- `requirements.md` — full requirements
- `implementation-plan.md` — phased task list with completion status
- `decisions.md` — architecture decisions
```

---

## Phase 3: Handoff

Read `specs/{feature-name}/action-required.md`.

**If it has "Before you start building" steps:**
Present them inline — do not say "go read the file". List each step and ask the user to confirm when done.

> Before building, you'll need to:
>
> **1. {Step}** — {plain-English instruction}
>
> Let me know when these are done and I'll start building.

**If it has "After deploying" steps:** mention them briefly ("There are also a couple of steps only possible after deploying — I'll remind you then.") but do not block on them.

**If no manual steps:** skip this and proceed immediately.

---

## Phase 4: Build

Once manual steps are acknowledged (or there are none), say:

> Building now — I'll work through all phases automatically.

Then follow the orchestration from `.claude/commands/continue-feature.md`.

**Use parallel wave execution**: spawn all tasks in the current wave simultaneously. Wait for all to complete before moving to the next wave.

When all tasks across all phases are complete, continue-feature will generate one `docs/features/{slug}.md` per unique feature tag and print the final report.

---

## Phase 5: Boilerplate Cleanup

After the build is complete, remove all traces of the boilerplate. The app is now its own thing.

### 1. Rewrite `README.md`

Replace the entire README with a new one that describes the actual app:

```markdown
# {App Name}

{One-sentence description from the interview}

## Features

{List the app's actual features — pull from docs/features/*.md}

## Setup

### Prerequisites
- Node.js 18+, pnpm, Docker Desktop

### Installation
1. Clone the repo
2. `pnpm install`
3. `cp env.example .env` and fill in the values
4. `docker compose up -d && pnpm run db:migrate`
5. `pnpm dev`

### Environment Variables
{List required env vars and what they're for — pull from env.example}

## Tech Stack
{Tech stack from starter-prompt.md}

## Development
- `pnpm dev` — start dev server
- `pnpm check` — lint + typecheck
- `pnpm db:generate` — generate migrations after schema changes
- `pnpm db:migrate` — apply migrations
```

### 2. Clean up boilerplate references

Search the codebase for any remaining boilerplate references and remove them:
- Page titles or headings mentioning "Simo's Agentic Boilerplate"
- Links to `simomagazzu/create-app-like-simo`
- Comments referencing "boilerplate" or "template" in code that was newly written
- The setup wizard at `/` — it should have been replaced by the actual landing page during the build

### 3. Update `CLAUDE.md` header

Replace the first line:
```
# Simo's Agentic Coding Boilerplate — AI Assistant Guidelines
```
With:
```
# {App Name} — AI Assistant Guidelines
```

And update the Project Overview paragraph to describe the actual app, not the boilerplate.
