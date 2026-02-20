# Ecommerce Plugin

E-commerce operations assistant for Claude Code. Users install this plugin to manage their business through natural language — querying data, automating workflows, and connecting services.

## How It Works

- **Skills** (`skills/`) provide domain expertise as context. Each skill has a `SKILL.md` with instructions and optional `references/` for supporting data. Skills use `~~category` placeholders (e.g., `~~e-commerce`) to reference tool categories defined in `CONNECTORS.md`.
- **MCP servers** (`servers/`, `.mcp.json`) provide API access. Custom servers are in `servers/`, community/hosted servers are declared in `.mcp.json`.
- **Hooks** (`hooks/`) automate workspace maintenance. The Stop hook updates context files after meaningful work.
- **User context** (`.claude/docs/`, `.claude/rules/`) stores business info, preferences, and session history. Created by the `customize` skill, maintained by hooks.

## Delegating to Subagents

Prefer delegating to subagents when the task is well-scoped and doesn't require conversation context or broad workspace awareness: API queries, data analysis, file exploration, content generation, and multi-step research.

Keep in the main context: tasks that need user interaction, depend on prior conversation, or require iterating on ambiguous requirements.

When delegating, tell subagents to include in their response:
- Key findings and data points discovered
- Anything that contradicts or updates existing workspace context
- Errors encountered and how they were resolved

This ensures the Stop hook can capture learnings that would otherwise be lost in the subagent's separate context.

## Contributing

See `README.md` for full details. Skills are context-only markdown — no code. MCP servers are Node.js with `@modelcontextprotocol/sdk`. Use `CONNECTORS.md` to map `~~category` placeholders to MCP servers.
