---
name: typescript-standards
description:
    TypeScript conventions for The Rift website (Angular) covering naming,
    typing, immutability, and error handling. Use as reference when writing or
    reviewing TypeScript code.
user-invocable: false
---

# TypeScript Coding Standards

Naming, type safety, immutability, and error handling for this Angular project.
`CLAUDE.md` and the lint/format configs take precedence over anything here.

Formatting is owned by Prettier (`.prettierrc`, `.editorconfig`) and linting by
`eslint.config.js`; run `npm run format` and `npm run lint:fix` rather than
formatting by hand, and don't restate their values elsewhere.

## Naming

- `camelCase` for variables, functions, properties, and methods.
- `PascalCase` for classes, interfaces, types, and enums. No `I` prefix on
  interfaces (`DownloadCollection`, not `IDownloadCollection`).
- `SCREAMING_SNAKE_CASE` for fixed, module-level constant values (`MAX_RETRIES`,
  `SLIDE_INTERVAL_MS`). Include the unit in the name when there is one.
- Booleans read as a question: `is`, `has`, `should`, `can` prefix (`isLoading`,
  `hasError`).
- Functions and methods are verb phrases (`fetchNews`, `formatDate`). Name
  template event handlers for what they do, not the event (`saveDraft()`, not
  `onClick()`).

### Files

- Use the file names the Angular CLI generates (`npm run ng -- generate ...`):
  kebab-case with the type suffix, e.g. `news-card.component.ts`,
  `gallery.service.ts`. A component's `.ts`, `.html`, `.scss`, and `.spec.ts`
  share one base name.
- One concept per file. Put files where the README's project structure and
  `CLAUDE.md`'s file scoping say; types used by only one feature live with that
  feature.

### Imports and exports

- Named exports only; no default exports.
- No circular imports. If two files need each other, extract the shared part.

## Type safety

The compiler runs in strict mode with Angular's strict templates
(`tsconfig.json`); keep it that way.

- Never use `any`. Use `unknown` and narrow it, or define a proper type.
- No `// @ts-ignore`. If a suppression is unavoidable, use `// @ts-expect-error`
  with a comment explaining why.
- Let TypeScript infer obvious types; annotate function parameters, public
  return types, and anything inference gets wrong.
- `interface` for object shapes, `type` for unions, intersections, and mapped
  types.
- Discriminated unions over optional fields for mutually exclusive states.
- `as const` for literal values, `satisfies` to check a value against a type
  without widening it.
- Treat API responses as untrusted at the boundary: type the `HttpClient` call
  with an interface for the contract, and validate or narrow anything the UI
  can't safely assume (e.g. optional or nullable fields).

```typescript
// Discriminated union instead of { data?: T; error?: string }
type LoadState<T> =
	| { status: "loading" }
	| { status: "loaded"; data: T }
	| { status: "error"; message: string };
```

### Angular class members

- Mark properties `readonly` when Angular or `inject()` initialises them and
  they are never reassigned: injected dependencies, `input()`, `output()`,
  `model()`, queries, and signals.
- Use `protected` for members only the template reads; keep `public` for the
  component's API.
- Use `inject()`, signal-based `input()`/`output()`, and `computed()` rather
  than constructor injection, `@Input`/`@Output`, or manually synced state.

## Immutability

- `const` by default, `let` only when reassignment is required, never `var`.
- Update objects and arrays by copying: `{ ...obj, key: value }`,
  `[...arr, item]`. This is required for signals, which compare by reference:
  use `signal.update(items => [...items, item])`, never mutate the current
  value.
- Don't mutate function parameters or shared state. Use `readonly` parameters,
  `Readonly<T>`, and `readonly T[]` to make that explicit.

## Error handling

- Handle errors from every Observable or Promise that can fail: `catchError` in
  the pipe or an `error` callback in `subscribe`, and show the user a meaningful
  state, not a blank page.
- Never swallow errors silently. If an error is genuinely ignorable, comment
  why.
- Handle errors where you can do something about them (usually the consuming
  component), not around every call.
- Run independent requests in parallel (`forkJoin`, `combineLatest`, or
  `Promise.all`), not one after another.

## Anti-patterns

- `any`, `var`, `// @ts-ignore`, default exports.
- Deep nesting; use guard clauses and early returns.
- Magic numbers and strings; use named constants (see `CLAUDE.md` for where they
  live).
- Long functions doing several things; split them so each has one job.
- Copy-pasted logic; extract it into a shared component, service, function, or
  pipe.
