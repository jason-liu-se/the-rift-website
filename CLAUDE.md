# CLAUDE.md

Angular app (TypeScript, SCSS) with server rendering, for The Rift Minecraft SMP
(A.K.A. The Rift SMP). Setup, commands, and environment variables are in
`README.md`; framework versions in `package.json`.

## Commands

```bash
npm start                              # dev server (with server rendering)
npm run start:prod                     # dev server with PROD_ .env variables
npm run build                          # production build
npm run preview                        # production build in the local Cloudflare Worker
npm test -- --watch=false              # unit tests, single run
npm test -- --include <path/to/spec>   # one spec file
npm run e2e                            # Playwright e2e + axe (targeted; see Conventions)
npm run lint / format                  # angular-eslint / prettier
npm run env                            # regenerate src/environments/ (before calling `ng` directly)
```

Scaffold with `npm run ng -- generate component features/<feature>/<name>` (or
`shared/ui/<name>`). A Husky pre-commit hook lints and formats staged files.

## Docs and rules

`.claude/docs/` holds context every session needs, imported below.
`.claude/rules/` holds standards for one area (naming, component design,
templates and styles, tests, SEO, environment variables); each sets `paths`
frontmatter so it loads only when matching files are read or edited.

@.claude/docs/rendering.md

## Architecture

- **Standalone components**, no `NgModule`. Use `inject()`, not constructor
  injection. App-wide providers are in `src/app/app.config.ts`.
- **Every route renders `PageTemplate`**, which lazy-loads the page from
  `data.loadComponent` into a `<main>` inside the shared shell (navbar, optional
  contact section, footer). Route data flags toggle the shell (defaults in
  `PageTemplate`). Pages read their own values from route data or parameters, so
  a variant of a page is usually just a new route, or none (new gallery
  collections come from the API through `gallery/:collection`). Every route also
  needs a `title`, a `data.description`, and a render mode in
  `src/app/app.routes.server.ts`.
- **External services.** The Rift API and BlueMap run separately. Import
  `environment` from `src/environments/` (generated from `.env`); never
  hard-code URLs.
- **API types** come from `src/app/core/api/api-*.ts` (`api-requests.ts` what
  each endpoint takes, `api-responses.ts` what it sends), verbatim copies of the
  web-server's contract: never edit them here (README "API contract").
- **Services** sit with what they serve: a feature's at its folder's root
  (`features/news/`), app-wide ones in `core/` by area (`core/auth/`). API
  services are thin `HttpClient` wrappers returning Observables; caching happens
  in the consuming component.
- **UI components.** Build new interactive components on Angular Aria (with
  `@angular/cdk` for overlays and dialogs), styled with our own SCSS. Angular
  Material may only be used on admin pages. Details in
  `.claude/rules/ui-standards.md`.

## Conventions

- Strict TS with `noPropertyAccessFromIndexSignature`: read route data as
  `data['key']`. Selectors use the `app` prefix.
- Production builds enforce bundle and style size budgets (`angular.json`). Keep
  component stylesheets small, and keep page-only imports out of shared code and
  `app.config.ts`.
- Run unit tests whenever useful; they're fast. E2e tests are slow: run only the
  specs, routes, and device a UI, keyboard, routing, or data-display change
  touches, and the full suite only before merging high-risk or integration work
  (`.claude/rules/testing.md`).

## Git workflow

- Work on a branch, never `main`: `<type>/<issue>-<slug>`, `fix/…`,
  `refactor/…`. Sub-issues branch from, and open PRs into, the parent issue's
  branch.
- When a task is done and verified, commit in logical steps, push, and open a PR
  (`Closes #<n>`, summary, decisions, testing with what wasn't run, risk, and
  screenshots of the affected feature for any UI-facing change; see
  `.claude/rules/testing.md`). Open it as a draft when unsure. Don't wait to be
  asked; the PR is the review.
- Keep each PR reviewable: one concern, and ideally under about 500 lines of
  non-test code. Split a bigger feature into stacked PRs that each work on their
  own.
- Merge your own PR only when it's low risk and you're confident (the
  `orchestrate` skill's tiers), CI passed, and review left nothing Critical or
  Important. Everything else waits for the user. **Auto-merge into `main` (which
  deploys): off.** Merging into feature branches is fine.
- Never force-push or push to `main` directly.
- Several independent tasks can run in parallel agents and worktrees
  (`.worktreeinclude` copies `.env`; run `npm ci` in a new worktree).

## Engineering standards

- **Version-specific best practices.** Follow the official style guide and
  current patterns for the exact versions in `package.json`. Where existing code
  is outdated, use the modern pattern in new code and raise a wider migration
  with the user.
- **Design before building.** For a feature that adds more than a few components
  or services, or a new pattern, first write a short design and get the user's
  OK: the component tree and what each part owns, where each piece of state
  lives (route, service, or component), how data flows, and how writes are
  sequenced. Update it when the code needs to diverge.
- **Reuse and design.** Before writing UI or logic, check for existing
  components, services, utilities, and styles. Prefer, in order: reuse it;
  extend it (a new input or variant) when the change fits its purpose; otherwise
  create a new unit. When new and existing code share markup or logic, extract
  it into a shared component, service, or pure function and switch both to it,
  in the same change. Split pages and large components into child components by
  responsibility (one section or concern each), even with a single caller, so a
  page mainly composes components. Single responsibility, low coupling, pure
  functions, side effects isolated. The concrete rules (state, data flow,
  declaring facts once, variants, when to split) are in
  `.claude/rules/component-design.md`.
- **Clarity.** Descriptive names (`.claude/rules/naming.md`), small functions,
  guard clauses, named constants (in `src/app/core/config/` if shared or likely
  to be tweaked, like page sizes, links, or seasons, so editors can find them;
  otherwise with the owning feature). Simple over clever; comment a non-obvious
  version that's worth keeping.
- **Comments.** Comment only what the code can't say (why, a non-obvious
  constraint), in as few words as it takes. The more comments there are, the
  more reviewers skim them and miss the ones that matter.
- **Write less code.** Humans review every line. Use what Angular, Aria, the
  CDK, and RxJS provide, and skip speculative code (unused options, "just in
  case" branches, wrappers or helpers that add indirection without owning a
  responsibility).
- **UI.** WCAG 2.2 AA, full keyboard support, mobile-first, and colours only
  from the palette in `src/theme-colours.scss`. Details are in
  `.claude/rules/ui-standards.md`. UI isn't done until you've looked at it on
  desktop and mobile in each state it has, and fixed what looks wrong.
- **Dependencies.** Add a package only for substantial, likely-reused, or
  error-prone functionality (e.g. security, date/time, parsing), and justify it
  to the user.
- **File scoping.** `src/app/` has three areas (README "Project structure"):
  `core/` (app-wide singletons the app can't run without: API, auth, config,
  `layout/` for the shell every route renders, SEO), `shared/` (reusable UI and
  pure utilities, no business logic), and `features/` (one folder per product
  area). Folders say which area code belongs to; never add type folders
  (`components/`, `services/`). In a feature, each page has its own folder
  (`features/gallery/gallery-showcase-page/`) with its children nested inside,
  and the feature's services, guards and pure functions sit at its root. A
  component moves to `shared/ui/`, in the same change, once another feature
  needs it. Imports only flow downward (ESLint enforces it):
  `features → core, shared`; `core → core, shared`; `shared → shared, core`.
  core and shared never import features, a public feature never imports another
  (admin may import public features' display components and API services, since
  it previews and edits them), and only `app.routes` and `app.ts` import
  `core/layout`.
- **Tests.** Few and sturdy: test behaviour a user or caller relies on (function
  results, requests sent, where an action leads), not markup, so tests fail when
  behaviour breaks and survive UI changes (`.claude/rules/testing.md` "What to
  test").
- **Scope and debt.** Keep changes scoped. Fix minor debt and remove dead code
  in code you touch; raise major debt or unrelated refactors with the user.
- **Docs.** Update `README.md`, `.claude/docs/`, `.claude/rules/`, skills, and
  `CLAUDE.md` in the same change when what they describe changes. Point to code
  instead of copying values (versions, breakpoints, URLs), and don't list Claude
  tooling here.
- **Keep docs brief.** The README holds what's needed to set up, run, and manage
  the project (requirements, environment, commands, operational tasks), plus
  anything that helps a reader understand the codebase quicker (e.g. project
  structure). Describe a feature in a sentence and link to the code or
  `.claude/docs/` for how it works; explain only significant design choices,
  trade-offs, or edge cases. Prefer tables and short bullets, and cut any
  sentence a maintainer wouldn't miss.
