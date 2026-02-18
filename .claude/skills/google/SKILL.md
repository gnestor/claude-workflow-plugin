---
name: google
description: Unified Google Workspace and services integration providing access to Gmail, Google Analytics, Google Sheets, Google Drive, Google Ads, AI Studio (Gemini/Nano Banana Pro), and more. Use this when working with any Google service including email management, website analytics, spreadsheet data, file storage, ad campaign management, or AI image/text generation.
---

# Google Services Integration

Consolidated skill providing unified access to Google Workspace and Google Cloud services through shared OAuth authentication.

## Available Services

### 📧 Gmail - [gmail/SKILL.md](gmail/SKILL.md)
Email management and inbox organization.

**Use for:**
- Reading and searching emails
- Managing labels and folders
- Analyzing email priority
- Creating tasks from emails
- Archiving and organizing inbox

**Key operations:**
- `list-unread` - Get unread emails
- `search` - Search with Gmail query syntax
- `analyze-priority` - Categorize by urgency
- `create-task` - Convert email to Notion task

### 📊 Google Analytics - [analytics/SKILL.md](analytics/SKILL.md)
Website behavior and analytics data.

**Use for:**
- Traffic analysis and visitor metrics
- Page views and bounce rates
- User sessions and engagement
- Conversion tracking
- Real-time activity monitoring

**Key operations:**
- `list-accounts` - List GA4 properties
- `visitors` - Get visitor statistics
- `top-pages` - Most viewed pages
- `traffic-sources` - Traffic breakdown
- `active-users` - Real-time users

### 📑 Google Sheets - [sheets/SKILL.md](sheets/SKILL.md)
Spreadsheet data access and manipulation.

**Use for:**
- Financial reports (P&L, balance sheets)
- Business metrics and KPIs
- Data analysis and calculations
- Creating and updating spreadsheets
- Exporting data

**Key operations:**
- `list-sheets` - List sheets in spreadsheet
- `get` - Get range data
- `create` - Create new spreadsheet
- `update` - Update cell values
- `batch-get` - Query multiple ranges

### 📁 Google Drive - [drive/SKILL.md](drive/SKILL.md)
File storage and document management.

**Use for:**
- Searching for files and folders
- Downloading documents
- Uploading and organizing files
- Managing permissions and sharing
- Exporting Google Workspace files

**Key operations:**
- `search` - Search files with query syntax
- `list` - List files in folder
- `download` - Download with export options
- `upload` - Upload files
- `share` - Manage permissions

### 🔍 Google Search Console - [search-console/SKILL.md](search-console/SKILL.md)
Search performance and SEO data.

**Use for:**
- Search queries driving traffic
- Click-through rates and positions
- Indexing status and coverage
- Sitemap management
- SEO keyword research

**Key operations:**
- `list-sites` - List verified sites
- `top-queries` - Top search queries by clicks
- `top-pages` - Top pages by search clicks
- `inspect-url` - Check URL indexing status
- `list-sitemaps` - List submitted sitemaps

### 🗄️ BigQuery - [bigquery/SKILL.md](bigquery/SKILL.md)
Cloud data warehouse querying and analysis.

**Use for:**
- Querying BigQuery datasets
- Translating natural language to BigQuery SQL
- Analyzing large-scale data warehouse tables
- Schema scanning and caching
- Export queries to Jupyter notebooks

**Key operations:**
- `list-datasets` - List all datasets in project
- `list-tables` - List tables in dataset
- `get-schema` - Get table schema
- `query` - Execute BigQuery SQL
- `scan-all` - Scan and cache all table schemas

### 📢 Google Ads - [google-ads/SKILL.md](google-ads/SKILL.md)
Real-time ad campaign management and reporting.

**Use for:**
- Campaign, ad group, and keyword performance
- Search terms report and analysis
- Shopping/product performance
- Budget and bidding adjustments
- Optimization recommendations
- Pausing/enabling campaigns and keywords

**Key operations:**
- `campaigns` - Campaign performance report
- `search-terms` - Search terms that triggered ads
- `shopping` - Product performance
- `recommendations` - Optimization suggestions
- `update-budget` - Adjust campaign budgets
- `update-target-roas` - Change target ROAS
- `gaql` - Execute raw GAQL queries

### 🎨 AI Studio (Gemini) - [ai-studio/SKILL.md](ai-studio/SKILL.md)
AI text and image generation with Gemini models and Nano Banana Pro.

**Use for:**
- Image generation with Nano Banana Pro
- Text generation with Gemini models
- Image editing and manipulation
- Embeddings for semantic search
- Multimodal content (image + text)

**Key operations:**
- `generate-image` - Generate images with Nano Banana Pro
- `generate` - Generate text content
- `stream` - Stream text generation
- `edit-image` - Edit existing images
- `embed` - Generate text embeddings
- `upload-file` - Upload files for multimodal

**Note:** AI Studio uses API key authentication (not OAuth). Set `GEMINI_API_KEY` in `.env`.

## Authentication

Most Google services share a single OAuth token for seamless access. AI Studio uses a separate API key.

### Quick Start

**OAuth Services (Gmail, Analytics, Sheets, Drive, BigQuery, Search Console, Ads):**
```bash
./lib/google-auth.ts
```

This grants access to OAuth-based services at once.

**AI Studio (Gemini/Nano Banana Pro):**

Add to `.env`:
```bash
GEMINI_API_KEY="your-api-key-from-aistudio.google.com"
```

Get your API key from [Google AI Studio](https://aistudio.google.com/).

### Prerequisites

1. **Google Cloud Project** with APIs enabled:
   - Gmail API
   - Google Analytics Admin API & Data API
   - Google Sheets API
   - Google Drive API
   - BigQuery API
   - Google Ads API

   **For Google Ads:** Also requires a developer token from https://ads.google.com/aw/apicenter

2. **OAuth 2.0 Credentials** in `.env`:
   ```bash
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   GOOGLE_REFRESH_TOKEN="auto-saved-by-auth"
   ```

3. **Run authentication** (only needed once):
   ```bash
   ./lib/google-auth.ts
   ```

See [lib/GOOGLE_AUTH.md](../../lib/GOOGLE_AUTH.md) for detailed setup instructions.

## Quick Reference

### Common Use Cases

**Email Management:**
```bash
# Check unread emails
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/gmail/scripts/gmail-client.ts list-unread 10
```

**Website Analytics:**
```bash
# Get visitor stats
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/analytics/scripts/ga-client.ts visitors <property-id> 7daysAgo today
```

**Spreadsheet Data:**
```bash
# Get P&L data
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/sheets/scripts/sheets-client.ts get <spreadsheet-id> "'P&L'!A1:Z100"
```

**File Management:**
```bash
# Search Drive files
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/drive/scripts/drive-client.ts search "name contains 'budget'"
```

**BigQuery Data Warehouse:**
```bash
# List BigQuery datasets
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/bigquery/scripts/bq-client.ts list-datasets

# Execute BigQuery SQL query
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/bigquery/scripts/bq-client.ts query "SELECT * FROM \`dataset.table\` LIMIT 10"
```

**Google Ads:**
```bash
# Get campaign performance
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts campaigns

# Get search terms report
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts search-terms
```

**AI Studio (Gemini/Nano Banana Pro):**
```bash
# Generate an image
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "A product photo of casual shorts on a beach" \
  --output assets/product.png

# Generate text
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate \
  "Write a tagline for a beach clothing brand"
```

## Service-Specific Documentation

Each service has detailed documentation in its subdirectory:

- **[gmail/SKILL.md](gmail/SKILL.md)** - Complete Gmail operations guide
- **[analytics/SKILL.md](analytics/SKILL.md)** - Google Analytics reporting and queries
- **[sheets/SKILL.md](sheets/SKILL.md)** - Spreadsheet data access and manipulation
- **[drive/SKILL.md](drive/SKILL.md)** - File management and Drive operations
- **[bigquery/SKILL.md](bigquery/SKILL.md)** - BigQuery data warehouse queries and schema management
- **[google-ads/SKILL.md](google-ads/SKILL.md)** - Google Ads campaign management and reporting
- **[ai-studio/SKILL.md](ai-studio/SKILL.md)** - AI image/text generation with Gemini and Nano Banana Pro

## Skill Selection Guide

### When to Use Each Service

**Gmail** - Use when:
- User mentions "email", "inbox", "Gmail"
- Need to check or manage emails
- Creating tasks from emails
- Email priority or organization

**Analytics** - Use when:
- User asks about "website traffic", "visitors", "analytics"
- Need page views, bounce rates, sessions
- Real-time website activity
- Traffic sources or user behavior

**Sheets** - Use when:
- User mentions "spreadsheet", "P&L", "financial data"
- Need to access Google Sheets data
- Analyzing business metrics
- Year-over-year comparisons

**Drive** - Use when:
- User mentions "Google Drive", "files", "documents"
- Need to search for or download files
- Uploading or organizing files
- Managing file permissions

**BigQuery** - Use when:
- User **explicitly mentions "BigQuery"** or "BQ"
- Data only exists in BigQuery (not in PostgreSQL)
- User requests BigQuery-specific features

**Note:** BigQuery is a secondary data warehouse. For general database queries, use postgresql skill first. Only use BigQuery when explicitly requested or when data isn't available elsewhere.

**Google Ads** - Use when:
- User mentions "Google Ads", "ad campaigns", "PPC", "search ads"
- Need real-time campaign performance data
- Adjusting budgets or bidding strategies
- Viewing optimization recommendations
- Analyzing search terms or shopping products
- Pausing or enabling campaigns/keywords

**Note:** For historical Google Ads analysis over long periods, use BigQuery (data synced via Airbyte). Use Google Ads skill for real-time data and mutations.

**AI Studio** - Use when:
- User mentions "Gemini", "AI Studio", "Nano Banana", "generate image"
- Need to generate images with AI
- Text generation with Google's Gemini models
- Creating embeddings for semantic search
- Multimodal AI tasks (image + text)

**Note:** AI Studio uses API key authentication (not OAuth). Requires `GEMINI_API_KEY` in `.env`.

### When NOT to Use Google Skills

- **Shopify data**: Use shopify skill for orders, products, customers
- **Database queries**: Use postgresql skill for cross-source joins
- **Local files**: Use Read/Write tools for local filesystem
- **Claude text generation**: Use direct conversation, not AI Studio

## Architecture

### Shared Components

All Google services use:

**Authentication:** `lib/google.ts`
- Shared OAuth token management
- Automatic access token refresh
- Unified credential storage

**Scopes:**
```typescript
const ALL_GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/bigquery.readonly",
  "https://www.googleapis.com/auth/bigquery",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/adwords",
];
```

### Directory Structure

```
.claude/skills/google/
├── SKILL.md                    # This file - Overview
├── gmail/
│   ├── SKILL.md               # Gmail documentation
│   └── scripts/
│       └── gmail-client.ts    # Gmail CLI
├── analytics/
│   ├── SKILL.md               # Analytics documentation
│   └── scripts/
│       └── ga-client.ts       # Analytics CLI
├── sheets/
│   ├── SKILL.md               # Sheets documentation
│   ├── references/            # Example queries
│   └── scripts/
│       └── sheets-client.ts   # Sheets CLI
├── drive/
│   ├── SKILL.md               # Drive documentation
│   ├── references/            # MIME types, search syntax
│   │   ├── mime-types.md
│   │   ├── search-syntax.md
│   │   └── export-formats.md
│   └── scripts/
│       └── drive-client.ts    # Drive CLI
├── bigquery/
│   ├── SKILL.md               # BigQuery documentation
│   ├── references/
│   │   └── schemas/           # Cached table schemas
│   └── scripts/
│       └── bq-client.ts       # BigQuery CLI
├── google-ads/
│   ├── SKILL.md               # Google Ads documentation
│   ├── references/
│   │   ├── gaql-syntax.md     # GAQL query reference
│   │   ├── query-templates.md # Pre-built queries
│   │   └── resources.md       # API resources
│   └── scripts/
│       └── google-ads-client.ts # Google Ads CLI
└── ai-studio/
    ├── SKILL.md               # AI Studio documentation
    ├── references/
    │   ├── models.md          # Available models
    │   ├── image-generation.md # Nano Banana Pro guide
    │   └── request-schemas.md # API schemas
    └── scripts/
        └── ai-studio-client.ts # AI Studio CLI
```

## Troubleshooting

### "Request had insufficient authentication scopes"

Your refresh token doesn't have all required scopes.

**Solution:**
```bash
unset GOOGLE_REFRESH_TOKEN
./lib/google-auth.ts
```

### "Missing OAuth credentials"

Environment variables not configured.

**Solution:**
1. Check `.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Run `./lib/google-auth.ts` to get refresh token

### Commands still fail after authentication

Cached environment variable from previous session.

**Solution:**
```bash
unset GOOGLE_REFRESH_TOKEN
# Then run your command
```

See [lib/GOOGLE_AUTH.md](../../lib/GOOGLE_AUTH.md) for comprehensive troubleshooting.

## Security

- **Never commit** `.env` file with credentials
- **Token sharing** - Single refresh token for all Google services
- **Automatic refresh** - Access tokens refresh automatically when expired
- **Read scopes** - Most operations use read-only access where possible
- **Audit logs** - Check Google Cloud Console for API access logs

## API Quotas

Be aware of Google API limits:

| Service | Default Quota | Notes |
|---------|---------------|-------|
| Gmail | 1B quota units/day | Read: 5 units/request |
| Analytics | 50K requests/day | Per property |
| Sheets | 500 requests/100s/user | Read and write |
| Drive | 10K requests/100s/user | All operations |
| BigQuery | 2000 queries/day | Plus per-query byte processing charges |
| Google Ads | 15K queries/day | 3,600 queries/minute |

Monitor usage: [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)

## Additional Resources

- [lib/GOOGLE_AUTH.md](../../lib/GOOGLE_AUTH.md) - Detailed authentication guide
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API](https://developers.google.com/gmail/api)
- [Google Analytics API](https://developers.google.com/analytics)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Drive API](https://developers.google.com/drive/api)
- [BigQuery API](https://cloud.google.com/bigquery/docs/reference/rest)
- [Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- [GAQL Query Language](https://developers.google.com/google-ads/api/docs/query/overview)
