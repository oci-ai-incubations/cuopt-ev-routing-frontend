---
name: github
description: PR workflow — push branch, open PR, monitor CI, request review.
user-invocable: true
allowed-tools: Bash, Read, Grep, AskUserQuestion, TaskCreate, TaskUpdate, TaskList, TaskGet
argument-hint: [open-pr|check-pr|monitor-ci|request-review]
---

# GitHub PR Workflow

## Preflight

Every sub-command starts with:
```bash
gh auth status
git rev-parse --show-toplevel
```

## Sub-commands

### open-pr

1. Confirm not on `main`. If on main, ask for branch name: `git checkout -b <branch>`
2. Check for uncommitted changes: `git status`
3. Push: `git push -u origin HEAD`
4. Create PR: `gh pr create --title "<title>" --body "<body>"`
5. Report the PR URL.

### check-pr (default)

```bash
gh pr view --json number,title,state,reviews,statusCheckRollup,mergeable,headRefName
```

Display CI jobs, review status, and merge readiness. If no PR exists, direct the user to run `/github open-pr`.

### monitor-ci

```bash
gh run list --branch $(git branch --show-current) --limit 1 --json databaseId,status,conclusion
gh run watch <run-id>
```

On failure: get logs with `gh run view <run-id> --log-failed`. Categorize by job (lint, test, security). For code failures: fix, commit, push, re-monitor. For auth/secrets failures: escalate to user — Claude cannot fix GitHub Actions secrets.

### request-review

```bash
gh pr edit --add-reviewer <reviewer>
```

Warn if CI is not yet passing.

## Notes

- Never force-push. Always create new commits for fixes.
- Use TaskCreate/TaskUpdate to track multi-step fix attempts.
