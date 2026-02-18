---
name: google-bigquery
description: Google BigQuery data warehouse querying and analysis. Use ONLY when the user explicitly mentions "BigQuery" or "BQ", OR when the question requires data that doesn't exist in PostgreSQL schemas. For general database queries use the postgresql skill (default data warehouse). This is a secondary data warehouse.
---

# Google BigQuery Integration

## Purpose

This skill enables direct interaction with Google BigQuery data warehouse. It translates natural language questions into BigQuery SQL queries, executes them, and interprets the results. Supports schema scanning and caching for efficient query generation.

**Use this skill ONLY for explicit BigQuery requests or when data doesn't exist in PostgreSQL.**

## Authentication

Authentication is handled by the MCP server. All BigQuery API access is managed through the server's OAuth credentials.

## When to Use

Activate this skill **ONLY** when:
- User **explicitly mentions "BigQuery"** or "BQ": "Query BigQuery for...", "What's in my BigQuery project?"
- Data is **only available in BigQuery** and not in PostgreSQL schemas
- User requests BigQuery-specific features: partitioned tables, approximate functions (APPROX_COUNT_DISTINCT)
- User wants to export BigQuery query results to Jupyter notebook
- User needs to scan and cache BigQuery table schemas

## When NOT to Use

**ALWAYS defer to these tools first:**

- **Shopify data**: Use shopify skill for orders, products, customers, inventory
- **Website behavior**: Use google-analytics skill for traffic, page views, sessions
- **General database queries**: Use postgresql skill as the default data warehouse
- **Cross-source queries**: Use postgresql skill for joining data from multiple sources
- **Unclear source**: If the user doesn't specify BigQuery, default to postgresql skill

**Key principle:** BigQuery is a **secondary data warehouse**. Only use it when explicitly requested or when PostgreSQL doesn't have the required data.

## Routing Decision Tree

1. **Does the question mention "BigQuery" or "BQ" explicitly?**
   - YES -> Use BigQuery skill
   - NO -> Continue to step 2

2. **Is it about a specific product/service with a dedicated skill?**
   - Shopify, Analytics, Gmail, Sheets -> Use that dedicated skill
   - If NO -> Continue to step 3

3. **Does the user say "query the database" without specifying BigQuery?**
   - YES -> Use postgresql skill (default data warehouse)
   - NO -> Continue to step 4

4. **Check if data exists in PostgreSQL schemas**
   - If data exists in PostgreSQL -> Use postgresql skill
   - If data only exists in BigQuery -> Use BigQuery skill

## Available Operations

Use `~~database` tools (BigQuery category) for all BigQuery operations.

### List Datasets
List all datasets in the configured BigQuery project.

Returns: Dataset IDs, friendly names, locations, creation times

### List Tables
List all tables in a specific dataset.

Returns: Table IDs, types (TABLE, VIEW, EXTERNAL), row counts, sizes

### Get Table Schema
Get the schema for a specific table (columns, types, modes).

Returns: Column names, types, modes (NULLABLE, REQUIRED, REPEATED), descriptions

### Execute Query
Execute a BigQuery SQL query and return results.

Returns: Query results, row count, bytes processed, execution time

**Note:** BigQuery uses backticks for table references: `` `project.dataset.table` ``

### Scan All Tables
Scan all datasets and tables, save schemas to JSON files in `references/schemas/` directory.

### Export to Jupyter Notebook
Create a Jupyter notebook with the query and results.

## Natural Language to BigQuery SQL Translation

### Step 1: Understand the Question
Extract: What data, what filters, what aggregation, what output

### Step 2: Identify Datasets and Tables
- **ALWAYS check cached schemas in `references/schemas/` directory FIRST**
- Schema files are named `{dataset}_{table}.json`
- Only run list datasets or list tables if discovering new tables not in cache

### Step 3: Get Table Schema from Cache
Read cached schema files. ONLY run get schema if the cached schema is missing.

### Step 4: Construct BigQuery SQL Query

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

1. **Table References:** Use backticks: `` `project.dataset.table` ``
2. **Date/Time Functions:** `DATE()`, `TIMESTAMP()`, `DATE_DIFF()`, `FORMAT_DATE()`
3. **String Functions:** `CONCAT()`, `SPLIT()`, `REGEXP_CONTAINS()`
4. **Array Functions:** `ARRAY_AGG()`, `UNNEST()`, `ARRAY_LENGTH()`
5. **Struct/Nested Fields:** `struct_column.field_name`
6. **Window Functions:** `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)`
7. **Approximate Aggregations:** `APPROX_COUNT_DISTINCT()` for large datasets

### Step 5: Execute and Interpret
- Note bytes processed for cost estimation
- Retry on error (max 2-3 attempts)
- Offer to export to Jupyter notebook if complex analysis

## BigQuery SQL Syntax Tips

### Data Types
- `INT64`, `FLOAT64`, `STRING`, `BOOL`, `DATE`, `TIMESTAMP`
- `ARRAY<type>`, `STRUCT<field1 type1, field2 type2>`
- `GEOGRAPHY`, `JSON`

### Cost Optimization

1. **Use `LIMIT` for exploration**
2. **Select specific columns (not `*`)**
3. **Use partitioned tables with partition filters:**
   ```sql
   WHERE DATE(_PARTITIONTIME) = '2024-01-01'  -- Cheap
   ```
4. **Preview with `LIMIT` first, then run full query**

## Reference Files

Detailed information available in `references/` directory:

- **README.md** - Overview of reference materials and quick reference
- **queries.md** - Example BigQuery SQL queries for common tasks
- **workflow-examples.md** - Step-by-step workflow examples for natural language to SQL translation
- **schemas/** - Cached BigQuery table schemas in JSON format

## Troubleshooting

**"Missing credentials"**
- Verify the MCP server connection is active

**"Table not found"**
- Verify table reference format: `` `project.dataset.table` ``
- Run list datasets and list tables to find correct names

**"Access Denied"**
- Ensure BigQuery API is enabled
- Verify OAuth scopes include BigQuery
- Check IAM permissions (need BigQuery Data Viewer at minimum)

**"Query failed"**
- Check BigQuery SQL syntax (different from PostgreSQL/MySQL)
- Verify column names in schema
- Check data types and casting

**"Quota exceeded"**
- BigQuery has daily query quotas
- Check quota in Google Cloud Console

## Security Notes

- BigQuery queries are charged based on bytes processed - always show this in results
- Use read-only operations when possible
- Be cautious with `DELETE` or `DROP` statements
- Warn before executing expensive queries (scanning large tables without filters)
