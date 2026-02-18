#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Shopify GraphQL Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write shopify-client.ts <command> [args...]
 *
 * Commands:
 *   query "<graphql>"                - Execute GraphQL query (single page)
 *   query --all "<graphql>"          - Execute query with auto-pagination (fetches all pages)
 *   mutation "<graphql>"             - Execute GraphQL mutation
 *   scan-schema                      - Fetch and save GraphQL schema
 *   introspect-types                 - List all available types
 *   get-type <typename>              - Get details about a specific type
 */

import "@std/dotenv/load";

// API configuration
const SHOPIFY_API_TOKEN = Deno.env.get("SHOPIFY_API_TOKEN");
const SHOPIFY_STORE_DOMAIN = Deno.env.get("SHOPIFY_STORE_DOMAIN");
const API_VERSION = "2025-10"; // Update this when new versions are available

if (!SHOPIFY_API_TOKEN || !SHOPIFY_STORE_DOMAIN) {
  console.error(
    JSON.stringify({
      success: false,
      error:
        "Missing required environment variables: SHOPIFY_API_TOKEN and SHOPIFY_STORE_DOMAIN must be set in .env",
    })
  );
  Deno.exit(1);
}

const GRAPHQL_ENDPOINT = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

/**
 * Execute a GraphQL request against Shopify API
 */
async function executeGraphQL(query: string, variables?: Record<string, any>) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_API_TOKEN!,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      return {
        success: false,
        errors: data.errors,
        data: data.data,
      };
    }

    return {
      success: true,
      data: data.data,
      extensions: data.extensions,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Execute a GraphQL query
 */
async function query(graphql: string) {
  const startTime = Date.now();
  const result = await executeGraphQL(graphql);
  const duration = Date.now() - startTime;

  return {
    ...result,
    duration,
    query: graphql,
  };
}

/**
 * Execute a GraphQL mutation
 */
async function mutation(graphql: string) {
  const startTime = Date.now();
  const result = await executeGraphQL(graphql);
  const duration = Date.now() - startTime;

  return {
    ...result,
    duration,
    mutation: graphql,
  };
}

/**
 * Fetch and save the GraphQL schema using introspection
 */
async function scanSchema() {
  try {
    // GraphQL introspection query
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
          directives {
            name
            description
            locations
            args {
              ...InputValue
            }
          }
        }
      }

      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }

      fragment InputValue on __InputValue {
        name
        description
        type { ...TypeRef }
        defaultValue
      }

      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await executeGraphQL(introspectionQuery);

    if (!result.success) {
      return result;
    }

    // Also fetch the SDL (Schema Definition Language) format
    const sdlQuery = `{ __schema { types { name } } }`;

    // Save introspection result as JSON
    const schemaPath = `.claude/skills/shopify/schemas/schema-introspection.json`;
    await Deno.writeTextFile(schemaPath, JSON.stringify(result.data, null, 2));

    return {
      success: true,
      message: "Schema saved successfully",
      path: schemaPath,
      typesCount: result.data.__schema.types.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all available types, queries, and mutations
 */
async function introspectTypes() {
  try {
    // Try to read from cached schema first
    let schemaData;
    try {
      const cached = await Deno.readTextFile(
        ".claude/skills/shopify/schemas/schema-introspection.json"
      );
      schemaData = JSON.parse(cached);
    } catch {
      // If cache doesn't exist, fetch it
      const result = await scanSchema();
      if (!result.success) {
        return result;
      }
      const cached = await Deno.readTextFile(
        ".claude/skills/shopify/schemas/schema-introspection.json"
      );
      schemaData = JSON.parse(cached);
    }

    const schema = schemaData.__schema;

    // Get query type
    const queryType = schema.types.find(
      (t: any) => t.name === schema.queryType.name
    );
    const queries = queryType?.fields?.map((f: any) => ({
      name: f.name,
      description: f.description,
      args: f.args.map((a: any) => ({
        name: a.name,
        type: getTypeName(a.type),
      })),
      returnType: getTypeName(f.type),
    })) || [];

    // Get mutation type
    const mutationType = schema.types.find(
      (t: any) => t.name === schema.mutationType?.name
    );
    const mutations = mutationType?.fields?.map((f: any) => ({
      name: f.name,
      description: f.description,
      args: f.args.map((a: any) => ({
        name: a.name,
        type: getTypeName(a.type),
      })),
      returnType: getTypeName(f.type),
    })) || [];

    // Get all custom types (excluding built-in GraphQL types)
    const types = schema.types
      .filter((t: any) => !t.name.startsWith("__"))
      .map((t: any) => ({
        name: t.name,
        kind: t.kind,
        description: t.description,
      }));

    return {
      success: true,
      queries,
      mutations,
      types,
      summary: {
        queriesCount: queries.length,
        mutationsCount: mutations.length,
        typesCount: types.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get detailed information about a specific type
 */
async function getType(typeName: string) {
  try {
    // Try to read from cached schema first
    let schemaData;
    try {
      const cached = await Deno.readTextFile(
        ".claude/skills/shopify/schemas/schema-introspection.json"
      );
      schemaData = JSON.parse(cached);
    } catch {
      // If cache doesn't exist, fetch it
      const result = await scanSchema();
      if (!result.success) {
        return result;
      }
      const cached = await Deno.readTextFile(
        ".claude/skills/shopify/schemas/schema-introspection.json"
      );
      schemaData = JSON.parse(cached);
    }

    const type = schemaData.__schema.types.find(
      (t: any) => t.name === typeName
    );

    if (!type) {
      return {
        success: false,
        error: `Type '${typeName}' not found in schema`,
      };
    }

    // Format the type information
    const result: any = {
      success: true,
      name: type.name,
      kind: type.kind,
      description: type.description,
    };

    // Add fields if it's an object type
    if (type.fields) {
      result.fields = type.fields.map((f: any) => ({
        name: f.name,
        description: f.description,
        type: getTypeName(f.type),
        args: f.args?.map((a: any) => ({
          name: a.name,
          type: getTypeName(a.type),
          defaultValue: a.defaultValue,
        })),
        isDeprecated: f.isDeprecated,
        deprecationReason: f.deprecationReason,
      }));
    }

    // Add enum values if it's an enum
    if (type.enumValues) {
      result.enumValues = type.enumValues.map((v: any) => ({
        name: v.name,
        description: v.description,
        isDeprecated: v.isDeprecated,
        deprecationReason: v.deprecationReason,
      }));
    }

    // Add input fields if it's an input type
    if (type.inputFields) {
      result.inputFields = type.inputFields.map((f: any) => ({
        name: f.name,
        description: f.description,
        type: getTypeName(f.type),
        defaultValue: f.defaultValue,
      }));
    }

    // Add interfaces if it implements any
    if (type.interfaces) {
      result.interfaces = type.interfaces.map((i: any) => i.name);
    }

    // Add possible types if it's a union or interface
    if (type.possibleTypes) {
      result.possibleTypes = type.possibleTypes.map((t: any) => t.name);
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Helper function to get readable type name from GraphQL type object
 */
function getTypeName(type: any): string {
  if (type.kind === "NON_NULL") {
    return `${getTypeName(type.ofType)}!`;
  }
  if (type.kind === "LIST") {
    return `[${getTypeName(type.ofType)}]`;
  }
  return type.name;
}

/**
 * Ensure the query uses the maximum page size (250) for efficiency.
 * Replaces `first: N` with `first: 250` if N < 250, or adds `first: 250`
 * to the first connection-like field if missing.
 */
function ensureMaxPageSize(query: string): string {
  const firstRegex = /first:\s*(\d+)/;
  const match = query.match(firstRegex);
  if (match) {
    const n = parseInt(match[1]);
    if (n < 250) {
      return query.replace(firstRegex, "first: 250");
    }
    return query;
  }
  return query;
}

/**
 * Walk the response data to find the first connection object
 * (one that has `nodes` or `edges` alongside `pageInfo`).
 */
function findConnection(
  data: any,
  path: string[] = []
): {
  nodes: any[];
  pageInfo: any;
  fieldName: string;
} | null {
  if (!data || typeof data !== "object") return null;

  for (const key of Object.keys(data)) {
    const value = data[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (value.pageInfo && (value.nodes || value.edges)) {
        return {
          nodes: value.nodes || value.edges.map((e: any) => e.node),
          pageInfo: value.pageInfo,
          fieldName: key,
        };
      }
      const found = findConnection(value, [...path, key]);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Inject or replace `after: "cursor"` in the query string for the given
 * connection field.
 */
function injectAfterCursor(
  query: string,
  fieldName: string,
  cursor: string
): string {
  const afterRegex = /after:\s*"[^"]*"/;
  if (afterRegex.test(query)) {
    return query.replace(afterRegex, `after: "${cursor}"`);
  }
  // Insert after `first: N` in the connection field's arguments
  const fieldArgRegex = new RegExp(
    `(${fieldName}\\s*\\([^)]*?first:\\s*\\d+)`
  );
  return query.replace(fieldArgRegex, `$1, after: "${cursor}"`);
}

/**
 * Auto-paginate a query: execute repeatedly, following cursors, until all
 * pages are fetched. Merges all nodes into a single response.
 */
async function queryAll(graphql: string) {
  const startTime = Date.now();
  let currentQuery = ensureMaxPageSize(graphql);
  const allNodes: any[] = [];
  let pageCount = 0;
  let lastResult: any = null;
  let connectionFieldName: string | null = null;

  while (true) {
    pageCount++;
    const result = await executeGraphQL(currentQuery);

    if (!result.success) {
      return {
        ...result,
        duration: Date.now() - startTime,
        query: graphql,
        pagination: { pagesFetched: pageCount, totalNodes: allNodes.length },
      };
    }

    lastResult = result;

    const connection = findConnection(result.data);
    if (!connection) {
      // No connection found — return single-page result as-is
      return {
        ...result,
        duration: Date.now() - startTime,
        query: graphql,
      };
    }

    connectionFieldName = connection.fieldName;
    allNodes.push(...connection.nodes);

    if (!connection.pageInfo?.hasNextPage) break;

    currentQuery = injectAfterCursor(
      currentQuery,
      connection.fieldName,
      connection.pageInfo.endCursor
    );
  }

  // Merge all nodes into the final response
  const mergedData = JSON.parse(JSON.stringify(lastResult.data));
  function replaceNodes(obj: any): boolean {
    if (!obj || typeof obj !== "object") return false;
    for (const key of Object.keys(obj)) {
      if (key === connectionFieldName && obj[key]) {
        if (obj[key].nodes) {
          obj[key].nodes = allNodes;
        } else if (obj[key].edges) {
          obj[key].edges = allNodes.map((n: any) => ({ node: n }));
        }
        delete obj[key].pageInfo;
        return true;
      }
      if (replaceNodes(obj[key])) return true;
    }
    return false;
  }
  replaceNodes(mergedData);

  return {
    success: true,
    data: mergedData,
    extensions: lastResult.extensions,
    duration: Date.now() - startTime,
    query: graphql,
    pagination: {
      pagesFetched: pageCount,
      totalNodes: allNodes.length,
    },
  };
}

/**
 * Main CLI handler
 */
async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.error("Usage: shopify-client.ts <command> [args...]");
    console.error("\nCommands:");
    console.error('  query "<graphql>"           Single page query');
    console.error('  query --all "<graphql>"     Auto-paginate all results');
    console.error('  mutation "<graphql>"');
    console.error("  scan-schema");
    console.error("  introspect-types");
    console.error("  get-type <typename>");
    Deno.exit(1);
  }

  const command = args[0];
  let result;

  switch (command) {
    case "query": {
      const queryArgs = args.slice(1);
      const allFlag = queryArgs.includes("--all");
      const graphqlArgs = queryArgs.filter((a) => a !== "--all");
      if (graphqlArgs.length < 1) {
        console.error("Error: query requires GraphQL query string");
        Deno.exit(1);
      }
      const graphql = graphqlArgs.join(" ");
      result = allFlag ? await queryAll(graphql) : await query(graphql);
      break;
    }

    case "mutation":
      if (args.length < 2) {
        console.error("Error: mutation requires GraphQL mutation string");
        Deno.exit(1);
      }
      result = await mutation(args.slice(1).join(" "));
      break;

    case "scan-schema":
      result = await scanSchema();
      break;

    case "introspect-types":
      result = await introspectTypes();
      break;

    case "get-type":
      if (args.length < 2) {
        console.error("Error: get-type requires type name");
        Deno.exit(1);
      }
      result = await getType(args[1]);
      break;

    default:
      console.error(`Error: unknown command '${command}'`);
      Deno.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

// Run main if this is the main module
if (import.meta.main) {
  main();
}
