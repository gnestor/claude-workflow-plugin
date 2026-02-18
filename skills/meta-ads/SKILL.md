---
name: meta-ads
description: Meta Marketing API integration for Facebook and Instagram ads including campaigns, ad sets, ads, creatives, audiences, and insights. Activate when the user asks about Meta/Facebook/Instagram ads, ad performance, creating ads, managing campaigns, or researching competitor ads. Not for Instagram organic content or cross-source analysis.
---

# Meta Marketing API

## Purpose

This skill enables direct interaction with the Meta Marketing API for managing Facebook and Instagram advertising campaigns using `~~paid-social` tools. Provides access to campaigns, ad sets, ads, creatives, audiences, and performance insights.

**This is the PRIMARY SOURCE OF TRUTH for Meta Ads data.**

Authentication is handled by the MCP server configuration.

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
- "Research competitor ads in the Ad Library"

## When NOT to Use

- **Instagram organic content**: Use instagram skill for posts, stories, engagement
- **Cross-source analysis**: Use postgresql skill when joining with Shopify, Gorgias
- **Historical trend analysis**: Use postgresql skill for time-series data

## Available Tools

The `~~paid-social` MCP server provides tools for:
- **Account** - Test authentication, get account info
- **Campaigns** - List, get, create campaigns; update campaign status
- **Ad Sets** - List, get ad sets; update budget and status
- **Ads** - List, get, create ads; update ad status
- **Creatives** - List, get, create creatives; upload images
- **Audiences** - List and get custom audiences
- **Insights** - Get performance insights with date presets and breakdowns
- **Ad Library** - Search competitor ads (EU/Brazil/political ads via API; US non-political via browser)

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

Tools display dollars for readability but accept cents as input.

## Reference Files

- **[workflow-examples.md](references/workflow-examples.md)** - Step-by-step workflow examples

## Rate Limits

- Standard: 200 calls per hour per ad account
- If rate limited, wait and retry with exponential backoff
- Batch operations when possible

## Security Notes

- Never expose access tokens in output
- Always confirm write operations before executing
- Be cautious with budget changes
- Start new ads in PAUSED status for review

## Troubleshooting

**"Invalid access token"**
- Token may have expired
- Verify MCP server configuration

**"Permission error"**
- Token may lack required permissions
- Ensure ads_management and ads_read permissions in MCP configuration

**"Ad account disabled"**
- Check account status in Ads Manager
- Contact Meta support if needed

**"Permission error on insights"**
- This can occur even with valid token when querying certain insights
- Workaround: Use list-creatives to extract ad copy without performance metrics
- For performance data, use postgresql skill with synced historical data instead
