---
name: google-bigquery
description: This skill should be used ONLY when the user explicitly mentions "BigQuery" or "BQ", OR when the question requires data that doesn't exist in PostgreSQL schemas. Activate for BigQuery-specific queries or when data is only available in BigQuery. For Shopify data use shopify skill. For website analytics use google-analytics skill. For general database queries use postgresql skill (default data warehouse). This is a secondary data warehouse - defer to dedicated tools first.
---

# Google BigQuery API Integration

## Purpose

This Skill enables direct interaction with Google BigQuery data warehouse. It translates natural language questions into BigQuery SQL queries, executes them, and interprets the results. Supports schema scanning and caching for efficient query generation.

**Use this skill ONLY for explicit BigQuery requests or when data doesn't exist in PostgreSQL.**

## When to Use

Activate this Skill **ONLY** when:
- User **explicitly mentions "BigQuery"** or "BQ": "Query BigQuery for...", "What's in my BigQuery project?"
- Data is **only available in BigQuery** and not in PostgreSQL schemas
- User requests BigQuery-specific features: partitioned tables, approximate functions (APPROX_COUNT_DISTINCT)
- User wants to export BigQuery query results to Jupyter notebook
- User needs to scan and cache BigQuery table schemas

## When NOT to Use

**ALWAYS defer to these tools first:**

- **Shopify data**: Use shopify skill for orders, products, customers, inventory (e.g., "How many orders this week?" → use shopify, NOT BigQuery)
- **Website behavior**: Use google-analytics skill for traffic, page views, sessions (e.g., "What's our bounce rate?" → use google-analytics, NOT BigQuery)
- **General database queries**: Use postgresql skill for "query the database", "show me data", cross-source analysis (e.g., "Query orders from last month" → use postgresql FIRST, only use BigQuery if user explicitly mentions it)
- **Cross-source queries**: Use postgresql skill as the default data warehouse for joining data from multiple sources
- **Unclear source**: If the user doesn't specify BigQuery and the question could apply to multiple data sources, default to postgresql skill

**Key principle:** BigQuery is a **secondary data warehouse**. Only use it when explicitly requested or when PostgreSQL doesn't have the required data.

## Routing Decision Tree

Follow this decision tree when the user asks a data question:

1. **Does the question mention "BigQuery" or "BQ" explicitly?**
   - ✅ YES → Use BigQuery skill
   - ❌ NO → Continue to step 2

2. **Is it about a specific product/service with a dedicated skill?**
   - Shopify (orders, products, customers) → Use shopify skill
   - Website analytics (traffic, sessions) → Use google-analytics skill
   - Gmail → Use gmail skill
   - Google Sheets → Use google-sheets skill
   - If YES to any → Use that dedicated skill
   - If NO → Continue to step 3

3. **Does the user say "query the database" or "show me data" without specifying BigQuery?**
   - ✅ YES → Use postgresql skill (default data warehouse)
   - ❌ NO → Continue to step 4

4. **Check if data exists in PostgreSQL schemas**
   - Check `.claude/skills/postgresql/references/schemas/` for relevant tables
   - If data exists in PostgreSQL → Use postgresql skill
   - If data only exists in BigQuery → Use BigQuery skill

**Examples:**

| User Request | Correct Skill | Why |
|--------------|---------------|-----|
| "How many orders last month?" | shopify | Shopify data → use shopify skill |
| "Query BigQuery for orders" | bigquery | Explicitly mentions BigQuery |
| "Show me database orders" | postgresql | Generic "database" → default to postgresql |
| "What's in my analytics_250798412 dataset in BigQuery?" | bigquery | Explicitly mentions BigQuery |
| "Query orders with Gorgias tickets" | postgresql | Cross-source query → postgresql |
| "What's our website bounce rate?" | google-analytics | Website analytics → use google-analytics |
| "Query the shopify_orders table" | postgresql | Generic query → check PostgreSQL first |
| "Query BigQuery's shopify.orders table" | bigquery | Explicitly mentions BigQuery |

## Prerequisites

- Google Cloud Project with BigQuery API enabled
- BigQuery datasets and tables with appropriate permissions
- OAuth 2.0 credentials (shared with other Google skills)
- Environment variables configured in `.env`:
  - `BIGQUERY_PROJECT` - Your BigQuery project ID
  - `GOOGLE_CLIENT_ID` - OAuth client ID
  - `GOOGLE_CLIENT_SECRET` - OAuth client secret
  - `GOOGLE_REFRESH_TOKEN` - OAuth refresh token (auto-saved after auth)

## Setup Instructions

### 1. Enable BigQuery API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "BigQuery API"
5. Click "Enable"

### 2. Set Up Authentication

BigQuery uses the same shared OAuth authentication as other Google skills (Gmail, Analytics, Sheets, Drive).

**Recommended: Use unified authentication**
```bash
./lib/google-auth.ts
```

This grants access to all Google services at once.

See [lib/GOOGLE_AUTH.md](../../../lib/GOOGLE_AUTH.md) for detailed authentication setup.

### 3. Configure Environment Variables

Add to your `.env` file:
```bash
BIGQUERY_PROJECT="your-project-id"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REFRESH_TOKEN="auto-saved-by-auth"
```

## Available Operations

### 1. List Datasets

List all datasets in the configured BigQuery project.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/bigquery/scripts/bq-client.ts list-datasets
```

Returns: Dataset IDs, friendly names, locations, creation times

### 2. List Tables

List all tables in a specific dataset.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/bigquery/scripts/bq-client.ts list-tables <dataset-id>
```

Parameters: `dataset-id` - The BigQuery dataset ID

Returns: Table IDs, types (TABLE, VIEW, EXTERNAL), row counts, sizes

### 3. Get Table Schema

Get the schema for a specific table (columns, types, modes).

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/bigquery/scripts/bq-client.ts get-schema <dataset-id> <table-id>
```

Parameters:
- `dataset-id` - The BigQuery dataset ID
- `table-id` - The BigQuery table ID

Returns: Column names, types, modes (NULLABLE, REQUIRED, REPEATED), descriptions

### 4. Execute Query

Execute a BigQuery SQL query and return results.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/bigquery/scripts/bq-client.ts query "SELECT * FROM \`project.dataset.table\` LIMIT 10"
```

Parameters: `sql` - The BigQuery SQL query to execute

Returns: Query results, row count, bytes processed, execution time

**Note:** BigQuery uses backticks for table references: `` `project.dataset.table` ``

### 5. Scan All Tables

Scan all datasets and tables, save schemas to JSON files in `references/schemas/` directory.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/bigquery/scripts/bq-client.ts scan-all
```

This will:
- List all datasets in the project
- For each dataset, list all tables
- Get schema for each table
- Save schemas to `.claude/skills/google/bigquery/references/schemas/{dataset}_{table}.json`

### 6. Export to Jupyter Notebook

Create a Jupyter notebook with the query and results.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google/bigquery/scripts/bq-client.ts export-notebook <notebook-name> "SELECT query"
```

Parameters:
- `notebook-name` - Name for the notebook file (without .ipynb extension)
- `sql` - The BigQuery SQL query to include

## Natural Language to BigQuery SQL Translation Process

When a user asks a natural language question about BigQuery data, follow this process:

### Step 1: Understand the Question

Extract key information:
- **What data**: What datasets/tables are being queried?
- **What filters**: Time ranges, conditions, specific values
- **What aggregation**: COUNT, SUM, AVG, GROUP BY
- **What output**: Specific columns, calculated fields

### Step 2: Identify Datasets and Tables

Map natural language terms to BigQuery datasets and tables:
- **ALWAYS check cached schemas in `.claude/skills/google/bigquery/references/schemas/` directory FIRST**
- Schema files are named `{dataset}_{table}.json` (e.g., `analytics_events.json`)
- Only run `list-datasets` or `list-tables` if discovering new tables not in cache
- Common mappings depend on your project structure

### Step 3: Get Table Schema from Cache

For identified tables, read their schema from cached files:
- **Read the cached schema file** from `.claude/skills/google/bigquery/references/schemas/{dataset}_{table}.json`
- Cached schemas include:
  - Column names and types
  - Column modes (NULLABLE, REQUIRED, REPEATED)
  - Column descriptions
  - Sample values
- **ONLY run `get-schema` if the cached schema is missing or unclear**

### Step 4: Construct BigQuery SQL Query

Build the SQL query using BigQuery-specific syntax:

**Basic Query Pattern:**
```sql
SELECT
  column1,
  column2,
  COUNT(*) as count
FROM `project.dataset.table`
WHERE DATE(timestamp_column) >= '2024-01-01'
GROUP BY column1, column2
ORDER BY count DESC
LIMIT 100
```

**BigQuery-Specific Features:**

1. **Table References:**
   - Use backticks: `` `project.dataset.table` ``
   - Can omit project if using configured project: `` `dataset.table` ``

2. **Date/Time Functions:**
   - `DATE(timestamp)` - Extract date
   - `TIMESTAMP('2024-01-01')` - Create timestamp
   - `DATE_DIFF(date1, date2, DAY)` - Difference in days
   - `FORMAT_DATE('%Y-%m-%d', date)` - Format date

3. **String Functions:**
   - `CONCAT(str1, str2)` - Concatenate strings
   - `SPLIT(str, delimiter)` - Split to array
   - `REGEXP_CONTAINS(str, pattern)` - Regex match

4. **Array Functions:**
   - `ARRAY_AGG(value)` - Aggregate to array
   - `UNNEST(array)` - Expand array to rows
   - `ARRAY_LENGTH(array)` - Array size

5. **Struct/Nested Fields:**
   - `struct_column.field_name` - Access nested field
   - Structs are common in BigQuery for nested data

6. **Window Functions:**
   ```sql
   ROW_NUMBER() OVER (PARTITION BY column ORDER BY value DESC) as rank
   ```

7. **Approximate Aggregations (for large datasets):**
   - `APPROX_COUNT_DISTINCT(column)` - Approximate distinct count
   - Much faster for very large datasets

### Step 5: Execute Query

- Run the query using `query` command
- BigQuery will return bytes processed (useful for cost estimation)
- If query fails with error, analyze the error message
- Common fixes:
  - Column doesn't exist → Check schema
  - Type mismatch → Add proper casting (`CAST(x AS INT64)`, etc.)
  - Syntax error → Review BigQuery SQL syntax
  - Table not found → Verify project.dataset.table format

### Step 6: Retry on Error

If query fails:
1. Analyze error message carefully
2. Adjust query based on error
3. Re-execute
4. Maximum 2-3 retry attempts

### Step 7: Interpret Results

Once query succeeds:
1. Analyze the returned data
2. Note bytes processed (for cost awareness)
3. Answer the original natural language question
4. Provide context and insights
5. Format results clearly (table, list, or summary)
6. Offer to export to Jupyter notebook if complex analysis

## BigQuery SQL Syntax Tips

### Data Types
- `INT64` - Integer
- `FLOAT64` - Float
- `STRING` - Text
- `BOOL` - Boolean
- `DATE` - Date only
- `TIMESTAMP` - Date and time
- `ARRAY<type>` - Array
- `STRUCT<field1 type1, field2 type2>` - Nested structure
- `GEOGRAPHY` - Geographic data
- `JSON` - JSON data (parsed with JSON functions)

### Common Patterns

**Filter by date range:**
```sql
WHERE DATE(timestamp_column) BETWEEN '2024-01-01' AND '2024-12-31'
```

**Group by date:**
```sql
SELECT DATE(timestamp_column) as date, COUNT(*) as count
FROM `dataset.table`
GROUP BY date
ORDER BY date
```

**Unnest arrays:**
```sql
SELECT item
FROM `dataset.table`,
UNNEST(array_column) as item
```

**Working with nested fields:**
```sql
SELECT
  event.name,
  event.params.value
FROM `dataset.events`
```

**Approximate distinct count (fast for large data):**
```sql
SELECT APPROX_COUNT_DISTINCT(user_id) as unique_users
FROM `dataset.table`
```

### Cost Optimization

BigQuery charges based on bytes processed. To optimize:

1. **Use `LIMIT` for exploration:**
   ```sql
   SELECT * FROM `dataset.table` LIMIT 100
   ```

2. **Select specific columns (not `*`):**
   ```sql
   SELECT column1, column2 FROM `dataset.table`  -- Good
   SELECT * FROM `dataset.table`                  -- Expensive
   ```

3. **Use partitioned tables with partition filters:**
   ```sql
   WHERE DATE(_PARTITIONTIME) = '2024-01-01'  -- Cheap
   WHERE created_at = '2024-01-01'            -- Scans all data
   ```

4. **Preview with `LIMIT` first, then run full query**

## Schema Caching

The `scan-all` command creates JSON schema files in `references/schemas/` directory:
- `references/schemas/dataset1_table1.json` - Schema for dataset1.table1
- `references/schemas/dataset2_table2.json` - Schema for dataset2.table2
- etc.

These files contain:
- Column names and BigQuery types
- Column modes (NULLABLE, REQUIRED, REPEATED)
- Column descriptions (if available)
- Nested field structures for STRUCT/RECORD types
- Array element types

**Always check cached schemas first** before running BigQuery API calls.

## Jupyter Notebook Export

When user requests Jupyter notebook export:
1. Execute the query to verify it works
2. Use `export-notebook` command to create `.ipynb` file
3. Place in `assets/{workflow-name}/` directory
4. Notebook includes:
   - Markdown cell with question and explanation
   - Code cell with BigQuery SQL query
   - Code cell to execute query via BigQuery API
   - Code cell to display results

## Security Notes

- Never expose OAuth credentials in output
- BigQuery queries are charged based on bytes processed - always show this in results
- Use read-only operations when possible
- Be cautious with `DELETE` or `DROP` statements
- Warn before executing expensive queries (scanning large tables without filters)
- Never commit `.env` file with credentials

## Troubleshooting

**"Missing OAuth credentials"**
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
- Run unified auth: `./lib/google-auth.ts`

**"BIGQUERY_PROJECT not set"**
- Add `BIGQUERY_PROJECT=your-project-id` to `.env`
- Project ID found in Google Cloud Console

**"Table not found"**
- Verify table reference format: `` `project.dataset.table` ``
- Run `list-datasets` and `list-tables` to find correct names
- Check if you have access to the dataset/table

**"Access Denied"**
- Ensure BigQuery API is enabled
- Verify OAuth scopes include BigQuery
- Check IAM permissions (need BigQuery Data Viewer at minimum)

**"Query failed" errors**
- Check BigQuery SQL syntax (different from PostgreSQL/MySQL)
- Verify column names in schema
- Check data types and casting
- Review error message for specific issue

**"Quota exceeded"**
- BigQuery has daily query quotas
- Check quota in Google Cloud Console
- Wait for quota reset or request increase

