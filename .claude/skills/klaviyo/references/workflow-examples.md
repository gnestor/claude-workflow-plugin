# Klaviyo Workflow Examples

This document provides step-by-step examples for common Klaviyo workflows.

## Example 1: Get Email Campaign Performance

**User Question:** "How did our last email campaign perform?"

### Process

1. **List recent email campaigns**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts list-campaigns email
```

2. **Get campaign report for the most recent campaign**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts campaign-report CAMPAIGN_ID
```

### Sample Output Interpretation

```json
{
  "success": true,
  "report": {
    "data": {
      "attributes": {
        "results": [{
          "statistics": {
            "opens": 1250,
            "open_rate": 0.42,
            "clicks": 380,
            "click_rate": 0.127,
            "unsubscribes": 15,
            "bounces": 23,
            "delivered": 2954,
            "recipients": 3000
          }
        }]
      }
    }
  }
}
```

**Interpretation:**
- **Open Rate (42%)**: Above average (industry average ~20%)
- **Click Rate (12.7%)**: Strong engagement
- **Deliverability (98.5%)**: Healthy sender reputation
- **Unsubscribes (0.5%)**: Normal range

---

## Example 2: Query Specific Metric Over Time

**User Question:** "Show me 'Eligible for Judge.me Review Request' events over the past month"

### Process

1. **Find the metric ID by listing all metrics**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts list-metrics
```

Look for the metric with name "Eligible for Judge.me Review Request" in the response and note its ID.

2. **Query metric aggregates with date filter**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts metric-aggregates '{
    "metric_id": "METRIC_ID_HERE",
    "measurements": ["count", "unique"],
    "interval": "day",
    "filter": [
      "greater-or-equal(datetime,2024-12-16T00:00:00Z)",
      "less-than(datetime,2025-01-16T00:00:00Z)"
    ],
    "timezone": "America/Los_Angeles"
  }'
```

### Sample Output

```json
{
  "success": true,
  "aggregates": {
    "data": {
      "attributes": {
        "data": [
          {"dimensions": ["2024-12-16"], "measurements": {"count": 45, "unique": 42}},
          {"dimensions": ["2024-12-17"], "measurements": {"count": 52, "unique": 48}},
          {"dimensions": ["2024-12-18"], "measurements": {"count": 38, "unique": 35}}
        ]
      }
    }
  }
}
```

**Interpretation:**
- Count = total events
- Unique = unique profiles triggering the event
- Can aggregate to get monthly total: ~1,350 events

---

## Example 3: Create Email Campaign

**User Question:** "Create a new email campaign for our spring sale targeting our VIP customers"

### Process

1. **Find the VIP list ID**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts list-lists
```

Look for the "VIP" or "VIP Customers" list and note its ID.

2. **Optionally create an email template first**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts create-template '{
    "name": "Spring Sale 2025",
    "html": "<html><body><h1>Spring Sale - Up to 40% Off!</h1><p>Shop now at example.com</p></body></html>"
  }'
```

3. **Create the campaign**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts create-campaign '{
    "name": "Spring Sale 2025 - VIP Early Access",
    "channel": "email",
    "audiences": {
      "included": ["VIP_LIST_ID"]
    },
    "send_strategy": {
      "method": "immediate"
    }
  }'
```

### Important Notes

- Campaigns are created in **draft** status by default
- You need to assign a template and configure the message content in Klaviyo UI
- Use `send_strategy.method: "immediate"` for immediate send or configure scheduled send

---

## Example 4: Flow Performance Analysis

**User Question:** "How are our abandoned cart flows performing?"

### Process

1. **List all flows to find abandoned cart flow**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts list-flows
```

Look for flows with "abandoned" or "cart" in the name.

2. **Get detailed flow report**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts flow-report FLOW_ID
```

### Key Metrics to Analyze

- **Conversion Rate**: How many recipients completed purchase
- **Revenue**: Total revenue attributed to the flow
- **Open Rate**: First indicator of engagement
- **Click Rate**: Shows intent to return to cart

---

## Example 5: Subscriber Management

**User Question:** "Add customer@example.com to our VIP list"

### Process

1. **Find the VIP list ID**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts list-lists
```

2. **Subscribe the email to the list**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts subscribe VIP_LIST_ID '{
    "email": "customer@example.com"
  }'
```

### Bulk Subscribe Example

To add multiple subscribers:
```bash
# Note: The subscribe endpoint handles one profile at a time
# For bulk operations, loop through profiles or use Klaviyo UI
```

---

## Example 6: Track Custom Event

**User Question:** "Log a 'Product Reviewed' event for customer@example.com"

### Process

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts create-event '{
    "metric_name": "Product Reviewed",
    "profile": {
      "email": "customer@example.com"
    },
    "properties": {
      "product_name": "Classic Your Brand",
      "product_id": "12345",
      "rating": 5,
      "review_text": "Best shorts ever!"
    },
    "value": 5
  }'
```

### Use Cases for Custom Events

- Track product reviews
- Log support interactions
- Record loyalty program activities
- Track custom conversions

---

## Example 7: Analyze Email List Health

**User Question:** "How healthy is our main email list?"

### Process

1. **Get list details**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts get-list MAIN_LIST_ID
```

2. **List recent events to check engagement**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts list-events "equals(metric_id,'OPENED_EMAIL_METRIC_ID')"
```

### Health Indicators

- **List growth rate**: Compare profile count over time
- **Engagement rate**: Opens and clicks from recent campaigns
- **Bounce rate**: From campaign reports
- **Unsubscribe rate**: Should be < 1%

---

## Common Filter Syntax

When filtering profiles or events, use these patterns:

| Filter Type | Syntax | Example |
|-------------|--------|---------|
| Equals | `equals(field,'value')` | `equals(email,'test@example.com')` |
| Greater than | `greater-than(field,value)` | `greater-than(datetime,2024-01-01T00:00:00Z)` |
| Less than | `less-than(field,value)` | `less-than(datetime,2024-12-31T23:59:59Z)` |
| Contains | `contains(field,'value')` | `contains(email,'@company.com')` |

### Date Range Example

```json
{
  "filter": [
    "greater-or-equal(datetime,2024-01-01T00:00:00Z)",
    "less-than(datetime,2024-02-01T00:00:00Z)"
  ]
}
```

---

## Metric Aggregates Measurements

Available measurements for `metric-aggregates`:

| Measurement | Description |
|-------------|-------------|
| `count` | Total number of events |
| `unique` | Unique profiles |
| `sum_value` | Sum of event values |
| `average_value` | Average event value |
| `min_value` | Minimum event value |
| `max_value` | Maximum event value |

### Interval Options

- `hour` - Hourly breakdown
- `day` - Daily breakdown (most common)
- `week` - Weekly breakdown
- `month` - Monthly breakdown

---

## Example 8: Multi-Year Email Performance Analysis

**User Question:** "Why has email revenue per email dropped over the past 3 years?"

### Process

1. **Find metric IDs for key email events**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts list-metrics
```

Filter for key metrics:
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts list-metrics 2>&1 | \
  jq -r '.metrics[] | select(.attributes.name | test("Received Email|Opened Email|Clicked Email|Placed Order"; "i")) | "\(.id): \(.attributes.name)"'
```

2. **Query each metric by year using metric-aggregates**

For Placed Order (conversions + revenue):
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts metric-aggregates '{
    "metric_id": "QYEYTD",
    "measurements": ["count", "sum_value"],
    "interval": "month",
    "filter": [
      "greater-or-equal(datetime,2022-01-01T00:00:00Z)",
      "less-than(datetime,2023-01-01T00:00:00Z)"
    ],
    "timezone": "America/Los_Angeles"
  }'
```

For email engagement metrics (Received, Opened, Clicked):
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts metric-aggregates '{
    "metric_id": "S5szs7",
    "measurements": ["count"],
    "interval": "month",
    "filter": [
      "greater-or-equal(datetime,2022-01-01T00:00:00Z)",
      "less-than(datetime,2023-01-01T00:00:00Z)"
    ],
    "timezone": "America/Los_Angeles"
  }'
```

Repeat for each year (2022, 2023, 2024, 2025).

3. **Calculate key metrics from aggregated data**

- **Revenue Per Email (RPE)** = Total Revenue / Total Emails Sent
- **Open Rate** = Opens / Emails Sent
- **Click Rate** = Clicks / Emails Sent
- **Click-to-Open Rate (CTOR)** = Clicks / Opens

### Sample Analysis Output

| Year | Emails Sent | Revenue | RPE | Open Rate | Click Rate |
|------|-------------|---------|-----|-----------|------------|
| 2022 | 565,893 | $2,116,403 | $3.74 | 72.7% | 2.98% |
| 2023 | 3,567,877 | $2,605,288 | $0.73 | 76.8% | 1.44% |
| 2024 | 4,300,828 | $2,219,081 | $0.52 | 69.7% | 3.32% |
| 2025 | 3,935,440 | $2,355,016 | $0.60 | 74.1% | 1.29% |

### Interpretation Framework

1. **If RPE down but click rate stable** → Conversion issue (lower AOV, fewer purchases per click)
2. **If click rate down** → Engagement fatigue, content relevance issues
3. **If open rate down** → Deliverability issues or subject line fatigue
4. **If open rate up but clicks down** → iOS Privacy inflating opens (Apple MPP since Sept 2021)
5. **If email volume up but revenue flat** → Diminishing returns from over-mailing

### Common Root Causes

- **Over-mailing**: Sending more emails without proportional revenue growth
- **List fatigue**: Click rates drop as frequency increases
- **iOS Privacy**: Open rates unreliable since Sept 2021 (Apple Mail Privacy Protection)
- **List degradation**: Growing percentage of inactive subscribers

---

## Common Metric IDs Reference

These are the standard Klaviyo metric IDs for Your Brand:

| Metric | ID | Use Case |
|--------|-----|----------|
| Placed Order | `QYEYTD` | Conversions, revenue (use `sum_value`) |
| Received Email | `S5szs7` | Emails delivered |
| Opened Email | `Y5KgAb` | Email opens |
| Clicked Email | `V7UybQ` | Email clicks |
| Received SMS | `RSZf6M` | SMS delivered |

**Note:** Use `list-metrics` to verify IDs or find additional metrics.

---

## Example 9: Fetch Email HTML Template

**User Question:** "Get the HTML for campaign XYZ" or "Show me the email design for our last campaign"

### Process

1. **Get campaign ID** (if you don't have it already)
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts list-campaigns email
```

2. **Get campaign message ID**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts get-campaign-messages CAMPAIGN_ID
```

Extract the message ID from the response: `result.messages[0].id`

3. **Get template ID from message**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts get-message-template MESSAGE_ID
```

Extract the template ID from the response: `result.templateId`

4. **Fetch the HTML content**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts get-template-html TEMPLATE_ID
```

### Sample Output

```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...",
  "previewText": "Shop our new collection..."
}
```

### API Chain Summary

```
Campaign ID → get-campaign-messages → Message ID
           → get-message-template  → Template ID
           → get-template-html     → HTML content
```

### Important Notes

- Campaign list requires channel filter (handled by CLI): `equals(messages.channel,'email')`
- Images in templates are hosted on `d3k81ch9hvuctc.cloudfront.net`
- The `previewText` field contains the email preview/preheader text

### Email Archive

Pre-fetched email templates are available at:
- HTML files: `assets/email-previews/` (339 files)
- Campaign CSV: `/workflows/email-analysis/email-campaigns.csv`
- Date range: January 2022 - January 2026

---

## Tips for Natural Language Translation

When translating user questions to API calls:

1. **"Last week/month"** → Calculate date range filter
2. **"Campaign performance"** → Use `campaign-report`
3. **"Flow performance"** → Use `flow-report`
4. **"How many events"** → Use `metric-aggregates` with `count`
5. **"Add to list"** → Use `subscribe`
6. **"Track event"** → Use `create-event`
7. **"Find metric"** → Use `list-metrics` first, then `metric-aggregates`
8. **"Revenue per email"** → Use `metric-aggregates` with Placed Order (`sum_value`) and Received Email (`count`)
9. **"Year over year comparison"** → Query each year separately with `metric-aggregates`
10. **"Email performance trends"** → Use multi-year analysis workflow (Example 8)
11. **"Get email HTML"** → Use `get-campaign-messages` → `get-message-template` → `get-template-html` (Example 9)
12. **"Create campaign with HTML"** → Create template → create campaign → assign template (Example 10)

---

## Example 10: Create Complete Email Campaign with HTML Template

**User Question:** "Create a new email campaign with this HTML design"

This workflow documents creating a campaign programmatically with a custom HTML template. The API requires a multi-step process.

### Process Overview

```
1. Create Template (HTML) → Template ID
2. Create Campaign (name, segment, subject, preview) → Campaign ID + Message ID
3. Assign Template to Campaign Message
```

### Step 1: Create Template from HTML

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts create-template '{
    "name": "Campaign Name - 2026-01-28",
    "html": "<!DOCTYPE html>..."
  }'
```

**Response:**
```json
{
  "success": true,
  "template": {
    "data": {
      "id": "US9bfc",
      "attributes": {
        "name": "Campaign Name - 2026-01-28"
      }
    }
  }
}
```

### Step 2: Create Campaign

**Important:** The campaign message (subject, preview text) is created embedded within the campaign. It cannot be created separately first.

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/klaviyo/scripts/klaviyo-client.ts create-campaign '{
    "name": "Campaign Name",
    "channel": "email",
    "audiences": {
      "included": ["RAUGjM"]
    },
    "send_options": {
      "use_smart_sending": false
    },
    "send_strategy": {
      "method": "static",
      "options_static": {
        "datetime": "2026-02-06T17:00:00+00:00"
      }
    },
    "message": {
      "subject": "Your Subject Line Here",
      "preview_text": "Your preview text here",
      "from_email": "news@your-company.com",
      "from_label": "Your Brand"
    }
  }'
```

**Response includes embedded message:**
```json
{
  "success": true,
  "campaign": {
    "data": {
      "id": "01KG6V8VR54SQMW08SY7MNMYC0",
      "attributes": {
        "name": "Campaign Name",
        "status": "draft"
      },
      "relationships": {
        "campaign-messages": {
          "data": [
            { "type": "campaign-message", "id": "01KG6V8WEH7Z5M6KAQW58C9K9A" }
          ]
        }
      }
    }
  }
}
```

### Step 3: Assign Template to Campaign Message

**Critical:** The template must be explicitly assigned to the campaign message using a separate endpoint.

```bash
# First get the message ID from campaign creation response
# Then assign the template:

curl -X POST "https://a.klaviyo.com/api/campaign-message-assign-template/" \
  -H "Authorization: Klaviyo-API-Key YOUR_KEY" \
  -H "revision: 2024-10-15" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "type": "campaign-message",
      "id": "01KG6V8WEH7Z5M6KAQW58C9K9A",
      "relationships": {
        "template": {
          "data": {
            "type": "template",
            "id": "US9bfc"
          }
        }
      }
    }
  }'
```

### Common Segment IDs

| Segment Name | ID | Use For |
|--------------|-----|---------|
| Email Subscribers | `RAUGjM` | Product launches, restocks, sales |
| Engaged 180 | `V2hBiw` | Lifestyle content (playlist, holiday) |
| Engaged 365 | `VNEfn9` | Everything else (default) |

### Campaign Settings

**Send Strategy Options:**
- `immediate` - Send as soon as scheduled
- `static` - Send at specific datetime
- `throttled` - Spread sends over time window

**Smart Sending:**
- Set `use_smart_sending: false` for campaigns (recommended)
- Smart sending skips recipients who received emails recently

### Key Learnings

1. **Campaign message is auto-created** - When you create a campaign, the message is created automatically via the `message` field in the request
2. **Template assignment is separate** - Must use `/campaign-message-assign-template/` endpoint after campaign creation
3. **Message ID is in relationships** - Access via `response.data.relationships.campaign-messages.data[0].id`
4. **Draft status** - Campaigns are created as drafts; schedule or send manually

### Complete Workflow Script

See `workflows/email-creative-to-klaviyo/scripts/create-klaviyo-campaign.ts` for a complete implementation that:
- Creates template from HTML file
- Creates campaign with embedded message
- Assigns template to message
- Saves manifest with all IDs and URLs
