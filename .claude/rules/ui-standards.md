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

## Material theme

`src/theme.scss` themes only the Material components in use. Add a component's
theme there when you start using one.

## Accessibility (WCAG 2.2 AA)

- Semantic HTML and Material components over clickable `div`s.
- Meaningful `alt` (empty if decorative); accessible names on icon-only buttons
  and iframes.
- AA contrast.
- Motion is pausable and respects `prefers-reduced-motion`.

## Keyboard

The whole site works by keyboard alone:

- Logical Tab order; real `<button>`/`<a>` elements (no positive `tabindex`).
- Always-visible focus.
- No focus traps outside dialogs/menus, which close on Escape and restore focus.
- Sensible focus on route changes.

## Responsive

- Mobile-first `min-width` queries reusing the breakpoints in
  `src/app/config/breakpoints.ts`.
- Flexible layouts (flexbox, grid, `clamp()`, relative units) over fixed widths;
  images and embeds scale to their container.
- Reflow at 320px and 200% zoom without horizontal scroll; 24×24 CSS px minimum
  targets; nothing hover-only.
- Check how a change looks on other screen sizes. If it doesn't translate
  smoothly, ask whether mobile and desktop should diverge or share one scalable
  approach.

## SEO

- One `<h1>` per page and a logical heading order.
- Descriptive link text and real `<a routerLink>` links for navigation.
- Compressed WebP images sized for their use; nothing render-blocking.
- Route titles and descriptions: see [seo.md](./seo.md).
