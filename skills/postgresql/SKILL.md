---
name: postgresql
description: Data warehouse for cross-source queries. Use when joining data across multiple sources or when no dedicated API skill exists for the data. Supports JSON/JSONB introspection and Jupyter notebook export. Not for single-source queries where a dedicated API skill is available.
---

# PostgreSQL Database Access

## Purpose

**Use this skill for CROSS-DATA-SOURCE queries only.** This skill enables direct interaction with PostgreSQL databases that contain data from multiple sources using `~~database` tools. It translates natural language questions into SQL queries, executes them, and interprets the results. Special support for JSON/JSONB document store tables commonly used for API data (Shopify, Gorgias, Instagram, etc.).

Authentication is handled by the MCP server configuration.

## When to Use

**ONLY use this skill when you need to join data across multiple data sources.**

Activate this skill when the user:
- Needs to join Shopify data with other sources: "Show me orders with DM shipments", "Orders with Gorgias tickets"
- Wants to correlate data across systems: "Compare Instagram post performance with product sales"
- Needs complex multi-source analysis: "Orders from customers who have open support tickets"
- Requests reports combining multiple data sources: "Revenue by fulfillment provider"
- Wants to export complex cross-source query results to Jupyter notebook
- Explicitly mentions database tables or multiple data sources

## When NOT to Use

- **Pure Shopify queries**: Use shopify skill for orders, products, customers, inventory, etc. (e.g., "How many orders this week?" -> use shopify)
- **Website behavior**: Use google-analytics skill for traffic, page views, sessions, conversions (e.g., "What's our bounce rate?" -> use google-analytics)
- **Single-source queries**: If the question only involves one data source, use that source's primary skill

## Available Tools

The `~~database` MCP server provides tools for:
- **List tables** - List all tables in the database
- **Get schema** - Get column names, types, and constraints for a specific table
- **Introspect JSON** - Analyze the structure of JSON/JSONB data in a specific column
- **Execute query** - Run SQL queries and return results
- **Scan all tables** - Scan all tables and cache schemas to `references/schemas/`
- **Export to notebook** - Create a Jupyter notebook with query and results

## Natural Language to SQL Translation Process

When a user asks a natural language question about data, follow this process:

### Step 1: Understand the Question

Extract key information:
- **What data**: What tables or entities are being queried? (orders, customers, tickets, etc.)
- **What filters**: Time ranges, conditions, specific values
- **What aggregation**: Count, sum, average, group by
- **What output**: Specific columns, calculated fields

### Step 2: Identify Tables

Map natural language terms to database tables:
- **ALWAYS check cached schemas in `references/schemas/` directory FIRST**
- Schema files are named `{table_name}.json` (e.g., `dm_orders.json`, `shopify_orders.json`)
- Only run list-tables if you need to discover new tables not in cache
- Common mappings:
  - "orders" -> `shopify_orders`
  - "customers" -> `shopify_customers`
  - "tickets" -> `gorgias_tickets`
  - "products" -> `shopify_products`

### Step 3: Get Table Schema from Cache

For identified tables, read their schema from cached files:
- **Read the cached schema file** from `references/schemas/{table_name}.json`
- Cached schemas include:
  - Column names and types
  - JSON field structures (for JSONB columns like `data`)
  - Sample values
- Pay special attention to JSONB columns (usually named `data`)
- **ONLY use schema introspection tools if the cached schema is missing or unclear**

### Step 4: Construct SQL Query

Build the SQL query using these best practices:

**EFFICIENCY RULE: Execute ONE query instead of multiple queries**

**For tables with JSONB columns (PREFERRED METHOD):**
```sql
-- Select the entire JSONB column, use JavaScript for extraction
SELECT data
FROM dm_orders
WHERE DATE(data->>'shipped_date') = '2025-11-05'
ORDER BY data->>'shipped_date'
```

**For regular (non-JSON) columns:**
```sql
SELECT id, created_at, status
FROM shopify_orders
WHERE created_at >= '2024-10-01'
```

**Common JSON patterns:**
- `data->>'field'` - Get text value from JSON
- `data->'field'` - Get JSON object/array
- `(data->>'field')::numeric` - Cast JSON value to number
- `jsonb_array_elements()` - Expand JSON array to rows
- `data @> '{"key":"value"}'` - JSON containment check

**Key principle:** Let PostgreSQL do filtering, let JavaScript do extraction and transformation.

### Step 5: Execute Query

- Run the query using `~~database` query tools
- If query fails with error, analyze the error message
- Common fixes:
  - Column doesn't exist -> Check schema, might be in JSON column
  - Type mismatch -> Add proper casting (`::numeric`, `::date`, etc.)
  - Invalid JSON path -> Check JSON structure with introspect-json
  - Syntax error -> Review SQL syntax

### Step 6: Retry on Error

If query fails:
1. Analyze error message carefully
2. Adjust query based on error
3. Re-execute
4. Maximum 2-3 retry attempts

### Step 7: Interpret Results

Once query succeeds:
1. Analyze the returned data
2. Answer the original natural language question
3. Provide context and insights
4. Format results clearly (table, list, or summary)
5. Offer to export to Jupyter notebook if complex analysis

## Reference Files

Detailed examples and documentation are available in the `references/` directory:

- **[workflow-examples.md](references/workflow-examples.md)** - Detailed step-by-step workflow examples for common query patterns
- **[queries.md](references/queries.md)** - Collection of ready-to-use SQL query examples
- **schemas/** - Cached table schemas with JSON field structures

## Schema Caching

The scan-all command creates JSON schema files in `references/schemas/` directory. These files contain:
- Column names and types
- JSON field structures for JSON/JSONB columns
- Sample values
- Common query patterns

**Always check cached schemas first** before running database introspection commands.

## Security Notes

- Never expose database credentials in output
- Sanitize user input before constructing queries (prevent SQL injection)
- Use parameterized queries when possible
- Limit result sets to reasonable sizes (default LIMIT 1000)
- Warn before executing DELETE or UPDATE queries

## Troubleshooting

**"Connection refused"**
- Verify MCP server configuration
- Check network/firewall settings

**"Column does not exist"**
- Column might be in JSON/JSONB field
- Check schema with cached file in `references/schemas/`
- Use introspect-json tools for JSON columns

**"Invalid JSON path"**
- Use introspect-json to see actual structure
- Check for typos in field names
- Verify field exists in sample data

**"Type casting error"**
- Add explicit casts: `::numeric`, `::integer`, `::date`
- Check for null values
- Verify data format
