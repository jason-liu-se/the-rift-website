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
- The admin pages (`/admin`, `/admin/login`) use `Client`: their guards
  (`src/app/guards/`) check the login with the API's session cookies, which only
  the browser has. A `Client` page's robots meta tag only appears once
  JavaScript runs, so these routes also send an `X-Robots-Tag: noindex` header.
- Every route in `app.routes.ts` needs an entry (a unit test checks), or it
  falls through to the last entry: the 404 page with a 404 status. The 404 page
  also sets that status itself (`RESPONSE_INIT`), for URLs a `canMatch` guard
  turns away under another entry (an unknown `gallery/:collection`).

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
  `SERVER_API_TIMEOUT_MS` (`src/app/config/api.ts`, server only), the page
  renders without the data and the browser fetches it after hydration. Only a
  failure in the browser shows the page's error state and retry button
  (`LoadState` in `src/app/utilities/`), and the page retries by itself once the
  API is back (see `ApiStatusService`).
- Every API `GET` sends the site's content version as `v`
  (`contentVersionInterceptor`, `src/app/services/content-version/`), so the API
  and Cloudflare cache public reads until the next edit. The version is fetched
  on first use and again once older than `CONTENT_VERSION_MAX_AGE_MS`
  (`src/app/config/api.ts`): once per server request, and in the browser, which
  reuses the server's while hydrating. Without the refresh, a long-open tab
  would keep reading content Cloudflare cached under the old version. Writes
  aren't `GET`s, and uncached `GET`s (the version itself, `/auth/me`) opt out
  with `unversioned()`; a public read without `v` isn't cached.
- Logged-in API requests send the API's httpOnly session cookies
  (`withCredentials`). When one answers 401 because the short-lived access token
  expired, `authRefreshInterceptor` (`src/app/services/auth/`) calls
  `POST /auth/refresh` once and retries it. If the refresh answers 401 too, the
  session is over and the app logs out.
- `AuthService.user()` is the logged-in user for the whole app. It's checked
  with `GET /auth/me` once per page load, in the browser only (the server can't
  see the API's cookies, so there it stays unknown). The last-known user is kept
  in `localStorage`: it still shows while the API is down, and a logout in one
  tab logs out the others.
- A session that ends without a logout in this tab (it expired, or the user
  logged out in another tab) shows a toast, or on a protected page a dialog that
  offers to log in again and return to the same page
  (`src/app/layout/session-ended/`).
- `ApiStatusService` (`src/app/services/api-status/`) tells the browser whether
  the API is `up`, `down` or `offline`, fed by `apiStatusInterceptor` (down
  after a network error, timeout or 5xx) and the `online`/`offline` events. A
  response can't mark it up again: the browser may answer a GET from its HTTP
  cache. While down, it checks `/health` (`cache: 'no-store'`) every
  `API_HEALTH_CHECK_INTERVAL_MS` while the tab is visible, and at once on
  `online`, when the tab becomes visible, or after another response; only a
  health answer marks it up. It stays `up` on the server. When it returns to
  `up`, it retries a pending logout, and every `LoadState` that failed retries
  its page. `StatusBannerComponent` (`src/app/layout/status-banner/`) shows the
  status above the navbar and publishes `--status-banner-height`; its state
  lives in a root service so dismissals outlast navigations.
- The navbar (`src/app/layout/navbar/`) checks the session after hydration only
  when a user is saved, so anonymous visitors make no `/auth/me` request, and
  loads the user menu (avatar, Admin, Log out) once the user is known, so server
  HTML shows no user UI.
- Logging out always succeeds for the user at once: `AuthService.logout()`
  clears the user and saved user, sets a `logout-pending` flag in
  `localStorage`, and then sends `POST /auth/logout`. Only the API can clear the
  httpOnly cookies, so while the flag is set (the API was down, or the browser
  closed first) the logout is retried on start-up, on the `online` event, and by
  every `checkSession()` (instead of `/auth/me`; the answer is "logged out"
  either way), and the login page's Discord button sends it before navigating.
