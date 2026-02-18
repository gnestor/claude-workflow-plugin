#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * PostgreSQL Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write pg-client.ts <command> [args...]
 *
 * Commands:
 *   list-tables                           - List all tables
 *   get-schema <table>                    - Get table schema
 *   introspect-json <table> <column>      - Analyze JSON column structure
 *   query "<sql>"                         - Execute SQL query
 *   scan-all                              - Scan all tables and cache schemas
 *   export-notebook <name> "<sql>"        - Export query to Jupyter notebook
 */

import '@std/dotenv/load';
import { Client } from "postgres";

// Database connection configuration
const dbConfig = {
  hostname: Deno.env.get("POSTGRES_HOST") || "localhost",
  port: parseInt(Deno.env.get("POSTGRES_PORT") || "5432"),
  user: Deno.env.get("POSTGRES_USER") || "",
  password: Deno.env.get("POSTGRES_PASSWORD") || "",
  database: Deno.env.get("POSTGRES_DATABASE") || "",
};

/**
 * Create database client
 */
async function createClient(): Promise<Client> {
  const client = new Client(dbConfig);
  await client.connect();
  return client;
}

/**
 * List all tables in the database
 */
async function listTables() {
  const client = await createClient();

  try {
    const result = await client.queryObject<{ table_name: string }>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    return {
      success: true,
      tables: result.rows.map((row) => row.table_name),
      count: result.rows.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await client.end();
  }
}

/**
 * Get schema for a specific table
 */
async function getSchema(tableName: string) {
  const client = await createClient();

  try {
    // Get columns
    const columns = await client.queryObject<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;

    // Get primary keys
    const primaryKeys = await client.queryObject<{ column_name: string }>`
      SELECT a.attname as column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ${tableName}::regclass
      AND i.indisprimary
    `;

    // Get foreign keys
    const foreignKeys = await client.queryObject<{
      column_name: string;
      foreign_table: string;
      foreign_column: string;
    }>`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = ${tableName}
    `;

    return {
      success: true,
      table: tableName,
      columns: columns.rows.map((col) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === "YES",
        default: col.column_default,
        isPrimaryKey: primaryKeys.rows.some(
          (pk) => pk.column_name === col.column_name
        ),
        foreignKey: foreignKeys.rows.find(
          (fk) => fk.column_name === col.column_name
        ) || null,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await client.end();
  }
}

/**
 * Introspect JSON/JSONB column structure
 */
async function introspectJson(tableName: string, columnName: string) {
  const client = await createClient();

  try {
    // Get sample JSON values (up to 100 rows)
    const result = await client.queryObject(`
      SELECT ${columnName}
      FROM ${tableName}
      WHERE ${columnName} IS NOT NULL
      LIMIT 100
    `);

    if (result.rows.length === 0) {
      return {
        success: true,
        table: tableName,
        column: columnName,
        message: "No non-null values found in column",
        schema: null,
      };
    }

    // Analyze structure
    const schema = analyzeJsonStructure(
      result.rows.map((row: any) => row[columnName])
    );

    return {
      success: true,
      table: tableName,
      column: columnName,
      sampleCount: result.rows.length,
      schema,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await client.end();
  }
}

/**
 * Analyze JSON structure from samples
 */
function analyzeJsonStructure(samples: any[]): any {
  const fields: Record<string, any> = {};

  for (const sample of samples) {
    if (typeof sample === "object" && sample !== null) {
      for (const [key, value] of Object.entries(sample)) {
        if (!fields[key]) {
          fields[key] = {
            type: getJsonType(value),
            nullable: false,
            samples: [],
          };
        }

        // Track if field can be null
        if (value === null) {
          fields[key].nullable = true;
        }

        // Collect sample values (max 5)
        if (fields[key].samples.length < 5 && value !== null) {
          fields[key].samples.push(value);
        }

        // If array, analyze array element structure
        if (Array.isArray(value) && value.length > 0) {
          if (!fields[key].arrayElementType) {
            fields[key].arrayElementType = analyzeJsonStructure(value);
          }
        }

        // If object, analyze nested structure
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          if (!fields[key].nestedFields) {
            fields[key].nestedFields = analyzeJsonStructure([value]);
          }
        }
      }
    }
  }

  return fields;
}

/**
 * Get JSON value type
 */
function getJsonType(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") {
    // Check if it looks like a date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date/string";
    return "string";
  }
  return "unknown";
}

/**
 * Execute SQL query
 */
async function executeQuery(sql: string) {
  const client = await createClient();

  try {
    const startTime = Date.now();
    const result = await client.queryObject(sql);
    const duration = Date.now() - startTime;

    return {
      success: true,
      rows: result.rows,
      rowCount: result.rows.length,
      duration,
      query: sql,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      query: sql,
    };
  } finally {
    await client.end();
  }
}

/**
 * Scan all tables and save schemas
 */
async function scanAll() {
  const client = await createClient();

  try {
    // Get all tables
    const tablesResult = await listTables();
    if (!tablesResult.success) {
      return tablesResult;
    }

    const schemas: Record<string, any> = {};

    // For each table, get schema
    for (const tableName of tablesResult.tables || []) {
      const schemaResult = await getSchema(tableName);
      if (schemaResult.success) {
        schemas[tableName] = schemaResult;

        // Check for JSON/JSONB columns
        const jsonColumns = schemaResult.columns?.filter(
          (col: any) => col.type === "jsonb" || col.type === "json"
        );

        // Introspect JSON columns
        if (jsonColumns && jsonColumns.length > 0) {
          for (const col of jsonColumns) {
            const jsonSchema = await introspectJson(tableName, col.name);
            if (jsonSchema.success && schemaResult.columns) {
              // Add JSON schema to column info
              const columnIndex = schemaResult.columns.findIndex(
                (c: any) => c.name === col.name
              );
              if (columnIndex >= 0) {
                (schemaResult.columns[columnIndex] as any).jsonSchema =
                  jsonSchema.schema;
              }
            }
          }
        }

        // Save to file
        const schemaPath = `.claude/skills/postgresql/schemas/${tableName}.json`;
        await Deno.writeTextFile(
          schemaPath,
          JSON.stringify(schemaResult, null, 2)
        );
      }
    }

    return {
      success: true,
      tablesScanned: tablesResult.tables?.length || 0,
      schemas,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await client.end();
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
          ],
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: [
            `// Import PostgreSQL client\n`,
            `import { Client } from "postgres";\n`,
            `\n`,
            `// Database configuration\n`,
            `const dbConfig = {\n`,
            `  hostname: Deno.env.get("POSTGRES_HOST") || "localhost",\n`,
            `  port: parseInt(Deno.env.get("POSTGRES_PORT") || "5432"),\n`,
            `  user: Deno.env.get("POSTGRES_USER") || "",\n`,
            `  password: Deno.env.get("POSTGRES_PASSWORD") || "",\n`,
            `  database: Deno.env.get("POSTGRES_DATABASE") || "",\n`,
            `};\n`,
          ],
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: [
            `// Execute query\n`,
            `const client = new Client(dbConfig);\n`,
            `await client.connect();\n`,
            `\n`,
            `const query = \`${sql}\`;\n`,
            `const result = await client.queryObject(query);\n`,
            `\n`,
            `await client.end();\n`,
            `\n`,
            `console.log(\`Rows returned: \${result.rows.length}\`);\n`,
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
    console.error("Usage: pg-client.ts <command> [args...]");
    console.error("\nCommands:");
    console.error("  list-tables");
    console.error("  get-schema <table>");
    console.error("  introspect-json <table> <column>");
    console.error('  query "<sql>"');
    console.error("  scan-all");
    console.error('  export-notebook <name> "<sql>"');
    Deno.exit(1);
  }

  const command = args[0];
  let result;

  switch (command) {
    case "list-tables":
      result = await listTables();
      break;

    case "get-schema":
      if (args.length < 2) {
        console.error("Error: get-schema requires table name");
        Deno.exit(1);
      }
      result = await getSchema(args[1]);
      break;

    case "introspect-json":
      if (args.length < 3) {
        console.error("Error: introspect-json requires table and column name");
        Deno.exit(1);
      }
      result = await introspectJson(args[1], args[2]);
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

  // Convert BigInt to strings for JSON serialization
  const replacer = (_key: string, value: any) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };

  console.log(JSON.stringify(result, replacer, 2));
}

// Run main if this is the main module
if (import.meta.main) {
  main();
}
