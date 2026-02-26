---
name: google-search-console
description: "Search performance and SEO data from Google Search Console. Use for search queries driving traffic, impressions, clicks, CTR, and position data from Google Search. For website behavior analytics (page views, sessions, bounce rates), use the google-analytics skill instead."
category: ~~seo
service: google-search-console
---

# Google Search Console

## Purpose

**Use this skill for SEARCH PERFORMANCE and SEO questions.** Provides direct interaction with Google Search Console for search analytics data including queries, pages, countries, devices, and search appearance data. Authentication is handled automatically by `lib/auth.js` using shared Google OAuth credentials.

## When to Use

Activate this skill when the user:
- Mentions "Search Console", "GSC", "search queries", or "search performance"
- Wants to see which search queries are driving traffic
- Needs to analyze search impressions, clicks, CTR, or position data
- Wants to check search rankings for specific keywords
- Needs to identify top-performing pages in search
- Wants to analyze search by country or device
- Needs sitemap information or URL indexing status

**Example triggers:**
- "What keywords are bringing visitors?"
- "Show me top search queries"
- "What's our average position for [keyword]?"
- "Which pages have the highest CTR?"
- "Is this URL indexed?"

## When NOT to Use

- **Website behavior analytics**: Use google-analytics skill for page views, sessions, bounce rates
- **Shopify data**: Use shopify skill for orders, products, customers
- **Cross-source analysis**: Use postgresql skill when correlating search data with other sources

## Client Script

**Path:** `skills/google-search-console/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `list-sites` | List all verified sites in Search Console |
| `top-queries --site-url <url>` | Get top search queries by clicks. Optional: `--start-date`, `--end-date`, `--limit` |
| `top-pages --site-url <url>` | Get top pages by clicks from search. Optional: `--start-date`, `--end-date`, `--limit` |
| `query-analytics --site-url <url>` | Query search analytics with full options. Optional: `--start-date`, `--end-date`, `--dimensions` (comma-separated: query, page, country, device, searchAppearance), `--limit`, `--filters` |
| `inspect-url --site-url <url> --url <page-url>` | Check URL indexing status |
| `list-sitemaps --site-url <url>` | List submitted sitemaps for a site |

## Key API Concepts

**Search Console API** at `searchconsole.googleapis.com`. Dates in `YYYY-MM-DD` format. Data has approximately a **3-day delay** (no real-time data).

### Dimensions

| Dimension | Description |
|-----------|-------------|
| `query` | Search queries (keywords) |
| `page` | Landing pages |
| `country` | Country codes (USA, GBR, etc.) |
| `device` | Device type (DESKTOP, MOBILE, TABLET) |
| `searchAppearance` | Search result features |

### Metrics Explained

| Metric | Description |
|--------|-------------|
| `clicks` | Number of clicks from Google Search |
| `impressions` | Number of times pages appeared in search results |
| `ctr` | Click-through rate (clicks / impressions) |
| `position` | Average position in search results (1 = top) |

### Response Format

```json
{
  "success": true,
  "rows": [
    {
      "keys": ["your-brand shorts"],
      "clicks": 150,
      "impressions": 2500,
      "ctr": 0.06,
      "position": 4.2
    }
  ],
  "responseAggregationType": "byProperty"
}
```

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('google-search-console', '/webmasters/v3/sites/https%3A%2F%2Fexample.com/searchAnalytics/query');
```

## Additional Resources
- [Search Console API Documentation](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [Search Analytics Query API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
