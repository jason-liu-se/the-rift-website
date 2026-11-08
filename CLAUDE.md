# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Overview

Angular + Angular Material SPA (TypeScript, SCSS) for The Rift Minecraft server
community. Node/npm requirements are in `README.md`; framework versions in
`package.json`.

## Commands

```bash
npm ci                                 # install
npm start                              # dev server
npm run build                          # production build (output path in angular.json)
npm test                               # Karma + Jasmine unit tests
npm test -- --include <path/to/spec>   # single spec file
npm test -- --watch=false              # single run (CI-style)
npm run lint / lint:fix                # angular-eslint
npm run format / format:check          # prettier
```

Scaffold with the Angular CLI, e.g.
`npm run ng -- generate component components/<name>`. A Husky pre-commit hook
lints and formats staged files.

## Conventions

- Formatting and lint rules live in `.prettierrc`, `.editorconfig`, and
  `eslint.config.js`. Selectors use the `app` prefix.
- Strict TS with `noPropertyAccessFromIndexSignature`, so route data is read as
  `data['key']`.
- Production builds enforce style size budgets (`angular.json`); keep component
  stylesheets small.

## Architecture

- **Standalone components, no root `NgModule`.** `src/main.ts` calls
  `bootstrapApplication` and pulls in `AppRoutingModule` via
  `importProvidersFrom`. Use `inject()` rather than constructor injection.
- **Every route renders `PageTemplateComponent`.** Each route in
  `src/app/app-routing.module.ts` names its page in `data.component`; the
  template creates it inside the `appPageTemplateHost` directive and wraps it in
  the shared shell (navbar, optional contact section, footer). Route data flags
  toggle the shell (see `PageTemplateComponent` for flags and defaults). Pages
  can read their own values from route data, so a variant of an existing page
  (e.g. another gallery collection or map) is usually just a new route.
- **External services.** A separate The Rift API (news, gallery, downloads) and
  a BlueMap server (embedded maps), neither started by this repo. Endpoints
  differ per environment and live in `src/app/config/constants.ts`; always use
  `Constants`, never hard-coded URLs. Map route data must match BlueMap map ids.
- **Services** (`src/app/services/`) are thin `HttpClient` wrappers returning
  Observables; caching happens in the consuming component. `SafePipe`
  (`src/app/utilities/`) trusts resource URLs for the BlueMap iframes.

## Testing

Components touching routing or HTTP need `provideHttpClient()`,
`provideHttpClientTesting()`, `provideRouter([])`, and
`provideNoopAnimations()`. Anything under `PageTemplateComponent` needs a
stubbed `ActivatedRoute` with `snapshot.data.component`; see
`page-template.component.spec.ts`.

## Engineering standards

Work as a software engineer, not a code generator.

- **Reuse (DRY).** Check for existing components, services, or utilities before
  writing new logic; extract duplication into a modular unit (component,
  service, function, pipe) that variants compose.
- **Design.** Encapsulation, composition, single responsibility; low coupling,
  high cohesion. Prefer pure functions; isolate side effects (HTTP, DOM, global
  state).
- **Clarity.** Descriptive names, small functions, guard clauses, and named
  constants instead of magic values (shared ones in `src/app/config/`, otherwise
  with the owning feature). Choose the simple solution over a clever one (dense
  RxJS chains, compact one-liners); if a non-obvious version is worth keeping,
  comment what it does and why.
- **Write less code.** Humans review every line. Use concise syntax where it
  stays clear, use what Angular/Material/RxJS provide, and skip speculative code
  (unused options, "just in case" branches, single-caller abstractions).
- **Dependencies.** Add a package only for substantial functionality likely to
  be reused soon, or that is costly or error-prone to build (e.g. security,
  date/time, parsing), and justify it to the user.
- **File scoping.** Group by feature, nesting where it keeps related files
  together (e.g. `components/news/news-display/`).
- **Accessibility (WCAG 2.2 AA).** Semantic HTML and Material components over
  clickable `div`s; meaningful `alt` (empty if decorative); accessible names on
  icon-only buttons and iframes; AA contrast; motion is pausable and respects
  `prefers-reduced-motion`.
- **Keyboard.** The whole site works by keyboard alone: logical Tab order, real
  `<button>`/`<a>` elements (no positive `tabindex`), always-visible focus, no
  focus traps outside dialogs/menus (which close on Escape and restore focus),
  and sensible focus on route changes.
- **Responsive.** Mobile-first with `min-width` queries, reusing existing
  breakpoints; relative units and flexible layouts (flexbox, grid, `clamp()`)
  over fixed widths; images and embeds scale to their container. Reflow at 320px
  and 200% zoom without horizontal scroll, 24×24 CSS px minimum targets, nothing
  hover-only. Designs may differ by device, but always check how a change looks
  on other screen sizes; if it doesn't translate smoothly, ask the user whether
  mobile and desktop should diverge or share one modular, scalable approach.
- **Tests.** Test real behaviour (inputs, outputs, rendered state, requests) so
  tests fail when it breaks; never write tests just to pass.
- **Scope and debt.** Keep changes scoped. Fix minor debt and remove dead code
  in code you touch; raise major debt or unrelated refactors with the user.
- **Docs.** Point to where things live in code instead of copying values
  (versions, breakpoints, URLs, flags), so docs don't drift from the code.
