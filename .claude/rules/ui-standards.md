---
paths:
    - "src/**/*.html"
    - "src/**/*.scss"
---

# UI standards

## Colours

Every colour comes from the palette in `src/theme-colours.scss` (which
`src/theme.scss` builds the Material theme from).

- Use role names (`$colour-primary` etc.) where a colour plays that role.
- Reuse an existing colour rather than adding a near-duplicate. Derive
  transparent variants from it, e.g. `rgba($colour-primary, 0.9)`.
- Add genuinely new colours to the palette with a descriptive name, never as a
  raw hex/`rgb()` in a component stylesheet. Replace raw literals in styles you
  touch.
- Keep the palette organized: grouped by purpose under comment headings, base
  colours before the role names that reference them, `$colour-<name>` naming, no
  unused colours.

## Components

- Build interactive patterns (menus, tabs, listboxes, selects, accordions, etc.)
  on [Angular Aria](https://angular.dev/guide/aria): headless directives that
  handle keyboard, focus, and ARIA, styled with our own SCSS. Use `@angular/cdk`
  for what Aria doesn't cover (overlays, dialogs, focus traps, drag and drop).
- Angular Material is only for the admin pages. Don't add it elsewhere.
- `src/theme.scss` themes only the Material components the public pages use;
  `src/admin-theme.scss`, a separate stylesheet the admin page loads, themes the
  ones only the admin tools use (keeping them out of every page's CSS). Add a
  component's theme to one of them when you start using it.

## Accessibility (WCAG 2.2 AA)

- Semantic HTML and Aria patterns over clickable `div`s.
- Meaningful `alt` (empty if decorative); accessible names on icon-only buttons
  and iframes.
- AA contrast.
- Motion is pausable and respects `prefers-reduced-motion`.

## Keyboard

The whole site works by keyboard alone:

- Logical Tab order; real `<button>`/`<a>` elements (no positive `tabindex`).
- Always-visible focus.
- No focus traps outside dialogs/menus, which close on Escape and restore focus.
  Exception: an alert dialog over a page that no longer works (the session-ended
  dialog) stays open and offers its own ways out.
- Sensible focus on route changes.
- When the focused element is removed (a dismissed notice, a retry that
  succeeds, content swapped for an error), move focus somewhere sensible
  (`<main>` or the new content's heading); never let it fall to `<body>`.

## Dynamic content

- Announce changes with a live region that's already in the DOM, or the CDK
  `LiveAnnouncer`. A `role="alert"`/`status` element inserted with its text
  already in it often isn't read, and one re-created on every navigation is read
  again each time.
- Put `role="alert"` on the message only, not on a container with buttons, so
  changing a button label doesn't re-read everything.
- Async results: ignore any response but the latest request's (a request counter
  or `switchMap`), not "is this still the current page".

## States and layout

- Every view backed by data has a loading, an empty, and an error state, and
  shows when a refetch is under way instead of leaving stale content looking
  current.
- Show each fact once: don't repeat a date or status in a badge and the text
  beside it.
- Bars and messages that appear on interaction (a selection bar, a hint) take
  reserved space or overlay the page, instead of pushing down the content the
  user is acting on.
- Keep secondary text (hints, metadata) visibly quieter than labels and content.
- On narrow screens, show what a row is for (its name and main status) and move
  the rest into its detail or a menu. Don't stack every column into labelled
  lines.

## Responsive

- Mobile-first `min-width` queries reusing the breakpoints in
  `src/app/core/config/breakpoints.ts`.
- Flexible layouts (flexbox, grid, `clamp()`, relative units) over fixed widths;
  images and embeds scale to their container.
- Reflow at 320px and 200% zoom without horizontal scroll; 24×24 CSS px minimum
  targets; nothing hover-only.
- Every page keeps the page scrollbar's place, so content doesn't shift when the
  scrollbar appears or disappears. A band whose background spans the page (a
  bar, a section's colour or image) includes `fill-scrollbar-gap` (or
  `fixed-fill-scrollbar-gap` if fixed) so its background fills that place
  (`src/scrollbar-gap.scss`).
- Check how a change looks on other screen sizes. If it doesn't translate
  smoothly, ask whether mobile and desktop should diverge or share one scalable
  approach.

## SEO

- One `<h1>` per page and a logical heading order.
- Descriptive link text and real `<a routerLink>` links for navigation.
- Compressed WebP images sized for their use; nothing render-blocking.
- Content and background images use `<app-optimized-image>`
  (`src/app/shared/ui/optimized-image/`), not `<img>` or CSS `background-image`,
  so they're resized. Mark the page's LCP image (e.g. its banner) `priority`,
  and full-screen views `original`. The admin page serves originals (its own
  `IMAGE_LOADER`), and Discord avatars stay plain `<img src>`.
- Route titles and descriptions: see [seo.md](./seo.md).
