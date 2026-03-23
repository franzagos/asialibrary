---
description: Run all feature tasks to completion via sub-agents
---

# Continue Feature

Runs every task in the feature spec to completion without stopping. The orchestrator stays lean — reads the spec and coordinates. Sub-agents do all the actual work.

## Step 1: Locate the Feature

Look for the feature folder in `specs/{feature-name}/`. It should contain:
- `requirements.md`
- `implementation-plan.md`

If a feature name is passed in `$ARGUMENTS`, use it. If only one folder exists under `specs/`, use it. If multiple exist and no argument is provided, ask the user which feature to continue.

## Step 2: Load Orchestrator Context (lean — no source files)

Read only:
1. `CLAUDE.md` — full text, will be embedded verbatim in sub-agent briefs
2. `specs/{feature-name}/requirements.md` — feature summary
3. `specs/{feature-name}/implementation-plan.md` — task list

**Never load in the orchestrator**: source files, `node_modules/`, `.next/`, `pnpm-lock.yaml`, `drizzle/meta/`. Source loading belongs in sub-agents.

## Step 3: Find the Next Wave

1. Find the current phase: the first phase with any unchecked `- [ ]` tasks
2. Find the current wave: the lowest wave number with unchecked tasks in that phase
3. Collect ALL unchecked tasks with that wave number — these run in parallel

For each task, extract:
- `phase_number`, `phase_title`
- `task_description` — stripped of `[wave:N]` and `[complex]` markers
- `wave_number`
- `task_index`, `task_total` (count of tasks in this phase)
- `feature_tag` — the `[feature: ...]` slug from the phase header (e.g., `brand-management`)
- `files_to_read` — full `### Files to Read` section for this phase
- `technical_details` — full `### Technical Details` section for this phase

**If no unchecked tasks remain anywhere**: go to Final Report.

**Package install conflict check**: if more than one task in the current wave involves running `pnpm add` or `pnpm dlx`, run those tasks sequentially (one at a time) to avoid package.json conflicts. All other same-wave tasks can run in parallel.

## Step 4: Build Sub-Agent Brief

For each task in the current wave, construct a fully self-contained prompt. Sub-agents start with zero prior context.

Build by concatenating these sections:

---

**[SECTION 1: Identity and Task]**
```
You are a senior full-stack engineer. You write production-quality code, read existing patterns before creating new ones, and never cut corners on UI quality or error handling.

Feature: {feature_name}
Phase: {phase_number} — {phase_title}
Task: {task_description}
Wave: {wave_number}
```

---

**[SECTION 2: Project Conventions]**
```
## Project Conventions

{paste the full text of CLAUDE.md verbatim — do not summarize, do not truncate}
```

---

**[SECTION 3: Files to Load]**
```
## Files to Load Before Writing Any Code

Always load:
- src/lib/schema.ts
- package.json

Also load these phase-specific files:
{paste the ### Files to Read section from the current phase verbatim}
```

---

**[SECTION 4: Technical Details]**
```
## Technical Details

{paste the ### Technical Details section from the current phase verbatim}
```

---

**[SECTION 5: Design Direction + UI Quality Standard]**

Include this section only when the task involves building any visible UI (pages, components, layouts, dialogs).

The orchestrator must extract the `## Design Direction` section from `specs/{feature-name}/requirements.md` and embed it verbatim below.

```
## Design Direction

{paste the ## Design Direction section from requirements.md verbatim}

Apply this direction to every visual decision: color choices, spacing density, typographic weight, animation presence, component variants. This is not optional — the design direction is the aesthetic contract for this app.

## UI Quality Standard

Every UI task must meet this bar before it is done:

1. **Complete interactions**: If users can add something, they can also edit and delete it. Never build a read-only view when the spec implies mutability.
2. **Empty states**: Any list, table, or grid must have a designed empty state — an icon, a message, and a CTA.
3. **Loading and error states**: Every data-fetching component needs a loading skeleton and an error message.
4. **Page structure**: Every page needs a header with a title, a description, and a primary action button where appropriate.
5. **Use shadcn/ui**: Always use existing components (Card, Button, Badge, Dialog, Table, Tabs, etc.) — never raw divs where a component exists.
6. **Spacing**: Page padding px-6 py-8, card padding p-6, section gap space-y-6.
7. **Dark mode**: Use semantic tokens only (bg-background, text-foreground, bg-muted, border). Never hardcode colors.
8. **No generic AI aesthetics**: Avoid flat grey cards with no personality. The design direction above overrides default choices — if it says bold and expressive, make it bold and expressive.

If you find yourself building a flat, buttonless, action-free screen — stop and add the missing interactions.
If the result looks like every other AI-generated UI — stop and apply the design direction.
```

---

**[SECTION 6: Implementation Steps]**
```
## Implementation Steps

Execute in order:

1. Load all files listed in Section 3 — read before writing anything
2. If you encounter an unfamiliar library API, use Context7 to look up the latest docs before implementing
3. Implement the task following all conventions in Section 2
   — If this task includes UI: apply the UI Quality Standard from Section 5
4. Run: pnpm lint && pnpm typecheck
5. If lint/typecheck fails: fix automatically (up to 2 retries)
   — If still failing after 2 retries: stop and return exactly:
     FAILED: {full error output}
6. Do NOT run git add or git commit.
7. Return exactly:
   DONE. Files changed: {list each modified file, one per line}
```

---

**[SECTION 7: Boundaries]**
```
## Boundaries

- Implement ONLY the task in Section 1. Do not implement adjacent tasks.
- Do not run pnpm dev.
- Do not ask questions — use Technical Details and Project Conventions.
- Do not add features, refactors, or improvements beyond what the task requires.
- Do NOT run git add or git commit.
- After returning your result, stop completely.
```

---

## Step 5: Spawn Sub-Agents

Spawn one background agent per task in the current wave, all at once. Use `run_in_background: true` for each.

Print before spawning:
```
Phase {phase_number}: {phase_title} · Wave {wave_number} ({N} task(s))
→ {task_1_description}
→ {task_2_description}  (if applicable)
```

## Step 6: Wait for Results

Wait for all background agents to complete. You will be notified automatically — do not poll.

## Step 7: Continue

**If any agent returned `FAILED`**: go to Error Handling.

**If all agents returned `DONE`**:

1. Check off all completed tasks in `implementation-plan.md`:
   `- [ ] [wave:N] {task}` → `- [x] [wave:N] {task}`
2. Print:
   ```
   ✅ Wave {wave_number} — {task_1_description}
   ✅ Wave {wave_number} — {task_2_description}  (if applicable)
   ```
3. Loop back to Step 3 immediately. Do not stop or ask the user anything.

## Final Report

Run when no unchecked tasks remain:

### Feature Documentation

Create `docs/features/` if it doesn't exist: `mkdir -p docs/features`

Group all completed phases by their `[feature: {slug}]` tag. For each unique slug:

1. **If `docs/features/{slug}.md` already exists**: read it, then UPDATE it — merge new tables, routes, files, and env vars into the existing sections. Do not overwrite content that is still accurate.
2. **If it does not exist**: create `docs/features/{slug}.md` from scratch.

Each doc follows this template:

```markdown
# {Feature Name}

## What It Does
{1-2 paragraph summary — sourced from requirements.md, scoped to this feature}

## Data Model
### New Tables
{list tables added with key columns}

### Modified Tables
{any changes to existing tables, or "None"}

## API Routes
{list: METHOD /api/path — what it does}

## Key Files
{list: src/path/file.ts — what it does}

## Environment Variables
{any new env vars required, or "None"}

## Notes for Future Development
{anything a developer needs to know when extending this feature}
```

### Cleanup:
```bash
rm -f specs/{feature-name}/action-required.md
rm -f specs/{feature-name}/research-notes.md
```

### Print:
```
✅ {feature_name} — complete

All tasks finished across {total_phases} phase(s).

Docs created/updated:
  docs/features/{slug-1}.md
  docs/features/{slug-2}.md  (if multiple features)

Specs kept:
  specs/{feature-name}/requirements.md
  specs/{feature-name}/decisions.md
  specs/{feature-name}/implementation-plan.md

Review the changes, commit when ready, then run /deploy-check before pushing.
```

## Error Handling

### Sub-agent returned FAILED:

```
⚠️ Task failed: {task_description}

Error:
{error output from agent}

The agent tried up to 2 auto-fixes and could not resolve it.

Fix the issue manually, then tell me to continue — I'll retry from this task.
```

### Branch is behind main:

```bash
git fetch origin main
git log HEAD..origin/main --oneline
```

If behind: "Your branch is {N} commits behind main. Consider rebasing before continuing."
