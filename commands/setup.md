---
name: setup
description: Personalize the plugin for your business — identity, brand, integrations, and verification.
---

# Plugin Setup

Guide the user through personalizing the ecommerce plugin. This command runs on first use and can be re-run to update configuration.

## Process

Run each phase sequentially. After each phase, summarize what was configured before moving to the next.

### Phase 1: Identity

Ask the user the following questions (one message, let them answer all at once):

1. What is your name?
2. What is your business name?
3. What is your role? (owner, marketing manager, operations, developer, etc.)
4. Describe your business in 1-2 sentences.
5. What tone should the agent use? (casual / professional / direct)

**Actions after answers:**
- Update `skills/company/SKILL.md` with the business overview
- Update `README.md` Agent Identity section with personalized identity, name, and tone preference

### Phase 2: Brand (optional)

Ask: "Do you have brand guidelines you'd like the agent to follow? (colors, fonts, voice, visual style)"

If the user says yes, ask for:
- Brand colors (primary, secondary, accent -- hex values preferred)
- Fonts/typography (headings, body)
- Brand voice description (e.g., "warm and witty", "clean and professional")
- Visual style direction (e.g., "minimalist", "bold and colorful")

If the user says no or wants to skip, acknowledge and move on.

**Actions after answers:**
- Update `skills/brand-voice/SKILL.md` with the brand details, filling in the template tables and voice section

### Phase 3: Integrations

Present the available integrations from `CONNECTORS.md` and ask which ones the user needs. Group them by type:

**OAuth integrations** (browser-based authentication):
- Google (Gmail, Analytics, Sheets, Drive, BigQuery, Ads, Search Console)
- Pinterest
- QuickBooks

**API key integrations** (user provides credentials):
| Service | Category | How to get credentials |
|---------|----------|----------------------|
| Shopify | ~~e-commerce | Settings > Apps > Develop apps > Create > Install > Copy Admin API token |
| Klaviyo | ~~email-marketing | Settings > API Keys > Create Private API Key > Copy |
| Notion | ~~knowledge-base | notion.so/my-integrations > New integration > Copy token |
| Instagram | ~~social-media | Meta Developer portal > Instagram Graph API > Generate token |
| Meta Ads | ~~paid-social | Meta Business Suite > System Users > Generate token |
| Gorgias | ~~customer-support | Settings > REST API > Copy domain, email, API token |
| Air.inc | ~~dam | Settings > API > Generate key |
| Google AI Studio | ~~ai-generation | aistudio.google.com > Get API key |

**Database** (connection string):
- PostgreSQL -- provided by host (Supabase, Railway, Neon, etc.)

For each integration the user selects:

1. **OAuth services**: Explain that these are configured via OAuth flow. The user needs to provide client ID and client secret, then run the auth script. Walk them through it step by step.
2. **API key services**: Walk through the credential acquisition steps listed above. After the user provides values, instruct them to add the environment variables to their MCP server configuration (`.mcp.json` or Claude Desktop settings) as `env` entries.
3. **Database**: Ask for connection details (host, database, user, password) and instruct on adding to MCP server configuration.

**Important**: Environment variables are set in the MCP server configuration (`.mcp.json` `env` entries or Claude Desktop settings). See each server's documentation for the required variable names.

### Phase 4: Verify

For each configured integration:
1. Attempt a simple read-only operation using the `~~category` tools to verify the connection works
2. Report success or failure for each

**Verification tests by category:**
- `~~e-commerce`: Fetch recent orders or product count
- `~~email-marketing`: List recent campaigns
- `~~customer-support`: Fetch recent tickets
- `~~accounting`: List recent invoices
- `~~paid-social`: List ad accounts
- `~~search-ads`: List accessible accounts
- `~~analytics`: List properties
- `~~seo`: List sites
- `~~knowledge-base`: Search pages
- `~~database`: Run `SELECT 1`
- `~~social-media`: Fetch profile info
- `~~dam`: List workspaces or boards
- `~~workspace`: List recent emails or files

After verification, show a summary:

```
## Setup Complete

**Business:** [name]
**User:** [name] ([role])
**Tone:** [preference]
**Brand:** [configured / skipped]
**Integrations:**
  - [service]: Connected
  - [service]: Connected
  - [service]: Failed -- [reason]
```

Suggest first tasks based on configured integrations:
- "Show me my recent orders" (if ~~e-commerce configured)
- "How did my email campaigns perform this month?" (if ~~email-marketing configured)
- "What are my top support issues?" (if ~~customer-support configured)
- "Run an SEO audit" (if ~~seo configured)

## Re-running Setup

If the user re-runs setup, ask which phase they want to update rather than re-running everything. Offer:
1. Update identity
2. Update brand guidelines
3. Add/update integrations
4. Re-verify connections
