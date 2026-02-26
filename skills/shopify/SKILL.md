---
name: shopify
description: Primary source of truth for all Shopify data including orders, products, customers, and inventory. Activate when the user asks about Shopify data without needing to join with other data sources. Not for cross-source queries, website analytics, or non-Shopify data.
category: ~~e-commerce
service: Shopify
---

# Shopify

## Purpose

This skill enables direct interaction with the Shopify Admin GraphQL API using the `~~e-commerce` client script. It translates natural language questions into GraphQL queries, executes them, and interprets the results. Provides access to all Shopify resources including orders, products, customers, inventory, and more.

**This is the PRIMARY SOURCE OF TRUTH for all Shopify data.**

Authentication is handled automatically by lib/auth.js.

## When to Use

Activate this skill when the user:
- Asks questions about Shopify data: "How many orders did we have this month?"
- Wants to query specific Shopify resources: "Show me products with low inventory"
- Needs to analyze Shopify data: "What's the average order value?"
- Requests data about customers, orders, products, inventory, etc.
- Wants to create or update Shopify resources using mutations
- References Shopify concepts or terminology
- Asks about orders, products, customers WITHOUT needing to join with other data sources

## When NOT to Use

- **Cross-data-source queries**: Use postgresql skill when joining Shopify data with other sources (e.g., "Show me orders with DM shipments", "Orders with Gorgias tickets")
- **Website behavior analysis**: Use google-analytics skill for questions about traffic, page views, bounce rates, user sessions, etc.

## Client Script

**Path:** `skills/shopify/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `query` | Execute a GraphQL query [--variables JSON] |
| `mutation` | Execute a GraphQL mutation [--variables JSON] |
| `introspect` | Fetch and cache GraphQL schema to `references/schemas/` |

## Key API Concepts

- **API**: Shopify Admin GraphQL API version 2025-01.
- **Pagination**: Connection-based with `first`/`after` and `pageInfo { hasNextPage endCursor }`. Use `nodes` pattern (not `edges`). Max `first: 250`.
- **Rate limits**: Bucket system with 1000 points, restoring at 50/second. Reduce query complexity or wait on throttle errors.
- **Money fields**: Access through `MoneyBag` types (e.g., `totalPriceSet.shopMoney.amount`).
- **Filtering**: Use `query: "field:value"` string syntax (see references/query-syntax.md).

## Schema Cache

Run `introspect` to cache the full GraphQL schema at `references/schemas/introspection.json`. Check this file for available types, fields, and arguments before constructing queries.

## GraphQL Query Patterns

### nodes vs edges -- Which to Use

**`nodes` (Recommended)**: Use 90% of the time for cleaner queries.

```graphql
{
  orders(first: 250, query: "created_at:>=2024-01-01") {
    nodes {
      id
      name
      createdAt
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**`edges -> node` (Verbose)**: Only when you need per-item cursors or edge-specific metadata.

```graphql
{
  orders(first: 10) {
    edges {
      cursor
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Pagination

Use `first: 250` (Shopify max) unless fewer results are needed. Paginate with `after`:

```graphql
{
  orders(first: 250, after: "eyJsYXN0X2lk...") {
    nodes { id name }
    pageInfo { hasNextPage endCursor }
  }
}
```

Continue until `hasNextPage` is false.

### Common Query Mappings

| Natural language | GraphQL query |
|-----------------|---------------|
| "orders" | `orders` -> `OrderConnection` |
| "products" | `products` -> `ProductConnection` |
| "customers" | `customers` -> `CustomerConnection` |
| "inventory" | `inventoryItems` or `inventoryLevels` |
| "collections" | `collections` -> `CollectionConnection` |

### Filtering with query syntax

```graphql
orders(first: 250, query: "created_at:>=2024-01-01 financial_status:paid")
```

See references/query-syntax.md for full filter syntax.

### Sorting

```graphql
orders(first: 250, sortKey: CREATED_AT, reverse: true)
```

## GraphQL Mutations

```graphql
mutation {
  productCreate(input: {
    title: "New Product"
    productType: "Apparel"
  }) {
    product {
      id
      title
    }
    userErrors {
      field
      message
    }
  }
}
```

Always check `userErrors` in mutation responses.

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('shopify', '/graphql.json', {
  method: 'POST',
  body: JSON.stringify({ query: '{ shop { name } }' })
});
```

## Reference Files
- [queries.md](references/queries.md) -- Ready-to-use GraphQL query examples
- [query-syntax.md](references/query-syntax.md) -- Complete Shopify query language syntax reference
- [workflow-examples.md](references/workflow-examples.md) -- Step-by-step workflow examples
