# Gorgias API Query Patterns

## Ticket Queries

### List Open Tickets
```bash
list-tickets --status open --limit 30
```

### List Tickets by Channel
```bash
list-tickets --channel email
list-tickets --channel chat
list-tickets --channel instagram-direct-message
list-tickets --channel instagram-comment
list-tickets --channel phone
```

### List Tickets Created After Date
```bash
list-tickets --created-after 2026-01-01
list-tickets --created-after 2026-01-01T00:00:00Z
```

### List Tickets Updated Recently
```bash
list-tickets --updated-after 2026-01-15
```

### List Tickets for Customer
```bash
list-tickets --customer-email customer@example.com
```

### Search Tickets by Keyword
```bash
search-tickets "shipping delay"
search-tickets "refund request"
search-tickets "order #12345"
search-tickets "damaged"
```

**Note:** This searches recent tickets (up to 100) by filtering on subject, excerpt, and customer info. For comprehensive historical search across all tickets and message content, use the postgresql skill:
```sql
SELECT id, data->>'subject' as subject, data->>'excerpt' as excerpt
FROM gorgias_tickets
WHERE data->>'subject' ILIKE '%shipping%'
   OR data->>'excerpt' ILIKE '%shipping%'
ORDER BY (data->>'created_datetime')::timestamp DESC
LIMIT 20
```

### Get Ticket with All Messages
```bash
get-ticket 12345
```

## Customer Queries

### Search Customer by Email
```bash
search-customers "customer@example.com"
```

### List All Customers (Paginated)
```bash
list-customers --limit 30
list-customers --limit 30 --cursor "next_cursor_value"
```

### Get Customer Details
```bash
get-customer 12345
```

### Get All Tickets for Customer
```bash
get-customer-tickets 12345 --limit 50
```

## Satisfaction Survey Queries

### List Recent Surveys
```bash
list-surveys --created-after 2026-01-01
list-surveys --limit 100
```

### Get Survey Details
```bash
get-survey 12345
```

## Tag Queries

### List All Tags
```bash
list-tags
```

### Create New Tag
```bash
create-tag '{"name": "urgent", "decoration": {"color": "#FF0000"}}'
create-tag '{"name": "vip-customer", "decoration": {"color": "#FFD700"}}'
```

### Add Tag to Ticket
```bash
add-tag-to-ticket 12345 678
```

### Remove Tag from Ticket
```bash
remove-tag-from-ticket 12345 678
```

## User/Agent Queries

### List All Agents
```bash
list-users
```

### Get Agent Details
```bash
get-user 12345
```

### List Teams
```bash
list-teams
```

## Update Operations

### Close Ticket
```bash
update-ticket 12345 '{"status": "closed"}'
```

### Assign Ticket to Agent
```bash
update-ticket 12345 '{"assignee_user": {"id": 67890}}'
```

### Change Ticket Priority
```bash
update-ticket 12345 '{"priority": "high"}'
```

### Add Internal Note (Not Visible to Customer)
```bash
add-message 12345 '{"body_text": "Internal note: waiting for manager approval", "from_agent": true, "public": false}'
```

### Send Reply to Customer
```bash
add-message 12345 '{"body_text": "Thank you for contacting us. We will process your refund within 3-5 business days.", "from_agent": true, "public": true}'
```

### Update Customer Note
```bash
update-customer 12345 '{"note": "VIP customer - priority support"}'
```

## Macro & View Queries

### List Available Macros
```bash
list-macros
```

### Get Macro Details
```bash
get-macro 12345
```

### List Saved Views
```bash
list-views
```

## Integration Queries

### List Connected Integrations
```bash
list-integrations
```

## Common Filter Combinations

### Open Email Tickets from This Week
```bash
list-tickets --status open --channel email --created-after 2026-01-13
```

### Closed Tickets from January
```bash
list-tickets --status closed --created-after 2026-01-01 --created-before 2026-02-01
```

### High Priority Open Tickets
First list open tickets, then filter by priority in the results.

## Pagination Pattern

When results have more pages:
```bash
# First page
list-tickets --limit 30

# Response includes: "meta": { "next_cursor": "abc123" }

# Next page
list-tickets --limit 30 --cursor abc123
```

## Response Structure

All commands return JSON with consistent structure:
```json
{
  "success": true,
  "tickets": [...],      // or "customers", "surveys", etc.
  "meta": {
    "next_cursor": "...",
    "has_more": true
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Date Format

Gorgias accepts ISO 8601 format:
- Date only: `2026-01-15`
- Full datetime: `2026-01-15T14:30:00Z`
- With timezone: `2026-01-15T14:30:00+00:00`
