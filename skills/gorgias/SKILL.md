---
name: gorgias
description: Real-time customer support data from Gorgias including tickets, messages, customers, and satisfaction surveys. Use for real-time ticket operations, text search, and write operations. Not for historical trend analysis, aggregate metrics, or cross-source queries.
---

# Gorgias API Integration

## Purpose

This skill enables direct interaction with the Gorgias API for customer support operations using `~~customer-support` tools. It translates natural language questions into API calls, executes them, and interprets the results. Provides real-time access to tickets, messages, customers, satisfaction surveys, tags, users, and macros.

**Use this skill for REAL-TIME customer support operations and WRITE operations.**

Authentication is handled by the MCP server configuration.

## When to Use

Activate this skill when the user:
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

## Available Tools

The `~~customer-support` MCP server provides tools for:
- **Authentication** - Test auth, get account info
- **Tickets** - List, get, search, create, update tickets; add messages/replies
- **Messages** - List messages for ticket, get message details
- **Customers** - List, get, search customers; get customer tickets; update customer; merge customers
- **Satisfaction Surveys** - List and get surveys
- **Tags** - List, create, delete tags; add/remove tags from tickets
- **Users & Teams** - List users, get user details, list teams
- **Views & Macros** - List views, list macros, get macro details
- **Integrations** - List connected integrations

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

Run the appropriate `~~customer-support` tools with extracted parameters.

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

1. **Search by order number**: Search tickets for "#12345"
2. **Find customer by email, then get their tickets**: Search customers by email, then get customer tickets

For complex Shopify+Gorgias queries (e.g., "tickets for orders over $200"), use the postgresql skill which can join the data sources.

## Reference Files

- **[queries.md](references/queries.md)** - Common query patterns
- **[workflow-examples.md](references/workflow-examples.md)** - Step-by-step workflow examples

## Rate Limits

Gorgias API has rate limits (typically 60 requests/minute). If you encounter rate limit errors:
1. Wait a few seconds before retrying
2. Reduce query frequency
3. Use pagination with smaller page sizes

## Security Notes

- Never expose API tokens or email addresses in logs or responses
- Store credentials securely via MCP server configuration
- Warn before sending messages to customers (write operations)

## Troubleshooting

### Authentication Errors
```
Error: Gorgias API error (401): Unauthorized
```
- Verify MCP server configuration
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
- Check MCP server configuration
- Domain should be just the subdomain (e.g., "your-domain" not "your-domain.gorgias.com")
