---
paths:
    - "src/**/*.ts"
    - "src/**/*.html"
    - "e2e/**/*.ts"
    - "scripts/**/*"
    - "*.config.*"
---

# Naming

This is a production codebase that people read and review: a name should tell a
reader what something is or does without opening its definition. Short is good
when it's still clear in context (`results` in a function with one kind of
result, `i` in a short loop); generic is not (`data`, `item`, `value`, `info`,
`handle`, `process`, `temp` once a scope holds more than one candidate).

## Descriptive names

- Name for what it is or does in this domain, not its type or the code's
  mechanics: `savedUser`, not `data`; `seasonCards`, not `list`.
- Disambiguate when a scope holds several similar things: `newsResults` and
  `galleryResults`, not `results` and `results2`.
- A function name says what it does to what. If a reader would ask "what in
  order?" or "converts what?", it's too vague: `processInOrder` or
  `saveItemsInOrder`, not `inOrder`. If the honest name needs "and", the
  function likely does too much (split it).
- Abbreviate only what's standard in the domain or the web platform (`url`,
  `id`, `api`, `html`, `ms`); spell out everything else (`button`, not `btn`;
  `response`, not `res`, outside one-line callbacks).

## Casing and form

- `camelCase` for variables, functions, properties, and methods.
- `PascalCase` for classes, interfaces, types, and enums. No `I` prefix on
  interfaces (`DownloadCollection`, not `IDownloadCollection`).
- `SCREAMING_SNAKE_CASE` for fixed, module-level constant values (`MAX_RETRIES`,
  `SLIDE_INTERVAL_MS`). Include the unit in the name when there is one.
- Booleans (variables, signals, properties, parameters) read as a yes/no
  question with an `is`, `has`, `should`, `can`, or `was` prefix: `isFinished`
  or `hasFinished`, not `finished`; `isApiDown`, not `apiDown`. Exception:
  boolean attribute inputs that mirror HTML or Angular attributes (`priority`,
  `disabled`).
- Functions and methods are verb phrases (`fetchNews`, `formatDate`). Use the
  verb that says how the value comes back: `get` for returning something already
  at hand or cheaply derived (`getSeasonTitle`), `fetch`/`load` for requests,
  `find` when it may return nothing, `create`/`build`/`to` for new values
  (`toSeasonCards`). A function returning a boolean reads as a question
  (`isOnProtectedPage`, `requiresLogin`).
- Name template event handlers for what they do, not the event (`saveDraft()`,
  not `onClick()`).

## Files

- Use the file names the Angular CLI generates (`npm run ng -- generate ...`):
  kebab-case with the type suffix, e.g. `news-card.component.ts`,
  `gallery.service.ts`. A component's `.ts`, `.html`, `.scss`, and `.spec.ts`
  share one base name.
- One concept per file. Put files where the README's project structure and
  `CLAUDE.md`'s file scoping say; types used by only one feature live with that
  feature.
