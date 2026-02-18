# PostgreSQL Query Workflow Examples

This document provides detailed workflow examples for common PostgreSQL query patterns with JSONB columns.

## Example 1: Simple Count Query

**User:** "How many orders did we have in October 2024?"

**Process:**
1. Identify table: "orders" → `shopify_orders`
2. Read cached schema: `.claude/skills/postgresql/references/schemas/shopify_orders.json`
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

## Example 2: JSON Field Query

**User:** "What's the average order value for paid orders last month?"

**Process:**
1. Identify table: `shopify_orders`
2. Read cached schema: `.claude/skills/postgresql/references/schemas/shopify_orders.json`
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

## Example 3: Complex JSON Array Query

**User:** "Show me the top 5 products by quantity sold in October"

**Process:**
1. Identify table: `shopify_orders`
2. Read cached schema: `.claude/skills/postgresql/references/schemas/shopify_orders.json`
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

## Example 4: Query with Error Recovery

**User:** "Show me customer emails from orders over $100"

**Process:**
1. Identify table: `shopify_orders`
2. Read cached schema: `.claude/skills/postgresql/references/schemas/shopify_orders.json`
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

**Note:** By checking cached schema FIRST, avoid query errors and wasted attempts.

## Example 5: Cross-Source Join

**User:** "Show me orders with DM shipments"

**Process:**
1. Identify tables: `shopify_orders` and `dm_orders`
2. Read cached schemas for both tables
3. Identify join key (likely order number or customer email in JSONB columns)
4. Construct query:
```sql
SELECT
  so.data as shopify_order,
  dm.data as dm_shipment
FROM shopify_orders so
INNER JOIN dm_orders dm ON so.data->>'name' = dm.data->>'order_number'
WHERE so.created_at >= '2024-11-01'
```
5. Execute and process in JavaScript:
```
const results = rows.map(row => ({
  shopifyOrder: row.shopify_order,
  dmShipment: row.dm_shipment
}));
```
6. Format results showing matched orders

## Key Principles

1. **Check cached schemas FIRST** - Saves time and avoids errors
2. **Execute ONE query** - Don't run separate COUNT queries
3. **SELECT entire JSONB columns** - Let JavaScript handle extraction
4. **Use PostgreSQL for filtering** - Let JavaScript handle transformation
5. **Pattern:** `SELECT data FROM table WHERE ...` then `results.rows.map(({ data }) => data)`
