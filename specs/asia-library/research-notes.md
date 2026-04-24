# Research Notes: Asia's Library

Generated during spec creation. Do not edit manually.

## Codebase Findings

### Existing Tables
- `user` — id, name, email, emailVerified, image, createdAt, updatedAt (can add `role` column)
- `session`, `account`, `verification` — Better Auth internals, don't modify structure

### Reusable Components
- `src/components/ui/button.tsx` — use for all CTAs
- `src/components/ui/input.tsx` — use in BookForm fields
- `src/components/ui/label.tsx` — form labels
- `src/components/auth/auth-form.tsx` — extend for the invite-gated register page
- `src/components/user-header.tsx` — keep in app shell, add sidebar link to admin

### Existing Routes
- `src/app/api/auth/[...all]/route.ts` — Better Auth handler (modify auth.ts to add invite hook)
- `src/app/api/health/route.ts` — leave as-is

### Patterns to Follow
- All API routes: `applyRateLimit` → `requireApiAuth` → `parseBody` → do work → `apiResponse`/`apiError`
- DB queries: always scope to `session.user.id`, always add `.limit()` on list queries
- File uploads: use `upload(buffer, filename, folder)` from `src/lib/storage.ts`
- Server pages: `requireAuth()` from `src/lib/session.ts` for protected pages
- Client data fetching: fetch from API routes, not direct DB calls

### Files to Read (per phase)
- Phase 1: `src/lib/schema.ts`, `src/lib/auth.ts`, `src/lib/db.ts`
- Phase 2: `src/lib/schema.ts`, `src/lib/api-utils.ts`, `src/lib/rate-limit.ts`, `src/lib/storage.ts`
- Phase 3: `src/app/dashboard/page.tsx`, `src/app/dashboard/layout.tsx`, `src/app/globals.css`, `src/components/user-header.tsx`
- Phase 4: `src/lib/storage.ts`, `src/lib/api-utils.ts`
- Phase 5: `src/lib/schema.ts`, `src/lib/session.ts`, `src/lib/api-utils.ts`

## External API Notes
- **OpenRouter** (google/gemini-2.0-flash for vision, perplexity/sonar-pro for enrichment): use `@openrouter/ai-sdk-provider` + `ai` (Vercel AI SDK). Already in the boilerplate pattern via `createOpenRouter`. Use `generateObject` with a Zod schema for structured output. Image input: base64 data URL in the messages array.
- No other external APIs.

## Research Status
- Codebase Scout: complete
- Docs Fetcher: skipped (no external docs tool needed — OpenRouter is already the project pattern)
- Execution mode: sequential (inline)
