#!/usr/bin/env node

/**
 * Google BigQuery MCP Server
 *
 * Provides BigQuery tools via the Model Context Protocol:
 *   - list_datasets: List all datasets in the project
 *   - list_tables: List all tables in a dataset
 *   - get_schema: Get schema for a specific table
 *   - query: Execute BigQuery SQL queries
 *   - scan_all_schemas: Scan all datasets/tables and return schemas
 *
 * Requires env vars:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_CLOUD_PROJECT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;

const BIGQUERY_API_BASE = "https://bigquery.googleapis.com/bigquery/v2";

// ---------------------------------------------------------------------------
// OAuth token refresh helper
// ---------------------------------------------------------------------------

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Get a valid OAuth2 access token, refreshing if necessary.
 * Caches the token and refreshes ~60 seconds before expiry.
 */
async function getAccessToken() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error(
      "Missing OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN."
    );
  }

  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  // expires_in is in seconds; convert to ms and store absolute timestamp
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

  return cachedAccessToken;
}

// ---------------------------------------------------------------------------
// BigQuery API helpers
// ---------------------------------------------------------------------------

/**
 * Make an authenticated request to the BigQuery REST API.
 */
async function bigqueryRequest(endpoint, options = {}) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${BIGQUERY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BigQuery API error (${response.status}): ${text}`);
  }

  return response.json();
}

function requireProject() {
  if (!GOOGLE_CLOUD_PROJECT) {
    throw new Error("GOOGLE_CLOUD_PROJECT environment variable is not set.");
  }
  return GOOGLE_CLOUD_PROJECT;
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function listDatasets() {
  const project = requireProject();
  const data = await bigqueryRequest(`/projects/${project}/datasets`);

  const datasets = (data.datasets || []).map((ds) => ({
    datasetId: ds.datasetReference.datasetId,
    projectId: ds.datasetReference.projectId,
    friendlyName: ds.friendlyName || null,
    location: ds.location || null,
    id: ds.id,
  }));

  return { project, datasets, count: datasets.length };
}

async function listTables(datasetId) {
  const project = requireProject();

  let allTables = [];
  let pageToken = undefined;

  // Paginate through all results
  do {
    const params = pageToken ? `?pageToken=${pageToken}` : "";
    const data = await bigqueryRequest(
      `/projects/${project}/datasets/${datasetId}/tables${params}`
    );

    const tables = (data.tables || []).map((t) => ({
      tableId: t.tableReference.tableId,
      datasetId: t.tableReference.datasetId,
      projectId: t.tableReference.projectId,
      type: t.type,
      friendlyName: t.friendlyName || null,
      numRows: t.numRows || null,
      numBytes: t.numBytes || null,
    }));

    allTables = allTables.concat(tables);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return { project, dataset: datasetId, tables: allTables, count: allTables.length };
}

async function getSchema(datasetId, tableId) {
  const project = requireProject();
  const data = await bigqueryRequest(
    `/projects/${project}/datasets/${datasetId}/tables/${tableId}`
  );

  return {
    project,
    dataset: datasetId,
    table: tableId,
    schema: data.schema,
    numRows: data.numRows || null,
    numBytes: data.numBytes || null,
    type: data.type,
    creationTime: data.creationTime || null,
    friendlyName: data.friendlyName || null,
    description: data.description || null,
  };
}

async function executeQuery(sql, maxResults = 1000) {
  const project = requireProject();
  const startTime = Date.now();

  const data = await bigqueryRequest(`/projects/${project}/queries`, {
    method: "POST",
    body: JSON.stringify({
      query: sql,
      useLegacySql: false,
      maxResults,
    }),
  });

  const duration = Date.now() - startTime;

  // If the job is not yet complete, poll for results
  let result = data;
  if (!result.jobComplete) {
    const jobId = result.jobReference.jobId;
    const location = result.jobReference.location || "US";
    // Poll until complete (up to 5 minutes)
    const deadline = Date.now() + 300_000;
    while (!result.jobComplete && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      result = await bigqueryRequest(
        `/projects/${project}/queries/${jobId}?location=${location}&maxResults=${maxResults}`
      );
    }
    if (!result.jobComplete) {
      throw new Error(
        `Query did not complete within timeout. Job ID: ${jobId}`
      );
    }
  }

  // Convert BigQuery row format to plain objects
  const fields = result.schema?.fields || [];
  const rows = (result.rows || []).map((row) => {
    const obj = {};
    fields.forEach((field, i) => {
      obj[field.name] = row.f[i].v;
    });
    return obj;
  });

  return {
    query: sql,
    rows,
    rowCount: parseInt(result.totalRows || "0", 10),
    totalBytesProcessed: result.totalBytesProcessed || null,
    durationMs: duration,
    schema: fields.map((f) => ({
      name: f.name,
      type: f.type,
      mode: f.mode || null,
    })),
  };
}

async function scanAllSchemas() {
  const project = requireProject();
  const datasetsResult = await listDatasets();

  const allSchemas = {};
  let totalTables = 0;
  const errors = [];

  for (const dataset of datasetsResult.datasets) {
    // Skip internal/system datasets
    if (dataset.datasetId === "airbyte_internal") {
      continue;
    }

    let tablesResult;
    try {
      tablesResult = await listTables(dataset.datasetId);
    } catch (err) {
      errors.push(`Failed to list tables in ${dataset.datasetId}: ${err.message}`);
      continue;
    }

    for (const table of tablesResult.tables) {
      try {
        const schemaResult = await getSchema(dataset.datasetId, table.tableId);
        const key = `${dataset.datasetId}.${table.tableId}`;
        allSchemas[key] = schemaResult;
        totalTables++;
      } catch (err) {
        errors.push(
          `Failed to get schema for ${dataset.datasetId}.${table.tableId}: ${err.message}`
        );
      }
    }
  }

  return {
    project,
    datasetsScanned: datasetsResult.datasets.length,
    tablesScanned: totalTables,
    schemas: allSchemas,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "google-bigquery",
  version: "1.0.0",
});

// -- list_datasets ----------------------------------------------------------
server.tool(
  "list_datasets",
  "List all BigQuery datasets in the configured Google Cloud project.",
  {},
  async () => {
    try {
      const result = await listDatasets();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }) }],
        isError: true,
      };
    }
  }
);

// -- list_tables ------------------------------------------------------------
server.tool(
  "list_tables",
  "List all tables in a BigQuery dataset.",
  { dataset_id: z.string().describe("The dataset ID to list tables from") },
  async ({ dataset_id }) => {
    try {
      const result = await listTables(dataset_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }) }],
        isError: true,
      };
    }
  }
);

// -- get_schema -------------------------------------------------------------
server.tool(
  "get_schema",
  "Get the schema of a BigQuery table, including field names, types, modes, and table metadata.",
  {
    dataset_id: z.string().describe("The dataset ID"),
    table_id: z.string().describe("The table ID"),
  },
  async ({ dataset_id, table_id }) => {
    try {
      const result = await getSchema(dataset_id, table_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }) }],
        isError: true,
      };
    }
  }
);

// -- query ------------------------------------------------------------------
server.tool(
  "query",
  "Execute a BigQuery SQL query and return results. Uses Standard SQL. Returns up to maxResults rows (default 1000).",
  {
    sql: z.string().describe("The SQL query to execute (Standard SQL)"),
    max_results: z
      .number()
      .int()
      .min(1)
      .max(10000)
      .optional()
      .default(1000)
      .describe("Maximum number of rows to return (default 1000, max 10000)"),
  },
  async ({ sql, max_results }) => {
    try {
      const result = await executeQuery(sql, max_results);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, query: sql }) }],
        isError: true,
      };
    }
  }
);

// -- scan_all_schemas -------------------------------------------------------
server.tool(
  "scan_all_schemas",
  "Scan all datasets and tables in the project, returning every table schema. Useful for discovering the full data model. May take a while for large projects.",
  {},
  async () => {
    try {
      const result = await scanAllSchemas();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }) }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Start server with stdio transport
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is now running and will process messages over stdio
}

main().catch((err) => {
  console.error("Fatal error starting BigQuery MCP server:", err);
  process.exit(1);
});
