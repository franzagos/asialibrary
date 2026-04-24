# Asia's Library

## Summary
A private, invite-only web app where Asia and her invited users each manage their own personal book database. Books are added by photographing the cover; AI automatically identifies the book and enriches it with title, author, year, edition, description, and current market price. Books are organized by category and searchable/filterable by tags. The library can be exported as CSV.

## Users
- **Asia (admin)**: the only person who can invite new users. Has full access to her own library and can see other users' libraries.
- **Invited users**: can add, edit, and delete books in their own library only. Cannot access other users' libraries. Cannot invite others.

## Auth
- Email/password only (no Google OAuth needed)
- Invite-only: only Asia can send invite links via the admin panel. Self-registration is disabled.
- First login: user lands on their empty library (`/library`) with a "Add your first book" empty state CTA.

## Core Features
1. **Invite system** — Asia generates invite links from an admin panel; invited users register via that unique link (one-time use, expires in 7 days)
2. **AI book recognition from photo** — user uploads a photo; OpenRouter vision model (google/gemini-2.0-flash) identifies title, author, year, edition; then Perplexity sonar-pro enriches with description and current market price via web search
3. **Book library with categories and tags** — books belong to one category (e.g. Moda, Design, Arte, Fotografia, Architettura, Altro) and can have multiple free-form tags; sidebar shows categories as filters
4. **Dual view: grid + table** — toggle between a cover grid view and a filterable/sortable table view; both support filtering by category, tag, and free-text search
5. **Book detail page** — full book record: cover photo, title, author, year, edition, description, market price, personal notes, purchase status, purchase location; editable after creation
6. **CSV export** — export the authenticated user's entire library as a CSV file

## Data Model
- `book` — belongs to a user (userId); fields: title, author, year, edition, description, marketPrice, coverUrl, personalNotes, purchaseStatus (enum: owned/wishlist/lent/sold), purchaseLocation, categoryId, createdAt, updatedAt
- `category` — predefined list: id, name, slug (e.g. "moda", "design", "arte")
- `book_tag` — junction: bookId + tag (text); a book can have many tags
- `invitation` — token (unique), email (nullable), createdBy (userId = Asia), usedAt, expiresAt, used (boolean)

## Key Screens
- `/login` — centered login form (existing, needs minor restyling)
- `/register?token=xxx` — registration form, only accessible with valid invite token
- `/library` — main screen: sidebar (categories) + toggle grid/table + search bar + filter chips
- `/library/[id]` — book detail: full info, edit inline, delete
- `/library/upload` — upload flow: photo drop zone → AI processing → review/edit form → save
- `/admin/invites` — Asia-only: list of sent invites, generate new invite link (copy to clipboard)

## Design Direction
Inspired by Circle.so: clean, organized, content-first. Neutral base (white `#FFFFFF`, light gray `#F5F4F2`, dark text `#1A1A1A`). Accent palette inspired by Matisse: terracotta `#C4614A`, warm ochre `#D4A853`, sage green `#7A9E7E`, dusty coral `#E8896A`. Light mode only. Sidebar fixed on desktop, drawer on mobile. Typography: clean sans-serif (system font stack). Cards have soft rounded corners (rounded-xl). Buttons use terracotta as primary accent. No animations beyond subtle hover states. Mobile-first layout.

## AI Integration
- **Vision recognition** (OpenRouter, model: `google/gemini-2.0-flash`): receives the uploaded image as base64; returns structured JSON with title, author, year, edition
- **Web enrichment** (OpenRouter, model: `perplexity/sonar-pro`): receives title + author; returns description (2-3 sentences) and current market price (average in EUR from web search)
- Both calls happen server-side in `/api/books/identify`
- User reviews the pre-filled form before saving — all fields are editable

## Error Handling
- Photo not recognized: show "Non riesco a identificare il libro — compila manualmente" with all fields blank but editable
- Web enrichment fails: save without price/description, show warning "Informazioni aggiuntive non disponibili"
- Invalid invite token: show "Link non valido o scaduto" on the register page
- Empty library: show illustration + "Aggiungi il tuo primo libro" CTA button
- Network errors on upload: show toast error, allow retry

## Acceptance Criteria
- [ ] Invited users can register only with a valid, unused, non-expired invite token
- [ ] Uploading a book photo triggers AI recognition and pre-fills the form
- [ ] User can edit all pre-filled fields before saving
- [ ] Books display in both grid and table view, filterable by category and tag
- [ ] Book detail page shows all fields and allows editing
- [ ] CSV export downloads a file with all the user's books
- [ ] Admin invite page is only accessible to Asia's account
- [ ] App is fully functional and visually complete on 375px mobile viewport
