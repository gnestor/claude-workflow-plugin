---
name: google-search-console
description: SEARCH PERFORMANCE & SEO DATA. Use for search queries driving traffic, impressions, clicks, CTR, and position data from Google Search. For website behavior analytics, use google-analytics skill.
---

# Google Search Console API Integration

## Purpose

**Use this skill for SEARCH PERFORMANCE and SEO questions.** This Skill enables direct interaction with Google Search Console through the Webmasters API. It provides access to search analytics data including queries, pages, countries, devices, and search appearance data.

## When to Use

**Use this Skill for questions about Google Search performance and SEO data.**

Activate this Skill when the user:
- Mentions "Search Console", "GSC", "search queries", or "search performance"
- Wants to see which search queries are driving traffic: "what keywords are bringing visitors?"
- Needs to analyze search impressions and clicks: "show me top search queries"
- Wants to check search rankings: "what's our average position for [keyword]?"
- Asks about CTR (click-through rate) from search: "which pages have the highest CTR?"
- Needs to identify top-performing pages in search: "which pages get the most impressions?"
- Wants to analyze search by country or device: "where does our search traffic come from?"
- Asks about SEO performance trends: "how has our search traffic changed?"
- Needs sitemap information: "list our submitted sitemaps"
- Wants to inspect URL indexing status: "is this URL indexed?"

## When NOT to Use

- **Website behavior analytics**: Use google-analytics skill for page views, sessions, bounce rates (e.g., "What's our bounce rate?" → use google-analytics)
- **Shopify data**: Use shopify skill for orders, products, customers
- **Cross-source analysis**: Use postgresql skill when correlating search data with other sources

## Prerequisites

- Google Cloud Project with Search Console API enabled
- OAuth 2.0 credentials (shared with other Google skills)
- Verified site(s) in Google Search Console
- Environment variables configured in `.env`

## Setup Instructions

### 1. Enable Search Console API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (same as other Google skills)
3. Navigate to "APIs & Services" > "Library"
4. Search for and enable "Google Search Console API"

### 2. Authentication

**Use unified Google authentication (recommended):**
```bash
./lib/google-auth.ts
```

This grants access to Search Console along with Gmail, Analytics, Sheets, and Drive.

**Note:** The Search Console API scope (`webmasters.readonly`) is included in the unified authentication.

## Available Operations

### CLI Commands

```bash
# Authentication (uses shared Google OAuth)
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/search-console/scripts/gsc-client.ts auth

# List verified sites
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts list-sites

# Query search analytics
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts query <site-url> <start-date> <end-date> [dimension]

# Get top queries
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts top-queries <site-url> [days] [limit]

# Get top pages
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts top-pages <site-url> [days] [limit]

# Inspect URL indexing status
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts inspect-url <site-url> <url-to-inspect>

# List sitemaps
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts list-sitemaps <site-url>
```

### Command Reference

| Command | Description |
|---------|-------------|
| `auth` | Authenticate with Google (uses shared OAuth) |
| `list-sites` | List all verified sites in Search Console |
| `query <site> <start> <end> [dim]` | Query search analytics with optional dimension (query, page, country, device) |
| `top-queries <site> [days] [limit]` | Get top search queries by clicks |
| `top-pages <site> [days] [limit]` | Get top pages by clicks from search |
| `inspect-url <site> <url>` | Check URL indexing status |
| `list-sitemaps <site>` | List submitted sitemaps |

### Date Formats

- Use `YYYY-MM-DD` format (e.g., `2024-01-01`)
- Relative dates not supported (unlike GA)
- Data available with ~3 day delay

### Dimensions

Available dimensions for grouping data:
- `query` - Search queries (keywords)
- `page` - Landing pages
- `country` - Country codes (USA, GBR, etc.)
- `device` - Device type (DESKTOP, MOBILE, TABLET)
- `searchAppearance` - Search result features

## Example Workflows

### Get Top Search Queries (Last 30 Days)

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-queries https://www.example.com/ 30 50
```

### Analyze Search Performance by Page

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-pages https://www.example.com/ 30 20
```

### Custom Query with Date Range

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  query https://www.example.com/ 2024-01-01 2024-01-31 query
```

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

Run unified authentication:
```bash
./lib/google-auth.ts
```

