#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Google Search Console API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write gsc-client.ts <command> [args...]
 *
 * Commands:
 *   auth                                              - Authenticate and obtain refresh token
 *   list-sites                                        - List all verified sites
 *   query <site-url> <start-date> <end-date> [dim]   - Query search analytics
 *   top-queries <site-url> [days] [limit]            - Get top search queries by clicks
 *   top-pages <site-url> [days] [limit]              - Get top pages by clicks
 *   inspect-url <site-url> <url-to-inspect>          - Check URL indexing status
 *   list-sitemaps <site-url>                         - List submitted sitemaps
 */

import "@std/dotenv/load";
import { getAccessToken as getSharedOAuthToken, authenticate as authenticateOAuth } from "../../scripts/google.ts";

// API Base URLs
const WEBMASTERS_API_BASE = "https://www.googleapis.com/webmasters/v3";
const SEARCH_CONSOLE_API_BASE = "https://searchconsole.googleapis.com/v1";

// Search Analytics Types
interface SearchAnalyticsQuery {
  startDate: string;
  endDate: string;
  dimensions?: string[];
  searchType?: "web" | "image" | "video" | "news" | "discover" | "googleNews";
  dimensionFilterGroups?: Array<{
    groupType?: "and";
    filters: Array<{
      dimension: string;
      operator: string;
      expression: string;
    }>;
  }>;
  aggregationType?: "auto" | "byProperty" | "byPage";
  rowLimit?: number;
  startRow?: number;
}

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

interface Site {
  siteUrl: string;
  permissionLevel: string;
}

interface Sitemap {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  lastDownloaded?: string;
  warnings?: string;
  errors?: string;
  contents?: Array<{
    type: string;
    submitted?: string;
    indexed?: string;
  }>;
}

/**
 * Get access token using shared Google OAuth
 */
async function getAccessToken(): Promise<string> {
  const token = await getSharedOAuthToken();
  if (!token) {
    throw new Error(
      "No access token available. Run './lib/google-auth.ts' to authenticate."
    );
  }
  return token;
}

/**
 * Authenticate user with Google OAuth
 */
async function authenticate(): Promise<void> {
  console.log("Authenticating with Google OAuth...");
  console.log("For Search Console, use the unified authentication:");
  console.log("  ./lib/google-auth.ts");
  console.log("");
  console.log("This grants access to Search Console along with other Google services.");

  // Attempt authentication
  try {
    await authenticateOAuth();
    console.log("\nAuthentication successful!");
  } catch (error) {
    console.error("\nAuthentication failed:", error.message);
  }
}

/**
 * List all verified sites in Search Console
 */
async function listSites(): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${WEBMASTERS_API_BASE}/sites`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(JSON.stringify({
      success: false,
      error: `Search Console API error: ${error}`,
    }));
    return;
  }

  const data = await response.json();
  console.log(JSON.stringify({
    success: true,
    sites: data.siteEntry || [],
    totalSites: data.siteEntry?.length || 0,
  }, null, 2));
}

/**
 * Query search analytics data
 */
async function querySearchAnalytics(
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimension?: string,
  rowLimit: number = 1000
): Promise<void> {
  const accessToken = await getAccessToken();

  const queryBody: SearchAnalyticsQuery = {
    startDate,
    endDate,
    rowLimit,
  };

  if (dimension) {
    queryBody.dimensions = [dimension];
  }

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const response = await fetch(
    `${WEBMASTERS_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.log(JSON.stringify({
      success: false,
      error: `Search Console API error: ${error}`,
    }));
    return;
  }

  const data: SearchAnalyticsResponse = await response.json();
  console.log(JSON.stringify({
    success: true,
    siteUrl,
    dateRange: { startDate, endDate },
    dimension: dimension || "none",
    rows: data.rows || [],
    rowCount: data.rows?.length || 0,
    responseAggregationType: data.responseAggregationType,
  }, null, 2));
}

/**
 * Get top search queries by clicks
 */
async function getTopQueries(
  siteUrl: string,
  days: number = 28,
  limit: number = 25
): Promise<void> {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3); // Data has ~3 day delay
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const accessToken = await getAccessToken();

  const queryBody: SearchAnalyticsQuery = {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ["query"],
    rowLimit: limit,
  };

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const response = await fetch(
    `${WEBMASTERS_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.log(JSON.stringify({
      success: false,
      error: `Search Console API error: ${error}`,
    }));
    return;
  }

  const data: SearchAnalyticsResponse = await response.json();

  // Format output with query as first column
  const formattedRows = (data.rows || []).map((row) => ({
    query: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: (row.ctr * 100).toFixed(2) + "%",
    position: row.position.toFixed(1),
  }));

  console.log(JSON.stringify({
    success: true,
    siteUrl,
    dateRange: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
    days,
    topQueries: formattedRows,
    totalQueries: formattedRows.length,
  }, null, 2));
}

/**
 * Get top pages by clicks
 */
async function getTopPages(
  siteUrl: string,
  days: number = 28,
  limit: number = 25
): Promise<void> {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const accessToken = await getAccessToken();

  const queryBody: SearchAnalyticsQuery = {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ["page"],
    rowLimit: limit,
  };

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const response = await fetch(
    `${WEBMASTERS_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.log(JSON.stringify({
      success: false,
      error: `Search Console API error: ${error}`,
    }));
    return;
  }

  const data: SearchAnalyticsResponse = await response.json();

  const formattedRows = (data.rows || []).map((row) => ({
    page: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: (row.ctr * 100).toFixed(2) + "%",
    position: row.position.toFixed(1),
  }));

  console.log(JSON.stringify({
    success: true,
    siteUrl,
    dateRange: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
    days,
    topPages: formattedRows,
    totalPages: formattedRows.length,
  }, null, 2));
}

/**
 * Inspect URL indexing status
 */
async function inspectUrl(siteUrl: string, urlToInspect: string): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${SEARCH_CONSOLE_API_BASE}/urlInspection/index:inspect`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl: urlToInspect,
        siteUrl: siteUrl,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.log(JSON.stringify({
      success: false,
      error: `URL Inspection API error: ${error}`,
    }));
    return;
  }

  const data = await response.json();
  console.log(JSON.stringify({
    success: true,
    inspectedUrl: urlToInspect,
    result: data.inspectionResult,
  }, null, 2));
}

/**
 * List sitemaps for a site
 */
async function listSitemaps(siteUrl: string): Promise<void> {
  const accessToken = await getAccessToken();

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const response = await fetch(
    `${WEBMASTERS_API_BASE}/sites/${encodedSiteUrl}/sitemaps`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.log(JSON.stringify({
      success: false,
      error: `Search Console API error: ${error}`,
    }));
    return;
  }

  const data = await response.json();
  console.log(JSON.stringify({
    success: true,
    siteUrl,
    sitemaps: data.sitemap || [],
    totalSitemaps: data.sitemap?.length || 0,
  }, null, 2));
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`Usage: gsc-client.ts <command> [args...]

Commands:
  auth                                              - Authenticate with Google OAuth
  list-sites                                        - List all verified sites
  query <site-url> <start-date> <end-date> [dim]   - Query search analytics
  top-queries <site-url> [days] [limit]            - Get top search queries by clicks
  top-pages <site-url> [days] [limit]              - Get top pages by clicks
  inspect-url <site-url> <url-to-inspect>          - Check URL indexing status
  list-sitemaps <site-url>                         - List submitted sitemaps

Examples:
  gsc-client.ts list-sites
  gsc-client.ts top-queries https://www.example.com/ 30 50
  gsc-client.ts top-pages https://www.example.com/ 28 25
  gsc-client.ts query https://www.example.com/ 2024-01-01 2024-01-31 query
  gsc-client.ts inspect-url https://www.example.com/ https://www.example.com/products/example-product

Date Format:
  Use YYYY-MM-DD format (e.g., 2024-01-01)
  Data is typically available with a ~3 day delay

Dimensions:
  query    - Search queries (keywords)
  page     - Landing pages
  country  - Country codes
  device   - Device type (DESKTOP, MOBILE, TABLET)`);
}

// Main execution
const command = Deno.args[0];

switch (command) {
  case "auth":
    await authenticate();
    break;

  case "list-sites":
    await listSites();
    break;

  case "query": {
    const siteUrl = Deno.args[1];
    const startDate = Deno.args[2];
    const endDate = Deno.args[3];
    const dimension = Deno.args[4];

    if (!siteUrl || !startDate || !endDate) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: query <site-url> <start-date> <end-date> [dimension]",
      }));
      break;
    }

    await querySearchAnalytics(siteUrl, startDate, endDate, dimension);
    break;
  }

  case "top-queries": {
    const siteUrl = Deno.args[1];
    const days = parseInt(Deno.args[2]) || 28;
    const limit = parseInt(Deno.args[3]) || 25;

    if (!siteUrl) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: top-queries <site-url> [days] [limit]",
      }));
      break;
    }

    await getTopQueries(siteUrl, days, limit);
    break;
  }

  case "top-pages": {
    const siteUrl = Deno.args[1];
    const days = parseInt(Deno.args[2]) || 28;
    const limit = parseInt(Deno.args[3]) || 25;

    if (!siteUrl) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: top-pages <site-url> [days] [limit]",
      }));
      break;
    }

    await getTopPages(siteUrl, days, limit);
    break;
  }

  case "inspect-url": {
    const siteUrl = Deno.args[1];
    const urlToInspect = Deno.args[2];

    if (!siteUrl || !urlToInspect) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: inspect-url <site-url> <url-to-inspect>",
      }));
      break;
    }

    await inspectUrl(siteUrl, urlToInspect);
    break;
  }

  case "list-sitemaps": {
    const siteUrl = Deno.args[1];

    if (!siteUrl) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: list-sitemaps <site-url>",
      }));
      break;
    }

    await listSitemaps(siteUrl);
    break;
  }

  default:
    printUsage();
}
