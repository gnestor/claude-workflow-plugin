---
name: google-analytics
description: "Website behavior and analytics data from Google Analytics 4. Use for traffic data, page views, bounce rates, user sessions, conversion funnels, and website performance. For Shopify order/product data, use the shopify skill. For cross-source analysis, use the postgresql skill."
category: ~~analytics
service: google-analytics
---

# Google Analytics

## Purpose

**Use this skill for WEBSITE BEHAVIOR and ANALYTICS questions.** Provides direct interaction with Google Analytics 4 (GA4) through the Analytics Admin API and Analytics Data API for account information, property details, standard and real-time reporting, and analytics data. Authentication is handled automatically by `lib/auth.js` using shared Google OAuth credentials.

## When to Use

Activate this skill when the user:
- Mentions "Google Analytics", "GA4", "web analytics", or "website traffic"
- Wants to check website traffic, sessions, or visitor behavior
- Needs to run analytics reports or analyze real-time data
- References website behavior metrics: bounce rate, session duration, pages per session
- Needs to analyze traffic sources or conversion funnels
- Wants to review GA4 properties

**Example triggers:**
- "How many visitors did we have this week?"
- "Show me top pages by pageviews"
- "How many users are on the site right now?"
- "What's our bounce rate?"
- "Where is our traffic coming from?"

## When NOT to Use

- **Shopify order/product data**: Use shopify skill for orders, products, customers, inventory
- **Cross-source analysis**: Use postgresql skill when correlating GA data with other sources
- **Non-website questions**: If the question doesn't involve website behavior, traffic, or analytics, use the appropriate skill

## Client Script

**Path:** `skills/google-analytics/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Verify authentication and API access |
| `run-report --start-date <date> --end-date <date>` | Run a GA4 report. Optional: `--dimensions` (comma-separated), `--metrics` (comma-separated), `--limit` |
| `list-properties` | List all accessible GA4 properties |
| `get-metadata` | Get available dimensions and metrics. Optional: `--property-id` |

## Key API Concepts

**GA4 Data API v1beta** for reports and **Admin API** for property management. Dates use `YYYY-MM-DD` format or relative strings like `7daysAgo`, `30daysAgo`, `today`, `yesterday`.

### Natural Language to Parameter Mapping

**Time periods:**
- "last week" -> `7daysAgo` to `yesterday`
- "last 7 days" -> `7daysAgo` to `today`
- "last 30 days" -> `30daysAgo` to `today`
- "this month" -> `YYYY-MM-01` to `today`
- "last month" -> previous month start to end

**Metrics from natural language:**
- "visitors" / "users" -> `activeUsers`
- "pageviews" -> `screenPageViews`
- "sessions" -> `sessions`
- "conversions" -> `conversions`
- "revenue" -> `totalRevenue`
- "engagement" -> `engagementRate`

**Dimensions from natural language:**
- "by page" -> `pagePath`
- "by country" / "by location" -> `country`
- "by device" -> `deviceCategory`
- "by source" -> `sessionSource`
- "by browser" -> `browser`

### Common Dimensions

- User: `country`, `city`, `deviceCategory`, `browser`, `operatingSystem`
- Acquisition: `sessionSource`, `sessionMedium`, `sessionCampaignName`
- Behavior: `pagePath`, `pageTitle`, `eventName`, `landingPage`

### Common Metrics

- Users: `activeUsers`, `newUsers`, `totalUsers`
- Engagement: `sessions`, `screenPageViews`, `eventCount`, `engagementRate`
- Conversions: `conversions`, `totalRevenue`

### Date Range Formats

**Relative dates:** `today`, `yesterday`, `7daysAgo`, `30daysAgo`

**Absolute dates:** `YYYY-MM-DD` format (e.g., `2025-11-01`)

### Comparison Queries

Use multiple date ranges for period-over-period analysis:
```json
{
  "dateRanges": [
    {"startDate": "2025-10-01", "endDate": "2025-10-31"},
    {"startDate": "2025-11-01", "endDate": "today"}
  ],
  "metrics": [{"name": "activeUsers"}]
}
```

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('google-analytics', '/v1beta/properties/123456:runReport');
```

## Additional Resources
- [GA4 Dimensions & Metrics Reference](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [GA4 Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
