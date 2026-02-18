# Shopify GraphQL Query Examples

Common query patterns and examples for the Shopify Admin GraphQL API.

## Query Pattern Guide

**Use `nodes` for cleaner queries** (recommended):
```graphql
{
  products(first: 10) {
    nodes {
      id
      title
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Use `edges -> node` only when needed**:
```graphql
{
  products(first: 10) {
    edges {
      cursor  # Individual item cursor
      node {
        id
        title
      }
    }
  }
}
```

Most examples below use `nodes` for brevity. Use `edges` only when you need per-item cursors or edge metadata.

## Shop Information

### Get shop details
```graphql
{
  shop {
    name
    email
    currencyCode
    primaryDomain {
      url
      host
    }
    plan {
      displayName
    }
  }
}
```

## Orders

### Get recent orders
```graphql
{
  orders(first: 10, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id
      name
      createdAt
      displayFinancialStatus
      displayFulfillmentStatus
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      customer {
        firstName
        lastName
        email
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Get orders with filters
```graphql
{
  orders(
    first: 50
    query: "created_at:>=2024-11-01 AND financial_status:paid"
  ) {
    nodes {
      id
      name
      createdAt
      totalPriceSet {
        shopMoney {
          amount
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Get order with line items
```graphql
{
  orders(first: 1) {
    nodes {
      id
      name
      lineItems(first: 10) {
        nodes {
          id
          name
          quantity
          originalUnitPriceSet {
            shopMoney {
              amount
            }
          }
          product {
            id
            title
          }
          variant {
            id
            title
          }
        }
      }
    }
  }
}
```

### Get unfulfilled orders
```graphql
{
  orders(first: 50, query: "fulfillment_status:unfulfilled") {
    nodes {
      id
      name
      createdAt
      displayFulfillmentStatus
      totalPriceSet {
        shopMoney {
          amount
        }
      }
    }
  }
}
```

## Products

### Get products list
```graphql
{
  products(first: 20) {
    nodes {
      id
      title
      handle
      status
      createdAt
      totalInventory
      variants(first: 5) {
        nodes {
          id
          title
          price
          sku
          inventoryQuantity
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Get product by ID
```graphql
{
  product(id: "gid://shopify/Product/1234567890") {
    id
    title
    description
    descriptionHtml
    productType
    vendor
    tags
    images(first: 5) {
      edges {
        node {
          id
          url
          altText
        }
      }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          price
          compareAtPrice
          sku
          inventoryQuantity
          weight
          weightUnit
        }
      }
    }
  }
}
```

### Get products with low inventory
```graphql
{
  products(first: 50, query: "inventory_total:<10") {
    nodes {
      id
      title
      totalInventory
      variants(first: 10) {
        nodes {
          id
          title
          inventoryQuantity
        }
      }
    }
  }
}
```

### Get products by collection
```graphql
{
  collection(id: "gid://shopify/Collection/1234567890") {
    title
    products(first: 50) {
      edges {
        node {
          id
          title
          totalInventory
        }
      }
    }
  }
}
```

## Customers

### Get customers list
```graphql
{
  customers(first: 50) {
    edges {
      node {
        id
        firstName
        lastName
        email
        phone
        createdAt
        numberOfOrders
        amountSpent {
          amount
          currencyCode
        }
        addresses {
          address1
          city
          province
          country
          zip
        }
      }
    }
  }
}
```

### Get customer by ID
```graphql
{
  customer(id: "gid://shopify/Customer/1234567890") {
    id
    firstName
    lastName
    email
    phone
    createdAt
    numberOfOrders
    amountSpent {
      amount
      currencyCode
    }
    orders(first: 10) {
      edges {
        node {
          id
          name
          createdAt
          totalPriceSet {
            shopMoney {
              amount
            }
          }
        }
      }
    }
  }
}
```

### Search customers
```graphql
{
  customers(first: 20, query: "email:*@example.com") {
    edges {
      node {
        id
        firstName
        lastName
        email
      }
    }
  }
}
```

## Collections

### Get collections list
```graphql
{
  collections(first: 50) {
    edges {
      node {
        id
        title
        handle
        productsCount
        updatedAt
      }
    }
  }
}
```

### Get collection with products
```graphql
{
  collection(id: "gid://shopify/Collection/1234567890") {
    id
    title
    description
    productsCount
    products(first: 20) {
      edges {
        node {
          id
          title
          totalInventory
        }
      }
    }
  }
}
```

## Inventory

### Get inventory levels
```graphql
{
  inventoryItems(first: 50) {
    edges {
      node {
        id
        sku
        tracked
        inventoryLevels(first: 5) {
          edges {
            node {
              id
              available
              location {
                id
                name
              }
            }
          }
        }
      }
    }
  }
}
```

### Get inventory by location
```graphql
{
  location(id: "gid://shopify/Location/1234567890") {
    id
    name
    inventoryLevels(first: 100) {
      edges {
        node {
          id
          available
          item {
            id
            sku
            variant {
              id
              title
              product {
                id
                title
              }
            }
          }
        }
      }
    }
  }
}
```

## Pagination Example

### Paginate through all products
```graphql
# First request
{
  products(first: 250) {
    nodes {
      id
      title
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

# Subsequent requests (if hasNextPage is true)
# Use the endCursor from the previous response
{
  products(first: 250, after: "eyJsYXN0X2lkIjo...") {
    nodes {
      id
      title
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Note**: Use `pageInfo.endCursor` for pagination - you don't need individual item cursors unless you have a specific requirement.

## Mutations

### Update product
```graphql
mutation {
  productUpdate(
    input: {
      id: "gid://shopify/Product/1234567890"
      title: "Updated Product Title"
      descriptionHtml: "<p>New description</p>"
    }
  ) {
    product {
      id
      title
      descriptionHtml
    }
    userErrors {
      field
      message
    }
  }
}
```

### Update variant price
```graphql
mutation {
  productVariantUpdate(
    input: {
      id: "gid://shopify/ProductVariant/1234567890"
      price: "29.99"
    }
  ) {
    productVariant {
      id
      price
    }
    userErrors {
      field
      message
    }
  }
}
```

### Update inventory level
```graphql
mutation {
  inventoryAdjustQuantity(
    input: {
      inventoryLevelId: "gid://shopify/InventoryLevel/1234567890"
      availableDelta: 10
    }
  ) {
    inventoryLevel {
      id
      available
    }
    userErrors {
      field
      message
    }
  }
}
```

### Add product to collection
```graphql
mutation {
  collectionAddProducts(
    id: "gid://shopify/Collection/1234567890"
    productIds: ["gid://shopify/Product/9876543210"]
  ) {
    collection {
      id
      productsCount
    }
    userErrors {
      field
      message
    }
  }
}
```

### Create customer
```graphql
mutation {
  customerCreate(
    input: {
      firstName: "John"
      lastName: "Doe"
      email: "john.doe@example.com"
      phone: "+1234567890"
    }
  ) {
    customer {
      id
      email
    }
    userErrors {
      field
      message
    }
  }
}
```

## Query Filters Cheat Sheet

### Date filters
```
created_at:>=2024-01-01
created_at:<=2024-12-31
created_at:>2024-01-01 AND created_at:<2024-12-31
updated_at:>=2024-11-01
```

### Status filters
```
financial_status:paid
financial_status:pending
financial_status:refunded
fulfillment_status:fulfilled
fulfillment_status:unfulfilled
fulfillment_status:partial
status:open
status:closed
```

### Price filters
```
total_price:>100
total_price:>=50 AND total_price:<=200
total_price:<25
```

### Text search
```
email:*@gmail.com
name:*Smith*
tag:sale
```

### Inventory filters
```
inventory_total:<10
inventory_total:>0
inventory_total:=0
```

## Common Field Patterns

### Money fields
```graphql
totalPriceSet {
  shopMoney {
    amount
    currencyCode
  }
  presentmentMoney {
    amount
    currencyCode
  }
}
```

### Address fields
```graphql
address {
  address1
  address2
  city
  province
  provinceCode
  country
  countryCodeV2
  zip
}
```

### Image fields
```graphql
image {
  id
  url
  altText
  width
  height
}
```

### Metafields
```graphql
metafields(first: 10) {
  nodes {
    id
    namespace
    key
    value
    type
  }
}
```

## Metaobjects

### Get all metaobjects of a specific type
```graphql
{
  metaobjects(type: "hero_slide", first: 250) {
    nodes {
      id
      handle
      type
      displayName
      updatedAt
      fields {
        key
        value
        type
        definition {
          name
          type {
            name
          }
        }
        # For image references
        reference {
          ... on MediaImage {
            id
            image {
              url
              altText
              width
              height
            }
          }
          ... on Product {
            id
            title
            handle
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```
