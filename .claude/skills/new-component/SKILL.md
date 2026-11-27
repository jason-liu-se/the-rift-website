---
name: new-component
description:
    Create a component for The Rift website, or extract shared markup or logic
    out of existing components. Use when a page or component needs a new child
    component, when splitting up a large page or component, or when asked to
    add, create, or scaffold a component.
argument-hint: <component name or description>
---

Create the component described in: $ARGUMENTS

For a new routed page, use the `new-page` skill instead; it uses this skill for
the page's child components.

## 1. Reuse, extend, or create?

Search `src/app/shared/ui/`, the page's feature folder
(`src/app/features/<feature>/`), and `src/app/core/layout/` for something that
already does this.

- **Reuse** it if it fits as-is.
- **Extend** it (a new input or variant) if the change fits its purpose. Check
  its other callers still render the same.
- **Create** a new one otherwise. If it shares markup or logic with an existing
  component, extract that into one shared component, service, or pure function
  and switch both to it, in the same change.

## 2. Where it goes

| Used by                                         | Folder                                   |
| ----------------------------------------------- | ---------------------------------------- |
| More than one feature, or generic UI            | `shared/ui/<name>/`                      |
| One page, specific to its content               | `features/<feature>/<page>-page/<name>/` |
| Several pages of one feature                    | `features/<feature>/<name>/`             |
| The shell every route renders (navbar, footer…) | `core/layout/<name>/`                    |

If a feature's component is now needed by another feature, move it to
`shared/ui/` with `git mv` and update its imports. Imports only flow downward
(`CLAUDE.md` "File scoping"; ESLint enforces it).

## 3. Generate it

Always scaffold with the Angular CLI, never by writing the files by hand:

```bash
npm run ng -- generate component <folder>/<name>
```

The project's schematic defaults (`angular.json`) set SCSS and the file naming,
and the `app` selector prefix comes from the project config.

## 4. Fill it in

- Follow `CLAUDE.md` and the current Angular patterns for the version in
  `package.json`: standalone, `inject()`, and the modern APIs for inputs,
  outputs, and control flow.
- Give it one responsibility. Pass data in through inputs and events out through
  outputs; leave API calls to the page or a service unless the component owns
  that data. Follow `.claude/rules/component-design.md` (state, data flow,
  variants, size, class layout). Follow `.claude/rules/component-design.md`
  (state, data flow, variants, size, class layout).
- Build interactive behaviour on Angular Aria, not Material (outside the admin
  pages). Keep its stylesheet small and use only palette colours
  (`.claude/rules/ui-standards.md`).
- Keep it server-safe (`.claude/docs/rendering.md`).

## 5. Tests

Replace the generated "should create" spec with tests of the behaviour callers
rely on (outputs emitted, requests sent, where an action leads), not its markup,
following `.claude/rules/testing.md` "What to test". A component that only
presents data may need no spec if an e2e flow covers it; then delete the
generated one. If you extended or extracted from an existing component, update
its spec too. Run:

```bash
npm test -- --watch=false --include <folder>/<name>
```
