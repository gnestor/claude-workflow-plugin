---
name: customize
description: "Customize and personalize the ecommerce plugin. Activate when: user says 'customize', 'personalize', 'configure', 'set up', 'set up plugin', 'connect my services', 'discover my data', 'scan my accounts', or wants to personalize the plugin, connect integrations, or populate workspace context."
---

# Plugin Customizer

Make this plugin yours. Scan for what the plugin needs, connect services, gather business context from live data, and configure preferences — all in one flow or incrementally as services come online.

## Process

### 1. Scan Plugin Requirements

Scan all `skills/*/SKILL.md` files for `~~category` references to build a list of tool categories the plugin uses:

```bash
grep -roh '~~[a-z-]*' skills/ | sort -u
```

Cross-reference with `CONNECTORS.md` to get the full mapping of categories → available MCP servers → what each provides.

Check which categories are already configured by reading `.mcp.json` and testing each connection with a lightweight read-only call.

Present the results:

```
## Plugin Requirements

| Category | Status | Server |
|----------|--------|--------|
| ~~e-commerce | Connected | Shopify |
| ~~email-marketing | Connected | Klaviyo |
| ~~customer-support | Not configured | — |
| ~~analytics | Configured but failing | Google Analytics |
| ~~accounting | Not configured | — |
...
```

### 2. Identity & Preferences

If `.claude/docs/COMPANY.md` doesn't exist yet (first-time setup), ask the user:

1. What is your name?
2. What is your business name?
3. What is your role? (owner, marketing manager, operations, developer, etc.)
4. Describe your business in 1-2 sentences.
5. What tone should the agent use? (casual / professional / direct)

**Actions after answers:**
- Create `.claude/docs/COMPANY.md` with the business overview, linking to sub-files:
  - `.claude/docs/team.md` — Team directory (user's name/role as first entry)
  - `.claude/docs/goals.md` — Business goals (empty template)
  - `.claude/docs/products.md` — Product catalog notes (empty template)
- Update `README.md` Agent Identity section with personalized identity
- Add a reference to `.claude/docs/COMPANY.md` in the user's `CLAUDE.md` if not already present

**COMPANY.md template:**
```markdown
# [Business Name]

[Business description from user's answer]

**Owner:** [Name] ([Role])

## Quick Reference

- Website: [ask or leave blank]
- Industry: [inferred from description]

## Detailed Context

| File | Description |
|------|-------------|
| [team.md](team.md) | Team directory with roles and contact info |
| [goals.md](goals.md) | Business goals and priorities |
| [products.md](products.md) | Product catalog and details |

Add more context files as needed (marketing.md, operations.md, finance.md, etc.).

## Current State

[To be populated as the agent learns about the business through conversations]
```

If `.claude/docs/COMPANY.md` already exists, skip this step unless the user asks to update identity.

**Brand (optional):** Ask if the user has brand guidelines (colors, fonts, voice, visual style). If yes, update `skills/brand-voice/SKILL.md`.

**Documentation preferences:** Ask about documentation style, tone, and history retention. Create `.claude/rules/documentation.md`.

**Contribution preferences:** Ask if the user wants to contribute improvements upstream. Create `.claude/rules/contribution.md`. See the `contribute` skill for details on the contribution flow.

### 3. Connect Services

For each unconfigured category identified in step 1, walk the user through connecting the service.

**OAuth integrations** (browser-based authentication):
- Google (Gmail, Analytics, Sheets, Drive, BigQuery, Ads, Search Console)
- Pinterest
- QuickBooks

**API key integrations** (user provides credentials):

| Service | Category | How to get credentials |
|---------|----------|----------------------|
| Shopify | `~~e-commerce` | Settings > Apps > Develop apps > Create > Install > Copy Admin API token |
| Klaviyo | `~~email-marketing` | Settings > API Keys > Create Private API Key > Copy |
| Notion | `~~knowledge-base` | notion.so/my-integrations > New integration > Copy token |
| Instagram | `~~social-media` | Meta Developer portal > Instagram Graph API > Generate token |
| Meta Ads | `~~paid-social` | Meta Business Suite > System Users > Generate token |
| Gorgias | `~~customer-support` | Settings > REST API > Copy domain, email, API token |
| Air.inc | `~~dam` | Settings > API > Generate key |
| Google AI Studio | `~~ai-generation` | aistudio.google.com > Get API key |

**Database** (connection string):
- PostgreSQL — provided by host (Supabase, Railway, Neon, etc.)

For each integration:
1. **OAuth services**: Walk through the OAuth flow step by step.
2. **API key services**: Walk through credential acquisition. Add environment variables to `.mcp.json` `env` entries.
3. **Database**: Ask for connection details and add to MCP server configuration.

### 4. Verify & Discover

For each configured integration, run a verification test AND extract business context:

| Category | Verification test | Context to discover |
|----------|------------------|-------------------|
| `~~e-commerce` | Fetch shop info | Store name, URL, currency, product count, top products |
| `~~email-marketing` | List campaigns | List/segment count, recent campaign performance |
| `~~customer-support` | Fetch recent tickets | Ticket volume, common tags, team members |
| `~~accounting` | List recent invoices | Business legal name, currency, fiscal year |
| `~~paid-social` | List ad accounts | Ad account name, spend overview |
| `~~search-ads` | List accounts | Account name, active campaigns |
| `~~analytics` | List properties | Website URL, property ID, monthly sessions |
| `~~seo` | List sites | Verified sites, top queries |
| `~~knowledge-base` | Search pages | Workspace structure, databases, team wikis |
| `~~database` | `SELECT 1` | Available tables, schema overview |
| `~~social-media` | Fetch profile | Username, follower count, content themes |
| `~~dam` | List workspaces | Asset library structure |
| `~~workspace` | List recent emails | User email, organization domain |

For each successful connection, merge discovered data into workspace context files:

- `.claude/docs/COMPANY.md` — Business overview
- `.claude/docs/products.md` — Product catalog from `~~e-commerce`
- `.claude/docs/team.md` — Team directory from `~~customer-support`, `~~knowledge-base`
- `.claude/docs/marketing.md` — Marketing context from `~~email-marketing`, `~~social-media`

**Rules:**
- Never overwrite user-written content — append or fill empty sections only
- Ask before adding data that might be sensitive (revenue, customer counts)
- Note the discovery source: `<!-- Discovered from ~~e-commerce on YYYY-MM-DD -->`

### 5. Summary & Next Steps

Show a summary of everything configured:

```
## Setup Complete

**Business:** [name]
**User:** [name] ([role])
**Tone:** [preference]
**Brand:** [configured / skipped]
**Documentation:** [detail level], [tone], saved to [location]
**Contributions:** [auto / ask / never]
**Integrations:**
  - ~~e-commerce (Shopify): Connected — discovered 150 products, 2.3k orders
  - ~~email-marketing (Klaviyo): Connected — 12k subscribers, 8 active flows
  - ~~customer-support: Not configured
  - ~~analytics (GA4): Connected — 45k monthly sessions
```

Suggest first tasks based on what's connected:
- "Show me my recent orders" (if `~~e-commerce` connected)
- "How did my email campaigns perform this month?" (if `~~email-marketing` connected)
- "What are my top support issues?" (if `~~customer-support` connected)
- "Run an SEO audit" (if `~~seo` connected)

Suggest unconfigured services that would add value based on the business type.

## Incremental Mode

When the user connects a new service or says "customize [category]":

1. Only scan and configure the specified category
2. Verify the connection
3. Discover context from the new service
4. Update workspace context files
5. Report what was found

This avoids re-running everything and lets users build up context gradually.

## Re-running

If customization has been run before, ask which area the user wants to update:

1. Update identity & company context
2. Update brand guidelines
3. Update documentation preferences
4. Update contribution preferences
5. Connect new services
6. Re-verify connections & refresh discovered context

## When NOT to Use

- User wants to contribute changes upstream → direct to the `contribute` skill
