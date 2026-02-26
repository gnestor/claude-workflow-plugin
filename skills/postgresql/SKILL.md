---
name: postgresql
description: Data warehouse for cross-source queries. Use when joining data across multiple sources or when no dedicated API skill exists for the data. Supports JSON/JSONB introspection and Jupyter notebook export. Not for single-source queries where a dedicated API skill is available.
category: ~~database
service: postgresql
---

# PostgreSQL

## Purpose

**Use this skill for CROSS-DATA-SOURCE queries only.** This skill enables direct interaction with PostgreSQL databases that contain data from multiple sources via a client script. It translates natural language questions into SQL queries, executes them, and interprets the results. Special support for JSON/JSONB document store tables commonly used for API data (Shopify, Gorgias, Instagram, etc.).

Authentication is handled automatically by `lib/auth.js`.

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

## Client Script

**Path:** `skills/postgresql/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `query (SQL string) [--params JSON_ARRAY]` | Execute a SQL query with optional parameterized values |
| `list-tables` | List all tables in the database |
| `get-schema --table [--schema]` | Get column names, types, and constraints for a table |
| `scan-all` | Scan all tables and cache schemas to `references/schemas/` |
| `introspect-json --table --column [--limit]` | Analyze the structure of JSON/JSONB data in a column |

## Key API Concepts

PostgreSQL via the `pg` npm package (connection string based). Many tables use JSONB columns for API-synced data. Use `data->>'field'` for text extraction and `data->'field'` for nested objects/arrays.

## Natural Language to SQL Translation Process

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
- Only run `list-tables` if you need to discover new tables not in cache

### Step 3: Get Table Schema from Cache

For identified tables, read their schema from cached files:
- **Read the cached schema file** from `references/schemas/{table_name}.json`
- Cached schemas include column names and types, JSON field structures, and sample values
- Pay special attention to JSONB columns (usually named `data`)
- **ONLY use `introspect-json` if the cached schema is missing or unclear**

### Step 4: Construct SQL Query

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

### Step 5: Execute and Retry

- Run the query using the `query` command
- If query fails, analyze the error message and adjust:
  - Column doesn't exist -> Check schema, might be in JSON column
  - Type mismatch -> Add proper casting (`::numeric`, `::date`, etc.)
  - Invalid JSON path -> Check JSON structure with `introspect-json`
- Maximum 2-3 retry attempts

### Step 6: Interpret Results

Once query succeeds:
1. Analyze the returned data
2. Answer the original natural language question
3. Provide context and insights
4. Format results clearly (table, list, or summary)
5. Offer to export to Jupyter notebook if complex analysis

## Schema Caching

The `scan-all` command creates JSON schema files in `references/schemas/`. These files contain column names and types, JSON field structures for JSONB columns, sample values, and common query patterns.

**Always check cached schemas first** before running database introspection commands.

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('postgresql', '/query', {
  method: 'POST',
  body: { sql: 'SELECT * FROM shopify_orders LIMIT 10' }
});
```

## Reference Files
- [examples.md](references/examples.md) — Usage patterns and queries
- [documentation.md](references/documentation.md) — Full API documentation
