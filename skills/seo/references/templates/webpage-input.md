# Webpage Input Template

## Overview

This template defines the input format for webpage SEO optimization, including landing pages, blog posts, about pages, and collection pages.

## Input Types

### 1. URL-Based Input
Provide URL for automatic content extraction:

```json
{
  "type": "url",
  "url": "https://example.com/pages/about",
  "analyze_competitors": false
}
```

### 2. Content-Based Input
Provide page content directly:

```json
{
  "type": "content",
  "url": "/pages/about",
  "title": "About Your Brand",
  "meta_title": "About Us | Your Brand",
  "meta_description": "Learn about Your Brand...",
  "content_html": "<h1>About Your Brand</h1><p>...</p>",
  "page_type": "about"
}
```

## Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `url` | string | Page URL or path | `/pages/about` |
| `title` | string | Page H1/title | `About Your Brand` |
| `content_html` | string | Page body content | `<p>Founded in...</p>` |
| `page_type` | string | Page category | See types below |

## Page Types

| Type | Description | SEO Focus |
|------|-------------|-----------|
| `landing` | Marketing landing pages | Conversion keywords |
| `collection` | Product collection pages | Category keywords |
| `blog` | Blog posts/articles | Informational keywords |
| `about` | About/company pages | Brand keywords |
| `policy` | Policy pages (shipping, returns) | Trust signals |
| `faq` | FAQ pages | Question keywords |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `meta_title` | string | Current meta title tag |
| `meta_description` | string | Current meta description |
| `h1` | string | Primary heading |
| `h2_tags` | string[] | Secondary headings |
| `internal_links` | string[] | Links to other pages |
| `images` | object[] | Images with alt text |
| `schema` | object | Current structured data |
| `word_count` | number | Content word count |
| `publish_date` | string | Original publish date |
| `last_modified` | string | Last update date |

## Full Input Structure

```json
{
  "pages": [
    {
      "url": "/pages/about",
      "title": "About Your Brand",
      "page_type": "about",
      "meta_title": "About Us | Your Brand",
      "meta_description": "Learn about Your Brand, founded in Santa Barbara...",
      "content_html": "<h1>About Your Brand</h1><p>We're on a mission to revive...</p>",
      "h1": "About Your Brand",
      "h2_tags": [
        "Our Story",
        "Our Mission",
        "The Team"
      ],
      "internal_links": [
        "/collections/shorts",
        "/collections/pants"
      ],
      "images": [
        {
          "src": "/images/about-hero.jpg",
          "alt": "brand founders"
        }
      ],
      "word_count": 450,
      "last_modified": "2025-06-15"
    }
  ]
}
```

## Collection Page Input

Collection pages require additional fields:

```json
{
  "url": "/collections/shorts",
  "title": "Shorts",
  "page_type": "collection",
  "meta_title": "Men's Shorts | Your Brand",
  "meta_description": "Shop vintage-inspired shorts...",
  "content_html": "<p>Our collection of retro shorts...</p>",
  "collection_data": {
    "product_count": 24,
    "product_types": ["Corduroy Shorts", "Terry Shorts", "Dolphin Shorts"],
    "price_range": {
      "min": 48,
      "max": 68
    }
  }
}
```

## Blog Post Input

Blog posts include additional metadata:

```json
{
  "url": "/blogs/style/how-to-style-bell-bottoms",
  "title": "How to Style Bell Bottoms in 2026",
  "page_type": "blog",
  "meta_title": "How to Style Bell Bottoms | Your Brand Blog",
  "meta_description": "Learn how to style bell bottoms for any occasion...",
  "content_html": "<article>...</article>",
  "blog_data": {
    "author": "Your Brand Team",
    "publish_date": "2026-01-15",
    "categories": ["Style Guide", "Bell Bottoms"],
    "tags": ["fashion", "70s style", "bell bottoms"],
    "reading_time": 5
  }
}
```

## Data Extraction Methods

### From Shopify (Liquid Templates)
Access page content via Shopify admin or API:
```
GET /admin/api/2024-01/pages.json
GET /admin/api/2024-01/blogs/{blog_id}/articles.json
```

### From Browser (Claude in Chrome)
Extract content from live page:
```
const pageData = {
  url: window.location.pathname,
  title: document.querySelector('h1')?.textContent,
  meta_title: document.querySelector('title')?.textContent,
  meta_description: document.querySelector('meta[name="description"]')?.content,
  content_html: document.querySelector('main')?.innerHTML
};
```

### From Google Analytics (`~~analytics` tools)
Get page performance data using the analytics MCP tools to fetch page-level reports.

### From Google Search Console (`~~seo` tools)
Get search queries for a specific URL using the SEO MCP tools to fetch URL-specific query data.

## Preprocessing

### Extract Text Content
```
function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

### Extract Headings
```
function extractHeadings(html) {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const h2Matches = html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi);

  return {
    h1: h1Match ? h1Match[1].replace(/<[^>]+>/g, '') : null,
    h2: Array.from(h2Matches).map(m => m[1].replace(/<[^>]+>/g, ''))
  };
}
```

### Calculate Word Count
```
function wordCount(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}
```

## Validation

### Required Checks
```
function validatePage(page) {
  const errors = [];

  if (!page.url) errors.push('URL required');
  if (!page.title) errors.push('Title required');
  if (!page.content_html) errors.push('Content required');
  if (!page.page_type) errors.push('Page type required');

  const wordCount = extractText(page.content_html).split(/\s+/).length;
  if (wordCount < 100) errors.push(`Content too thin: ${wordCount} words`);

  return errors;
}
```

### SEO Checks
```
function seoChecks(page) {
  const issues = [];

  // Meta title length
  if (page.meta_title && page.meta_title.length > 60) {
    issues.push(`Meta title too long: ${page.meta_title.length} chars`);
  }

  // Meta description length
  if (page.meta_description && page.meta_description.length > 160) {
    issues.push(`Meta description too long: ${page.meta_description.length} chars`);
  }

  // H1 present
  if (!page.h1) {
    issues.push('Missing H1 tag');
  }

  return issues;
}
```

## Sample Input File

Save as `pages-input.json`:

```json
{
  "source": "manual",
  "extracted_at": "2026-01-22T10:00:00Z",
  "page_count": 5,
  "pages": [
    {
      "url": "/pages/about",
      "title": "About Your Brand",
      "page_type": "about",
      "meta_title": "About Us | Your Brand",
      "meta_description": "Learn about Your Brand...",
      "content_html": "<h1>About Your Brand</h1>...",
      "word_count": 450
    },
    {
      "url": "/collections/shorts",
      "title": "Shorts Collection",
      "page_type": "collection",
      "meta_title": "Men's Shorts | Your Brand",
      "content_html": "...",
      "collection_data": {
        "product_count": 24
      }
    }
  ]
}
```

## Related Templates

- [product-catalog-input.md](product-catalog-input.md) - Product catalog input format
- [output-csv.md](output-csv.md) - Output format specifications
