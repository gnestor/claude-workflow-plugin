# Workflow Plugin

A Claude Code plugin for workspaces using the Inbox app. Provides skills for workflow management, plugin creation, and rich output rendering.

## Skills

1. **workflow** — Create, run, and manage repeatable workflows. Each workflow has a `PLAN.md` with YAML frontmatter (triggers, parameters, schedule) that evolves inline after each execution.

2. **plugin-creator** — Build TypeScript `Plugin` files that add new data sources to the Inbox app. Plugins live at `{workspace}/plugins/{id}/plugin.ts` and are auto-discovered on server restart.

3. **render-output** — Guidelines and examples for the `render_output` MCP tool. Covers output type selection, React artifact design patterns, and component usage.

## Hooks

The Stop hook evaluates whether meaningful work was done. If so, it prompts Claude to update workspace files (skills, docs, todos, workflows, context pages) and commit via `/commit`.

## Plugin Loading

The Inbox app loads this plugin via the Claude Agent SDK's `plugins` option in `packages/inbox/server/lib/session-manager.ts`. Skills are trigger-based (loaded on-demand), hooks fire at session events.

Note: The plugin's CLAUDE.md is NOT visible to sessions — all agent-facing guidance lives in skill SKILL.md files and the MCP tool description.

## Companion Plugins

Install alongside for full functionality:

- **claude-plugins-official/commit-commands** — `/commit`, `/commit-push-pr` (required by Stop hook)
- **claude-plugins-official/skill-creator** — for creating new skills

## Development Preferences

- **Runtime**: Node.js + TypeScript
- **File format**: Markdown for documents
- **Workflow outputs**: `{workspace}/workflows/{name}/outputs/`
- **Downloads/intermediates**: `{workspace}/assets/{name}/`
