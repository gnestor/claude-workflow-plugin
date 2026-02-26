---
name: gorgias
description: Real-time customer support data from Gorgias including tickets, messages, customers, and satisfaction surveys. Use for real-time ticket operations, text search, and write operations. Not for historical trend analysis, aggregate metrics, or cross-source queries.
category: ~~customer-support
service: Gorgias
---

# Gorgias

## Purpose

This skill enables direct interaction with the Gorgias API for customer support operations using the `~~customer-support` client script. It translates natural language questions into API calls, executes them, and interprets the results. Provides real-time access to tickets, messages, customers, satisfaction surveys, tags, users, and macros.

**Use this skill for REAL-TIME customer support operations and WRITE operations.**

Authentication is handled automatically by lib/auth.js.

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

## Client Script

**Path:** `skills/gorgias/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Test authentication |
| `get-account` | Get account info |
| `list-tickets` | List tickets [--status, --limit, --cursor, --assignee-id, --channel] |
| `get-ticket` | Get ticket with messages (--id) |
| `search-tickets` | Search tickets client-side (--query) [--limit] |
| `create-ticket` | Create ticket (--subject) [--customer-email, --channel, --body, --json] |
| `update-ticket` | Update ticket (--id) [--status, --assignee-id, --priority, --json] |
| `add-message` | Add message to ticket (--ticket-id, --body) [--channel, --from-agent, --sender-email, --json] |
| `list-messages` | List messages for ticket (--ticket-id) |
| `get-message` | Get message by id (--id) |
| `list-customers` | List customers [--email, --limit, --cursor] |
| `get-customer` | Get customer by id (--id) |
| `search-customers` | Search customers by email (--email) |
| `update-customer` | Update customer (--id) [--name, --email, --json] |
| `merge-customers` | Merge customers (--target-id, --source-id) |
| `get-customer-tickets` | Get tickets for customer (--customer-id) [--limit] |
| `list-surveys` | List satisfaction surveys [--limit, --cursor, --ticket-id, --score] |
| `get-survey` | Get satisfaction survey by id (--id) |
| `list-tags` | List tags |
| `create-tag` | Create a tag |
| `delete-tag` | Delete a tag |
| `add-tag` | Add tag to ticket |
| `remove-tag` | Remove tag from ticket |
| `list-users` | List users |
| `get-user` | Get user details |
| `list-teams` | List teams |
| `list-views` | List views |
| `list-macros` | List macros |
| `get-macro` | Get macro details |
| `list-integrations` | List connected integrations |

## Key API Concepts

- **Base URL**: `https://{domain}.gorgias.com/api`
- **Pagination**: Cursor-based. When `meta.next_cursor` is present, pass it as `--cursor` on subsequent calls.
- **Rate limits**: 60 requests/minute. Wait and retry on 429 errors.
- **IDs**: Numeric integers.
- **Domain**: Just the subdomain (e.g., `your-domain` not `your-domain.gorgias.com`).

## Shopify Integration

Gorgias tickets can be linked to Shopify orders. To find tickets for a Shopify order:

1. **Search by order number**: Search tickets for "#12345"
2. **Find customer by email, then get their tickets**: Search customers by email, then get customer tickets

For complex Shopify+Gorgias queries (e.g., "tickets for orders over $200"), use the postgresql skill which can join the data sources.

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('gorgias', '/tickets?status=open');
```

## Reference Files
- [queries.md](references/queries.md) -- Common query patterns
- [workflow-examples.md](references/workflow-examples.md) -- Step-by-step workflow examples
