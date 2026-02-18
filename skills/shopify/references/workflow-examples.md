# Shopify GraphQL Workflow Examples

This document provides detailed workflow examples for common Shopify GraphQL query patterns.

## Example 1: Simple Count Query

**User:** "How many orders did we have this month?"

**Process:**
1. Identify resource: "orders" → `orders` query
2. Determine time filter: "this month" → calculate start date
3. Construct query:
```graphql
{
  orders(first: 1, query: "created_at:>=2024-11-01") {
    edges {
      node {
        id
      }
    }
  }
}
```
4. Note: Shopify doesn't provide total count directly, so pagination through all results may be needed
5. Execute and count results

## Example 2: Filtered Data Query

**User:** "Show me unfulfilled orders over $100"

**Process:**
1. Identify resource: `orders` query
2. Determine filters: "unfulfilled" + "over $100"
3. Construct query:
```graphql
{
  orders(first: 50, query: "fulfillment_status:unfulfilled AND total_price:>100") {
    edges {
      node {
        id
        name
        createdAt
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        displayFulfillmentStatus
      }
    }
  }
}
```
4. Execute and format results

## Example 3: Aggregation Query

**User:** "What's the average order value for the past 30 days?"

**Process:**
1. Calculate date filter (30 days ago)
2. Construct query to get all order totals:
```graphql
{
  orders(first: 250, query: "created_at:>=2024-10-05") {
    edges {
      node {
        id
        totalPriceSet {
          shopMoney {
            amount
          }
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```
3. Paginate through all results
4. Calculate average in code: sum(amounts) / count
5. Return formatted answer

## Example 4: Product Query

**User:** "Show me products with inventory below 10"

**Process:**
1. Identify resource: `products` query
2. Note: Inventory is on variants, not products
3. Construct query:
```graphql
{
  products(first: 50) {
    edges {
      node {
        id
        title
        variants(first: 10) {
          edges {
            node {
              id
              title
              inventoryQuantity
            }
          }
        }
      }
    }
  }
}
```
4. Filter results in code where inventoryQuantity < 10
