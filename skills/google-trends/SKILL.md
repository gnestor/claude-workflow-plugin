---
name: google-trends
description: "Google Trends API integration for search interest data, keyword comparison, and trend analysis. Provides relative search volume, geographic breakdowns, and historical trends. Use for understanding search demand patterns, seasonality, and keyword popularity comparisons."
category: ~~search-trends
service: google-trends
---

# Google Trends

## Purpose

Programmatic access to Google Trends data through the official Google Trends API (alpha). Provides relative search interest, geographic breakdowns, related queries, and historical trend data. Authentication is handled automatically by `lib/auth.js` using shared Google OAuth credentials.

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

## When NOT to Use

- For **exact search volume**: Use the google-ads skill (Keyword Planner)
- For **your website's search data**: Use the google-search-console skill
- For **paid ad performance**: Use the google-ads skill

**Note:** Google Trends provides **relative** interest (scaled 0-100), not absolute search volume.

## Client Script

**Path:** `skills/google-trends/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `interest-over-time --terms <comma-separated>` | Get historical search interest for terms. Optional: `--time` (date range), `--geo` (country code) |
| `related-queries --term <term>` | Find related and rising queries. Optional: `--time`, `--geo` |
| `related-topics --term <term>` | Find related topics. Optional: `--time`, `--geo` |
| `interest-by-region --terms <comma-separated>` | Get geographic breakdown. Optional: `--time`, `--resolution` (REGION for state-level) |

## Key API Concepts

**Google Trends API** (alpha, launched July 2025). Values are **relative** on a 0-100 scale. Time granularity varies by date range.

### Understanding the Data

**Interest Values:**
- 100 = peak popularity for the term
- 50 = half as popular as the peak
- 0 = not enough data

**Comparing Terms:** When comparing multiple terms, all are scaled relative to the highest point across all terms.

### Time Granularity

| Date Range | Granularity |
|------------|-------------|
| < 7 days | Hourly |
| 7 days - 9 months | Daily |
| 9 months - 5 years | Weekly |
| > 5 years | Monthly |

### API vs Web UI

| Feature | Web UI | API |
|---------|--------|-----|
| Terms compared | 5 max | Dozens |
| Interest values | 0-100 relative | Consistently scaled |
| Historical data | ~5 years | ~5 years |
| Geographic detail | Country/region | Country/region/sub-region |
| Export format | CSV | JSON |
| Automation | Manual | Programmatic |

### Output Format Examples

**Interest Over Time:**
```json
{
  "success": true,
  "terms": ["corduroy shorts", "dolphin shorts"],
  "dateRange": { "start": "2024-01-01", "end": "2025-01-01" },
  "data": [
    { "date": "2024-01-07", "values": { "corduroy shorts": 45, "dolphin shorts": 72 } }
  ]
}
```

**Related Queries:**
```json
{
  "success": true,
  "term": "corduroy shorts",
  "top": [{ "query": "mens corduroy shorts", "value": 100 }],
  "rising": [{ "query": "vintage corduroy shorts", "value": "+250%" }]
}
```

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('google-trends', '/trends/interestOverTime');
```

## Additional Resources
- [Google Trends API](https://developers.google.com/search/apis/trends)
- [Trends API Documentation](https://developers.google.com/search/apis/trends/reference)
