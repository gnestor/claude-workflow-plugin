#!/usr/bin/env node

/**
 * Air.inc Digital Asset Management MCP Server
 *
 * Provides tools for managing digital assets, boards, tags, custom fields,
 * uploads, roles, and deduplication via the Air.inc API.
 *
 * Environment variables:
 *   AIR_API_KEY        - Air API key
 *   AIR_WORKSPACE_ID   - Air workspace ID
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createWriteStream } from "node:fs";
import { writeFile, readFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { basename } from "node:path";
import { createHash } from "node:crypto";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE = "https://api.air.inc/v1";

function getCredentials() {
  const apiKey = process.env.AIR_API_KEY;
  const workspaceId = process.env.AIR_WORKSPACE_ID;
  if (!apiKey) {
    throw new Error("Missing AIR_API_KEY environment variable.");
  }
  if (!workspaceId) {
    throw new Error("Missing AIR_WORKSPACE_ID environment variable.");
  }
  return { apiKey, workspaceId };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function apiRequest(endpoint, options = {}) {
  const { apiKey, workspaceId } = getCredentials();
  const url = `${API_BASE}${endpoint}`;
  const { skipContentType, ...fetchOptions } = options;

  const headers = {
    "x-api-key": apiKey,
    "x-air-workspace-id": workspaceId,
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (!skipContentType && options.method && options.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Air API error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) errorMessage += `: ${errorJson.message}`;
      else if (errorJson.error) errorMessage += `: ${errorJson.error}`;
    } catch {
      errorMessage += `: ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) return { success: true };
  return JSON.parse(text);
}

async function fetchAllPages(endpoint, limit) {
  const allItems = [];
  let cursor = null;
  const pageLimit = limit || 100;

  do {
    const params = new URLSearchParams();
    params.set("limit", String(Math.min(pageLimit, 100)));
    if (cursor) params.set("cursor", cursor);

    const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}${params.toString()}`;
    const response = await apiRequest(url);

    allItems.push(...(response.data || []));
    cursor = response.pagination?.hasMore ? response.pagination.cursor : null;

    if (limit && allItems.length >= limit) {
      return allItems.slice(0, limit);
    }
  } while (cursor);

  return allItems;
}

// ---------------------------------------------------------------------------
// MIME type helper
// ---------------------------------------------------------------------------

function detectMimeType(filePath) {
  const ext = (filePath.split(".").pop() || "").toLowerCase();
  const mimeTypes = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
    webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp",
    tiff: "image/tiff", tif: "image/tiff", heic: "image/heic", heif: "image/heif",
    mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo",
    webm: "video/webm", mkv: "video/x-matroska",
    pdf: "application/pdf", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    psd: "image/vnd.adobe.photoshop", ai: "application/postscript",
    eps: "application/postscript", sketch: "application/x-sketch",
    fig: "application/x-figma",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

function getExtension(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  return ext ? `.${ext}` : "";
}

// ---------------------------------------------------------------------------
// Board hierarchy helper
// ---------------------------------------------------------------------------

async function getDescendantBoardIds(boardId) {
  const allBoards = await fetchAllPages("/boards");
  const childrenMap = new Map();
  for (const board of allBoards) {
    if (board.parentBoardId) {
      if (!childrenMap.has(board.parentBoardId)) {
        childrenMap.set(board.parentBoardId, []);
      }
      childrenMap.get(board.parentBoardId).push(board.id);
    }
  }
  const descendants = [];
  const queue = [boardId];
  while (queue.length > 0) {
    const current = queue.shift();
    const children = childrenMap.get(current) || [];
    for (const child of children) {
      descendants.push(child);
      queue.push(child);
    }
  }
  return descendants;
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "air",
  version: "1.0.0",
});

// ======================== Auth ========================

server.tool(
  "test_auth",
  "Test API authentication by making a simple request to the Air API",
  {},
  async () => {
    try {
      await apiRequest("/boards?limit=1");
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: "Authentication successful. Air API credentials are valid." }, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
        isError: true,
      };
    }
  }
);

// ======================== Assets ========================

server.tool(
  "list_assets",
  "List assets in the Air workspace. Optionally filter by board, search query, and pagination.",
  {
    boardId: z.string().optional().describe("Filter assets by parent board ID"),
    limit: z.number().optional().describe("Maximum number of assets to return"),
    cursor: z.string().optional().describe("Pagination cursor for fetching the next page"),
    search: z.string().optional().describe("Search query to filter assets by name"),
  },
  async ({ boardId, limit, cursor, search }) => {
    try {
      const params = new URLSearchParams();
      if (limit) params.set("limit", String(limit));
      if (cursor) params.set("cursor", cursor);
      if (boardId) params.set("parentBoardId", boardId);
      if (search) params.set("search", search);
      const query = params.toString();
      const data = await apiRequest(`/assets${query ? `?${query}` : ""}`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, assets: data.data || [], pagination: data.pagination }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "get_asset",
  "Get detailed information about a specific asset by its ID",
  {
    assetId: z.string().describe("The ID of the asset to retrieve"),
  },
  async ({ assetId }) => {
    try {
      const data = await apiRequest(`/assets/${assetId}`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, asset: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "delete_asset",
  "Delete an asset from the Air workspace",
  {
    assetId: z.string().describe("The ID of the asset to delete"),
  },
  async ({ assetId }) => {
    try {
      await apiRequest(`/assets/${assetId}`, { method: "DELETE" });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Asset ${assetId} deleted successfully.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "download_asset",
  "Download an asset to a local file path",
  {
    assetId: z.string().describe("The ID of the asset to download"),
    outputPath: z.string().describe("Local file path to save the downloaded asset"),
  },
  async ({ assetId, outputPath }) => {
    try {
      // Get asset details
      const assetData = await apiRequest(`/assets/${assetId}`);
      const asset = assetData.data || assetData;

      // Get versions to find download URL
      const versionsData = await apiRequest(`/assets/${assetId}/versions`);
      const versions = versionsData.data || [];
      if (!versions.length) throw new Error("No versions found for asset");

      const latestVersion = versions[0];
      const downloadData = await apiRequest(`/assets/${assetId}/versions/${latestVersion.id}/download`);
      const downloadUrl = downloadData.url || downloadData.data?.url;
      if (!downloadUrl) throw new Error("No download URL available for this asset");

      // Download the file
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to download: ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      await writeFile(outputPath, Buffer.from(arrayBuffer));

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, path: outputPath, size: arrayBuffer.byteLength }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "get_asset_versions",
  "List all versions of an asset",
  {
    assetId: z.string().describe("The ID of the asset"),
  },
  async ({ assetId }) => {
    try {
      const data = await apiRequest(`/assets/${assetId}/versions`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, versions: data.data || [] }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "get_asset_version",
  "Get details of a specific asset version",
  {
    assetId: z.string().describe("The ID of the asset"),
    versionId: z.string().describe("The ID of the version"),
  },
  async ({ assetId, versionId }) => {
    try {
      const data = await apiRequest(`/assets/${assetId}/versions/${versionId}`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, version: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "add_asset_tag",
  "Add a tag to an asset version",
  {
    assetId: z.string().describe("The ID of the asset"),
    versionId: z.string().describe("The ID of the asset version"),
    tagId: z.string().describe("The ID of the tag to add"),
  },
  async ({ assetId, versionId, tagId }) => {
    try {
      await apiRequest(`/assets/${assetId}/versions/${versionId}/tags`, {
        method: "POST",
        body: JSON.stringify({ tagId }),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Tag ${tagId} added to asset version.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "remove_asset_tag",
  "Remove a tag from an asset version",
  {
    assetId: z.string().describe("The ID of the asset"),
    versionId: z.string().describe("The ID of the asset version"),
    tagId: z.string().describe("The ID of the tag to remove"),
  },
  async ({ assetId, versionId, tagId }) => {
    try {
      await apiRequest(`/assets/${assetId}/versions/${versionId}/tags/${tagId}`, { method: "DELETE" });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Tag ${tagId} removed from asset version.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "set_custom_field",
  "Set a custom field value on an asset",
  {
    assetId: z.string().describe("The ID of the asset"),
    fieldId: z.string().describe("The ID of the custom field"),
    value: z.string().describe("The value to set for the custom field"),
  },
  async ({ assetId, fieldId, value }) => {
    try {
      await apiRequest(`/assets/${assetId}/customfields/${fieldId}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Custom field ${fieldId} updated.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "get_asset_boards",
  "List all boards that contain a specific asset",
  {
    assetId: z.string().describe("The ID of the asset"),
  },
  async ({ assetId }) => {
    try {
      const data = await apiRequest(`/assets/${assetId}/boards`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, boards: data.data || [] }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

// ======================== Boards ========================

server.tool(
  "list_boards",
  "List all boards in the Air workspace with optional pagination",
  {
    limit: z.number().optional().describe("Maximum number of boards to return"),
    cursor: z.string().optional().describe("Pagination cursor for fetching the next page"),
  },
  async ({ limit, cursor }) => {
    try {
      const params = new URLSearchParams();
      if (limit) params.set("limit", String(limit));
      if (cursor) params.set("cursor", cursor);
      const query = params.toString();
      const data = await apiRequest(`/boards${query ? `?${query}` : ""}`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, boards: data.data || [], pagination: data.pagination }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "get_board",
  "Get detailed information about a specific board by its ID",
  {
    boardId: z.string().describe("The ID of the board to retrieve"),
  },
  async ({ boardId }) => {
    try {
      const data = await apiRequest(`/boards/${boardId}`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, board: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "create_board",
  "Create a new board in the Air workspace",
  {
    name: z.string().describe("Name of the new board"),
    description: z.string().optional().describe("Description of the board"),
    parentBoardId: z.string().optional().describe("ID of the parent board (for nested boards)"),
  },
  async (params) => {
    try {
      const body = {};
      if (params.name) body.name = params.name;
      if (params.description) body.description = params.description;
      if (params.parentBoardId) body.parentBoardId = params.parentBoardId;
      const data = await apiRequest("/boards", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, board: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "update_board",
  "Update properties of an existing board",
  {
    boardId: z.string().describe("The ID of the board to update"),
    name: z.string().optional().describe("New name for the board"),
    description: z.string().optional().describe("New description for the board"),
  },
  async ({ boardId, ...updateData }) => {
    try {
      const body = {};
      if (updateData.name) body.name = updateData.name;
      if (updateData.description) body.description = updateData.description;
      const data = await apiRequest(`/boards/${boardId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, board: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "delete_board",
  "Delete a board from the Air workspace",
  {
    boardId: z.string().describe("The ID of the board to delete"),
  },
  async ({ boardId }) => {
    try {
      await apiRequest(`/boards/${boardId}`, { method: "DELETE" });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Board ${boardId} deleted successfully.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "list_board_assets",
  "List assets in a board. By default, recursively includes assets from sub-boards.",
  {
    boardId: z.string().describe("The ID of the board"),
    limit: z.number().optional().describe("Maximum number of assets to return"),
    recursive: z.boolean().optional().default(true).describe("Whether to include assets from sub-boards (default: true)"),
  },
  async ({ boardId, limit, recursive }) => {
    try {
      const allAssets = [];
      const boardIds = [boardId];

      if (recursive) {
        const descendants = await getDescendantBoardIds(boardId);
        boardIds.push(...descendants);
      }

      for (const id of boardIds) {
        const remaining = limit ? limit - allAssets.length : undefined;
        if (limit && remaining <= 0) break;
        const assets = await fetchAllPages(`/assets?parentBoardId=${id}`, remaining);
        allAssets.push(...assets);
      }

      const result = {
        success: true,
        assets: limit ? allAssets.slice(0, limit) : allAssets,
      };
      if (recursive) result.boardCount = boardIds.length;

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "add_assets_to_board",
  "Add one or more assets to a board",
  {
    boardId: z.string().describe("The ID of the board"),
    assetIds: z.array(z.string()).describe("Array of asset IDs to add to the board"),
  },
  async ({ boardId, assetIds }) => {
    try {
      await apiRequest(`/boards/${boardId}/assets`, {
        method: "POST",
        body: JSON.stringify({ assetIds }),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `${assetIds.length} asset(s) added to board.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "remove_asset_from_board",
  "Remove an asset from a board",
  {
    boardId: z.string().describe("The ID of the board"),
    assetId: z.string().describe("The ID of the asset to remove"),
  },
  async ({ boardId, assetId }) => {
    try {
      await apiRequest(`/boards/${boardId}/assets/${assetId}`, { method: "DELETE" });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Asset ${assetId} removed from board.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "list_board_guests",
  "List all guests with access to a specific board",
  {
    boardId: z.string().describe("The ID of the board"),
  },
  async ({ boardId }) => {
    try {
      const data = await apiRequest(`/boards/${boardId}/guests`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, guests: data.data || [] }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "add_board_guest",
  "Add a guest to a board with a specified role",
  {
    boardId: z.string().describe("The ID of the board"),
    email: z.string().describe("Email address of the guest"),
    roleId: z.string().optional().describe("Role ID for the guest"),
  },
  async ({ boardId, email, roleId }) => {
    try {
      const body = { email };
      if (roleId) body.roleId = roleId;
      const data = await apiRequest(`/boards/${boardId}/guests`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, guest: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "update_board_guest",
  "Update a guest's role on a board",
  {
    boardId: z.string().describe("The ID of the board"),
    guestId: z.string().describe("The ID of the guest to update"),
    roleId: z.string().optional().describe("New role ID for the guest"),
  },
  async ({ boardId, guestId, roleId }) => {
    try {
      const body = {};
      if (roleId) body.roleId = roleId;
      const data = await apiRequest(`/boards/${boardId}/guests/${guestId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, guest: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "remove_board_guest",
  "Remove a guest's access from a board",
  {
    boardId: z.string().describe("The ID of the board"),
    guestId: z.string().describe("The ID of the guest to remove"),
  },
  async ({ boardId, guestId }) => {
    try {
      await apiRequest(`/boards/${boardId}/guests/${guestId}`, { method: "DELETE" });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Guest ${guestId} removed from board.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

// ======================== Custom Fields ========================

server.tool(
  "list_custom_fields",
  "List all custom fields defined in the Air workspace",
  {},
  async () => {
    try {
      const data = await apiRequest("/customfields");
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, customFields: data.data || [] }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "get_custom_field",
  "Get details of a specific custom field",
  {
    fieldId: z.string().describe("The ID of the custom field"),
  },
  async ({ fieldId }) => {
    try {
      const data = await apiRequest(`/customfields/${fieldId}`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, customField: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "create_custom_field",
  "Create a new custom field in the Air workspace",
  {
    name: z.string().describe("Name of the custom field"),
    type: z.string().describe("Type of the custom field (e.g., 'text', 'select', 'date', 'number')"),
    description: z.string().optional().describe("Description of the custom field"),
  },
  async (params) => {
    try {
      const data = await apiRequest("/customfields", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, customField: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "update_custom_field",
  "Update an existing custom field",
  {
    fieldId: z.string().describe("The ID of the custom field to update"),
    name: z.string().optional().describe("New name for the custom field"),
    description: z.string().optional().describe("New description for the custom field"),
  },
  async ({ fieldId, ...updateData }) => {
    try {
      const body = {};
      if (updateData.name) body.name = updateData.name;
      if (updateData.description) body.description = updateData.description;
      const data = await apiRequest(`/customfields/${fieldId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, customField: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "delete_custom_field",
  "Delete a custom field from the Air workspace",
  {
    fieldId: z.string().describe("The ID of the custom field to delete"),
  },
  async ({ fieldId }) => {
    try {
      await apiRequest(`/customfields/${fieldId}`, { method: "DELETE" });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Custom field ${fieldId} deleted successfully.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "add_custom_field_option",
  "Add an option to a select-type custom field",
  {
    fieldId: z.string().describe("The ID of the custom field"),
    name: z.string().describe("Name/label for the new option"),
    color: z.string().optional().describe("Color for the option"),
  },
  async ({ fieldId, ...optionData }) => {
    try {
      const data = await apiRequest(`/customfields/${fieldId}/values`, {
        method: "POST",
        body: JSON.stringify(optionData),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, option: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "update_custom_field_option",
  "Update an option on a select-type custom field",
  {
    fieldId: z.string().describe("The ID of the custom field"),
    valueId: z.string().describe("The ID of the option to update"),
    name: z.string().optional().describe("New name/label for the option"),
    color: z.string().optional().describe("New color for the option"),
  },
  async ({ fieldId, valueId, ...optionData }) => {
    try {
      const body = {};
      if (optionData.name) body.name = optionData.name;
      if (optionData.color) body.color = optionData.color;
      const data = await apiRequest(`/customfields/${fieldId}/values/${valueId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, option: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "delete_custom_field_option",
  "Delete an option from a select-type custom field",
  {
    fieldId: z.string().describe("The ID of the custom field"),
    valueId: z.string().describe("The ID of the option to delete"),
  },
  async ({ fieldId, valueId }) => {
    try {
      await apiRequest(`/customfields/${fieldId}/values/${valueId}`, { method: "DELETE" });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Option ${valueId} deleted from custom field.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

// ======================== Tags ========================

server.tool(
  "list_tags",
  "List all tags in the Air workspace",
  {},
  async () => {
    try {
      const data = await apiRequest("/tags");
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, tags: data.data || [] }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "create_tag",
  "Create a new tag in the Air workspace",
  {
    name: z.string().describe("Name of the tag"),
    color: z.string().optional().describe("Color for the tag"),
  },
  async (params) => {
    try {
      const data = await apiRequest("/tags", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, tag: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "update_tag",
  "Update an existing tag",
  {
    tagId: z.string().describe("The ID of the tag to update"),
    name: z.string().optional().describe("New name for the tag"),
    color: z.string().optional().describe("New color for the tag"),
  },
  async ({ tagId, ...updateData }) => {
    try {
      const body = {};
      if (updateData.name) body.name = updateData.name;
      if (updateData.color) body.color = updateData.color;
      const data = await apiRequest(`/tags/${tagId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, tag: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "delete_tag",
  "Delete a tag from the Air workspace",
  {
    tagId: z.string().describe("The ID of the tag to delete"),
  },
  async ({ tagId }) => {
    try {
      await apiRequest(`/tags/${tagId}`, { method: "DELETE" });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Tag ${tagId} deleted successfully.` }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

// ======================== Uploads ========================

server.tool(
  "upload_file",
  "Upload a local file to the Air workspace",
  {
    filePath: z.string().describe("Local file path of the file to upload"),
    boardId: z.string().optional().describe("Board ID to upload the file into"),
    name: z.string().optional().describe("Custom name for the uploaded file (defaults to filename)"),
  },
  async ({ filePath, boardId, name }) => {
    try {
      const { apiKey, workspaceId } = getCredentials();

      const fileContent = await readFile(filePath);
      const fileName = name || basename(filePath);
      const mimeType = detectMimeType(filePath);

      // Build multipart form data
      const formData = new FormData();
      formData.append("file", new Blob([fileContent], { type: mimeType }), fileName);
      if (boardId) formData.append("boardId", boardId);

      const response = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "x-air-workspace-id": workspaceId,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, asset: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "import_url",
  "Import an asset from a URL into the Air workspace",
  {
    url: z.string().describe("The URL to import the asset from"),
    boardId: z.string().optional().describe("Board ID to import the asset into"),
    name: z.string().optional().describe("Custom name for the imported asset"),
  },
  async (params) => {
    try {
      const data = await apiRequest("/imports", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, import: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "get_import_status",
  "Check the status of an import operation",
  {
    importId: z.string().describe("The ID of the import to check"),
  },
  async ({ importId }) => {
    try {
      const data = await apiRequest(`/imports/${importId}/status`);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, status: data.data || data }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

// ======================== Roles ========================

server.tool(
  "list_roles",
  "List all available roles in the Air workspace",
  {},
  async () => {
    try {
      const data = await apiRequest("/roles");
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, roles: data.data || [] }, null, 2) }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

// ======================== Deduplication ========================

server.tool(
  "find_duplicates_by_name",
  "Find duplicate assets by matching filenames across the workspace or a specific board",
  {
    boardId: z.string().optional().describe("Board ID to limit the search to (searches all assets if omitted)"),
  },
  async ({ boardId }) => {
    try {
      const assets = await fetchAllPages(
        boardId ? `/assets?parentBoardId=${boardId}` : "/assets"
      );

      const nameMap = new Map();
      for (const asset of assets) {
        const name = (asset.name || asset.title || "").toLowerCase().trim();
        if (!name) continue;
        if (!nameMap.has(name)) nameMap.set(name, []);
        nameMap.get(name).push(asset);
      }

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
      duplicates.sort((a, b) => b.count - a.count);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            duplicates,
            totalDuplicates: duplicates.reduce((sum, d) => sum + d.count - 1, 0),
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "find_duplicates_by_hash",
  "Find duplicate assets by matching file hashes across the workspace or a specific board",
  {
    boardId: z.string().optional().describe("Board ID to limit the search to (searches all assets if omitted)"),
  },
  async ({ boardId }) => {
    try {
      const assets = await fetchAllPages(
        boardId ? `/assets?parentBoardId=${boardId}` : "/assets"
      );

      const hashMap = new Map();
      for (const asset of assets) {
        const hash = asset.hash || asset.fileHash;
        if (hash) {
          if (!hashMap.has(hash)) hashMap.set(hash, []);
          hashMap.get(hash).push(asset);
        }
      }

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
      duplicates.sort((a, b) => b.count - a.count);

      const hasHashes = assets.some((a) => a.hash || a.fileHash);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            duplicates,
            totalDuplicates: duplicates.reduce((sum, d) => sum + d.count - 1, 0),
            note: hasHashes
              ? undefined
              : "API does not provide file hashes. Consider using name-based deduplication or downloading files to compute hashes locally.",
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

server.tool(
  "check_duplicate",
  "Check if a local file already exists in the Air workspace by comparing name and hash",
  {
    filePath: z.string().describe("Local file path to check for duplicates"),
    boardId: z.string().optional().describe("Board ID to limit the search to (searches all assets if omitted)"),
  },
  async ({ filePath, boardId }) => {
    try {
      const fileContent = await readFile(filePath);
      const localHash = createHash("sha256").update(fileContent).digest("hex");
      const localName = basename(filePath);

      const assets = await fetchAllPages(
        boardId ? `/assets?parentBoardId=${boardId}` : "/assets"
      );

      const normalizedLocalName = localName.toLowerCase().trim();
      const nameMatches = assets.filter(
        (a) => (a.name || a.title || "").toLowerCase().trim() === normalizedLocalName
      );
      const hashMatches = assets.filter(
        (a) => (a.hash || a.fileHash) === localHash
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
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
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, isDuplicate: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

// ======================== Vision ========================

server.tool(
  "download_for_analysis",
  "Download an asset to a temporary location for visual analysis. Returns the temp file path, asset name, MIME type, and size.",
  {
    assetId: z.string().describe("The ID of the asset to download for analysis"),
  },
  async ({ assetId }) => {
    try {
      // Get asset details
      const assetData = await apiRequest(`/assets/${assetId}`);
      const asset = assetData.data || assetData;
      const assetName = asset.name || asset.title || "asset";
      const ext = asset.ext || getExtension(assetName) || ".bin";
      const mimeType = asset.mimeType || detectMimeType(assetName);

      const tempPath = `/tmp/air-vision-${assetId}${ext.startsWith(".") ? ext : `.${ext}`}`;

      // Get versions to find download URL
      const versionsData = await apiRequest(`/assets/${assetId}/versions`);
      const versions = versionsData.data || [];
      if (!versions.length) throw new Error("No versions found for asset");

      const latestVersion = versions[0];
      const downloadData = await apiRequest(`/assets/${assetId}/versions/${latestVersion.id}/download`);
      const downloadUrl = downloadData.url || downloadData.data?.url;
      if (!downloadUrl) throw new Error("No download URL available for this asset");

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to download: ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      await writeFile(tempPath, Buffer.from(arrayBuffer));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            tempPath,
            assetName,
            mimeType,
            size: arrayBuffer.byteLength,
            message: `Asset downloaded to ${tempPath}. Use the Read tool to analyze the image with Claude's vision capabilities.`,
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }], isError: true };
    }
  }
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting Air MCP server:", error);
  process.exit(1);
});
