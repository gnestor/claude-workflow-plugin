---
name: shopify
description: Primary source of truth for all Shopify data including orders, products, customers, and inventory. Activate when the user asks about Shopify data without needing to join with other data sources. Not for cross-source queries, website analytics, or non-Shopify data.
---

# Shopify API Access

## Purpose

This skill enables direct interaction with the Shopify Admin GraphQL API using `~~e-commerce` tools. It translates natural language questions into GraphQL queries, executes them, and interprets the results. Provides access to all Shopify resources including orders, products, customers, inventory, and more.

**This is the PRIMARY SOURCE OF TRUTH for all Shopify data.**

Authentication is handled by the MCP server configuration.

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

## Available Tools

The `~~e-commerce` MCP server provides tools for:
- **Schema introspection** - Fetch and explore the Shopify GraphQL schema, list types, get type details
- **Query execution** - Execute GraphQL queries with optional auto-pagination
- **Mutation execution** - Create, update, and delete Shopify resources
- **Schema caching** - Scan and cache the full GraphQL schema for faster lookups

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
  - "orders" -> `orders` query, returns `OrderConnection`
  - "products" -> `products` query, returns `ProductConnection`
  - "customers" -> `customers` query, returns `CustomerConnection`
  - "inventory" -> `inventoryItems` or `inventoryLevels`
  - "collections" -> `collections` query

### Step 3: Get Type Schema

For identified types, understand their structure:
- Use schema introspection tools to see available fields
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

**Common patterns:**
- Use `first: 250` for forward pagination (250 is Shopify's max -- always use this unless you need fewer results)
- Use `after: "cursor"` for pagination with `pageInfo.endCursor`
- Use `query: "field:value"` for filtering (see `references/query-syntax.md` for filter syntax)
- Use `sortKey: FIELD` for sorting
- Access money values through `MoneyBag` types (e.g., `totalPriceSet.shopMoney.amount`)
- Prefer `nodes` over `edges -> node` for cleaner queries

### Step 5: Execute Query

- Run the query using `~~e-commerce` query tools
- If query fails with error, analyze the error message
- Common fixes:
  - Field doesn't exist -> Check schema with type introspection
  - Invalid query syntax -> Review Shopify query language in `references/query-syntax.md`
  - Rate limit exceeded -> Wait and retry
  - Cursor expired -> Start from beginning

### Step 6: Handle Pagination

If results are paginated (hasNextPage = true):
1. Extract the `endCursor` from pageInfo
2. Make subsequent request with `after: endCursor`
3. Combine results from all pages
4. Continue until `hasNextPage` is false

Use auto-pagination when available to automatically fetch all pages.

### Step 7: Interpret Results

Once query succeeds:
1. Parse the nested response structure
2. Extract relevant fields
3. Perform any aggregations (count, sum, average)
4. Answer the original natural language question
5. Format results clearly (table, list, or summary)

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

## Reference Files

Detailed examples and documentation are available in the `references/` directory:

- **[workflow-examples.md](references/workflow-examples.md)** - Detailed step-by-step workflow examples for common query patterns
- **[query-syntax.md](references/query-syntax.md)** - Complete Shopify query language syntax reference
- **[queries.md](references/queries.md)** - Collection of ready-to-use GraphQL query examples

Consult these files when building queries or troubleshooting issues.

## Security Notes

- Never expose API tokens in output
- Sanitize user input before constructing queries
- Warn before executing mutations that modify data
- Use read-only queries when possible
- Be cautious with bulk operations

## Troubleshooting

**"Authentication failed"**
- Verify the MCP server is properly configured
- Check that the token has necessary permissions

**"Field doesn't exist"**
- Check schema with type introspection tools
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
