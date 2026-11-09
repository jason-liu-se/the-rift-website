# The Rift Website

The website for The Rift Minecraft server community: an Angular + Angular
Material single-page app (versions in [`package.json`](./package.json)).

## Requirements

- **Node.js** at the version in [`.nvmrc`](./.nvmrc) (`nvm use`)
- **npm 11+** (npm 10 can't resolve the Angular dependencies)
- [**The Rift API**](https://github.com/jason-liu-se/the-rift-web-server) for
  news, gallery, and downloads
- **BlueMap** for the map pages

Neither service is started by this repo. Static pages work without them.

## Getting started

1. Optional: create a `.env` file in the repo root to set the service URLs:

    ```bash
    DEV_API_URL=http://localhost:4000
    DEV_BLUEMAP_URL=http://localhost:8100
    PROD_API_URL=https://api.example.com
    PROD_BLUEMAP_URL=https://map.example.com
    ```

    `DEV_` URLs default to the localhost values above. `PROD_` URLs are only
    needed for `npm run build` and `npm run start:prod`. Use full `http(s)`
    URLs; trailing slashes are removed. Shell variables override `.env`.

2. Install and run:

    ```bash
    npm ci
    npm start
    ```

3. Open <http://localhost:4200/>.

## Commands

| Command                   | What it does                                                |
| ------------------------- | ----------------------------------------------------------- |
| `npm start`               | Dev server using the `DEV_` URLs                            |
| `npm run start:prod`      | Dev server using the production build and `PROD_` URLs      |
| `npm run build`           | Production build (output path in `angular.json`)            |
| `npm run watch`           | Rebuild on change (development)                             |
| `npm test`                | Unit tests (`-- --watch=false` for one run)                 |
| `npm run e2e`             | End-to-end and accessibility tests                          |
| `npm run e2e:ui`          | Same, in the Playwright UI                                  |
| `npm run lint` / `format` | ESLint / Prettier (`lint:fix`, `format:check` also exist)   |
| `npm run env`             | Regenerate `src/environments/` from `.env` (see below)      |
| `npm run ng -- <command>` | Angular CLI, e.g. `npm run ng -- generate component <path>` |

`npm ci` and the `start`, `build`, `watch`, `test`, and `e2e` scripts run
`npm run env` first. `npm run ng -- ...`, lint, and format don't, so run it
yourself after editing `.env` if you use those.

Use the Angular CLI to create components, services, and so on, rather than
writing the files by hand.

## Testing

### Unit tests

`*.spec.ts` files sit next to the code they test and run in Vitest (jsdom, no
browser needed). Run one file with `npm test -- --include <path/to/spec>`.

If you're used to Jasmine:

- `vi.spyOn` calls the real method unless you add `.mockImplementation(...)`.
- zone.js isn't loaded, so there's no `fakeAsync`/`tick`; use `async`/`await` or
  Vitest fake timers.

### End-to-end tests

Playwright tests in `e2e/` run every route on desktop and mobile in Chromium.
The API and BlueMap are mocked at the `DEV_` URLs, so you don't need either
running. Playwright reuses a server already on port 4200, so stop
`npm run start:prod` before running e2e tests.

```bash
npx playwright install chromium   # once, and after upgrading Playwright
                                  # (add --with-deps the first time on Linux/WSL)
npm run e2e
npm run e2e -- e2e/keyboard.spec.ts --project=desktop   # one file, one device
```

| Spec                    | Checks                                            |
| ----------------------- | ------------------------------------------------- |
| `accessibility.spec.ts` | axe scan for WCAG 2.2 A/AA                        |
| `keyboard.spec.ts`      | Tab order, visible focus, focus on navigation     |
| `responsive.spec.ts`    | No horizontal scroll at narrow widths / 200% zoom |
| `data.spec.ts`          | API data appears on screen                        |

Reports go to `playwright-report/` (`npx playwright show-report`); screenshots
and traces go to `test-results/`.

Axe can't check everything (e.g. text contrast over background images), focus
visibility is only checked on the desktop navbar, and the BlueMap iframe is an
empty placeholder, so a passing run isn't a full audit.

**Writing a new spec**

- Import `test` and `expect` from `e2e/support/test.ts` (applies the mocks).
- Open pages with `gotoRoute` from `e2e/support/navigation.ts`.
- Add new routes to `e2e/support/routes.ts`.
- Mock data lives in `e2e/support/api-fixtures.ts`.
- Limit a test to one device with the tags in `e2e/support/projects.ts`.

**Known issues**

- Existing accessibility bugs are listed in `e2e/known-a11y-issues.ts`. Delete
  an entry once it's fixed (the suite fails if it no longer happens). Never add
  one to make new code pass. Entries match by CSS selector, so if a markup
  change makes one show up as both new and gone, update its `target`.
- Known keyboard bugs are `test.fail()` tests in `keyboard.spec.ts`. Remove the
  `test.fail` once fixed.

## Project structure

```text
src/
├── app/
│   ├── components/   Reusable UI pieces (cards, navbar, footer, ...)
│   ├── pages/        One component per routed page
│   ├── services/     API clients
│   ├── interfaces/   Data types
│   ├── directives/   Custom directives
│   ├── utilities/    Small shared helpers and pipes
│   └── app-routing.module.ts
├── assets/           Images and icons
├── environments/     environment*.ts generated from .env; the interface isn't
└── *.scss            Global styles and Material theme
e2e/                  Playwright tests and their support files
```

**How pages work:** every route in `app-routing.module.ts` renders
`PageTemplateComponent`, which wraps the page named in the route's
`data.component` with the shared navbar and footer. Components are standalone
(there's no root `NgModule`).

## Troubleshooting

| Problem                      | Check                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------- |
| News or gallery is empty     | The API is running at `DEV_API_URL`; restart `npm start` after editing `.env` |
| Map pages are blank          | BlueMap is running at `DEV_BLUEMAP_URL`, and its map ids match the routes     |
| `... is not set`             | A `PROD_` variable is missing from `.env` (needed for build and `start:prod`) |
| Requests fail in the console | CORS: the API must allow the site's origin                                    |

## Claude Code

The repo ships shared [Claude Code](https://claude.com/claude-code) setup:
[`CLAUDE.md`](./CLAUDE.md), [`.claude/`](./.claude/) (settings, skills, agents),
and [`.mcp.json`](./.mcp.json) (Angular CLI MCP server). Shared hooks log each
shell command Claude runs to `.claude/logs/commands.log`. Put personal overrides
in `.claude/settings.local.json`.
