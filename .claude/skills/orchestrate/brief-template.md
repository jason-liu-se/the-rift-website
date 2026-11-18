# Implementer brief

Copy this, fill in every field (write "none" rather than deleting one), and pass
it as the `implementer` agent's prompt. Check every path exists first.

```markdown
Plan of record: <link to the plan comment>. It wins over this brief if they
differ; re-read it before changing anything shared.

## Task

<Issue #n: title, link.> <One paragraph: the outcome, in user terms.>

<Acceptance criteria, as a checklist. From the issue if it's Ready; otherwise
the plan you drafted.>

## Out of scope

- <What not to build, including parts of the issue deferred to other tasks.>

## Branch

- Branch: `<type>/<n>-<slug>`, base: `<base>` (PR targets the base)
- Risk tier: <Low | Medium | High>, because <reason>
- E2E ports: `E2E_PORT=<port>`, `DEV_PUBLIC_API_URL=http://localhost:<port>`

## Files

- **Owned**: <folders and files you may create and edit>
- **Append-only**: <shared files you may only add to>
- **Don't touch**: <files other agents own>

## Shared contract

<The exact interface other tasks rely on (selector, inputs, outputs, method
signatures, route data keys), and who owns it. "None" if independent.>

## Decisions already made

- <Answers from the user, and assumptions you made when you couldn't ask.>

## Context

- <Existing code to reuse, and gotchas you found while planning.>
```
