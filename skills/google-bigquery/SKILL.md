---
name: google-bigquery
description: "Google BigQuery data warehouse querying and analysis. Use ONLY when the user explicitly mentions 'BigQuery' or 'BQ', OR when the question requires data that doesn't exist in PostgreSQL schemas. For general database queries use the postgresql skill (default data warehouse). This is a secondary data warehouse."
category: ~~data-warehouse
service: google-bigquery
---

# Google BigQuery

## Purpose

Direct interaction with Google BigQuery data warehouse. Translates natural language questions into BigQuery SQL queries, executes them, and interprets the results. Supports schema scanning and caching for efficient query generation. Authentication is handled automatically by `lib/auth.js` using shared Google OAuth credentials.

**Use this skill ONLY for explicit BigQuery requests or when data doesn't exist in PostgreSQL.**

## When to Use

Activate this skill **ONLY** when:
- User **explicitly mentions "BigQuery"** or "BQ"
- Data is **only available in BigQuery** and not in PostgreSQL schemas
- User requests BigQuery-specific features: partitioned tables, approximate functions
- User wants to scan and cache BigQuery table schemas

## When NOT to Use

**ALWAYS defer to these tools first:**
- **Shopify data**: Use shopify skill
- **Website behavior**: Use google-analytics skill
- **General database queries**: Use postgresql skill (default data warehouse)
- **Cross-source queries**: Use postgresql skill
- **Unclear source**: Default to postgresql skill

### Routing Decision Tree

1. **Does the question mention "BigQuery" or "BQ" explicitly?** YES -> Use BigQuery. NO -> Step 2.
2. **Is it about a specific product/service with a dedicated skill?** YES -> Use that skill. NO -> Step 3.
3. **Does the user say "query the database" without specifying BigQuery?** YES -> Use postgresql. NO -> Step 4.
4. **Check if data exists in PostgreSQL schemas.** If yes -> postgresql. If only in BigQuery -> BigQuery.

## Client Script

**Path:** `skills/google-bigquery/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `list-datasets` | List all datasets in the configured project |
| `list-tables --dataset <name>` | List tables in a dataset |
| `get-schema --dataset <name> --table <name>` | Get table schema (columns, types, modes) |
| `query <SQL string>` | Execute a BigQuery SQL query. Optional: `--limit` |
| `scan-all-schemas` | Scan all datasets/tables, cache schemas to `references/schemas/` |

## Key API Concepts

**BigQuery SQL** with backtick table references (`` `project.dataset.table` ``). Charged per bytes processed.

### BigQuery-Specific SQL Features

1. **Table References:** Use backticks: `` `project.dataset.table` ``
2. **Date/Time Functions:** `DATE()`, `TIMESTAMP()`, `DATE_DIFF()`, `FORMAT_DATE()`
3. **String Functions:** `CONCAT()`, `SPLIT()`, `REGEXP_CONTAINS()`
4. **Array Functions:** `ARRAY_AGG()`, `UNNEST()`, `ARRAY_LENGTH()`
5. **Struct/Nested Fields:** `struct_column.field_name`
6. **Window Functions:** `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)`
7. **Approximate Aggregations:** `APPROX_COUNT_DISTINCT()` for large datasets

### Cost Optimization

1. **Use `LIMIT` for exploration** — avoid scanning entire tables
2. **Select specific columns** — never use `SELECT *` on large tables
3. **Use partition filters:**
   ```sql
   WHERE DATE(_PARTITIONTIME) = '2024-01-01'
   ```
4. **Preview with `LIMIT` first**, then run full query

### Schema Caching

- **ALWAYS check cached schemas in `references/schemas/` FIRST**
- Schema files are named `{dataset}_{table}.json`
- Only run `list-datasets` or `list-tables` if discovering new tables not in cache

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('google-bigquery', '/bigquery/v2/projects/myproject/queries');
```

## Reference Files
- [README.md](references/README.md) — Overview of reference materials and quick reference
- [queries.md](references/queries.md) — Example BigQuery SQL queries for common tasks
- [workflow-examples.md](references/workflow-examples.md) — Step-by-step workflow examples for natural language to SQL translation
