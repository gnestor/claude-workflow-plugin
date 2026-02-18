# BigQuery Query Workflow Examples

Detailed workflow examples for common BigQuery query patterns and natural language to SQL translation.

## Example 1: Simple Count Query

**User:** "How many events did we have in October 2024?"

**Process:**
1. Identify dataset and table: "events" -> `analytics.events`
2. Read cached schema from `references/schemas/`
3. Check for partitioning
4. Construct query:
```sql
SELECT COUNT(*) as event_count
FROM `analytics.events`
WHERE DATE(event_timestamp) >= '2024-10-01'
  AND DATE(event_timestamp) < '2024-11-01'
```
5. Execute and return result with bytes processed

## Example 2: Using Partitioned Tables

**User:** "Show me today's pageviews"

**Process:**
1. Identify table: `analytics.events`
2. Use partition filter for cost efficiency:
```sql
SELECT COUNT(*) as pageview_count
FROM `analytics.events`
WHERE DATE(_PARTITIONTIME) = CURRENT_DATE()
  AND event_name = 'page_view'
```

**Note:** Using `_PARTITIONTIME` filter only scans one partition, dramatically reducing cost.

## Example 3: Nested Fields (STRUCT)

**User:** "What are the top user countries from the events table?"

**Process:**
1. Read cached schema, discover `user` is a STRUCT with `country` field
2. Access nested field with dot notation:
```sql
SELECT
  user.country,
  COUNT(*) as event_count
FROM `analytics.events`
WHERE DATE(_PARTITIONTIME) >= '2024-11-01'
GROUP BY user.country
ORDER BY event_count DESC
LIMIT 10
```

## Example 4: Array Unnesting

**User:** "Show me all product IDs from orders with their quantities"

**Process:**
1. Read cached schema: discover `items` is an ARRAY of STRUCTs
2. Construct query with UNNEST:
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

## Example 5: Aggregation with APPROX Functions

**User:** "How many unique users visited our site last month?"

**Process:**
1. Use APPROX_COUNT_DISTINCT for better performance on large datasets:
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

## Example 6: Window Functions for Rankings

**User:** "What are the top 5 products by revenue in each category?"

**Process:**
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

**Note:** QUALIFY clause filters results of window functions, unique to BigQuery.

## Example 7: Date Range with Relative Dates

**User:** "Show me sales for the last 7 days"

**Process:**
```sql
SELECT
  DATE(transaction_date) as date,
  COUNT(*) as transaction_count,
  SUM(amount) as total_sales
FROM `sales.transactions`
WHERE DATE(transaction_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY date
ORDER BY date
```

## Example 8: Complex Filtering with STRUCT Arrays

**User:** "Find orders where at least one item was over $100"

**Process:**
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

## Example 9: JSON Parsing

**User:** "Extract the page title from the JSON event params"

**Process:**
```sql
SELECT
  event_id,
  JSON_EXTRACT_SCALAR(event_params, '$.page_title') as page_title,
  JSON_EXTRACT_SCALAR(event_params, '$.page_url') as page_url
FROM `analytics.raw_events`
WHERE DATE(_PARTITIONTIME) = CURRENT_DATE()
LIMIT 100
```

## Example 10: Query with Error Recovery

**User:** "Show me revenue by product category"

**Process:**
1. Initial query attempt may fail if column name is wrong
2. Check schema - discover it's nested in `product` STRUCT
3. Corrected query:
```sql
SELECT
  product.category as product_category,
  SUM(amount) as revenue
FROM `sales.transactions`
WHERE DATE(_PARTITIONTIME) >= '2024-01-01'
GROUP BY product.category
ORDER BY revenue DESC
```

**Note:** Checking cached schema FIRST prevents this error entirely.

## Key Principles

1. **Check cached schemas FIRST** - Located in `references/schemas/`
2. **Always use partition filters** - Reduces cost dramatically
3. **Select specific columns** - Avoid `SELECT *` on large tables
4. **Use APPROX functions** - Much faster for large datasets
5. **Always return bytes processed** - Help users understand query cost
6. **Use LIMIT for exploration** - Prevent expensive full table scans
7. **Access nested fields** - Use dot notation for STRUCTs
8. **Unnest arrays** - Use UNNEST to expand arrays into rows
9. **Backticks for table names** - `` `project.dataset.table` ``
10. **Cost awareness** - Always mention bytes processed in results

## Common Pitfalls to Avoid

1. Scanning entire table without LIMIT on large tables
2. No partition filter: Missing `WHERE DATE(_PARTITIONTIME)`
3. Wrong table reference: missing backticks
4. Forgetting to unnest: Trying to query array elements directly
5. Wrong nested field syntax: `struct['field']` instead of `struct.field`
6. Not checking schema first: Wasting queries on errors
