---
paths:
    - "src/**/*.spec.ts"
    - "src/app/testing/**/*"
    - "e2e/**/*"
    - "playwright.config.ts"
---

# Testing

## What to test

A test is worth having if it catches a regression a user or caller would notice.
Every test is also code someone must fix by hand when the UI changes, so write
fewer, sturdier ones (#128).

- **Behaviour, not markup.** Assert what the user can do (opening an item
  reaches its editor) or what a function returns or sends, not which element
  does it, CSS classes, DOM structure, element counts, or exact wording (unless
  the wording is the behaviour, like an error message).
- **Unit tests for business logic, integration tests for UI.** Unit tests cover
  edge cases in business logic: functions and services (validation, conflicts,
  merging, bulk summaries). Edge cases in UI behaviour (what an action leads to,
  what shows after a failure) belong in integration (e2e) tests. Don't cover the
  same behaviour at both levels.
- **Find elements the way a user would**: by role and the action's accessible
  name, loosely enough that moving the action to another element (a button
  replaced by a clickable row) doesn't break the test.
- **One test per behaviour**, not per control or combination of states. Put the
  branches of one piece of logic (nothing changed, conflict, partial failure) in
  one table-driven unit test of that logic.
- **Before adding a test**, ask whether a regression there would otherwise ship
  unnoticed. If not, skip it. When a change makes a test pin implementation
  rather than behaviour, rewrite or delete it.
- **Keep the total proportionate.** Weigh each test against the time someone
  without AI would spend keeping it passing as the code changes.

## Unit tests (Vitest)

`*.spec.ts` files sit next to the code they test and run in jsdom without
zone.js:

- No `fakeAsync`/`tick`: use `async`/`await` or Vitest fake timers.
- `vi.spyOn` calls the real method unless mocked with `.mockImplementation()`.
- Provide only what the component uses: `provideRouter(...)` for router links
  (with `ANY_URL_ROUTES` to assert navigation), and `provideHttpClient()` plus
  `provideHttpClientTesting()` for HTTP.
- Anything under `PageTemplateComponent` needs a stubbed `ActivatedRoute` with
  `snapshot.data.loadComponent`; see `page-template.component.spec.ts`.
- Use the helpers in `src/app/testing/` before defining new ones.

## End-to-end tests (Playwright)

Specs in `e2e/` run every route on desktop and mobile in Chromium.

| Spec                    | Checks                                            |
| ----------------------- | ------------------------------------------------- |
| `accessibility.spec.ts` | axe scan for WCAG 2.2 A/AA                        |
| `keyboard.spec.ts`      | Tab order, visible focus, focus on navigation     |
| `responsive.spec.ts`    | No horizontal scroll at narrow widths / 200% zoom |
| `data.spec.ts`          | API data appears on screen; content version reuse |
| `error-states.spec.ts`  | Error state and retry (focus), 404 page           |

**Mocks.** No API or BlueMap is needed:

- `e2e/support/mock-api.ts` answers requests in the browser.
- `e2e/support/mock-api-server.ts` (global setup) answers the dev server's
  server-side API calls on the development `API_URL` port, with the same
  fixtures from `src/app/testing/api-fixtures.ts`.

Stop anything using that port, and any server on port 4200, before running. That
includes a local web-server (`node --watch ... src/index.ts`) holding the API
port: stop it, run the specs, then tell the user so they can restart it. Don't
stop other processes. Playwright reuses a server already on its port, so a stale
server (e.g. from the main checkout) gets tested instead of your code.

**When to run.** The full suite is slow; run it before merging High-risk or
integration work (see the `orchestrate` skill). Otherwise run only what the
change touches, on one device unless layout differs:

```bash
npm run e2e -- e2e/accessibility.spec.ts e2e/keyboard.spec.ts --project=desktop -g "/news"
```

**Parallel worktrees.** Give each worktree its own dev server and mock API
ports, so runs don't collide or test another checkout:

```bash
E2E_PORT=4301 DEV_PUBLIC_API_URL=http://localhost:4101 npm run e2e -- ...
```

**Quick visual check** (no suite): start `npm start -- --port <port>` in the
background, then
`npx playwright screenshot --device="Pixel 7" http://localhost:<port>/<route> <file>.png`
(drop `--device` for desktop) and read the image. Without the mock API, pages
show their API-failure state.

**PR screenshots.** Any UI-facing change shows the affected feature in its PR,
on desktop and mobile, before and after where it changed something existing
(capture "before" from the base branch). Capture with the mocks applied:

```bash
PR_SCREENSHOTS='/news, /admin|.admin-sidebar' npm run e2e -- e2e/pr-screenshots.spec.ts
node scripts/pr-screenshots/upload.mjs test-results/pr-screenshots/*.png
```

Each entry is a route, optionally `|<CSS selector>` to crop to the feature. For
a state that needs interaction (an open menu, an error state), take it in a
temporary spec and don't commit it. The upload prints Markdown image links for a
`## Screenshots` section in the PR description (the images live on the
`pr-screenshots` branch, never in the PR's commits).

**Looking at the UI.** Screenshots are for reviewing the UI, not only for the
PR. For a new or changed view, look at every capture yourself, desktop and
mobile, in each state the view has: loading, empty, error, populated, and
mid-action (something selected, a dialog or menu open, a conflict shown).
Critique each against `.claude/rules/ui-standards.md` and fix what looks wrong
before opening the PR: wasted space, awkward wrapping, layout shift, duplicated
information, controls that look like something else, stacked mobile layouts that
bury the content. Capture states that need interaction in a temporary spec (with
the mocks and `signIn` from `e2e/support/auth.ts`), or explore them with the
Playwright MCP browser tools when a real local API is running.

**Writing a spec**

- Import `test`/`expect` from `e2e/support/test.ts`, which applies the mocks.
- Open pages with `gotoRoute` (`e2e/support/navigation.ts`), and add new routes
  to `e2e/support/routes.ts`.
- Limit a test to one device with the tags in `e2e/support/projects.ts`.
- Cover a user flow once, through to its outcome (the item is published, the
  list shows it). Test a variant end to end only when it takes a different path
  through several units, like publishing an edit with nothing changed.

**Known issues**

- Accessibility bugs are listed in `e2e/known-a11y-issues.ts`. Fix new
  violations instead of adding them, and delete entries once fixed (the suite
  fails if one no longer happens). Entries match by CSS selector.
- Keyboard bugs are `test.fail()` tests in `keyboard.spec.ts`; remove the
  `test.fail` once fixed.

A passing run isn't a full audit: axe can't check everything (such as contrast
over images), focus visibility is only checked on the desktop navbar, and the
BlueMap iframe is a placeholder.
