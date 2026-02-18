---
name: google-ads
description: Real-time Google Ads campaign management and reporting via the official API. Use for ad performance, search terms, shopping products, budget adjustments, target ROAS optimization, and applying recommendations. For historical analysis or cross-source queries, use postgresql or bigquery skill instead.
---

# Google Ads Skill

Real-time access to Google Ads data and campaign management through the official Google Ads API v18.

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
- **Needs keyword research with search volume data**
- **Wants to discover new keyword opportunities**
- **Asks about search volume for specific keywords**

**Example triggers:**
- "How are my Google Ads campaigns performing?"
- "Show me the top search terms this month"
- "Which products have the best ROAS?"
- "Increase the budget for campaign X"
- "What optimization recommendations do I have?"
- "Pause the underperforming ad groups"
- "What's the search volume for 'corduroy shorts'?"
- "Find keyword ideas related to vintage clothing"
- "Get keyword suggestions from our website"

## When NOT to Use

- **Historical analysis over months/years**: Use `bigquery` skill (Google Ads data synced via Airbyte)
- **Cross-source analysis** (Ads + Shopify + Gorgias): Use `postgresql` skill
- **Data already synced is sufficient**: Use `bigquery` for faster queries on historical data

## Prerequisites

### 1. Google Ads Developer Token

Get your developer token at: https://ads.google.com/aw/apicenter

Add to `.env`:
```bash
GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token"
```

### 2. Google Ads Customer ID

Find your customer ID in Google Ads UI (top right, format: 123-456-7890).

Add to `.env` **without hyphens**:
```bash
GOOGLE_ADS_CUSTOMER_ID="1234567890"
```

### 3. OAuth Authentication

Run unified Google authentication to include the Google Ads scope:
```bash
./lib/google-auth.ts
```

This grants access to the `https://www.googleapis.com/auth/adwords` scope.

### 4. (Optional) Manager Account

If using a manager account (MCC) to access client accounts:
```bash
GOOGLE_ADS_LOGIN_CUSTOMER_ID="9876543210"
```

## Available Operations

### Read Operations (Reports)

**List Accounts:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts list-accounts
```

**Campaign Performance:**
```bash
# Last 30 days (default)
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts campaigns

# Last 7 days
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts campaigns 1234567890 7
```

**Ad Group Performance:**
```bash
# All ad groups
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts ad-groups

# For specific campaign
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts ad-groups 1234567890 123456789
```

**Search Terms Report:**
```bash
# Top 100 search terms, last 30 days
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts search-terms

# Custom: last 7 days, top 50
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts search-terms 1234567890 7 50
```

**Keyword Performance:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts keywords
```

**Shopping/Product Performance:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts shopping
```

**Optimization Recommendations:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts recommendations
```

**Raw GAQL Query:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts gaql "SELECT campaign.id, campaign.name FROM campaign"
```

### Keyword Planner Operations

**Generate Keyword Ideas:**
```bash
# From seed keywords
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts \
  keyword-ideas "corduroy shorts,vintage shorts"

# From URL
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts \
  keyword-ideas --url https://example.com

# Combined with location targeting
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts \
  keyword-ideas "shorts" --url https://example.com --location 2840
```

**Get Search Volume for Keywords:**
```bash
# Get exact search volume for specific keywords
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts \
  search-volume "corduroy shorts,bell bottoms,dolphin shorts"
```

**Keyword Ideas Output:**
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

### Write Operations (Mutations)

**Update Campaign Budget:**
```bash
# Amount in micros (1 dollar = 1,000,000 micros)
# $50/day = 50000000 micros
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts update-budget 1234567890 987654321 50000000
```

**Update Target ROAS:**
```bash
# Target ROAS of 4.0 (400% return)
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts update-target-roas 1234567890 123456789 4.0
```

**Enable/Pause Campaign:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts update-campaign-status 1234567890 123456789 PAUSED
```

**Enable/Pause Ad Group:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts update-ad-group-status 1234567890 987654321 ENABLED
```

**Add Negative Keyword:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts add-negative-keyword 1234567890 123456789 "free"
```

**Enable/Pause Keyword:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts update-keyword-status 1234567890 987654321 111222333 PAUSED
```

**Apply Recommendation:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts apply-recommendation 1234567890 rec-id-here
```

**Dismiss Recommendation:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts dismiss-recommendation 1234567890 rec-id-here
```

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

**Example:**
```
Current budget: $30/day
Proposed budget: $50/day

Confirm this change? [yes/no]
```

## Understanding Micros

Google Ads API uses micros for currency values:
- **1 USD = 1,000,000 micros**
- **$50 = 50,000,000 micros**

The CLI client automatically converts micros to dollars in output for readability.

## Error Handling

### Common Errors

**"GOOGLE_ADS_DEVELOPER_TOKEN not set"**
- Add your developer token to `.env`
- Get token at: https://ads.google.com/aw/apicenter

**"Customer ID required"**
- Set `GOOGLE_ADS_CUSTOMER_ID` in `.env`
- Or provide as argument: `campaigns 1234567890`

**"Request had insufficient authentication scopes"**
- Re-run authentication: `./lib/google-auth.ts`
- This adds the Google Ads scope to your token

**"The customer is not enabled"**
- Verify the customer ID is correct
- Check account is active in Google Ads UI

**"Invalid date literal supplied for DURING operator"**
- Not all date presets are valid in GAQL
- Valid: `LAST_7_DAYS`, `LAST_30_DAYS`, `LAST_MONTH`, `THIS_MONTH`, `YESTERDAY`, `TODAY`
- Invalid: `LAST_90_DAYS`, `LAST_YEAR` (use explicit date range instead)
- For 90+ days, use: `segments.date BETWEEN '2025-10-01' AND '2026-01-01'`

### Rate Limits

- 15,000 queries per day per developer token
- 3,600 queries per minute
- Handle gracefully with exponential backoff

## Security Notes

- **Never expose** your developer token in logs or output
- **Never commit** `.env` file with credentials
- **Always confirm** write operations before executing
- **Test mutations** on a test account first when possible
- Developer token grants access to all accounts you manage

