# Agent Workspace

AI workspace for business operations, powered by Claude Code with agent skills and workflows.

## Overview

This workspace gives an AI agent specialized knowledge and tools through **skills** — directories containing documentation, context, and scripts in `.claude/skills/`. The agent automatically detects when to use each skill based on your requests.

### What This Enables

**Natural Language Data Access:**
- Query Shopify orders, products, customers, and inventory
- Analyze Google Analytics website traffic and user behavior
- Query Google Sheets for financial data and metrics
- Search and query Notion workspace content
- Query Klaviyo email/SMS marketing data
- Access QuickBooks accounting and financial reports
- Manage Instagram, Pinterest, and Meta ads
- Query PostgreSQL data warehouse with natural language

**Browser Automation:**
- Automate Chrome browser via DevTools Protocol
- Record and replay browser interactions

**Content & Documents:**
- Generate documents (PDF, DOCX, XLSX, PPTX) via plugins
- Draft emails, social posts, and ad copy
- Create web components and interactive dashboards

## Quick Start

See [SETUP.md](SETUP.md) for the full setup guide.

1. Fork this repo
2. Open in VS Code with Claude Code extension (or Craft Agents)
3. Tell the agent: **"Run the setup workflow"**
4. The agent personalizes the workspace for your business

## Directory Structure

```
agent-workspace/
├── AGENTS.md                    # Primary agent context (cross-tool standard)
├── CLAUDE.md                    # Links to AGENTS.md (for Claude Code)
├── SETUP.md                     # Setup guide for non-coders
├── .claude/
│   ├── skills/                  # Agent skills
│   │   ├── company/             # Your business context (populated during setup)
│   │   ├── brand-guidelines/            # Your brand guidelines (populated during setup)
│   │   ├── shopify/             # Shopify GraphQL API
│   │   ├── google/              # Gmail, Analytics, Sheets, Drive, BigQuery, Ads
│   │   ├── klaviyo/             # Email/SMS marketing
│   │   ├── notion/              # Notion workspace
│   │   ├── postgresql/          # PostgreSQL data warehouse
│   │   ├── quickbooks/          # Accounting and financial reports
│   │   ├── instagram/           # Instagram content and analytics
│   │   ├── meta-ads/            # Meta/Facebook/Instagram ads
│   │   ├── pinterest/           # Pinterest boards and analytics
│   │   ├── gorgias/             # Customer support tickets
│   │   ├── air/                 # Digital asset management
│   │   ├── puppeteer/           # Chrome browser automation
│   │   ├── higgsfield/          # AI image generation
│   │   ├── recap/               # Session documentation
│   │   ├── reports/             # Report generation
│   │   └── seo/                 # SEO optimization
│   └── settings.json            # Claude Code hooks (Entire CLI)
├── lib/
│   └── oauth.ts                 # Unified OAuth client (loopback flow)
├── workflows/                   # Workflow outputs and plans
├── downloads/                   # Working files (gitignored)
├── scripts/
│   └── setup.sh                 # Prerequisites installer
├── .env                         # Credentials (gitignored)
├── .env.example                 # Credential template
└── deno.json                    # Deno configuration
```

## Architecture

### Skills-Based Approach

This workspace uses **Agentic Skills** rather than MCP servers. Skills are:

- **Simple**: Markdown documentation + TypeScript scripts
- **Secure**: Explicit control over what tools and data each skill can access
- **Auto-invoked**: The agent detects when to use each skill
- **Git-friendly**: Easy to version, share, and collaborate on
- **Self-improving**: Skills evolve as they're used

### How Skills Work

1. **Detection**: The agent reads skill documentation and decides when to invoke them
2. **Execution**: Skills run Deno TypeScript scripts that interact with APIs and databases
3. **Context**: Skills have access to reference data stored alongside them

### Plugins

Document generation and skill creation come from the Anthropic plugin marketplace:

```
/plugin install document-skills@anthropic-agent-skills
/plugin install skill-creator@anthropic-agent-skills
```

## Technology Stack

- **Runtime**: Deno (not Node.js)
- **Language**: TypeScript
- **Data**: CSV for tables, JSON for nested data
- **Frontend**: React, Observable Framework

## Frontend Options

| Frontend | Best For | Setup |
|----------|----------|-------|
| **VS Code + Claude Code** | Full IDE experience with file browser | Install extension, open folder |
| **Craft Agents** | Desktop GUI with multi-session inbox | Set working directory, symlink skills |
| **Claude Desktop** | Quick questions, simple tasks | Enable Claude Code, open folder |

## Contributing

As you use the workspace, the agent improves skills and context files. To contribute improvements back:

1. Tell the agent: **"Submit my improvements"**
2. The agent creates a branch and pull request
3. Approve it in the GitHub web UI

Entire CLI auto-commits after each agent response, so you never need to use git manually.

### Creating New Skills

Ask the agent: **"Create a new skill for [topic]"** (requires skill-creator plugin).

Skill structure:
```
.claude/skills/my-skill/
├── SKILL.md              # Documentation (required)
├── scripts/              # TypeScript scripts
│   └── main.ts
└── references/           # Supporting data
    └── examples.md
```

## Environment Variables

Copy `.env.example` to `.env` and configure the services you use. See the setup workflow for guided configuration.

## Security

- Never commit `.env` (already in .gitignore)
- Review skill scripts before running
- API keys are stored locally in `.env`
- OAuth uses loopback redirect (no cloud middleman)
