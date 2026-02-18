# BigQuery SQL Query Examples

This document contains example BigQuery SQL queries for common analytics and data warehouse tasks.

## Basic Queries

### Select all from a table
```sql
SELECT *
FROM `project.dataset.table`
LIMIT 100
```

### Select specific columns
```sql
SELECT
  customer_id,
  order_date,
  total_amount
FROM `project.dataset.orders`
WHERE DATE(order_date) >= '2024-01-01'
LIMIT 1000
```

### Count records
```sql
SELECT COUNT(*) as total_count
FROM `project.dataset.table`
```

## Aggregations

### Group by with counts
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM(total_price) as revenue
FROM `project.dataset.orders`
WHERE DATE(created_at) >= '2024-01-01'
GROUP BY date
ORDER BY date DESC
```

### Multiple aggregations
```sql
SELECT
  product_category,
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(*) as total_orders,
  AVG(order_value) as avg_order_value,
  SUM(order_value) as total_revenue
FROM `project.dataset.orders`
GROUP BY product_category
ORDER BY total_revenue DESC
```

### Approximate distinct count (faster for large datasets)
```sql
SELECT
  DATE(timestamp) as date,
  APPROX_COUNT_DISTINCT(user_id) as unique_users,
  COUNT(*) as total_events
FROM `project.dataset.events`
WHERE DATE(timestamp) >= '2024-01-01'
GROUP BY date
ORDER BY date
```

## Date and Time Functions

### Extract date parts
```sql
SELECT
  DATE(timestamp) as date,
  EXTRACT(YEAR FROM timestamp) as year,
  EXTRACT(MONTH FROM timestamp) as month,
  EXTRACT(DAY FROM timestamp) as day,
  EXTRACT(HOUR FROM timestamp) as hour,
  EXTRACT(DAYOFWEEK FROM timestamp) as day_of_week
FROM `project.dataset.events`
LIMIT 100
```

### Date filtering
```sql
SELECT *
FROM `project.dataset.orders`
WHERE DATE(created_at) BETWEEN '2024-01-01' AND '2024-12-31'
  AND EXTRACT(DAYOFWEEK FROM created_at) NOT IN (1, 7)  -- Exclude weekends
```

### Date formatting
```sql
SELECT
  FORMAT_DATE('%Y-%m-%d', date_column) as formatted_date,
  FORMAT_DATE('%B %d, %Y', date_column) as readable_date
FROM `project.dataset.table`
```

### Date difference
```sql
SELECT
  order_id,
  order_date,
  ship_date,
  DATE_DIFF(ship_date, order_date, DAY) as days_to_ship
FROM `project.dataset.orders`
WHERE ship_date IS NOT NULL
```

## String Functions

### Concatenation
```sql
SELECT
  CONCAT(first_name, ' ', last_name) as full_name,
  CONCAT(address, ', ', city, ', ', state) as full_address
FROM `project.dataset.customers`
```

### String splitting
```sql
SELECT
  email,
  SPLIT(email, '@')[OFFSET(0)] as username,
  SPLIT(email, '@')[OFFSET(1)] as domain
FROM `project.dataset.users`
```

### Pattern matching
```sql
SELECT *
FROM `project.dataset.products`
WHERE REGEXP_CONTAINS(name, r'(?i)shirt|tee|top')  -- Case insensitive
```

## Array Operations

### Unnest arrays
```sql
SELECT
  order_id,
  item.product_id,
  item.quantity,
  item.price
FROM `project.dataset.orders`,
UNNEST(items) as item
WHERE order_id = 'ORDER123'
```

### Array aggregation
```sql
SELECT
  customer_id,
  ARRAY_AGG(order_id) as order_ids,
  ARRAY_AGG(DISTINCT product_category) as categories_purchased
FROM `project.dataset.orders`
GROUP BY customer_id
```

### Array length
```sql
SELECT
  order_id,
  ARRAY_LENGTH(items) as item_count
FROM `project.dataset.orders`
WHERE ARRAY_LENGTH(items) > 5
```

## Nested Fields (Structs)

### Access nested fields
```sql
SELECT
  event_name,
  event_params.page_location,
  event_params.value,
  user_properties.user_id
FROM `project.dataset.analytics_events`
WHERE DATE(_PARTITIONTIME) = '2024-01-01'
```

### Unnest nested arrays
```sql
SELECT
  user_id,
  event_name,
  param.key,
  param.value
FROM `project.dataset.events`,
UNNEST(event_params) as param
WHERE param.key = 'page_title'
```

## Joins

### Inner join
```sql
SELECT
  o.order_id,
  o.order_date,
  c.customer_name,
  c.email
FROM `project.dataset.orders` o
INNER JOIN `project.dataset.customers` c
  ON o.customer_id = c.customer_id
WHERE DATE(o.order_date) >= '2024-01-01'
```

### Left join
```sql
SELECT
  c.customer_id,
  c.customer_name,
  COUNT(o.order_id) as order_count,
  COALESCE(SUM(o.total_amount), 0) as total_spent
FROM `project.dataset.customers` c
LEFT JOIN `project.dataset.orders` o
  ON c.customer_id = o.customer_id
  AND DATE(o.order_date) >= '2024-01-01'
GROUP BY c.customer_id, c.customer_name
```

## Window Functions

### Row numbers
```sql
SELECT
  customer_id,
  order_date,
  total_amount,
  ROW_NUMBER() OVER (
    PARTITION BY customer_id
    ORDER BY order_date
  ) as order_sequence
FROM `project.dataset.orders`
```

### Running totals
```sql
SELECT
  DATE(order_date) as date,
  total_amount,
  SUM(total_amount) OVER (
    ORDER BY DATE(order_date)
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM `project.dataset.orders`
ORDER BY date
```

### Rank and percentile
```sql
SELECT
  product_id,
  revenue,
  RANK() OVER (ORDER BY revenue DESC) as revenue_rank,
  PERCENT_RANK() OVER (ORDER BY revenue) as revenue_percentile
FROM (
  SELECT
    product_id,
    SUM(total_amount) as revenue
  FROM `project.dataset.orders`
  GROUP BY product_id
)
```

## Partitioned Tables

### Query specific partition
```sql
SELECT *
FROM `project.dataset.partitioned_table`
WHERE DATE(_PARTITIONTIME) = '2024-01-01'
```

### Query partition range
```sql
SELECT *
FROM `project.dataset.partitioned_table`
WHERE DATE(_PARTITIONTIME) BETWEEN '2024-01-01' AND '2024-01-31'
```

## Common Patterns

### Deduplication
```sql
SELECT * EXCEPT(row_num)
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY unique_id
      ORDER BY updated_at DESC
    ) as row_num
  FROM `project.dataset.table`
)
WHERE row_num = 1
```

### Pivot data
```sql
SELECT
  date,
  COUNTIF(status = 'completed') as completed,
  COUNTIF(status = 'pending') as pending,
  COUNTIF(status = 'cancelled') as cancelled
FROM `project.dataset.orders`
GROUP BY date
```

### Cohort analysis
```sql
WITH first_purchase AS (
  SELECT
    customer_id,
    MIN(DATE(order_date)) as cohort_date
  FROM `project.dataset.orders`
  GROUP BY customer_id
)

SELECT
  fp.cohort_date,
  DATE_DIFF(DATE(o.order_date), fp.cohort_date, MONTH) as months_since_first,
  COUNT(DISTINCT o.customer_id) as customers,
  SUM(o.total_amount) as revenue
FROM `project.dataset.orders` o
JOIN first_purchase fp
  ON o.customer_id = fp.customer_id
GROUP BY cohort_date, months_since_first
ORDER BY cohort_date, months_since_first
```

### Top N per group
```sql
SELECT *
FROM (
  SELECT
    category,
    product_name,
    sales,
    ROW_NUMBER() OVER (
      PARTITION BY category
      ORDER BY sales DESC
    ) as rank
  FROM `project.dataset.products`
)
WHERE rank <= 5
```

## Cost Optimization

### Select only needed columns
```sql
-- Bad (scans all data)
SELECT * FROM `project.dataset.large_table`

-- Good (only scans needed columns)
SELECT customer_id, order_date, total
FROM `project.dataset.large_table`
```

### Use partition filters
```sql
-- Bad (scans all partitions)
SELECT * FROM `project.dataset.table`
WHERE order_date = '2024-01-01'

-- Good (only scans one partition)
SELECT * FROM `project.dataset.table`
WHERE DATE(_PARTITIONTIME) = '2024-01-01'
```

## Advanced Analytics

### Percentile calculation
```sql
SELECT
  APPROX_QUANTILES(order_value, 100)[OFFSET(50)] as median,
  APPROX_QUANTILES(order_value, 100)[OFFSET(25)] as p25,
  APPROX_QUANTILES(order_value, 100)[OFFSET(75)] as p75,
  APPROX_QUANTILES(order_value, 100)[OFFSET(95)] as p95
FROM `project.dataset.orders`
```

### Moving average
```sql
SELECT
  date,
  revenue,
  AVG(revenue) OVER (
    ORDER BY date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_7day
FROM (
  SELECT
    DATE(order_date) as date,
    SUM(total_amount) as revenue
  FROM `project.dataset.orders`
  GROUP BY date
)
ORDER BY date
```

### Year-over-year comparison
```sql
SELECT
  EXTRACT(MONTH FROM order_date) as month,
  EXTRACT(YEAR FROM order_date) as year,
  SUM(total_amount) as revenue,
  LAG(SUM(total_amount)) OVER (
    PARTITION BY EXTRACT(MONTH FROM order_date)
    ORDER BY EXTRACT(YEAR FROM order_date)
  ) as prev_year_revenue
FROM `project.dataset.orders`
GROUP BY month, year
ORDER BY month, year
```
