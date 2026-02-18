#!/usr/bin/env node

/**
 * Google Trends MCP Server
 *
 * Exposes the Google Trends API (v1beta) as MCP tools.
 *
 * NOTE: The Google Trends API is currently in ALPHA (launched July 2025).
 * Apply for access at: https://developers.google.com/search/apis/trends
 *
 * Environment variables:
 *   GOOGLE_TRENDS_API_KEY - API key for Google Trends API
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// API configuration
// ---------------------------------------------------------------------------

const TRENDS_API_BASE = "https://trends.googleapis.com/trends/v1beta";

function getApiKey() {
  const key = process.env.GOOGLE_TRENDS_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_TRENDS_API_KEY not set. The Trends API is in alpha — apply at https://developers.google.com/search/apis/trends"
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function trendsApiRequest(endpoint, params = {}) {
  const apiKey = getApiKey();
  const url = new URL(`${TRENDS_API_BASE}${endpoint}`);
  url.searchParams.set("key", apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Google Trends API error (${response.status}): ${errorBody}`
    );
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Tool implementations (mirroring the Deno script)
// ---------------------------------------------------------------------------

async function getInterestOverTime(terms, startDate, endDate, geo) {
  const end = endDate || new Date().toISOString().split("T")[0];
  const start =
    startDate ||
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

  const params = {
    terms: terms.join(","),
    startDate: start,
    endDate: end,
  };

  if (geo) {
    params.geo = geo;
  }

  const data = await trendsApiRequest("/interestOverTime", params);

  const timeline = [];
  if (data.timelineData) {
    for (const point of data.timelineData) {
      const values = {};
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
}

async function getInterestByRegion(term, geo, resolution) {
  const params = {
    terms: term,
    resolution: resolution || "COUNTRY",
  };

  if (geo) {
    params.geo = geo;
  }

  const data = await trendsApiRequest("/interestByRegion", params);

  const regions = (data.geoMapData || []).map((region) => ({
    name: region.geoName,
    code: region.geoCode,
    value: region.value?.[0] ?? 0,
  }));

  // Sort by value descending
  regions.sort((a, b) => b.value - a.value);

  return {
    success: true,
    term,
    geo: geo || "worldwide",
    resolution: resolution || "COUNTRY",
    regions,
    regionCount: regions.length,
  };
}

async function getRelatedQueries(term, geo) {
  const params = { terms: term };

  if (geo) {
    params.geo = geo;
  }

  const data = await trendsApiRequest("/relatedQueries", params);

  const top = (
    data.default?.rankedList?.[0]?.rankedKeyword || []
  ).map((item) => ({
    query: item.query,
    value: item.value,
  }));

  const rising = (
    data.default?.rankedList?.[1]?.rankedKeyword || []
  ).map((item) => ({
    query: item.query,
    value: item.formattedValue || `+${item.value}%`,
  }));

  return {
    success: true,
    term,
    geo: geo || "worldwide",
    top,
    topCount: top.length,
    rising,
    risingCount: rising.length,
  };
}

async function getRelatedTopics(term, geo) {
  const params = { terms: term };

  if (geo) {
    params.geo = geo;
  }

  const data = await trendsApiRequest("/relatedTopics", params);

  const top = (
    data.default?.rankedList?.[0]?.rankedKeyword || []
  ).map((item) => ({
    topic: item.topic?.title,
    type: item.topic?.type,
    value: item.value,
  }));

  const rising = (
    data.default?.rankedList?.[1]?.rankedKeyword || []
  ).map((item) => ({
    topic: item.topic?.title,
    type: item.topic?.type,
    value: item.formattedValue || `+${item.value}%`,
  }));

  return {
    success: true,
    term,
    geo: geo || "worldwide",
    top,
    topCount: top.length,
    rising,
    risingCount: rising.length,
  };
}

async function checkStatus() {
  let apiKey;
  try {
    apiKey = getApiKey();
  } catch {
    return {
      success: false,
      status: "not_configured",
      message: "GOOGLE_TRENDS_API_KEY not set in environment",
      instructions: [
        "The Google Trends API is currently in ALPHA (launched July 2025).",
        "",
        "To get access:",
        "1. Apply at: https://developers.google.com/search/apis/trends",
        "2. Wait for approval (rolling acceptance)",
        '3. Set the GOOGLE_TRENDS_API_KEY environment variable',
      ],
    };
  }

  try {
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
      apiKey: apiKey.substring(0, 8) + "...",
    };
  } catch (error) {
    return {
      success: false,
      status: "error",
      message: error.message,
      apiKey: apiKey.substring(0, 8) + "...",
    };
  }
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "google-trends",
  version: "1.0.0",
});

// --- interest_over_time ---------------------------------------------------

server.tool(
  "interest_over_time",
  "Get search interest over time for one or more terms. Returns a timeline of relative search interest (0-100) for the given terms. Useful for identifying seasonality, trending topics, and comparing search popularity.",
  {
    terms: z
      .array(z.string())
      .min(1)
      .describe(
        "Search terms to analyze (e.g. ['corduroy shorts', 'dolphin shorts'])"
      ),
    start_date: z
      .string()
      .optional()
      .describe("Start date in YYYY-MM-DD format (default: 12 months ago)"),
    end_date: z
      .string()
      .optional()
      .describe("End date in YYYY-MM-DD format (default: today)"),
    geo: z
      .string()
      .optional()
      .describe(
        "Country code to filter by (e.g. US, GB, CA). Omit for worldwide."
      ),
  },
  async ({ terms, start_date, end_date, geo }) => {
    try {
      const result = await getInterestOverTime(
        terms,
        start_date,
        end_date,
        geo
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: false, error: error.message, terms },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// --- interest_by_region ---------------------------------------------------

server.tool(
  "interest_by_region",
  "Get geographic breakdown of search interest for a term. Returns a ranked list of regions with their relative search interest. Useful for identifying where a product or topic is most popular.",
  {
    term: z.string().describe("Search term to analyze"),
    geo: z
      .string()
      .optional()
      .describe(
        "Country code to scope results (e.g. US for US states). Omit for worldwide."
      ),
    resolution: z
      .enum(["COUNTRY", "REGION", "CITY"])
      .optional()
      .describe(
        "Geographic resolution: COUNTRY (default), REGION (states/provinces), or CITY"
      ),
  },
  async ({ term, geo, resolution }) => {
    try {
      const result = await getInterestByRegion(term, geo, resolution);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: false, error: error.message, term },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// --- related_queries ------------------------------------------------------

server.tool(
  "related_queries",
  "Find related search queries for a term. Returns two lists: 'top' (most common related queries by search volume) and 'rising' (queries with the biggest increase in search frequency). Useful for keyword research and discovering search intent.",
  {
    term: z.string().describe("Search term to find related queries for"),
    geo: z
      .string()
      .optional()
      .describe("Country code to filter by (e.g. US, GB). Omit for worldwide."),
  },
  async ({ term, geo }) => {
    try {
      const result = await getRelatedQueries(term, geo);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: false, error: error.message, term },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// --- related_topics -------------------------------------------------------

server.tool(
  "related_topics",
  "Find related topics for a term. Returns two lists: 'top' (most commonly associated topics) and 'rising' (topics with the biggest increase in association). Each topic includes a title and type. Useful for content strategy and understanding broader context around a search term.",
  {
    term: z.string().describe("Search term to find related topics for"),
    geo: z
      .string()
      .optional()
      .describe("Country code to filter by (e.g. US, GB). Omit for worldwide."),
  },
  async ({ term, geo }) => {
    try {
      const result = await getRelatedTopics(term, geo);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: false, error: error.message, term },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// --- status ---------------------------------------------------------------

server.tool(
  "status",
  "Check Google Trends API access status. Verifies the API key is configured and working. Returns connection status, any error messages, and setup instructions if not configured.",
  {},
  async () => {
    const result = await checkStatus();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError: !result.success,
    };
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting Google Trends MCP server:", error);
  process.exit(1);
});
