---
paths:
    - ".env*"
    - "scripts/environments/**/*"
    - "src/environments/**/*"
---

# Environment variables

`npm run env` (`scripts/environments/generate.mjs`) turns `.env`, the shell, and
`NAME=value` arguments into `src/environments/`, including the `IEnvironment`
type. `npm ci` and the `start`, `build`, `watch`, `test`, and `e2e` scripts run
it first. Run it yourself before calling `ng` directly.

- **Only `PUBLIC_` names reach the app**, because every value ends up in the
  public JS bundle. `PUBLIC_X` becomes `environment.X`. Script settings (like
  `LOCAL_WEB_SERVER_PATH`) have no prefix and are never read into it.
- **`DEV_`/`PROD_` prefixes** (`DEV_PUBLIC_X`, `PROD_PUBLIC_X`) override
  `PUBLIC_X` in that environment.
- **Every key needs a value in both environments.** Production falls back to the
  development values, except in `npm run build` and `npm run start:prod`.
  Development defaults are `DEV_DEFAULTS` in `scripts/environments/config.mjs`.

To add a variable, use the `add-env-var` skill.
