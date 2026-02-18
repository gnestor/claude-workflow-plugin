#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * QuickBooks Online API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write qbo-client.ts <command> [args...]
 *
 * Commands:
 *   auth                                          - Authenticate and obtain refresh token
 *   company-info                                  - Get company information
 *   list-accounts [type]                          - List chart of accounts
 *   list-customers [active-only]                  - List customers
 *   list-vendors [active-only]                    - List vendors
 *   list-invoices [status] [limit]                - List invoices (status: unpaid|paid|all)
 *   list-bills [status] [limit]                   - List bills (status: unpaid|paid|all)
 *   list-items [type]                             - List items (type: Inventory|Service|NonInventory|all)
 *   get <entity-type> <id>                        - Get entity by ID
 *   query <entity-type> [where] [order-by] [limit] - Query entities
 *   create <entity-type> <json-data>              - Create entity
 *   update <entity-type> <json-data>              - Update entity
 *   delete <entity-type> <id> <sync-token>        - Delete entity
 */

import "@std/dotenv/load";

// QuickBooks API configuration
const CLIENT_ID = Deno.env.get("QUICKBOOKS_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("QUICKBOOKS_CLIENT_SECRET");
const ENVIRONMENT = Deno.env.get("QUICKBOOKS_ENVIRONMENT") || "production";
const REFRESH_TOKEN = Deno.env.get("QUICKBOOKS_REFRESH_TOKEN");
const REALM_ID = Deno.env.get("QUICKBOOKS_REALM_ID");

// API endpoints based on environment
const AUTH_BASE = "https://oauth.platform.intuit.com/oauth2/v1";
const API_BASE = ENVIRONMENT === "sandbox"
  ? "https://sandbox-quickbooks.api.intuit.com"
  : "https://quickbooks.api.intuit.com";

// OAuth scopes
const SCOPES = ["com.intuit.quickbooks.accounting"];

// Supported entity types
const ENTITY_TYPES = [
  "Account",
  "Bill",
  "BillPayment",
  "Customer",
  "Employee",
  "Estimate",
  "Invoice",
  "Item",
  "JournalEntry",
  "Payment",
  "Purchase",
  "Vendor",
] as const;

type EntityType = typeof ENTITY_TYPES[number];

// Token cache to avoid repeated refreshes
let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Get access token, refreshing if necessary
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Missing QUICKBOOKS_CLIENT_ID or QUICKBOOKS_CLIENT_SECRET in .env file"
    );
  }

  if (!REFRESH_TOKEN) {
    throw new Error(
      "Missing QUICKBOOKS_REFRESH_TOKEN. Run 'auth' command to authenticate."
    );
  }

  const response = await fetch(`${AUTH_BASE}/tokens/bearer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh access token: ${error}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 60s early

  // If we got a new refresh token, save it
  if (data.refresh_token && data.refresh_token !== REFRESH_TOKEN) {
    await updateEnvFile("QUICKBOOKS_REFRESH_TOKEN", data.refresh_token);
  }

  return cachedAccessToken!;
}

/**
 * Make authenticated request to QuickBooks API
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  if (!REALM_ID) {
    throw new Error(
      "Missing QUICKBOOKS_REALM_ID. Run 'auth' command to authenticate."
    );
  }

  const accessToken = await getAccessToken();
  const url = `${API_BASE}/v3/company/${REALM_ID}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Update .env file with new value
 */
async function updateEnvFile(key: string, value: string): Promise<void> {
  const envPath = ".env";
  let content: string;

  try {
    content = await Deno.readTextFile(envPath);
  } catch {
    content = "";
  }

  const regex = new RegExp(`^${key}=.*$`, "m");
  const newLine = `${key}="${value}"`;

  if (regex.test(content)) {
    content = content.replace(regex, newLine);
  } else {
    content = content.trim() + "\n" + newLine + "\n";
  }

  await Deno.writeTextFile(envPath, content);
}

/**
 * OAuth authentication flow using loopback redirect
 *
 * Note: QuickBooks returns realmId in the callback URL, but oauthLoopback
 * doesn't capture extra params. If QUICKBOOKS_REALM_ID is not already set,
 * the user will be prompted to provide it after auth completes.
 */
async function authenticate(): Promise<{ success: boolean; message?: string; error?: string; realmId?: string; refreshTokenSaved?: boolean }> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      success: false,
      error: "Missing QUICKBOOKS_CLIENT_ID or QUICKBOOKS_CLIENT_SECRET in .env file",
    };
  }

  try {
    const { oauthLoopback, saveEnvVar } = await import("lib/oauth.ts");

    const tokens = await oauthLoopback({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      authUrl: "https://appcenter.intuit.com/connect/oauth2",
      tokenUrl: `${AUTH_BASE}/tokens/bearer`,
      scopes: SCOPES,
      serviceName: "QuickBooks",
    });

    // Save refresh token to .env
    await saveEnvVar("QUICKBOOKS_REFRESH_TOKEN", tokens.refreshToken);

    console.error("\nRefresh token saved to .env");

    // Handle realmId - QuickBooks requires it for API calls
    let realmId = REALM_ID;
    if (!realmId) {
      console.error("\nQuickBooks requires a Realm ID (Company ID) for API calls.");
      console.error("You can find it in the callback URL parameter 'realmId' or in your QuickBooks dashboard URL.");
      console.error("\nPlease enter the Realm ID:\n");

      const buf = new Uint8Array(256);
      const n = await Deno.stdin.read(buf);
      if (n) {
        realmId = new TextDecoder().decode(buf.subarray(0, n)).trim();
        if (realmId) {
          await saveEnvVar("QUICKBOOKS_REALM_ID", realmId);
          console.error("Realm ID saved to .env");
        }
      }

      if (!realmId) {
        console.error("Warning: No Realm ID provided. Set QUICKBOOKS_REALM_ID in .env before making API calls.");
      }
    }

    return {
      success: true,
      message: "Authentication successful",
      realmId: realmId || undefined,
      refreshTokenSaved: true,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get company info
 */
async function getCompanyInfo(): Promise<{ success: boolean; company?: unknown; error?: string }> {
  try {
    const data = await apiRequest("/companyinfo/" + REALM_ID) as { CompanyInfo: unknown };
    return {
      success: true,
      company: data.CompanyInfo,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Query entities using QBO query language
 */
async function queryEntities(
  entityType: EntityType,
  where?: string,
  orderBy?: string,
  limit?: number
): Promise<{ success: boolean; query?: string; entities?: unknown[]; count?: number; error?: string }> {
  try {
    let query = `SELECT * FROM ${entityType}`;

    if (where && where.trim()) {
      query += ` WHERE ${where}`;
    }

    if (orderBy && orderBy.trim()) {
      query += ` ORDERBY ${orderBy}`;
    }

    if (limit && limit > 0) {
      query += ` MAXRESULTS ${limit}`;
    }

    const data = await apiRequest(
      `/query?query=${encodeURIComponent(query)}`
    ) as { QueryResponse: Record<string, unknown[]> & { totalCount?: number } };

    return {
      success: true,
      query,
      entities: data.QueryResponse[entityType] || [],
      count: data.QueryResponse.totalCount || 0,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get entity by ID
 */
async function getEntity(entityType: EntityType, id: string): Promise<{ success: boolean; entity?: unknown; error?: string }> {
  try {
    const endpoint = `/${entityType.toLowerCase()}/${id}`;
    const data = await apiRequest(endpoint) as Record<string, unknown>;

    return {
      success: true,
      entity: data[entityType],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create entity
 */
async function createEntity(
  entityType: EntityType,
  entityData: unknown
): Promise<{ success: boolean; entity?: unknown; error?: string }> {
  try {
    const endpoint = `/${entityType.toLowerCase()}`;
    const data = await apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(entityData),
    }) as Record<string, unknown>;

    return {
      success: true,
      entity: data[entityType],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update entity
 */
async function updateEntity(
  entityType: EntityType,
  entityData: { Id?: string; SyncToken?: string | number; [key: string]: unknown }
): Promise<{ success: boolean; entity?: unknown; error?: string }> {
  try {
    if (!entityData.Id) {
      throw new Error("Entity Id is required for update");
    }
    if (entityData.SyncToken === undefined && entityData.SyncToken !== 0 && entityData.SyncToken !== "0") {
      throw new Error("SyncToken is required for update");
    }

    const endpoint = `/${entityType.toLowerCase()}`;
    const data = await apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(entityData),
    }) as Record<string, unknown>;

    return {
      success: true,
      entity: data[entityType],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete entity
 */
async function deleteEntity(
  entityType: EntityType,
  id: string,
  syncToken: string
): Promise<{ success: boolean; deleted?: boolean; error?: string }> {
  try {
    const endpoint = `/${entityType.toLowerCase()}?operation=delete`;
    await apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify({ Id: id, SyncToken: syncToken }),
    });

    return {
      success: true,
      deleted: true,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Supported report types
 */
const REPORT_TYPES = [
  "ProfitAndLoss",
  "ProfitAndLossDetail",
  "BalanceSheet",
  "BalanceSheetDetail",
  "CashFlow",
  "TrialBalance",
  "GeneralLedger",
  "AccountList",
  "CustomerBalance",
  "CustomerBalanceDetail",
  "CustomerIncome",
  "VendorBalance",
  "VendorBalanceDetail",
  "AgedPayables",
  "AgedPayableDetail",
  "AgedReceivables",
  "AgedReceivableDetail",
  "TransactionList",
] as const;

type ReportType = typeof REPORT_TYPES[number];

/**
 * Run a financial report
 */
async function runReport(
  reportType: ReportType,
  params: Record<string, string> = {}
): Promise<{ success: boolean; report?: unknown; error?: string }> {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString();
    const endpoint = `/reports/${reportType}${queryString ? `?${queryString}` : ""}`;

    const data = await apiRequest(endpoint);

    return {
      success: true,
      report: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * List accounts (chart of accounts)
 */
async function listAccounts(accountType?: string) {
  const where = accountType ? `AccountType = '${accountType}'` : "";
  return queryEntities("Account", where, "Name", 1000);
}

/**
 * List customers
 */
async function listCustomers(activeOnly: boolean = true) {
  const where = activeOnly ? "Active = true" : "";
  return queryEntities("Customer", where, "DisplayName", 1000);
}

/**
 * List vendors
 */
async function listVendors(activeOnly: boolean = true) {
  const where = activeOnly ? "Active = true" : "";
  return queryEntities("Vendor", where, "DisplayName", 1000);
}

/**
 * List invoices
 */
async function listInvoices(
  status: "unpaid" | "paid" | "all" = "all",
  limit: number = 100
) {
  let where = "";
  if (status === "unpaid") {
    where = "Balance > '0'";
  } else if (status === "paid") {
    where = "Balance = '0'";
  }
  return queryEntities("Invoice", where, "MetaData.CreateTime DESC", limit);
}

/**
 * List bills
 */
async function listBills(
  status: "unpaid" | "paid" | "all" = "all",
  limit: number = 100
) {
  let where = "";
  if (status === "unpaid") {
    where = "Balance > '0'";
  } else if (status === "paid") {
    where = "Balance = '0'";
  }
  return queryEntities("Bill", where, "MetaData.CreateTime DESC", limit);
}

/**
 * List items (products/services)
 */
async function listItems(
  type: "Inventory" | "Service" | "NonInventory" | "all" = "all"
) {
  const where = type !== "all" ? `Type = '${type}'` : "";
  return queryEntities("Item", where, "Name", 1000);
}

/**
 * Validate entity type
 */
function validateEntityType(type: string): EntityType {
  const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (!ENTITY_TYPES.includes(normalized as EntityType)) {
    throw new Error(
      `Invalid entity type: ${type}. Valid types: ${ENTITY_TYPES.join(", ")}`
    );
  }
  return normalized as EntityType;
}

// Main CLI handler
async function main() {
  const args = Deno.args;
  const command = args[0];

  if (!command) {
    console.error("Usage: qbo-client.ts <command> [args...]");
    console.error("\nCommands:");
    console.error("  auth                                          - Authenticate with QuickBooks");
    console.error("  company-info                                  - Get company information");
    console.error("  report <type> [start-date] [end-date]         - Run financial report");
    console.error("  list-accounts [type]                          - List chart of accounts");
    console.error("  list-customers [active-only]                  - List customers");
    console.error("  list-vendors [active-only]                    - List vendors");
    console.error("  list-invoices [status] [limit]                - List invoices");
    console.error("  list-bills [status] [limit]                   - List bills");
    console.error("  list-items [type]                             - List items");
    console.error("  get <entity-type> <id>                        - Get entity by ID");
    console.error("  query <entity-type> [where] [order-by] [limit] - Query entities");
    console.error("  create <entity-type> <json-data>              - Create entity");
    console.error("  update <entity-type> <json-data>              - Update entity");
    console.error("  delete <entity-type> <id> <sync-token>        - Delete entity");
    console.error("\nEntity types: " + ENTITY_TYPES.join(", "));
    Deno.exit(1);
  }

  let result: unknown;

  switch (command) {
    case "auth":
      result = await authenticate();
      break;

    case "company-info":
      result = await getCompanyInfo();
      break;

    case "report":
      if (!args[1]) {
        console.error("Usage: report <type> [start-date] [end-date]");
        console.error("\nReport types: " + REPORT_TYPES.join(", "));
        Deno.exit(1);
      }
      {
        const reportType = args[1] as ReportType;
        if (!REPORT_TYPES.includes(reportType)) {
          console.error(`Invalid report type: ${args[1]}`);
          console.error("Valid types: " + REPORT_TYPES.join(", "));
          Deno.exit(1);
        }
        const params: Record<string, string> = {};
        if (args[2]) params.start_date = args[2];
        if (args[3]) params.end_date = args[3];
        result = await runReport(reportType, params);
      }
      break;

    case "list-accounts":
      result = await listAccounts(args[1]);
      break;

    case "list-customers":
      result = await listCustomers(args[1] !== "false");
      break;

    case "list-vendors":
      result = await listVendors(args[1] !== "false");
      break;

    case "list-invoices":
      result = await listInvoices(
        (args[1] as "unpaid" | "paid" | "all") || "all",
        args[2] ? parseInt(args[2]) : 100
      );
      break;

    case "list-bills":
      result = await listBills(
        (args[1] as "unpaid" | "paid" | "all") || "all",
        args[2] ? parseInt(args[2]) : 100
      );
      break;

    case "list-items":
      result = await listItems(
        (args[1] as "Inventory" | "Service" | "NonInventory" | "all") || "all"
      );
      break;

    case "get":
      if (!args[1] || !args[2]) {
        console.error("Usage: get <entity-type> <id>");
        Deno.exit(1);
      }
      result = await getEntity(validateEntityType(args[1]), args[2]);
      break;

    case "query":
      if (!args[1]) {
        console.error("Usage: query <entity-type> [where] [order-by] [limit]");
        Deno.exit(1);
      }
      result = await queryEntities(
        validateEntityType(args[1]),
        args[2],
        args[3],
        args[4] ? parseInt(args[4]) : undefined
      );
      break;

    case "create":
      if (!args[1] || !args[2]) {
        console.error("Usage: create <entity-type> <json-data>");
        Deno.exit(1);
      }
      result = await createEntity(validateEntityType(args[1]), JSON.parse(args[2]));
      break;

    case "update":
      if (!args[1] || !args[2]) {
        console.error("Usage: update <entity-type> <json-data>");
        Deno.exit(1);
      }
      result = await updateEntity(validateEntityType(args[1]), JSON.parse(args[2]));
      break;

    case "delete":
      if (!args[1] || !args[2] || !args[3]) {
        console.error("Usage: delete <entity-type> <id> <sync-token>");
        Deno.exit(1);
      }
      result = await deleteEntity(validateEntityType(args[1]), args[2], args[3]);
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
    console.error(JSON.stringify({ success: false, error: getErrorMessage(error) }, null, 2));
    Deno.exit(1);
  });
}
