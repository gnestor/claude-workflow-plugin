# Gorgias Workflow Examples

## Workflow 1: Find Tickets for a Shopify Order

**User Question:** "Show me support tickets for order #12345"

### Step 1: Search for tickets containing the order number
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "#12345"
```

### Step 2: Get full details for matching tickets
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-ticket <ticket-id>
```

### Alternative: Find by customer email
If you know the customer's email from the Shopify order:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-customers "customer@email.com"
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-customer-tickets <customer-id>
```

---

## Workflow 2: Identify Dominant Customer Issues

**User Question:** "What are customers complaining about most this month?"

### Step 1: Get recent tickets with their tags
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-tickets --created-after 2026-01-01 --limit 30
```

### Step 2: List all tags for reference
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-tags
```

### Step 3: Search for specific issue keywords
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "shipping"
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "refund"
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "sizing"
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "damaged"
```

### Step 4: Analyze results
Count tickets by tag and keyword matches to identify top issues.

**Note:** For aggregate analysis over longer periods, use the postgresql skill with `gorgias_tickets` table.

---

## Workflow 3: Analyze Customer Satisfaction

**User Question:** "What's our CSAT score this month?"

### Step 1: Get satisfaction surveys from the time period
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-surveys --created-after 2026-01-01 --limit 100
```

### Step 2: Calculate CSAT
From the results, extract scores and calculate:
- Count positive ratings (4-5 or "satisfied")
- Count total rated surveys
- CSAT = (positive / total) * 100

### Step 3: Identify low-rated tickets
Look at surveys with low scores and fetch their associated tickets:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-ticket <ticket-id-from-low-survey>
```

---

## Workflow 4: Reply to a Customer

**User Question:** "Reply to ticket #12345 thanking them for their patience"

### Step 1: Get the ticket to understand context
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-ticket 12345
```

### Step 2: Add the reply
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts add-message 12345 '{"body_text": "Thank you for your patience while we looked into this. Your issue has been resolved!", "from_agent": true, "public": true}'
```

### Step 3: Close the ticket if resolved
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts update-ticket 12345 '{"status": "closed"}'
```

---

## Workflow 5: Generate Help Center Article from Common Questions

**User Question:** "Create a help center article about returns based on common questions"

### Step 1: Search for return-related tickets
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "return" --limit 20
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "refund" --limit 20
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "exchange" --limit 20
```

### Step 2: Get full conversations for top results
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-ticket <ticket-id-1>
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-ticket <ticket-id-2>
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-ticket <ticket-id-3>
```

### Step 3: Analyze patterns
Review messages to identify:
- Common questions customers ask
- Standard responses agents give
- Edge cases and exceptions

### Step 4: Draft article
Use the insights to create a structured help article covering:
- Return policy overview
- How to initiate a return
- Timeline and expectations
- Common FAQs

---

## Workflow 6: Handle Open Tickets Queue

**User Question:** "Show me all open unassigned tickets"

### Step 1: List open tickets
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-tickets --status open --limit 30
```

### Step 2: Filter for unassigned (where assignee_user is null)
From the results, identify tickets with no assignee.

### Step 3: Assign to an agent
First, list available agents:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-users
```

Then assign:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts update-ticket <ticket-id> '{"assignee_user": {"id": <user-id>}}'
```

---

## Workflow 7: Merge Duplicate Customers

**User Question:** "This customer has multiple profiles, can you merge them?"

### Step 1: Search for customer profiles
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-customers "john@example.com"
```

### Step 2: Review the profiles
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-customer <customer-id-1>
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-customer <customer-id-2>
```

### Step 3: Merge into the primary profile
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts merge-customers '{"target_customer_id": 12345, "source_customer_ids": [67890, 11111]}'
```

---

## Workflow 8: Tag Tickets by Issue Type

**User Question:** "Tag all shipping-related tickets from today"

### Step 1: Search for shipping tickets
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "shipping" --limit 30
```

### Step 2: Get the tag ID for "shipping"
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-tags
```

### Step 3: Add tag to each matching ticket
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts add-tag-to-ticket <ticket-id> <shipping-tag-id>
```

---

## When to Use PostgreSQL Instead

Use the postgresql skill for these queries:

| Query Type | Why PostgreSQL |
|------------|----------------|
| "Ticket trends over the last 6 months" | Historical aggregate |
| "Average response time by agent" | Aggregate metrics |
| "Tickets from customers who ordered over $200" | Join with Shopify |
| "Resolution rate by channel" | Aggregate analysis |
| "Compare this month to last month" | Time-series comparison |

Example PostgreSQL query:
```sql
SELECT
  date_trunc('month', (data->>'created_datetime')::timestamp) as month,
  count(*) as ticket_count
FROM gorgias_tickets
GROUP BY 1
ORDER BY 1 DESC
LIMIT 12
```
