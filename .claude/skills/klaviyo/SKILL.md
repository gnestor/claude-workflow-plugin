---
name: klaviyo
description: Primary source of truth for all Klaviyo email and SMS marketing data including campaigns, flows, metrics, events, lists, segments, and profiles. Activate when the user asks about email campaigns, marketing automation, email flows, or subscriber data. Not for cross-source analysis joining marketing data with other systems.
---

# Klaviyo API Integration

## Purpose

This Skill enables direct interaction with the Klaviyo API for email and SMS marketing. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to campaigns, flows, metrics, events, lists, segments, profiles, and templates.

**Use this skill for EMAIL and SMS MARKETING data from Klaviyo.**

## When to Use

Activate this Skill when the user:

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

## Setup

1. Log in to Klaviyo
2. Go to Settings → API Keys
3. Click **Create Private API Key**
4. Set scope to **Full Access** (or customize as needed)
5. Copy the private API key
6. Save to `.env`:
   - `KLAVIYO_PRIVATE_KEY=your-key`

## Available Operations

### 1. Account

Get account details and configuration.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts account-info
```

### 2. Campaigns

#### List Campaigns

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts list-campaigns <channel>
```

Parameters:

- `channel` (required): `email`, `sms`, or `mobile_push`

#### Get Campaign Details

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-campaign <id>
```

#### Create Campaign

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts create-campaign '<json-data>'
```

Example:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts create-campaign '{
  "name": "Spring Sale Campaign",
  "channel": "email",
  "audiences": {"included": ["LIST_ID"]},
  "send_strategy": {"method": "immediate"}
}'
```

#### Get Campaign Performance Report

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts campaign-report <campaign-id> [statistics]
```

Parameters:

- `campaign-id` (required): Campaign ID
- `statistics` (optional): Comma-separated list (default: all stats)

#### Get Campaign Messages

Get message IDs for a campaign (needed to fetch email HTML):

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-campaign-messages <campaign-id>
```

#### Get Message Template

Get template ID from a campaign message:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-message-template <message-id>
```

#### Get Template HTML

Get HTML content and preview text from a template:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-template-html <template-id>
```

### 3. Flows

#### List Flows

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts list-flows
```

#### Get Flow Details

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-flow <id>
```

#### Get Flow Performance Report

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts flow-report <flow-id> [statistics]
```

### 4. Metrics

#### List All Metrics

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts list-metrics
```

#### Get Metric Details

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-metric <id>
```

#### Query Metric Aggregates

This is the key command for querying specific metrics like "Eligible for Judge.me Review Request" events.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts metric-aggregates '<json-data>'
```

Example - Count events over time:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts metric-aggregates '{
  "metric_id": "METRIC_ID",
  "measurements": ["count", "unique"],
  "interval": "day",
  "filter": ["greater-or-equal(datetime,2024-01-01T00:00:00Z)", "less-than(datetime,2024-02-01T00:00:00Z)"],
  "timezone": "America/Los_Angeles"
}'
```

### 5. Lists & Segments

#### List Subscriber Lists

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts list-lists
```

#### Get List Details

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-list <id>
```

#### List Segments

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts list-segments
```

#### Get Segment Details

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-segment <id>
```

### 6. Profiles

#### List Profiles

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts list-profiles [filter]
```

#### Get Profile by ID

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-profile <id>
```

#### Create Profile

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts create-profile '<json-data>'
```

Example:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts create-profile '{
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe"
}'
```

#### Subscribe to List

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts subscribe <list-id> '<json-data>'
```

Example:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts subscribe LIST_ID '{
  "email": "customer@example.com"
}'
```

#### Unsubscribe from List

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts unsubscribe <list-id> '<json-data>'
```

### 7. Events

#### List Events

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts list-events [filter]
```

#### Create/Track Event

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts create-event '<json-data>'
```

Example:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts create-event '{
  "metric_name": "Custom Event",
  "profile": {"email": "customer@example.com"},
  "properties": {"item": "Product Name", "value": 99.99}
}'
```

### 8. Templates

#### List Templates

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts list-templates
```

#### Get Template

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts get-template <id>
```

#### Create Template

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts create-template '<json-data>'
```

Example:

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/klaviyo/scripts/klaviyo-client.ts create-template '{
  "name": "Spring Sale Template",
  "html": "<html><body><h1>Spring Sale!</h1></body></html>"
}'
```

## Natural Language to API Translation

When a user asks a natural language question about Klaviyo data, follow this process:

### Step 1: Identify the Resource Type

Map natural language terms to Klaviyo resources:

- "email campaigns", "campaigns" → campaigns
- "flows", "automations", "sequences" → flows
- "metrics", "events", "tracking" → metrics/events
- "subscribers", "email list", "audience" → lists/segments
- "customers", "profiles", "contacts" → profiles
- "templates", "email templates" → templates

### Step 2: Determine the Operation

| User Intent          | Operation                        |
| -------------------- | -------------------------------- |
| "How did X perform?" | campaign-report or flow-report   |
| "List all X"         | list-campaigns, list-flows, etc. |
| "Show me X events"   | list-metrics → metric-aggregates |
| "Add to list"        | subscribe                        |
| "Create campaign"    | create-campaign                  |
| "Track event"        | create-event                     |

### Step 3: Extract Parameters

**Time ranges:**

- "last month" → filter with datetime >= 30 days ago
- "this week" → filter with datetime >= start of week
- "January 2024" → filter 2024-01-01 to 2024-02-01

**Channels:**

- "email campaigns" → channel=email
- "SMS campaigns" → channel=sms

**Metrics:**

- To query a specific metric by name, first run `list-metrics` to find the metric ID, then use `metric-aggregates`

### Step 4: Build the Request

For metric aggregates (key use case):

1. Find metric ID using `list-metrics`
2. Build aggregates request with:
   - `metric_id`: The metric ID
   - `measurements`: \["count", "unique", "sum\_value"]
   - `interval`: "day", "week", or "month"
   - `filter`: Date range filters
   - `timezone`: User's timezone

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

- Never expose `KLAVIYO_PRIVATE_KEY` in output
- Be cautious with operations that modify subscriber data
- Warn before bulk subscribe/unsubscribe operations
- Campaigns are created in draft mode by default

## Troubleshooting

**"Authentication failed" or "Invalid API key"**

- Check `KLAVIYO_PRIVATE_KEY` is correct in `.env`
- Verify the API key has required scopes
- Ensure the key is a Private API key (not public)

**"Missing required scope"**

- The API key needs additional permissions
- Create a new key with all required scopes

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

**JSON with `!` in subject lines**

- zsh escapes `!` with backslash even in single-quoted strings
- Workaround: Write JSON to a temp file with the Write tool, then pass via `"$(cat /tmp/file.json)"`

## Common Metric IDs

Quick reference for frequently used metrics:

| Metric         | ID       | Measurements                   |
| -------------- | -------- | ------------------------------ |
| Placed Order   | `QYEYTD` | `count`, `sum_value` (revenue) |
| Received Email | `S5szs7` | `count`                        |
| Opened Email   | `Y5KgAb` | `count`                        |
| Clicked Email  | `V7UybQ` | `count`                        |
| Received SMS   | `RSZf6M` | `count`                        |

Use `list-metrics` to find additional metric IDs or verify these.

## Reference Files

Detailed examples and documentation are available in the `references/` directory:

- **workflow-examples.md** - Step-by-step workflow examples for common tasks
  - Example 8: Multi-year email performance analysis (RPE trends, engagement analysis)
  - Example 9: Fetch email HTML template (campaign → message → template → HTML)

