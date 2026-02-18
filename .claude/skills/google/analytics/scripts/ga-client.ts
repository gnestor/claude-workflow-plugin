#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Google Analytics API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write ga-client.ts <command> [args...]
 *
 * Commands:
 *   auth                                              - Authenticate and obtain refresh token
 *   list-accounts                                     - List all GA4 accounts and properties
 *   get-property <property-id>                        - Get property details including custom dimensions/metrics
 *   run-report <property-id> <params-json>            - Run a standard analytics report
 *   realtime-report <property-id> <params-json>       - Run a real-time analytics report
 *   visitors <property-id> [start-date] [end-date]    - Get visitor stats (dates: YYYY-MM-DD, 'today', '7daysAgo', etc.)
 *   top-pages <property-id> [days] [limit]            - Get top pages by pageviews
 *   traffic-sources <property-id> [days] [limit]      - Get traffic by source/medium
 *   device-breakdown <property-id> [days]             - Get traffic by device category
 *   active-users <property-id>                        - Get current real-time active users
 */

import "@std/dotenv/load";
import { getAccessToken as getSharedOAuthToken, authenticate as authenticateOAuth } from "../../scripts/google.ts";

// Google Analytics API types
interface DateRange {
  startDate: string;
  endDate: string;
}

interface Dimension {
  name: string;
}

interface Metric {
  name: string;
}

interface OrderBy {
  metric?: { metricName: string };
  dimension?: { dimensionName: string };
  desc?: boolean;
}

interface RunReportRequest {
  dateRanges: DateRange[];
  dimensions?: Dimension[];
  metrics: Metric[];
  dimensionFilter?: any;
  metricFilter?: any;
  orderBys?: OrderBy[];
  limit?: number;
  offset?: number;
}

interface ReportRow {
  dimensionValues?: Array<{ value: string }>;
  metricValues?: Array<{ value: string }>;
}

interface RunReportResponse {
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type: string }>;
  rows?: ReportRow[];
  rowCount?: number;
  metadata?: any;
}

interface AccountSummary {
  name: string;
  account: string;
  displayName: string;
  propertySummaries?: Array<{
    property: string;
    displayName: string;
  }>;
}

interface Property {
  name: string;
  displayName: string;
  timeZone: string;
  currencyCode: string;
  industryCategory: string;
  createTime: string;
}

// OAuth2 configuration
const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
];

// Service Account configuration (alternative to OAuth)
const SERVICE_ACCOUNT_EMAIL = Deno.env.get("GA_SERVICE_ACCOUNT_EMAIL");
const SERVICE_ACCOUNT_KEY = Deno.env.get("GA_SERVICE_ACCOUNT_KEY");

/**
 * Get access token (tries service account first, then OAuth2)
 */
async function getAccessToken(): Promise<string> {
  // Try service account first if configured
  if (SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_KEY) {
    return getServiceAccountToken();
  }

  // Fall back to shared OAuth2 implementation
  return getSharedOAuthToken(SCOPES);
}

/**
 * Get access token using Service Account (JWT)
 */
async function getServiceAccountToken(): Promise<string> {
  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY) {
    throw new Error("Service account credentials not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claimSet = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: SCOPES.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: expiry,
    iat: now,
  };

  // Encode JWT
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedClaims = btoa(JSON.stringify(claimSet));
  const unsignedToken = `${encodedHeader}.${encodedClaims}`;

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(SERVICE_ACCOUNT_KEY),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${unsignedToken}.${encodedSignature}`;

  // Exchange JWT for access token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get service account token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Convert PEM to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Make authenticated request to Analytics Admin API
 */
async function adminApiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://analyticsadmin.googleapis.com/v1beta${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Analytics Admin API error: ${error}`);
  }

  return response.json();
}

/**
 * Make authenticated request to Analytics Data API
 */
async function dataApiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Analytics Data API error: ${error}`);
  }

  return response.json();
}

/**
 * Authenticate with Google Analytics using OAuth2
 */
async function authenticate() {
  return authenticateOAuth(SCOPES, "Google Analytics");
}

/**
 * List all GA4 accounts and properties
 */
async function listAccounts() {
  try {
    const data = await adminApiRequest("/accountSummaries");

    const accounts = (data.accountSummaries || []).map((summary: AccountSummary) => ({
      account: summary.account,
      displayName: summary.displayName,
      properties: (summary.propertySummaries || []).map((prop) => ({
        property: prop.property,
        displayName: prop.displayName,
        propertyId: prop.property.split("/")[1],
      })),
    }));

    return {
      success: true,
      accounts,
      totalAccounts: accounts.length,
      totalProperties: accounts.reduce((sum, acc) => sum + acc.properties.length, 0),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get property details including custom dimensions and metrics
 */
async function getProperty(propertyId: string) {
  try {
    // Ensure property ID is in correct format
    const propId = propertyId.startsWith("properties/")
      ? propertyId
      : `properties/${propertyId}`;

    const property = await adminApiRequest(`/${propId}`);

    return {
      success: true,
      property: {
        name: property.name,
        displayName: property.displayName,
        timeZone: property.timeZone,
        currencyCode: property.currencyCode,
        industryCategory: property.industryCategory,
        createTime: property.createTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run a standard analytics report
 */
async function runReport(propertyId: string, requestParams: RunReportRequest) {
  try {
    const propId = propertyId.startsWith("properties/")
      ? propertyId
      : `properties/${propertyId}`;

    const data = await dataApiRequest(`/${propId}:runReport`, {
      method: "POST",
      body: JSON.stringify(requestParams),
    });

    return {
      success: true,
      report: {
        dimensionHeaders: data.dimensionHeaders?.map((h: any) => h.name) || [],
        metricHeaders: data.metricHeaders?.map((h: any) => ({
          name: h.name,
          type: h.type,
        })) || [],
        rows: data.rows || [],
        rowCount: data.rowCount || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run a real-time analytics report
 */
async function runRealtimeReport(propertyId: string, requestParams: any) {
  try {
    const propId = propertyId.startsWith("properties/")
      ? propertyId
      : `properties/${propertyId}`;

    const data = await dataApiRequest(`/${propId}:runRealtimeReport`, {
      method: "POST",
      body: JSON.stringify(requestParams),
    });

    return {
      success: true,
      report: {
        dimensionHeaders: data.dimensionHeaders?.map((h: any) => h.name) || [],
        metricHeaders: data.metricHeaders?.map((h: any) => ({
          name: h.name,
          type: h.type,
        })) || [],
        rows: data.rows || [],
        rowCount: data.rowCount || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get top pages by pageviews
 */
async function getTopPages(propertyId: string, days: number = 7, limit: number = 10) {
  const request: RunReportRequest = {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "activeUsers" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  };

  return runReport(propertyId, request);
}

/**
 * Get traffic by source/medium
 */
async function getTrafficSources(propertyId: string, days: number = 7, limit: number = 20) {
  const request: RunReportRequest = {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "conversions" },
    ],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit,
  };

  return runReport(propertyId, request);
}

/**
 * Get traffic breakdown by device
 */
async function getDeviceBreakdown(propertyId: string, days: number = 7) {
  const request: RunReportRequest = {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  };

  return runReport(propertyId, request);
}

/**
 * Get current active users (real-time)
 */
async function getActiveUsers(propertyId: string) {
  const request = {
    metrics: [{ name: "activeUsers" }],
    dimensions: [{ name: "deviceCategory" }, { name: "country" }],
  };

  return runRealtimeReport(propertyId, request);
}

/**
 * Get visitor statistics for a date range
 */
async function getVisitors(propertyId: string, startDate: string = "today", endDate: string = "today") {
  const request: RunReportRequest = {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: "totalUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
      { name: "averageSessionDuration" },
    ],
  };

  return runReport(propertyId, request);
}

// Main CLI handler
async function main() {
  const args = Deno.args;
  const command = args[0];

  if (!command) {
    console.error("Usage: ga-client.ts <command> [args...]");
    console.error("\nCommands:");
    console.error("  auth                                  - Authenticate with Google Analytics");
    console.error("  list-accounts                         - List all accounts and properties");
    console.error("  get-property <property-id>            - Get property details");
    console.error("  run-report <property-id> <json>       - Run custom report");
    console.error("  realtime-report <property-id> <json>  - Run real-time report");
    console.error("  visitors <property-id> [start-date] [end-date] - Get visitor stats (dates: YYYY-MM-DD or 'today', '7daysAgo', etc.)");
    console.error("  top-pages <property-id> [days] [limit]");
    console.error("  traffic-sources <property-id> [days] [limit]");
    console.error("  device-breakdown <property-id> [days]");
    console.error("  active-users <property-id>");
    Deno.exit(1);
  }

  let result: any;

  switch (command) {
    case "auth":
      result = await authenticate();
      break;

    case "list-accounts":
      result = await listAccounts();
      break;

    case "get-property":
      if (!args[1]) {
        console.error("Usage: get-property <property-id>");
        Deno.exit(1);
      }
      result = await getProperty(args[1]);
      break;

    case "run-report":
      if (!args[1] || !args[2]) {
        console.error("Usage: run-report <property-id> <params-json>");
        Deno.exit(1);
      }
      result = await runReport(args[1], JSON.parse(args[2]));
      break;

    case "realtime-report":
      if (!args[1] || !args[2]) {
        console.error("Usage: realtime-report <property-id> <params-json>");
        Deno.exit(1);
      }
      result = await runRealtimeReport(args[1], JSON.parse(args[2]));
      break;

    case "top-pages":
      if (!args[1]) {
        console.error("Usage: top-pages <property-id> [days] [limit]");
        Deno.exit(1);
      }
      result = await getTopPages(
        args[1],
        args[2] ? parseInt(args[2]) : 7,
        args[3] ? parseInt(args[3]) : 10
      );
      break;

    case "traffic-sources":
      if (!args[1]) {
        console.error("Usage: traffic-sources <property-id> [days] [limit]");
        Deno.exit(1);
      }
      result = await getTrafficSources(
        args[1],
        args[2] ? parseInt(args[2]) : 7,
        args[3] ? parseInt(args[3]) : 20
      );
      break;

    case "device-breakdown":
      if (!args[1]) {
        console.error("Usage: device-breakdown <property-id> [days]");
        Deno.exit(1);
      }
      result = await getDeviceBreakdown(
        args[1],
        args[2] ? parseInt(args[2]) : 7
      );
      break;

    case "visitors":
      if (!args[1]) {
        console.error("Usage: visitors <property-id> [start-date] [end-date]");
        Deno.exit(1);
      }
      result = await getVisitors(
        args[1],
        args[2] || "today",
        args[3] || args[2] || "today"
      );
      break;

    case "active-users":
      if (!args[1]) {
        console.error("Usage: active-users <property-id>");
        Deno.exit(1);
      }
      result = await getActiveUsers(args[1]);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      Deno.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

// Run main function
if (import.meta.main) {
  main().catch((error) => {
    console.error(JSON.stringify({ success: false, error: error.message }, null, 2));
    Deno.exit(1);
  });
}
