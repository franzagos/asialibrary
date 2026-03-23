---
name: frontend-design
description: Create distinctive, production-grade UI with high design quality. Use this skill when building pages, components, layouts, or any visible UI. Generates polished interfaces that avoid generic AI aesthetics.
---

This skill guides the creation of frontend interfaces that feel genuinely designed — not auto-generated. Every screen should look intentional.

The user provides a UI requirement: a page, component, dashboard, or layout to build.

## Design Thinking (do this before writing any code)

Understand the context and commit to a clear aesthetic direction:

- **Purpose**: What does this screen do? What's the user trying to accomplish?
- **Tone**: Pick one and commit. Examples: crisp/editorial, warm/friendly, bold/confident, minimal/focused, premium/refined. Make a choice — do not default to "neutral."
- **Hierarchy**: What is the most important element on this screen? Design toward that. Everything else is secondary.
- **Differentiation**: What will make this screen feel considered rather than generated?

## This stack — use it properly

- **shadcn/ui components first**: Always check what exists before building from scratch. Use `Card`, `Button`, `Badge`, `Dialog`, `Table`, `Tabs`, etc. Install missing ones with `pnpm dlx shadcn@latest add <name>`.
- **Tailwind 4 tokens**: Use semantic tokens — `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border`, `ring`. These handle dark mode automatically.
- **Dark mode**: Every component must work in both modes. Never hardcode `#ffffff` or `#000000`.
- **Typography**: Use `font-semibold` / `font-medium` for hierarchy. Use `text-muted-foreground` for secondary text. Size contrast matters — don't make everything the same size.

## What makes UI good vs. generic

**Good:**
- Clear visual hierarchy — the user's eye knows where to go first
- Consistent spacing — generous padding, breathing room between sections
- Functional empty states — explain what goes here and how to add it
- Purposeful use of color — one accent, used intentionally
- Every interactive element looks clickable (hover states, cursor-pointer)
- Error and loading states designed, not an afterthought

**Generic (avoid):**
- Everything the same size and weight
- Cards with no visual hierarchy inside them
- No empty states — just a blank screen
- Purple gradients on white backgrounds
- Placeholder icons with no labels
- Flat tables with no row hover states
- Forms with no validation feedback

## Required for every screen

1. **Empty state**: If a list or table can be empty, design the empty state. Show an icon, a message, and a CTA.
2. **Loading state**: Skeleton loaders or a spinner — never a blank flash.
3. **Error state**: If something can fail, show a message. Don't leave the user wondering.
4. **All actions**: If the spec says users can add, edit, or delete something — all three must be in the UI. Don't leave out delete buttons or edit flows.
5. **Mobile-aware**: Use responsive Tailwind classes (`sm:`, `md:`, `lg:`). Tables scroll horizontally on mobile.

## Layout patterns to use

- **Dashboard shell**: Sidebar + main content. Sidebar has navigation, user info at the bottom.
- **Page header**: Title + subtitle + primary action button (top right). Consistent across pages.
- **List/grid toggle**: For content-heavy pages, offer both views when it makes sense.
- **Stat cards**: For dashboards — 3-4 cards with a number, label, and optional trend indicator.
- **Data tables**: Use `border-b` rows, `hover:bg-muted/50` on rows, sticky header when long.

## Spacing and composition

- Section padding: `px-6 py-8` or `p-6` — never `p-2` for page-level content
- Card padding: `p-6` minimum
- Stack gap: `space-y-6` between major sections, `space-y-4` within a card
- Inline gap: `gap-3` or `gap-4` between sibling elements

## Never do this

- Build a page with no navigation back to the main area
- Leave list items with no way to interact (no edit, no delete)
- Use raw `<div>` where a `<Card>` or `<Button>` would be correct
- Skip the page header — every page needs a title
- Design only the happy path — empty/error/loading states are not optional
