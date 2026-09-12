---
name: catalog-review
description: >-
  Review CatalogMaker changes for bugs, regressions, and explicit repo-standard violations.
  Use for requested code reviews, pre-PR checks, and before handing off meaningful code changes.
  Report findings without editing files; ordinary documentation edits need only a focused consistency check.
---

# Catalog review

Review the final change as a maintainer of this browser-only catalog editor.
Explicit invocation: `$catalog-review review this branch before a PR against main`.

## Set the scope

1. Read the applicable [AGENTS.md](../../../AGENTS.md) and
   [architecture note](../../../docs/ARCHITECTURE.md); inspect code where a claim matters.
2. Run `git status --short`, `git diff --stat`, `git diff --cached --stat`, and
   `git ls-files --others --exclude-standard`. Identify staged, unstaged, and untracked files.
3. Honor an explicit commit, file selection, or comparison branch. For ordinary handoff,
   review the task's changes against its starting state, including files added by the task.
   Preserve and distinguish pre-existing user edits; ask only if scope cannot be established.
4. For pre-PR review, use the requested base; otherwise resolve locally available `origin/main`,
   falling back to `main`. Verify it resolves to a commit. If an explicitly requested base is
   missing, report that instead of silently choosing another. If neither default exists, ask.
   Assign the chosen branch ref to `review_ref`.
5. For that branch comparison, resolve `git merge-base HEAD "$review_ref"` as `review_base`.
   Inspect `git diff --name-status "$review_base"` and the complete `git diff "$review_base"`.
   This compares the merge base to the working tree, including committed and uncommitted changes.
   Also inspect `git diff --cached` and `git diff` for staging context; findings concern the
   final selected state, not an intermediate edit already corrected in the working tree.
6. Read relevant untracked files separately; Git diff does not include them. For an explicitly
   selected commit, use that commit's files and diff, excluding later working-tree edits.
7. State the scope and, for branch reviews, the base ref and merge-base SHA. Use local refs and disclose that
   remote freshness was not checked. Record missing history or inaccessible files as limitations.

## Trace the change

- Read every changed hunk and enough surrounding code, callers, types, and styles to understand it.
  If output truncates, read in smaller portions rather than silently skipping the remainder.
- Follow UI → store → persistence and preview → export paths when the change crosses them.
- Read targeted Git history or blame to distinguish intentional behavior, older bugs, and regressions.
- Inspect relevant tests/checks if present. Confirm a suspected issue is not handled elsewhere.
- Match library guidance to the installed versions; use available Context7 or official docs when
  an API detail determines a finding. Do not apply Next.js/server patterns to this React/Vite app.

## Check affected behavior

Apply the relevant checks; unrelated areas do not need a full audit.

| Area | What to verify |
|---|---|
| Persistence | Metadata/blob writes, settings subscription, hydration ordering, refresh, reset, async failures, compatibility with stored records. A setter need not save settings itself. |
| Images | IDs remain unique across add/import paths; replacement, deletion, and reset release owned URLs/blobs without revoking images still in use. Placeholders own no blob URL. |
| PDF and HTML | Temporary base64 stays outside stores; capture uses current fields, images, opacity, dimensions, and links; wrappers/body classes/loading state clean up on failure or cancellation. |
| Pagination | Empty catalogs, 30/31-entry index boundary, counts 1–5, partial last pages, layout overrides, page refs, and page numbers agree across preview, sidebar, and exports. |
| Excel | First-sheet/header handling, malformed/empty rows, price/name normalization, image matching, append behavior, and error/confirmation state follow the implemented contract. |
| React | Effect dependencies, subscription/listener cleanup, stale closures, StrictMode startup, and expensive updates have a concrete effect on the changed flow. |
| UI and CSS | Shared variables and existing components are used consistently; keyboard/touch access, mobile tabs, sizing, and print/capture styles preserve the intended behavior. |
| Identity and publishing | Production gate versus dev bypass, credential exposure, HTML escaping, request failures, and deploy readiness. Identity UI does not authorize a separate publishing token. |
| Repo standards | TypeScript types, browser-only APIs, component layering, global CSS, no new code comments, utils without React/store imports or import-time effects, and accurate docs. |

## Validate findings

- Demonstrate a reachable input or sequence and the resulting incorrect behavior.
- Check the selected base/version before claiming the change introduced the issue.
- Cite the explicit rule for a standards violation; an existing inconsistency is not a new rule.
- Report actionable regressions and new rule violations. Keep any material pre-existing issue
  separately labeled; do not turn a focused review into an unrelated cleanup backlog.
- Skip personal style preferences, hypothetical failure modes, and issues already fixed in
  the selected final state. Do not cap the number of supported findings or invent findings.

## Verification and boundaries

- Reuse a successful `npm run verify` result for the same file state or run it if needed.
  Report build/whitespace failures once; separate existing failures from those caused by the change.
  For a historical commit review, a current working-tree build does not validate that commit.
- During a branch review, also use `git diff --check "$review_base"` for committed whitespace
  changes. Inspect untracked files explicitly; the verify command does not cover them.
- For affected browser flows, use already available tooling and disposable local catalog data.
  Record exercised scenarios and results. If browser tooling is unavailable, describe the
  remaining checks instead of claiming runtime validation or silently downloading a tool.
- Review without editing source, staging, committing, pushing, posting comments, or deploying.
  Build artifacts are permitted. Install nothing and delegate to no additional agents by default.
- The implementation workflow may address confirmed findings within its existing authorization,
  then rerun affected verification and review the corrections. A review request alone is not a fix request.

## Report

Return findings first, ordered by impact. Use `[P1] Short corrective title — path:line`.
Each finding needs its affected scenario, evidence, consequence, and a concrete correction.
Use the smallest relevant line location in the selected diff; label older issues separately.

- P0: critical failure or release blocker affecting all normal use of the changed path.
- P1: urgent correctness, security, or data-loss defect.
- P2: ordinary functional regression or significant maintainability issue.
- P3: low-impact actionable issue, including a concrete repo-standard violation.

After findings, briefly state scope, checks run, and remaining gaps. If no qualifying issues
were found, say so without asserting that untested behavior works or that every bug was excluded.

## Workflow references

Original repo-specific guidance informed by
[Anthropic's code reviewer](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/pr-review-toolkit/agents/code-reviewer.md)
and [Sentry's find-bugs skill](https://github.com/getsentry/skills/blob/main/skills/find-bugs/SKILL.md).
These are background sources, not runtime dependencies or additional repository standards.
