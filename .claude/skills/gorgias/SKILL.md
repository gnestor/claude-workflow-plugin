---
name: gorgias
description: Real-time customer support data from Gorgias including tickets, messages, customers, and satisfaction surveys. Use for real-time ticket operations, text search, and write operations. Not for historical trend analysis, aggregate metrics, or cross-source queries.
---

# Gorgias API Integration

## Purpose

This Skill enables direct interaction with the Gorgias API for customer support operations. It translates natural language questions into API calls, executes them, and interprets the results. Provides real-time access to tickets, messages, customers, satisfaction surveys, tags, users, and macros.

**Use this skill for REAL-TIME customer support operations and WRITE operations.**

## When to Use

Activate this Skill when the user:
- Asks about current ticket status or recent messages
- Wants to reply to tickets or add internal notes
- Needs to search tickets by keywords in subject/body
- Asks about tickets linked to Shopify orders/customers
- Wants to update ticket status, tags, or assignees
- Needs real-time satisfaction survey responses
- Wants to create or modify tags, macros, or rules
- Asks about open/unassigned tickets
- Needs to merge duplicate customers

## When NOT to Use

- **Historical analysis**: Use postgresql skill for ticket trends over time, aggregate metrics
- **Cross-source queries**: Use postgresql skill when joining Gorgias with Shopify orders, Instagram, etc.
- **Time-series analysis**: Use postgresql for ticket volume trends over months
- **Agent performance reports**: Use postgresql for aggregate agent statistics
- **Data older than 1 hour**: PostgreSQL tables sync hourly and may be more efficient

## Setup

1. Log in to Gorgias
2. Go to Settings → REST API
3. Copy your domain, email, and API token
4. Save to `.env`:
   - `GORGIAS_DOMAIN=your-domain`
   - `GORGIAS_EMAIL=your-email`
   - `GORGIAS_API_TOKEN=your-token`

## Available Operations

### 1. Authentication

#### Test Authentication
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts test-auth
```

#### Get Account Info
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts account-info
```

### 2. Tickets

#### List Tickets
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-tickets [options]
```

Options:
- `--status` - Filter by status (open, closed)
- `--channel` - Filter by channel (email, chat, instagram-direct-message, etc.)
- `--customer-email` - Filter by customer email
- `--assignee-user-id` - Filter by assigned agent
- `--created-after` - Filter by creation date (ISO format)
- `--created-before` - Filter by creation date (ISO format)
- `--updated-after` - Filter by update date
- `--limit` - Max results (default 30)
- `--cursor` - Pagination cursor

#### Get Ticket with Messages
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-ticket <ticket-id>
```

#### Search Tickets
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "shipping delay" [--limit 10]
```

**Note:** This searches recent tickets by filtering on subject, excerpt, and customer info. For comprehensive historical text search, use the postgresql skill with the `gorgias_tickets` and `gorgias_messages` tables.

#### Create Ticket
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts create-ticket '{"channel": "email", "subject": "Test", "messages": [{"body_text": "Hello"}]}'
```

#### Update Ticket
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts update-ticket <ticket-id> '{"status": "closed"}'
```

#### Add Message/Reply
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts add-message <ticket-id> '{"body_text": "Thank you for contacting us!", "from_agent": true}'
```

### 3. Messages

#### List Messages for Ticket
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-messages <ticket-id>
```

#### Get Message
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-message <message-id>
```

### 4. Customers

#### List Customers
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-customers [--email X] [--limit N]
```

#### Get Customer
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-customer <customer-id>
```

#### Search Customers by Email
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-customers "customer@example.com"
```

#### Get Customer's Tickets
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-customer-tickets <customer-id> [--limit 10]
```

#### Update Customer
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts update-customer <customer-id> '{"note": "VIP customer"}'
```

#### Merge Customers
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts merge-customers '{"target_customer_id": 123, "source_customer_ids": [456, 789]}'
```

### 5. Satisfaction Surveys

#### List Surveys
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-surveys [--created-after 2026-01-01] [--limit 50]
```

#### Get Survey
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-survey <survey-id>
```

### 6. Tags

#### List Tags
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-tags
```

#### Create Tag
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts create-tag '{"name": "urgent", "decoration": {"color": "#FF0000"}}'
```

#### Delete Tag
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts delete-tag <tag-id>
```

#### Add Tag to Ticket
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts add-tag-to-ticket <ticket-id> <tag-id>
```

#### Remove Tag from Ticket
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts remove-tag-from-ticket <ticket-id> <tag-id>
```

### 7. Users & Teams

#### List Users
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-users
```

#### Get User
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-user <user-id>
```

#### List Teams
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-teams
```

### 8. Views & Macros

#### List Views
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-views
```

#### List Macros
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-macros
```

#### Get Macro
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-macro <macro-id>
```

### 9. Integrations

#### List Integrations
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts list-integrations
```

## Natural Language to API Translation

When a user asks a natural language question about Gorgias data, follow this process:

### Step 1: Understand the Question

Extract key information:
- **What resource**: tickets, messages, customers, surveys, tags?
- **What operation**: read, search, create, update?
- **What filters**: status, channel, date range, customer?
- **Real-time needed?**: If historical analysis, consider postgresql skill

### Step 2: Identify the Resource

Map natural language to Gorgias resources:
- "tickets", "support requests", "cases" -> tickets
- "messages", "replies", "conversations" -> messages
- "customers", "users", "contacts" -> customers
- "satisfaction", "CSAT", "feedback" -> satisfaction-surveys
- "tags", "labels" -> tags
- "agents", "team members" -> users

### Step 3: Determine the Operation

| User Says | Operation |
|-----------|-----------|
| "show", "list", "get", "find" | Read (list/get) |
| "search", "look for" | Search |
| "reply", "respond", "add note" | Add message |
| "close", "update", "change" | Update |
| "create", "new" | Create |
| "tag", "label" | Add tag |
| "assign" | Update assignee |

### Step 4: Extract Parameters

- Date ranges from "last week", "this month", "since January"
- Status from "open", "closed", "unresolved"
- Channel from "email", "chat", "Instagram", "phone"
- Customer from email addresses or order references

### Step 5: Execute Request

Run the appropriate CLI command with extracted parameters.

### Step 6: Handle Pagination

If results are paginated (meta.next_cursor present):
1. Collect initial results
2. If more needed, use cursor for next page
3. Combine results from all pages

### Step 7: Interpret Results

- Parse the response data
- Format for user readability
- Provide counts, summaries, or highlights as appropriate

## Shopify Integration

Gorgias tickets can be linked to Shopify orders. To find tickets for a Shopify order:

1. **Search by order number**:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-tickets "#12345"
```

2. **Find customer by email, then get their tickets**:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts search-customers "customer@email.com"
deno run --allow-net --allow-env --allow-read .claude/skills/gorgias/scripts/gorgias-client.ts get-customer-tickets <customer-id>
```

For complex Shopify+Gorgias queries (e.g., "tickets for orders over $200"), use the postgresql skill which can join the data sources.

## Reference Files

- **workflow-examples.md** - Step-by-step workflow examples
- **queries.md** - Common query patterns

## Rate Limits

Gorgias API has rate limits (typically 60 requests/minute). If you encounter rate limit errors:
1. Wait a few seconds before retrying
2. Reduce query frequency
3. Use pagination with smaller page sizes

## Security Notes

- Never expose `GORGIAS_API_TOKEN` in logs or responses
- Never expose `GORGIAS_EMAIL` in public code
- Store credentials securely in `.env` file
- The `.env` file should be in `.gitignore`
- Warn before sending messages to customers (write operations)

## Troubleshooting

### Authentication Errors
```
Error: Gorgias API error (401): Unauthorized
```
- Verify `GORGIAS_EMAIL` is correct
- Verify `GORGIAS_API_TOKEN` is correct
- Check that the API key has not been revoked

### Not Found Errors
```
Error: Gorgias API error (404): Not found
```
- Verify the ticket/customer/tag ID exists
- IDs are numeric integers

### Rate Limit Errors
```
Error: Gorgias API error (429): Too many requests
```
- Wait a few seconds and retry
- Reduce the frequency of API calls

### Domain Errors
```
Error: Missing GORGIAS_DOMAIN
```
- Add `GORGIAS_DOMAIN` to `.env` file
- Use just the subdomain (e.g., "your-domain" not "your-domain.gorgias.com")

