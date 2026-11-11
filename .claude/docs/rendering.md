# Rendering

Pages are rendered on the server (`@angular/ssr`), so crawlers and link previews
get full HTML, and the browser then reuses that HTML (hydration) instead of
rendering it again.

## Render modes

`src/app/app.routes.server.ts` sets how each route renders:

| Mode                   | HTML is made                   | Use for                                        |
| ---------------------- | ------------------------------ | ---------------------------------------------- |
| `RenderMode.Prerender` | At build time, saved as a file | Pages whose content only changes with a deploy |
| `RenderMode.Server`    | On each request                | Pages showing API data                         |
| `RenderMode.Client`    | In the browser only            | Pages that can't render on a server            |

- Changing a page's mode is a one-line edit; components work in all three.
- Every route in `app.routes.ts` needs an entry (a unit test checks), or it
  falls through to the last entry: the 404 page with a 404 status.

## Server-safe code

Code also runs on the server, where there's no real `window`. Touch `window` or
other browser APIs only in event handlers, `afterNextRender`, or behind
`isPlatformBrowser`.

## How it fits together

- `src/app/app.config.ts` holds the app-wide providers; `app.config.server.ts`
  adds the server ones. `src/main.ts` and `src/main.server.ts` start the app.
- `src/server.ts` is a web-standard request handler and the Cloudflare Worker's
  entry (`wrangler.jsonc`), built as a platform-neutral bundle
  (`ssr.experimentalPlatform` in `angular.json`), so it can't use Node APIs. On
  Cloudflare, static assets (including pre-rendered pages) are served before the
  Worker runs. The handler:
    - only renders requests for the production `SITE_URL` hostname and
      `*.workers.dev` (previews), to prevent request forgery through the `Host`
      header; the dev server skips this check
    - trusts Cloudflare's `X-Forwarded-For`/`-Proto` (Angular otherwise falls
      back to browser-only rendering)
    - adds the security headers that `public/_headers` sets for static files
- `PageTemplateComponent` lazy-loads each page (`data.loadComponent`). The app
  counts as busy until the page has loaded, so server rendering and hydration
  wait for it. After an in-app navigation it focuses `<main>` once the page is
  in. If a page's chunk fails to load (a tab left open across a deploy), it
  reloads once.
- Server-rendered pages call the API from the server, and the browser reuses
  those responses. If the API is down, or doesn't answer within
  `SERVER_API_TIMEOUT_MS` (`server-api-timeout.interceptor.ts`, server only),
  the page renders without the data and the browser fetches it after hydration.
