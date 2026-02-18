---
name: google-ads
description: Real-time Google Ads campaign management and reporting via the official API. Use for ad performance, search terms, shopping products, budget adjustments, target ROAS optimization, keyword research, and applying recommendations. For historical analysis or cross-source queries, use postgresql or bigquery skill instead.
---

# Google Ads Skill

Real-time access to Google Ads data and campaign management through the official Google Ads API.

## Authentication

Authentication is handled by the MCP server. All Google Ads API access is managed through the server's OAuth credentials and developer token.

## When to Use

Activate this skill when the user:
- Asks about Google Ads, ad campaigns, or advertising performance
- Wants to see campaign, ad group, or keyword metrics
- Asks about search terms driving traffic
- Wants shopping/product performance data
- Needs to adjust campaign budgets
- Wants to change bidding strategies or target ROAS
- Asks about optimization recommendations
- Needs to pause/enable campaigns, ad groups, or keywords
- Wants to add negative keywords
- Needs keyword research with search volume data
- Wants to discover new keyword opportunities
- Asks about search volume for specific keywords

**Example triggers:**
- "How are my Google Ads campaigns performing?"
- "Show me the top search terms this month"
- "Which products have the best ROAS?"
- "Increase the budget for campaign X"
- "What optimization recommendations do I have?"
- "What's the search volume for 'corduroy shorts'?"
- "Find keyword ideas related to vintage clothing"

## When NOT to Use

- **Historical analysis over months/years**: Use `bigquery` skill (Google Ads data synced via Airbyte)
- **Cross-source analysis** (Ads + Shopify + other): Use `postgresql` skill
- **Data already synced is sufficient**: Use `bigquery` for faster queries on historical data

## Available Operations

Use `~~search-ads` tools for all Google Ads operations.

### Read Operations (Reports)

#### List Accounts
List accessible Google Ads accounts.

#### Campaign Performance
Get campaign performance metrics for a date range.

#### Ad Group Performance
Get ad group performance, optionally filtered by campaign.

#### Search Terms Report
Get search terms that triggered ads with performance metrics.

#### Keyword Performance
Get keyword-level performance data.

#### Shopping/Product Performance
Get product-level performance from shopping campaigns.

#### Optimization Recommendations
Get optimization recommendations from Google.

#### Raw GAQL Query
Execute a raw GAQL (Google Ads Query Language) query.

### Keyword Planner Operations

#### Generate Keyword Ideas
From seed keywords, URLs, or both. Returns search volume, competition, and CPC estimates.

**Output includes:**
- `keyword` - Suggested keyword
- `avgMonthlySearches` - Exact average monthly search volume
- `competition` - LOW, MEDIUM, HIGH
- `competitionIndex` - 0-100 score
- `lowTopOfPageBidDollars` - Low range CPC estimate
- `highTopOfPageBidDollars` - High range CPC estimate

**Common Geo Target IDs:**
| ID | Country |
|----|---------|
| 2840 | United States |
| 2826 | United Kingdom |
| 2124 | Canada |
| 2036 | Australia |

#### Get Search Volume
Get exact search volume for specific keywords.

### Write Operations (Mutations)

#### Update Campaign Budget
Adjust campaign daily budget (amount in micros: 1 dollar = 1,000,000 micros).

#### Update Target ROAS
Change target ROAS for a campaign.

#### Enable/Pause Campaign
Change campaign status to ENABLED or PAUSED.

#### Enable/Pause Ad Group
Change ad group status.

#### Add Negative Keyword
Add a negative keyword to a campaign.

#### Enable/Pause Keyword
Change keyword status.

#### Apply/Dismiss Recommendation
Apply or dismiss optimization recommendations.

## Natural Language to GAQL Translation

### Time Period Mapping

| User Says | GAQL |
|-----------|------|
| "today" | `segments.date = 'YYYY-MM-DD'` |
| "yesterday" | `segments.date = 'YYYY-MM-DD'` |
| "last 7 days" | `DURING LAST_7_DAYS` |
| "last 30 days" | `DURING LAST_30_DAYS` |
| "last month" | `DURING LAST_MONTH` |
| "this month" | `DURING THIS_MONTH` |

### Metric Mapping

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

### Resource Mapping

| User Says | GAQL Resource |
|-----------|---------------|
| "campaigns" | `FROM campaign` |
| "ad groups" | `FROM ad_group` |
| "ads" | `FROM ad_group_ad` |
| "keywords" | `FROM keyword_view` |
| "search terms" | `FROM search_term_view` |
| "products", "shopping" | `FROM shopping_performance_view` |

## Confirmation Workflow for Mutations

**Always confirm before executing write operations:**

1. Query current state first
2. Display current vs. proposed values
3. Ask user for confirmation
4. Execute mutation
5. Verify the change

## Understanding Micros

Google Ads API uses micros for currency values:
- **1 USD = 1,000,000 micros**
- **$50 = 50,000,000 micros**

Output automatically converts micros to dollars for readability.

## Reference Files

Detailed information available in `references/` directory:

- **gaql-syntax.md** - GAQL query language reference (SELECT, FROM, WHERE, operators)
- **query-templates.md** - Pre-built GAQL queries for common reporting scenarios
- **resources.md** - API resources, fields, metrics, segments, and status values

## Error Handling

### Common Errors

**"Developer token not set"**
- MCP server needs the developer token configured

**"Customer ID required"**
- Customer ID must be configured in the MCP server

**"Insufficient authentication scopes"**
- Re-authenticate to add the Google Ads scope

**"Invalid date literal"**
- Valid DURING values: `LAST_7_DAYS`, `LAST_30_DAYS`, `LAST_MONTH`, `THIS_MONTH`, `YESTERDAY`, `TODAY`
- For 90+ days, use: `segments.date BETWEEN '2025-10-01' AND '2026-01-01'`

### Rate Limits

- 15,000 queries per day per developer token
- 3,600 queries per minute
- Handle gracefully with exponential backoff

## Security Notes

- **Never expose** developer tokens in logs or output
- **Always confirm** write operations before executing
- **Test mutations** on a test account first when possible
- Developer token grants access to all accounts you manage
