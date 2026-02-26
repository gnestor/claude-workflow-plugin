---
name: _directive
description: System directive for tool execution. Always loaded.
---

# Execution Directive

## Authentication

Credentials stored locally at `~/.config/workflow-plugin/credentials.enc`.
Client scripts load credentials automatically via `lib/auth.js`.

```bash
# Connect a service
node auth/setup.js <service>

# Check status
node auth/setup.js --list

# Test connectivity
node auth/setup.js --test <service>

# Migrate from .env
node auth/setup.js --migrate
```

## Execution Pattern

1. Identify which services are needed for the task
2. Read the relevant skill's SKILL.md for commands and context
3. Choose: **client script command** for standard ops, **inline script** for complex orchestration
4. Execute via Bash, capture JSON output
5. Process results, loop if paginated
6. For details beyond SKILL.md, read `references/documentation.md`

### Client Script Commands

```bash
# Standard operations
node skills/gorgias/scripts/client.js list-tickets --status open --limit 10
node skills/shopify/scripts/client.js query '{ shop { name url } }'
node skills/google-workspace/scripts/client.js gmail-search --query "is:unread"
node skills/notion/scripts/client.js search --query "meeting notes"
node skills/postgresql/scripts/client.js query "SELECT 1"
```

### Inline Scripts (Complex Orchestration)

For multi-step operations or cross-service workflows, import the shared library directly:

```javascript
import { apiRequest, graphqlRequest } from './lib/http.js';
import { fetchAllPages } from './lib/pagination.js';

const orders = await graphqlRequest('shopify', '{ orders(first: 10) { nodes { id name } } }');
const tickets = await apiRequest('gorgias', '/tickets?status=open');
```

## Available Services

| Category | Service | Client Script |
|----------|---------|---------------|
| ~~e-commerce | Shopify | `skills/shopify/scripts/client.js` |
| ~~email-marketing | Klaviyo | `skills/klaviyo/scripts/client.js` |
| ~~customer-support | Gorgias | `skills/gorgias/scripts/client.js` |
| ~~accounting | QuickBooks | `skills/quickbooks/scripts/client.js` |
| ~~paid-social | Meta Ads | `skills/meta-ads/scripts/client.js` |
| ~~search-ads | Google Ads | `skills/google-ads/scripts/client.js` |
| ~~analytics | Google Analytics | `skills/google-analytics/scripts/client.js` |
| ~~seo | Google Search Console | `skills/google-search-console/scripts/client.js` |
| ~~knowledge-base | Notion | `skills/notion/scripts/client.js` |
| ~~database | PostgreSQL | `skills/postgresql/scripts/client.js` |
| ~~social-media | Instagram | `skills/instagram/scripts/client.js` |
| ~~social-media | Pinterest | `skills/pinterest/scripts/client.js` |
| ~~dam | Air.inc | `skills/air/scripts/client.js` |
| ~~workspace | Google Workspace | `skills/google-workspace/scripts/client.js` |
| ~~search-trends | Google Trends | `skills/google-trends/scripts/client.js` |
| ~~ai-generation | Google AI Studio | `skills/google-ai-studio/scripts/client.js` |
| ~~data-warehouse | Google BigQuery | `skills/google-bigquery/scripts/client.js` |
| ~~browser | Playwright | `skills/playwright/scripts/client.js` |

## Error Handling

All client scripts output JSON to stdout on success and JSON to stderr on failure:

```json
// Success → stdout
{ "tickets": [...], "meta": {...} }

// Error → stderr
{ "success": false, "error": "HTTP 401: Unauthorized" }
```

If a command fails with an auth error, run `node auth/setup.js --test <service>` to diagnose.
