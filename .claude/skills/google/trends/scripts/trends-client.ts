#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Google Trends API Client for Claude Code Skill
 *
 * NOTE: The Google Trends API is currently in ALPHA (launched July 2025).
 * Apply for access at: https://developers.google.com/search/apis/trends
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read trends-client.ts <command> [args...]
 *
 * Commands:
 *   interest-over-time "<terms>" [--start YYYY-MM-DD] [--end YYYY-MM-DD] [--geo CC]
 *   interest-by-region "<term>" [--geo CC] [--resolution COUNTRY|REGION|CITY]
 *   related-queries "<term>" [--geo CC]
 *   related-topics "<term>" [--geo CC]
 *   status                                    - Check API access status
 */

import "@std/dotenv/load";

// API Configuration
const TRENDS_API_BASE = "https://trends.googleapis.com/trends/v1beta";
const API_KEY = Deno.env.get("GOOGLE_TRENDS_API_KEY");

// Types
interface TrendsTimelineData {
  date: string;
  values: Record<string, number>;
}

interface TrendsRegionData {
  name: string;
  code: string;
  value: number;
}

interface TrendsRelatedQuery {
  query: string;
  value: number | string;
}

/**
 * Make authenticated request to Google Trends API
 */
async function trendsApiRequest(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any> {
  if (!API_KEY) {
    throw new Error(
      "GOOGLE_TRENDS_API_KEY not set. The Trends API is in alpha - apply at https://developers.google.com/search/apis/trends"
    );
  }

  const url = new URL(`${TRENDS_API_BASE}${endpoint}`);
  url.searchParams.set("key", API_KEY);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Trends API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Get interest over time for one or more terms
 */
async function getInterestOverTime(
  terms: string[],
  startDate?: string,
  endDate?: string,
  geo: string = ""
) {
  try {
    // Default to last 12 months if no dates provided
    const end = endDate || new Date().toISOString().split("T")[0];
    const start =
      startDate ||
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const params: Record<string, string> = {
      terms: terms.join(","),
      startDate: start,
      endDate: end,
    };

    if (geo) {
      params.geo = geo;
    }

    const data = await trendsApiRequest("/interestOverTime", params);

    // Transform to readable format
    const timeline: TrendsTimelineData[] = [];

    if (data.timelineData) {
      for (const point of data.timelineData) {
        const values: Record<string, number> = {};
        for (let i = 0; i < terms.length; i++) {
          values[terms[i]] = point.value?.[i] ?? 0;
        }
        timeline.push({
          date: point.formattedTime || point.time,
          values,
        });
      }
    }

    return {
      success: true,
      terms,
      dateRange: { start, end },
      geo: geo || "worldwide",
      data: timeline,
      dataPoints: timeline.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      terms,
    };
  }
}

/**
 * Get interest by geographic region
 */
async function getInterestByRegion(
  term: string,
  geo: string = "",
  resolution: string = "COUNTRY"
) {
  try {
    const params: Record<string, string> = {
      terms: term,
      resolution,
    };

    if (geo) {
      params.geo = geo;
    }

    const data = await trendsApiRequest("/interestByRegion", params);

    // Transform to readable format
    const regions: TrendsRegionData[] = (data.geoMapData || []).map(
      (region: any) => ({
        name: region.geoName,
        code: region.geoCode,
        value: region.value?.[0] ?? 0,
      })
    );

    // Sort by value descending
    regions.sort((a, b) => b.value - a.value);

    return {
      success: true,
      term,
      geo: geo || "worldwide",
      resolution,
      regions,
      regionCount: regions.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      term,
    };
  }
}

/**
 * Get related queries for a term
 */
async function getRelatedQueries(term: string, geo: string = "") {
  try {
    const params: Record<string, string> = {
      terms: term,
    };

    if (geo) {
      params.geo = geo;
    }

    const data = await trendsApiRequest("/relatedQueries", params);

    const top: TrendsRelatedQuery[] = (data.default?.rankedList?.[0]?.rankedKeyword || []).map(
      (item: any) => ({
        query: item.query,
        value: item.value,
      })
    );

    const rising: TrendsRelatedQuery[] = (data.default?.rankedList?.[1]?.rankedKeyword || []).map(
      (item: any) => ({
        query: item.query,
        value: item.formattedValue || `+${item.value}%`,
      })
    );

    return {
      success: true,
      term,
      geo: geo || "worldwide",
      top,
      topCount: top.length,
      rising,
      risingCount: rising.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      term,
    };
  }
}

/**
 * Get related topics for a term
 */
async function getRelatedTopics(term: string, geo: string = "") {
  try {
    const params: Record<string, string> = {
      terms: term,
    };

    if (geo) {
      params.geo = geo;
    }

    const data = await trendsApiRequest("/relatedTopics", params);

    const top = (data.default?.rankedList?.[0]?.rankedKeyword || []).map(
      (item: any) => ({
        topic: item.topic?.title,
        type: item.topic?.type,
        value: item.value,
      })
    );

    const rising = (data.default?.rankedList?.[1]?.rankedKeyword || []).map(
      (item: any) => ({
        topic: item.topic?.title,
        type: item.topic?.type,
        value: item.formattedValue || `+${item.value}%`,
      })
    );

    return {
      success: true,
      term,
      geo: geo || "worldwide",
      top,
      topCount: top.length,
      rising,
      risingCount: rising.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      term,
    };
  }
}

/**
 * Check API status and access
 */
async function checkStatus() {
  if (!API_KEY) {
    return {
      success: false,
      status: "not_configured",
      message:
        "GOOGLE_TRENDS_API_KEY not set in .env",
      instructions: [
        "The Google Trends API is currently in ALPHA (launched July 2025).",
        "",
        "To get access:",
        "1. Apply at: https://developers.google.com/search/apis/trends",
        "2. Wait for approval (rolling acceptance)",
        "3. Add your API key to .env:",
        '   GOOGLE_TRENDS_API_KEY="your-api-key"',
        "",
        "Alternative: Use browser automation with trends.google.com",
        "See: .claude/skills/seo/references/workflows/ for browser-based workflows",
      ],
    };
  }

  try {
    // Try a simple query to verify access
    await trendsApiRequest("/interestOverTime", {
      terms: "test",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });

    return {
      success: true,
      status: "active",
      message: "Google Trends API access is working",
      apiKey: API_KEY.substring(0, 8) + "...",
    };
  } catch (error: any) {
    return {
      success: false,
      status: "error",
      message: error.message,
      apiKey: API_KEY.substring(0, 8) + "...",
    };
  }
}

/**
 * Parse command line arguments for flags
 */
function parseArgs(args: string[]): {
  positional: string[];
  flags: Record<string, string>;
} {
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
      flags[key] = value;
      if (value !== "true") i++;
    } else {
      positional.push(args[i]);
    }
  }

  return { positional, flags };
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`Google Trends API Client

NOTE: API is in ALPHA - apply for access at:
https://developers.google.com/search/apis/trends

Usage: trends-client.ts <command> [args...]

Commands:
  interest-over-time "<terms>" [options]    - Get search interest over time
  interest-by-region "<term>" [options]     - Get geographic breakdown
  related-queries "<term>" [options]        - Find related search queries
  related-topics "<term>" [options]         - Find related topics
  status                                    - Check API access status

Options:
  --start YYYY-MM-DD    Start date (default: 12 months ago)
  --end YYYY-MM-DD      End date (default: today)
  --geo CC              Country code (e.g., US, GB, CA)
  --resolution TYPE     COUNTRY, REGION, or CITY (for interest-by-region)

Examples:
  # Search interest for one term
  trends-client.ts interest-over-time "corduroy shorts"

  # Compare multiple terms
  trends-client.ts interest-over-time "corduroy shorts,dolphin shorts,bell bottoms"

  # Interest in US over custom date range
  trends-client.ts interest-over-time "shorts" --geo US --start 2024-01-01 --end 2024-12-31

  # Geographic breakdown by US state
  trends-client.ts interest-by-region "vintage shorts" --geo US --resolution REGION

  # Find rising related queries
  trends-client.ts related-queries "retro fashion"

  # Check API status
  trends-client.ts status

Country Codes:
  US - United States
  GB - United Kingdom
  CA - Canada
  AU - Australia
  DE - Germany
  FR - France`);
}

// Main CLI handler
const { positional, flags } = parseArgs(Deno.args);
const command = positional[0];

let result: any;

switch (command) {
  case "interest-over-time": {
    const termsArg = positional[1];
    if (!termsArg) {
      result = {
        success: false,
        error: 'Usage: interest-over-time "<term1,term2>" [--start DATE] [--end DATE] [--geo CC]',
      };
    } else {
      const terms = termsArg.split(",").map((t) => t.trim());
      result = await getInterestOverTime(
        terms,
        flags.start,
        flags.end,
        flags.geo
      );
    }
    break;
  }

  case "interest-by-region": {
    const term = positional[1];
    if (!term) {
      result = {
        success: false,
        error:
          'Usage: interest-by-region "<term>" [--geo CC] [--resolution COUNTRY|REGION|CITY]',
      };
    } else {
      result = await getInterestByRegion(
        term,
        flags.geo,
        flags.resolution || "COUNTRY"
      );
    }
    break;
  }

  case "related-queries": {
    const term = positional[1];
    if (!term) {
      result = {
        success: false,
        error: 'Usage: related-queries "<term>" [--geo CC]',
      };
    } else {
      result = await getRelatedQueries(term, flags.geo);
    }
    break;
  }

  case "related-topics": {
    const term = positional[1];
    if (!term) {
      result = {
        success: false,
        error: 'Usage: related-topics "<term>" [--geo CC]',
      };
    } else {
      result = await getRelatedTopics(term, flags.geo);
    }
    break;
  }

  case "status":
    result = await checkStatus();
    break;

  case "help":
  case "--help":
  case "-h":
    printUsage();
    Deno.exit(0);
    break;

  default:
    if (command) {
      result = {
        success: false,
        error: `Unknown command: ${command}`,
        hint: "Run 'trends-client.ts help' for usage",
      };
    } else {
      printUsage();
      Deno.exit(0);
    }
}

if (result) {
  console.log(JSON.stringify(result, null, 2));
}
