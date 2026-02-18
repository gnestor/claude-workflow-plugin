# Gorgias Workflow Examples

## Workflow 1: Find Tickets for a Shopify Order

**User Question:** "Show me support tickets for order #12345"

### Step 1: Search for tickets containing the order number
Use the `~~customer-support` `search_tickets` tool with query: "#12345"

### Step 2: Get full details for matching tickets
Use the `~~customer-support` `get_ticket` tool with the ticket ID from the search results.

### Alternative: Find by customer email
If you know the customer's email from the Shopify order:
1. Use the `~~customer-support` `search_customers` tool with query: "customer@email.com"
2. Use the `~~customer-support` `get_customer_tickets` tool with the customer ID from the search results.

---

## Workflow 2: Identify Dominant Customer Issues

**User Question:** "What are customers complaining about most this month?"

### Step 1: Get recent tickets with their tags
Use the `~~customer-support` `list_tickets` tool with parameters: created_after: "2026-01-01", limit: 30

### Step 2: List all tags for reference
Use the `~~customer-support` `list_tags` tool.

### Step 3: Search for specific issue keywords
Use the `~~customer-support` `search_tickets` tool for each keyword:
- query: "shipping"
- query: "refund"
- query: "sizing"
- query: "damaged"

### Step 4: Analyze results
Count tickets by tag and keyword matches to identify top issues.

**Note:** For aggregate analysis over longer periods, use the postgresql skill with `gorgias_tickets` table.

---

## Workflow 3: Analyze Customer Satisfaction

**User Question:** "What's our CSAT score this month?"

### Step 1: Get satisfaction surveys from the time period
Use the `~~customer-support` `list_surveys` tool with parameters: created_after: "2026-01-01", limit: 100

### Step 2: Calculate CSAT
From the results, extract scores and calculate:
- Count positive ratings (4-5 or "satisfied")
- Count total rated surveys
- CSAT = (positive / total) * 100

### Step 3: Identify low-rated tickets
Look at surveys with low scores and fetch their associated tickets:
Use the `~~customer-support` `get_ticket` tool with the ticket ID from the low-rated survey.

---

## Workflow 4: Reply to a Customer

**User Question:** "Reply to ticket #12345 thanking them for their patience"

### Step 1: Get the ticket to understand context
Use the `~~customer-support` `get_ticket` tool with ticket ID: 12345

### Step 2: Add the reply
Use the `~~customer-support` `add_message` tool with parameters: ticket_id: 12345, body_text: "Thank you for your patience while we looked into this. Your issue has been resolved!", from_agent: true, public: true

### Step 3: Close the ticket if resolved
Use the `~~customer-support` `update_ticket` tool with parameters: ticket_id: 12345, status: "closed"

---

## Workflow 5: Generate Help Center Article from Common Questions

**User Question:** "Create a help center article about returns based on common questions"

### Step 1: Search for return-related tickets
Use the `~~customer-support` `search_tickets` tool for each keyword:
- query: "return", limit: 20
- query: "refund", limit: 20
- query: "exchange", limit: 20

### Step 2: Get full conversations for top results
Use the `~~customer-support` `get_ticket` tool for each relevant ticket ID from the search results (e.g., ticket-id-1, ticket-id-2, ticket-id-3).

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
Use the `~~customer-support` `list_tickets` tool with parameters: status: "open", limit: 30

### Step 2: Filter for unassigned (where assignee_user is null)
From the results, identify tickets with no assignee.

### Step 3: Assign to an agent
First, list available agents:
Use the `~~customer-support` `list_users` tool.

Then assign:
Use the `~~customer-support` `update_ticket` tool with parameters: ticket_id: <ticket-id>, assignee_user: {"id": <user-id>}

---

## Workflow 7: Merge Duplicate Customers

**User Question:** "This customer has multiple profiles, can you merge them?"

### Step 1: Search for customer profiles
Use the `~~customer-support` `search_customers` tool with query: "john@example.com"

### Step 2: Review the profiles
Use the `~~customer-support` `get_customer` tool for each customer ID found (e.g., customer-id-1, customer-id-2).

### Step 3: Merge into the primary profile
Use the `~~customer-support` `merge_customers` tool with parameters: target_customer_id: 12345, source_customer_ids: [67890, 11111]

---

## Workflow 8: Tag Tickets by Issue Type

**User Question:** "Tag all shipping-related tickets from today"

### Step 1: Search for shipping tickets
Use the `~~customer-support` `search_tickets` tool with parameters: query: "shipping", limit: 30

### Step 2: Get the tag ID for "shipping"
Use the `~~customer-support` `list_tags` tool.

### Step 3: Add tag to each matching ticket
Use the `~~customer-support` `add_tag_to_ticket` tool with parameters: ticket_id: <ticket-id>, tag_id: <shipping-tag-id>

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
