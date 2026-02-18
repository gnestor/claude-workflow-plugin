# BigQuery Skill Reference Documentation

This directory contains reference materials for the BigQuery skill.

## Contents

### [queries.md](queries.md)
Collection of example BigQuery SQL queries covering:
- Basic queries (SELECT, WHERE, COUNT)
- Aggregations (GROUP BY, SUM, AVG)
- Date and time functions
- String operations
- Array operations (UNNEST, ARRAY_AGG)
- Nested fields (STRUCT access)
- Joins
- Window functions
- Partitioned table queries
- Common patterns (deduplication, pivots, cohort analysis)
- Cost optimization techniques
- Advanced analytics (percentiles, moving averages, YoY comparisons)

### [workflow-examples.md](workflow-examples.md)
Step-by-step workflow examples for translating natural language questions to BigQuery SQL:
- Simple count queries
- Using partitioned tables efficiently
- Accessing nested STRUCT fields
- Unnesting arrays
- Approximate aggregations for performance
- Window functions and rankings
- Date range queries with relative dates
- Complex filtering with STRUCT arrays
- JSON parsing
- Query error recovery
- Cost-conscious exploration
- Cross-dataset joins
- Key principles and best practices
- Common pitfalls to avoid

### schemas/
Directory containing cached BigQuery table schemas in JSON format.

**Naming convention:** `{dataset}_{table}.json`

**Schema contents:**
- Column names and BigQuery data types
- Column modes (NULLABLE, REQUIRED, REPEATED)
- Column descriptions (if available in BigQuery)
- Nested field structures for STRUCT/RECORD types
- Array element types for ARRAY columns
- Table metadata (row count, size, creation time)

**Usage:**
Always check cached schemas before running queries. This:
- Prevents errors from incorrect column names
- Avoids unnecessary API calls
- Helps construct efficient queries
- Shows nested field structures for complex types

## Quick Reference

### BigQuery-Specific SQL Features

**Table References:**
```sql
`project.dataset.table`  -- Full reference
`dataset.table`          -- Using configured project
```

**Partition Filters (CRITICAL for cost):**
```sql
WHERE DATE(_PARTITIONTIME) = '2024-11-06'
```

**Nested Field Access:**
```sql
SELECT struct_column.field_name
FROM `dataset.table`
```

**Array Unnesting:**
```sql
SELECT item
FROM `dataset.table`,
UNNEST(array_column) as item
```

**Approximate Functions (faster):**
```sql
APPROX_COUNT_DISTINCT(user_id)
```

**JSON Extraction:**
```sql
JSON_EXTRACT_SCALAR(json_column, '$.field')
```

## Best Practices

1. **Always check cached schemas first** before constructing queries
2. **Use partition filters** to reduce bytes processed and cost
3. **Select specific columns** instead of `SELECT *` on large tables
4. **Use LIMIT** for exploration queries
5. **Use APPROX functions** for large aggregations when exact counts aren't critical
6. **Include bytes processed** in all query responses to help users understand cost
7. **Use backticks** for all table references
8. **Understand nested structures** before querying STRUCT/ARRAY columns

## Additional Resources

- [BigQuery SQL Reference](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax)
- [BigQuery Data Types](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types)
- [BigQuery Functions](https://cloud.google.com/bigquery/docs/reference/standard-sql/functions-and-operators)
- [BigQuery Best Practices](https://cloud.google.com/bigquery/docs/best-practices-performance-overview)
- [BigQuery Pricing](https://cloud.google.com/bigquery/pricing)
