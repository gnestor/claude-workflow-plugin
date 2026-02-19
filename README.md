# Ecommerce Plugin

E-commerce operations assistant for Claude Code. Query data, automate workflows, and manage your business through natural language.

## Installation

```bash
claude plugins add ecommerce
```

Or for local development:

```bash
claude --plugin-dir path/to/ecommerce
```

## Commands

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `/ecommerce:setup` | Personalize the plugin for your business |

## Skills

| Domain                                         | Skill                 |
| ---------------------------------------------- | --------------------- |
| Shopify orders, products, customers, inventory | shopify               |
| Email/SMS marketing, campaigns, flows          | klaviyo               |
| Customer support tickets                       | gorgias               |
| Accounting, financial reports                  | quickbooks            |
| Facebook/Instagram ad management               | meta-ads              |
| Google ad management                           | google-ads            |
| Website traffic, sessions, conversions         | google-analytics      |
| Search performance, SEO data                   | google-search-console |
| Email management                               | gmail                 |
| File storage, documents                        | google-drive          |
| Spreadsheets, financial metrics                | google-sheets         |
| Cloud data warehouse                           | google-bigquery       |
| AI image/text generation                       | google-ai-studio      |
| Search keyword trends                          | google-trends         |
| Calendar, meetings                             | google-calendar       |
| Instagram organic content, UGC                 | instagram             |
| Pinterest boards, pins                         | pinterest             |
| Knowledge base, tasks, notes                   | notion                |
| Cross-source data joins, historical data       | postgresql            |
| Digital assets, media library                  | air                   |
| SEO research, keyword optimization             | seo                   |
| Browser automation                             | puppeteer             |
| Brand voice and style guidelines               | brand-voice           |

## MCP Integrations

This plugin uses MCP servers for API access. See [CONNECTORS.md](CONNECTORS.md) for the full list of integrations and how to configure them.

**Hosted MCP servers** (handle auth automatically):

- Shopify, Klaviyo, Notion, QuickBooks, Google Analytics, Google Ads

**Local MCP servers** (included in `servers/`):

- Gorgias, Air.inc, Google Workspace (Gmail, Drive, Sheets, Calendar), Google Search Console, Google BigQuery, Google AI Studio, Google Trends, Instagram, Pinterest, Meta Ads

**Community MCP servers** (via npm):

- PostgreSQL, Puppeteer

## Hooks

This plugin includes hooks that automatically maintain workspace context after meaningful work:

- **Stop hook** (prompt): After Claude finishes a task, a fast model evaluates whether context files should be updated. If so, Claude reviews its work and updates skills, company docs (`.claude/docs/COMPANY.md`), task tracking (`.claude/docs/TODO.md`), and session history (`.claude/docs/HISTORY.md`).
- **PreCompact hook** (command): Before context compaction, key information from the transcript is saved to `.claude/docs/history/` so it isn't lost.

Business context and documentation preferences are created by `/ecommerce:setup` and stored in the user's project (`.claude/docs/` and `.claude/rules/`).

## Contributing

1. Clone this repo locally
2. Link to your workspace: `claude --plugin-dir path/to/ecommerce`
3. Make changes to skills, commands, or servers
4. Test with Claude Code
5. Submit a pull request

### Creating New Skills

Use `/skill-creator` to create new skills, or manually add a directory to `skills/` with a `SKILL.md` file. Optionally include a `references/` subdirectory for supporting data.

### Adding MCP Servers

Use `/mcp-builder` to create new MCP servers, or manually:

1. Add the server entry to `.mcp.json`
2. If building a custom server, add it to `servers/`
3. Create a corresponding skill in `skills/`
4. Update `CONNECTORS.md` with the new category mapping

## Directory Structure

```
ecommerce/
├── .claude-plugin/plugin.json    # Plugin manifest
├── .mcp.json                     # MCP server declarations
├── hooks/                        # Self-learning hooks
│   ├── hooks.json                # Hook definitions (Stop + PreCompact)
│   └── precompact-summary.sh     # Transcript summary before compaction
├── servers/                      # Custom local MCP servers
├── commands/                     # Slash command definitions
├── skills/                       # Domain expertise (context only)
├── CONNECTORS.md                 # Tool integration documentation
├── README.md                     # This file
└── LICENSE
```
