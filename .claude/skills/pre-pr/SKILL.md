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

If the branch changes templates, styles, routing, or how API data is shown, run
the targeted e2e specs for the affected routes (`.claude/rules/testing.md` "When
to run"). Run the full suite only for high-risk changes (see the `orchestrate`
skill's tiers) or when the user asks.

If the change is UI-facing, capture and upload screenshots of the affected
feature for the PR description (`.claude/rules/testing.md` "PR screenshots").

## 2. Code review

Use the `code-reviewer` agent to review the current branch against `main`,
including any uncommitted changes. If the changes touch templates or styles,
also run the `a11y-auditor` agent on the changed components and pages.

## 3. Report

Give one short summary:

- **Checks:** pass or fail for each command. For failures, quote the relevant
  error lines.
- **Review:** the agents' findings, most severe first.
- **Screenshots:** the image links for the PR, or why there are none.
- **Verdict:** ready for a PR, or the list of things to fix first.

Fix failing checks and Critical or Important findings that are in the branch's
scope, then re-run the affected checks. List the rest in the report (and the PR)
for the user to decide.
