# The Rift Website

The Rift website is a single-page application (SPA) for the Minecraft server
community. It is built with Angular 21, Angular Material, TypeScript, and SCSS.

The frontend is responsible for the site's pages, navigation, reusable
presentation components, and API requests. Some content is supplied by separate
services; see [External services](#external-services).

## Requirements

- Node.js at the version in [`.nvmrc`](./.nvmrc) (run `nvm use`). Other versions
  must be on Angular's
  [supported Node.js list](https://angular.dev/reference/versions); newer majors
  work for npm but the Angular CLI reports them as unsupported.
- npm 11.x (npm 10.9.3 fails to resolve the Angular 21 dependencies)
- A modern browser
- The separate The Rift API server for dynamic news, gallery, and download
  content
- A BlueMap server for the interactive map pages

## Getting started

From the repository root:

```bash
npm ci
npm start
```

Open <http://localhost:4200/> after the development server has finished
compiling.

### External services

The default local endpoints are defined in
[`src/app/config/constants.ts`](./src/app/config/constants.ts):

| Service      | Default URL             | Used for                             |
| ------------ | ----------------------- | ------------------------------------ |
| The Rift API | `http://localhost:4000` | News, gallery, and download requests |
| BlueMap      | `http://localhost:8100` | Embedded world maps                  |

The frontend does not start either service. Start them separately before testing
features that depend on them. The home page and static pages can still be
developed without the API, but requests for dynamic content will fail if the API
is unavailable. The map pages require a reachable BlueMap instance.

## Npm scripts

| Command                   | Description                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm start`               | Start the development server at `http://localhost:4200/`.                                      |
| `npm run build`           | Create a production build in `dist/the-rift-site`.                                             |
| `npm run watch`           | Rebuild continuously using the development configuration.                                      |
| `npm test`                | Run the unit tests with Vitest (watch mode in a terminal, a single run on CI).                 |
| `npm run e2e`             | Type-check and run the Playwright end-to-end and accessibility tests.                          |
| `npm run e2e:ui`          | Open the Playwright UI to run and debug end-to-end tests interactively.                        |
| `npm run ng -- <command>` | Run an Angular CLI command, for example `npm run ng -- generate component components/example`. |

## Testing

Unit tests are `*.spec.ts` files next to the code they test. They run with
Vitest through Angular's `@angular/build:unit-test` builder (see the `test`
target in `angular.json`), in a jsdom browser emulation, so no browser install
is needed.

```bash
npm test                               # watch mode
npm test -- --watch=false              # single run
npm test -- --include <path/to/spec>   # one spec file
```

Test globals (`describe`, `it`, `expect`, `vi`) come from Vitest. Two
differences from Jasmine to keep in mind:

- `vi.spyOn` calls the real method unless you add `.mockImplementation(...)`.
- zone.js is not loaded, so `fakeAsync`/`tick`/`waitForAsync` are unavailable;
  use `async`/`await` or Vitest fake timers instead.

### End-to-end and accessibility tests

The `e2e/` folder holds Playwright tests that drive the real app in Chromium, at
the desktop and mobile sizes set in `playwright.config.ts`. They check WCAG 2.2
AA rules with axe on every page, keyboard navigation and visible focus, reflow
without horizontal scrolling at 320px and at 200% zoom, and that API data
reaches the screen.

Install the browser once, then run the suite. Playwright starts the dev server
itself, or reuses one already running on port 4200.

```bash
npx playwright install chromium
npm run e2e
npm run e2e -- e2e/keyboard.spec.ts --project=desktop   # one file and project
```

You don't need the API or BlueMap running: `e2e/support/mock-api.ts` answers
their requests with the data in `e2e/support/api-fixtures.ts`. Import `test` and
`expect` from `e2e/support/test.ts` in new specs so the mocks always apply.
Pages the suite visits are listed in `e2e/support/routes.ts`; add new routes
there.

Accessibility violations that existed when the suite was added are listed in
`e2e/known-a11y-issues.ts`. Any violation not in that list fails the suite, and
so does a listed one that no longer happens. When you fix an issue, delete its
entry. Only add an entry for an existing bug you're deliberately leaving for
later, never to make a new feature pass.

Failure reports, screenshots, and traces are written to `playwright-report/`
(open it with `npx playwright show-report`) and `test-results/`.

## Project structure

```text
e2e/                      Playwright end-to-end and accessibility tests
├── support/              Shared fixtures, API mocks, route list, and helpers
└── known-a11y-issues.ts  Existing accessibility bugs the suite tolerates
src/
├── app/
│   ├── components/       Reusable UI components
│   ├── config/           Runtime constants such as service endpoints
│   ├── directives/       Custom Angular directives
│   ├── interfaces/       TypeScript data contracts
│   ├── pages/            Routed page components
│   ├── services/         API clients and shared application services
│   ├── utilities/        Small shared utilities and pipes
│   ├── app-routing.module.ts
│   └── app.component.*
├── assets/               Images, icons, and other static assets
├── main.ts               Application bootstrap
├── styles.scss           Global styles
├── theme.scss            Angular Material theme
├── theme-colours.scss    Shared theme colours
└── font-sizes.scss       Shared typography values
```

Generally, use Angular commands to create new components, services, etc as
necessary rather than creating them.

E.g.

```cmd
npm run ng -- generate component components/example-card
npm run ng -- generate component pages/example-page
npm run ng -- generate service services/example
npm run ng -- generate directive directives/example
npm run ng -- generate interface interfaces/example
```

## Architecture

The application uses standalone components. `src/main.ts` bootstraps
`AppComponent` with `bootstrapApplication` and registers the application-wide
providers, including `AppRoutingModule` (via `importProvidersFrom`) and
`HttpClient`. Each component declares its own dependencies in its `imports`
array; there is no root `NgModule`.

`AppRoutingModule` defines the public routes and uses `PageTemplateComponent` as
the shared page shell. Page-specific components are supplied through route data
and rendered by the page-template directive.

The main architectural areas are:

- **Pages:** Route-level views such as home, news, gallery, map, downloads,
  contact, and join.
- **Components:** Reusable cards, navigation, footer, slideshow, contact, and
  other visual building blocks.
- **Services:** `HttpClient`-based providers for API-backed data and shared
  behavior.
- **Interfaces:** Typed models used by components and services when handling API
  data.
- **Assets and styles:** Static images plus global and Angular Material theme
  styles bundled by the Angular CLI.

## Claude Code

The repository includes shared [Claude Code](https://claude.com/claude-code)
configuration:

- [`CLAUDE.md`](./CLAUDE.md): project guidance and engineering standards.
- [`.claude/settings.json`](./.claude/settings.json): shared permissions and
  hooks that format each file Claude edits and log each shell command Claude
  runs to `.claude/logs/commands.log`. Put personal overrides in
  `.claude/settings.local.json`. Git ignores both the log and the local
  settings.
- [`.mcp.json`](./.mcp.json): the Angular CLI MCP server (`ng mcp`), enabled for
  everyone through the shared settings.
- [`.claude/skills/`](./.claude/skills/) and
  [`.claude/agents/`](./.claude/agents/): project slash commands and review
  agents.

## Troubleshooting

### The app loads but dynamic content is missing

Confirm that the API server is running at `http://localhost:4000`, or update
`src/app/config/constants.ts` to the correct endpoint. Check the browser
developer console for failed requests and cross-origin (CORS) errors.

### Map pages are blank

Confirm that BlueMap is running at `http://localhost:8100` and that its
configured map names match the routes in `src/app/app-routing.module.ts`.
