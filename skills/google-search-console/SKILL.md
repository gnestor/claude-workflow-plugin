---
name: google-search-console
description: Search performance and SEO data from Google Search Console. Use for search queries driving traffic, impressions, clicks, CTR, and position data from Google Search. For website behavior analytics (page views, sessions, bounce rates), use the google-analytics skill instead.
---

# Google Search Console Integration

## Purpose

**Use this skill for SEARCH PERFORMANCE and SEO questions.** Provides direct interaction with Google Search Console through the Webmasters API for search analytics data including queries, pages, countries, devices, and search appearance data.

## Authentication

Authentication is handled by the MCP server. All Search Console API access is managed through the server's OAuth credentials.

## When to Use

**Use this skill for questions about Google Search performance and SEO data.**

Activate this skill when the user:
- Mentions "Search Console", "GSC", "search queries", or "search performance"
- Wants to see which search queries are driving traffic: "what keywords are bringing visitors?"
- Needs to analyze search impressions and clicks: "show me top search queries"
- Wants to check search rankings: "what's our average position for [keyword]?"
- Asks about CTR (click-through rate) from search: "which pages have the highest CTR?"
- Needs to identify top-performing pages in search: "which pages get the most impressions?"
- Wants to analyze search by country or device
- Asks about SEO performance trends
- Needs sitemap information: "list our submitted sitemaps"
- Wants to inspect URL indexing status: "is this URL indexed?"

## When NOT to Use

- **Website behavior analytics**: Use google-analytics skill for page views, sessions, bounce rates
- **Shopify data**: Use shopify skill for orders, products, customers
- **Cross-source analysis**: Use postgresql skill when correlating search data with other sources

## Available Operations

Use `~~seo` tools for all Google Search Console operations.

### List Sites
List all verified sites in Search Console.

### Query Search Analytics
Query search analytics with optional dimension (query, page, country, device).

**Parameters:**
- `site-url`: The verified site URL
- `start-date`: Start date (YYYY-MM-DD format)
- `end-date`: End date (YYYY-MM-DD format)
- `dimension` (optional): query, page, country, device, searchAppearance

### Top Queries
Get top search queries by clicks.

**Parameters:**
- `site-url`: The verified site URL
- `days` (optional): Number of days to look back
- `limit` (optional): Maximum results

### Top Pages
Get top pages by clicks from search.

### Inspect URL
Check URL indexing status.

### List Sitemaps
List submitted sitemaps for a site.

## Date Formats

- Use `YYYY-MM-DD` format (e.g., `2024-01-01`)
- Relative dates not supported (unlike GA)
- Data available with ~3 day delay

## Dimensions

Available dimensions for grouping data:
- `query` - Search queries (keywords)
- `page` - Landing pages
- `country` - Country codes (USA, GBR, etc.)
- `device` - Device type (DESKTOP, MOBILE, TABLET)
- `searchAppearance` - Search result features

## Response Data

### Search Analytics Response

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

### Metrics Explained

| Metric | Description |
|--------|-------------|
| `clicks` | Number of clicks from Google Search |
| `impressions` | Number of times pages appeared in search results |
| `ctr` | Click-through rate (clicks / impressions) |
| `position` | Average position in search results (1 = top) |

## Rate Limits

- 1,200 queries per minute per project
- 200,000 queries per day per project
- Data freshness: ~3 days behind

## Troubleshooting

### "User does not have sufficient permissions"
Ensure your Google account has access to the Search Console property.

### "Site not found"
Use the exact site URL format as shown in Search Console (including protocol and trailing slash if applicable).

### "Missing refresh token"
Verify the MCP server connection is active and OAuth is properly configured.
