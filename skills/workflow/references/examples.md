# Example Workflows

## 1. Weekly Revenue Report

A data reporting workflow that pulls from e-commerce, calculates trends, and delivers to a knowledge base.

```markdown
---
name: weekly-revenue-report
description: "Generate a weekly revenue report by product category and post to Notion"
triggers:
  - "weekly revenue report"
  - "revenue summary"
  - "how did we do this week"
destination: notion
skills:
  - shopify
  - notion
connectors:
  - "~~e-commerce"
  - "~~knowledge-base"
parameters:
  - name: period
    description: "Time period to report on"
    default: "last 7 days"
  - name: comparison_period
    description: "Period to compare against"
    default: "previous 7 days"
created: 2026-02-15
last_run: 2026-02-19T10:30:01Z
last_run_status: success
run_count: 4
---

# Weekly Revenue Report

## Objective

Generate a revenue report comparing this week to last week, broken down by product category, and post it to the Revenue Reports database in Notion.

## Steps

### 1. Fetch current period revenue
- Query ~~e-commerce for orders in {{period}} using date-filtered queries (batch by day to avoid rate limits on large order volumes)
- Group by product type/category
- Calculate: total revenue, order count, average order value (AOV)
- Exclude $0 orders (comps/replacements) from AOV calculation

### 2. Fetch comparison period data
- Query ~~e-commerce for orders in {{comparison_period}} with same batching approach
- Same grouping and metrics as step 1

### 3. Calculate trends
- Revenue change ($ and %)
- Order count change
- AOV change
- Identify top 3 performing and bottom 3 declining categories

### 4. Format and deliver
- Summary metrics at top (total revenue, total orders, overall AOV)
- Category breakdown table sorted by revenue
- Notable changes callout section
- Save to outputs/ with timestamp
- Create a new page in the Notion Revenue Reports database
```

## 2. Email Campaign Draft

A content creation workflow that pulls context from a knowledge base and drafts in an email marketing platform.

```markdown
---
name: email-campaign-draft
description: "Draft an email campaign in Klaviyo based on a Notion brief"
triggers:
  - "create email campaign"
  - "draft email campaign"
  - "email campaign from notion"
destination: klaviyo
skills:
  - notion
  - klaviyo
connectors:
  - "~~knowledge-base"
  - "~~email-marketing"
parameters:
  - name: brief_url
    description: "Notion page URL with the campaign brief"
  - name: segment
    description: "Klaviyo segment to target"
    default: "all subscribers"
created: 2026-02-18
last_run: null
last_run_status: null
run_count: 0
---

# Email Campaign Draft

## Objective

Create an email campaign draft in Klaviyo based on a campaign brief stored in Notion.

## Steps

### 1. Read the campaign brief
- Fetch the Notion page at {{brief_url}} using ~~knowledge-base tools
- Extract: campaign goal, key messages, target audience, tone, any assets/links to include

### 2. Get brand context
- Read skills/brand-voice/SKILL.md for brand guidelines (tone, voice, visual style)
- Review recent campaign performance in ~~email-marketing for subject line patterns that work

### 3. Draft the campaign
- Write subject line (keep under 50 chars, use patterns from high-performing recent campaigns)
- Write preview text
- Write email body following the brief's key messages and brand voice
- Include any links or CTAs from the brief

### 4. Create in Klaviyo
- Create a new campaign draft in ~~email-marketing
- Set the target segment to {{segment}}
- Add subject line, preview text, and body content
- Save output to outputs/ with the draft content for reference
```

## 3. Inventory Restock Alert

A monitoring workflow that checks thresholds and delivers alerts.

```markdown
---
name: inventory-restock-alert
description: "Check inventory levels and flag items below restock threshold"
triggers:
  - "check inventory"
  - "restock alert"
  - "low stock check"
schedule: "every weekday at 8am"
skills:
  - shopify
  - google-sheets
connectors:
  - "~~e-commerce"
  - "~~workspace"
parameters:
  - name: threshold
    description: "Inventory level that triggers a restock alert"
    default: "10"
created: 2026-02-10
last_run: 2026-02-19T08:00:00Z
last_run_status: success
run_count: 7
---

# Inventory Restock Alert

## Objective

Identify products with inventory below the restock threshold and log them for action.

## Steps

### 1. Fetch current inventory levels
- Query ~~e-commerce for all active product variants with their inventory quantities
- Filter to variants with inventory tracking enabled

### 2. Identify low-stock items
- Flag variants with quantity <= {{threshold}}
- Group by product for readability
- Sort by quantity ascending (most urgent first)

### 3. Deliver the alert
- Save a timestamped report to outputs/
- Append low-stock items to the Restock Tracker spreadsheet in ~~workspace (create if it doesn't exist)
- Include: product name, variant, current quantity, last restock date if available
```
