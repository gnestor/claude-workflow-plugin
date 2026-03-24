# Workflow Plugin

Agent infrastructure for the Hammies inbox workspace. Three skills:

1. **context-management** — Maintains a two-layer knowledge base: curated entity pages (`context/*.md`) and raw source files (`context/gmail/`, `context/notion/`). Use grep and qmd to query context, update pages after sessions.

2. **workflow** — Creates and executes reusable multi-step automations. Each workflow has a `PLAN.md` that evolves inline based on what actually works. Tracked in `.claude/docs/WORKFLOWS.md`.

3. **plugin-creator** — Builds TypeScript `Plugin` files that add new data sources to the inbox app. Plugins live in `{workspace}/plugins/{id}/plugin.ts` and are auto-discovered on server restart.

## Hooks

The Stop hook evaluates whether meaningful work was done. If so, it prompts Claude to update workspace context files (skills, company docs, todos, history, workflows, context pages) and then commit via `/commit`.

## Companion Plugins

These plugins are used alongside workflow and should be installed separately:

- **anthropic-agent-skills** — theme-factory, doc-coauthoring, claude-api
- **claude-plugins-official/skill-creator** — for creating new skills (workflow skill references this as a model)
- **claude-plugins-official/commit-commands** — `/commit`, `/commit-push-pr` (required by Stop hook)

## Plugin Loading

The inbox app loads this plugin via the Claude Agent SDK's `plugins` option in `packages/inbox/server/lib/session-manager.ts`. Skills are trigger-based (loaded on-demand), hooks fire at session end.
