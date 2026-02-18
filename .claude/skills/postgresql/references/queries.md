# PostgreSQL Query Examples

Common query patterns for document store tables with JSON/JSONB columns.

## Simple Queries

### Count Records

```sql
SELECT COUNT(*) as total_orders
FROM shopify_orders;
```

### Recent Records

```sql
SELECT *
FROM shopify_orders
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;
```

## JSON Field Access

### Simple JSON Fields

```sql
SELECT
  id,
  data->>'order_number' as order_number,
  data->>'customer_email' as customer_email,
  (data->>'total_price')::numeric as total_price,
  data->>'financial_status' as status
FROM shopify_orders
WHERE data->>'financial_status' = 'paid';
```

### Nested JSON Fields

```sql
SELECT
  id,
  data->'customer'->>'first_name' as first_name,
  data->'customer'->>'last_name' as last_name,
  data->'billing_address'->>'city' as city
FROM shopify_orders;
```

## JSON Array Queries

### Expand Array to Rows

```sql
SELECT
  o.id as order_id,
  o.data->>'order_number' as order_number,
  line_item->>'product_id' as product_id,
  line_item->>'name' as product_name,
  (line_item->>'quantity')::integer as quantity,
  (line_item->>'price')::numeric as price
FROM shopify_orders o,
     jsonb_array_elements(o.data->'line_items') as line_item
WHERE o.created_at >= '2024-10-01';
```

### Array Length

```sql
SELECT
  id,
  data->>'order_number' as order_number,
  jsonb_array_length(data->'line_items') as item_count
FROM shopify_orders;
```

### Filter by Array Contents

```sql
-- Orders containing specific product
SELECT id, data->>'order_number'
FROM shopify_orders
WHERE data->'line_items' @> '[{"product_id": "12345"}]'::jsonb;
```

## Aggregations

### Sum and Average

```sql
SELECT
  COUNT(*) as order_count,
  SUM((data->>'total_price')::numeric) as total_revenue,
  AVG((data->>'total_price')::numeric) as avg_order_value
FROM shopify_orders
WHERE created_at >= '2024-10-01'
  AND data->>'financial_status' = 'paid';
```

### Group By JSON Field

```sql
SELECT
  data->>'financial_status' as status,
  COUNT(*) as count,
  SUM((data->>'total_price')::numeric) as revenue
FROM shopify_orders
WHERE created_at >= '2024-10-01'
GROUP BY data->>'financial_status'
ORDER BY revenue DESC;
```

### Top Products

```sql
SELECT
  line_item->>'product_id' as product_id,
  line_item->>'name' as product_name,
  COUNT(*) as times_ordered,
  SUM((line_item->>'quantity')::integer) as total_quantity,
  SUM((line_item->>'price')::numeric * (line_item->>'quantity')::integer) as total_revenue
FROM shopify_orders,
     jsonb_array_elements(data->'line_items') as line_item
WHERE created_at >= '2024-10-01'
GROUP BY line_item->>'product_id', line_item->>'name'
ORDER BY total_revenue DESC
LIMIT 10;
```

## Time-Based Queries

### Daily Aggregation

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM((data->>'total_price')::numeric) as daily_revenue
FROM shopify_orders
WHERE created_at >= '2024-10-01'
GROUP BY DATE(created_at)
ORDER BY date;
```

### Monthly Trends

```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as order_count,
  SUM((data->>'total_price')::numeric) as monthly_revenue
FROM shopify_orders
WHERE created_at >= '2024-01-01'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

### Week Over Week Growth

```sql
WITH weekly_sales AS (
  SELECT
    DATE_TRUNC('week', created_at) as week,
    SUM((data->>'total_price')::numeric) as revenue
  FROM shopify_orders
  WHERE created_at >= NOW() - INTERVAL '8 weeks'
  GROUP BY DATE_TRUNC('week', created_at)
)
SELECT
  week,
  revenue,
  LAG(revenue) OVER (ORDER BY week) as prev_week_revenue,
  ROUND(
    ((revenue - LAG(revenue) OVER (ORDER BY week)) /
    LAG(revenue) OVER (ORDER BY week) * 100)::numeric,
    2
  ) as growth_percent
FROM weekly_sales
ORDER BY week DESC;
```

## Customer Analytics

### Customer Lifetime Value

```sql
SELECT
  data->'customer'->>'email' as customer_email,
  COUNT(*) as order_count,
  SUM((data->>'total_price')::numeric) as lifetime_value,
  AVG((data->>'total_price')::numeric) as avg_order_value,
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM shopify_orders
WHERE data->'customer'->>'email' IS NOT NULL
GROUP BY data->'customer'->>'email'
HAVING COUNT(*) > 1
ORDER BY lifetime_value DESC
LIMIT 100;
```

### New vs Returning Customers

```sql
WITH customer_orders AS (
  SELECT
    data->'customer'->>'email' as email,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY data->'customer'->>'email'
      ORDER BY created_at
    ) as order_number
  FROM shopify_orders
  WHERE data->'customer'->>'email' IS NOT NULL
)
SELECT
  DATE(created_at) as date,
  COUNT(CASE WHEN order_number = 1 THEN 1 END) as new_customers,
  COUNT(CASE WHEN order_number > 1 THEN 1 END) as returning_customers
FROM customer_orders
WHERE created_at >= '2024-10-01'
GROUP BY DATE(created_at)
ORDER BY date;
```

## Gorgias Ticket Examples

### Ticket Status Breakdown

```sql
SELECT
  data->>'status' as status,
  COUNT(*) as ticket_count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours_open
FROM gorgias_tickets
WHERE created_at >= '2024-10-01'
GROUP BY data->>'status'
ORDER BY ticket_count DESC;
```

### Response Time Analysis

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as ticket_count,
  AVG(
    EXTRACT(EPOCH FROM (
      (data->'messages'->0->>'created_datetime')::timestamp -
      created_at
    ))/60
  ) as avg_first_response_minutes
FROM gorgias_tickets
WHERE created_at >= '2024-10-01'
  AND jsonb_array_length(data->'messages') > 0
GROUP BY DATE(created_at)
ORDER BY date;
```

## Complex JSON Queries

### Multiple Array Joins

```sql
-- Products frequently bought together
SELECT
  a.line_item->>'product_id' as product_a_id,
  a.line_item->>'name' as product_a_name,
  b.line_item->>'product_id' as product_b_id,
  b.line_item->>'name' as product_b_name,
  COUNT(*) as times_together
FROM
  shopify_orders o,
  jsonb_array_elements(o.data->'line_items') as a(line_item),
  jsonb_array_elements(o.data->'line_items') as b(line_item)
WHERE
  a.line_item->>'product_id' < b.line_item->>'product_id'
  AND o.created_at >= '2024-10-01'
GROUP BY
  a.line_item->>'product_id',
  a.line_item->>'name',
  b.line_item->>'product_id',
  b.line_item->>'name'
HAVING COUNT(*) > 5
ORDER BY times_together DESC
LIMIT 20;
```

### JSON Conditional Aggregation

```sql
SELECT
  data->'customer'->>'city' as city,
  COUNT(*) as order_count,
  COUNT(CASE
    WHEN (data->>'total_price')::numeric > 100 THEN 1
  END) as high_value_orders,
  SUM(CASE
    WHEN data->>'fulfillment_status' = 'fulfilled' THEN 1
    ELSE 0
  END)::float / COUNT(*) as fulfillment_rate
FROM shopify_orders
WHERE created_at >= '2024-10-01'
  AND data->'customer'->>'city' IS NOT NULL
GROUP BY data->'customer'->>'city'
HAVING COUNT(*) >= 10
ORDER BY order_count DESC;
```

## Performance Tips

### Use Indexes on JSON Fields

```sql
-- Create GIN index for JSON containment queries
CREATE INDEX idx_orders_data ON shopify_orders USING GIN (data);

-- Create index on specific JSON path
CREATE INDEX idx_orders_email ON shopify_orders ((data->'customer'->>'email'));

-- Create index on casted numeric field
CREATE INDEX idx_orders_total ON shopify_orders (((data->>'total_price')::numeric));
```

### Materialized Views for Complex Aggregations

```sql
-- Create materialized view for daily metrics
CREATE MATERIALIZED VIEW daily_order_metrics AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM((data->>'total_price')::numeric) as revenue,
  AVG((data->>'total_price')::numeric) as avg_order_value,
  COUNT(DISTINCT data->'customer'->>'email') as unique_customers
FROM shopify_orders
WHERE data->>'financial_status' = 'paid'
GROUP BY DATE(created_at);

-- Refresh periodically
REFRESH MATERIALIZED VIEW daily_order_metrics;
```

## Error Handling

### Handling Null Values

```sql
-- Use COALESCE for null values
SELECT
  id,
  COALESCE((data->>'total_price')::numeric, 0) as total_price
FROM shopify_orders;

-- Filter out nulls
SELECT *
FROM shopify_orders
WHERE data->>'customer_email' IS NOT NULL
  AND data->>'financial_status' IS NOT NULL;
```

### Type Casting Safety

```sql
-- Safe casting with NULLIF and TRY_CAST equivalent
SELECT
  id,
  CASE
    WHEN data->>'total_price' ~ '^[0-9]+\.?[0-9]*$'
    THEN (data->>'total_price')::numeric
    ELSE NULL
  END as total_price
FROM shopify_orders;
```
