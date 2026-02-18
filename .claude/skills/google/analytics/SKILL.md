---
name: google-analytics
description: WEBSITE BEHAVIOR & ANALYTICS. Use for traffic data, page views, bounce rates, user sessions, conversion funnels, and website performance. For Shopify order/product data, use shopify skill. For cross-source analysis (e.g., GA traffic + Shopify orders), use postgresql skill.
---

# Google Analytics API Integration

## Purpose

**Use this skill for WEBSITE BEHAVIOR and ANALYTICS questions.** This Skill enables direct interaction with Google Analytics 4 (GA4) through the Analytics Admin API and Analytics Data API. It provides access to account information, property details, standard and real-time reporting, and analytics data to help you understand website and app performance.

## When to Use

**Use this Skill for questions about website traffic, user behavior, and analytics metrics.**

Activate this Skill when the user:
- Mentions "Google Analytics", "GA4", "web analytics", or "website traffic"
- Wants to check website traffic, sessions, or visitor behavior: "how many visitors did we have this week?"
- Needs to run analytics reports: "show me top pages by pageviews"
- Wants to analyze real-time data: "how many users are on the site right now?"
- References website behavior metrics: "what's our bounce rate?", "average session duration", "pages per session"
- Needs to analyze traffic sources: "where is our traffic coming from?"
- Wants to analyze conversion funnels: "what's our checkout conversion rate?"
- Asks about user engagement: "how long do users stay on the site?"
- Needs to review GA4 properties: "show me all our analytics accounts"
- Wants to analyze custom dimensions or metrics related to website behavior

## When NOT to Use

- **Shopify order/product data**: Use shopify skill for questions about orders, products, customers, inventory (e.g., "How many orders this week?" → use shopify)
- **Cross-source analysis**: Use postgresql skill when correlating GA data with other sources (e.g., "Compare GA traffic to Shopify sales" → use postgresql)
- **Non-website questions**: If the question doesn't involve website behavior, traffic, or analytics, use the appropriate skill

## Prerequisites

- Google Cloud Project with the following APIs enabled:
  - Google Analytics Admin API
  - Google Analytics Data API (GA4)
- OAuth 2.0 credentials OR Service Account credentials
- Access to Google Analytics 4 properties
- Environment variables configured in `.env`

## Setup Instructions

### 1. Create/Configure Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable required APIs:
   - Navigate to "APIs & Services" > "Library"
   - Search for and enable "Google Analytics Admin API"
   - Search for and enable "Google Analytics Data API"

### 2. Set Up Authentication

Two authentication options available:

#### Option A: OAuth 2.0 (Recommended for Personal Use)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs: `http://localhost:3000/oauth2callback`
5. Download credentials and extract `client_id` and `client_secret`
6. Add to `.env` file:
   ```bash
   GOOGLE_CLIENT_ID="client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="client-secret"
   ```
7. Run authentication:

   **Recommended: Use unified authentication**
   ```bash
   ./lib/google-auth.ts
   ```
   This grants access to Gmail, Google Analytics, Google Sheets, and Google Drive all at once.

   **Alternative: Analytics-only authentication**
   ```bash
   deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-analytics/scripts/ga-client.ts auth
   ```

**Note:** OAuth credentials are shared across all Google API skills. If you use multiple Google skills, unified authentication is recommended.

#### Option B: Service Account (Recommended for Production)

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name it "GA4 API Client" and grant "Viewer" role
4. Create and download JSON key
5. Add to `.env` file:
   ```bash
   GA_SERVICE_ACCOUNT_EMAIL="service-account@project.iam.gserviceaccount.com"
   GA_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
6. In GA4 Admin, grant the service account email Viewer access to properties

## Available Operations

The skill provides the following commands through the `ga-client.ts` script:

### 1. Authenticate (OAuth only)

Obtain OAuth refresh token for API access.

**Recommended: Use unified authentication**
```bash
./lib/google-auth.ts
```

**Alternative: Authenticate for Analytics only**
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-analytics/scripts/ga-client.ts auth
```

This will:
- Print an authorization URL
- Open browser for Google OAuth consent
- Prompt to paste the authorization code
- Save the refresh token to `.env` automatically

**Note:** Token is shared with Gmail, Google Sheets, and Google Drive skills.

### 2. List Accounts

Retrieve all GA4 accounts and properties with access.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts list-accounts
```

Returns: Account names/IDs, property names/IDs, total counts

Use when user asks "what analytics accounts do I have?" or need to find a property ID for reporting.

### 3. Get Property Details

Get detailed information about a specific GA4 property.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts get-property <property-id>
```

Parameters: `property-id` - The GA4 property ID (number or full `properties/123456789`)

Returns: Property name, display name, time zone, currency code, industry category, create time

### 4. Run Report

Execute a standard analytics report using the GA4 Data API.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts run-report <property-id> '<json-params>'
```

Parameters:
- `property-id`: The GA4 property ID
- `json-params`: JSON string with report parameters

JSON Parameters:
```json
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "pagePath"}],
  "metrics": [{"name": "screenPageViews"}, {"name": "activeUsers"}],
  "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": true}],
  "limit": 10
}
```

Common Dimensions:
- User: `country`, `city`, `deviceCategory`, `browser`, `operatingSystem`
- Acquisition: `sessionSource`, `sessionMedium`, `sessionCampaignName`
- Behavior: `pagePath`, `pageTitle`, `eventName`, `landingPage`

Common Metrics:
- Users: `activeUsers`, `newUsers`, `totalUsers`
- Engagement: `sessions`, `screenPageViews`, `eventCount`, `engagementRate`
- Conversions: `conversions`, `totalRevenue`

### 5. Get Visitors (Simplified Report)

Get visitor statistics for a specific date or date range. Simplified alternative to `run-report` for common visitor queries.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts visitors <property-id> [start-date] [end-date]
```

### 5. Get Visitors (Simplified Report)

Get visitor statistics for a specific date or date range. This is a simplified alternative to `run-report` for common visitor queries.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts visitors <property-id> [start-date] [end-date]
```

**Parameters:**
- `property-id`: The GA4 property ID
- `start-date` (optional): Start date (defaults to "today"). Formats:
  - `YYYY-MM-DD` (e.g., "2025-11-05")
  - Relative dates: "today", "yesterday", "7daysAgo", "30daysAgo"
- `end-date` (optional): End date (defaults to start-date if not provided)

**Returns:**
- Total users
- Sessions
- Page views
- Engagement rate
- Average session duration

**Use when:**
- User asks "how many visitors did we have today/this week/etc?"
- Need quick visitor stats without writing JSON

**Examples:**
```bash
# Get today's visitors
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts visitors 123456789

# Get visitors for a specific date
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts visitors 123456789 2025-11-05

# Get visitors for a date range
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts visitors 123456789 2025-11-01 2025-11-05

# Get last 7 days
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts visitors 123456789 7daysAgo today
```

### 6. Run Real-time Report

Execute a real-time analytics report showing current activity (last 30 minutes).

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts realtime-report <property-id> '<json-params>'
```

Parameters:
- `property-id`: The GA4 property ID
- `json-params`: JSON string with report parameters (similar to run-report, but no dateRanges)

**Example:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts realtime-report 123456789 '{"metrics":[{"name":"activeUsers"}]}'
```

### 7. Top Pages

Get top pages by pageviews (convenience command).

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts top-pages <property-id> [days] [limit]
```

Parameters:
- `property-id`: The GA4 property ID
- `days` (optional): Number of days to look back (default: 7)
- `limit` (optional): Maximum results (default: 10)

Returns: Page path and title, pageviews, active users, average session duration

### 8. Traffic Sources

Get traffic breakdown by source/medium (convenience command).

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts traffic-sources <property-id> [days] [limit]
```

Parameters:
- `property-id`: The GA4 property ID
- `days` (optional): Number of days (default: 7)
- `limit` (optional): Maximum results (default: 20)

Returns: Session source and medium, active users, sessions, pageviews, conversions

### 9. Device Breakdown

Get traffic breakdown by device category (convenience command).

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts device-breakdown <property-id> [days]
```

Parameters:
- `property-id`: The GA4 property ID
- `days` (optional): Number of days (default: 7)

Returns: Device category (desktop, mobile, tablet), active users, sessions, pageviews, engagement rate, average session duration

### 10. Active Users

Get current active users in real-time (convenience command).

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-analytics/scripts/ga-client.ts active-users <property-id>
```

Returns: Current active users, breakdown by device and country

## Instructions

When a user requests Google Analytics data, follow this process:

### 1. Identify the Query Type

- **Account/Property Discovery:** Use `list-accounts`
- **Property Configuration:** Use `get-property`
- **Historical Analysis:** Use `run-report` or convenience commands (top-pages, traffic-sources, device-breakdown)
- **Real-time Monitoring:** Use `realtime-report` or `active-users`

### 2. Determine Property ID

If the user doesn't specify a property ID:
1. Run `list-accounts` to show available properties
2. Ask which property to query, or use a default if configured

### 3. Parse Natural Language to Parameters

Convert user's request into appropriate parameters:

**Time periods:**
- "last week" → `7daysAgo` to `yesterday`
- "last 7 days" → `7daysAgo` to `today`
- "last 30 days" → `30daysAgo` to `today`
- "this month" → `2025-11-01` to `today`
- "last month" → `2025-10-01` to `2025-10-31`

**Metrics from natural language:**
- "visitors" / "users" → `activeUsers`
- "pageviews" → `screenPageViews`
- "sessions" → `sessions`
- "conversions" → `conversions`
- "revenue" → `totalRevenue`
- "engagement" → `engagementRate`

**Dimensions from natural language:**
- "by page" → `pagePath`
- "by country" / "by location" → `country`
- "by device" → `deviceCategory`
- "by source" → `sessionSource`
- "by browser" → `browser`

### 4. Execute the Appropriate Command

Choose the right command based on the query:

**Simple queries → Use convenience commands:**
- "top pages" → `top-pages`
- "traffic sources" → `traffic-sources`
- "device breakdown" → `device-breakdown`
- "current users" → `active-users`

**Complex queries → Use `run-report` or `realtime-report`:**
- Custom date ranges
- Multiple dimensions
- Specific filters
- Custom sorting

### 5. Process and Present Results

- Parse the JSON output
- Format data in easy-to-read tables or lists
- Include totals and key insights
- For reports with many rows, highlight top performers
- Add context to help understand the data
- Suggest follow-up analyses if appropriate

### 6. Handle Common Scenarios

**Multi-property queries:**
1. Run `list-accounts` first
2. Run reports for each property
3. Aggregate or compare results

**Comparison queries (e.g., "compare this month to last month"):**
1. Use multiple date ranges in single `run-report` call:
   ```json
   {
     "dateRanges": [
       {"startDate": "2025-10-01", "endDate": "2025-10-31"},
       {"startDate": "2025-11-01", "endDate": "today"}
     ],
     "metrics": [{"name": "activeUsers"}]
   }
   ```
2. Present side-by-side comparison
3. Calculate percentage changes

**Complex filtering:**
Use dimensionFilter or metricFilter in the JSON params:
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

### 7. Error Handling

**"Missing credentials" error:**
- If OAuth: Run `auth` command to authenticate
- If Service Account: Check `GA_SERVICE_ACCOUNT_EMAIL` and `GA_SERVICE_ACCOUNT_KEY` in `.env`

**"Property not found" or "Permission denied":**
- Run `list-accounts` to see available properties
- Verify Viewer access to the property
- Ensure property ID is correct

**"Analytics Admin API error" or "Analytics Data API error":**
- Check that both APIs are enabled in Google Cloud Console
- Verify authentication credentials are valid
- Check that property ID is in correct format

**"Invalid dimension/metric":**
- Refer to [GA4 Dimensions & Metrics Reference](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- Use exact API names (case-sensitive)
- Ensure dimension/metric combination is compatible

## Date Range Formats

### Relative Dates
- `today` - Today
- `yesterday` - Yesterday
- `7daysAgo` - 7 days ago
- `30daysAgo` - 30 days ago

### Absolute Dates
- `YYYY-MM-DD` format (e.g., `2025-11-01`)

### Common Patterns
```json
// Last 7 days
{"startDate": "7daysAgo", "endDate": "today"}

// Last 30 days
{"startDate": "30daysAgo", "endDate": "today"}

// Specific month
{"startDate": "2025-11-01", "endDate": "2025-11-30"}

// Year to date
{"startDate": "2025-01-01", "endDate": "today"}
```

## Security Notes

- Never expose OAuth credentials or service account keys in output
- Refresh tokens and service account keys are stored in `.env` (never commit)
- API has daily quota limits (check Google Cloud Console)
- Use read-only scopes (`analytics.readonly`)
- Respect data privacy settings configured in GA4

## Troubleshooting

**"Missing OAuth credentials"**
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
- Run `auth` command to get refresh token

**"Failed to get access token"**
- OAuth: Re-run `auth` command
- Service Account: Verify `GA_SERVICE_ACCOUNT_KEY` format in `.env`

**"Analytics Admin API error"**
- Ensure Analytics Admin API is enabled
- Check property access permissions
- Verify authentication

**"Analytics Data API error"**
- Ensure Analytics Data API is enabled
- Verify property ID format
- Check dimension/metric compatibility

**"Quota exceeded"**
- Check quota in Google Cloud Console
- Wait 24 hours for reset
- Request quota increase if needed

