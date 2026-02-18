#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * BigQuery API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write bq-client.ts <command> [args...]
 *
 * Commands:
 *   auth                                 - Authenticate and obtain refresh token
 *   list-datasets                        - List all datasets in the project
 *   list-tables <dataset-id>             - List all tables in a dataset
 *   get-schema <dataset-id> <table-id>   - Get table schema
 *   query "<sql>"                        - Execute BigQuery SQL query
 *   scan-all                             - Scan all tables and cache schemas
 *   export-notebook <name> "<sql>"       - Export query to Jupyter notebook
 */

import "@std/dotenv/load";
import { getAccessToken as getSharedOAuthToken, authenticate as authenticateOAuth } from "../../scripts/google.ts";

// BigQuery API configuration
const BIGQUERY_PROJECT = Deno.env.get("BIGQUERY_PROJECT");
const SCOPES = [
  "https://www.googleapis.com/auth/bigquery.readonly",
  "https://www.googleapis.com/auth/bigquery",
];

// BigQuery API types
interface Dataset {
  kind: string;
  id: string;
  datasetReference: {
    datasetId: string;
    projectId: string;
  };
  friendlyName?: string;
  location?: string;
  creationTime?: string;
}

interface Table {
  kind: string;
  id: string;
  tableReference: {
    projectId: string;
    datasetId: string;
    tableId: string;
  };
  friendlyName?: string;
  type: string;
  timePartitioning?: any;
  numRows?: string;
  numBytes?: string;
  creationTime?: string;
}

interface TableSchema {
  fields: SchemaField[];
}

interface SchemaField {
  name: string;
  type: string;
  mode?: string;
  description?: string;
  fields?: SchemaField[];
}

interface QueryResponse {
  kind: string;
  schema: TableSchema;
  jobReference: {
    projectId: string;
    jobId: string;
    location?: string;
  };
  totalRows: string;
  rows?: Array<{ f: Array<{ v: any }> }>;
  jobComplete: boolean;
  totalBytesProcessed?: string;
}

/**
 * Get access token using shared OAuth2 implementation
 */
async function getAccessToken(): Promise<string> {
  return getSharedOAuthToken(SCOPES);
}

/**
 * Authenticate with BigQuery using OAuth2
 */
async function authenticate() {
  return authenticateOAuth(SCOPES, "BigQuery");
}

/**
 * Make authenticated request to BigQuery API
 */
async function bigqueryApiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2${endpoint}`,
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
    throw new Error(`BigQuery API error: ${error}`);
  }

  return response.json();
}

/**
 * List all datasets in the project
 */
async function listDatasets() {
  if (!BIGQUERY_PROJECT) {
    return {
      success: false,
      error: "BIGQUERY_PROJECT environment variable not set",
    };
  }

  try {
    const data = await bigqueryApiRequest(`/projects/${BIGQUERY_PROJECT}/datasets`);

    const datasets = (data.datasets || []).map((ds: Dataset) => ({
      datasetId: ds.datasetReference.datasetId,
      projectId: ds.datasetReference.projectId,
      friendlyName: ds.friendlyName,
      location: ds.location,
      id: ds.id,
    }));

    return {
      success: true,
      project: BIGQUERY_PROJECT,
      datasets,
      count: datasets.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all tables in a dataset
 */
async function listTables(datasetId: string) {
  if (!BIGQUERY_PROJECT) {
    return {
      success: false,
      error: "BIGQUERY_PROJECT environment variable not set",
    };
  }

  try {
    const data = await bigqueryApiRequest(
      `/projects/${BIGQUERY_PROJECT}/datasets/${datasetId}/tables`
    );

    const tables = (data.tables || []).map((t: Table) => ({
      tableId: t.tableReference.tableId,
      datasetId: t.tableReference.datasetId,
      projectId: t.tableReference.projectId,
      type: t.type,
      friendlyName: t.friendlyName,
      numRows: t.numRows,
      numBytes: t.numBytes,
    }));

    return {
      success: true,
      project: BIGQUERY_PROJECT,
      dataset: datasetId,
      tables,
      count: tables.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get schema for a specific table
 */
async function getSchema(datasetId: string, tableId: string) {
  if (!BIGQUERY_PROJECT) {
    return {
      success: false,
      error: "BIGQUERY_PROJECT environment variable not set",
    };
  }

  try {
    const data = await bigqueryApiRequest(
      `/projects/${BIGQUERY_PROJECT}/datasets/${datasetId}/tables/${tableId}`
    );

    return {
      success: true,
      project: BIGQUERY_PROJECT,
      dataset: datasetId,
      table: tableId,
      schema: data.schema,
      numRows: data.numRows,
      numBytes: data.numBytes,
      type: data.type,
      creationTime: data.creationTime,
      friendlyName: data.friendlyName,
      description: data.description,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Execute a BigQuery SQL query
 */
async function executeQuery(sql: string) {
  if (!BIGQUERY_PROJECT) {
    return {
      success: false,
      error: "BIGQUERY_PROJECT environment variable not set",
    };
  }

  try {
    const startTime = Date.now();

    const data: QueryResponse = await bigqueryApiRequest(
      `/projects/${BIGQUERY_PROJECT}/queries`,
      {
        method: "POST",
        body: JSON.stringify({
          query: sql,
          useLegacySql: false,
          maxResults: 1000,
        }),
      }
    );

    const duration = Date.now() - startTime;

    // Convert BigQuery row format to simpler format
    const rows = (data.rows || []).map((row) => {
      const obj: Record<string, any> = {};
      data.schema.fields.forEach((field, i) => {
        obj[field.name] = row.f[i].v;
      });
      return obj;
    });

    return {
      success: true,
      query: sql,
      rows,
      rowCount: parseInt(data.totalRows || "0"),
      totalBytesProcessed: data.totalBytesProcessed,
      duration,
      schema: data.schema.fields.map((f) => ({
        name: f.name,
        type: f.type,
        mode: f.mode,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      query: sql,
    };
  }
}

/**
 * Scan all datasets and tables, save schemas to JSON files
 */
async function scanAll() {
  if (!BIGQUERY_PROJECT) {
    return {
      success: false,
      error: "BIGQUERY_PROJECT environment variable not set",
    };
  }

  try {
    // Get all datasets
    const datasetsResult = await listDatasets();
    if (!datasetsResult.success) {
      return datasetsResult;
    }

    const schemas: Record<string, any> = {};
    let totalTables = 0;

    // For each dataset, get all tables
    for (const dataset of datasetsResult.datasets || []) {
      // Skip airbyte_internal dataset
      if (dataset.datasetId === 'airbyte_internal') {
        console.error(`Skipping dataset: ${dataset.datasetId}`);
        continue;
      }

      const tablesResult = await listTables(dataset.datasetId);
      if (!tablesResult.success) {
        console.error(`Failed to list tables in ${dataset.datasetId}: ${tablesResult.error}`);
        continue;
      }

      // For each table, get schema
      for (const table of tablesResult.tables || []) {
        const schemaResult = await getSchema(dataset.datasetId, table.tableId);
        if (schemaResult.success) {
          const schemaKey = `${dataset.datasetId}_${table.tableId}`;
          schemas[schemaKey] = schemaResult;

          // Save to file
          const schemaPath = `.claude/skills/google/bigquery/references/schemas/${schemaKey}.json`;
          await Deno.writeTextFile(
            schemaPath,
            JSON.stringify(schemaResult, null, 2)
          );

          totalTables++;
        } else {
          console.error(`Failed to get schema for ${dataset.datasetId}.${table.tableId}: ${schemaResult.error}`);
        }
      }
    }

    return {
      success: true,
      project: BIGQUERY_PROJECT,
      datasetsScanned: datasetsResult.datasets?.length || 0,
      tablesScanned: totalTables,
      schemasPath: ".claude/skills/google/bigquery/references/schemas/",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Export query to Jupyter notebook
 */
async function exportNotebook(notebookName: string, sql: string, outputDir: string = "assets/notebooks") {
  try {
    // First execute query to verify it works
    const queryResult = await executeQuery(sql);
    if (!queryResult.success) {
      return {
        success: false,
        error: `Query failed: ${queryResult.error}`,
      };
    }

    // Create notebook structure
    const notebook = {
      cells: [
        {
          cell_type: "markdown",
          metadata: {},
          source: [
            `# ${notebookName}\n`,
            `\n`,
            `Generated: ${new Date().toISOString()}\n`,
            `\n`,
            `## Query\n`,
            `\`\`\`sql\n`,
            `${sql}\n`,
            `\`\`\`\n`,
            `\n`,
            `Rows returned: ${queryResult.rowCount}\n`,
            queryResult.totalBytesProcessed ? `Bytes processed: ${queryResult.totalBytesProcessed}\n` : "",
          ],
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: [
            `// Import BigQuery client helper\n`,
            `import "@std/dotenv/load";\n`,
            `\n`,
            `const BIGQUERY_PROJECT = Deno.env.get("BIGQUERY_PROJECT");\n`,
            `const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");\n`,
            `const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");\n`,
            `const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");\n`,
          ],
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: [
            `// Execute BigQuery query\n`,
            `async function executeQuery(sql: string) {\n`,
            `  // Get access token\n`,
            `  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {\n`,
            `    method: "POST",\n`,
            `    headers: { "Content-Type": "application/x-www-form-urlencoded" },\n`,
            `    body: new URLSearchParams({\n`,
            `      client_id: GOOGLE_CLIENT_ID!,\n`,
            `      client_secret: GOOGLE_CLIENT_SECRET!,\n`,
            `      refresh_token: GOOGLE_REFRESH_TOKEN!,\n`,
            `      grant_type: "refresh_token",\n`,
            `    }),\n`,
            `  });\n`,
            `  const { access_token } = await tokenResponse.json();\n`,
            `\n`,
            `  // Execute query\n`,
            `  const response = await fetch(\n`,
            `    \`https://bigquery.googleapis.com/bigquery/v2/projects/\${BIGQUERY_PROJECT}/queries\`,\n`,
            `    {\n`,
            `      method: "POST",\n`,
            `      headers: {\n`,
            `        Authorization: \`Bearer \${access_token}\`,\n`,
            `        "Content-Type": "application/json",\n`,
            `      },\n`,
            `      body: JSON.stringify({\n`,
            `        query: sql,\n`,
            `        useLegacySql: false,\n`,
            `        maxResults: 1000,\n`,
            `      }),\n`,
            `    }\n`,
            `  );\n`,
            `\n`,
            `  const data = await response.json();\n`,
            `  \n`,
            `  // Convert rows to objects\n`,
            `  const rows = (data.rows || []).map((row: any) => {\n`,
            `    const obj: Record<string, any> = {};\n`,
            `    data.schema.fields.forEach((field: any, i: number) => {\n`,
            `      obj[field.name] = row.f[i].v;\n`,
            `    });\n`,
            `    return obj;\n`,
            `  });\n`,
            `\n`,
            `  return { rows, totalRows: data.totalRows, bytesProcessed: data.totalBytesProcessed };\n`,
            `}\n`,
            `\n`,
            `const query = \`${sql}\`;\n`,
            `const result = await executeQuery(query);\n`,
            `\n`,
            `console.log(\`Rows: \${result.totalRows}\`);\n`,
            `console.log(\`Bytes processed: \${result.bytesProcessed}\`);\n`,
            `result.rows\n`,
          ],
        },
      ],
      metadata: {
        kernelspec: {
          display_name: "Deno",
          language: "typescript",
          name: "deno",
        },
        language_info: {
          file_extension: ".ts",
          mimetype: "text/x.typescript",
          name: "typescript",
          nb_converter: "script",
          pygments_lexer: "typescript",
          version: "5.2.2",
        },
      },
      nbformat: 4,
      nbformat_minor: 5,
    };

    // Create output directory if it doesn't exist
    try {
      await Deno.mkdir(outputDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Write notebook file
    const notebookPath = `${outputDir}/${notebookName}.ipynb`;
    await Deno.writeTextFile(notebookPath, JSON.stringify(notebook, null, 2));

    return {
      success: true,
      notebookPath,
      rowCount: queryResult.rowCount,
      bytesProcessed: queryResult.totalBytesProcessed,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.error("Usage: bq-client.ts <command> [args...]");
    console.error("\nCommands:");
    console.error("  auth                                  - Authenticate with BigQuery");
    console.error("  list-datasets                         - List all datasets");
    console.error("  list-tables <dataset-id>              - List tables in dataset");
    console.error("  get-schema <dataset-id> <table-id>    - Get table schema");
    console.error('  query "<sql>"                         - Execute BigQuery SQL');
    console.error("  scan-all                              - Scan all tables and cache schemas");
    console.error('  export-notebook <name> "<sql>"        - Export query to Jupyter notebook');
    Deno.exit(1);
  }

  const command = args[0];
  let result;

  switch (command) {
    case "auth":
      result = await authenticate();
      break;

    case "list-datasets":
      result = await listDatasets();
      break;

    case "list-tables":
      if (args.length < 2) {
        console.error("Error: list-tables requires dataset-id");
        Deno.exit(1);
      }
      result = await listTables(args[1]);
      break;

    case "get-schema":
      if (args.length < 3) {
        console.error("Error: get-schema requires dataset-id and table-id");
        Deno.exit(1);
      }
      result = await getSchema(args[1], args[2]);
      break;

    case "query":
      if (args.length < 2) {
        console.error("Error: query requires SQL string");
        Deno.exit(1);
      }
      result = await executeQuery(args.slice(1).join(" "));
      break;

    case "scan-all":
      result = await scanAll();
      break;

    case "export-notebook":
      if (args.length < 3) {
        console.error("Error: export-notebook requires name and SQL");
        Deno.exit(1);
      }
      result = await exportNotebook(args[1], args.slice(2).join(" "));
      break;

    default:
      console.error(`Error: unknown command '${command}'`);
      Deno.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

// Run main if this is the main module
if (import.meta.main) {
  main().catch((error) => {
    console.error(JSON.stringify({ success: false, error: error.message }, null, 2));
    Deno.exit(1);
  });
}
