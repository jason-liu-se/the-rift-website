# The Rift Website

The website for The Rift Minecraft SMP: an Angular + Angular Material
single-page app (versions in [`package.json`](./package.json)).

## Requirements

- **Node.js** at the version in [`.nvmrc`](./.nvmrc) (`nvm use`)
- **npm 11+** (npm 10 can't resolve the Angular dependencies)
- [**The Rift API**](https://github.com/jason-liu-se/the-rift-web-server) for
  news, gallery, and downloads
- **BlueMap** for the map pages

Neither service is started by this repo. Static pages work without them.

## Getting started

1. Optional: create a `.env` file in the repo root (see
   [Environment variables](#environment-variables)).

2. Install and run:

    ```bash
    npm ci
    npm start
    ```

3. Open <http://localhost:4200/>.

## Environment variables

| Variable                | `DEV_`/`PROD_` versions | Required for                                | Sets                                                                                                |
| ----------------------- | ----------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `PUBLIC_API_URL`        | Yes                     | `npm run build`, `npm run start:prod`       | The Rift API's base URL (`environment.API_URL`)                                                     |
| `PUBLIC_BLUEMAP_URL`    | Yes                     | `npm run build`, `npm run start:prod`       | BlueMap's base URL (`environment.BLUEMAP_URL`)                                                      |
| `PUBLIC_SITE_URL`       | Yes                     | `npm run build`, `npm run start:prod`       | This site's public URL, for canonical links, link previews and the sitemap (`environment.SITE_URL`) |
| `LOCAL_WEB_SERVER_PATH` | No                      | `npm run api:sync` (and a real `api:check`) | Your web-server checkout, absolute or relative to this repo (see [API contract](#api-contract))     |

The URLs have development defaults (`DEV_DEFAULTS` in
`scripts/environments/config.mjs`), so only production needs them set. Example:

```bash
DEV_PUBLIC_API_URL=http://localhost:4000
DEV_PUBLIC_BLUEMAP_URL=http://localhost:8100
PROD_PUBLIC_API_URL=https://api.example.com
PROD_PUBLIC_BLUEMAP_URL=https://map.example.com
PROD_PUBLIC_SITE_URL=https://www.example.com
LOCAL_WEB_SERVER_PATH=../web-server
```

### App settings (`PUBLIC_`)

`npm run env` turns the `PUBLIC_` variables into `src/environments/` (including
the `IEnvironment` type). Every value ends up in the public JS bundle, so only
names starting with `PUBLIC_` are read; others (secrets, system variables, and
script settings like `LOCAL_WEB_SERVER_PATH`) never reach it. `PUBLIC_X` becomes
`environment.X`. A `DEV_` or `PROD_` prefix limits it to that environment and
overrides the unprefixed name (e.g. `PUBLIC_API_URL` for both,
`PROD_PUBLIC_API_URL` for production only). Every key must be set for both
environments: production falls back to the development values except for
`npm run build` and `npm run start:prod`.

Per-variable settings live in `scripts/environments/config.mjs`, the only script
file you need to edit:

- **Adding a variable:** set `PUBLIC_<NAME>` in `.env` (or the shell, or as a
  `NAME=value` argument to `npm run env`), add it to the table and example
  above, and read it in code as `environment.<NAME>`. No other file changes.
- **Checking or transforming a value:** add `<NAME>: someCheck` to `PROCESSORS`
  in `config.mjs`, using a check from `scripts/environments/processors.mjs`
  (e.g. `normaliseUrl`) or a new one added there. Values not listed are used
  as-is.
- **Different values per environment:** use `DEV_PUBLIC_<NAME>` and
  `PROD_PUBLIC_<NAME>`; either overrides `PUBLIC_<NAME>` in its environment.
  Both environments share one `IEnvironment`, so a variable set for only one
  must still get a value in the other: set the other prefix too, set
  `PUBLIC_<NAME>`, or add a development default to `DEV_DEFAULTS` in
  `config.mjs`.

## Commands

| Command                   | What it does                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `npm start`               | Dev server (with server rendering) using the development URLs                      |
| `npm run start:prod`      | Dev server using the production build and URLs                                     |
| `npm run build`           | Production build: `browser/` and `server/` under the output path in `angular.json` |
| `npm run watch`           | Rebuild on change (development)                                                    |
| `npm test`                | Unit tests (`-- --watch=false` for one run)                                        |
| `npm run e2e`             | End-to-end and accessibility tests                                                 |
| `npm run e2e:ui`          | Same, in the Playwright UI                                                         |
| `npm run lint` / `format` | ESLint / Prettier (`lint:fix`, `format:check` also exist)                          |
| `npm run env`             | Regenerate `src/environments/` and the crawler files (below)                       |
| `npm run ng -- <command>` | Angular CLI, e.g. `npm run ng -- generate component <path>`                        |

`npm ci` and the `start`, `build`, `watch`, `test`, and `e2e` scripts run
`npm run env` first. `npm run ng -- ...`, lint, and format don't, so run it
yourself after editing `.env` if you use those.

Use the Angular CLI to create components, services, and so on, rather than
writing the files by hand.

## Testing

### Unit tests

`*.spec.ts` files sit next to the code they test and run in Vitest (jsdom, no
browser needed). Run one file with `npm test -- --include <path/to/spec>`.
Shared helpers live in `src/app/testing/`.

If you're used to Jasmine:

- `vi.spyOn` calls the real method unless you add `.mockImplementation(...)`.
- zone.js isn't loaded, so there's no `fakeAsync`/`tick`; use `async`/`await` or
  Vitest fake timers.

### End-to-end tests

Playwright tests in `e2e/` run every route on desktop and mobile in Chromium.
The API and BlueMap are mocked at the development URLs, so you don't need either
running: in the browser by `e2e/support/mock-api.ts`, and for the dev server's
server-side rendering by a mock API server on the development `API_URL` port
(`e2e/support/mock-api-server.ts`). Stop a local API using that port first.
Playwright reuses a server already on port 4200, so stop `npm run start:prod`
before running e2e tests.

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
- Mock data lives in `src/app/testing/api-fixtures.ts`, shared with the service
  unit tests and typed against the API contract (see
  [API contract](#api-contract)). This keeps both suites consistent with each
  other and with the contract, but neither talks to the real server.
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
│   ├── interfaces/   Data types; api-responses.ts is synced from web-server
│   ├── directives/   Custom directives
│   ├── utilities/    Small shared helpers and pipes
│   ├── seo/          Page titles, meta tags and structured data
│   ├── app.routes.ts         Routes (title, description, page, shell flags)
│   ├── app.routes.server.ts  How each route is rendered (see Rendering)
│   └── app.config*.ts        App-wide providers (browser; server adds to them)
├── assets/           Images and icons
├── environments/     Generated from .env; don't edit
├── main*.ts          Browser and server entry points
├── server.ts         Server request handler (pre-rendered pages and server rendering)
└── *.scss            Global styles and Material theme
e2e/                  Playwright tests and their support files
scripts/environments/ config.mjs (variable settings), processors.mjs (checks),
                      generate.mjs (writes src/environments/)
scripts/api-contract/ sync.mjs (copies the API contract from web-server)
scripts/seo/          crawler-files.mjs (writes robots.txt and sitemap.xml)
public/               Copied to the site root; robots.txt and sitemap.xml are generated
```

**How pages work:** every route in `app.routes.ts` renders
`PageTemplateComponent`, which wraps the page loaded by the route's
`data.loadComponent` (lazy-loaded, so each page is its own JS chunk) with the
shared navbar and footer. Components are standalone (there's no root
`NgModule`).

## Rendering

Pages are rendered on the server, so crawlers and link previews get full HTML,
and the browser then takes over the page instead of rendering it again.
`src/app/app.routes.server.ts` sets how each route is rendered:

| Mode                   | When the HTML is made          | Use for                                        |
| ---------------------- | ------------------------------ | ---------------------------------------------- |
| `RenderMode.Prerender` | At build time, saved as a file | Pages whose content only changes with a deploy |
| `RenderMode.Server`    | On each request                | Pages showing API data (news, gallery, ...)    |
| `RenderMode.Client`    | In the browser only            | Pages that can't render on a server            |

- **Changing a page's mode** is a one-line edit there; components work in all
  three. Every route in `app.routes.ts` needs an entry (a unit test checks), or
  it falls through to the last entry, which serves the 404 page with a 404
  status.
- **Server-safe components:** code runs on the server too, where there's no
  `window` or `document` beyond Angular's own. Read the window only in event
  handlers, `afterNextRender`, or behind `isPlatformBrowser`.
- **API data:** server-rendered pages call the API from the server, and the
  browser reuses those responses instead of fetching them again. If the API is
  down, the page renders without the data (the error is logged).
- **Allowed hosts:** the server only renders requests for the production
  `SITE_URL` hostname (`src/server.ts`), to prevent request forgery through the
  `Host` header. The dev server doesn't check.

## SEO

- **Titles and meta tags:** `SeoTitleStrategy` (`src/app/seo/`) runs after each
  navigation. It sets the page title (the route's `title` plus " | The Rift"),
  the meta description (`data.description`, falling back to the site-wide one in
  `src/index.html`), the canonical URL, Open Graph tags, and the site's
  structured data. Routes with `data.noindex: true` (e.g. the 404 page) get
  `robots: noindex` and no canonical URL. Give every new route a `title` and a
  `description`.
- **Crawler files:** `npm run env` also writes `public/robots.txt` and
  `public/sitemap.xml` (gitignored) from the routes and the production
  `SITE_URL` (`scripts/seo/crawler-files.mjs`). New routes are added
  automatically unless marked `noindex`. The build copies `public/` to the site
  root.
- **Status codes:** unknown URLs return the 404 page with a 404 status (see
  [Rendering](#rendering)).

## API contract

The API's response types are owned by the web-server repo
(`src/contract/api-responses.ts` there). The server sends every response through
schemas checked against that file. This repo keeps a verbatim copy at
`src/app/interfaces/api-responses.ts`, which the services and fixtures use.
Don't edit the copy.

Clone the [web-server repo](https://github.com/jason-liu-se/the-rift-web-server)
anywhere and set `LOCAL_WEB_SERVER_PATH` in `.env` to its folder (see
[Environment variables](#environment-variables)). Then, from this repo:

```bash
npm run api:sync    # copy the server's current contract here
npm run api:check   # fail if the copy is out of date (runs before tests and commits)
```

Without `LOCAL_WEB_SERVER_PATH` (e.g. in CI), `api:check` warns and skips, and
the committed copy is used.

## Troubleshooting

| Problem                       | Check                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| News or gallery is empty      | The API is running at the development `API_URL`; restart `npm start` after editing `.env` |
| Map pages are blank           | BlueMap is running at the development `BLUEMAP_URL`, and its map ids match the routes     |
| `Not set: ...`                | A variable is set for one environment only, or a production one is missing                |
| A `.env` value is ignored     | Its name must start with `PUBLIC_`, `DEV_PUBLIC_`, or `PROD_PUBLIC_`                      |
| `api-contract: ... not found` | `LOCAL_WEB_SERVER_PATH` points to the web-server repo's root folder                       |
| Requests fail in the console  | CORS: the API must allow the site's origin                                                |

## Claude Code

The repo ships shared [Claude Code](https://claude.com/claude-code) setup:
[`CLAUDE.md`](./CLAUDE.md), [`.claude/`](./.claude/) (settings, skills, agents),
and [`.mcp.json`](./.mcp.json) (Angular CLI MCP server). Shared hooks log each
shell command Claude runs to `.claude/logs/commands.log`. Put personal overrides
in `.claude/settings.local.json`.
