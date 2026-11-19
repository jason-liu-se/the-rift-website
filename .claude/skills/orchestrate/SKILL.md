---
name: orchestrate
description:
    Plan and run work for The Rift website across several parallel agents in git
    worktrees, from issues or a request through to reviewed pull requests. Use
    when asked to orchestrate, parallelize, use multiple agents or worktrees, or
    work on several issues or sub-issues at once.
---

You are the orchestrator: you plan, brief, review, and integrate. Implementer
agents write the code. Keep your own context for decisions, not file dumps.

## 1. Intake

1. Look for an existing plan of record (section 5) on the issue; if there is
   one, resume from it instead of re-planning.
2. Read every linked issue in full with comments
   (`gh issue view <n> --comments`), its sub-issues
   (`gh api repos/{owner}/{repo}/issues/<n>/sub_issues`), and any linked PRs.
3. Rate each issue as a plan:
    - **Ready**: concrete scope, acceptance criteria, and no open design
      choices. Use it as the plan.
    - **Partial**: clear goal, open details. Draft the missing parts.
    - **Vague**: a list of ideas. Draft a plan with scope cuts.
4. Read the code each task touches, enough to name real files. Check every path
   you'll put in a brief exists.

## 2. Decide how much human attention each task needs

Risk decides where the user must be in the loop. Spend their attention on what
could do real damage, and let confident, low-risk work flow through.

| Factor        | Low                          | High                                                                                                                                              |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blast radius  | One page or its components   | Shared code: `layout/`, `components/`, `src/styles.scss`, theme, `app.config*.ts`, routes                                                         |
| Reversibility | A revert fixes it            | Lingers after a revert: SEO and crawler files, security headers (`public/_headers`, `src/server.ts`), render modes, env scripts, deploy, CI, deps |
| Sensitivity   | Visual or content            | Auth (guards, `authRefreshInterceptor`), request handling, the API contract                                                                       |
| Clarity       | Ready plan, existing pattern | Vague plan or a new pattern                                                                                                                       |

The highest factor sets the **risk tier**. After the work is done, the agent's
**confidence** (High / Medium / Low, backed by evidence: tests that cover the
behaviour, screenshots looked at, e2e run) can only move a task up a tier, never
down.

| Tier   | Human before launch | Agent's checks                                                | Automated review                                       | Human before merge                          |
| ------ | ------------------- | ------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| Low    | —                   | lint, format, unit tests, build, PR screenshots of UI changes | `code-reviewer`                                        | None: you merge it once CI and review pass  |
| Medium | —                   | + targeted e2e on changed routes                              | `code-reviewer` only                                   | Reviews the PR (ready for review)           |
| High   | Approves the plan   | + full e2e                                                    | + `a11y-auditor` if UI, your own read of the full diff | Reviews the draft PR and approves the merge |

- **Low, High confidence**: merge with `gh pr merge --squash --delete-branch`
  once CI passes and no Critical or Important finding is open. A PR into `main`
  deploys to production, so merge it only if `CLAUDE.md` "Git workflow" turns
  auto-merge into `main` on. Otherwise it stays ready for the user.
- **Medium confidence** moves a task up one tier; **Low confidence** makes it
  High.
- Say in your report which PRs you merged and which wait for the user, and why.

## 3. Agree what can't be guessed

Before launching, settle each of these that isn't already decided:

- **Shared contracts**: any interface two tasks both use (a component's inputs
  and selector, a service method, a route's data flags). Write it down exactly;
  one task owns it.
- **Ownership**: which task owns each file or folder. Hot files shared by many
  features (`app.routes.ts`, `app.routes.server.ts`, `e2e/support/routes.ts`,
  `src/styles.scss`, `README.md`) get one owner, or are marked append-only.
- **Order**: tasks that depend on another's output run after it, or after its
  contract is merged. Parallelize only independent tasks.
- **Design direction and scope cuts**, when the issue leaves them open.

Ask in one round with the `grilling` skill's format (numbered questions, each
with your recommended answer), and only about what you can't decide from the
code, issues, or `CLAUDE.md`. If the user said not to ask, take your
recommendations and list them as assumptions in the briefs and your report.
High-tier plans always need the user's approval.

## 4. Branches

- Base: `main`, or the parent issue's branch for sub-issues (each sub-issue's PR
  targets it). Create the base branch if needed and check it out before
  launching: worktrees start from your `HEAD` (`worktree.baseRef: "head"`).
- Names follow the repo. E.g. `<issue-stype>/<n>-<slug>`.
- Assign each agent unique e2e ports: `E2E_PORT=43<k>0`,
  `DEV_PUBLIC_API_URL=http://localhost:41<k>0` for agent `k`.

## 5. Record the plan, then launch

Nothing you decide may live only in your context or an agent's prompt.

1. Post the **plan of record** as one comment on the issue (for work spanning
   several issues, on a new tracking issue that links them), starting with
   `<!-- orchestration-plan -->` so it can be found again:
    - tasks with their branch, base, tier, and owned files
    - shared contracts, written exactly
    - order and merge order
    - decisions, marked as the user's or your assumptions
    - a checklist of tasks, filled in with each PR link
2. Fill in [brief-template.md](brief-template.md) for each task, linking the
   plan comment, and launch the `implementer` agents in one message, in the
   background. Don't poll; you're notified when each finishes.
3. Keep the comment current (`gh api -X PATCH` on the comment): contract
   changes, new decisions, PR links, merges. If a contract changes, update the
   comment before telling any agent.

Decisions that outlive the work (a new shared pattern, a convention) go into
`.claude/docs/` or code comments in the PR that introduces them.

## 6. Review

For each finished agent:

1. Read its report and PR. Run the reviewers the tier lists on the PR branch
   against its base. Point them at the agent's worktree (its completion notice
   gives the path), and wait for all of them before sending fixes, so the agent
   gets one list.
2. Send fixes back to the same agent (`SendMessage`), which keeps its context,
   rather than fixing them yourself. A fix round replays the agent's whole
   context, so send Critical and Important findings (the `a11y-auditor`'s
   Blocker and Serious) and only the cheap Minor ones; list the rest in the PR
   or a follow-up. Fix only trivial issues directly. If a fix needs files the
   task doesn't own, update ownership in the plan first. Findings outside every
   task's files go into a follow-up issue.
3. Before blaming a PR for an e2e failure, run the same spec on the base.

## 7. Integrate

- Merge order: the contract owner first, then dependants in dependency order.
  Each later branch rebases onto the new base and resolves conflicts there,
  using the plan of record and both PRs to keep both sides' intent.
- Before the first merge, check for overlap:
  `git diff --name-only <base>...<branch>` for each branch, and
  `git merge-tree --write-tree <branch-a> <branch-b>` for conflicts. If the
  branches share files, or both touch shared code (`layout/`, `components/`,
  styles, routes), rehearse: merge them into a scratch branch, run the checks
  and the e2e the highest tier needs, then delete it. Otherwise skip it. Work
  that only becomes possible once both land (e.g. adopting a new shared
  component) gets its own follow-up task.
- Merge only what section 2 allows; never push to `main` directly.

## 8. Report

Link the plan comment, then a table per task: PR link, tier, the agent's
confidence, checks (ran / not run), review findings left open. Then decisions
made on the user's behalf, follow-ups, and anything about this process that went
wrong (fix this skill if it caused it).
