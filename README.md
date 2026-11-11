# The Rift Website

The website for The Rift Minecraft SMP: an Angular + Angular Material app with
server rendering (versions in [`package.json`](./package.json)).

## Requirements

- **Node.js** at the version in [`.nvmrc`](./.nvmrc) and **npm 11+** (npm 10
  can't resolve the Angular dependencies)
- [**The Rift API**](https://github.com/jason-liu-se/the-rift-web-server) for
  news, gallery, and downloads, and **BlueMap** for the map pages. Neither is
  started by this repo; other pages work without them.

## Getting started

```bash
npm ci
npm start   # http://localhost:4200
```

## Environment variables

Set these in a `.env` file in the repo root. The URLs have development defaults,
so only production needs them.

| Variable                | Required for                          | Sets                                                         |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `PUBLIC_API_URL`        | `npm run build`, `npm run start:prod` | The Rift API's base URL                                      |
| `PUBLIC_BLUEMAP_URL`    | `npm run build`, `npm run start:prod` | BlueMap's base URL                                           |
| `PUBLIC_SITE_URL`       | `npm run build`, `npm run start:prod` | This site's public URL (canonical links, sitemap)            |
| `LOCAL_WEB_SERVER_PATH` | `npm run api:sync`                    | Your web-server checkout (see [API contract](#api-contract)) |

Prefix a `PUBLIC_` variable with `DEV_` or `PROD_` to set it for one environment
only:

```bash
DEV_PUBLIC_API_URL=http://localhost:4000
DEV_PUBLIC_BLUEMAP_URL=http://localhost:4001
PROD_PUBLIC_API_URL=https://api.example.com
PROD_PUBLIC_BLUEMAP_URL=https://map.example.com
PROD_PUBLIC_SITE_URL=https://www.example.com
LOCAL_WEB_SERVER_PATH=../web-server
```

How these become `environment.*`, and how to add one:
[environment-variables.md](./.claude/docs/environment-variables.md).

## Commands

| Command                   | What it does                                                                |
| ------------------------- | --------------------------------------------------------------------------- |
| `npm start`               | Dev server with the development URLs                                        |
| `npm run start:prod`      | Dev server with the production build and URLs                               |
| `npm run build`           | Production build (output path in `angular.json`)                            |
| `npm run preview`         | Production build run in the local Cloudflare Worker (http://localhost:8787) |
| `npm test`                | Unit tests (`-- --watch=false` for one run)                                 |
| `npm run e2e` / `e2e:ui`  | End-to-end and accessibility tests                                          |
| `npm run lint` / `format` | ESLint / Prettier                                                           |
| `npm run env`             | Regenerate `src/environments/` and crawler files                            |

`npm ci`, `start`, `build`, `test`, and `e2e` run `npm run env` first; run it
yourself after editing `.env` if you call `ng` directly.

## Testing

```bash
npm test -- --include <path/to/spec>                     # one unit test file
npx playwright install chromium                          # once, before e2e (--with-deps on Linux/WSL)
npm run e2e -- e2e/keyboard.spec.ts --project=desktop    # one e2e file, one device
```

The e2e tests mock the API and BlueMap, so neither needs to be running. Stop
anything on port 4200 or the development API port first. Details:
[testing.md](./.claude/docs/testing.md).

## Project structure

```text
src/
├── app/
│   ├── components/   Reusable UI pieces
│   ├── pages/        One component per routed page
│   ├── services/     API clients
│   ├── interfaces/   Data types; api-responses.ts is synced from web-server
│   ├── seo/          Page titles, meta tags, and structured data
│   ├── app.routes.ts          Routes
│   └── app.routes.server.ts   How each route is rendered
├── environments/     Generated from .env; don't edit
└── server.ts         Server request handler
e2e/                  Playwright tests
scripts/              Environment, API contract, and crawler file scripts
public/               Copied to the site root
```

Rendering and SEO are explained in [rendering.md](./.claude/docs/rendering.md)
and [seo.md](./.claude/docs/seo.md).

## Deployment

The site runs as a Cloudflare Worker (`wrangler.jsonc`): pre-rendered pages and
build files are served as static assets, and `src/server.ts` renders everything
else. Cache and security headers are in `public/_headers`.

Setup:

1. In the Cloudflare dashboard, create a Worker from this repo (Workers Builds).
   Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
   Production branch: `main`.
2. Add the build variables `PROD_PUBLIC_API_URL`, `PROD_PUBLIC_BLUEMAP_URL`, and
   `PROD_PUBLIC_SITE_URL` (the exact production URL, with `https://` and no
   trailing slash).
3. Add the custom domain to the Worker, and redirect the other host (`www` or
   the bare domain) to it with a Cloudflare redirect rule.
4. The API must use HTTPS, be reachable from Cloudflare (pages are rendered
   there), and allow the site's origin in CORS. BlueMap must use HTTPS and allow
   the site to embed it (`X-Frame-Options` / `frame-ancestors`).
5. Verify the domain in Google Search Console, submit
   `https://<domain>/sitemap.xml`, and import the site into Bing Webmaster
   Tools.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): every pull request and push to `main`
  runs lint, the format check, unit tests, and the production build (with
  placeholder URLs). E2e tests run only locally.
- **CD**: Workers Builds deploys `main` on every push, without running those
  checks. Make the CI `check` job a required status check on `main` (GitHub
  branch protection) so only passing code gets there.

## API contract

The API's response types are owned by the
[web-server repo](https://github.com/jason-liu-se/the-rift-web-server). This
repo keeps a verbatim copy at `src/app/interfaces/api-responses.ts`; don't edit
it. Set `LOCAL_WEB_SERVER_PATH` to your web-server checkout, then:

```bash
npm run api:sync    # copy the server's current contract here
npm run api:check   # fail if the copy is out of date (runs before tests)
```

Without `LOCAL_WEB_SERVER_PATH` (e.g. in CI), `api:check` warns and skips.

## Troubleshooting

| Problem                       | Check                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------- |
| News or gallery is empty      | The API is running at the development `API_URL`                              |
| Map pages are blank           | BlueMap is running at the development `BLUEMAP_URL` and map ids match routes |
| `Not set: ...`                | A variable is set for one environment only, or a production one is missing   |
| A `.env` value is ignored     | Its name must start with `PUBLIC_`, `DEV_PUBLIC_`, or `PROD_PUBLIC_`         |
| `api-contract: ... not found` | `LOCAL_WEB_SERVER_PATH` points to the web-server repo's root folder          |

## Claude Code

The repo ships shared [Claude Code](https://claude.com/claude-code) setup:
[`CLAUDE.md`](./CLAUDE.md), [`.claude/`](./.claude/), and
[`.mcp.json`](./.mcp.json). Put personal overrides in
`.claude/settings.local.json`.
