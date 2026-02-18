---
name: google-trends
description: Google Trends API integration for search interest data, keyword comparison, and trend analysis. Provides relative search volume, geographic breakdowns, and historical trends. Use for understanding search demand patterns, seasonality, and keyword popularity comparisons.
---

# Google Trends Skill

Programmatic access to Google Trends data through the official Google Trends API.

## API Status

**The Google Trends API launched in alpha in July 2025.**

- Apply for access at: https://developers.google.com/search/apis/trends
- Rolling acceptance - not all applications approved immediately
- Alpha means API may change before general availability

## Authentication

Authentication is handled by the MCP server. Access requires either an API key or OAuth credentials configured in the server.

## When to Use

Activate this skill when the user:
- Asks about search trends or trending topics
- Wants to compare keyword popularity
- Needs historical search interest data
- Asks about geographic search patterns
- Wants to analyze seasonal trends
- Needs relative search volume comparisons

**Example triggers:**
- "What are the trending searches for shorts?"
- "Compare search interest: corduroy shorts vs dolphin shorts"
- "How has 'bell bottoms' trended over the past year?"
- "Which states search most for 'vintage clothing'?"
- "Is 'retro fashion' trending up or down?"

## When NOT to Use

- For **exact search volume**: Use the google-ads skill (Keyword Planner)
- For **your website's search data**: Use the google-search-console skill
- For **paid ad performance**: Use the google-ads skill

**Note:** Google Trends provides **relative** interest (scaled 0-100), not absolute search volume.

## Available Operations

Use `~~seo` tools (trends category) for all Google Trends operations.

### Interest Over Time

Get historical search interest for one or more terms.

**Parameters:**
- `terms` - Comma-separated search terms
- `start` (optional) - Start date (YYYY-MM-DD)
- `end` (optional) - End date (YYYY-MM-DD)
- `geo` (optional) - Country code (e.g., US)

### Interest by Region

Get geographic breakdown of search interest.

**Parameters:**
- `term` - Search term
- `geo` (optional) - Country code
- `resolution` (optional) - REGION for state-level

### Related Queries

Find related and rising queries for a term.

### Related Topics

Find related topics for a term.

## Output Formats

### Interest Over Time Response
```json
{
  "success": true,
  "terms": ["corduroy shorts", "dolphin shorts"],
  "dateRange": {
    "start": "2024-01-01",
    "end": "2025-01-01"
  },
  "data": [
    {
      "date": "2024-01-07",
      "values": {
        "corduroy shorts": 45,
        "dolphin shorts": 72
      }
    }
  ]
}
```

### Interest by Region Response
```json
{
  "success": true,
  "term": "vintage shorts",
  "geo": "US",
  "regions": [
    { "name": "California", "code": "US-CA", "value": 100 },
    { "name": "Florida", "code": "US-FL", "value": 85 }
  ]
}
```

### Related Queries Response
```json
{
  "success": true,
  "term": "corduroy shorts",
  "top": [
    { "query": "mens corduroy shorts", "value": 100 }
  ],
  "rising": [
    { "query": "vintage corduroy shorts", "value": "+250%" }
  ]
}
```

## Understanding the Data

### Interest Values

- Values are **relative** (0-100 scale)
- 100 = peak popularity for the term
- 50 = half as popular as the peak
- 0 = not enough data

### Comparing Terms

When comparing multiple terms:
- All terms scaled relative to highest point
- A term with 100 had highest search interest
- A term with 50 had half the interest of the peak

### Time Granularity

| Date Range | Granularity |
|------------|-------------|
| < 7 days | Hourly |
| 7 days - 9 months | Daily |
| 9 months - 5 years | Weekly |
| > 5 years | Monthly |

## API Features vs Web UI

| Feature | Web UI | API |
|---------|--------|-----|
| Terms compared | 5 max | Dozens |
| Interest values | 0-100 relative | Consistently scaled |
| Historical data | ~5 years | ~5 years |
| Geographic detail | Country/region | Country/region/sub-region |
| Export format | CSV | JSON |
| Automation | Manual | Programmatic |

## Use Cases for SEO

### 1. Keyword Seasonality
Check if terms are seasonal by looking at interest over 1-2 years.

### 2. Compare Product Categories
Compare search interest across product categories to inform strategy.

### 3. Find Rising Trends
Discover related queries that are growing rapidly.

### 4. Geographic Targeting
Identify which regions have the most interest for ad targeting.

## Integration with Other Skills

Combined with Google Ads Keyword Planner:
- **Keyword Planner**: Exact search volume, CPC data
- **Trends**: Relative interest over time, geographic data, rising trends

## Rate Limits

**TBD - API is in alpha**

Expected limits:
- Requests per minute: ~60
- Requests per day: ~10,000
- Cache results when possible

## Troubleshooting

### "API key not valid"
- Verify the MCP server has the Trends API key configured
- Check API access was approved

### "Quota exceeded"
- Implement caching for repeated queries
- Reduce request frequency

### "Term not found"
- Term may have insufficient search volume
- Try broader or more common terms
