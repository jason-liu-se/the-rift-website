# CLAUDE.md

## Overview

Angular + Angular Material SPA (TypeScript, SCSS) for The Rift Minecraft server
community. Node/npm requirements are in `README.md`; framework versions in
`package.json`.

## Commands

```bash
npm ci                                 # install
npm start                              # dev server
npm run start:prod                     # dev server with prod .env variables
npm run build                          # production build (output path in angular.json)
npm test                               # Vitest unit tests (jsdom)
npm test -- --include <path/to/spec>   # single spec file
npm test -- --watch=false              # single run (CI-style)
npm run e2e                            # Playwright e2e + axe accessibility tests
npm run lint / lint:fix                # angular-eslint
npm run format / format:check          # prettier
```

Scaffold with `npm run ng -- generate component components/<name>`. A Husky
pre-commit hook lints and formats staged files.

## Conventions

- Lint and format config: `.prettierrc`, `.editorconfig`, `eslint.config.js`.
  Selectors use the `app` prefix.
- Strict TS with `noPropertyAccessFromIndexSignature`: read route data as
  `data['key']`.
- Production builds enforce style size budgets (`angular.json`); keep component
  stylesheets small.

## Architecture

- **Standalone components, no root `NgModule`.** `src/main.ts` bootstraps with
  `provideRouter` and the routes in `src/app/app.routes.ts`. Use `inject()`, not
  constructor injection.
- **Every route renders `PageTemplateComponent`.** It creates the page named in
  the route's `data.component` inside the `appPageTemplateHost` directive, in a
  `<main>` (focused after in-app navigation) wrapped by the shared shell
  (navbar, optional contact section, footer). Route data flags toggle the shell
  (flags and defaults in `PageTemplateComponent`). Pages read their own values
  from route data, so a variant of an existing page (e.g. another gallery
  collection or map) is usually just a new route.
- **External services.** The Rift API (news, gallery, downloads) and a BlueMap
  server (embedded maps) run separately from this repo. Endpoints come from the
  gitignored `.env` (see README), which `scripts/environments/generate.mjs`
  turns into Angular environment files on `npm ci` and before
  `start`/`build`/`test`/`e2e`; run `npm run env` yourself before calling `ng`
  directly. Only `PUBLIC_` variables are read: `PUBLIC_X` becomes
  `environment.X`, `DEV_`/`PROD_` prefixes override per environment, and
  `IEnvironment` is generated from the keys. A new setting needs only `.env` and
  the README `.env` example, plus a `PROCESSORS` entry in
  `scripts/environments/config.mjs` if it needs checking (e.g. URLs). Import
  `environment` from `src/environments/`; never hard-code URLs. Map route data
  must match BlueMap map ids.
- **Services** (`src/app/services/`) are thin `HttpClient` wrappers returning
  Observables; caching happens in the consuming component. `SafePipe`
  (`src/app/utilities/`) trusts resource URLs for the BlueMap iframes.

## Testing

Run unit tests (`npm test`) whenever useful; they're fast. Never run e2e tests
(`npm run e2e`) unless the user explicitly asks; they're slow.

Unit tests use Vitest globals in jsdom without zone.js: no `fakeAsync`, and
`vi.spyOn` calls through unless mocked (see README "Testing"). Components
touching routing or HTTP need `provideHttpClient()`,
`provideHttpClientTesting()`, `provideRouter([])`, and
`provideNoopAnimations()`. Anything under `PageTemplateComponent` needs a
stubbed `ActivatedRoute` with `snapshot.data.component`; see
`page-template.component.spec.ts`.

E2E specs in `e2e/` import `test`/`expect` from `e2e/support/test.ts`, which
mocks the API and BlueMap, and open pages with `gotoRoute`
(`e2e/support/navigation.ts`). New routes go in `e2e/support/routes.ts`. Fix new
axe violations rather than adding them to `e2e/known-a11y-issues.ts`, and delete
entries there once fixed.

## Engineering standards

- **Version-specific best practices.** Follow the official style guide and
  current patterns for the exact versions in `package.json` (Angular, Material,
  RxJS, TypeScript), not generic, other-framework, or deprecated ones. Where
  existing code is outdated, use the modern pattern in new code and raise a
  wider migration with the user.
- **Reuse and design.** Check for existing components, services, utilities, and
  styles before writing new ones; extract duplication into a unit (component,
  service, function, pipe) that variants compose. Single responsibility, low
  coupling; prefer pure functions and isolate side effects (HTTP, DOM, global
  state).
- **Clarity.** Descriptive names, small functions, guard clauses, and named
  constants instead of magic values (shared ones in a file under
  `src/app/config/`, created when first needed; otherwise with the owning
  feature). Prefer simple over clever (dense RxJS chains, compact one-liners);
  if a non-obvious version is worth keeping, comment what it does and why.
- **Write less code.** Humans review every line. Use concise syntax where it
  stays clear, use what Angular/Material/RxJS provide, and skip speculative code
  (unused options, "just in case" branches, single-caller abstractions).
- **Colours.** The design is colourful, but every colour comes from the palette
  in `src/theme-colours.scss` (which `src/theme.scss` builds the Material theme
  from), using role names (`$colour-primary` etc.) where a colour plays that
  role. Reuse an existing colour rather than adding a near-duplicate shade, and
  derive transparent variants from it (e.g. `rgba($colour-primary, 0.9)`). Add
  genuinely new colours to the palette with a descriptive name, never as a raw
  hex/`rgb()` in a component stylesheet; replace raw literals in styles you
  touch. Keep the palette organized: grouped by purpose (e.g. brand, neutrals,
  text/backgrounds, overlays/shadows) under comment headings, base colours
  before the role names that reference them, consistent `$colour-<name>` naming,
  and no unused colours.
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
- **Responsive.** Mobile-first `min-width` queries reusing existing breakpoints;
  flexible layouts (flexbox, grid, `clamp()`, relative units) over fixed widths;
  images and embeds scale to their container. Reflow at 320px and 200% zoom
  without horizontal scroll; 24×24 CSS px minimum targets; nothing hover-only.
  Check how a change looks on other screen sizes; if it doesn't translate
  smoothly, ask whether mobile and desktop should diverge or share one scalable
  approach.
- **Tests.** Test real behaviour (inputs, outputs, rendered state, requests) so
  tests fail when it breaks; never write tests just to pass.
- **Scope and debt.** Keep changes scoped. Fix minor debt and remove dead code
  in code you touch; raise major debt or unrelated refactors with the user.
- **Docs.** Update `README.md` (and `CLAUDE.md` where relevant) in the same
  change whenever setup, commands, requirements, structure, or behaviour it
  describes changes. Point to where things live in code instead of copying
  values (versions, breakpoints, URLs, flags) so docs don't drift. Don't list
  Claude tooling (hooks, skills, agents, MCP servers) in `CLAUDE.md`; Claude
  discovers these on its own.
