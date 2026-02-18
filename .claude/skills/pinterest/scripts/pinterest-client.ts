#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Pinterest API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write pinterest-client.ts <command> [args...]
 *
 * Commands:
 *   auth                                              - OAuth 2.0 authentication flow
 *   account-info                                      - Get user account details
 *   account-analytics <start-date> <end-date>        - Get account analytics
 *   top-pins <start-date> <end-date>                 - Get top performing pins
 *   list-followers [page-size]                       - List followers
 *   list-following [page-size]                       - List following
 *   list-boards [page-size]                          - List all boards
 *   get-board <board-id>                             - Get board details
 *   create-board <json>                              - Create new board
 *   update-board <board-id> <json>                   - Update board
 *   delete-board <board-id>                          - Delete board
 *   list-board-pins <board-id> [page-size]           - List pins on board
 *   list-sections <board-id>                         - List board sections
 *   create-section <board-id> <name>                 - Create section
 *   update-section <board-id> <section-id> <name>    - Update section
 *   delete-section <board-id> <section-id>           - Delete section
 *   list-section-pins <board-id> <section-id>        - List pins in section
 *   list-pins [page-size]                            - List user's pins
 *   get-pin <pin-id>                                 - Get pin details
 *   create-pin <json>                                - Create pin
 *   update-pin <pin-id> <json>                       - Update pin
 *   delete-pin <pin-id>                              - Delete pin
 *   pin-analytics <pin-id> <start-date> <end-date>   - Get pin analytics
 *   save-pin <pin-id> <board-id> [section-id]        - Save pin to board
 *   search-boards <query>                            - Search boards by name
 *   board-summary <board-id>                         - Get board summary with pin counts
 */

import "@std/dotenv/load";

// Pinterest API configuration
const CLIENT_ID = Deno.env.get("PINTEREST_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("PINTEREST_CLIENT_SECRET");
const REFRESH_TOKEN = Deno.env.get("PINTEREST_REFRESH_TOKEN");
const ACCESS_TOKEN = Deno.env.get("PINTEREST_ACCESS_TOKEN"); // Direct access token (for trial apps)

const API_BASE = "https://api.pinterest.com/v5";
const AUTH_BASE = "https://api.pinterest.com/oauth";

// OAuth scopes
const SCOPES = [
  "boards:read",
  "boards:write",
  "pins:read",
  "pins:write",
  "user_accounts:read",
];

// Token cache
let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

// Types
interface PinterestResponse {
  items?: unknown[];
  bookmark?: string;
  [key: string]: unknown;
}

interface Result {
  success: boolean;
  [key: string]: unknown;
}

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
 * Get access token, refreshing if necessary
 */
async function getAccessToken(): Promise<string> {
  // Use direct access token if available (for trial apps without client secret)
  if (ACCESS_TOKEN) {
    return ACCESS_TOKEN;
  }

  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Missing credentials. Either set PINTEREST_ACCESS_TOKEN (for trial apps) " +
      "or both PINTEREST_CLIENT_ID and PINTEREST_CLIENT_SECRET in .env file"
    );
  }

  if (!REFRESH_TOKEN) {
    throw new Error(
      "Missing PINTEREST_REFRESH_TOKEN. Run 'auth' command to authenticate."
    );
  }

  const response = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
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
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  // Save new refresh token if rotated
  if (data.refresh_token && data.refresh_token !== REFRESH_TOKEN) {
    await updateEnvFile("PINTEREST_REFRESH_TOKEN", data.refresh_token);
  }

  return cachedAccessToken!;
}

/**
 * Make authenticated request to Pinterest API
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  const accessToken = await getAccessToken();
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinterest API error (${response.status}): ${error}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return { success: true };
  }

  return response.json();
}

/**
 * OAuth authentication flow using loopback redirect
 */
async function authenticate(): Promise<Result> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      success: false,
      error:
        "Missing PINTEREST_CLIENT_ID or PINTEREST_CLIENT_SECRET in .env file",
    };
  }

  try {
    const { oauthLoopback, saveEnvVar } = await import("lib/oauth.ts");

    const tokens = await oauthLoopback({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      authUrl: "https://www.pinterest.com/oauth/",
      tokenUrl: `${API_BASE}/oauth/token`,
      scopes: [SCOPES.join(",")], // Pinterest uses comma-separated scopes
      serviceName: "Pinterest",
    });

    // Save refresh token to .env
    await saveEnvVar("PINTEREST_REFRESH_TOKEN", tokens.refreshToken);

    console.error("\nRefresh token saved to .env");

    return {
      success: true,
      message: "Authentication successful",
      refreshTokenSaved: true,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// ============ User Account Operations ============

/**
 * Get user account info
 */
async function getAccountInfo(): Promise<Result> {
  try {
    const data = await apiRequest("/user_account");
    return { success: true, account: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get user account analytics
 */
async function getAccountAnalytics(
  startDate: string,
  endDate: string
): Promise<Result> {
  try {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      metric_types:
        "IMPRESSION,OUTBOUND_CLICK,PIN_CLICK,SAVE,ENGAGEMENT,TOTAL_ENGAGEMENT",
    });
    const data = await apiRequest(`/user_account/analytics?${params}`);
    return { success: true, analytics: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get top performing pins
 */
async function getTopPins(startDate: string, endDate: string): Promise<Result> {
  try {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      sort_by: "ENGAGEMENT",
      num_of_pins: "50",
    });
    const data = await apiRequest(`/user_account/analytics/top_pins?${params}`);
    return { success: true, topPins: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * List followers
 */
async function listFollowers(pageSize: number = 25): Promise<Result> {
  try {
    const data = (await apiRequest(
      `/user_account/followers?page_size=${pageSize}`
    )) as PinterestResponse;
    return {
      success: true,
      followers: data.items || [],
      bookmark: data.bookmark,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * List following
 */
async function listFollowing(pageSize: number = 25): Promise<Result> {
  try {
    const data = (await apiRequest(
      `/user_account/following?page_size=${pageSize}`
    )) as PinterestResponse;
    return {
      success: true,
      following: data.items || [],
      bookmark: data.bookmark,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ============ Board Operations ============

/**
 * List all boards
 */
async function listBoards(pageSize: number = 25): Promise<Result> {
  try {
    const data = (await apiRequest(
      `/boards?page_size=${pageSize}`
    )) as PinterestResponse;
    return { success: true, boards: data.items || [], bookmark: data.bookmark };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get board by ID
 */
async function getBoard(boardId: string): Promise<Result> {
  try {
    const data = await apiRequest(`/boards/${boardId}`);
    return { success: true, board: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create a new board
 */
async function createBoard(boardData: {
  name: string;
  description?: string;
  privacy?: "PUBLIC" | "PROTECTED" | "SECRET";
}): Promise<Result> {
  try {
    const data = await apiRequest("/boards", {
      method: "POST",
      body: JSON.stringify(boardData),
    });
    return { success: true, board: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update a board
 */
async function updateBoard(
  boardId: string,
  boardData: {
    name?: string;
    description?: string;
    privacy?: "PUBLIC" | "PROTECTED" | "SECRET";
  }
): Promise<Result> {
  try {
    const data = await apiRequest(`/boards/${boardId}`, {
      method: "PATCH",
      body: JSON.stringify(boardData),
    });
    return { success: true, board: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete a board
 */
async function deleteBoard(boardId: string): Promise<Result> {
  try {
    await apiRequest(`/boards/${boardId}`, { method: "DELETE" });
    return { success: true, deleted: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * List pins on a board
 */
async function listBoardPins(
  boardId: string,
  pageSize: number = 25
): Promise<Result> {
  try {
    const data = (await apiRequest(
      `/boards/${boardId}/pins?page_size=${pageSize}`
    )) as PinterestResponse;
    return { success: true, pins: data.items || [], bookmark: data.bookmark };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ============ Board Section Operations ============

/**
 * List board sections
 */
async function listSections(boardId: string): Promise<Result> {
  try {
    const data = (await apiRequest(
      `/boards/${boardId}/sections`
    )) as PinterestResponse;
    return {
      success: true,
      sections: data.items || [],
      bookmark: data.bookmark,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create a board section
 */
async function createSection(boardId: string, name: string): Promise<Result> {
  try {
    const data = await apiRequest(`/boards/${boardId}/sections`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return { success: true, section: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update a board section
 */
async function updateSection(
  boardId: string,
  sectionId: string,
  name: string
): Promise<Result> {
  try {
    const data = await apiRequest(`/boards/${boardId}/sections/${sectionId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    return { success: true, section: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete a board section
 */
async function deleteSection(
  boardId: string,
  sectionId: string
): Promise<Result> {
  try {
    await apiRequest(`/boards/${boardId}/sections/${sectionId}`, {
      method: "DELETE",
    });
    return { success: true, deleted: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * List pins in a section
 */
async function listSectionPins(
  boardId: string,
  sectionId: string
): Promise<Result> {
  try {
    const data = (await apiRequest(
      `/boards/${boardId}/sections/${sectionId}/pins`
    )) as PinterestResponse;
    return { success: true, pins: data.items || [], bookmark: data.bookmark };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ============ Pin Operations ============

/**
 * List user's pins
 */
async function listPins(pageSize: number = 25): Promise<Result> {
  try {
    const data = (await apiRequest(
      `/pins?page_size=${pageSize}`
    )) as PinterestResponse;
    return { success: true, pins: data.items || [], bookmark: data.bookmark };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get pin by ID
 */
async function getPin(pinId: string): Promise<Result> {
  try {
    const data = await apiRequest(`/pins/${pinId}`);
    return { success: true, pin: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create a pin
 */
async function createPin(pinData: {
  board_id: string;
  board_section_id?: string;
  media_source: {
    source_type: "image_url" | "image_base64" | "video_id" | "multiple_image_urls";
    url?: string;
    content_type?: string;
    data?: string;
    cover_image_url?: string;
    items?: Array<{ url: string }>;
  };
  title?: string;
  description?: string;
  alt_text?: string;
  link?: string;
}): Promise<Result> {
  try {
    const data = await apiRequest("/pins", {
      method: "POST",
      body: JSON.stringify(pinData),
    });
    return { success: true, pin: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update a pin
 */
async function updatePin(
  pinId: string,
  pinData: {
    title?: string;
    description?: string;
    alt_text?: string;
    link?: string;
    board_id?: string;
    board_section_id?: string;
  }
): Promise<Result> {
  try {
    const data = await apiRequest(`/pins/${pinId}`, {
      method: "PATCH",
      body: JSON.stringify(pinData),
    });
    return { success: true, pin: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete a pin
 */
async function deletePin(pinId: string): Promise<Result> {
  try {
    await apiRequest(`/pins/${pinId}`, { method: "DELETE" });
    return { success: true, deleted: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get pin analytics
 */
async function getPinAnalytics(
  pinId: string,
  startDate: string,
  endDate: string
): Promise<Result> {
  try {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      metric_types:
        "IMPRESSION,OUTBOUND_CLICK,PIN_CLICK,SAVE,TOTAL_COMMENTS,TOTAL_REACTIONS",
      app_types: "ALL",
      split_field: "NO_SPLIT",
    });
    const data = await apiRequest(`/pins/${pinId}/analytics?${params}`);
    return { success: true, analytics: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Save a pin to a board
 */
async function savePin(
  pinId: string,
  boardId: string,
  boardSectionId?: string
): Promise<Result> {
  try {
    const body: { board_id: string; board_section_id?: string } = {
      board_id: boardId,
    };
    if (boardSectionId) {
      body.board_section_id = boardSectionId;
    }
    const data = await apiRequest(`/pins/${pinId}/save`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { success: true, pin: data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ============ Convenience Operations ============

/**
 * Search boards by name
 */
async function searchBoards(query: string): Promise<Result> {
  try {
    const result = await listBoards(100);
    if (!result.success) return result;

    const boards = (result.boards as Array<{ name: string; id: string }>) || [];
    const queryLower = query.toLowerCase();
    const matching = boards.filter((board) =>
      board.name.toLowerCase().includes(queryLower)
    );

    return { success: true, boards: matching, query };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get board summary with pin counts
 */
async function getBoardSummary(boardId: string): Promise<Result> {
  try {
    const boardResult = await getBoard(boardId);
    if (!boardResult.success) return boardResult;

    const sectionsResult = await listSections(boardId);
    const sections = sectionsResult.success
      ? (sectionsResult.sections as Array<{ id: string; name: string }>)
      : [];

    // Get pin count for the board
    const pinsResult = await listBoardPins(boardId, 1);
    const board = boardResult.board as { name: string; pin_count?: number };

    return {
      success: true,
      summary: {
        board: boardResult.board,
        pinCount: board.pin_count || 0,
        sectionCount: sections.length,
        sections: sections.map((s) => ({ id: s.id, name: s.name })),
      },
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ============ CLI Handler ============

function printUsage(): void {
  console.error("Usage: pinterest-client.ts <command> [args...]");
  console.error("\nAuthentication:");
  console.error("  auth                                          - OAuth 2.0 authentication");
  console.error("\nUser Account:");
  console.error("  account-info                                  - Get user account details");
  console.error("  account-analytics <start> <end>               - Account analytics (YYYY-MM-DD)");
  console.error("  top-pins <start> <end>                        - Top performing pins");
  console.error("  list-followers [page-size]                    - List followers");
  console.error("  list-following [page-size]                    - List following");
  console.error("\nBoards:");
  console.error("  list-boards [page-size]                       - List all boards");
  console.error("  get-board <board-id>                          - Get board details");
  console.error("  create-board '<json>'                         - Create board");
  console.error("  update-board <board-id> '<json>'              - Update board");
  console.error("  delete-board <board-id>                       - Delete board");
  console.error("  list-board-pins <board-id> [page-size]        - List pins on board");
  console.error("  search-boards <query>                         - Search boards by name");
  console.error("  board-summary <board-id>                      - Get board summary");
  console.error("\nBoard Sections:");
  console.error("  list-sections <board-id>                      - List sections");
  console.error("  create-section <board-id> <name>              - Create section");
  console.error("  update-section <board-id> <section-id> <name> - Update section");
  console.error("  delete-section <board-id> <section-id>        - Delete section");
  console.error("  list-section-pins <board-id> <section-id>     - List pins in section");
  console.error("\nPins:");
  console.error("  list-pins [page-size]                         - List user's pins");
  console.error("  get-pin <pin-id>                              - Get pin details");
  console.error("  create-pin '<json>'                           - Create pin");
  console.error("  update-pin <pin-id> '<json>'                  - Update pin");
  console.error("  delete-pin <pin-id>                           - Delete pin");
  console.error("  pin-analytics <pin-id> <start> <end>          - Pin analytics");
  console.error("  save-pin <pin-id> <board-id> [section-id]     - Save pin to board");
  console.error("\nExamples:");
  console.error('  create-board \'{"name": "My Board", "privacy": "PUBLIC"}\'');
  console.error('  create-pin \'{"board_id": "123", "title": "My Pin", "media_source": {"source_type": "image_url", "url": "https://..."}}\'');
}

async function main() {
  const args = Deno.args;
  const command = args[0];

  if (!command) {
    printUsage();
    Deno.exit(1);
  }

  let result: Result;

  switch (command) {
    case "auth":
      result = await authenticate();
      break;

    case "account-info":
      result = await getAccountInfo();
      break;

    case "account-analytics":
      if (!args[1] || !args[2]) {
        console.error("Usage: account-analytics <start-date> <end-date>");
        Deno.exit(1);
      }
      result = await getAccountAnalytics(args[1], args[2]);
      break;

    case "top-pins":
      if (!args[1] || !args[2]) {
        console.error("Usage: top-pins <start-date> <end-date>");
        Deno.exit(1);
      }
      result = await getTopPins(args[1], args[2]);
      break;

    case "list-followers":
      result = await listFollowers(args[1] ? parseInt(args[1]) : 25);
      break;

    case "list-following":
      result = await listFollowing(args[1] ? parseInt(args[1]) : 25);
      break;

    case "list-boards":
      result = await listBoards(args[1] ? parseInt(args[1]) : 25);
      break;

    case "get-board":
      if (!args[1]) {
        console.error("Usage: get-board <board-id>");
        Deno.exit(1);
      }
      result = await getBoard(args[1]);
      break;

    case "create-board":
      if (!args[1]) {
        console.error('Usage: create-board \'{"name": "Board Name"}\'');
        Deno.exit(1);
      }
      result = await createBoard(JSON.parse(args[1]));
      break;

    case "update-board":
      if (!args[1] || !args[2]) {
        console.error('Usage: update-board <board-id> \'{"name": "New Name"}\'');
        Deno.exit(1);
      }
      result = await updateBoard(args[1], JSON.parse(args[2]));
      break;

    case "delete-board":
      if (!args[1]) {
        console.error("Usage: delete-board <board-id>");
        Deno.exit(1);
      }
      result = await deleteBoard(args[1]);
      break;

    case "list-board-pins":
      if (!args[1]) {
        console.error("Usage: list-board-pins <board-id> [page-size]");
        Deno.exit(1);
      }
      result = await listBoardPins(args[1], args[2] ? parseInt(args[2]) : 25);
      break;

    case "list-sections":
      if (!args[1]) {
        console.error("Usage: list-sections <board-id>");
        Deno.exit(1);
      }
      result = await listSections(args[1]);
      break;

    case "create-section":
      if (!args[1] || !args[2]) {
        console.error("Usage: create-section <board-id> <name>");
        Deno.exit(1);
      }
      result = await createSection(args[1], args[2]);
      break;

    case "update-section":
      if (!args[1] || !args[2] || !args[3]) {
        console.error("Usage: update-section <board-id> <section-id> <name>");
        Deno.exit(1);
      }
      result = await updateSection(args[1], args[2], args[3]);
      break;

    case "delete-section":
      if (!args[1] || !args[2]) {
        console.error("Usage: delete-section <board-id> <section-id>");
        Deno.exit(1);
      }
      result = await deleteSection(args[1], args[2]);
      break;

    case "list-section-pins":
      if (!args[1] || !args[2]) {
        console.error("Usage: list-section-pins <board-id> <section-id>");
        Deno.exit(1);
      }
      result = await listSectionPins(args[1], args[2]);
      break;

    case "list-pins":
      result = await listPins(args[1] ? parseInt(args[1]) : 25);
      break;

    case "get-pin":
      if (!args[1]) {
        console.error("Usage: get-pin <pin-id>");
        Deno.exit(1);
      }
      result = await getPin(args[1]);
      break;

    case "create-pin":
      if (!args[1]) {
        console.error('Usage: create-pin \'{"board_id": "...", "media_source": {...}}\'');
        Deno.exit(1);
      }
      result = await createPin(JSON.parse(args[1]));
      break;

    case "update-pin":
      if (!args[1] || !args[2]) {
        console.error('Usage: update-pin <pin-id> \'{"title": "..."}\'');
        Deno.exit(1);
      }
      result = await updatePin(args[1], JSON.parse(args[2]));
      break;

    case "delete-pin":
      if (!args[1]) {
        console.error("Usage: delete-pin <pin-id>");
        Deno.exit(1);
      }
      result = await deletePin(args[1]);
      break;

    case "pin-analytics":
      if (!args[1] || !args[2] || !args[3]) {
        console.error("Usage: pin-analytics <pin-id> <start-date> <end-date>");
        Deno.exit(1);
      }
      result = await getPinAnalytics(args[1], args[2], args[3]);
      break;

    case "save-pin":
      if (!args[1] || !args[2]) {
        console.error("Usage: save-pin <pin-id> <board-id> [section-id]");
        Deno.exit(1);
      }
      result = await savePin(args[1], args[2], args[3]);
      break;

    case "search-boards":
      if (!args[1]) {
        console.error("Usage: search-boards <query>");
        Deno.exit(1);
      }
      result = await searchBoards(args[1]);
      break;

    case "board-summary":
      if (!args[1]) {
        console.error("Usage: board-summary <board-id>");
        Deno.exit(1);
      }
      result = await getBoardSummary(args[1]);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      Deno.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

// Run main function
if (import.meta.main) {
  main().catch((error) => {
    console.error(
      JSON.stringify({ success: false, error: getErrorMessage(error) }, null, 2)
    );
    Deno.exit(1);
  });
}
