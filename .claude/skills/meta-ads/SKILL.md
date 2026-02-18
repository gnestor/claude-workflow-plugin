---
name: meta-ads
description: Meta Marketing API integration for Facebook and Instagram ads including campaigns, ad sets, ads, creatives, audiences, and insights. Activate when the user asks about Meta/Facebook/Instagram ads, ad performance, creating ads, managing campaigns, or researching competitor ads. Not for Instagram organic content or cross-source analysis.
---

# Meta Marketing API

## Purpose

This skill enables direct interaction with the Meta Marketing API for managing Facebook and Instagram advertising campaigns. Provides access to campaigns, ad sets, ads, creatives, audiences, and performance insights.

**This is the PRIMARY SOURCE OF TRUTH for Meta Ads data.**

## When to Use

Activate this skill when the user:
- Asks about Meta, Facebook, or Instagram ads performance
- Wants to see campaign, ad set, or ad metrics
- Asks about ROAS, CTR, CPC, spend, conversions
- Needs to adjust budgets or pause/enable ads
- Wants to create new ads or creatives
- Asks about custom audiences
- Wants to research competitor ads

**Example triggers:**
- "How are my Meta ads performing?"
- "Show me the top campaigns by ROAS"
- "Pause the underperforming ad sets"
- "Increase the budget for Campaign X"
- "What audiences do we have?"
- "Research Chubbies ads in the Ad Library"

## When NOT to Use

- **Instagram organic content**: Use instagram skill for posts, stories, engagement
- **Cross-source analysis**: Use postgresql skill when joining with Shopify, Gorgias
- **Historical trend analysis**: Use postgresql skill for time-series data

## Setup

1. Go to [Meta Business Suite](https://business.facebook.com) → Business Settings
2. Create a System User with admin access
3. Generate a token with `ads_management` and `ads_read` permissions
4. Note your Ad Account ID
5. Save to `.env`:
   - `META_ACCESS_TOKEN=your-token`
   - `META_AD_ACCOUNT_ID=act_123456789`

## Available Operations

### Account

```bash
# Test authentication
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts test-auth

# Get account info
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts account-info
```

### Campaigns

```bash
# List campaigns
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts list-campaigns [--status ACTIVE] [--limit 50]

# Get campaign details
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts get-campaign <campaign-id>

# Update campaign status
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts update-campaign-status <campaign-id> <ACTIVE|PAUSED>

# Create campaign
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts create-campaign '<json>'
```

### Ad Sets

```bash
# List ad sets
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts list-adsets [--campaign-id <id>] [--limit 50]

# Get ad set details
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts get-adset <adset-id>

# Update ad set budget (amount in cents: $50 = 5000)
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts update-adset-budget <adset-id> <amount-cents>

# Update ad set status
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts update-adset-status <adset-id> <ACTIVE|PAUSED>
```

### Ads

```bash
# List ads
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts list-ads [--adset-id <id>] [--limit 50]

# Get ad details
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts get-ad <ad-id>

# Update ad status
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts update-ad-status <ad-id> <ACTIVE|PAUSED>

# Create ad
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts create-ad '<json>'
```

### Creatives

```bash
# List creatives
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts list-creatives [--limit 50]

# Get creative details
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts get-creative <creative-id>

# Create creative
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts create-creative '<json>'

# Upload image
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts upload-image <file-path>
```

### Audiences

```bash
# List custom audiences
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts list-audiences

# Get audience details
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts get-audience <audience-id>
```

### Insights

```bash
# Get performance insights
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts insights <object-id> \
  [--level account|campaign|adset|ad] \
  [--date-preset last_7d|last_30d|yesterday] \
  [--breakdowns age,gender,publisher_platform]
```

### Ad Library (Competitor Research)

```bash
# Search Ad Library (EU/Brazil/political ads only)
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts ad-library \
  --search "competitor name" \
  --country US \
  [--limit 50]
```

**Note:** For US non-political ads, use browser automation to research at facebook.com/ads/library. See `references/ad-library.md` for workflow.

## Natural Language Translation

### Time Period Mapping

| User Says | API Parameter |
|-----------|---------------|
| "today" | `--date-preset today` |
| "yesterday" | `--date-preset yesterday` |
| "last 7 days", "this week" | `--date-preset last_7d` |
| "last 30 days", "this month" | `--date-preset last_30d` |
| "last 90 days", "this quarter" | `--date-preset last_90d` |

### Metric Mapping

| User Says | API Field |
|-----------|-----------|
| "spend", "cost" | `spend` (in dollars) |
| "clicks" | `clicks` |
| "impressions" | `impressions` |
| "conversions" | `conversions` |
| "revenue", "conversion value" | `conversion_values` |
| "ROAS" | Calculate: `conversion_values / spend` |
| "CTR", "click rate" | `ctr` |
| "CPC" | `cpc` |
| "CPM" | `cpm` |
| "reach" | `reach` |
| "frequency" | `frequency` |

### Resource Mapping

| User Says | API Level/Resource |
|-----------|-------------------|
| "campaigns" | `--level campaign` |
| "ad sets" | `--level adset` |
| "ads" | `--level ad` |
| "by age", "demographics" | `--breakdowns age,gender` |
| "by platform" | `--breakdowns publisher_platform` |
| "by placement" | `--breakdowns platform_position` |

## Confirmation Workflow

**Always confirm before executing write operations:**

1. Query current state first
2. Display current vs. proposed values
3. Ask user for confirmation
4. Execute mutation
5. Verify the change

Example:
```
Current daily budget: $50.00
Proposed daily budget: $100.00

Confirm this change? [yes/no]
```

## Currency Handling

Meta API uses cents for budget values:
- **$50.00 = 5000 cents**
- **$100.00 = 10000 cents**

The CLI client displays dollars for readability but accepts cents as input.

## Reference Files

- **api-endpoints.md** - Complete API endpoint reference
- **workflow-examples.md** - Step-by-step workflow examples
- **ad-library.md** - Competitor research guide with browser automation workflow

## Rate Limits

- Standard: 200 calls per hour per ad account
- If rate limited, wait and retry with exponential backoff
- Batch operations when possible

## Security Notes

- Never expose `META_ACCESS_TOKEN` in output
- Always confirm write operations before executing
- Be cautious with budget changes
- Start new ads in PAUSED status for review

## Troubleshooting

**"META_ACCESS_TOKEN not set"**
- Add your access token to `.env`
- Generate at: https://developers.facebook.com/tools/explorer/

**"Invalid access token"**
- Token may have expired
- Generate a new long-lived token

**"Permission error"**
- Token may lack required permissions
- Ensure ads_management and ads_read permissions

**"Ad account disabled"**
- Check account status in Ads Manager
- Contact Meta support if needed

**"Ad account owner has NOT grant ads_management or ads_read permission" on insights**
- This error can occur even with valid token when querying certain insights
- Workaround: Use `list-creatives` to extract ad copy without performance metrics
- For performance data, use postgresql skill with synced historical data instead
