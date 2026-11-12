---
name: add-env-var
description:
    Add an environment variable (an app setting such as a service URL, or a
    script setting) to The Rift website. Use when asked to add, rename, or
    remove a `.env` variable or an `environment.*` value.
argument-hint: <variable name and purpose>
---

Add the variable described in: $ARGUMENTS

How the variables work: `.claude/rules/environment-variables.md`.

## App setting (read by the app as `environment.<NAME>`)

1. Choose `PUBLIC_<NAME>`. Every value ends up in the public JS bundle, so never
   use this for secrets.
2. Read it in code as `environment.<NAME>` (import from `src/environments/`).
   Don't edit `src/environments/`: it's generated.
3. If it needs checking or transforming (e.g. a URL), add `<NAME>` to
   `PROCESSORS` in `scripts/environments/config.mjs`, using a check from
   `scripts/environments/processors.mjs` or a new one added there.
4. Make sure both environments get a value: add a development default to
   `DEV_DEFAULTS` in `config.mjs`, or tell the user to set it for both.
5. Add it to the README "Environment variables" table and `.env` example.
6. Ask the user to add it to their `.env` (and the hosting provider's build
   variables if production needs it). Don't edit `.env` yourself.
7. Run `npm run env`, then `npm test -- --watch=false`.

## Script setting (read by a script in `scripts/`, never by the app)

1. Use a name without the `PUBLIC_` prefix, so it never reaches the bundle.
2. Read it from the shell or `.env` (the shell wins), as
   `scripts/api-contract/sync.mjs` does for `LOCAL_WEB_SERVER_PATH`.
3. Add it to the README table and `.env` example.
