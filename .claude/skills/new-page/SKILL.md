---
name: new-page
description:
    Add a new routed page to The Rift website, or a variant of an existing page.
    Use when asked to add, create, or scaffold a page or route.
argument-hint: <page name or description>
---

Add the page described in: $ARGUMENTS

Follow the architecture in `CLAUDE.md`. Every route renders `PageTemplate` and
lazy-loads its page from `data.loadComponent`.

## 1. New component or new route?

Read `src/app/app.routes.ts` and `src/app/features/`. If an existing page
already does this from route data or a parameter, **add a route only** and skip
to step 3. Gallery collections need nothing: `gallery/:collection` shows
whatever the API lists. If you're not sure, ask the user.

## 2. Generate the page

```bash
npm run ng -- generate component features/<feature>/<name>-page
```

- `<feature>` is the product area the page belongs to: an existing folder in
  `features/`, or a new one named for the area (`features/<name>/`).
- Build the page from existing `src/app/shared/ui/` and its feature's components
  before writing new markup, extending one (a new input or variant) when the
  change fits its purpose.
- Split the page into child components by section or concern, so the page mainly
  composes them. Nest ones only this page uses in its folder
  (`npm run ng -- generate component features/<feature>/<name>-page/<child>`).
  If a piece another feature already has fits, move it to `shared/ui/` and use
  it from both. Follow the `new-component` skill for each.
- If the page needs API data, add or reuse a service in the feature's folder
  (`features/<feature>/`) with endpoints from `environment`, and handle loading,
  empty, and error states.
- If the page reads its own route data, inject `ActivatedRoute` and read it as
  `snapshot.data['key']`.

## 3. Add the route

Add the route to `src/app/app.routes.ts` before the `**` wildcard:

- `component: PageTemplate`
- a unique `title` naming the page (`SeoTitleStrategy` appends " | The Rift")
  and a `data.description` for search results (`.claude/rules/seo.md`)
- `data.loadComponent: () => import('./features/<feature>/<name>-page/<name>-page').then((m) => m.<Name>Page)`,
  plus any shell flags it needs. Check `PageTemplate` for the flags and their
  defaults, and only set flags that differ from the defaults.

If code links to it, add its path to `src/app/core/config/site-paths.ts` (a test
checks each one is a route) and link with that. Give it a `data.renderMode`
(`.claude/docs/rendering.md`): `'server'` if it shows API data, otherwise
`'prerender'`. Keep the page server-safe: read `window` only in event handlers,
`afterNextRender`, or behind `isPlatformBrowser`.

## 4. Navigation

Ask the user whether the page belongs in the navbar
(`src/app/core/layout/navbar/`) or should be linked from another page. Don't
decide this yourself.

## 5. Tests

Replace the generated "should create" spec with tests of real behaviour:
rendered content, the requests the page makes, and how it uses route data. Use
the setup in `.claude/rules/testing.md`. Run:

```bash
npm test -- --watch=false --include src/app/features/<feature>/<name>-page
```

Add the route to `e2e/support/routes.ts` so the e2e and axe tests cover it. Run
the e2e specs for the new route only (`.claude/rules/testing.md` "When to run").

## 6. Finish

- Update `README.md`, `.claude/docs/`, and `.claude/rules/` if they describe
  something this page changes.
- Run `/pre-pr` (or tell the user to run it) before committing.
