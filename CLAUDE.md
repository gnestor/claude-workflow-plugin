# Ecommerce Plugin

E-commerce operations assistant for Claude Code. Users install this plugin to manage their business through natural language — querying data, automating workflows, and connecting services.

## How It Works

- **Skills** (`skills/`) provide domain expertise as context. Each skill has a `SKILL.md` with instructions and optional `references/` for supporting data. Skills use `~~category` placeholders (e.g., `~~e-commerce`) to reference tool categories defined in `CONNECTORS.md`.
- **MCP servers** (`servers/`, `.mcp.json`) provide API access. Custom servers are in `servers/`, community/hosted servers are declared in `.mcp.json`.
- **Hooks** (`hooks/`) automate workspace maintenance. The Stop hook updates context files after meaningful work. The PreCompact hook saves transcript context before compaction.
- **User context** (`.claude/docs/`, `.claude/rules/`) stores business info, preferences, and session history. Created by the `customize` skill, maintained by hooks.

## Contributing

See `README.md` for full details. Skills are context-only markdown — no code. MCP servers are Node.js with `@modelcontextprotocol/sdk`. Use `CONNECTORS.md` to map `~~category` placeholders to MCP servers.
