---
paths:
    - "src/**/*.spec.ts"
    - "src/app/testing/**/*"
    - "e2e/**/*"
    - "playwright.config.ts"
---

# Testing

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
| `data.spec.ts`          | API data appears on screen                        |

**Mocks.** No API or BlueMap is needed:

- `e2e/support/mock-api.ts` answers requests in the browser.
- `e2e/support/mock-api-server.ts` (global setup) answers the dev server's
  server-side API calls on the development `API_URL` port, with the same
  fixtures from `src/app/testing/api-fixtures.ts`.

Stop anything using that port, and any server on port 4200, before running.
Playwright reuses a server already on its port, so a stale server (e.g. from the
main checkout) gets tested instead of your code.

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

**Writing a spec**

- Import `test`/`expect` from `e2e/support/test.ts`, which applies the mocks.
- Open pages with `gotoRoute` (`e2e/support/navigation.ts`), and add new routes
  to `e2e/support/routes.ts`.
- Limit a test to one device with the tags in `e2e/support/projects.ts`.

**Known issues**

- Accessibility bugs are listed in `e2e/known-a11y-issues.ts`. Fix new
  violations instead of adding them, and delete entries once fixed (the suite
  fails if one no longer happens). Entries match by CSS selector.
- Keyboard bugs are `test.fail()` tests in `keyboard.spec.ts`; remove the
  `test.fail` once fixed.

A passing run isn't a full audit: axe can't check everything (such as contrast
over images), focus visibility is only checked on the desktop navbar, and the
BlueMap iframe is a placeholder.
