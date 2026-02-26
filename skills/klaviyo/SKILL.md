---
name: klaviyo
description: Primary source of truth for all Klaviyo email and SMS marketing data including campaigns, flows, metrics, events, lists, segments, and profiles. Activate when the user asks about email campaigns, marketing automation, email flows, or subscriber data. Not for cross-source analysis joining marketing data with other systems.
category: ~~email-marketing
service: Klaviyo
---

# Klaviyo

## Purpose

This skill enables direct interaction with the Klaviyo API for email and SMS marketing using the client script. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to campaigns, flows, metrics, events, lists, segments, profiles, and templates.

**Use this skill for EMAIL and SMS MARKETING data from Klaviyo.**

Authentication is handled automatically by lib/auth.js.

## When to Use

Activate this skill when the user:

- Mentions "Klaviyo", "email campaign", or "SMS campaign"
- Asks about campaign performance: "How did our last email perform?"
- Asks about flows: "Show me abandoned cart flow stats"
- Asks about metrics/events: "How many Judge.me review requests this month?"
- Asks about subscribers: "Add this email to our VIP list"
- Asks about email lists or segments
- Asks about email templates
- Wants to create campaigns or track events
- References open rates, click rates, or email engagement

## When NOT to Use

- **Shopify data**: Use shopify skill for orders, products, inventory
- **Cross-source analysis**: Use postgresql skill when joining Klaviyo data with other sources (e.g., "Compare email engagement with order data")
- **Website analytics**: Use google-analytics skill for traffic and visitor data
- **Historical analysis across sources**: Use postgresql or bigquery skill

## Client Script

**Path:** `skills/klaviyo/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Verify authentication and API access |
| `get-account` | Get account details and configuration |
| `list-campaigns` | List campaigns with optional filters |
| `get-campaign` | Get details for a specific campaign |
| `get-campaign-report` | Get performance report for a campaign |
| `list-flows` | List flows and automations |
| `get-flow` | Get details for a specific flow |
| `get-flow-report` | Get performance report for a flow |
| `list-profiles` | List subscriber profiles |
| `get-profile` | Get details for a specific profile |
| `create-profile` | Create a new profile |
| `update-profile` | Update an existing profile |
| `subscribe` | Subscribe a profile to a list |
| `unsubscribe` | Unsubscribe a profile from a list |
| `list-lists` | List subscriber lists |
| `get-list` | Get details for a specific list |
| `list-segments` | List segments |
| `get-segment` | Get details for a specific segment |
| `list-metrics` | List all available metrics |
| `get-metric` | Get details for a specific metric |
| `query-metric-aggregates` | Query aggregated metric data with filters |
| `get-events` | List events with optional filters |
| `get-email-template` | Get an email template |
| `create-email-template` | Create a new email template |
| `assign-template` | Assign a template to a campaign message |
| `upload-image` | Upload an image from a URL |

## Key API Concepts

- **Base URL:** `api.klaviyo.com/api/`
- **Format:** JSON:API — trailing slashes required on all endpoints
- **Rate limits:** Endpoint-specific (see table below)
- **Pagination:** Cursor-based via JSON:API links
- **Metric aggregates:** Require metric ID lookup first via `list-metrics`

## Common Metric IDs

Quick reference for frequently used metrics:

| Metric | ID | Measurements |
|--------|-----|------------------------------|
| Placed Order | `QYEYTD` | `count`, `sum_value` (revenue) |
| Received Email | `S5szs7` | `count` |
| Opened Email | `Y5KgAb` | `count` |
| Clicked Email | `V7UybQ` | `count` |
| Received SMS | `RSZf6M` | `count` |

Use `list-metrics` to find additional metric IDs or verify these.

## Rate Limits

| Endpoint Type | Burst | Steady |
|---------------|-------|--------|
| Default (GET) | 10/s | 150/min |
| Metric Aggregates | 3/s | 60/min |
| Campaign Reports | 1/s | 2/min |
| Flow Reports | 3/s | 60/min |

If rate limited: wait for the reset time indicated in response headers, reduce request frequency, and cache reporting results when possible.

## Metric Aggregates Workflow

To query a specific metric:

1. Find metric ID using `list-metrics`
2. Call `query-metric-aggregates` with:
   - `metric_id`: The metric ID
   - `measurements`: `["count", "unique", "sum_value"]`
   - `interval`: `"day"`, `"week"`, or `"month"`
   - `filter`: Date range filters (e.g., `greater-or-equal(datetime,2024-01-01T00:00:00Z)`)
   - `timezone`: User's timezone

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('klaviyo', '/campaigns/');
```

## Reference Files
- [examples.md](references/examples.md) — Usage patterns and queries
- [documentation.md](references/documentation.md) — Full API documentation
