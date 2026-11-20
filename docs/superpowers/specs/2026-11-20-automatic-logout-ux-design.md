# Automatic logout UX (#35)

## Intent

When a session ends without the user clicking Log out in this tab, tell them
without throwing them somewhere unexpected. Public pages keep browsing;
protected pages stop the user acting on a page that no longer works.

## Behaviour

| Where the user is                                      | Session ends because…                                                 | They see                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| A public page                                          | it expired (refresh 401, incl. the page-load check with a saved user) | Toast: "Your session has ended"                                     |
| A public page                                          | they logged out in another tab                                        | Toast: "Your session has ended"                                     |
| A protected page (`requiresLogin`)                     | either                                                                | Modal, worded for the cause: "Log in again" / "Go to the home page" |
| Loading or refreshing `/admin` with an expired session | the page-load check answers 401                                       | Guard redirects to `/admin/login` (unchanged) with the toast        |
| Anywhere                                               | they clicked Log out in this tab                                      | Unchanged (login page, or "You've logged out" toast)                |

## Approaches

1. **One app-wide listener (picked).** `AuthService` reports each ended session
   with its cause; a root service shows the modal or toast depending on the
   current route. One place, works for future protected pages.
2. Each protected page watches `user()`: every new page must remember it, and it
   can't tell an expiry from another tab's logout. Dropped.
3. Re-run route guards on logout: redirects instead of a modal. Dropped.

## Design

- **`AuthService`** gets a `sessionEnded` stream of `'expired' | 'other-tab'`:
    - `'expired'`: `markLoggedOut()` (refresh failed), and a session check
      answering 401 while a user was saved.
    - `'other-tab'`: the `storage` handler sees the saved user removed.
    - Nothing for this tab's `logout()`, and nothing when nobody was logged in.
- **A root `SessionEndedService`** (started from the app shell, browser only)
  listens and checks the active route with `requiresLogin`:
    - Protected → opens the modal.
    - Otherwise → `ToastService.show(...)`. On a fresh load of `/admin` the
      route isn't activated yet, so this is the toast, and the guard's redirect
      lands the user on the login page with it showing.
- **The modal** (`SessionEndedDialogComponent`, CDK `Dialog`, our SCSS):
    - `role="alertdialog"`, labelled by its heading, described by its text.
    - Two actions: "Log in again" → `/admin/login`; "Go to the home page" → `/`.
      Both close it.
    - Can't be closed with Escape or the backdrop (`disableClose`): the page
      behind no longer works. `.claude/rules/ui-standards.md` says dialogs close
      on Escape; it gets an exception for blocking alert dialogs.
    - The page behind can't scroll (the CDK dialog's default block scroll
      strategy; tested).
    - Closes itself if the user logs back in in another tab.
    - Focus starts on "Log in again" and is trapped in the dialog.
- **Wording** (headings and toast decided by the user; body text my call):
    - Modal, expired: "Your session has ended" / "For your security, you've been
      logged out. Log in again to keep editing."
    - Modal, other tab: "You've logged out" / "You logged out in another tab.
      Log in again to keep editing."
    - Toast, either cause: "Your session has ended".
- **Return after logging in** (from the modal only):
    - The API's login callback always redirects to `/admin`, so the app
      remembers the page itself.
    - "Log in again" saves the current URL, with its fragment (e.g.
      `/admin#news`), in `sessionStorage` (it survives the Discord round trip in
      the same tab, and stays out of the address bar), then goes to
      `/admin/login`.
    - `requireLoggedIn` consumes it: when it lets a user in and a saved URL
      exists, it removes it and redirects there instead, if it differs from
      where they're going. Only a same-site path (`/…`, not `//…`) is used.
    - Stays saved through a failed login (`?error=`), so a retry still returns.
      If the user abandons the login, the next successful login in that tab
      still returns there; harmless.
    - The guard's own page-load redirect to the login page saves nothing.

## Non-goals

- Saving drafts before redirecting (the admin tools are placeholders; #34).

## Left to the builder

- Where the listener starts (app shell vs `app.config.ts` initializer), keeping
  it out of the server render.
- Modal styling within the palette and existing button styles.
