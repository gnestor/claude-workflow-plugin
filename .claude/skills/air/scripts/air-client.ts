#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Air API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write air-client.ts <command> [args...]
 *
 * Commands:
 *   test-auth                                    - Test API authentication
 *
 *   # Assets
 *   list-assets [--board-id ID] [--limit N] [--cursor TOKEN] [--search QUERY]
 *   get-asset <asset-id>                         - Get asset details
 *   delete-asset <asset-id>                      - Delete an asset
 *   download-asset <asset-id> <output-path>      - Download asset to local file
 *   get-asset-versions <asset-id>                - List asset versions
 *   get-asset-version <asset-id> <version-id>    - Get specific version details
 *   add-asset-tag <asset-id> <version-id> <tag-id> - Add tag to asset version
 *   remove-asset-tag <asset-id> <version-id> <tag-id> - Remove tag from asset version
 *   set-custom-field <asset-id> <field-id> <value> - Set custom field value
 *   get-asset-boards <asset-id>                  - List boards containing asset
 *
 *   # Boards
 *   list-boards [--limit N] [--cursor TOKEN]     - List all boards
 *   get-board <board-id>                         - Get board details
 *   create-board <json>                          - Create a new board
 *   update-board <board-id> <json>               - Update board properties
 *   delete-board <board-id>                      - Delete a board
 *   list-board-assets <board-id> [--limit N] [--no-recursive] - List assets in board (recursive by default)
 *   add-assets-to-board <board-id> <json>        - Add assets to board
 *   remove-asset-from-board <board-id> <asset-id> - Remove asset from board
 *   list-board-guests <board-id>                 - List board guests
 *   add-board-guest <board-id> <json>            - Add guest to board
 *   update-board-guest <board-id> <guest-id> <json> - Update guest role
 *   remove-board-guest <board-id> <guest-id>     - Remove guest from board
 *
 *   # Custom Fields
 *   list-custom-fields                           - List all custom fields
 *   get-custom-field <field-id>                  - Get custom field details
 *   create-custom-field <json>                   - Create custom field
 *   update-custom-field <field-id> <json>        - Update custom field
 *   delete-custom-field <field-id>               - Delete custom field
 *   add-custom-field-option <field-id> <json>    - Add option to select field
 *   update-custom-field-option <field-id> <value-id> <json> - Update option
 *   delete-custom-field-option <field-id> <value-id> - Delete option
 *
 *   # Tags
 *   list-tags                                    - List all tags
 *   create-tag <json>                            - Create a tag
 *   update-tag <tag-id> <json>                   - Update a tag
 *   delete-tag <tag-id>                          - Delete a tag
 *
 *   # Uploads
 *   upload <file-path> [--board-id ID] [--name NAME] - Upload file
 *   import-url <json>                            - Import from URL
 *   get-import-status <import-id>                - Check import status
 *
 *   # Roles
 *   list-roles                                   - List available roles
 *
 *   # Deduplication
 *   find-duplicates-by-name [--board-id ID]      - Find duplicates by filename
 *   find-duplicates-by-hash [--board-id ID]      - Find duplicates by file hash
 *   check-duplicate <file-path> [--board-id ID]  - Check if file already exists
 *
 *   # Vision
 *   download-for-analysis <asset-id>             - Download asset for Claude vision
 */

import "@std/dotenv/load";

// Air API configuration
const AIR_API_KEY = Deno.env.get("AIR_API_KEY");
const AIR_WORKSPACE_ID = Deno.env.get("AIR_WORKSPACE_ID");
const API_BASE = "https://api.air.inc/v1";

// ==================== Utility Functions ====================

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
 * Parse command line arguments for optional flags
 */
function parseArgs(args: string[]): { flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      flags[key] = value;
    } else {
      positional.push(args[i]);
    }
  }

  return { flags, positional };
}

/**
 * Detect MIME type from file extension
 */
function detectMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    tiff: "image/tiff",
    tif: "image/tiff",
    heic: "image/heic",
    heif: "image/heif",
    // Videos
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    webm: "video/webm",
    mkv: "video/x-matroska",
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Design files
    psd: "image/vnd.adobe.photoshop",
    ai: "application/postscript",
    eps: "application/postscript",
    sketch: "application/x-sketch",
    fig: "application/x-figma",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Get file extension from filename or path
 */
function getExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? `.${ext}` : "";
}

// ==================== API Request Functions ====================

interface ApiRequestOptions extends RequestInit {
  skipContentType?: boolean;
}

/**
 * Make authenticated request to Air API
 */
async function apiRequest(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<unknown> {
  if (!AIR_API_KEY) {
    throw new Error(
      "Missing AIR_API_KEY in .env file. See SKILL.md for setup instructions."
    );
  }
  if (!AIR_WORKSPACE_ID) {
    throw new Error(
      "Missing AIR_WORKSPACE_ID in .env file. See SKILL.md for setup instructions."
    );
  }

  const url = `${API_BASE}${endpoint}`;
  const { skipContentType, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "x-api-key": AIR_API_KEY,
    "x-air-workspace-id": AIR_WORKSPACE_ID,
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (!skipContentType && options.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Air API error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        errorMessage += `: ${errorJson.message}`;
      } else if (errorJson.error) {
        errorMessage += `: ${errorJson.error}`;
      }
    } catch {
      errorMessage += `: ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return { success: true };
  }
  return JSON.parse(text);
}

/**
 * Fetch all pages of a paginated endpoint
 */
async function fetchAllPages(
  endpoint: string,
  limit?: number
): Promise<unknown[]> {
  const allItems: unknown[] = [];
  let cursor: string | null = null;
  const pageLimit = limit || 100;

  do {
    const params = new URLSearchParams();
    params.set("limit", String(Math.min(pageLimit, 100)));
    if (cursor) {
      params.set("cursor", cursor);
    }

    const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}${params.toString()}`;
    const response = (await apiRequest(url)) as {
      data: unknown[];
      pagination?: { hasMore: boolean; cursor: string | null };
    };

    allItems.push(...(response.data || []));
    cursor = response.pagination?.hasMore ? response.pagination.cursor : null;

    if (limit && allItems.length >= limit) {
      return allItems.slice(0, limit);
    }
  } while (cursor);

  return allItems;
}

// ==================== Auth Operations ====================

/**
 * Test API authentication
 */
async function testAuth(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Try to list boards as a simple auth test
    await apiRequest("/boards?limit=1");
    return {
      success: true,
      message: "Authentication successful. Air API credentials are valid.",
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Asset Operations ====================

interface AssetListOptions {
  boardId?: string;
  limit?: number;
  cursor?: string;
  search?: string;
}

/**
 * List assets
 */
async function listAssets(
  options: AssetListOptions = {}
): Promise<{ success: boolean; assets?: unknown[]; pagination?: unknown; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.cursor) params.set("cursor", options.cursor);
    if (options.boardId) params.set("parentBoardId", options.boardId);
    if (options.search) params.set("search", options.search);

    const query = params.toString();
    const data = (await apiRequest(`/assets${query ? `?${query}` : ""}`)) as {
      data: unknown[];
      pagination?: unknown;
      total?: number;
    };
    return {
      success: true,
      assets: data.data || [],
      pagination: data.pagination,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get asset by ID
 */
async function getAsset(
  assetId: string
): Promise<{ success: boolean; asset?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/assets/${assetId}`)) as { data?: unknown };
    return {
      success: true,
      asset: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete asset
 */
async function deleteAsset(
  assetId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/assets/${assetId}`, { method: "DELETE" });
    return {
      success: true,
      message: `Asset ${assetId} deleted successfully.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Download asset to local file
 */
async function downloadAsset(
  assetId: string,
  outputPath: string
): Promise<{ success: boolean; path?: string; size?: number; error?: string }> {
  try {
    // Get asset details to get download URL
    const assetResult = await getAsset(assetId);
    if (!assetResult.success || !assetResult.asset) {
      throw new Error(assetResult.error || "Failed to get asset details");
    }

    // Get the latest version's download URL
    const versionsResult = await getAssetVersions(assetId);
    if (!versionsResult.success || !versionsResult.versions?.length) {
      throw new Error("No versions found for asset");
    }

    const latestVersion = versionsResult.versions[0] as {
      id: string;
    };

    // Get download URL for the version
    const downloadData = (await apiRequest(
      `/assets/${assetId}/versions/${latestVersion.id}/download`
    )) as { url?: string; data?: { url?: string } };

    const downloadUrl = downloadData.url || downloadData.data?.url;
    if (!downloadUrl) {
      throw new Error("No download URL available for this asset");
    }

    // Download the file
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const content = await response.arrayBuffer();
    await Deno.writeFile(outputPath, new Uint8Array(content));

    return {
      success: true,
      path: outputPath,
      size: content.byteLength,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get asset versions
 */
async function getAssetVersions(
  assetId: string
): Promise<{ success: boolean; versions?: unknown[]; error?: string }> {
  try {
    const data = (await apiRequest(`/assets/${assetId}/versions`)) as {
      data: unknown[];
    };
    return {
      success: true,
      versions: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get specific asset version
 */
async function getAssetVersion(
  assetId: string,
  versionId: string
): Promise<{ success: boolean; version?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(
      `/assets/${assetId}/versions/${versionId}`
    )) as { data?: unknown };
    return {
      success: true,
      version: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Add tag to asset version
 */
async function addAssetTag(
  assetId: string,
  versionId: string,
  tagId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/assets/${assetId}/versions/${versionId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tagId }),
    });
    return {
      success: true,
      message: `Tag ${tagId} added to asset version.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Remove tag from asset version
 */
async function removeAssetTag(
  assetId: string,
  versionId: string,
  tagId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/assets/${assetId}/versions/${versionId}/tags/${tagId}`, {
      method: "DELETE",
    });
    return {
      success: true,
      message: `Tag ${tagId} removed from asset version.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Set custom field value on asset
 */
async function setCustomField(
  assetId: string,
  fieldId: string,
  value: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/assets/${assetId}/customfields/${fieldId}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
    return {
      success: true,
      message: `Custom field ${fieldId} updated.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get boards containing asset
 */
async function getAssetBoards(
  assetId: string
): Promise<{ success: boolean; boards?: unknown[]; error?: string }> {
  try {
    const data = (await apiRequest(`/assets/${assetId}/boards`)) as {
      data: unknown[];
    };
    return {
      success: true,
      boards: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Board Operations ====================

interface BoardListOptions {
  limit?: number;
  cursor?: string;
}

/**
 * List boards
 */
async function listBoards(
  options: BoardListOptions = {}
): Promise<{ success: boolean; boards?: unknown[]; pagination?: unknown; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.cursor) params.set("cursor", options.cursor);

    const query = params.toString();
    const data = (await apiRequest(`/boards${query ? `?${query}` : ""}`)) as {
      data: unknown[];
      pagination?: unknown;
    };
    return {
      success: true,
      boards: data.data || [],
      pagination: data.pagination,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get board by ID
 */
async function getBoard(
  boardId: string
): Promise<{ success: boolean; board?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/boards/${boardId}`)) as { data?: unknown };
    return {
      success: true,
      board: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create board
 */
async function createBoard(
  boardData: Record<string, unknown>
): Promise<{ success: boolean; board?: unknown; error?: string }> {
  try {
    const data = (await apiRequest("/boards", {
      method: "POST",
      body: JSON.stringify(boardData),
    })) as { data?: unknown };
    return {
      success: true,
      board: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update board
 */
async function updateBoard(
  boardId: string,
  boardData: Record<string, unknown>
): Promise<{ success: boolean; board?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/boards/${boardId}`, {
      method: "PATCH",
      body: JSON.stringify(boardData),
    })) as { data?: unknown };
    return {
      success: true,
      board: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete board
 */
async function deleteBoard(
  boardId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/boards/${boardId}`, { method: "DELETE" });
    return {
      success: true,
      message: `Board ${boardId} deleted successfully.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get all descendant board IDs for a given board (children, grandchildren, etc.)
 * Fetches all boards and builds a parent->children map to traverse the hierarchy.
 */
async function getDescendantBoardIds(boardId: string): Promise<string[]> {
  const allBoards = (await fetchAllPages("/boards")) as {
    id: string;
    parentBoardId?: string;
  }[];

  // Build parent -> children map
  const childrenMap = new Map<string, string[]>();
  for (const board of allBoards) {
    if (board.parentBoardId) {
      if (!childrenMap.has(board.parentBoardId)) {
        childrenMap.set(board.parentBoardId, []);
      }
      childrenMap.get(board.parentBoardId)!.push(board.id);
    }
  }

  // BFS to collect all descendants
  const descendants: string[] = [];
  const queue = [boardId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current) || [];
    for (const child of children) {
      descendants.push(child);
      queue.push(child);
    }
  }

  return descendants;
}

/**
 * List assets in board
 * Note: Uses /assets?parentBoardId={boardId} instead of /boards/{boardId}/assets
 * because the latter returns 405 Method Not Allowed
 */
async function listBoardAssets(
  boardId: string,
  limit?: number,
  recursive?: boolean
): Promise<{ success: boolean; assets?: unknown[]; boardCount?: number; error?: string }> {
  try {
    const allAssets: unknown[] = [];

    // Collect board IDs to fetch from
    const boardIds = [boardId];
    if (recursive) {
      const descendants = await getDescendantBoardIds(boardId);
      boardIds.push(...descendants);
    }

    // Fetch assets from each board
    for (const id of boardIds) {
      const remaining = limit ? limit - allAssets.length : undefined;
      if (limit && remaining! <= 0) break;
      const assets = await fetchAllPages(`/assets?parentBoardId=${id}`, remaining);
      allAssets.push(...assets);
    }

    const result: { success: boolean; assets: unknown[]; boardCount?: number } = {
      success: true,
      assets: limit ? allAssets.slice(0, limit) : allAssets,
    };
    if (recursive) {
      result.boardCount = boardIds.length;
    }
    return result;
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Add assets to board
 */
async function addAssetsToBoard(
  boardId: string,
  assetIds: string[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/boards/${boardId}/assets`, {
      method: "POST",
      body: JSON.stringify({ assetIds }),
    });
    return {
      success: true,
      message: `${assetIds.length} asset(s) added to board.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Remove asset from board
 */
async function removeAssetFromBoard(
  boardId: string,
  assetId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/boards/${boardId}/assets/${assetId}`, {
      method: "DELETE",
    });
    return {
      success: true,
      message: `Asset ${assetId} removed from board.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * List board guests
 */
async function listBoardGuests(
  boardId: string
): Promise<{ success: boolean; guests?: unknown[]; error?: string }> {
  try {
    const data = (await apiRequest(`/boards/${boardId}/guests`)) as {
      data: unknown[];
    };
    return {
      success: true,
      guests: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Add guest to board
 */
async function addBoardGuest(
  boardId: string,
  guestData: Record<string, unknown>
): Promise<{ success: boolean; guest?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/boards/${boardId}/guests`, {
      method: "POST",
      body: JSON.stringify(guestData),
    })) as { data?: unknown };
    return {
      success: true,
      guest: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update board guest
 */
async function updateBoardGuest(
  boardId: string,
  guestId: string,
  guestData: Record<string, unknown>
): Promise<{ success: boolean; guest?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/boards/${boardId}/guests/${guestId}`, {
      method: "PATCH",
      body: JSON.stringify(guestData),
    })) as { data?: unknown };
    return {
      success: true,
      guest: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Remove guest from board
 */
async function removeBoardGuest(
  boardId: string,
  guestId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/boards/${boardId}/guests/${guestId}`, {
      method: "DELETE",
    });
    return {
      success: true,
      message: `Guest ${guestId} removed from board.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Custom Field Operations ====================

/**
 * List custom fields
 */
async function listCustomFields(): Promise<{
  success: boolean;
  customFields?: unknown[];
  error?: string;
}> {
  try {
    const data = (await apiRequest("/customfields")) as { data: unknown[] };
    return {
      success: true,
      customFields: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get custom field by ID
 */
async function getCustomField(
  fieldId: string
): Promise<{ success: boolean; customField?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/customfields/${fieldId}`)) as {
      data?: unknown;
    };
    return {
      success: true,
      customField: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create custom field
 */
async function createCustomField(
  fieldData: Record<string, unknown>
): Promise<{ success: boolean; customField?: unknown; error?: string }> {
  try {
    const data = (await apiRequest("/customfields", {
      method: "POST",
      body: JSON.stringify(fieldData),
    })) as { data?: unknown };
    return {
      success: true,
      customField: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update custom field
 */
async function updateCustomField(
  fieldId: string,
  fieldData: Record<string, unknown>
): Promise<{ success: boolean; customField?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/customfields/${fieldId}`, {
      method: "PATCH",
      body: JSON.stringify(fieldData),
    })) as { data?: unknown };
    return {
      success: true,
      customField: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete custom field
 */
async function deleteCustomField(
  fieldId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/customfields/${fieldId}`, { method: "DELETE" });
    return {
      success: true,
      message: `Custom field ${fieldId} deleted successfully.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Add option to select custom field
 */
async function addCustomFieldOption(
  fieldId: string,
  optionData: Record<string, unknown>
): Promise<{ success: boolean; option?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/customfields/${fieldId}/values`, {
      method: "POST",
      body: JSON.stringify(optionData),
    })) as { data?: unknown };
    return {
      success: true,
      option: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update custom field option
 */
async function updateCustomFieldOption(
  fieldId: string,
  valueId: string,
  optionData: Record<string, unknown>
): Promise<{ success: boolean; option?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/customfields/${fieldId}/values/${valueId}`, {
      method: "PATCH",
      body: JSON.stringify(optionData),
    })) as { data?: unknown };
    return {
      success: true,
      option: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete custom field option
 */
async function deleteCustomFieldOption(
  fieldId: string,
  valueId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/customfields/${fieldId}/values/${valueId}`, {
      method: "DELETE",
    });
    return {
      success: true,
      message: `Option ${valueId} deleted from custom field.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Tag Operations ====================

/**
 * List tags
 */
async function listTags(): Promise<{
  success: boolean;
  tags?: unknown[];
  error?: string;
}> {
  try {
    const data = (await apiRequest("/tags")) as { data: unknown[] };
    return {
      success: true,
      tags: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create tag
 */
async function createTag(
  tagData: Record<string, unknown>
): Promise<{ success: boolean; tag?: unknown; error?: string }> {
  try {
    const data = (await apiRequest("/tags", {
      method: "POST",
      body: JSON.stringify(tagData),
    })) as { data?: unknown };
    return {
      success: true,
      tag: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update tag
 */
async function updateTag(
  tagId: string,
  tagData: Record<string, unknown>
): Promise<{ success: boolean; tag?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/tags/${tagId}`, {
      method: "PATCH",
      body: JSON.stringify(tagData),
    })) as { data?: unknown };
    return {
      success: true,
      tag: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete tag
 */
async function deleteTag(
  tagId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/tags/${tagId}`, { method: "DELETE" });
    return {
      success: true,
      message: `Tag ${tagId} deleted successfully.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Upload Operations ====================

interface UploadOptions {
  boardId?: string;
  name?: string;
}

/**
 * Upload file to Air
 */
async function uploadFile(
  filePath: string,
  options: UploadOptions = {}
): Promise<{ success: boolean; asset?: unknown; error?: string }> {
  try {
    if (!AIR_API_KEY || !AIR_WORKSPACE_ID) {
      throw new Error("Missing API credentials");
    }

    // Read file
    const fileContent = await Deno.readFile(filePath);
    const fileName = options.name || filePath.split("/").pop() || "untitled";
    const mimeType = detectMimeType(filePath);

    // Create FormData
    const formData = new FormData();
    formData.append("file", new Blob([fileContent], { type: mimeType }), fileName);
    if (options.boardId) {
      formData.append("boardId", options.boardId);
    }

    // Upload
    const response = await fetch(`${API_BASE}/uploads`, {
      method: "POST",
      headers: {
        "x-api-key": AIR_API_KEY,
        "x-air-workspace-id": AIR_WORKSPACE_ID,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      asset: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Import asset from URL
 */
async function importUrl(
  importData: Record<string, unknown>
): Promise<{ success: boolean; import?: unknown; error?: string }> {
  try {
    const data = (await apiRequest("/imports", {
      method: "POST",
      body: JSON.stringify(importData),
    })) as { data?: unknown };
    return {
      success: true,
      import: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get import status
 */
async function getImportStatus(
  importId: string
): Promise<{ success: boolean; status?: unknown; error?: string }> {
  try {
    const data = (await apiRequest(`/imports/${importId}/status`)) as {
      data?: unknown;
    };
    return {
      success: true,
      status: data.data || data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Role Operations ====================

/**
 * List roles
 */
async function listRoles(): Promise<{
  success: boolean;
  roles?: unknown[];
  error?: string;
}> {
  try {
    const data = (await apiRequest("/roles")) as { data: unknown[] };
    return {
      success: true,
      roles: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Deduplication Operations ====================

interface AssetWithName {
  id: string;
  name?: string;
  title?: string;
  createdAt?: string;
  size?: number;
  ext?: string;
  hash?: string;
  fileHash?: string;
}

/**
 * Find duplicates by filename
 */
async function findDuplicatesByName(
  boardId?: string
): Promise<{
  success: boolean;
  duplicates?: { name: string; count: number; assets: AssetWithName[] }[];
  totalDuplicates?: number;
  error?: string;
}> {
  try {
    // Get all assets
    const assets = (await fetchAllPages(
      boardId ? `/assets?parentBoardId=${boardId}` : "/assets"
    )) as AssetWithName[];

    // Group by normalized name
    const nameMap = new Map<string, AssetWithName[]>();
    for (const asset of assets) {
      const name = (asset.name || asset.title || "").toLowerCase().trim();
      if (!name) continue;
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)!.push(asset);
    }

    // Find duplicates
    const duplicates = [];
    for (const [name, group] of nameMap) {
      if (group.length > 1) {
        duplicates.push({
          name,
          count: group.length,
          assets: group.map((a) => ({
            id: a.id,
            name: a.name || a.title,
            createdAt: a.createdAt,
            size: a.size,
          })),
        });
      }
    }

    // Sort by count descending
    duplicates.sort((a, b) => b.count - a.count);

    return {
      success: true,
      duplicates,
      totalDuplicates: duplicates.reduce((sum, d) => sum + d.count - 1, 0),
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Compute SHA-256 hash of data
 */
async function computeHash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Find duplicates by file hash
 */
async function findDuplicatesByHash(
  boardId?: string
): Promise<{
  success: boolean;
  duplicates?: { hash: string; count: number; assets: AssetWithName[] }[];
  totalDuplicates?: number;
  note?: string;
  error?: string;
}> {
  try {
    // Get all assets
    const assets = (await fetchAllPages(
      boardId ? `/assets?parentBoardId=${boardId}` : "/assets"
    )) as AssetWithName[];

    // Group by hash if available from API
    const hashMap = new Map<string, AssetWithName[]>();

    for (const asset of assets) {
      const hash = asset.hash || asset.fileHash;
      if (hash) {
        if (!hashMap.has(hash)) {
          hashMap.set(hash, []);
        }
        hashMap.get(hash)!.push(asset);
      }
    }

    // Find duplicates
    const duplicates = [];
    for (const [hash, group] of hashMap) {
      if (group.length > 1) {
        duplicates.push({
          hash,
          count: group.length,
          assets: group.map((a) => ({
            id: a.id,
            name: a.name || a.title,
            createdAt: a.createdAt,
          })),
        });
      }
    }

    // Sort by count descending
    duplicates.sort((a, b) => b.count - a.count);

    const hasHashes = assets.some((a) => a.hash || a.fileHash);

    return {
      success: true,
      duplicates,
      totalDuplicates: duplicates.reduce((sum, d) => sum + d.count - 1, 0),
      note: hasHashes
        ? undefined
        : "API does not provide file hashes. Consider using name-based deduplication or downloading files to compute hashes locally.",
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Check if a local file already exists in Air
 */
async function checkDuplicate(
  filePath: string,
  boardId?: string
): Promise<{
  success: boolean;
  isDuplicate: boolean;
  nameMatches?: AssetWithName[];
  hashMatches?: AssetWithName[];
  localName?: string;
  localHash?: string;
  error?: string;
}> {
  try {
    // Read local file and compute hash
    const fileContent = await Deno.readFile(filePath);
    const localHash = await computeHash(fileContent);
    const localName = filePath.split("/").pop() || "";

    // Get assets
    const assets = (await fetchAllPages(
      boardId ? `/assets?parentBoardId=${boardId}` : "/assets"
    )) as AssetWithName[];

    // Check for name matches
    const normalizedLocalName = localName.toLowerCase().trim();
    const nameMatches = assets.filter(
      (a) => (a.name || a.title || "").toLowerCase().trim() === normalizedLocalName
    );

    // Check for hash matches
    const hashMatches = assets.filter(
      (a) => (a.hash || a.fileHash) === localHash
    );

    return {
      success: true,
      isDuplicate: nameMatches.length > 0 || hashMatches.length > 0,
      nameMatches: nameMatches.map((a) => ({
        id: a.id,
        name: a.name || a.title,
        createdAt: a.createdAt,
      })),
      hashMatches: hashMatches.map((a) => ({
        id: a.id,
        name: a.name || a.title,
        createdAt: a.createdAt,
      })),
      localName,
      localHash,
    };
  } catch (error) {
    return {
      success: false,
      isDuplicate: false,
      error: getErrorMessage(error),
    };
  }
}

// ==================== Vision Operations ====================

/**
 * Download asset for Claude vision analysis
 */
async function downloadForAnalysis(
  assetId: string
): Promise<{
  success: boolean;
  tempPath?: string;
  assetName?: string;
  mimeType?: string;
  size?: number;
  message?: string;
  error?: string;
}> {
  try {
    // Get asset details
    const assetResult = await getAsset(assetId);
    if (!assetResult.success || !assetResult.asset) {
      throw new Error(assetResult.error || "Failed to get asset details");
    }

    const asset = assetResult.asset as {
      name?: string;
      title?: string;
      ext?: string;
      mimeType?: string;
    };
    const assetName = asset.name || asset.title || "asset";
    const ext = asset.ext || getExtension(assetName) || ".bin";
    const mimeType = asset.mimeType || detectMimeType(assetName);

    // Create temp path
    const tempPath = `/tmp/air-vision-${assetId}${ext.startsWith(".") ? ext : `.${ext}`}`;

    // Download asset
    const downloadResult = await downloadAsset(assetId, tempPath);
    if (!downloadResult.success) {
      throw new Error(downloadResult.error || "Failed to download asset");
    }

    return {
      success: true,
      tempPath,
      assetName,
      mimeType,
      size: downloadResult.size,
      message: `Asset downloaded to ${tempPath}. Use the Read tool to analyze the image with Claude's vision capabilities.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Main Command Router ====================

async function main() {
  const args = Deno.args;
  const command = args[0];
  const { flags, positional } = parseArgs(args.slice(1));

  try {
    let result: unknown;

    switch (command) {
      // Auth
      case "test-auth":
        result = await testAuth();
        break;

      // Assets
      case "list-assets":
        result = await listAssets({
          boardId: flags["board-id"],
          limit: flags.limit ? parseInt(flags.limit) : undefined,
          cursor: flags.cursor,
          search: flags.search,
        });
        break;

      case "get-asset":
        if (!positional[0]) {
          console.error("Missing asset ID");
          Deno.exit(1);
        }
        result = await getAsset(positional[0]);
        break;

      case "delete-asset":
        if (!positional[0]) {
          console.error("Missing asset ID");
          Deno.exit(1);
        }
        result = await deleteAsset(positional[0]);
        break;

      case "download-asset":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: download-asset <asset-id> <output-path>");
          Deno.exit(1);
        }
        result = await downloadAsset(positional[0], positional[1]);
        break;

      case "get-asset-versions":
        if (!positional[0]) {
          console.error("Missing asset ID");
          Deno.exit(1);
        }
        result = await getAssetVersions(positional[0]);
        break;

      case "get-asset-version":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: get-asset-version <asset-id> <version-id>");
          Deno.exit(1);
        }
        result = await getAssetVersion(positional[0], positional[1]);
        break;

      case "add-asset-tag":
        if (!positional[0] || !positional[1] || !positional[2]) {
          console.error("Usage: add-asset-tag <asset-id> <version-id> <tag-id>");
          Deno.exit(1);
        }
        result = await addAssetTag(positional[0], positional[1], positional[2]);
        break;

      case "remove-asset-tag":
        if (!positional[0] || !positional[1] || !positional[2]) {
          console.error("Usage: remove-asset-tag <asset-id> <version-id> <tag-id>");
          Deno.exit(1);
        }
        result = await removeAssetTag(positional[0], positional[1], positional[2]);
        break;

      case "set-custom-field":
        if (!positional[0] || !positional[1] || !positional[2]) {
          console.error("Usage: set-custom-field <asset-id> <field-id> <value>");
          Deno.exit(1);
        }
        result = await setCustomField(positional[0], positional[1], positional[2]);
        break;

      case "get-asset-boards":
        if (!positional[0]) {
          console.error("Missing asset ID");
          Deno.exit(1);
        }
        result = await getAssetBoards(positional[0]);
        break;

      // Boards
      case "list-boards":
        result = await listBoards({
          limit: flags.limit ? parseInt(flags.limit) : undefined,
          cursor: flags.cursor,
        });
        break;

      case "get-board":
        if (!positional[0]) {
          console.error("Missing board ID");
          Deno.exit(1);
        }
        result = await getBoard(positional[0]);
        break;

      case "create-board":
        if (!positional[0]) {
          console.error("Missing board JSON");
          Deno.exit(1);
        }
        result = await createBoard(JSON.parse(positional[0]));
        break;

      case "update-board":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: update-board <board-id> <json>");
          Deno.exit(1);
        }
        result = await updateBoard(positional[0], JSON.parse(positional[1]));
        break;

      case "delete-board":
        if (!positional[0]) {
          console.error("Missing board ID");
          Deno.exit(1);
        }
        result = await deleteBoard(positional[0]);
        break;

      case "list-board-assets":
        if (!positional[0]) {
          console.error("Missing board ID");
          Deno.exit(1);
        }
        result = await listBoardAssets(
          positional[0],
          flags.limit ? parseInt(flags.limit) : undefined,
          flags["no-recursive"] !== "true"
        );
        break;

      case "add-assets-to-board":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: add-assets-to-board <board-id> <json-array>");
          Deno.exit(1);
        }
        result = await addAssetsToBoard(positional[0], JSON.parse(positional[1]));
        break;

      case "remove-asset-from-board":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: remove-asset-from-board <board-id> <asset-id>");
          Deno.exit(1);
        }
        result = await removeAssetFromBoard(positional[0], positional[1]);
        break;

      case "list-board-guests":
        if (!positional[0]) {
          console.error("Missing board ID");
          Deno.exit(1);
        }
        result = await listBoardGuests(positional[0]);
        break;

      case "add-board-guest":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: add-board-guest <board-id> <json>");
          Deno.exit(1);
        }
        result = await addBoardGuest(positional[0], JSON.parse(positional[1]));
        break;

      case "update-board-guest":
        if (!positional[0] || !positional[1] || !positional[2]) {
          console.error("Usage: update-board-guest <board-id> <guest-id> <json>");
          Deno.exit(1);
        }
        result = await updateBoardGuest(
          positional[0],
          positional[1],
          JSON.parse(positional[2])
        );
        break;

      case "remove-board-guest":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: remove-board-guest <board-id> <guest-id>");
          Deno.exit(1);
        }
        result = await removeBoardGuest(positional[0], positional[1]);
        break;

      // Custom Fields
      case "list-custom-fields":
        result = await listCustomFields();
        break;

      case "get-custom-field":
        if (!positional[0]) {
          console.error("Missing custom field ID");
          Deno.exit(1);
        }
        result = await getCustomField(positional[0]);
        break;

      case "create-custom-field":
        if (!positional[0]) {
          console.error("Missing custom field JSON");
          Deno.exit(1);
        }
        result = await createCustomField(JSON.parse(positional[0]));
        break;

      case "update-custom-field":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: update-custom-field <field-id> <json>");
          Deno.exit(1);
        }
        result = await updateCustomField(positional[0], JSON.parse(positional[1]));
        break;

      case "delete-custom-field":
        if (!positional[0]) {
          console.error("Missing custom field ID");
          Deno.exit(1);
        }
        result = await deleteCustomField(positional[0]);
        break;

      case "add-custom-field-option":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: add-custom-field-option <field-id> <json>");
          Deno.exit(1);
        }
        result = await addCustomFieldOption(positional[0], JSON.parse(positional[1]));
        break;

      case "update-custom-field-option":
        if (!positional[0] || !positional[1] || !positional[2]) {
          console.error("Usage: update-custom-field-option <field-id> <value-id> <json>");
          Deno.exit(1);
        }
        result = await updateCustomFieldOption(
          positional[0],
          positional[1],
          JSON.parse(positional[2])
        );
        break;

      case "delete-custom-field-option":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: delete-custom-field-option <field-id> <value-id>");
          Deno.exit(1);
        }
        result = await deleteCustomFieldOption(positional[0], positional[1]);
        break;

      // Tags
      case "list-tags":
        result = await listTags();
        break;

      case "create-tag":
        if (!positional[0]) {
          console.error("Missing tag JSON");
          Deno.exit(1);
        }
        result = await createTag(JSON.parse(positional[0]));
        break;

      case "update-tag":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: update-tag <tag-id> <json>");
          Deno.exit(1);
        }
        result = await updateTag(positional[0], JSON.parse(positional[1]));
        break;

      case "delete-tag":
        if (!positional[0]) {
          console.error("Missing tag ID");
          Deno.exit(1);
        }
        result = await deleteTag(positional[0]);
        break;

      // Uploads
      case "upload":
        if (!positional[0]) {
          console.error("Missing file path");
          Deno.exit(1);
        }
        result = await uploadFile(positional[0], {
          boardId: flags["board-id"],
          name: flags.name,
        });
        break;

      case "import-url":
        if (!positional[0]) {
          console.error("Missing import JSON");
          Deno.exit(1);
        }
        result = await importUrl(JSON.parse(positional[0]));
        break;

      case "get-import-status":
        if (!positional[0]) {
          console.error("Missing import ID");
          Deno.exit(1);
        }
        result = await getImportStatus(positional[0]);
        break;

      // Roles
      case "list-roles":
        result = await listRoles();
        break;

      // Deduplication
      case "find-duplicates-by-name":
        result = await findDuplicatesByName(flags["board-id"]);
        break;

      case "find-duplicates-by-hash":
        result = await findDuplicatesByHash(flags["board-id"]);
        break;

      case "check-duplicate":
        if (!positional[0]) {
          console.error("Missing file path");
          Deno.exit(1);
        }
        result = await checkDuplicate(positional[0], flags["board-id"]);
        break;

      // Vision
      case "download-for-analysis":
        if (!positional[0]) {
          console.error("Missing asset ID");
          Deno.exit(1);
        }
        result = await downloadForAnalysis(positional[0]);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error("Run without arguments to see available commands.");
        Deno.exit(1);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(
      JSON.stringify({ success: false, error: getErrorMessage(error) }, null, 2)
    );
    Deno.exit(1);
  }
}

main();
