# Product Catalog Input Template

## Overview

This template defines the input format for bulk product SEO optimization. Data can be sourced from Shopify via the `shopify` skill or `postgresql` skill.

## Data Source Commands

### From Shopify Skill
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/shopify/scripts/shopify-client.ts products
```

### From PostgreSQL
```sql
SELECT data FROM shopify_products WHERE data->>'status' = 'active'
```

## Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `handle` | string | URL slug (unique identifier) | `mens-navy-corduroy-shorts` |
| `title` | string | Product display name | `Men's Corduroy Short (Navy)` |
| `body_html` | string | Current HTML description | `<p>The Your Brand Short is...</p>` |
| `product_type` | string | Product category | `Shorts`, `Pants`, `Swim` |
| `tags` | string[] | Product tags | `["corduroy", "men", "navy"]` |

## Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `metafields_global_title_tag` | string | Current meta title | `Men's Navy Shorts` |
| `metafields_global_description_tag` | string | Current meta description | `Shop our navy shorts...` |
| `vendor` | string | Brand/vendor name | `Your Brand` |
| `collections` | string[] | Collection memberships | `["Shorts", "New Arrivals"]` |
| `variants` | object[] | Product variants | Size, color options |
| `images` | object[] | Product images | URLs, alt text |

## Input JSON Structure

```json
{
  "products": [
    {
      "handle": "mens-navy-corduroy-shorts",
      "title": "Men's Corduroy Short (Navy)",
      "body_html": "<p>The Your Brand Short is a vintage-inspired...</p>",
      "product_type": "Shorts",
      "tags": ["corduroy", "men", "navy", "shorts"],
      "vendor": "Your Brand",
      "metafields_global_title_tag": "",
      "metafields_global_description_tag": "",
      "variants": [
        {
          "title": "Small",
          "sku": "HMS-NVY-S",
          "price": "58.00",
          "inventory_quantity": 25
        }
      ],
      "images": [
        {
          "src": "https://cdn.shopify.com/...",
          "alt": ""
        }
      ]
    }
  ]
}
```

## CSV Alternative Format

For simpler workflows, products can be provided as CSV:

```csv
handle,title,body_html,product_type,tags,meta_title,meta_description
mens-navy-corduroy-shorts,"Men's Corduroy Short (Navy)","<p>The Your Brand Short...</p>",Shorts,"corduroy,men,navy","",""
```

## Data Extraction from Shopify JSON

When using raw Shopify API response, extract fields:

```
const products = shopifyResponse.products.map(p => ({
  handle: p.handle,
  title: p.title,
  body_html: p.body_html,
  product_type: p.product_type,
  tags: p.tags.split(', '),
  meta_title: p.metafields_global_title_tag || '',
  meta_description: p.metafields_global_description_tag || '',
  vendor: p.vendor,
  variants: p.variants,
  images: p.images
}));
```

## Deduplication

Products often have multiple variants (colors, sizes). For SEO purposes, deduplicate to base products:

### By Handle Pattern
```
// Remove color suffix from handle
const baseHandle = handle.replace(/-\w+$/, ''); // "mens-corduroy-short-navy" → "mens-corduroy-short"
```

### By Title Pattern
```
// Remove parenthetical color
const baseTitle = title.replace(/\s*\([^)]+\)\s*$/, ''); // "Men's Short (Navy)" → "Men's Short"
```

### Deduplication Logic
```
const uniqueProducts = new Map();
products.forEach(p => {
  const baseHandle = p.handle.replace(/-[a-z]+$/, '');
  if (!uniqueProducts.has(baseHandle)) {
    uniqueProducts.set(baseHandle, p);
  }
});
```

## Validation Rules

Before processing, validate:

1. **Required fields present**
   ```
   const required = ['handle', 'title', 'body_html', 'product_type'];
   const valid = required.every(field => product[field]);
   ```

2. **Handle format**
   ```
   const validHandle = /^[a-z0-9-]+$/.test(product.handle);
   ```

3. **Body HTML not empty**
   ```
   const hasContent = product.body_html && product.body_html.length > 50;
   ```

## Preprocessing Steps

1. **Strip HTML from body for analysis**
   ```
   const textContent = body_html.replace(/<[^>]*>/g, ' ').trim();
   ```

2. **Normalize tags to lowercase array**
   ```
   const normalizedTags = (typeof tags === 'string' ? tags.split(',') : tags)
     .map(t => t.trim().toLowerCase());
   ```

3. **Extract current keywords from content**
   ```
   const words = textContent.toLowerCase().split(/\s+/);
   const keywordCounts = words.reduce((acc, word) => {
     acc[word] = (acc[word] || 0) + 1;
     return acc;
   }, {});
   ```

## Sample Input File

Save as `products-input.json`:

```json
{
  "source": "shopify",
  "extracted_at": "2026-01-22T10:00:00Z",
  "product_count": 255,
  "products": [
    {
      "handle": "mens-navy-corduroy-shorts",
      "title": "Men's Corduroy Short (Navy)",
      "body_html": "<p>The Your Brand Short is a vintage-inspired corduroy short with a 3\" inseam and elastic waist...</p>",
      "product_type": "Shorts",
      "tags": ["corduroy", "men", "navy", "shorts", "vintage"],
      "metafields_global_title_tag": "",
      "metafields_global_description_tag": "",
      "vendor": "Your Brand"
    }
  ]
}
```

## Related Templates

- [output-csv.md](output-csv.md) - Output format for optimized products
- [webpage-input.md](webpage-input.md) - Input format for webpage optimization
