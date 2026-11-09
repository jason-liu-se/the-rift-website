---
name: pre-pr
description:
    Pre-PR checks for The Rift website. Runs lint, format check, unit tests, and
    the production build, then a code review of the branch. Use before
    committing a feature or opening a pull request.
---

Run every check below, even if an earlier one fails, then report.

## 1. Automated checks

Run these one at a time and capture each result:

```bash
npm run lint
npm run format:check
npm test -- --watch=false
npm run build
```

The build enforces the style budgets in `angular.json`, so report any budget
warnings too.

Don't run `npm run e2e` unless the user asks for it; it's slow. Instead, remind
the user to run it themselves before opening the PR.

## 2. Code review

Use the `code-reviewer` agent to review the current branch against `main`,
including any uncommitted changes. If the changes touch templates or styles,
also run the `a11y-auditor` agent on the changed components and pages.

## 3. Report

Give one short summary:

- **Checks:** pass or fail for each command. For failures, quote the relevant
  error lines.
- **Review:** the agents' findings, most severe first.
- **Verdict:** ready for a PR, or the list of things to fix first.

Don't fix anything yourself. Ask the user which findings to address.
