#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write
/**
 * Google Sheets API Client for Claude Code
 *
 * Provides access to Google Sheets data via the Sheets API v4
 * Uses shared OAuth2 authentication from google.ts
 */

import "@std/dotenv/load";
import { getAccessToken, authenticate, checkOAuthConfig } from "../../scripts/google.ts";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive"
];

/**
 * Make authenticated request to Google Sheets API
 */
async function sheetsRequest(path: string, options: RequestInit = {}): Promise<any> {
  const accessToken = await getAccessToken(SCOPES);
  const url = `${SHEETS_API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sheets API error: ${error}`);
  }

  return response.json();
}

/**
 * Get spreadsheet metadata
 */
async function getSpreadsheet(spreadsheetId: string): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}`);
}

/**
 * Get values from a specific range in a spreadsheet
 */
async function getValues(
  spreadsheetId: string,
  range: string,
  options: {
    majorDimension?: "ROWS" | "COLUMNS";
    valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";
    dateTimeRenderOption?: "SERIAL_NUMBER" | "FORMATTED_STRING";
  } = {}
): Promise<any> {
  const params = new URLSearchParams();
  if (options.majorDimension) params.set("majorDimension", options.majorDimension);
  if (options.valueRenderOption) params.set("valueRenderOption", options.valueRenderOption);
  if (options.dateTimeRenderOption) params.set("dateTimeRenderOption", options.dateTimeRenderOption);

  const queryString = params.toString();
  const path = `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}${queryString ? `?${queryString}` : ""}`;

  return sheetsRequest(path);
}

/**
 * Get values from multiple ranges in a single request
 */
async function batchGetValues(
  spreadsheetId: string,
  ranges: string[],
  options: {
    majorDimension?: "ROWS" | "COLUMNS";
    valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";
    dateTimeRenderOption?: "SERIAL_NUMBER" | "FORMATTED_STRING";
  } = {}
): Promise<any> {
  const params = new URLSearchParams();
  ranges.forEach(range => params.append("ranges", range));
  if (options.majorDimension) params.set("majorDimension", options.majorDimension);
  if (options.valueRenderOption) params.set("valueRenderOption", options.valueRenderOption);
  if (options.dateTimeRenderOption) params.set("dateTimeRenderOption", options.dateTimeRenderOption);

  return sheetsRequest(`/spreadsheets/${spreadsheetId}/values:batchGet?${params.toString()}`);
}

/**
 * Create a new spreadsheet
 */
async function createSpreadsheet(title: string, sheets?: Array<{title: string}>): Promise<any> {
  const body: any = {
    properties: { title }
  };

  if (sheets && sheets.length > 0) {
    body.sheets = sheets.map(sheet => ({
      properties: { title: sheet.title }
    }));
  }

  return sheetsRequest("/spreadsheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

/**
 * Apply batch updates to spreadsheet (formatting, formulas, etc.)
 */
async function batchUpdateSpreadsheet(spreadsheetId: string, requests: any[]): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requests })
  });
}

/**
 * Get spreadsheet by data filter
 */
async function getSpreadsheetByDataFilter(
  spreadsheetId: string,
  dataFilters: any[],
  includeGridData = false
): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}:getByDataFilter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataFilters, includeGridData })
  });
}

/**
 * Update values in a range
 */
async function updateValues(
  spreadsheetId: string,
  range: string,
  values: any[][],
  options: {
    valueInputOption?: "RAW" | "USER_ENTERED";
  } = {}
): Promise<any> {
  const params = new URLSearchParams();
  params.set("valueInputOption", options.valueInputOption || "USER_ENTERED");

  return sheetsRequest(`/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?${params.toString()}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values })
  });
}

/**
 * Append values to a range
 */
async function appendValues(
  spreadsheetId: string,
  range: string,
  values: any[][],
  options: {
    valueInputOption?: "RAW" | "USER_ENTERED";
    insertDataOption?: "OVERWRITE" | "INSERT_ROWS";
  } = {}
): Promise<any> {
  const params = new URLSearchParams();
  params.set("valueInputOption", options.valueInputOption || "USER_ENTERED");
  if (options.insertDataOption) {
    params.set("insertDataOption", options.insertDataOption);
  }

  return sheetsRequest(`/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values })
  });
}

/**
 * Clear values from a range
 */
async function clearValues(spreadsheetId: string, range: string): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * Batch update values in multiple ranges
 */
async function batchUpdateValues(
  spreadsheetId: string,
  data: Array<{ range: string; values: any[][] }>,
  options: {
    valueInputOption?: "RAW" | "USER_ENTERED";
  } = {}
): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      valueInputOption: options.valueInputOption || "USER_ENTERED",
      data
    })
  });
}

/**
 * Batch clear values from multiple ranges
 */
async function batchClearValues(spreadsheetId: string, ranges: string[]): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ranges })
  });
}

/**
 * Get values by data filter
 */
async function batchGetValuesByDataFilter(
  spreadsheetId: string,
  dataFilters: any[],
  options: {
    majorDimension?: "ROWS" | "COLUMNS";
    valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";
    dateTimeRenderOption?: "SERIAL_NUMBER" | "FORMATTED_STRING";
  } = {}
): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}/values:batchGetByDataFilter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataFilters,
      ...options
    })
  });
}

/**
 * Batch update values by data filter
 */
async function batchUpdateValuesByDataFilter(
  spreadsheetId: string,
  data: Array<{ dataFilter: any; values: any[][] }>,
  options: {
    valueInputOption?: "RAW" | "USER_ENTERED";
  } = {}
): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}/values:batchUpdateByDataFilter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      valueInputOption: options.valueInputOption || "USER_ENTERED",
      data
    })
  });
}

/**
 * Batch clear values by data filter
 */
async function batchClearValuesByDataFilter(
  spreadsheetId: string,
  dataFilters: any[]
): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}/values:batchClearByDataFilter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataFilters })
  });
}

/**
 * Copy a sheet to another spreadsheet
 */
async function copySheet(
  spreadsheetId: string,
  sheetId: number,
  destinationSpreadsheetId: string
): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}/sheets/${sheetId}:copyTo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destinationSpreadsheetId })
  });
}

/**
 * Get developer metadata
 */
async function getDeveloperMetadata(
  spreadsheetId: string,
  metadataId: number
): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}/developerMetadata/${metadataId}`);
}

/**
 * Search developer metadata
 */
async function searchDeveloperMetadata(
  spreadsheetId: string,
  dataFilters: any[]
): Promise<any> {
  return sheetsRequest(`/spreadsheets/${spreadsheetId}/developerMetadata:search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataFilters })
  });
}

/**
 * List all sheets in a spreadsheet
 */
async function listSheets(spreadsheetId: string): Promise<void> {
  const spreadsheet = await getSpreadsheet(spreadsheetId);

  console.log(JSON.stringify({
    spreadsheetId: spreadsheet.spreadsheetId,
    title: spreadsheet.properties.title,
    sheets: spreadsheet.sheets.map((sheet: any) => ({
      sheetId: sheet.properties.sheetId,
      title: sheet.properties.title,
      index: sheet.properties.index,
      gridProperties: {
        rowCount: sheet.properties.gridProperties.rowCount,
        columnCount: sheet.properties.gridProperties.columnCount
      }
    }))
  }, null, 2));
}

/**
 * Get data from a specific range
 */
async function getData(spreadsheetId: string, range: string, renderOption?: string): Promise<void> {
  const options: any = {};
  if (renderOption) {
    options.valueRenderOption = renderOption;
  }

  const result = await getValues(spreadsheetId, range, options);

  console.log(JSON.stringify({
    range: result.range,
    majorDimension: result.majorDimension,
    values: result.values || []
  }, null, 2));
}

/**
 * Get data from multiple ranges
 */
async function getBatchData(spreadsheetId: string, ranges: string[], renderOption?: string): Promise<void> {
  const options: any = {};
  if (renderOption) {
    options.valueRenderOption = renderOption;
  }

  const result = await batchGetValues(spreadsheetId, ranges, options);

  console.log(JSON.stringify({
    spreadsheetId: result.spreadsheetId,
    valueRanges: result.valueRanges.map((vr: any) => ({
      range: vr.range,
      majorDimension: vr.majorDimension,
      values: vr.values || []
    }))
  }, null, 2));
}

/**
 * Extract spreadsheet ID from URL or return as-is if already an ID
 */
function extractSpreadsheetId(input: string): string {
  // If it's a URL, extract the ID
  const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Otherwise assume it's already an ID
  return input;
}

/**
 * Create a new spreadsheet (CLI handler)
 */
async function createSpreadsheetCLI(title: string, sheetNames?: string[]): Promise<void> {
  const sheets = sheetNames?.map(name => ({ title: name }));
  const result = await createSpreadsheet(title, sheets);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Update values in a range (CLI handler)
 */
async function updateValuesCLI(
  spreadsheetId: string,
  range: string,
  valuesJson: string,
  inputOption?: string
): Promise<void> {
  const values = JSON.parse(valuesJson);
  const options: any = {};
  if (inputOption) {
    options.valueInputOption = inputOption;
  }
  const result = await updateValues(spreadsheetId, range, values, options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Append values to a range (CLI handler)
 */
async function appendValuesCLI(
  spreadsheetId: string,
  range: string,
  valuesJson: string,
  inputOption?: string,
  insertOption?: string
): Promise<void> {
  const values = JSON.parse(valuesJson);
  const options: any = {};
  if (inputOption) options.valueInputOption = inputOption;
  if (insertOption) options.insertDataOption = insertOption;
  const result = await appendValues(spreadsheetId, range, values, options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Clear values from a range (CLI handler)
 */
async function clearValuesCLI(spreadsheetId: string, range: string): Promise<void> {
  const result = await clearValues(spreadsheetId, range);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Batch update values (CLI handler)
 */
async function batchUpdateValuesCLI(
  spreadsheetId: string,
  dataJson: string,
  inputOption?: string
): Promise<void> {
  const data = JSON.parse(dataJson);
  const options: any = {};
  if (inputOption) options.valueInputOption = inputOption;
  const result = await batchUpdateValues(spreadsheetId, data, options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Batch clear values (CLI handler)
 */
async function batchClearValuesCLI(spreadsheetId: string, ranges: string[]): Promise<void> {
  const result = await batchClearValues(spreadsheetId, ranges);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Batch update spreadsheet (CLI handler)
 */
async function batchUpdateSpreadsheetCLI(spreadsheetId: string, requestsJson: string): Promise<void> {
  const requests = JSON.parse(requestsJson);
  const result = await batchUpdateSpreadsheet(spreadsheetId, requests);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Get spreadsheet by data filter (CLI handler)
 */
async function getSpreadsheetByDataFilterCLI(
  spreadsheetId: string,
  dataFiltersJson: string,
  includeGridData = false
): Promise<void> {
  const dataFilters = JSON.parse(dataFiltersJson);
  const result = await getSpreadsheetByDataFilter(spreadsheetId, dataFilters, includeGridData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Batch get values by data filter (CLI handler)
 */
async function batchGetValuesByDataFilterCLI(
  spreadsheetId: string,
  dataFiltersJson: string,
  renderOption?: string
): Promise<void> {
  const dataFilters = JSON.parse(dataFiltersJson);
  const options: any = {};
  if (renderOption) options.valueRenderOption = renderOption;
  const result = await batchGetValuesByDataFilter(spreadsheetId, dataFilters, options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Batch update values by data filter (CLI handler)
 */
async function batchUpdateValuesByDataFilterCLI(
  spreadsheetId: string,
  dataJson: string,
  inputOption?: string
): Promise<void> {
  const data = JSON.parse(dataJson);
  const options: any = {};
  if (inputOption) options.valueInputOption = inputOption;
  const result = await batchUpdateValuesByDataFilter(spreadsheetId, data, options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Batch clear values by data filter (CLI handler)
 */
async function batchClearValuesByDataFilterCLI(
  spreadsheetId: string,
  dataFiltersJson: string
): Promise<void> {
  const dataFilters = JSON.parse(dataFiltersJson);
  const result = await batchClearValuesByDataFilter(spreadsheetId, dataFilters);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Copy sheet to another spreadsheet (CLI handler)
 */
async function copySheetCLI(
  spreadsheetId: string,
  sheetId: string,
  destinationSpreadsheetId: string
): Promise<void> {
  const result = await copySheet(spreadsheetId, parseInt(sheetId), destinationSpreadsheetId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Get developer metadata (CLI handler)
 */
async function getDeveloperMetadataCLI(
  spreadsheetId: string,
  metadataId: string
): Promise<void> {
  const result = await getDeveloperMetadata(spreadsheetId, parseInt(metadataId));
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Search developer metadata (CLI handler)
 */
async function searchDeveloperMetadataCLI(
  spreadsheetId: string,
  dataFiltersJson: string
): Promise<void> {
  const dataFilters = JSON.parse(dataFiltersJson);
  const result = await searchDeveloperMetadata(spreadsheetId, dataFilters);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * CLI Command Handler
 */
async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.error(`
Google Sheets API Client

Usage:
  sheets-client.ts <command> [options]

Commands:
  # Authentication
  auth                                    Authenticate with Google OAuth

  # Read Operations
  list-sheets <spreadsheet>              List all sheets in a spreadsheet
  get <spreadsheet> <range>              Get values from a range
  batch-get <spreadsheet> <range1> ...   Get values from multiple ranges
  get-by-filter <spreadsheet> <filters>  Get spreadsheet by data filter

  # Write Operations
  create <title> [sheet1] [sheet2] ...   Create a new spreadsheet
  update <spreadsheet> <range> <values>  Update values in a range
  append <spreadsheet> <range> <values>  Append values to a range
  clear <spreadsheet> <range>            Clear values from a range
  batch-update <spreadsheet> <data>      Update multiple ranges
  batch-clear <spreadsheet> <range1> ... Clear multiple ranges

  # Advanced Operations
  batch-update-spreadsheet <spreadsheet> <requests>  Apply formatting/formulas
  batch-get-by-filter <spreadsheet> <filters>        Get values by data filter
  batch-update-by-filter <spreadsheet> <data>        Update values by data filter
  batch-clear-by-filter <spreadsheet> <filters>      Clear values by data filter
  copy-sheet <spreadsheet> <sheetId> <destId>        Copy sheet to another spreadsheet

  # Developer Metadata
  get-metadata <spreadsheet> <metadataId>    Get developer metadata
  search-metadata <spreadsheet> <filters>    Search developer metadata

Arguments:
  <spreadsheet>  Spreadsheet ID or full URL
  <range>        A1 notation range (e.g., "Sheet1!A1:D10", "'P&L Statement'!A1:Z100")
  <values>       JSON array of arrays (e.g., '[["A1","B1"],["A2","B2"]]')
  <data>         JSON array of {range, values} objects
  <filters>      JSON array of data filter objects
  <requests>     JSON array of batch update request objects

Options:
  --formatted    Return formatted values (default for reads)
  --unformatted  Return unformatted values
  --formula      Return formula values
  --raw          Use RAW input option (values not parsed)
  --user-entered Use USER_ENTERED input option (default for writes)
  --overwrite    Overwrite existing data (default for append)
  --insert-rows  Insert new rows for append

Environment Variables:
  GOOGLE_CLIENT_ID       OAuth client ID
  GOOGLE_CLIENT_SECRET   OAuth client secret
  GOOGLE_REFRESH_TOKEN   OAuth refresh token (obtained via 'auth' command)

Examples:
  # Authenticate
  sheets-client.ts auth

  # List sheets
  sheets-client.ts list-sheets 1o_jWQs1KjRN1aEqFDH0B1hIsq5Lye_Nu030kuvizVOs

  # Get data
  sheets-client.ts get <id> "'P&L Statement'!A1:Z100"
  sheets-client.ts batch-get <id> "Sheet1!A1:B10" "Sheet2!C1:D10"

  # Create spreadsheet
  sheets-client.ts create "My New Sheet" "Sheet1" "Sheet2"

  # Update data
  sheets-client.ts update <id> "Sheet1!A1:B2" '[["Name","Age"],["John","30"]]'
  sheets-client.ts append <id> "Sheet1!A1:B1" '[["New","Row"]]' --insert-rows

  # Clear data
  sheets-client.ts clear <id> "Sheet1!A1:B10"
  sheets-client.ts batch-clear <id> "Sheet1!A1:B10" "Sheet2!C1:D5"
    `);
    Deno.exit(1);
  }

  const command = args[0];

  try {
    switch (command) {
      case "auth": {
        const result = await authenticate(SCOPES, "Google Sheets");
        if (!result.success) {
          console.error(`Error: ${result.error}`);
          Deno.exit(1);
        }
        break;
      }

      case "list-sheets": {
        if (args.length < 2) {
          console.error("Error: Missing spreadsheet ID/URL");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        await listSheets(spreadsheetId);
        break;
      }

      case "get": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and range");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const range = args[2];
        const renderOption = args.includes("--unformatted") ? "UNFORMATTED_VALUE"
          : args.includes("--formula") ? "FORMULA"
          : "FORMATTED_VALUE";
        await getData(spreadsheetId, range, renderOption);
        break;
      }

      case "batch-get": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and ranges");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const ranges = args.slice(2).filter(arg => !arg.startsWith("--"));
        const renderOption = args.includes("--unformatted") ? "UNFORMATTED_VALUE"
          : args.includes("--formula") ? "FORMULA"
          : "FORMATTED_VALUE";
        await getBatchData(spreadsheetId, ranges, renderOption);
        break;
      }

      case "create": {
        if (args.length < 2) {
          console.error("Error: Missing spreadsheet title");
          Deno.exit(1);
        }
        const title = args[1];
        const sheetNames = args.slice(2).filter(arg => !arg.startsWith("--"));
        await createSpreadsheetCLI(title, sheetNames.length > 0 ? sheetNames : undefined);
        break;
      }

      case "update": {
        if (args.length < 4) {
          console.error("Error: Missing spreadsheet ID/URL, range, or values");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const range = args[2];
        const valuesJson = args[3];
        const inputOption = args.includes("--raw") ? "RAW" : "USER_ENTERED";
        await updateValuesCLI(spreadsheetId, range, valuesJson, inputOption);
        break;
      }

      case "append": {
        if (args.length < 4) {
          console.error("Error: Missing spreadsheet ID/URL, range, or values");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const range = args[2];
        const valuesJson = args[3];
        const inputOption = args.includes("--raw") ? "RAW" : "USER_ENTERED";
        const insertOption = args.includes("--insert-rows") ? "INSERT_ROWS" : "OVERWRITE";
        await appendValuesCLI(spreadsheetId, range, valuesJson, inputOption, insertOption);
        break;
      }

      case "clear": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and range");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const range = args[2];
        await clearValuesCLI(spreadsheetId, range);
        break;
      }

      case "batch-update": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and data");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const dataJson = args[2];
        const inputOption = args.includes("--raw") ? "RAW" : "USER_ENTERED";
        await batchUpdateValuesCLI(spreadsheetId, dataJson, inputOption);
        break;
      }

      case "batch-clear": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and ranges");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const ranges = args.slice(2).filter(arg => !arg.startsWith("--"));
        await batchClearValuesCLI(spreadsheetId, ranges);
        break;
      }

      case "batch-update-spreadsheet": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and requests");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const requestsJson = args[2];
        await batchUpdateSpreadsheetCLI(spreadsheetId, requestsJson);
        break;
      }

      case "get-by-filter": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and data filters");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const dataFiltersJson = args[2];
        const includeGridData = args.includes("--include-grid-data");
        await getSpreadsheetByDataFilterCLI(spreadsheetId, dataFiltersJson, includeGridData);
        break;
      }

      case "batch-get-by-filter": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and data filters");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const dataFiltersJson = args[2];
        const renderOption = args.includes("--unformatted") ? "UNFORMATTED_VALUE"
          : args.includes("--formula") ? "FORMULA"
          : "FORMATTED_VALUE";
        await batchGetValuesByDataFilterCLI(spreadsheetId, dataFiltersJson, renderOption);
        break;
      }

      case "batch-update-by-filter": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and data");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const dataJson = args[2];
        const inputOption = args.includes("--raw") ? "RAW" : "USER_ENTERED";
        await batchUpdateValuesByDataFilterCLI(spreadsheetId, dataJson, inputOption);
        break;
      }

      case "batch-clear-by-filter": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and data filters");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const dataFiltersJson = args[2];
        await batchClearValuesByDataFilterCLI(spreadsheetId, dataFiltersJson);
        break;
      }

      case "copy-sheet": {
        if (args.length < 4) {
          console.error("Error: Missing spreadsheet ID/URL, sheet ID, or destination spreadsheet ID");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const sheetId = args[2];
        const destinationSpreadsheetId = extractSpreadsheetId(args[3]);
        await copySheetCLI(spreadsheetId, sheetId, destinationSpreadsheetId);
        break;
      }

      case "get-metadata": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and metadata ID");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const metadataId = args[2];
        await getDeveloperMetadataCLI(spreadsheetId, metadataId);
        break;
      }

      case "search-metadata": {
        if (args.length < 3) {
          console.error("Error: Missing spreadsheet ID/URL and data filters");
          Deno.exit(1);
        }
        const spreadsheetId = extractSpreadsheetId(args[1]);
        const dataFiltersJson = args[2];
        await searchDeveloperMetadataCLI(spreadsheetId, dataFiltersJson);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        Deno.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
