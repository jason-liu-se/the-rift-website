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
  `eslint.config.js` (tabs; Markdown is hard-wrapped). Selectors use the `app`
  prefix.
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
  writing new logic. Extract duplicated logic into a modular unit (component,
  service, class, function, pipe) that variants build on or compose.
- **Design.** Apply OOP principles where they fit (encapsulation, composition,
  single responsibility), with low coupling and high cohesion. Prefer pure
  functions; keep side effects (HTTP, DOM, global state) isolated.
- **Readability.** Descriptive names, small focused functions, guard clauses
  over deep nesting, and named constants instead of magic strings/numbers
  (shared ones in `src/app/config/`, otherwise with the owning feature).
- **Clarity first.** Code must be easy to understand, not just easy to read.
  Choose the simple solution over a clever one (dense RxJS chains, clever
  reductions, compact one-liners); if the elegant version is worth keeping but
  not obvious, comment what it does and why.
- **Write less code.** Humans review every line. Use concise features where they
  stay clear (arrow functions, destructuring, `?.`, `??`, array methods), use
  what Angular/Material/RxJS already provide, and don't add speculative code
  (unused options, "just in case" branches, single-caller abstractions).
- **Dependencies.** Don't add a package for something you could write in a few
  lines. Add one only if it offers substantial functionality likely to be reused
  soon, or would be costly or error-prone to build (e.g. security, date/time,
  complex parsing), and justify it to the user.
- **File scoping.** Group by feature, not just technical type; nest within a
  category when it keeps related files together (e.g.
  `components/news/news-display/`).
- **Tests.** Test real behaviour and invariants (inputs, outputs, rendered
  state, requests) so the test fails when that behaviour breaks; never write
  tests just to pass.
- **Scope, tech debt, dead code.** Keep changes scoped to the task. Fix minor
  tech debt in code you're already touching; raise major debt or unrelated
  refactors with the user instead. Remove dead code (unused imports, functions,
  commented-out blocks) when safe.
