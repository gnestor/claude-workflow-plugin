# Workflow Plugin

Workflow automation platform for Claude Code. Create, run, and manage repeatable workflows — orchestrating skills, querying data, and connecting services through natural language.

## Installation

```bash
claude plugins add workflow
```

Or for local development:

```bash
claude --plugin-dir path/to/workflow
```

## Setup

Install shared library dependencies:

```bash
cd lib && npm install
```

Connect services:

```bash
# OAuth services (Google, QuickBooks, Pinterest) — opens browser
node auth/setup.js google
node auth/setup.js quickbooks

# API key services — interactive prompts
node auth/setup.js gorgias
node auth/setup.js shopify

# Check connection status
node auth/setup.js --list

# Test a specific service
node auth/setup.js --test gorgias

# Migrate from .env file
node auth/setup.js --migrate
```

## Getting Started

After installing, say "customize" or run `/workflow:customize` to personalize the plugin:

1. **Scan** — The plugin scans its skills for `~~category` references and checks which services are connected
2. **Identity** — Set your business name, role, and preferences
3. **Connect** — Walk through connecting any unconfigured services
4. **Discover** — Auto-populate workspace context from live data (store name, products, team, traffic)

You can re-run customization anytime to connect new services or refresh discovered context.

## Directory Structure

```
workflow/
├── .claude-plugin/plugin.json    # Plugin manifest
├── auth/                         # Auth setup CLI
│   └── setup.js                  # Connect services, migrate .env, test
├── lib/                          # Shared library
│   ├── package.json              # Dependencies (pg, playwright)
│   ├── auth.js                   # Encrypted credential store + token refresh
│   ├── http.js                   # Authenticated fetch with retry
│   ├── output.js                 # JSON stdout/stderr formatter
│   ├── pagination.js             # Pagination helpers
│   └── services.json             # Service registry (auth patterns, base URLs)
├── hooks/                        # Self-learning hooks
│   └── hooks.json                # Hook definitions (Stop)
├── skills/                       # Domain expertise + client scripts
│   ├── _directive.md             # Global execution directive
│   ├── {service}/
│   │   ├── SKILL.md              # Context + command reference
│   │   ├── scripts/
│   │   │   └── client.js         # CLI commands for the service
│   │   └── references/
│   │       ├── examples.md       # Usage patterns (Stop hook updates)
│   │       └── documentation.md  # Full API documentation
│   └── ...
├── workflows/                    # User-specific automations (gitignored)
│   └── {name}/
│       ├── PLAN.md               # Workflow definition
│       └── outputs/              # Timestamped run outputs
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
| Gmail, Drive, Sheets, Calendar                 | google-workspace      |
| Cloud data warehouse                           | google-bigquery       |
| AI image/text generation                       | google-ai-studio      |
| Search keyword trends                          | google-trends         |
| Instagram organic content, UGC                 | instagram             |
| Pinterest boards, pins                         | pinterest             |
| Knowledge base, tasks, notes                   | notion                |
| Cross-source data joins, historical data       | postgresql            |
| Digital assets, media library                  | air                   |
| SEO research, keyword optimization             | seo                   |
| Browser automation                             | playwright            |
| Brand voice and style guidelines               | brand-voice           |
| Personalize plugin, connect services           | customize             |
| Create, run, and manage repeatable automations | workflow              |
| Contribute plugin improvements upstream        | contribute            |

## Connectors

This plugin uses client scripts for API access. See [CONNECTORS.md](CONNECTORS.md) for the full list of integrations and how to configure them.

Each service has a client script at `skills/{service}/scripts/client.js` that handles all API operations via CLI commands. Authentication is managed by `lib/auth.js` with encrypted local credential storage.

## Workflows

Workflows are user-specific automations created through conversation and stored locally (gitignored). They follow a plan-execute-learn cycle:

| Action | How |
|--------|-----|
| Create a workflow | Describe a repeatable task — plan mode guides the process |
| List workflows | "List my workflows" or "What workflows do I have?" |
| Run a workflow | Reference it by name or trigger phrase (e.g., "Run the weekly revenue report") |
| Edit a workflow | "Edit the revenue report workflow" |

Each workflow has a `PLAN.md` with steps, parameters, and triggers. After execution, the Stop hook updates the plan inline to reflect what actually works — no manual maintenance needed.

Workflows can output to local files (`outputs/`) or external destinations (Notion, Google Sheets, email, etc.).

## Hooks

This plugin includes hooks that automatically maintain workspace context after meaningful work:

- **Stop hook** (prompt): After Claude finishes a task, a fast model evaluates whether context files should be updated. If so, Claude reviews its work and updates skills, company docs (`.claude/docs/COMPANY.md`), task tracking (`.claude/docs/TODO.md`), session history (`.claude/docs/HISTORY.md`), and workflow plans (updating PLAN.md steps inline and `.claude/docs/WORKFLOWS.md` registry).

Business context and documentation preferences are created by `/workflow:customize` and stored in the user's project (`.claude/docs/` and `.claude/rules/`).

## Contributing

1. Clone this repo locally
2. Link to your workspace: `claude --plugin-dir path/to/workflow`
3. Install dependencies: `cd lib && npm install`
4. Make changes to skills or client scripts
5. Test with Claude Code
6. Submit a pull request

### Creating New Skills

Use `/skill-creator` to create new skills, or manually add a directory to `skills/` with a `SKILL.md` file, a `scripts/client.js` file, and optionally a `references/` subdirectory for supporting data.

### From within the plugin

After working with the plugin, improvements to skills can be
contributed back automatically (workflows are user-specific and never contributed):

1. Run `/workflow:contribute` or say "contribute my improvements"
2. Claude classifies changes as generic (shareable) vs. company-specific (private)
3. Generic improvements are submitted as a PR or emailed as feedback

Configure contribution preferences during `/workflow:customize` or in `.claude/rules/contribution.md`.

### Adding New Services

1. Create `skills/{service}/scripts/client.js` following the existing pattern
2. Add service config to `lib/services.json`
3. Create a corresponding skill in `skills/{service}/SKILL.md`
4. Update `CONNECTORS.md` with the new category mapping
5. If OAuth is needed, add the service to the `workflow-auth` proxy

## Distributing

### Publishing

Update `.claude-plugin/plugin.json` with the current version, then publish:

```bash
claude plugins publish
```

This packages the plugin and makes it available via `claude plugins add workflow`.

### Forking for Your Domain

This plugin ships with e-commerce skills but the structure works for any domain. To create your own:

1. Fork this repo
2. Update `.claude-plugin/plugin.json` with your plugin name and description
3. Replace or add skills for your domain expertise
4. Replace or add client scripts for your integrations
5. Update `CONNECTORS.md` with your `~~category` mappings
6. Publish: `claude plugins publish`

The `workflow`, `customize`, `contribute`, and `brand-voice` skills are domain-agnostic and work in any fork.
