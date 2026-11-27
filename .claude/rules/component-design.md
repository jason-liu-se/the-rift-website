---
paths:
    - "src/app/**/*.ts"
    - "src/app/**/*.html"
---

# Component design

How state, data, and responsibilities are split between components and services.
Each rule names a problem that made past code hard to review and change; a
reviewer flags any of them.

## State and data flow

- **Navigable state is routing.** What a user can bookmark, reload, or go Back
  to (the open tool, the item being edited, a filter) lives in the route: child
  routes and path parameters, read with `withComponentInputBinding` or
  `ActivatedRoute`. Don't rebuild it with effects that copy query parameters to
  signals and back.
- **Effects only reach outside Angular** (the DOM, `localStorage`, a third-party
  API). Never use one to derive state (`computed`, `linkedSignal`), to start
  requests or navigations, or with mutable variables in its closure to remember
  what it last saw.
- **Data flows down, events flow up.** Inputs in, outputs out. Never pass a
  component instance to a template or parent to read its state or call its
  methods; move that state up to the parent or into a service.
- **Containers read stores; views take inputs.** One container component per
  screen area injects the store or actions service and passes plain data (rows,
  columns, selection) down. The views under it (rows, cards, cells) take inputs
  and emit outputs, so they can show other data and be tested alone. A view
  doesn't run writes, copy to the clipboard, or navigate: it emits, and the
  container or an action's handler does it.
- **One owner per piece of shared data.** When two or more components need the
  same API data (a content type's collections), one service fetches it once,
  exposes it as a signal, and reloads it after a write. Components don't each
  fetch their own copy.
- **Loading data:** one pipeline from the signals it depends on to the state it
  sets (`toObservable` → `switchMap` → state set in `tap` or `subscribe`), with
  its loading and error state explicit (`LoadState`). No side effects in `map`.
  `resource`, `rxResource`, and `httpResource` are an option; check with the
  user before adopting them, as some are still experimental.

## Central paths

Logic that callers share runs through one place, so a change or fix happens
once:

- Requests go through the service for their API area (small, typed functions).
  Reuse or extend an existing function before adding one; never build
  `HttpClient` calls in components.
- Behaviour shared by requests (queueing, retries, rate limits, error messages)
  lives in one interceptor or service every caller uses, not a queue or retry
  per component.
- Repeated flows (confirm, write, notify, reload) share one helper or service.
- Each shared resource outside Angular (`localStorage`, cookies, a third-party
  SDK) has one service that owns every call to it: its keys, serialisation, and
  errors. Code uses that service, never the resource directly.

Centralise what callers really share; don't force unrelated cases through one
path.

## Declare once, derive the rest

A fact about a kind, field, status, action, or route is declared in one place;
everything else reads or derives it. Adding or changing something minor should
touch that one declaration, not every file that shows it.

- Lists, labels, and options are derived, never retyped: a filter's options name
  status keys and look up their labels; a type's field keys, labels, and
  required fields come from one field list; a default sort names a column's id.
- Site paths and other strings used in several files are named constants
  (`src/app/core/config/`), not literals repeated per file.
- When a fact is needed outside the code that declares it (a script, the
  server's routes), read it from that code rather than copying it, or add a test
  that the copies match.
- Deliberate copies of another system's values (the API contract, mirrored
  limits) are the exception: say so where they're declared.

## Variants

- **One config object per variant.** When behaviour varies by kind (each content
  type's noun, statuses, search fields, whether it has collections or a date),
  keep it in one `Record<Kind, Config>` the shared code reads. Not spread across
  several inputs, constants keyed by a subset of kinds, or
  `kind === 'a' || kind === 'b'` checks in several files. Anything edited the
  same way (items and collections both have drafts, labels, and a publish flow)
  is a variant of one config, not a separate set of constants.
- **Repeated controls are data.** Menus, toolbars, and actions are lists of
  definitions (label, icon, when it applies, what it runs) that one template
  loops over, like a table's columns. Reordering or adding one is a one-line
  change, and an action shown in two places (a row's menu and the bulk bar) is
  declared once.
- **One flow, configured per variant.** When two components run the same steps
  (validate, publish, report the result, handle a conflict) with different
  nouns, fields, or checks, extract the steps once and pass the differences in
  as config or functions.
- Use `TemplateRef` inputs only for markup that really differs per variant, and
  pass the template plain data, never a component.

## Size and responsibility

Split a component (or service) when:

- It does more than one of: routing or URL state, loading data, running writes,
  interaction state (selection, keyboard modes), and presentation.
- Its template repeats a block with small differences (two kinds of table row,
  or two views with the same sections): extract a component with an input for
  the difference.
- Two components share markup or logic (the same select, drop zone, or
  fallback): extract it and switch both, in the same change.

Prefer short files. A class over about 200 lines, a template over about 150, or
more than about five injected services is a prompt to look for a second
responsibility, not a rule: keep a long unit that really owns one thing.

A split moves a responsibility into a child component, a service, or a pure
function, with a name that says what it owns.

When a feature grows in steps, each step checks the earlier ones: the second
similar component, flow, or constant generalises the first in the same change,
instead of adding a parallel copy.

## State with several stages

- Model something that moves through stages (saving, saved, conflict, published)
  as one discriminated union, not as a combination of flags and `undefined`
  checks that together imply the stage.
- Send every write to the same resource through one queue (`concatMap` on one
  subject). A second path that calls the API directly (retry, publish,
  background sync) races the first.

## Class layout

Group members in this order, with a blank line between groups: injected
dependencies, inputs and outputs, state signals, derived (`computed`) values,
the constructor, public methods, protected (template) methods, private methods.

## Files

A component's template and styles go in their own `.html` and `.scss` files
(`templateUrl`, `styleUrl`), never inline in the `.ts`, however short.
