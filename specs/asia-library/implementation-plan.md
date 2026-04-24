# Implementation Plan: Asia's Library

## Overview
Build in 5 phases: schema + auth foundation → API layer → UI shell + library views → AI upload flow → admin + export. Each phase is independently deployable.

---

## Phase 1: Schema, Seed Categories, Invite Auth [L] [feature: foundation]

Sets up all database tables, disables open registration, seeds the predefined categories.

### Tasks
- [ ] [wave:1] Add `category`, `book`, `book_tag`, `invitation` tables to `src/lib/schema.ts`
- [ ] [wave:1] Add `role` column (`text`, default `"user"`) to the `user` table in `src/lib/schema.ts`
- [ ] [wave:2] Run `pnpm run db:generate` and `pnpm run db:migrate` (blocked by: wave:1)
- [ ] [wave:3] Create `src/lib/seed-categories.ts` — inserts default categories if they don't exist: Moda, Design, Arte, Fotografia, Architettura, Letteratura, Altro (blocked by: wave:2)
- [ ] [wave:3] Run seed: `npx tsx src/lib/seed-categories.ts` (blocked by: wave:2)
- [ ] [wave:3] Patch `/api/auth` to block registration without a valid invite token — override `signUp.before` hook in `src/lib/auth.ts` (blocked by: wave:2)

### Technical Details
```typescript
// src/lib/schema.ts additions
import { pgTable, text, timestamp, boolean, index, uuid, numeric, pgEnum } from "drizzle-orm/pg-core";

export const purchaseStatusEnum = pgEnum("purchase_status", ["owned", "wishlist", "lent", "sold"]);

export const category = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const book = pgTable("book", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => category.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  author: text("author"),
  year: text("year"),
  edition: text("edition"),
  description: text("description"),
  marketPrice: numeric("market_price", { precision: 10, scale: 2 }),
  coverUrl: text("cover_url"),
  personalNotes: text("personal_notes"),
  purchaseStatus: purchaseStatusEnum("purchase_status").default("owned"),
  purchaseLocation: text("purchase_location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index("book_user_id_idx").on(t.userId),
  index("book_category_id_idx").on(t.categoryId),
]);

export const bookTag = pgTable("book_tag", {
  bookId: uuid("book_id").notNull().references(() => book.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
}, (t) => [
  index("book_tag_book_id_idx").on(t.bookId),
  index("book_tag_tag_idx").on(t.tag),
]);

export const invitation = pgTable("invitation", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: text("token").notNull().unique(),
  email: text("email"),
  createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
  used: boolean("used").default(false).notNull(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add to user table: role field
// role: text("role").default("user").notNull()
```

Block self-registration in `src/lib/auth.ts` — add a `before` hook on the `signUp` endpoint that checks for a valid `inviteToken` in the request body, validates it against the `invitation` table, marks it used, and proceeds; otherwise returns 403.

### Files to Read
- `src/lib/schema.ts`
- `src/lib/auth.ts`
- `src/lib/db.ts`

---

## Phase 2: Books API — CRUD + CSV Export [L] [feature: book-library]

All REST endpoints for books, tags, and categories.

### Tasks
- [ ] [wave:1] Create `src/app/api/books/route.ts` — GET (list with filters) + POST (create book)
- [ ] [wave:1] Create `src/app/api/books/[id]/route.ts` — GET (single) + PATCH (update) + DELETE
- [ ] [wave:1] Create `src/app/api/categories/route.ts` — GET (list all categories)
- [ ] [wave:2] Create `src/app/api/books/export/route.ts` — GET, streams CSV of user's books (blocked by: wave:1)
- [ ] [wave:2] Create `src/app/api/books/identify/route.ts` — POST, accepts image upload, calls OpenRouter vision then Perplexity enrichment (blocked by: wave:1)

### Technical Details

**GET /api/books** — query params: `categoryId`, `tag`, `q` (search), `limit` (default 50), `offset`
```typescript
// Select with joins — example pattern
const books = await db
  .select({ id: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl, categoryId: book.categoryId, marketPrice: book.marketPrice, purchaseStatus: book.purchaseStatus, createdAt: book.createdAt })
  .from(book)
  .where(and(eq(book.userId, session.user.id), categoryId ? eq(book.categoryId, categoryId) : undefined, ...))
  .limit(50).offset(offset);
```

**POST /api/books** — body: all book fields + `tags: string[]`; insert book then insert bookTag rows in a transaction.

**PATCH /api/books/[id]** — partial update, verify ownership. If tags provided, delete existing bookTag rows for this book and re-insert.

**GET /api/books/export** — generate CSV:
```
title,author,year,edition,description,marketPrice,category,tags,purchaseStatus,purchaseLocation,personalNotes
```
Set `Content-Type: text/csv` and `Content-Disposition: attachment; filename="library.csv"`.

**POST /api/books/identify** — accepts `multipart/form-data` with `image` file:
1. Read file buffer, convert to base64
2. Call OpenRouter vision (gemini-2.0-flash): send image + prompt "Identify this book. Return JSON: {title, author, year, edition}"
3. Call OpenRouter text with Perplexity sonar-pro: "Find description and current market price in EUR for: {title} by {author}. Return JSON: {description, marketPrice}"
4. Return merged JSON

```typescript
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

// Vision call
const { object: bookInfo } = await generateObject({
  model: openrouter("google/gemini-2.0-flash"),
  schema: z.object({ title: z.string(), author: z.string(), year: z.string().optional(), edition: z.string().optional() }),
  messages: [{ role: "user", content: [{ type: "image", image: base64DataUrl }, { type: "text", text: "Identify this book. Return the title, author, year and edition." }] }],
});

// Enrichment call
const { object: enrichment } = await generateObject({
  model: openrouter("perplexity/sonar-pro"),
  schema: z.object({ description: z.string(), marketPrice: z.number().optional() }),
  prompt: `Find a brief description (2-3 sentences) and current average market price in EUR for the book "${bookInfo.title}" by ${bookInfo.author}. Return JSON.`,
});
```

Rate limit `/api/books/identify` at 10 req/min (AI calls are expensive).

### Files to Read
- `src/lib/schema.ts`
- `src/lib/api-utils.ts`
- `src/lib/rate-limit.ts`
- `src/lib/storage.ts`

---

## Phase 3: App Shell + Library Views [L] [feature: book-library]

Replace the placeholder dashboard with the real app UI.

### Tasks
- [ ] [wave:1] Install shadcn components: `pnpm dlx shadcn@latest add sheet badge separator skeleton table dialog`
- [ ] [wave:1] Update `src/app/globals.css` — add Matisse-inspired CSS custom properties for terracotta, ochre, sage, coral accents
- [ ] [wave:2] Create `src/components/library/sidebar.tsx` — category list with counts, active filter highlight, "All books" option (blocked by: wave:1)
- [ ] [wave:2] Create `src/components/library/book-grid.tsx` — responsive grid of book cover cards (blocked by: wave:1)
- [ ] [wave:2] Create `src/components/library/book-table.tsx` — sortable/filterable table with columns: cover thumbnail, title, author, category, price, status, date (blocked by: wave:1)
- [ ] [wave:2] Create `src/components/library/search-bar.tsx` — text input + tag filter chips (blocked by: wave:1)
- [ ] [wave:2] Create `src/components/library/empty-state.tsx` — illustration + CTA button for empty library (blocked by: wave:1)
- [ ] [wave:3] Replace `src/app/dashboard/page.tsx` and `src/app/dashboard/layout.tsx` with `src/app/library/` — new route with sidebar + main area (blocked by: wave:2)
- [ ] [wave:3] Create `src/app/library/[id]/page.tsx` — book detail page with edit-in-place (blocked by: wave:2)
- [ ] [wave:3] Replace `src/app/page.tsx` with redirect to `/library` (blocked by: wave:2)

### Technical Details

App shell layout: fixed sidebar 240px on desktop (collapses to off-canvas Sheet on mobile). Main area: `max-w-7xl mx-auto`. Sidebar shows categories fetched from `/api/categories` with book count per category.

Library page (`/library`):
- Header: title "La mia libreria", search bar, view toggle (grid/table icons), "+ Aggiungi libro" button (primary, terracotta)
- Body: `<BookGrid>` or `<BookTable>` based on toggle state stored in `localStorage`
- Filter chips below search for active category/tag filters

Book card (grid): cover image with `object-cover aspect-[2/3]`, title (2 lines max), author, price badge. Hover: slight scale + shadow.

Book table columns: Cover (40px thumbnail) | Title | Author | Categoria | Prezzo | Stato | Data aggiunta. Clickable row → detail page.

Empty state: centered illustration (book icon from lucide), "Nessun libro ancora" heading, "Aggiungi il tuo primo libro" button.

Book detail page: two-column on desktop (cover left, info right), single column on mobile. All fields displayed. Edit button opens an inline edit mode (fields become inputs). Delete button opens a confirmation Dialog.

### Files to Read
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/globals.css`
- `src/components/user-header.tsx`

---

## Phase 4: AI Upload Flow [M] [feature: book-upload]

The photo upload + AI recognition flow.

### Tasks
- [ ] [wave:1] Create `src/components/library/upload-dropzone.tsx` — drag-and-drop + file picker, shows preview of selected image
- [ ] [wave:1] Create `src/components/library/book-form.tsx` — the full book editing form component (used in upload flow and edit)
- [ ] [wave:2] Create `src/app/library/upload/page.tsx` — 3-step flow: (1) drop photo, (2) AI processing skeleton, (3) review/edit form with pre-filled values (blocked by: wave:1)
- [ ] [wave:2] Wire "+ Aggiungi libro" button in library header to `/library/upload` (blocked by: wave:1)

### Technical Details

Upload flow steps:
1. **Drop zone**: user drops or picks an image. Show thumbnail preview. "Identifica libro" button.
2. **Processing**: POST to `/api/books/identify` with FormData. Show skeleton loader + "Sto identificando il libro..." message.
3. **Review form**: pre-filled BookForm with all identified fields. User edits freely, selects category, adds tags. "Salva nella libreria" button → POST to `/api/books` → redirect to `/library`.

If identification fails: show warning banner "Non sono riuscita ad identificare il libro" but still show the empty form for manual entry.

BookForm fields: Title*, Author, Year, Edition, Category (Select), Tags (free-form input with comma separation → badge chips), Description (Textarea), Market Price (€), Personal Notes (Textarea), Purchase Status (Select: Posseduto/Lista dei desideri/Prestato/Venduto), Purchase Location.

The cover URL is set from the uploaded file (POST to `/api/books` sends the image separately, which the route uploads via `upload()` from `src/lib/storage.ts`).

### Files to Read
- `src/lib/storage.ts`
- `src/lib/api-utils.ts`
- `src/components/library/book-form.tsx` (self-reference during build)

---

## Phase 5: Admin Invite Panel + CSV Export UI [M] [feature: admin]

Asia-only invite management and export button.

### Tasks
- [ ] [wave:1] Create `src/app/api/invites/route.ts` — POST (generate invite token, admin only) + GET (list sent invites, admin only)
- [ ] [wave:1] Add Asia's email as `ADMIN_EMAIL` env var; admin check: `session.user.email === process.env.ADMIN_EMAIL`
- [ ] [wave:2] Create `src/app/admin/invites/page.tsx` — list of invites (token, created, expires, used status) + "Genera nuovo invito" button → copies shareable link to clipboard (blocked by: wave:1)
- [ ] [wave:2] Add "Esporta CSV" button to `/library` header → GET `/api/books/export` → triggers file download (blocked by: wave:1)
- [ ] [wave:2] Add "Admin" link in sidebar (visible only to admin user) → `/admin/invites` (blocked by: wave:1)

### Technical Details

Invite token: `crypto.randomUUID()` + store in `invitation` table with `expiresAt = now + 7 days`.

Shareable link format: `${process.env.NEXT_PUBLIC_APP_URL}/register?token={token}`

Admin guard (server component):
```typescript
const session = await requireAuth(); // redirects if not logged in
if (session.user.email !== process.env.ADMIN_EMAIL) redirect("/library");
```

CSV export trigger (client-side):
```typescript
const res = await fetch("/api/books/export");
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement("a"); a.href = url; a.download = "libreria.csv"; a.click();
```

Invite table columns: Link (copy icon button) | Email (if specified) | Creato il | Scade il | Stato (Attivo / Usato / Scaduto).

### Files to Read
- `src/lib/schema.ts`
- `src/lib/session.ts`
- `src/lib/api-utils.ts`
