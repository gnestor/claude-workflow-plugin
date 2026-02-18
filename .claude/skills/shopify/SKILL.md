---
name: shopify
description: Primary source of truth for all Shopify data including orders, products, customers, and inventory. Activate when the user asks about Shopify data without needing to join with other data sources. Not for cross-source queries, website analytics, or non-Shopify data.
---

# Shopify API Access

## Purpose

This Skill enables direct interaction with the Shopify Admin GraphQL API. It translates natural language questions into GraphQL queries, executes them, and interprets the results. Provides access to all Shopify resources including orders, products, customers, inventory, and more.

**This is the PRIMARY SOURCE OF TRUTH for all Shopify data.**

## When to Use

Activate this Skill when the user:
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

## Setup

1. Go to your Shopify Admin → Settings → Apps and sales channels
2. Click **Develop apps** → **Create an app**
3. Configure Admin API scopes (read_orders, read_products, read_customers, read_inventory, etc.)
4. Click **Install app**
5. Copy the **Admin API access token**
6. Save to `.env`:
   - `SHOPIFY_STORE_DOMAIN=your-store.myshopify.com`
   - `SHOPIFY_API_TOKEN=your-token`

## Available Operations

### 1. Scan Schema

Fetch and save the latest Shopify GraphQL schema from the introspection endpoint.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/shopify/scripts/shopify-client.ts scan-schema
```

### 2. Introspect Types

List all available types, queries, and mutations in the Shopify GraphQL schema.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/shopify/scripts/shopify-client.ts introspect-types
```

### 3. Get Type Details

Get detailed information about a specific GraphQL type.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/shopify/scripts/shopify-client.ts get-type Order
```

### 4. Execute Query

Execute a GraphQL query and return results (single page).

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/shopify/scripts/shopify-client.ts query "{ shop { name email } }"
```

### 4b. Execute Query with Auto-Pagination

Use `--all` to automatically fetch all pages. The script detects `pageInfo` in the response, follows cursors, and merges all `nodes` into a single result. **When `--all` is used, `first: N` is automatically bumped to 250 (Shopify max) if lower.** Always include `pageInfo { hasNextPage endCursor }` in your query for this to work.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/shopify/scripts/shopify-client.ts query --all '{ orders(first: 250, query: "created_at:>=2024-01-01") { nodes { id name } pageInfo { hasNextPage endCursor } } }'
```

The response includes a `pagination` summary:
```json
{
  "success": true,
  "data": { "orders": { "nodes": [...] } },
  "pagination": { "pagesFetched": 3, "totalNodes": 583 },
  "duration": 1847
}
```

### 5. Execute Mutation

Execute a GraphQL mutation to create or update data.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/shopify/scripts/shopify-client.ts mutation "mutation { ... }"
```

## Natural Language to GraphQL Translation Process

When a user asks a natural language question about Shopify data, follow this process:

### Step 1: Understand the Question

Extract key information:
- **What resource**: What Shopify entity? (orders, products, customers, inventory, etc.)
- **What filters**: Time ranges, conditions, specific values
- **What aggregation**: Count, sum, average, group by
- **What fields**: Specific properties to retrieve

### Step 2: Identify GraphQL Type

Map natural language terms to Shopify GraphQL types:
- Check cached schema in `references/schemas/` directory
- Common mappings:
  - "orders" → `orders` query, returns `OrderConnection`
  - "products" → `products` query, returns `ProductConnection`
  - "customers" → `customers` query, returns `CustomerConnection`
  - "inventory" → `inventoryItems` or `inventoryLevels`
  - "collections" → `collections` query

### Step 3: Get Type Schema

For identified types, understand their structure:
- Run `get-type <TypeName>` to see available fields
- Note: Shopify uses connection types for pagination (edges/nodes pattern)
- Look for common fields like `id`, `createdAt`, `updatedAt`, etc.

### Step 4: Construct GraphQL Query

Build the GraphQL query using these patterns:

**Edges vs Nodes - Which to Use?**

GraphQL connections support two patterns for accessing items:

1. **`nodes` (Recommended - Cleaner)**: Use this 90% of the time for simpler, more readable queries
```graphql
{
  orders(first: 10, query: "created_at:>=2024-01-01") {
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

2. **`edges -> node` (Verbose)**: Only use when you need:
   - Per-item cursors (not just page cursors)
   - Edge-specific metadata
   - Relay-specific patterns
```graphql
{
  orders(first: 10) {
    edges {
      cursor  # Individual cursor for THIS specific item
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      endCursor  # Cursor for the end of the page
    }
  }
}
```

**Recommendation**: Always use `nodes` unless you have a specific reason to use `edges`. The `pageInfo.endCursor` is sufficient for standard pagination.

**Basic query pattern with nodes:**
```graphql
{
  orders(first: 10, query: "created_at:>=2024-01-01") {
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

**Common patterns:**
- Use `first: 250` for forward pagination (250 is Shopify's max — always use this unless you need fewer results)
- Use `after: "cursor"` for pagination with `pageInfo.endCursor`
- Use `query: "field:value"` for filtering (see `references/query-syntax.md` for filter syntax)
- Use `sortKey: FIELD` for sorting
- Access money values through `MoneyBag` types (e.g., `totalPriceSet.shopMoney.amount`)
- Prefer `nodes` over `edges -> node` for cleaner queries

### Step 5: Execute Query

- Run the query using `query` command
- If query fails with error, analyze the error message
- Common fixes:
  - Field doesn't exist → Check schema with `get-type`
  - Invalid query syntax → Review Shopify query language in `references/query-syntax.md`
  - Rate limit exceeded → Wait and retry
  - Cursor expired → Start from beginning

### Step 6: Handle Pagination

If results are paginated (hasNextPage = true):
1. Extract the `endCursor` from pageInfo
2. Make subsequent request with `after: endCursor`
3. Combine results from all pages
4. Continue until `hasNextPage` is false

### Step 7: Interpret Results

Once query succeeds:
1. Parse the nested response structure (edges -> node)
2. Extract relevant fields
3. Perform any aggregations (count, sum, average)
4. Answer the original natural language question
5. Format results clearly (table, list, or summary)

## Reference Files

Detailed examples and documentation are available in the `references/` directory:

- **workflow-examples.md** - Detailed step-by-step workflow examples for common query patterns
- **query-syntax.md** - Complete Shopify query language syntax reference
- **queries.md** - Collection of ready-to-use GraphQL query examples
- **schemas/** - Cached GraphQL schemas

Consult these files when building queries or troubleshooting issues.

## Schema Caching

The `scan-schema` command fetches the GraphQL schema and saves it to `references/schemas/shopify-2025-10.graphql`. This file contains:
- All available types (Order, Product, Customer, etc.)
- All fields and their types
- All queries and mutations
- Enum values
- Input types

Always check cached schema first before making introspection queries.

## GraphQL Mutations

To create or update Shopify resources:

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

Always check `userErrors` field in mutation responses.

## Rate Limits

Shopify enforces rate limits based on a "bucket" system:
- Most apps get 1000 points
- Each query costs points based on complexity
- Points restore at 50/second

If rate limited:
- Wait for bucket to refill
- Reduce query complexity
- Batch operations when possible

## Security Notes

- Never expose `SHOPIFY_API_TOKEN` in output
- Sanitize user input before constructing queries
- Warn before executing mutations that modify data
- Use read-only queries when possible
- Be cautious with bulk operations

## Troubleshooting

**"Authentication failed"**
- Check `SHOPIFY_API_TOKEN` is set in `.env`
- Verify token has necessary permissions
- Check token hasn't expired

**"Field doesn't exist"**
- Check schema with `get-type` command
- Verify API version matches schema
- Field might be on a related type (e.g., variants not products)

**"Rate limit exceeded"**
- Wait 20-30 seconds for bucket to refill
- Simplify query to use fewer points
- Paginate with smaller page sizes

**"Query too complex"**
- Reduce number of nested fields
- Split into multiple smaller queries
- Avoid requesting unnecessary fields
