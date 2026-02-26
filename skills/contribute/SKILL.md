---
name: contribute
description: >
  Contribute plugin improvements back to the upstream repository.
  Activate when: user says "contribute", "share improvements", "submit changes",
  "create PR for plugin", "send feedback", "share this fix upstream",
  or wants to share skill improvements with the plugin community.
---

# Contribute Plugin Improvements

Share generic skill improvements, workflow fixes, and new examples back to the upstream plugin repository. Company-specific changes (brand, docs, API keys) are automatically excluded.

## Process

### 1. Detect Environment

Check the contribution method available:

1. Read `.claude/rules/contribution.md` for user preferences (if it exists)
2. Check if the plugin directory is a Git repo: `git remote -v`
3. Check if `gh` CLI is authenticated: `gh auth status`
4. Read `repository` field from `.claude-plugin/plugin.json` for the upstream URL

### 2. Collect Changes

Gather all modifications to the plugin:

```bash
# Changed tracked files
git diff --name-only

# Staged changes
git diff --cached --name-only

# New untracked files in skills/
git ls-files --others --exclude-standard skills/
```

If there are no changes, tell the user and stop.

### 3. Classify Changes

Apply the classification rules from [references/classification.md](references/classification.md) to separate **generic** (shareable) changes from **company-specific** (private) changes.

Present a summary to the user:

```
## Changes to contribute (generic improvements)

- skills/gorgias/references/workflow-examples.md — Added ticket search workflow
- skills/seo/SKILL.md — Fixed keyword scoring formula

## Changes kept private (company-specific)

- .claude/docs/COMPANY.md — Business context
- skills/brand-voice/SKILL.md — Brand guidelines
- ~/.config/workflow-plugin/ — Encrypted credentials (never in repo)
```

Ask the user to confirm before proceeding. They can include or exclude specific files.

### 4. Submit Changes

#### GitHub (preferred)

If `gh` is authenticated and the upstream repo is accessible:

1. Ensure changes are committed locally
2. Fork the upstream repo if the user doesn't have push access: `gh repo fork [upstream] --clone=false`
3. Create a contribution branch: `git checkout -b contribute/[descriptive-name]`
4. Stage only the generic files identified in step 3
5. Commit with a descriptive message summarizing the improvements
6. Push to the user's fork
7. Create a PR against the upstream repo:

```bash
gh pr create --repo [upstream] --title "[description]" --body "$(cat <<'EOF'
## Summary
[1-3 bullet points describing the improvements]

## Context
[What prompted these changes — extracted from .claude/docs/HISTORY.md if available]

## Changes
[List of files modified with brief descriptions]

---
Contributed via the workflow plugin's self-learning system.
EOF
)"
```

8. Return to the previous branch: `git checkout -`
9. Report the PR URL to the user

#### Email (fallback)

If GitHub is not available but `~~workspace` email tools are connected:

1. Format the generic changes as a markdown document including:
   - Summary of improvements
   - Full diffs for each changed file
   - Context from `.claude/docs/HISTORY.md`
2. Send to the feedback email from `.claude/rules/contribution.md`
3. If no email is configured, save to `.claude/docs/contributions/YYYY-MM-DD-contribution.md` and tell the user where to find it

### 5. Check for Queued Contributions

If `.claude/docs/TODO.md` contains items tagged `[contribute]`, include those in the contribution summary and remove the tags after successful submission.

## When NOT to Use

- No changes have been made to the plugin
- All changes are company-specific (nothing generic to share)
- User explicitly opted out of contributions in `.claude/rules/contribution.md`
