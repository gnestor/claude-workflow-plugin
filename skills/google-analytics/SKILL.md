---
name: google-analytics
description: Website behavior and analytics data from Google Analytics 4. Use for traffic data, page views, bounce rates, user sessions, conversion funnels, and website performance. For Shopify order/product data, use the shopify skill. For cross-source analysis, use the postgresql skill.
---

# Google Analytics Integration

## Purpose

**Use this skill for WEBSITE BEHAVIOR and ANALYTICS questions.** Provides direct interaction with Google Analytics 4 (GA4) through the Analytics Admin API and Analytics Data API for account information, property details, standard and real-time reporting, and analytics data.

## Authentication

Authentication is handled by the MCP server. All Analytics API access is managed through the server's OAuth credentials.

## When to Use

**Use this skill for questions about website traffic, user behavior, and analytics metrics.**

Activate this skill when the user:
- Mentions "Google Analytics", "GA4", "web analytics", or "website traffic"
- Wants to check website traffic, sessions, or visitor behavior: "how many visitors did we have this week?"
- Needs to run analytics reports: "show me top pages by pageviews"
- Wants to analyze real-time data: "how many users are on the site right now?"
- References website behavior metrics: "what's our bounce rate?", "average session duration", "pages per session"
- Needs to analyze traffic sources: "where is our traffic coming from?"
- Wants to analyze conversion funnels: "what's our checkout conversion rate?"
- Asks about user engagement: "how long do users stay on the site?"
- Needs to review GA4 properties: "show me all our analytics accounts"

## When NOT to Use

- **Shopify order/product data**: Use shopify skill for questions about orders, products, customers, inventory
- **Cross-source analysis**: Use postgresql skill when correlating GA data with other sources
- **Non-website questions**: If the question doesn't involve website behavior, traffic, or analytics, use the appropriate skill

## Available Operations

Use `~~analytics` tools for all Google Analytics operations.

### List Accounts

Retrieve all GA4 accounts and properties with access.

Returns: Account names/IDs, property names/IDs, total counts

### Get Property Details

Get detailed information about a specific GA4 property.

Returns: Property name, display name, time zone, currency code, industry category, create time

### Run Report

Execute a standard analytics report using the GA4 Data API.

**JSON Parameters:**
```json
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "pagePath"}],
  "metrics": [{"name": "screenPageViews"}, {"name": "activeUsers"}],
  "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": true}],
  "limit": 10
}
```

**Common Dimensions:**
- User: `country`, `city`, `deviceCategory`, `browser`, `operatingSystem`
- Acquisition: `sessionSource`, `sessionMedium`, `sessionCampaignName`
- Behavior: `pagePath`, `pageTitle`, `eventName`, `landingPage`

**Common Metrics:**
- Users: `activeUsers`, `newUsers`, `totalUsers`
- Engagement: `sessions`, `screenPageViews`, `eventCount`, `engagementRate`
- Conversions: `conversions`, `totalRevenue`

### Get Visitors (Simplified Report)

Get visitor statistics for a specific date or date range.

**Parameters:**
- `property-id`: The GA4 property ID
- `start-date` (optional): Start date. Formats: `YYYY-MM-DD`, "today", "yesterday", "7daysAgo", "30daysAgo"
- `end-date` (optional): End date (defaults to start-date if not provided)

**Returns:** Total users, sessions, page views, engagement rate, average session duration

### Run Real-time Report

Execute a real-time analytics report showing current activity (last 30 minutes).

### Top Pages

Get top pages by pageviews.

**Parameters:**
- `property-id`: The GA4 property ID
- `days` (optional): Number of days to look back (default: 7)
- `limit` (optional): Maximum results (default: 10)

### Traffic Sources

Get traffic breakdown by source/medium.

### Device Breakdown

Get traffic breakdown by device category.

### Active Users

Get current active users in real-time.

## Instructions

### 1. Identify the Query Type

- **Account/Property Discovery:** Use list accounts
- **Property Configuration:** Use get property
- **Historical Analysis:** Use run report or convenience commands (top pages, traffic sources, device breakdown)
- **Real-time Monitoring:** Use realtime report or active users

### 2. Determine Property ID

If the user doesn't specify a property ID:
1. Run list accounts to show available properties
2. Ask which property to query, or use a default if configured

### 3. Parse Natural Language to Parameters

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

### 4. Execute the Appropriate Command

**Simple queries -> Use convenience commands:**
- "top pages" -> top pages
- "traffic sources" -> traffic sources
- "device breakdown" -> device breakdown
- "current users" -> active users

**Complex queries -> Use run report:**
- Custom date ranges
- Multiple dimensions
- Specific filters
- Custom sorting

### 5. Process and Present Results

- Format data in easy-to-read tables or lists
- Include totals and key insights
- For reports with many rows, highlight top performers
- Suggest follow-up analyses if appropriate

### 6. Handle Common Scenarios

**Comparison queries (e.g., "compare this month to last month"):**
Use multiple date ranges in a single report call:
```json
{
  "dateRanges": [
    {"startDate": "2025-10-01", "endDate": "2025-10-31"},
    {"startDate": "2025-11-01", "endDate": "today"}
  ],
  "metrics": [{"name": "activeUsers"}]
}
```

**Complex filtering:**
Use dimensionFilter or metricFilter:
```json
{
  "dimensionFilter": {
    "filter": {
      "fieldName": "country",
      "stringFilter": {
        "value": "United States"
      }
    }
  }
}
```

## Date Range Formats

### Relative Dates
- `today` - Today
- `yesterday` - Yesterday
- `7daysAgo` - 7 days ago
- `30daysAgo` - 30 days ago

### Absolute Dates
- `YYYY-MM-DD` format (e.g., `2025-11-01`)

## Troubleshooting

**"Missing credentials"**
- Verify the MCP server connection is active
- Check that OAuth scopes include Analytics permissions

**"Property not found" or "Permission denied"**
- Run list accounts to see available properties
- Verify Viewer access to the property

**"Invalid dimension/metric"**
- Refer to [GA4 Dimensions & Metrics Reference](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- Use exact API names (case-sensitive)
- Ensure dimension/metric combination is compatible

**"Quota exceeded"**
- Check quota in Google Cloud Console
- Wait 24 hours for reset

## Security Notes

- Never expose OAuth credentials in output
- API has daily quota limits
- Use read-only scopes (`analytics.readonly`)
- Respect data privacy settings configured in GA4
