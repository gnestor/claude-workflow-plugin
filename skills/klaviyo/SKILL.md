---
name: klaviyo
description: Primary source of truth for all Klaviyo email and SMS marketing data including campaigns, flows, metrics, events, lists, segments, and profiles. Activate when the user asks about email campaigns, marketing automation, email flows, or subscriber data. Not for cross-source analysis joining marketing data with other systems.
---

# Klaviyo API Integration

## Purpose

This skill enables direct interaction with the Klaviyo API for email and SMS marketing using `~~email-marketing` tools. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to campaigns, flows, metrics, events, lists, segments, profiles, and templates.

**Use this skill for EMAIL and SMS MARKETING data from Klaviyo.**

Authentication is handled by the MCP server configuration.

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

## Available Tools

The `~~email-marketing` MCP server provides tools for:
- **Account** - Get account details and configuration
- **Campaigns** - List, get, create campaigns; get performance reports; get campaign messages and templates
- **Flows** - List, get flows; get flow performance reports
- **Metrics** - List metrics, get metric details, query metric aggregates
- **Lists & Segments** - List, get, manage subscriber lists and segments
- **Profiles** - List, get, create profiles; subscribe/unsubscribe from lists
- **Events** - List and create/track events
- **Templates** - List, get, create email templates

## Natural Language to API Translation

When a user asks a natural language question about Klaviyo data, follow this process:

### Step 1: Identify the Resource Type

Map natural language terms to Klaviyo resources:

- "email campaigns", "campaigns" -> campaigns
- "flows", "automations", "sequences" -> flows
- "metrics", "events", "tracking" -> metrics/events
- "subscribers", "email list", "audience" -> lists/segments
- "customers", "profiles", "contacts" -> profiles
- "templates", "email templates" -> templates

### Step 2: Determine the Operation

| User Intent          | Operation                        |
| -------------------- | -------------------------------- |
| "How did X perform?" | campaign-report or flow-report   |
| "List all X"         | list-campaigns, list-flows, etc. |
| "Show me X events"   | list-metrics then metric-aggregates |
| "Add to list"        | subscribe                        |
| "Create campaign"    | create-campaign                  |
| "Track event"        | create-event                     |

### Step 3: Extract Parameters

**Time ranges:**

- "last month" -> filter with datetime >= 30 days ago
- "this week" -> filter with datetime >= start of week
- "January 2024" -> filter 2024-01-01 to 2024-02-01

**Channels:**

- "email campaigns" -> channel=email
- "SMS campaigns" -> channel=sms

**Metrics:**

- To query a specific metric by name, first list metrics to find the metric ID, then use metric aggregates

### Step 4: Build the Request

For metric aggregates (key use case):

1. Find metric ID using list-metrics
2. Build aggregates request with:
   - `metric_id`: The metric ID
   - `measurements`: ["count", "unique", "sum_value"]
   - `interval`: "day", "week", or "month"
   - `filter`: Date range filters
   - `timezone`: User's timezone

## Common Metric IDs

Quick reference for frequently used metrics:

| Metric         | ID       | Measurements                   |
| -------------- | -------- | ------------------------------ |
| Placed Order   | `QYEYTD` | `count`, `sum_value` (revenue) |
| Received Email | `S5szs7` | `count`                        |
| Opened Email   | `Y5KgAb` | `count`                        |
| Clicked Email  | `V7UybQ` | `count`                        |
| Received SMS   | `RSZf6M` | `count`                        |

Use list-metrics to find additional metric IDs or verify these.

## Rate Limits

Klaviyo has endpoint-specific rate limits:

| Endpoint Type     | Burst | Steady  |
| ----------------- | ----- | ------- |
| Default (GET)     | 10/s  | 150/min |
| Metric Aggregates | 3/s   | 60/min  |
| Campaign Reports  | 1/s   | 2/min   |
| Flow Reports      | 3/s   | 60/min  |

If rate limited:

- Wait for the reset time indicated in response headers
- Reduce request frequency
- For reporting endpoints, cache results when possible

## Security Notes

- Never expose API keys in output
- Be cautious with operations that modify subscriber data
- Warn before bulk subscribe/unsubscribe operations
- Campaigns are created in draft mode by default

## Troubleshooting

**"Authentication failed" or "Invalid API key"**

- Verify the MCP server is properly configured
- Ensure the key is a Private API key (not public)

**"Missing required scope"**

- The API key needs additional permissions
- Check MCP server configuration for required scopes

**"Resource not found"**

- Verify the ID is correct
- Check the resource type matches the endpoint

**"Rate limit exceeded"**

- Wait for the reset time
- Reduce request frequency
- For reporting, use less frequent intervals

**"Invalid filter syntax"**

- Check filter format: `greater-or-equal(datetime,2024-01-01T00:00:00Z)`
- Ensure datetime is in ISO 8601 format with timezone
