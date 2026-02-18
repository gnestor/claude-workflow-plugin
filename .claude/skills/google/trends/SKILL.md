---
name: google-trends
description: Google Trends API integration for search interest data, keyword comparison, and trend analysis. Provides programmatic access to relative search volume, geographic breakdowns, and historical trends. API is currently in alpha - requires application for access.
---

# Google Trends Skill

Programmatic access to Google Trends data through the official Google Trends API (alpha).

## API Status

**The Google Trends API launched in alpha in July 2025.**

- Apply for access at: https://developers.google.com/search/apis/trends
- Rolling acceptance - not all applications approved immediately
- Alpha means API may change before general availability

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

- For **exact search volume**: Use `google/google-ads` skill (Keyword Planner)
- For **your website's search data**: Use `google/search-console` skill
- For **paid ad performance**: Use `google/google-ads` skill

**Note:** Google Trends provides **relative** interest (scaled 0-100), not absolute search volume.

## Prerequisites

### 1. API Access (Alpha)

Apply for access at: https://developers.google.com/search/apis/trends

Once approved, you'll receive an API key.

### 2. Environment Variables

Add to `.env`:
```bash
GOOGLE_TRENDS_API_KEY="your-api-key"
```

### 3. OAuth Authentication (Alternative)

If using OAuth instead of API key:
```bash
./lib/google-auth.ts
```

## Available Operations

### Interest Over Time

Get historical search interest for terms:

```bash
# Single term, last 12 months
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-over-time "corduroy shorts"

# Multiple terms (compare)
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-over-time "corduroy shorts,dolphin shorts,bell bottoms"

# Custom date range
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-over-time "shorts" --start 2024-01-01 --end 2024-12-31

# Specific country
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-over-time "shorts" --geo US
```

### Interest by Region

Get geographic breakdown of search interest:

```bash
# By country
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-by-region "vintage shorts"

# By US state
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-by-region "vintage shorts" --geo US --resolution REGION
```

### Related Queries

Find related and rising queries:

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  related-queries "corduroy shorts"
```

### Related Topics

Find related topics:

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  related-topics "bell bottoms"
```

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
    { "name": "Florida", "code": "US-FL", "value": 85 },
    { "name": "Texas", "code": "US-TX", "value": 72 }
  ]
}
```

### Related Queries Response
```json
{
  "success": true,
  "term": "corduroy shorts",
  "top": [
    { "query": "mens corduroy shorts", "value": 100 },
    { "query": "corduroy shorts women", "value": 75 }
  ],
  "rising": [
    { "query": "vintage corduroy shorts", "value": "+250%" },
    { "query": "corduroy shorts 80s", "value": "+150%" }
  ]
}
```

## API Features vs Web UI

| Feature | Web UI | API |
|---------|--------|-----|
| Terms compared | 5 max | Dozens |
| Interest values | 0-100 relative | Consistently scaled |
| Historical data | ~5 years | ~5 years |
| Geographic detail | Country/region | Country/region/sub-region |
| Export format | CSV | JSON |
| Automation | Manual | Programmatic |
| Rate limits | None | Yes (TBD) |

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

## Use Cases for SEO

### 1. Keyword Seasonality
```bash
# Check if "shorts" is seasonal
trends-client.ts interest-over-time "shorts" --start 2023-01-01 --end 2024-12-31
```

### 2. Compare Product Categories
```bash
# Which category has more interest?
trends-client.ts interest-over-time "corduroy shorts,dolphin shorts,terry shorts"
```

### 3. Find Rising Trends
```bash
# What related terms are growing?
trends-client.ts related-queries "vintage fashion"
```

### 4. Geographic Targeting
```bash
# Where should we target ads?
trends-client.ts interest-by-region "bell bottoms" --geo US
```

## Fallback: Browser Automation

If API access is not available, use Claude in Chrome to access trends.google.com:

1. Navigate to https://trends.google.com
2. Search for target keywords
3. Extract relative interest data
4. Compare up to 5 terms visually

This is documented in the SEO skill workflows.

## Rate Limits

**TBD - API is in alpha**

Expected limits:
- Requests per minute: ~60
- Requests per day: ~10,000
- Cache results when possible

## Error Handling

### "API key not valid"
- Verify GOOGLE_TRENDS_API_KEY in .env
- Check API access was approved

### "Quota exceeded"
- Implement caching for repeated queries
- Reduce request frequency

### "Term not found"
- Term may have insufficient search volume
- Try broader or more common terms

## Integration with SEO Skill

The SEO skill uses Google Trends for:
1. Search volume estimation (relative)
2. Keyword comparison
3. Seasonality analysis
4. Discovering rising keywords

Combined with Google Ads Keyword Planner, you get:
- **Keyword Planner**: Exact search volume, CPC data
- **Trends**: Relative interest over time, geographic data, rising trends

