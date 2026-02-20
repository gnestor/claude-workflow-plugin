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

## Getting Started

After installing, say "customize" or run `/ecommerce:customize` to personalize the plugin:

1. **Scan** — The plugin scans its skills for `~~category` references and checks which MCP servers are connected
2. **Identity** — Set your business name, role, and preferences
3. **Connect** — Walk through configuring any unconfigured integrations (Shopify, Klaviyo, etc.)
4. **Discover** — Auto-populate workspace context from live data (store name, products, team, traffic)

You can re-run customization anytime to connect new services or refresh discovered context.

## Directory Structure

```
ecommerce/
├── .claude-plugin/plugin.json    # Plugin manifest
├── .mcp.json                     # MCP server declarations
├── hooks/                        # Self-learning hooks
│   ├── hooks.json                # Hook definitions (Stop + PreCompact)
│   └── precompact-summary.sh     # Transcript summary before compaction
├── servers/                      # Custom local MCP servers
├── skills/                       # Domain expertise (context only)
├── CONNECTORS.md                 # Tool integration documentation
├── README.md                     # This file
└── LICENSE
```

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
| Personalize plugin, connect services, discover context | customize             |
| Contribute plugin improvements upstream        | contribute            |

## Connectors

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

Business context and documentation preferences are created by `/ecommerce:customize` and stored in the user's project (`.claude/docs/` and `.claude/rules/`).

## Contributing

1. Clone this repo locally
2. Link to your workspace: `claude --plugin-dir path/to/ecommerce`
3. Make changes to skills, commands, or servers
4. Test with Claude Code
5. Submit a pull request

### Creating New Skills

Use `/skill-creator` to create new skills, or manually add a directory to `skills/` with a `SKILL.md` file. Optionally include a `references/` subdirectory for supporting data.

### From within the plugin

After working with the plugin, improvements to skills and workflows can be
contributed back automatically:

1. Run `/ecommerce:contribute` or say "contribute my improvements"
2. Claude classifies changes as generic (shareable) vs. company-specific (private)
3. Generic improvements are submitted as a PR or emailed as feedback

Configure contribution preferences during `/ecommerce:customize` or in `.claude/rules/contribution.md`.

### Adding MCP Servers

Use `/mcp-builder` to create new MCP servers, or manually:

1. Add the server entry to `.mcp.json`
2. If building a custom server, add it to `servers/`
3. Create a corresponding skill in `skills/`
4. Update `CONNECTORS.md` with the new category mapping

## Distributing

### Publishing

Update `.claude-plugin/plugin.json` with the current version, then publish:

```bash
claude plugins publish
```

This packages the plugin and makes it available via `claude plugins add ecommerce`.

### Forking for Your Industry

This plugin is built for e-commerce but the structure works for any domain. To create your own:

1. Fork this repo
2. Update `.claude-plugin/plugin.json` with your plugin name and description
3. Replace skills with your domain expertise
4. Replace MCP servers with your integrations
5. Update `CONNECTORS.md` with your `~~category` mappings
6. Publish: `claude plugins publish`

The `customize`, `contribute`, and `brand-voice` skills are domain-agnostic and work in any fork.