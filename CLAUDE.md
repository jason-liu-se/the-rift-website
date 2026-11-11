# CLAUDE.md

Angular + Angular Material app (TypeScript, SCSS) with server rendering, for The
Rift Minecraft SMP (A.K.A. The Rift SMP). Setup, commands, and environment
variables are in `README.md`; framework versions in `package.json`.

## Commands

```bash
npm start                              # dev server (with server rendering)
npm run start:prod                     # dev server with PROD_ .env variables
npm run build                          # production build
npm run preview                        # production build in the local Cloudflare Worker
npm test -- --watch=false              # unit tests, single run
npm test -- --include <path/to/spec>   # one spec file
npm run e2e                            # Playwright e2e + axe (only when asked)
npm run lint / format                  # angular-eslint / prettier
npm run env                            # regenerate src/environments/ (before calling `ng` directly)
```

Scaffold with `npm run ng -- generate component components/<name>`. A Husky
pre-commit hook lints and formats staged files.

## Docs

Read the relevant file before working in its area:

- `.claude/docs/ui-standards.md`: colours, accessibility, keyboard, responsive,
  and SEO rules for templates and styles.
- `.claude/docs/rendering.md`: render modes, server-safe code, and how pages
  load.
- `.claude/docs/seo.md`: route titles, descriptions, `noindex`, and crawler
  files.
- `.claude/docs/testing.md`: unit test setup and e2e mocks and conventions.
- `.claude/docs/environment-variables.md`: how `.env` becomes `environment`.

## Architecture

- **Standalone components**, no `NgModule`. Use `inject()`, not constructor
  injection. App-wide providers are in `src/app/app.config.ts`.
- **Every route renders `PageTemplateComponent`**, which lazy-loads the page
  from `data.loadComponent` into a `<main>` inside the shared shell (navbar,
  optional contact section, footer). Route data flags toggle the shell (defaults
  in `PageTemplateComponent`). Pages read their own values from route data, so a
  variant of a page (e.g. another gallery collection or map) is usually just a
  new route. Every route also needs a `title`, a `data.description`, and a
  render mode in `src/app/app.routes.server.ts`.
- **Components must be server-safe**: touch `window`/browser APIs only in event
  handlers, `afterNextRender`, or behind `isPlatformBrowser`.
- **External services.** The Rift API and BlueMap run separately. Import
  `environment` from `src/environments/` (generated from `.env`); never
  hard-code URLs. Map route data must match BlueMap map ids.
- **API types** come from `src/app/interfaces/api-responses.ts`, a verbatim copy
  of the web-server's contract: never edit it here (README "API contract").
- **Services** (`src/app/services/`) are thin `HttpClient` wrappers returning
  Observables; caching happens in the consuming component.

## Conventions

- Strict TS with `noPropertyAccessFromIndexSignature`: read route data as
  `data['key']`. Selectors use the `app` prefix.
- Production builds enforce bundle and style size budgets (`angular.json`). Keep
  component stylesheets small, and keep page-only imports out of shared code and
  `app.config.ts`.
- Run unit tests whenever useful; they're fast. Never run e2e tests unless the
  user asks; they're slow.

## Engineering standards

- **Version-specific best practices.** Follow the official style guide and
  current patterns for the exact versions in `package.json`. Where existing code
  is outdated, use the modern pattern in new code and raise a wider migration
  with the user.
- **Reuse and design.** Check for existing components, services, utilities, and
  styles before writing new ones; extract duplication into a unit that variants
  compose. Single responsibility, low coupling, pure functions, side effects
  isolated.
- **Clarity.** Descriptive names, small functions, guard clauses, named
  constants (shared ones in `src/app/config/`, otherwise with the owning
  feature). Simple over clever; comment a non-obvious version that's worth
  keeping.
- **Write less code.** Humans review every line. Use what Angular, Material, and
  RxJS provide, and skip speculative code (unused options, "just in case"
  branches, single-caller abstractions).
- **UI.** WCAG 2.2 AA, full keyboard support, mobile-first, and colours only
  from the palette in `src/theme-colours.scss`. Details are in
  `.claude/docs/ui-standards.md`.
- **Dependencies.** Add a package only for substantial, likely-reused, or
  error-prone functionality (e.g. security, date/time, parsing), and justify it
  to the user.
- **File scoping.** Group by feature, nesting related files (e.g.
  `components/news/news-display/`).
- **Tests.** Test real behaviour (inputs, outputs, rendered state, requests) so
  tests fail when it breaks.
- **Scope and debt.** Keep changes scoped. Fix minor debt and remove dead code
  in code you touch; raise major debt or unrelated refactors with the user.
- **Docs.** Update `README.md`, `.claude/docs/`, skills, and `CLAUDE.md` in the
  same change when what they describe changes. Point to code instead of copying
  values (versions, breakpoints, URLs), and don't list Claude tooling here.
