# Automatic Logout UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a session ends without a logout in this tab, show a toast on
public pages and a blocking modal on protected pages, and return the user to the
same admin page after logging in again from the modal.

**Architecture:** `AuthService` emits each ended session with its cause. A root
`SessionEndedService`, started by `AppComponent` in the browser, reads the
active route: protected → lazy-loads and opens a CDK dialog; otherwise →
`ToastService`. The dialog's "Log in again" saves the current URL in
`sessionStorage`; `requireLoggedIn` consumes it after the next login.

**Tech Stack:** Angular 21 (standalone, signals), `@angular/cdk/dialog`, RxJS,
Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-20-automatic-logout-ux-design.md`

## Global Constraints

- Copy, exact: modal headings "Your session has ended" (expired) and "You've
  logged out" (other tab); bodies "For your security, you've been logged out.
  Log in again to keep editing." and "You logged out in another tab. Log in
  again to keep editing."; buttons "Log in again", "Go to the home page"; toast
  (either cause) "Your session has ended".
- No Angular Material in the dialog (it's shell-wide); CDK + own SCSS, colours
  from `src/theme-colours.scss`.
- Nothing runs on the server: `window`/storage only in the browser.
- A logout clicked in this tab keeps today's behaviour
  (`UserMenuComponent.logout`).
- Keep the dialog out of the initial bundle (dynamic `import()`).

## Review Focus

- Page-load check on a public page for someone with a saved but expired session
  → exactly one toast, not two (refresh 401 runs `markLoggedOut`, then
  `/auth/me`'s own 401 reaches `fetchSession`). Test in Task 1.
- A visitor who was never logged in → nothing at all. Test in Task 1.
- Two ended sessions while the modal is open (expiry, then the other-tab event)
  → one modal, not two stacked. Test in Task 4.
- A saved return URL that isn't a same-site path (`//evil.example`, `https://…`)
  → ignored, user lands on `/admin`. Test in Task 2.
- Fresh load of `/admin` with an expired session → toast on `/admin/login`, no
  modal. Test in Task 4 (no active route yet) and Task 5 (e2e).

---

### Task 1: `AuthService.sessionEnded`

**Files:**

- Modify: `src/app/services/auth/auth.service.ts`
- Test: `src/app/services/auth/auth.service.spec.ts`

**Interfaces:**

- Produces: `export type SessionEndReason = 'expired' | 'other-tab';` and
  `public readonly sessionEnded: Observable<SessionEndReason>` on `AuthService`
  (a `Subject` underneath; no replay).

Rules: `markLoggedOut()` emits `'expired'` only if a user was known (`state()`
non-null) or saved before clearing. The `storage` handler emits `'other-tab'`
when the saved user was removed and this tab's previous `user()` wasn't `null`.
`logout()` and `fetchSession`'s own 401 branch emit nothing.

- [ ] **Step 1: Write the failing tests** (collect emissions with
      `service.sessionEnded.subscribe(r => reasons.push(r))`):
    - `reports an expired session once when the page-load check finds it over`:
      `saveUser(USER)`, `check()`, flush `/auth/me` 401, flush
      `AUTH_REFRESH_URL` 401 → `reasons` equals `['expired']`.
    - `reports nothing when nobody was logged in`: no saved user, `check()`,
      `/auth/me` 401, refresh 401 → `[]`.
    - `reports nothing for a logout in this tab`: `saveUser`, `check()` flush
      `USER`, `service.logout()`, flush logout → `[]`.
    - In `in other tabs`: `reports a logout there` → after
      `otherTab(JSON.stringify(USER))` then `otherTab(null)` → `['other-tab']`;
      `reports nothing for a login there` → `otherTab(JSON.stringify(USER))`
      only → `[]`.
- [ ] **Step 2: Run**
      `npm test -- --watch=false --include src/app/services/auth/auth.service.spec.ts`
      — Expected: the new tests FAIL (`sessionEnded` undefined).
- [ ] **Step 3: Implement** per the rules above.
- [ ] **Step 4: Run** the same command — Expected: all PASS.
- [ ] **Step 5: Commit** `Report why a session ended`.

### Task 2: Return to the same page after logging in

**Files:**

- Create: `src/app/guards/login-return-url.ts`,
  `src/app/guards/login-return-url.spec.ts`
- Modify: `src/app/guards/admin-auth.guards.ts`,
  `src/app/guards/admin-auth.guards.spec.ts`

**Interfaces:**

- Produces: `export const LOGIN_RETURN_URL_KEY = 'login-return-url';`
  `export function saveLoginReturnUrl(url: string): void` and
  `export function takeLoginReturnUrl(): string | null` (reads and removes;
  returns `null` unless the value starts with `/` and not `//`; all
  `sessionStorage` access in try/catch).
- `requireLoggedIn`: when `user` is set and `takeLoginReturnUrl()` returns a URL
  different from `state.url`, return `router.parseUrl(thatUrl)`; else `true`.
  Callers must pass `RouterStateSnapshot` (`url` includes the fragment).

- [ ] **Step 1: Write the failing tests:**
    - `login-return-url.spec.ts`: `takes a saved path once`
      (`saveLoginReturnUrl('/admin#news')` → `take…()` is `'/admin#news'`, then
      `null`); `ignores anything but a same-site path`
      (`it.each(['//evil.example', 'https://evil.example', 'admin'])` → `null`,
      and the key is removed).
    - `admin-auth.guards.spec.ts` (`runGuard` gains a `url = '/admin'` argument
      passed as `{ url } as RouterStateSnapshot`; clear `sessionStorage` in
      `beforeEach`): `returns a logged-in editor to the saved page` (saved
      `/admin#news` → `urlOf(...)` is `/admin#news`, then a second run is
      `true`); `lets them in when the saved page is where they're going` (saved
      `/admin` → `true`); `keeps the saved page while nobody is logged in`
      (saved `/admin#news`, logged out → login redirect, `sessionStorage` still
      holds it).
- [ ] **Step 2: Run** `npm test -- --watch=false --include src/app/guards` —
      Expected: new tests FAIL.
- [ ] **Step 3: Implement** both files.
- [ ] **Step 4: Run** the same — Expected: PASS.
- [ ] **Step 5: Commit** `Return to the same admin page after logging in again`.

### Task 3: Session-ended dialog

**Files:**

- Create:
  `src/app/layout/session-ended/session-ended-dialog.component.{ts,html,scss,spec.ts}`

**Interfaces:**

- Consumes: `SessionEndReason` (Task 1), `saveLoginReturnUrl` (Task 2),
  `AuthService.user`, `ADMIN_LOGIN_PATH` (`src/app/config/admin.ts`).
- Produces: `SessionEndedDialogComponent`, opened with
  `DIALOG_DATA: SessionEndReason`. Exported
  `SESSION_ENDED_DIALOG_CONFIG: DialogConfig` =
  `{ role: 'alertdialog', disableClose: true, ariaLabelledBy: 'session-ended-heading', ariaDescribedBy: 'session-ended-text', autoFocus: '.log-in-again' }`
  (the CDK default scroll strategy blocks the page).

Behaviour: heading/body from the reason (Global Constraints copy). "Log in
again" (`.log-in-again`): `saveLoginReturnUrl(router.url)`, close, navigate to
`ADMIN_LOGIN_PATH`. "Go to the home page": close, navigate to `/`. An `effect`
closes the dialog when `auth.user()` becomes a user (logged back in elsewhere).
Buttons ≥ 44px targets, visible focus, palette colours.

- [ ] **Step 1: Write the failing tests** (open via
      `TestBed.inject(Dialog).open(SessionEndedDialogComponent, { ...SESSION_ENDED_DIALOG_CONFIG, data })`,
      `provideRouter` with `ANY_URL_ROUTES`):
    - `it.each` over both reasons: `shows the heading and text for <reason>`
      (exact copy; `[role=alertdialog]` labelled by the heading).
    - `focuses Log in again`.
    - `stays open on Escape and on a backdrop click`.
    - `blocks scrolling of the page behind` (`document.documentElement` has
      class `cdk-global-scrollblock` while open).
    - `Log in again saves the current page and goes to the login page` (router
      at `/admin#news` → `sessionStorage` `login-return-url` is `/admin#news`,
      router URL `/admin/login`, dialog closed).
    - `Go to the home page goes home without saving` (URL `/`, nothing saved).
    - `closes when the user logs back in elsewhere` (stub `AuthService.user` as
      a writable signal; set a user → dialog closed).
- [ ] **Step 2: Run**
      `npm test -- --watch=false --include src/app/layout/session-ended` —
      Expected: FAIL.
- [ ] **Step 3: Implement** the component.
- [ ] **Step 4: Run** the same — Expected: PASS.
- [ ] **Step 5: Commit** `Add the session-ended dialog`.

### Task 4: `SessionEndedService` and shared protected-page check

**Files:**

- Create: `src/app/layout/session-ended/session-ended.service.{ts,spec.ts}`
- Modify: `src/app/guards/requires-login.ts` (+ spec),
  `src/app/layout/navbar/user-menu/user-menu.component.ts`,
  `src/app/app.component.ts`

**Interfaces:**

- Produces: `export function isOnProtectedPage(router: Router): boolean` in
  `requires-login.ts` (deepest active snapshot → `requiresLogin`; `false` before
  the first navigation). `UserMenuComponent` switches to it and drops its
  private `currentRoute()`.
- Produces: `SessionEndedService` (root) with `start(): void` — browser only
  (no-op on the server); subscribes to `AuthService.sessionEnded`; protected →
  `import('./session-ended-dialog.component')` then
  `Dialog.open(..., { ...SESSION_ENDED_DIALOG_CONFIG, data: reason })` unless
  one is already open; otherwise `ToastService.show('Your session has ended')`.
- `AppComponent` constructor calls `inject(SessionEndedService).start()`.

- [ ] **Step 1: Write the failing tests:**
    - `requires-login.spec.ts`: `isOnProtectedPage` is `true` on a
      `canActivate: [requireLoggedIn]` route, `false` on a public route and
      before any navigation.
    - `session-ended.service.spec.ts` (stub `AuthService` with a `Subject` for
      `sessionEnded`, spy `ToastService.show`):
      `shows a toast on a public page`;
      `shows a toast before the first navigation (a fresh load of a protected page)`;
      `opens the dialog on a protected page with the reason` (await the lazy
      import; `[role=alertdialog]` present);
      `opens only one dialog for two ended sessions`;
      `does nothing on the server` (`PLATFORM_ID` `'server'`).
- [ ] **Step 2: Run**
      `npm test -- --watch=false --include src/app/layout/session-ended --include src/app/guards/requires-login.spec.ts`
      — Expected: FAIL.
- [ ] **Step 3: Implement**, switch `UserMenuComponent`, wire `AppComponent`.
- [ ] **Step 4: Run** all unit tests `npm test -- --watch=false` — Expected: all
      PASS (user menu specs unchanged).
- [ ] **Step 5: Commit** `Tell the user when their session ends`.

### Task 5: E2e, docs, and verification

**Files:**

- Create: `e2e/session-ended.spec.ts`
- Modify: `.claude/rules/ui-standards.md` (Keyboard: dialogs close on Escape,
  except an alert dialog that blocks a page that no longer works, which offers
  its own way out), `.claude/docs/rendering.md` (one bullet after the
  `AuthService.user()` bullet: an ended session shows a toast, or on a protected
  page a modal; links `src/app/layout/session-ended/`), `README.md` only if it
  lists layout parts.

E2e (reuse `signIn` from `e2e/user-menu.spec.ts` by moving it and
`SAVED_USER_KEY`/`EDITOR` to `e2e/support/auth.ts`; other tab = a second
`context.newPage()` that removes `session-user`):

- [ ] **Step 1: Write** tests: `another tab's logout on /admin shows the modal`
      (heading "You've logged out", "Log in again" focused, Escape keeps it,
      `window.scrollY` unchanged after `mouse.wheel`, axe clean via
      `scanForViolations`); `Log in again returns to the same tool`
      (`/admin#news` → modal → login page → route `/auth/me` 200,
      `goto('/admin')` → URL ends `/admin#news`);
      `another tab's logout on /news shows a toast` (text "Your session has
      ended", no dialog);
      `an expired session on loading /admin shows the toast on the login page`
      (`/auth/me` 401, `/auth/refresh` 401 → URL `/admin/login`, toast visible).
- [ ] **Step 2: Run**
      `npm run e2e -- e2e/session-ended.spec.ts e2e/user-menu.spec.ts` (both
      devices) — Expected: PASS.
- [ ] **Step 3: Update docs** as listed.
- [ ] **Step 4: Run**
      `npm run lint && npm run format:check && npm test -- --watch=false && npm run build`
      — Expected: all pass, no budget warnings.
- [ ] **Step 5: Commit** `Test and document the automatic logout UX`, then PR
      screenshots of the modal (both reasons) and the toast, desktop and mobile,
      via a temporary spec (`.claude/rules/testing.md`).
