---
name: postgresql
description: Data warehouse for cross-source queries. Use when joining data across multiple sources or when no dedicated API skill exists for the data. Supports JSON/JSONB introspection and Jupyter notebook export. Not for single-source queries where a dedicated API skill is available.
---

# PostgreSQL Database Access

## Purpose

**Use this skill for CROSS-DATA-SOURCE queries only.** This Skill enables direct interaction with PostgreSQL databases that contain data from multiple sources. It translates natural language questions into SQL queries, executes them, and interprets the results. Special support for JSON/JSONB document store tables commonly used for API data (Shopify, Gorgias, DM, Instagram, etc.).

## When to Use

**ONLY use this Skill when you need to join data across multiple data sources.**

Activate this Skill when the user:
- Needs to join Shopify data with other sources: "Show me orders with DM shipments", "Orders with Gorgias tickets"
- Wants to correlate data across systems: "Compare Instagram post performance with product sales"
- Needs complex multi-source analysis: "Orders from customers who have open support tickets"
- Requests reports combining multiple data sources: "Revenue by fulfillment provider"
- Wants to export complex cross-source query results to Jupyter notebook
- Explicitly mentions database tables or multiple data sources

## When NOT to Use

- **Pure Shopify queries**: Use shopify skill for orders, products, customers, inventory, etc. (e.g., "How many orders this week?" → use shopify)
- **Website behavior**: Use google-analytics skill for traffic, page views, sessions, conversions (e.g., "What's our bounce rate?" → use google-analytics)
- **Single-source queries**: If the question only involves one data source, use that source's primary skill

## Setup

1. Get your PostgreSQL connection details from your database host (Supabase, Railway, Neon, etc.)
2. Save to `.env`:
   - `POSTGRES_USER=your-username`
   - `POSTGRES_PASSWORD=your-password`
   - `POSTGRES_HOST=your-host`
   - `POSTGRES_DATABASE=your-database`

## Available Operations

### 1. List Tables

List all tables in the database.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/postgresql/scripts/pg-client.ts list-tables
```

### 2. Get Table Schema

Get the schema for a specific table (columns, types, constraints).

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/postgresql/scripts/pg-client.ts get-schema <table-name>
```

### 3. Introspect JSON Column

Analyze the structure of JSON/JSONB data in a specific column.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/postgresql/scripts/pg-client.ts introspect-json <table-name> <column-name>
```

### 4. Execute Query

Execute a SQL query and return results.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/postgresql/scripts/pg-client.ts query "SELECT * FROM shopify_orders LIMIT 10"
```

### 5. Scan All Tables

Scan all tables and save schemas to JSON files in `references/schemas/` directory.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/postgresql/scripts/pg-client.ts scan-all
```

### 6. Export to Jupyter Notebook

Create a Jupyter notebook with the query and results.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/postgresql/scripts/pg-client.ts export-notebook <notebook-name> "SELECT query"
```

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
- **ALWAYS check cached schemas in `.claude/skills/postgresql/schemas/` directory FIRST**
- Schema files are named `{table_name}.json` (e.g., `dm_orders.json`, `shopify_orders.json`)
- Only run `list-tables` if you need to discover new tables not in cache
- Common mappings:
  - "orders" → `shopify_orders`
  - "customers" → `shopify_customers`
  - "tickets" → `gorgias_tickets`
  - "products" → `shopify_products`
  - "DM shipments" → `dm_orders`
  - "returns" → `dm_returns` or `shopify_returns`
- Look for table names containing the key terms

### Step 3: Get Table Schema from Cache

For identified tables, read their schema from cached files:
- **Read the cached schema file** from `.claude/skills/postgresql/schemas/{table_name}.json`
- Cached schemas include:
  - Column names and types
  - JSON field structures (for JSONB columns like `data`)
  - Sample values
- Pay special attention to JSONB columns (usually named `data`)
- **ONLY run `get-schema` or `introspect-json` if the cached schema is missing or unclear**

### Step 4: Construct SQL Query

Build the SQL query using these best practices:

**EFFICIENCY RULE: Execute ONE query instead of multiple queries**
- ❌ BAD: Separate queries for count and details
  ```sql
  -- Don't do this:
  SELECT COUNT(*) FROM dm_orders WHERE ...;  -- Query 1
  SELECT data FROM dm_orders WHERE ...;      -- Query 2
  ```
- ✅ GOOD: Single query with all data
  ```sql
  -- Do this instead:
  SELECT data FROM dm_orders WHERE ...;
  -- Then count in JavaScript: results.length
  ```

**For tables with JSONB columns (PREFERRED METHOD):**
```sql
-- Select the entire JSONB column, use JavaScript for extraction
SELECT data
FROM dm_orders
WHERE DATE(data->>'shipped_date') = '2025-11-05'
ORDER BY data->>'shipped_date'
```

Then use JavaScript to process results:
```
// Extract all data
const records = results.rows.map(({ data }) => data);

// Count
const count = records.length;

// Extract specific fields if needed
const orderNumbers = records.map(r => r.name);
```

**For regular (non-JSON) columns:**
```sql
SELECT id, created_at, status
FROM shopify_orders
WHERE created_at >= '2024-10-01'
```

**For mixed JSON + regular columns:**
```sql
-- Only extract specific JSON fields when joining or filtering is complex
SELECT
  id,
  data->>'customer_email' as customer_email,
  data->>'total_price' as total_price
FROM shopify_orders
WHERE data->>'order_status' = 'paid'
```

**Common JSON patterns (use sparingly):**
- `data->>'field'` - Get text value from JSON
- `data->'field'` - Get JSON object/array
- `(data->>'field')::numeric` - Cast JSON value to number
- `jsonb_array_elements()` - Expand JSON array to rows
- `data @> '{"key":"value"}'` - JSON containment check

**Key principle:** Let PostgreSQL do filtering, let JavaScript do extraction and transformation.

### Step 5: Execute Query

- Run the query using `query` command
- If query fails with error, analyze the error message
- Common fixes:
  - Column doesn't exist → Check schema, might be in JSON column
  - Type mismatch → Add proper casting (`::numeric`, `::date`, etc.)
  - Invalid JSON path → Check JSON structure with `introspect-json`
  - Syntax error → Review SQL syntax

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

- **workflow-examples.md** - Detailed step-by-step workflow examples for common query patterns
- **queries.md** - Collection of ready-to-use SQL query examples
- **schemas/** - Cached table schemas with JSON field structures

**Process:**
1. Identify table: "orders" → `shopify_orders`
2. Read cached schema: `.claude/skills/postgresql/schemas/shopify_orders.json`
3. Check if `created_at` is in regular columns or JSON
4. Construct single query (don't use COUNT):
```sql
SELECT id
FROM shopify_orders
WHERE created_at >= '2024-10-01' AND created_at < '2024-11-01'
```
5. Execute and count in JavaScript:
```
const count = results.rows.length;
```
6. Return: "You had 342 orders in October 2024."

### Example 2: JSON Field Query

**User:** "What's the average order value for paid orders last month?"

**Process:**
1. Identify table: `shopify_orders`
2. Read cached schema: `.claude/skills/postgresql/schemas/shopify_orders.json`
3. Identify fields: `total_price` and `order_status` in JSON `data` column
4. Construct single query selecting entire JSONB column:
```sql
SELECT data
FROM shopify_orders
WHERE data->>'order_status' = 'paid'
  AND created_at >= '2024-10-01'
  AND created_at < '2024-11-01'
```
5. Execute and calculate in JavaScript:
```
const orders = results.rows.map(({ data }) => data);
const total = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
const average = total / orders.length;
```
6. Return: "The average order value for paid orders in October was $87.45."

### Example 3: Complex JSON Array Query

**User:** "Show me the top 5 products by quantity sold in October"

**Process:**
1. Identify table: `shopify_orders`
2. Read cached schema: `.claude/skills/postgresql/schemas/shopify_orders.json`
3. Identify `line_items` array structure in JSON `data` column
4. Construct single query selecting entire JSONB column:
```sql
SELECT data
FROM shopify_orders
WHERE created_at >= '2024-10-01'
  AND created_at < '2024-11-01'
```
5. Execute and process in JavaScript:
```
const orders = results.rows.map(({ data }) => data);
const productCounts = {};
orders.forEach(order => {
  order.line_items?.forEach(item => {
    const name = item.product_name;
    productCounts[name] = (productCounts[name] || 0) + parseInt(item.quantity);
  });
});
const topProducts = Object.entries(productCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
```
6. Format results as a table

### Example 4: Query with Error Recovery

**User:** "Show me customer emails from orders over $100"

**Process:**
1. Identify table: `shopify_orders`
2. Read cached schema: `.claude/skills/postgresql/schemas/shopify_orders.json`
3. Discover that `customer_email` and `total_price` are in JSON `data` column
4. Construct single query selecting entire JSONB column:
```sql
SELECT data
FROM shopify_orders
WHERE (data->>'total_price')::numeric > 100
```
5. Execute and extract in JavaScript:
```
const orders = results.rows.map(({ data }) => data);
const emails = orders.map(order => order.customer_email);
```
6. Return list of customer emails

**Note:** By checking cached schema FIRST, we avoid query errors and wasted attempts.

## Schema Caching

The `scan-all` command creates JSON schema files in `references/schemas/` directory:
- `references/schemas/shopify_orders.json` - Schema for shopify_orders table
- `references/schemas/gorgias_tickets.json` - Schema for gorgias_tickets table
- etc.

These files contain:
- Column names and types
- JSON field structures for JSON/JSONB columns
- Sample values
- Common query patterns

**Always check cached schemas first** before running database introspection commands.

## Jupyter Notebook Export

When user requests Jupyter notebook export:
1. Execute the query to verify it works
2. Use `export-notebook` command to create `.ipynb` file
3. Place in `assets/{workflow-name}/` directory
4. Notebook includes:
   - Markdown cell with question and explanation
   - Code cell with SQL query
   - Code cell to execute query
   - Code cell to display results as DataFrame

## Security Notes

- Never expose database credentials in output
- Sanitize user input before constructing queries (prevent SQL injection)
- Use parameterized queries when possible
- Limit result sets to reasonable sizes (default LIMIT 1000)
- Warn before executing DELETE or UPDATE queries

## Troubleshooting

**"Connection refused"**
- Check PostgreSQL is running
- Verify connection details in `.env`
- Check network/firewall settings

**"Column does not exist"**
- Column might be in JSON/JSONB field
- Check schema with cached file in `references/schemas/`
- Use `introspect-json` for JSON columns

**"Invalid JSON path"**
- Use `introspect-json` to see actual structure
- Check for typos in field names
- Verify field exists in sample data

**"Type casting error"**
- Add explicit casts: `::numeric`, `::integer`, `::date`
- Check for null values
- Verify data format
