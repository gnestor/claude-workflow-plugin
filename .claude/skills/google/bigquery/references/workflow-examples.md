# BigQuery Query Workflow Examples

This document provides detailed workflow examples for common BigQuery query patterns and natural language to SQL translation.

## Example 1: Simple Count Query

**User:** "How many events did we have in October 2024?"

**Process:**
1. Identify dataset and table: "events" → `analytics.events`
2. Read cached schema: `.claude/skills/google/bigquery/references/schemas/analytics_events.json`
3. Check for partitioning (likely `_PARTITIONTIME` or timestamp column)
4. Construct query:
```sql
SELECT COUNT(*) as event_count
FROM `analytics.events`
WHERE DATE(event_timestamp) >= '2024-10-01'
  AND DATE(event_timestamp) < '2024-11-01'
```
5. Execute and return result:
```
const count = results.rows[0].event_count;
```
6. Return: "You had 1,245,789 events in October 2024. (Bytes processed: 12.3 MB)"

**Note:** Always mention bytes processed to help user understand query cost.

## Example 2: Using Partitioned Tables

**User:** "Show me today's pageviews"

**Process:**
1. Identify table: `analytics.events`
2. Read cached schema to check if table is partitioned
3. Use partition filter for cost efficiency:
```sql
SELECT COUNT(*) as pageview_count
FROM `analytics.events`
WHERE DATE(_PARTITIONTIME) = CURRENT_DATE()
  AND event_name = 'page_view'
```
4. Execute and return result with cost info

**Note:** Using `_PARTITIONTIME` filter only scans one partition, dramatically reducing cost.

## Example 3: Nested Fields (STRUCT)

**User:** "What are the top user countries from the events table?"

**Process:**
1. Identify table: `analytics.events`
2. Read cached schema: `.claude/skills/google/bigquery/references/schemas/analytics_events.json`
3. Discover `user` is a STRUCT with `country` field
4. Construct query accessing nested field:
```sql
SELECT
  user.country,
  COUNT(*) as event_count
FROM `analytics.events`
WHERE DATE(_PARTITIONTIME) >= '2024-11-01'
  AND DATE(_PARTITIONTIME) <= CURRENT_DATE()
GROUP BY user.country
ORDER BY event_count DESC
LIMIT 10
```
5. Execute and format results as table
6. Return formatted results with bytes processed

**Note:** Access nested fields with dot notation: `struct_column.field_name`

## Example 4: Array Unnesting

**User:** "Show me all product IDs from orders with their quantities"

**Process:**
1. Identify table: `orders.transactions`
2. Read cached schema: discover `items` is an ARRAY of STRUCTs
3. Construct query with UNNEST:
```sql
SELECT
  order_id,
  item.product_id,
  item.quantity,
  item.price
FROM `orders.transactions`,
UNNEST(items) as item
WHERE DATE(order_date) >= '2024-11-01'
LIMIT 1000
```
4. Execute and process results
5. Format as table showing expanded items

**Note:** UNNEST expands arrays into rows, creating one row per array element.

## Example 5: Aggregation with APPROX Functions

**User:** "How many unique users visited our site last month?"

**Process:**
1. Identify table: `analytics.events`
2. Read cached schema
3. For large datasets, use APPROX_COUNT_DISTINCT for better performance:
```sql
SELECT
  DATE(event_timestamp) as date,
  APPROX_COUNT_DISTINCT(user_id) as unique_users
FROM `analytics.events`
WHERE DATE(event_timestamp) >= '2024-10-01'
  AND DATE(event_timestamp) < '2024-11-01'
GROUP BY date
ORDER BY date
```
4. Execute and return daily unique users
5. Note that approximate functions are much faster for large datasets

**Note:** APPROX_COUNT_DISTINCT is significantly faster than COUNT(DISTINCT) on large datasets with minimal accuracy tradeoff.

## Example 6: Window Functions for Rankings

**User:** "What are the top 5 products by revenue in each category?"

**Process:**
1. Identify table: `products.sales`
2. Read cached schema
3. Use window function with QUALIFY:
```sql
SELECT
  category,
  product_name,
  revenue,
  RANK() OVER (PARTITION BY category ORDER BY revenue DESC) as rank_in_category
FROM (
  SELECT
    category,
    product_name,
    SUM(sale_amount) as revenue
  FROM `products.sales`
  WHERE DATE(sale_date) >= '2024-01-01'
  GROUP BY category, product_name
)
QUALIFY rank_in_category <= 5
ORDER BY category, rank_in_category
```
4. Execute and format results grouped by category

**Note:** QUALIFY clause filters results of window functions, unique to BigQuery.

## Example 7: Date Range with Relative Dates

**User:** "Show me sales for the last 7 days"

**Process:**
1. Identify table: `sales.transactions`
2. Read cached schema
3. Use DATE_SUB for relative dates:
```sql
SELECT
  DATE(transaction_date) as date,
  COUNT(*) as transaction_count,
  SUM(amount) as total_sales
FROM `sales.transactions`
WHERE DATE(transaction_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND DATE(transaction_date) <= CURRENT_DATE()
GROUP BY date
ORDER BY date
```
4. Execute and return daily breakdown

**Note:** BigQuery date functions: DATE_SUB, DATE_ADD, CURRENT_DATE(), CURRENT_TIMESTAMP()

## Example 8: Complex Filtering with STRUCT Arrays

**User:** "Find orders where at least one item was over $100"

**Process:**
1. Identify table: `orders.transactions`
2. Read cached schema: `items` is ARRAY of STRUCT containing `price`
3. Use EXISTS with UNNEST:
```sql
SELECT
  order_id,
  customer_id,
  order_total
FROM `orders.transactions`
WHERE EXISTS (
  SELECT 1
  FROM UNNEST(items) as item
  WHERE item.price > 100
)
AND DATE(order_date) >= '2024-01-01'
LIMIT 1000
```
4. Execute and return matching orders

**Note:** EXISTS with UNNEST is efficient for filtering based on array element conditions.

## Example 9: JSON Parsing

**User:** "Extract the page title from the JSON event params"

**Process:**
1. Identify table with JSON column
2. Read cached schema
3. Use JSON functions:
```sql
SELECT
  event_id,
  JSON_EXTRACT_SCALAR(event_params, '$.page_title') as page_title,
  JSON_EXTRACT_SCALAR(event_params, '$.page_url') as page_url
FROM `analytics.raw_events`
WHERE DATE(_PARTITIONTIME) = CURRENT_DATE()
LIMIT 100
```
4. Execute and return parsed values

**Note:** JSON_EXTRACT returns JSON, JSON_EXTRACT_SCALAR returns string.

## Example 10: Query with Error Recovery

**User:** "Show me revenue by product category"

**Process:**
1. Identify table: `sales.transactions`
2. Read cached schema first
3. Initial query attempt:
```sql
SELECT
  product_category,
  SUM(amount) as revenue
FROM `sales.transactions`
GROUP BY product_category
```
4. If error: "Column 'product_category' not found"
5. Check schema - discover it's nested in `product` STRUCT
6. Corrected query:
```sql
SELECT
  product.category as product_category,
  SUM(amount) as revenue
FROM `sales.transactions`
WHERE DATE(_PARTITIONTIME) >= '2024-01-01'
GROUP BY product.category
ORDER BY revenue DESC
```
7. Execute and return results

**Note:** Checking cached schema FIRST prevents this error entirely.

## Example 11: Cost-Conscious Exploration

**User:** "I want to explore the structure of the events table"

**Process:**
1. First, check cached schema file
2. If schema is cached, show structure without query
3. If exploration needed, use LIMIT with column selection:
```sql
SELECT *
FROM `analytics.events`
WHERE DATE(_PARTITIONTIME) = CURRENT_DATE()
LIMIT 10
```
4. Execute and show sample data
5. Explain: "Scanned only today's partition (minimal cost)"

**Note:** Always use LIMIT and partition filters when exploring large tables.

## Example 12: Cross-Dataset Join

**User:** "Show me website events from users who made a purchase"

**Process:**
1. Identify tables: `analytics.events` and `sales.customers`
2. Read both cached schemas
3. Identify join key (likely `user_id`)
4. Construct join query:
```sql
SELECT
  e.user_id,
  e.event_name,
  e.event_timestamp,
  c.total_purchases
FROM `analytics.events` e
INNER JOIN (
  SELECT
    user_id,
    COUNT(*) as total_purchases
  FROM `sales.transactions`
  WHERE DATE(transaction_date) >= '2024-01-01'
  GROUP BY user_id
) c ON e.user_id = c.user_id
WHERE DATE(e._PARTITIONTIME) >= '2024-11-01'
  AND e.event_name = 'page_view'
LIMIT 10000
```
5. Execute and return results
6. Note bytes processed from both tables

**Note:** Pre-aggregate smaller datasets before joining to reduce bytes processed.

## Key Principles

1. **Check cached schemas FIRST** - Located in `.claude/skills/google/bigquery/references/schemas/`
2. **Always use partition filters** - `DATE(_PARTITIONTIME) =` reduces cost dramatically
3. **Select specific columns** - Avoid `SELECT *` on large tables except for exploration with LIMIT
4. **Use APPROX functions** - APPROX_COUNT_DISTINCT is much faster for large datasets
5. **Always return bytes processed** - Help users understand query cost
6. **Use LIMIT for exploration** - Prevent expensive full table scans
7. **Access nested fields** - Use dot notation for STRUCTs: `struct.field`
8. **Unnest arrays** - Use UNNEST to expand arrays into rows
9. **Backticks for table names** - `` `project.dataset.table` `` or `` `dataset.table` ``
10. **Cost awareness** - Always mention bytes processed in results

## Query Pattern Template

```sql
-- Standard query pattern
SELECT
  [columns or aggregations]
FROM `[dataset].[table]`
WHERE DATE(_PARTITIONTIME) = '[date]'  -- Use partition filter when possible
  AND [other conditions]
GROUP BY [columns]
ORDER BY [columns]
LIMIT [reasonable limit for exploration]
```

## Common Pitfalls to Avoid

1. ❌ Scanning entire table: `SELECT * FROM table` (on large tables)
2. ❌ No partition filter: Missing `WHERE DATE(_PARTITIONTIME)`
3. ❌ Wrong table reference: `table` instead of `` `dataset.table` ``
4. ❌ Forgetting to unnest: Trying to query array elements directly
5. ❌ Wrong nested field syntax: `struct['field']` instead of `struct.field`
6. ❌ Not checking schema first: Wasting queries on errors

## Best Practices Checklist

Before executing any query:
- ✅ Check cached schema in `references/schemas/`
- ✅ Verify table is partitioned and use partition filter
- ✅ Select only needed columns (not `*`)
- ✅ Use LIMIT for exploration queries
- ✅ Consider APPROX functions for large aggregations
- ✅ Include bytes processed in response
- ✅ Use backticks for table references
