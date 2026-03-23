---
description: Interview the user about what they want to build, then create a detailed spec
---

# Create Spec

This command has three phases: **interview**, **research**, and **generate**.

## Phase 1: Interview

Before creating any files, have a focused conversation to understand what the user wants to build. Ask questions in this order — adapt based on answers, skip what's already clear.

### Core Questions

Ask these in order, 2-3 at a time. Every question must be answered before generating the spec.

1. **What does the app do?** (one sentence — what problem does it solve?)
2. **Who uses it?** (who are the users, are there different roles with different access?)
3. **What are the 3-5 most important things a user can do?** (core features — be specific, push back on vague answers like "a dashboard")
4. **Accounts and login**: does the app require users to sign in? If yes: email/password, Google, or both? Can anyone sign up, or is access invite-only? What does a user see right after they log in for the first time?
5. **What data does the app store?** (think about the main database tables — what are the key entities and how do they relate?)
6. **Walk me through the key screens**: what does someone see when they first visit the app (before logging in)? Is there a public landing page, or does it go straight to login? Then walk through the main pages once logged in — what's on each one?
7. **Design and feel**: how do you want this app to look and feel? Think of apps or websites whose design you love — what appeals to you about them? Are you thinking minimal and clean, bold and expressive, professional, playful, premium? Dark mode, light mode, or both? Any specific colors, fonts, or branding in mind? If you have no preference, say so and we'll choose something great.
8. **Does it need AI?** If yes: what exactly should the AI do and when does it run?
9. **Any third-party integrations?** (payments, email sending/receiving, external APIs, file storage)

### Follow-Up Questions (ask only if not already clear)

- If multi-user: is data shared between users, or is each user's data private? If shared, what can users see/do with each other's data?
- What happens when something goes wrong? (e.g. a third-party fails, a user submits invalid data — what should the user see?)
- What's the MVP — the minimum that makes this useful — vs nice-to-have features?
- Does it need real-time updates (live data, notifications)?
- Is there file uploading involved?

### Interview Rules

- Ask 2-3 questions at a time, never all at once
- Summarize what you've understood after each round
- Push for specifics: "a dashboard" → "what's on the dashboard, exactly?"; "users can manage their data" → "what does managing mean — create, edit, delete, share?"
- For design: if the user says "no preference" or "whatever looks good", commit to a direction yourself and confirm it — never leave design as undefined. Make a bold, specific choice.
- If the user is not a developer, translate their answers into technical implications without jargon: e.g. "so we'll need a database table for X" — confirm this is right
- Never assume. If something is ambiguous, ask.
- Once you have enough detail on all 9 core questions, present a full confirmation summary:

```
Here's what I understand you want to build:

**App**: [one-liner]
**Users**: [who + roles]
**Auth**: [login methods + signup policy + first-login experience]
**Core features**:
1. [feature — specific]
2. [feature — specific]
3. [feature — specific]

**Data model**: [key entities + relationships]
**Multi-user data**: [shared vs private, what users can see]
**Key screens**:
- [Pre-login: landing page or straight to login?]
- [Screen 1 — what's on it]
- [Screen 2 — what's on it]
**Design direction**: [aesthetic — e.g. "minimal, dark mode, cool blues, subtle animations"]
**AI usage**: [yes/no + what it does + when it runs]
**Integrations**: [list]

Does this capture it? Anything missing or wrong?
```

Only proceed to Phase 1.5 after the user confirms.

## Phase 1.5: Research

Before generating any files, run research agents in parallel to ground the spec in the actual codebase. This prevents placeholder paths and invented symbol names in `### Technical Details`.

Tell the user: "Great! Let me quickly research the codebase before generating your spec..."

### Research Agent 1: Codebase Scout (always spawn)

Spawn via Agent tool with `run_in_background: true`.

**Brief:**
```
You are a codebase research agent. Explore this Next.js project and produce a structured research report. Do NOT modify any files.

Feature being planned: {feature_name}
User needs: {one-sentence summary from interview}

Read and report on:
1. src/lib/schema.ts — list all existing tables and their key columns
2. src/app/api/ — list all existing API routes (file path + HTTP methods)
3. src/components/ — list all components with a one-line description
4. src/app/ — list all existing pages and layouts

For each item relevant to the planned feature, note:
- Exact file path
- What it does
- Whether it can be reused, extended, or must be created fresh

Output a JSON object and write it to .planning/research-codebase.json:
{
  "existing_tables": [{"name": "...", "columns": [...]}],
  "existing_routes": [{"path": "...", "methods": [...], "description": "..."}],
  "reusable_components": [{"path": "...", "description": "..."}],
  "existing_pages": [{"path": "...", "description": "..."}],
  "patterns_to_follow": ["..."],
  "files_to_read_per_phase": {
    "phase_1": ["src/lib/schema.ts", "..."],
    "phase_2": ["..."]
  }
}

Write the JSON to .planning/research-codebase.json and then stop.
```

### Research Agent 2: Docs Fetcher (conditional)

Spawn only if the feature needs external APIs (detected from interview: payments, email, SMS, maps, OAuth providers, etc.).

**Brief:**
```
You are a documentation research agent. Look up and summarize relevant external API documentation.

Feature: {feature_name}
External APIs needed: {list from interview}

For each API:
1. Use mcp__context7__resolve-library-id to find the library ID
2. Use mcp__context7__query-docs to retrieve its quickstart and API reference
3. Extract: authentication method, key endpoints, request/response shapes, SDK name, rate limits, gotchas

Do NOT use WebFetch. Use Context7 only — it is pre-approved and covers all major libraries.
If a library is not found in Context7, note "not in Context7" and proceed with best available knowledge.

Output a JSON object and write it to .planning/research-docs.json:
{
  "apis": [
    {
      "name": "...",
      "docs_url": "...",
      "auth_method": "...",
      "key_endpoints": ["..."],
      "sdk": "...",
      "gotchas": ["..."]
    }
  ]
}

Write the JSON to .planning/research-docs.json and then stop.
```

### Polling for research completion

Create `.planning/` if it doesn't exist: `mkdir -p .planning`

**IMPORTANT: Do NOT call TaskOutput to wait for background agents — it will timeout. Instead, poll by checking for file existence using Bash.**

Poll loop — repeat every ~5 seconds using Bash:

```bash
# Check codebase scout
ls .planning/research-codebase.json 2>/dev/null && echo "scout_done" || echo "scout_running"

# Check docs fetcher (if spawned)
ls .planning/research-docs.json 2>/dev/null && echo "docs_done" || echo "docs_running"
```

After each check, output:

```
Researching codebase...

  Codebase Scout:  {✓ done / ⏳ running}
  Docs Fetcher:    {✓ done / ⏳ running / — skipped}
```

If after 120 seconds a file isn't present, proceed without it and note "research incomplete" in the spec.

### Consuming research output

Before generating any spec files, read the research JSON files:
- `.planning/research-codebase.json` (if it exists)
- `.planning/research-docs.json` (if it exists)

Use to:
1. Populate `### Files to Read` sections with real paths from `files_to_read_per_phase`
2. Populate `### Technical Details` with actual table names, column names, existing component names, real import paths
3. Create `specs/{feature-name}/research-notes.md` (see step 5 in Phase 2)

If research is incomplete (agent timed out), add a note in the affected `### Technical Details` section:
`NOTE: research incomplete — verify these paths before implementing`

## Phase 2: Generate Spec

### 1. Create the feature folder

Path: `specs/{feature-name}/` (kebab-case)

### 2. Create `requirements.md`

```markdown
# {Feature Name}

## Summary
{One paragraph describing the app/feature}

## Users
{Who uses this, their roles, and what each role can do}

## Auth
{Login methods (email/password, Google, or both) + signup policy (open or invite-only) + what a user sees on first login}

## Core Features
1. **{Feature}** — {description, specific enough that a developer knows what to build}
2. **{Feature}** — {description}
...

## Data Model
{Key entities, their relationships, important fields. Note which data is shared across users vs private.}

## Key Screens
{List of main pages/views with a one-line description of what each contains}

## Design Direction
{Aesthetic direction — color palette, typography feel, dark/light mode, tone (minimal/bold/premium/playful), motion and animation intent, any reference apps or brands. If the user had no preference, state the direction chosen and why.}

## AI Integration
{How AI is used, what it does, when it runs — or "None" if not applicable}

## Error Handling
{What happens when things go wrong: third-party failures, invalid input, empty states}

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}
...
```

### 3. Create `implementation-plan.md`

```markdown
# Implementation Plan: {Feature Name}

## Overview
{Brief summary of the build approach}

## Phase 1: {Phase Name} [S/M/L] [feature: {feature-slug}]

{What this phase accomplishes}

### Tasks
- [ ] [wave:1] Task description
- [ ] [wave:1] Task description
- [ ] [wave:2] Task description (blocked by: wave:1)
- [ ] [wave:2] Task description [complex] (blocked by: wave:1)

### Technical Details
{CLI commands, schemas, code patterns, file paths — everything an agent needs to implement this phase without asking questions. Use real file paths and existing symbol names from the codebase. Never invent placeholder paths.}

### Files to Read
{List the specific files from the codebase that are relevant to this phase — this feeds into context management}

## Phase 2: {Phase Name} [S/M/L] [feature: {feature-slug}] (blocked by: Phase 1)
...
```

**Size labels**: S = single file change, M = 2-5 files, L = 6+ files or architectural

**Feature tag rules**:
- Every phase gets `[feature: {slug}]` — a kebab-case identifier for the capability this phase contributes to
- Phases that build the same user-facing capability share the same `feature:` slug
- The slug determines which `docs/features/{slug}.md` file gets written or updated in the Final Report
- Example: `## Phase 1: Brand Schema [L] [feature: brand-management]`
- Example: `## Phase 3: Brand Settings Page [M] [feature: brand-management]` (same feature as Phase 1)

**Wave marker rules**:
- Every task gets `[wave:N]`
- Wave 1 = no dependencies (safe to start immediately, can run in parallel)
- Wave 2+ = blocked by the previous wave completing
- Tasks in the same wave are independent of each other
- Wave numbering resets per phase (not global)
- The `(blocked by: wave:N)` annotation is human-readable documentation only

**Wave assignment example**:
```markdown
### Tasks
- [ ] [wave:1] Create `users` table in schema.ts
- [ ] [wave:1] Create `sessions` table in schema.ts
- [ ] [wave:2] Run db:generate and db:migrate (blocked by: wave:1)
- [ ] [wave:2] Add indexes on users.email and sessions.userId (blocked by: wave:1)
- [ ] [wave:3] Write seed script for local development (blocked by: wave:2)
```

### 4. Create `action-required.md`

**Who this file is for**: someone who is not a developer. Write every step as if explaining to a friend who has never used a developer dashboard before.

**What belongs here — the only two categories:**

1. **Account/credential setup**: creating accounts on third-party services, getting API keys, adding env vars to `.env`. These are things a human must physically do before the code can run.
2. **Post-deploy configuration**: webhook URLs, OAuth redirect URIs, DNS records — anything that requires a live public URL or can only be done after the app is deployed.

**What does NOT belong here:**
- Code tasks (writing callbacks, configuring SDK options) — the implementation agent handles those
- Testing instructions ("use ngrok", "test with curl") — not an action item
- Monitoring or operational advice ("monitor for abuse") — not a setup step
- Anything vague or hypothetical

**How to write each step:**
- One clear action per bullet
- Exact navigation path: "Go to resend.com → API Keys → Create API Key"
- Say what to do with the result: "paste it into RESEND_API_KEY in your .env file"
- If a technical term is unavoidable, explain it in plain English in brackets: "MX records [these tell email servers where to deliver mail for your domain]"
- If a step can only be done after deploying, explain why in one sentence: "This requires your app's public URL, which you won't have until after deploying."

```markdown
# Action Required: {Feature Name}

## Before you start building
{Only include if there are credential/account setup steps. These must be done before the code can run.}

- [ ] **{Action}** — {plain-English explanation of what to do and where, written for a non-developer}

## After deploying
{Only include if there are steps that require a live public URL. Explain why each step can't be done earlier.}

- [ ] **{Action}** — {explanation + why it needs a live URL}
```

If there are no manual steps at all: write "No manual steps required."

**Resend example (good):**

```markdown
## Before you start building

- [ ] **Create a Resend account** — Go to resend.com and sign up for a free account. You'll use this to send and receive emails.

- [ ] **Get your Resend API key** — In the Resend dashboard, go to API Keys → Create API Key. Copy the key and paste it into `RESEND_API_KEY` in your `.env` file.

- [ ] **Add a domain for receiving emails** — In the Resend dashboard, go to Domains → Add Domain. Enter a subdomain you own (like `inbox.yourdomain.com`). Resend will show you DNS records [instructions your domain registrar needs to route email to Resend] — add those to wherever you bought your domain (GoDaddy, Namecheap, etc.). This can take up to 24 hours to activate.

## After deploying

- [ ] **Tell Resend where to forward incoming emails** — Once your app is live, go to Resend Dashboard → Inbound → Add Endpoint and enter your app's URL: `https://yourdomain.com/api/webhooks/resend`. You can't do this before deploying because Resend needs a real public URL.
```

### 5. Create `research-notes.md`

Human-readable summary of research agent findings. Skip this file if both research agents timed out.

```markdown
# Research Notes: {Feature Name}

Generated by research agents before spec creation. Do not edit manually.

## Codebase Findings

### Existing Tables
{list from research-codebase.json — table name + relevant columns}

### Reusable Components
{components that can be used as-is for this feature}

### Existing Routes
{API routes relevant to this feature}

### Patterns to Follow
{specific patterns the implementation agents should mirror}

### Files to Read (per phase)
{structured list sourced from files_to_read_per_phase}

## External API Notes
{if docs agent ran: one section per API with auth method, key endpoints, SDK, gotchas}
{if docs agent skipped: "No external APIs required for this feature."}

## Research Status
- Codebase Scout: {complete / incomplete — timed out}
- Docs Fetcher: {complete / incomplete / skipped}
```

### 7. Create `decisions.md`

```markdown
# Architecture Decisions: {Feature Name}

Decisions made during planning. Reference these if questions come up during implementation.

## {Decision Title}
**Context**: {Why this decision came up}
**Decision**: {What was decided}
**Alternatives considered**: {What else was considered and why it was rejected}
```

## Rules

- Tasks must be atomic — implementable in one session by an agent
- Mark complex tasks with `[complex]` for visibility
- The `### Technical Details` section is the **single source of truth**. If it wasn't captured there, it's lost.
- The `### Technical Details` section must use **real file paths and existing symbol names** from the codebase (sourced from research). Never invent placeholder paths like `src/components/MyComponent`.
- The `### Files to Read` section enables efficient context loading in `/continue-feature`
- Do NOT include testing tasks unless the user explicitly asks
- Each phase's size label helps estimate effort

## After Creating

Do the following in order:

### 1. Announce the spec

Tell the user the spec is ready and give a one-line summary of each phase (phase number, name, size label, what it does). Keep it brief — one sentence per phase.

Example:
> Spec ready. Here's what we're building:
>
> **Phase 1** [L] — Schema + auth foundation (7 new tables, email OTP, organizations)
> **Phase 2** [L] — Brand management: add-brand flow, app shell with sidebar
> **Phase 3** [M] — Resend inbound webhook: receive, deduplicate, store, AI-categorize
> ...

### 2. Surface manual steps inline

Read `specs/{feature-name}/action-required.md`. Then:

- If it contains **Before Implementation** steps: present them directly in the conversation. Don't say "go read the file" — list the steps yourself and ask the user to confirm when done.

  Example:
  > Before we can start building, you'll need to do a few things:
  >
  > **1. Create a Resend API key** — go to resend.com/api-keys, create a key, paste it into `RESEND_API_KEY` in your `.env`
  > **2. Verify your sending domain** — add the DNS records from Resend Dashboard → Domains to your registrar
  >
  > Let me know when these are done and I'll start building.

- If there are **After Deploy** steps: mention them briefly so the user knows they exist, but don't block on them.

  Example:
  > There are also a couple of steps that can only be done after deploying (like registering the webhook URL in Resend) — I'll remind you when we get there.

- If there are **no manual steps**: say so and move straight to step 3.

### 3. Ask to start building

Once manual steps are acknowledged (or if there are none), ask directly:

> Ready to start building? I'll work through all the phases automatically. Just say the word.
