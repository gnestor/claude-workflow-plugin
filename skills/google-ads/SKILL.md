---
name: google-ads
description: "Real-time Google Ads campaign management and reporting via the official API. Use for ad performance, search terms, shopping products, budget adjustments, target ROAS optimization, keyword research, and applying recommendations. For historical analysis or cross-source queries, use postgresql or bigquery skill instead."
category: ~~search-ads
service: google-ads
---

# Google Ads

## Purpose

Real-time access to Google Ads data and campaign management through the official Google Ads API. Authentication is handled automatically by `lib/auth.js` using shared Google OAuth credentials.

## When to Use

Activate this skill when the user:
- Asks about Google Ads, ad campaigns, or advertising performance
- Wants to see campaign, ad group, or keyword metrics
- Asks about search terms driving traffic
- Wants shopping/product performance data
- Needs to adjust campaign budgets or bidding strategies
- Asks about optimization recommendations
- Needs to pause/enable campaigns, ad groups, or keywords
- Wants keyword research with search volume data

**Example triggers:**
- "How are my Google Ads campaigns performing?"
- "Show me the top search terms this month"
- "Which products have the best ROAS?"
- "Increase the budget for campaign X"
- "What optimization recommendations do I have?"
- "What's the search volume for 'corduroy shorts'?"

## When NOT to Use

- **Historical analysis over months/years**: Use `bigquery` skill (Google Ads data synced via Airbyte)
- **Cross-source analysis** (Ads + Shopify + other): Use `postgresql` skill
- **Data already synced is sufficient**: Use `bigquery` for faster queries on historical data

## Client Script

**Path:** `skills/google-ads/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Verify authentication and API access |
| `list-campaigns` | List all campaigns with status and budget |
| `get-campaign --id <id>` | Get detailed campaign info by ID |
| `list-keywords` | List keywords with performance metrics |
| `get-insights --start-date <date> --end-date <date>` | Get performance insights for a date range. Optional: `--level` (campaign/adgroup/keyword), `--metrics` (comma-separated), `--breakdowns` (comma-separated) |
| `search <GAQL query>` | Execute a raw GAQL query |
| `list-recommendations` | Get optimization recommendations from Google |

## Key API Concepts

**Google Ads REST API** with **GAQL** (Google Ads Query Language) for flexible querying. Currency values are in **micros** (1 USD = 1,000,000 micros). The client script automatically converts micros to dollars in output.

### Natural Language to GAQL Translation

**Time Period Mapping:**

| User Says | GAQL |
|-----------|------|
| "today" | `segments.date = 'YYYY-MM-DD'` |
| "yesterday" | `segments.date = 'YYYY-MM-DD'` |
| "last 7 days" | `DURING LAST_7_DAYS` |
| "last 30 days" | `DURING LAST_30_DAYS` |
| "last month" | `DURING LAST_MONTH` |
| "this month" | `DURING THIS_MONTH` |

**Metric Mapping:**

| User Says | GAQL Metric |
|-----------|-------------|
| "spend", "cost" | `metrics.cost_micros` (divide by 1M for dollars) |
| "clicks" | `metrics.clicks` |
| "impressions" | `metrics.impressions` |
| "conversions" | `metrics.conversions` |
| "revenue", "conversion value" | `metrics.conversions_value` |
| "ROAS" | `metrics.conversions_value / (metrics.cost_micros / 1000000)` |
| "CTR", "click rate" | `metrics.ctr` |
| "CPC" | `metrics.average_cpc` (divide by 1M for dollars) |

**Resource Mapping:**

| User Says | GAQL Resource |
|-----------|---------------|
| "campaigns" | `FROM campaign` |
| "ad groups" | `FROM ad_group` |
| "ads" | `FROM ad_group_ad` |
| "keywords" | `FROM keyword_view` |
| "search terms" | `FROM search_term_view` |
| "products", "shopping" | `FROM shopping_performance_view` |

### Understanding Micros

Google Ads API uses micros for currency values:
- **1 USD = 1,000,000 micros**
- **$50 = 50,000,000 micros**

### GAQL Date Literals

Valid `DURING` values: `LAST_7_DAYS`, `LAST_30_DAYS`, `LAST_MONTH`, `THIS_MONTH`, `YESTERDAY`, `TODAY`

For 90+ days, use: `segments.date BETWEEN '2025-10-01' AND '2026-01-01'`

## Confirmation Workflow for Mutations

**Always confirm before executing write operations:**

1. Query current state first
2. Display current vs. proposed values
3. Ask user for confirmation
4. Execute mutation
5. Verify the change

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('google-ads', '/customers/123/googleAds:searchStream');
```

## Reference Files
- [gaql-syntax.md](references/gaql-syntax.md) — GAQL query language reference (SELECT, FROM, WHERE, operators)
- [query-templates.md](references/query-templates.md) — Pre-built GAQL queries for common reporting scenarios
- [resources.md](references/resources.md) — API resources, fields, metrics, segments, and status values
