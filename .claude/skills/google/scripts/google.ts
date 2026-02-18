#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write
/**
 * Shared Google API utilities for Claude Code Skills
 *
 * This module provides common functionality for Google APIs including:
 * - OAuth 2.0 authentication
 * - Token management
 * - Authenticated requests
 *
 * Can be run directly to authenticate with all Google API scopes:
 *   ./google.ts
 *
 * Used by skills: Gmail, Google Analytics, Sheets, Drive, BigQuery, Search Console, Google Ads
 */

import "@std/dotenv/load";

// OAuth2 configuration from environment
const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI") || "http://localhost:3000/oauth2callback";
const REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");

// Combined scopes for all Google skills
const ALL_GOOGLE_SCOPES = [
  // Gmail
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
  // Google Calendar (full read/write access)
  "https://www.googleapis.com/auth/calendar",
  // Google Analytics
  "https://www.googleapis.com/auth/analytics.readonly",
  // Google Sheets & Drive (Sheets already includes drive scope)
  "https://www.googleapis.com/auth/spreadsheets",
  // Google Drive (full access)
  "https://www.googleapis.com/auth/drive",
  // BigQuery
  "https://www.googleapis.com/auth/bigquery.readonly",
  "https://www.googleapis.com/auth/bigquery",
  // Google Search Console
  "https://www.googleapis.com/auth/webmasters.readonly",
  // Google Ads
  "https://www.googleapis.com/auth/adwords",
];

/**
 * Get OAuth2 access token from refresh token
 *
 * @param scopes - Optional array of scopes (not used for refresh, but kept for consistency)
 * @returns Access token string
 * @throws Error if credentials are missing or token exchange fails
 */
export async function getAccessToken(scopes?: string[]): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error(
      "Missing OAuth credentials. Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are set in .env. Run 'auth' command first."
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Perform full OAuth 2.0 authentication flow using loopback redirect
 *
 * This function:
 * 1. Starts a local server on 127.0.0.1
 * 2. Opens browser to authorization URL
 * 3. Catches the redirect automatically
 * 4. Exchanges code for tokens
 * 5. Saves refresh token to .env
 *
 * @param scopes - Array of OAuth scopes to request
 * @param serviceName - Name of the service for display (e.g., "Gmail", "Google Analytics")
 * @returns Object with success status and optional refresh token or error
 */
export async function authenticate(
  scopes: string[],
  serviceName: string = "Google API"
): Promise<{ success: boolean; refresh_token?: string; error?: string }> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      success: false,
      error: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env",
    };
  }

  try {
    const { oauthLoopback, saveEnvVar } = await import("lib/oauth.ts");

    const tokens = await oauthLoopback({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes,
      serviceName,
      extraAuthParams: {
        access_type: "offline",
        prompt: "consent",
      },
    });

    // Save refresh token to .env file
    await saveEnvVar("GOOGLE_REFRESH_TOKEN", tokens.refreshToken);

    console.error("\nRefresh token saved to .env");

    return {
      success: true,
      refresh_token: tokens.refreshToken,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Save refresh token to .env file
 *
 * Updates existing GOOGLE_REFRESH_TOKEN or adds it if not present
 *
 * @param refreshToken - The refresh token to save
 */
async function saveRefreshToken(refreshToken: string): Promise<void> {
  const envPath = ".env";
  let envContent = "";

  try {
    envContent = await Deno.readTextFile(envPath);
  } catch {
    // File doesn't exist, create new
  }

  // Update or add GOOGLE_REFRESH_TOKEN
  const lines = envContent.split("\n");
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("GOOGLE_REFRESH_TOKEN=")) {
      lines[i] = `GOOGLE_REFRESH_TOKEN=${refreshToken}`;
      found = true;
      break;
    }
  }

  if (!found) {
    // Add at the end, ensuring there's a newline before if file isn't empty
    if (envContent && !envContent.endsWith("\n")) {
      lines.push("");
    }
    lines.push(`GOOGLE_REFRESH_TOKEN=${refreshToken}`);
  }

  await Deno.writeTextFile(envPath, lines.join("\n"));
}

/**
 * Check if OAuth credentials are configured
 *
 * @returns Object with configuration status and missing fields
 */
export function checkOAuthConfig(): {
  isConfigured: boolean;
  missingFields: string[];
} {
  const missing: string[] = [];

  if (!CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!REFRESH_TOKEN) missing.push("GOOGLE_REFRESH_TOKEN");

  return {
    isConfigured: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Make authenticated request to a Google API
 *
 * @param url - Full URL to request
 * @param options - Fetch options (will be merged with auth header)
 * @param scopes - Optional scopes (for token refresh)
 * @returns Parsed JSON response
 * @throws Error if request fails
 */
export async function authenticatedRequest(
  url: string,
  options: RequestInit = {},
  scopes?: string[]
): Promise<any> {
  const accessToken = await getAccessToken(scopes);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${error}`);
  }

  return response.json();
}

/**
 * Authenticate with all Google API scopes
 *
 * Run this to enable access to all Google skills at once:
 * - Gmail (read, modify, labels)
 * - Google Analytics (read-only)
 * - Google Sheets (read, write)
 * - Google Drive (full access)
 * - BigQuery (read, write)
 * - Search Console (read-only)
 * - Google Ads (full access)
 */
async function authenticateAll(): Promise<void> {
  console.error("🔐 Authenticating with all Google API scopes\n");
  console.error("This will enable access to:");
  console.error("  - Gmail (read, modify, labels)");
  console.error("  - Google Analytics (read-only)");
  console.error("  - Google Sheets (read, write)");
  console.error("  - Google Drive (full access)");
  console.error("  - BigQuery (read, write)");
  console.error("  - Search Console (read-only)");
  console.error("  - Google Ads (full access)\n");

  const result = await authenticate(ALL_GOOGLE_SCOPES, "All Google APIs");

  if (!result.success) {
    console.error(`\n❌ Authentication failed: ${result.error}`);
    Deno.exit(1);
  }

  console.error("\n✅ Successfully authenticated with all Google API scopes!");
  console.error("You can now use all Google skills (Gmail, Analytics, Sheets, Drive, BigQuery, Search Console, Google Ads)");
}

// Run authentication when executed directly
if (import.meta.main) {
  authenticateAll();
}
