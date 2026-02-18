#!/usr/bin/env node

/**
 * Google Search Console MCP Server
 *
 * Provides MCP tools for interacting with the Google Search Console API:
 *   - list_sites: List all verified sites
 *   - query_search_analytics: Query search analytics with flexible dimensions/filters
 *   - top_queries: Get top search queries by clicks
 *   - top_pages: Get top pages by clicks
 *   - inspect_url: Check URL indexing status
 *   - list_sitemaps: List submitted sitemaps
 *
 * Environment variables:
 *   GOOGLE_CLIENT_ID     - Google OAuth client ID
 *   GOOGLE_CLIENT_SECRET - Google OAuth client secret
 *   GOOGLE_REFRESH_TOKEN - Google OAuth refresh token
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEBMASTERS_API_BASE = "https://www.googleapis.com/webmasters/v3";
const SEARCH_CONSOLE_API_BASE = "https://searchconsole.googleapis.com/v1";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// ---------------------------------------------------------------------------
// OAuth Token Management
// ---------------------------------------------------------------------------

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Refresh the Google OAuth access token using the refresh token.
 * Caches the result so subsequent calls within the validity window
 * do not issue additional HTTP requests.
 */
async function getAccessToken() {
  // Return cached token if still valid (with 60-second buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN environment variables."
    );
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh access token: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  // Google tokens typically expire in 3600 seconds
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

  return cachedAccessToken;
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Format a Date object as YYYY-MM-DD.
 */
function formatDate(d) {
  return d.toISOString().split("T")[0];
}

/**
 * Make an authenticated GET request to the Google API.
 */
async function apiGet(url) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google API error (${response.status}): ${errorBody}`);
  }
  return response.json();
}

/**
 * Make an authenticated POST request to the Google API.
 */
async function apiPost(url, body) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google API error (${response.status}): ${errorBody}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// MCP Server Setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "google-search-console",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool: list_sites
// ---------------------------------------------------------------------------

server.tool(
  "list_sites",
  "List all verified sites in Google Search Console",
  {},
  async () => {
    const data = await apiGet(`${WEBMASTERS_API_BASE}/sites`);
    const sites = data.siteEntry || [];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              sites,
              totalSites: sites.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: query_search_analytics
// ---------------------------------------------------------------------------

server.tool(
  "query_search_analytics",
  "Query Google Search Console search analytics data with flexible dimensions and filters",
  {
    siteUrl: z.string().describe("The site URL exactly as it appears in Search Console (e.g. https://www.example.com/ or sc-domain:example.com)"),
    startDate: z.string().describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().describe("End date in YYYY-MM-DD format"),
    dimensions: z
      .array(z.enum(["query", "page", "country", "device", "date", "searchAppearance"]))
      .optional()
      .describe("Dimensions to group results by"),
    searchType: z
      .enum(["web", "image", "video", "news", "discover", "googleNews"])
      .optional()
      .describe("Filter by search type (default: web)"),
    dimensionFilterGroups: z
      .array(
        z.object({
          groupType: z.enum(["and"]).optional(),
          filters: z.array(
            z.object({
              dimension: z.string(),
              operator: z.string(),
              expression: z.string(),
            })
          ),
        })
      )
      .optional()
      .describe("Dimension filter groups for filtering results"),
    aggregationType: z
      .enum(["auto", "byProperty", "byPage"])
      .optional()
      .describe("How data is aggregated"),
    rowLimit: z.number().optional().default(1000).describe("Maximum number of rows to return (default: 1000, max: 25000)"),
    startRow: z.number().optional().default(0).describe("Zero-based row offset for pagination"),
  },
  async (params) => {
    const encodedSiteUrl = encodeURIComponent(params.siteUrl);
    const body = {
      startDate: params.startDate,
      endDate: params.endDate,
      rowLimit: params.rowLimit,
      startRow: params.startRow,
    };
    if (params.dimensions) body.dimensions = params.dimensions;
    if (params.searchType) body.searchType = params.searchType;
    if (params.dimensionFilterGroups) body.dimensionFilterGroups = params.dimensionFilterGroups;
    if (params.aggregationType) body.aggregationType = params.aggregationType;

    const data = await apiPost(
      `${WEBMASTERS_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
      body
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              siteUrl: params.siteUrl,
              dateRange: { startDate: params.startDate, endDate: params.endDate },
              dimensions: params.dimensions || [],
              rows: data.rows || [],
              rowCount: data.rows?.length || 0,
              responseAggregationType: data.responseAggregationType,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: top_queries
// ---------------------------------------------------------------------------

server.tool(
  "top_queries",
  "Get top search queries by clicks for a site. Data has a ~3 day delay.",
  {
    siteUrl: z.string().describe("The site URL exactly as it appears in Search Console"),
    days: z.number().optional().default(28).describe("Number of days to look back (default: 28)"),
    limit: z.number().optional().default(25).describe("Max number of queries to return (default: 25)"),
  },
  async (params) => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3); // ~3 day data delay
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - params.days);

    const encodedSiteUrl = encodeURIComponent(params.siteUrl);
    const data = await apiPost(
      `${WEBMASTERS_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["query"],
        rowLimit: params.limit,
      }
    );

    const formattedRows = (data.rows || []).map((row) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: (row.ctr * 100).toFixed(2) + "%",
      position: row.position.toFixed(1),
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              siteUrl: params.siteUrl,
              dateRange: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
              },
              days: params.days,
              topQueries: formattedRows,
              totalQueries: formattedRows.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: top_pages
// ---------------------------------------------------------------------------

server.tool(
  "top_pages",
  "Get top pages by clicks for a site. Data has a ~3 day delay.",
  {
    siteUrl: z.string().describe("The site URL exactly as it appears in Search Console"),
    days: z.number().optional().default(28).describe("Number of days to look back (default: 28)"),
    limit: z.number().optional().default(25).describe("Max number of pages to return (default: 25)"),
  },
  async (params) => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - params.days);

    const encodedSiteUrl = encodeURIComponent(params.siteUrl);
    const data = await apiPost(
      `${WEBMASTERS_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["page"],
        rowLimit: params.limit,
      }
    );

    const formattedRows = (data.rows || []).map((row) => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: (row.ctr * 100).toFixed(2) + "%",
      position: row.position.toFixed(1),
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              siteUrl: params.siteUrl,
              dateRange: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
              },
              days: params.days,
              topPages: formattedRows,
              totalPages: formattedRows.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: inspect_url
// ---------------------------------------------------------------------------

server.tool(
  "inspect_url",
  "Inspect a URL's indexing status in Google Search Console. Returns crawl, index, and serving information.",
  {
    siteUrl: z.string().describe("The site URL exactly as it appears in Search Console"),
    inspectionUrl: z.string().describe("The fully-qualified URL to inspect (must belong to the specified site)"),
  },
  async (params) => {
    const data = await apiPost(
      `${SEARCH_CONSOLE_API_BASE}/urlInspection/index:inspect`,
      {
        inspectionUrl: params.inspectionUrl,
        siteUrl: params.siteUrl,
      }
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              inspectedUrl: params.inspectionUrl,
              result: data.inspectionResult,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: list_sitemaps
// ---------------------------------------------------------------------------

server.tool(
  "list_sitemaps",
  "List all submitted sitemaps for a site in Google Search Console",
  {
    siteUrl: z.string().describe("The site URL exactly as it appears in Search Console"),
  },
  async (params) => {
    const encodedSiteUrl = encodeURIComponent(params.siteUrl);
    const data = await apiGet(
      `${WEBMASTERS_API_BASE}/sites/${encodedSiteUrl}/sitemaps`
    );

    const sitemaps = data.sitemap || [];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              siteUrl: params.siteUrl,
              sitemaps,
              totalSitemaps: sitemaps.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
