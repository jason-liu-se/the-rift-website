# The Rift Website

The Rift website is a single-page application (SPA) for the Minecraft server
community. It is built with Angular 21, Angular Material, TypeScript, and
SCSS.

The frontend is responsible for the site's pages, navigation, reusable
presentation components, and API requests. Some content is supplied by
separate services; see [External services](#external-services).

## Requirements

- Node.js 20.19+, 22.12+, or 24+ (the project currently uses Angular 21 and
  TypeScript 5.9)
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

| Service | Default URL | Used for |
| --- | --- | --- |
| The Rift API | `http://localhost:4000` | News, gallery, and download requests |
| BlueMap | `http://localhost:8100` | Embedded world maps |

The frontend does not start either service. Start them separately before
testing features that depend on them. The home page and static pages can still
be developed without the API, but requests for dynamic content will fail if
the API is unavailable. The map pages require a reachable BlueMap instance.

## Npm scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the development server at `http://localhost:4200/`. |
| `npm run build` | Create a production build in `dist/the-rift-site`. |
| `npm run watch` | Rebuild continuously using the development configuration. |
| `npm test` | Run the unit tests with Karma and Jasmine. |
| `npm run ng -- <command>` | Run an Angular CLI command, for example `npm run ng -- generate component components/example`. |

## Testing

Run the unit tests with:

```bash
npm test
```

>>> TODO: Write unit and integration tests

## Project structure

```text
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
│   ├── app.module.ts
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

The application is bootstrapped from `src/main.ts` into `AppModule`.
`AppRoutingModule` defines the public routes and uses `PageTemplateComponent`
as the shared page shell. Page-specific components are supplied through route
data and rendered by the page-template directive.

The main architectural areas are:

- **Pages:** Route-level views such as home, news, gallery, map, downloads,
  contact, and join.
- **Components:** Reusable cards, navigation, footer, slideshow, contact, and
  other visual building blocks.
- **Services:** `HttpClient`-based providers for API-backed data and shared
  behavior.
- **Interfaces:** Typed models used by components and services when handling
  API data.
- **Assets and styles:** Static images plus global and Angular Material theme
  styles bundled by the Angular CLI.

## Troubleshooting

### The app loads but dynamic content is missing

Confirm that the API server is running at `http://localhost:4000`, or update
`src/app/config/constants.ts` to the correct endpoint. Check the browser
developer console for failed requests and cross-origin (CORS) errors.

### Map pages are blank

Confirm that BlueMap is running at `http://localhost:8100` and that its
configured map names match the routes in
`src/app/app-routing.module.ts`.
