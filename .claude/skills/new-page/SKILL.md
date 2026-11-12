---
name: new-page
description:
    Add a new routed page to The Rift website, or a variant of an existing page
    (e.g. another gallery collection or BlueMap map). Use when asked to add,
    create, or scaffold a page or route.
argument-hint: <page name or description>
---

Add the page described in: $ARGUMENTS

Follow the architecture in `CLAUDE.md`. Every route renders
`PageTemplateComponent` and lazy-loads its page from `data.loadComponent`.

## 1. New component or new route?

Read `src/app/app.routes.ts` and `src/app/pages/`. If an existing page already
does this from route data (e.g. `GalleryShowcasePageComponent` with
`collection`, `BlueMapPageComponent` with `mapName`), **add a route only** and
skip to step 3. If you're not sure, ask the user.

## 2. Generate the page

```bash
npm run ng -- generate component pages/<name>-page
```

- Build the page from existing `src/app/components/` before writing new markup.
  If a piece is reusable, make it its own component under `components/`.
- If the page needs API data, add or reuse a service in `src/app/services/` with
  endpoints from `environment`, and handle loading, empty, and error states.
- If the page reads its own route data, inject `ActivatedRoute` and read it as
  `snapshot.data['key']`.

## 3. Add the route

Add the route to `src/app/app.routes.ts` before the `**` wildcard:

- `component: PageTemplateComponent`
- a unique `title` naming the page (`SeoTitleStrategy` appends " | The Rift")
  and a `data.description` for search results (`.claude/rules/seo.md`)
- `data.loadComponent: () => import('./pages/<name>-page/<name>-page.component').then((m) => m.<Name>PageComponent)`,
  plus any shell flags it needs. Check `PageTemplateComponent` for the flags and
  their defaults, and only set flags that differ from the defaults.

Then give it a render mode in `src/app/app.routes.server.ts`
(`.claude/docs/rendering.md`): `RenderMode.Server` if it shows API data,
otherwise `RenderMode.Prerender`. Keep the page server-safe: read `window` only
in event handlers, `afterNextRender`, or behind `isPlatformBrowser`.

## 4. Navigation

Ask the user whether the page belongs in the navbar
(`src/app/components/navbar/`) or should be linked from another page. Don't
decide this yourself.

## 5. Tests

Replace the generated "should create" spec with tests of real behaviour:
rendered content, the requests the page makes, and how it uses route data. Use
the setup in `.claude/rules/testing.md`. Run:

```bash
npm test -- --watch=false --include src/app/pages/<name>-page
```

Add the route to `e2e/support/routes.ts` so the e2e and axe tests cover it.
Don't run `npm run e2e` unless the user asks for it.

## 6. Finish

- Update `README.md`, `.claude/docs/`, and `.claude/rules/` if they describe
  something this page changes.
- Run `/pre-pr` (or tell the user to run it) before committing.
