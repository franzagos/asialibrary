# Architecture Decisions: Asia's Library

## Invite-only registration via token in URL
**Context**: Better Auth doesn't have a built-in "invite-only" mode. We needed a way to block open registration while still letting Asia send invite links.
**Decision**: Add a `before` hook on the signUp endpoint that checks for an `inviteToken` field in the request body. The register page reads the token from the URL query param and passes it as a hidden field. Valid tokens are marked `used=true` on registration.
**Alternatives considered**: Using Better Auth's organization plugin — overkill for this use case (no teams, no orgs); using magic-link-only auth — would require Resend in dev too.

## Two OpenRouter calls for book identification
**Context**: No single model does both vision recognition AND current web price lookup well in one call.
**Decision**: Two sequential calls — `google/gemini-2.0-flash` for vision (fast, cheap, excellent at book cover OCR), then `perplexity/sonar-pro` for web enrichment (has live web search built in). Both via OpenRouter.
**Alternatives considered**: Single Gemini call with search grounding — Gemini's grounding is not available on all OpenRouter tiers and price data freshness is not guaranteed.

## Admin role via ADMIN_EMAIL env var
**Context**: There's only one admin (Asia). Adding a full RBAC system is overkill.
**Decision**: Check `session.user.email === process.env.ADMIN_EMAIL` server-side. Simple, no extra DB columns needed (though we added a `role` column for future-proofing).
**Alternatives considered**: Role column in DB — kept as fallback but not the primary check.

## Per-user personal libraries (not shared)
**Context**: The user clarified "i database sono personali" — each user owns their own books.
**Decision**: `book.userId` foreign key ensures strict data isolation. All book queries are scoped to the authenticated user's ID. No cross-user visibility.
**Alternatives considered**: Shared library with ownership tracking — rejected per user requirement.

## CSV export as streaming response (not file generation)
**Context**: Libraries can grow large; generating a file on disk adds complexity.
**Decision**: Build the CSV string in-memory and stream it directly as a `text/csv` response. For the expected library sizes (hundreds of books), this is fine.
**Alternatives considered**: Background job + S3 download link — unnecessary complexity for this scale.
