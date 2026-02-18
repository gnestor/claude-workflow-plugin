# Shopify Query Language Reference

Shopify uses a special query syntax for filtering (different from GraphQL filters). This document provides the syntax reference.

## Query Syntax

- `field:value` - Exact match
- `field:>value` - Greater than
- `field:>=value` - Greater than or equal
- `field:<value` - Less than
- `field:<=value` - Less than or equal
- `field1:value1 AND field2:value2` - Combine conditions
- `field1:value1 OR field2:value2` - Either condition

## Common Filterable Fields

- `created_at` - Creation date (ISO format)
- `updated_at` - Update date
- `financial_status` - paid, pending, refunded, etc.
- `fulfillment_status` - fulfilled, unfulfilled, partial
- `status` - open, closed, cancelled
- `total_price` - Order total

## Examples

### Filter by date range
```graphql
query: "created_at:>=2024-01-01 AND created_at:<2024-02-01"
```

### Filter by status
```graphql
query: "financial_status:paid AND fulfillment_status:fulfilled"
```

### Filter by price range
```graphql
query: "total_price:>100 AND total_price:<=500"
```

### Combine multiple conditions
```graphql
query: "created_at:>=2024-11-01 AND financial_status:paid AND fulfillment_status:unfulfilled"
```
