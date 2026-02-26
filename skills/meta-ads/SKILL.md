---
name: meta-ads
description: Meta Marketing API integration for Facebook and Instagram ads including campaigns, ad sets, ads, creatives, audiences, and insights. Activate when the user asks about Meta/Facebook/Instagram ads, ad performance, creating ads, managing campaigns, or researching competitor ads. Not for Instagram organic content or cross-source analysis.
category: ~~paid-social
service: Meta Ads
---

# Meta Ads

## Purpose

This skill enables direct interaction with the Meta Marketing API for managing Facebook and Instagram advertising campaigns using the client script. Provides access to campaigns, ad sets, ads, creatives, audiences, and performance insights.

**This is the PRIMARY SOURCE OF TRUTH for Meta Ads data.**

Authentication is handled automatically by lib/auth.js.

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

## Client Script

**Path:** `skills/meta-ads/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Verify authentication and API access |
| `get-account-info` | Get ad account details and configuration |
| `list-campaigns` | List campaigns with optional filters |
| `get-campaign` | Get details for a specific campaign |
| `create-campaign` | Create a new campaign |
| `update-campaign` | Update campaign settings |
| `update-campaign-status` | Pause, enable, or archive a campaign |
| `list-adsets` | List ad sets with optional filters |
| `get-adset` | Get details for a specific ad set |
| `create-adset` | Create a new ad set |
| `update-adset` | Update ad set settings |
| `update-adset-budget` | Update daily or lifetime budget for an ad set |
| `update-adset-status` | Pause, enable, or archive an ad set |
| `list-ads` | List ads with optional filters |
| `get-ad` | Get details for a specific ad |
| `create-ad` | Create a new ad |
| `update-ad-status` | Pause, enable, or archive an ad |
| `list-creatives` | List ad creatives |
| `get-creative` | Get details for a specific creative |
| `create-creative` | Create a new ad creative |
| `get-insights` | Get performance insights with date presets and breakdowns |
| `list-audiences` | List custom audiences |
| `get-audience` | Get details for a specific audience |
| `ad-library-search` | Search the Ad Library for competitor ads |
| `upload-image` | Upload an image for use in creatives |

## Key API Concepts

- **Base URL:** `graph.facebook.com/v21.0`
- **Budgets in cents:** $50.00 = 5000, $100.00 = 10000
- **Date presets:** `today`, `yesterday`, `last_7d`, `last_30d`, `last_90d`
- **Rate limits:** 200 calls per hour per ad account
- **New ads:** Always create in PAUSED status for review before enabling

## Time Period Mapping

| User Says | API Parameter |
|-----------|---------------|
| "today" | `--date-preset today` |
| "yesterday" | `--date-preset yesterday` |
| "last 7 days", "this week" | `--date-preset last_7d` |
| "last 30 days", "this month" | `--date-preset last_30d` |
| "last 90 days", "this quarter" | `--date-preset last_90d` |

## Metric Mapping

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

## Resource Mapping

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

The client script displays dollars for readability but accepts cents as input.

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('meta-ads', '/act_123456/campaigns');
```

## Reference Files
- [workflow-examples.md](references/workflow-examples.md) — Step-by-step workflow examples
- [documentation.md](references/documentation.md) — Full API documentation
