#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Pinterest API configuration
const API_BASE = "https://api.pinterest.com/v5";

// Credentials from environment
const CLIENT_ID = process.env.PINTEREST_CLIENT_ID;
const CLIENT_SECRET = process.env.PINTEREST_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.PINTEREST_REFRESH_TOKEN;
const ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;

// Token cache
let cachedAccessToken = null;
let tokenExpiry = 0;

/**
 * Get access token, refreshing if necessary.
 * Supports direct access token (for trial apps) or OAuth refresh flow.
 */
async function getAccessToken() {
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
        "or both PINTEREST_CLIENT_ID and PINTEREST_CLIENT_SECRET."
    );
  }

  if (!REFRESH_TOKEN) {
    throw new Error(
      "Missing PINTEREST_REFRESH_TOKEN. Complete OAuth flow to authenticate."
    );
  }

  const response = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
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

  return cachedAccessToken;
}

/**
 * Make authenticated request to Pinterest API v5.
 */
async function apiRequest(endpoint, options = {}) {
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

// ============ Create MCP Server ============

const server = new McpServer({
  name: "pinterest",
  version: "1.0.0",
});

// ============ User Account Tools ============

server.tool(
  "account_info",
  "Get the authenticated user's Pinterest account details including username, profile image, and account type",
  {},
  async () => {
    try {
      const data = await apiRequest("/user_account");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "account_analytics",
  "Get analytics for the authenticated user's account over a date range. Returns metrics like impressions, clicks, saves, and engagement.",
  {
    start_date: z
      .string()
      .describe("Start date in YYYY-MM-DD format"),
    end_date: z
      .string()
      .describe("End date in YYYY-MM-DD format"),
  },
  async ({ start_date, end_date }) => {
    try {
      const params = new URLSearchParams({
        start_date,
        end_date,
        metric_types:
          "IMPRESSION,OUTBOUND_CLICK,PIN_CLICK,SAVE,ENGAGEMENT,TOTAL_ENGAGEMENT",
      });
      const data = await apiRequest(`/user_account/analytics?${params}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "top_pins",
  "Get top performing pins for the authenticated user sorted by engagement over a date range",
  {
    start_date: z
      .string()
      .describe("Start date in YYYY-MM-DD format"),
    end_date: z
      .string()
      .describe("End date in YYYY-MM-DD format"),
    num_of_pins: z
      .number()
      .optional()
      .default(50)
      .describe("Number of top pins to return (default 50)"),
  },
  async ({ start_date, end_date, num_of_pins }) => {
    try {
      const params = new URLSearchParams({
        start_date,
        end_date,
        sort_by: "ENGAGEMENT",
        num_of_pins: String(num_of_pins),
      });
      const data = await apiRequest(
        `/user_account/analytics/top_pins?${params}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "list_followers",
  "List followers of the authenticated user's Pinterest account",
  {
    page_size: z
      .number()
      .optional()
      .default(25)
      .describe("Number of followers per page (default 25, max 250)"),
    bookmark: z
      .string()
      .optional()
      .describe("Pagination bookmark from a previous response"),
  },
  async ({ page_size, bookmark }) => {
    try {
      const params = new URLSearchParams({ page_size: String(page_size) });
      if (bookmark) params.set("bookmark", bookmark);
      const data = await apiRequest(
        `/user_account/followers?${params}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "list_following",
  "List accounts the authenticated user is following on Pinterest",
  {
    page_size: z
      .number()
      .optional()
      .default(25)
      .describe("Number of results per page (default 25, max 250)"),
    bookmark: z
      .string()
      .optional()
      .describe("Pagination bookmark from a previous response"),
  },
  async ({ page_size, bookmark }) => {
    try {
      const params = new URLSearchParams({ page_size: String(page_size) });
      if (bookmark) params.set("bookmark", bookmark);
      const data = await apiRequest(
        `/user_account/following?${params}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ============ Board Tools ============

server.tool(
  "list_boards",
  "List all boards for the authenticated user. Returns board names, IDs, descriptions, privacy settings, and pin counts.",
  {
    page_size: z
      .number()
      .optional()
      .default(25)
      .describe("Number of boards per page (default 25, max 250)"),
    bookmark: z
      .string()
      .optional()
      .describe("Pagination bookmark from a previous response"),
  },
  async ({ page_size, bookmark }) => {
    try {
      const params = new URLSearchParams({ page_size: String(page_size) });
      if (bookmark) params.set("bookmark", bookmark);
      const data = await apiRequest(`/boards?${params}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_board",
  "Get details of a specific Pinterest board by its ID",
  {
    board_id: z.string().describe("The ID of the board to retrieve"),
  },
  async ({ board_id }) => {
    try {
      const data = await apiRequest(`/boards/${board_id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "create_board",
  "Create a new Pinterest board with a name, optional description, and privacy setting",
  {
    name: z.string().describe("Name of the board"),
    description: z.string().optional().describe("Board description"),
    privacy: z
      .enum(["PUBLIC", "PROTECTED", "SECRET"])
      .optional()
      .describe("Board privacy setting (default PUBLIC)"),
  },
  async ({ name, description, privacy }) => {
    try {
      const body = { name };
      if (description !== undefined) body.description = description;
      if (privacy !== undefined) body.privacy = privacy;
      const data = await apiRequest("/boards", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "update_board",
  "Update an existing Pinterest board's name, description, or privacy setting",
  {
    board_id: z.string().describe("The ID of the board to update"),
    name: z.string().optional().describe("New board name"),
    description: z.string().optional().describe("New board description"),
    privacy: z
      .enum(["PUBLIC", "PROTECTED", "SECRET"])
      .optional()
      .describe("New privacy setting"),
  },
  async ({ board_id, name, description, privacy }) => {
    try {
      const body = {};
      if (name !== undefined) body.name = name;
      if (description !== undefined) body.description = description;
      if (privacy !== undefined) body.privacy = privacy;
      const data = await apiRequest(`/boards/${board_id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "delete_board",
  "Delete a Pinterest board by its ID. This action is irreversible.",
  {
    board_id: z.string().describe("The ID of the board to delete"),
  },
  async ({ board_id }) => {
    try {
      await apiRequest(`/boards/${board_id}`, { method: "DELETE" });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, deleted: true }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "list_board_pins",
  "List all pins on a specific Pinterest board",
  {
    board_id: z.string().describe("The ID of the board"),
    page_size: z
      .number()
      .optional()
      .default(25)
      .describe("Number of pins per page (default 25, max 250)"),
    bookmark: z
      .string()
      .optional()
      .describe("Pagination bookmark from a previous response"),
  },
  async ({ board_id, page_size, bookmark }) => {
    try {
      const params = new URLSearchParams({ page_size: String(page_size) });
      if (bookmark) params.set("bookmark", bookmark);
      const data = await apiRequest(`/boards/${board_id}/pins?${params}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ============ Board Section Tools ============

server.tool(
  "list_sections",
  "List all sections within a Pinterest board",
  {
    board_id: z.string().describe("The ID of the board"),
  },
  async ({ board_id }) => {
    try {
      const data = await apiRequest(`/boards/${board_id}/sections`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "create_section",
  "Create a new section within a Pinterest board",
  {
    board_id: z.string().describe("The ID of the board"),
    name: z.string().describe("Name of the new section"),
  },
  async ({ board_id, name }) => {
    try {
      const data = await apiRequest(`/boards/${board_id}/sections`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "update_section",
  "Update the name of a section within a Pinterest board",
  {
    board_id: z.string().describe("The ID of the board"),
    section_id: z.string().describe("The ID of the section to update"),
    name: z.string().describe("New name for the section"),
  },
  async ({ board_id, section_id, name }) => {
    try {
      const data = await apiRequest(
        `/boards/${board_id}/sections/${section_id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name }),
        }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "delete_section",
  "Delete a section from a Pinterest board. This action is irreversible.",
  {
    board_id: z.string().describe("The ID of the board"),
    section_id: z.string().describe("The ID of the section to delete"),
  },
  async ({ board_id, section_id }) => {
    try {
      await apiRequest(`/boards/${board_id}/sections/${section_id}`, {
        method: "DELETE",
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, deleted: true }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "list_section_pins",
  "List all pins within a specific section of a Pinterest board",
  {
    board_id: z.string().describe("The ID of the board"),
    section_id: z.string().describe("The ID of the section"),
    page_size: z
      .number()
      .optional()
      .default(25)
      .describe("Number of pins per page (default 25, max 250)"),
    bookmark: z
      .string()
      .optional()
      .describe("Pagination bookmark from a previous response"),
  },
  async ({ board_id, section_id, page_size, bookmark }) => {
    try {
      const params = new URLSearchParams({ page_size: String(page_size) });
      if (bookmark) params.set("bookmark", bookmark);
      const data = await apiRequest(
        `/boards/${board_id}/sections/${section_id}/pins?${params}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ============ Pin Tools ============

server.tool(
  "list_pins",
  "List the authenticated user's pins",
  {
    page_size: z
      .number()
      .optional()
      .default(25)
      .describe("Number of pins per page (default 25, max 250)"),
    bookmark: z
      .string()
      .optional()
      .describe("Pagination bookmark from a previous response"),
  },
  async ({ page_size, bookmark }) => {
    try {
      const params = new URLSearchParams({ page_size: String(page_size) });
      if (bookmark) params.set("bookmark", bookmark);
      const data = await apiRequest(`/pins?${params}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_pin",
  "Get details of a specific pin by its ID, including title, description, link, images, and board info",
  {
    pin_id: z.string().describe("The ID of the pin to retrieve"),
  },
  async ({ pin_id }) => {
    try {
      const data = await apiRequest(`/pins/${pin_id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "create_pin",
  "Create a new pin on Pinterest. Requires a board ID and a media source (image URL, base64 image, video ID, or multiple image URLs).",
  {
    board_id: z.string().describe("The ID of the board to pin to"),
    board_section_id: z
      .string()
      .optional()
      .describe("The ID of the board section to pin to"),
    title: z.string().optional().describe("Pin title (max 100 characters)"),
    description: z
      .string()
      .optional()
      .describe("Pin description (max 800 characters)"),
    alt_text: z
      .string()
      .optional()
      .describe("Alt text for the pin image (max 500 characters)"),
    link: z.string().optional().describe("Destination URL when the pin is clicked"),
    media_source_type: z
      .enum(["image_url", "image_base64", "video_id", "multiple_image_urls"])
      .describe(
        "Type of media source: image_url (URL to an image), image_base64 (base64-encoded image), video_id (Pinterest video ID), or multiple_image_urls (carousel)"
      ),
    media_url: z
      .string()
      .optional()
      .describe(
        "URL of the image (required for image_url source type)"
      ),
    media_content_type: z
      .string()
      .optional()
      .describe(
        "MIME type of the base64 image, e.g. image/png (required for image_base64 source type)"
      ),
    media_data: z
      .string()
      .optional()
      .describe(
        "Base64-encoded image data (required for image_base64 source type)"
      ),
    media_cover_image_url: z
      .string()
      .optional()
      .describe("Cover image URL for video or carousel pins"),
    media_items: z
      .array(z.object({ url: z.string().describe("Image URL") }))
      .optional()
      .describe(
        "Array of image URLs for carousel pins (required for multiple_image_urls source type)"
      ),
  },
  async ({
    board_id,
    board_section_id,
    title,
    description,
    alt_text,
    link,
    media_source_type,
    media_url,
    media_content_type,
    media_data,
    media_cover_image_url,
    media_items,
  }) => {
    try {
      const mediaSource = { source_type: media_source_type };
      if (media_url) mediaSource.url = media_url;
      if (media_content_type) mediaSource.content_type = media_content_type;
      if (media_data) mediaSource.data = media_data;
      if (media_cover_image_url)
        mediaSource.cover_image_url = media_cover_image_url;
      if (media_items) mediaSource.items = media_items;

      const body = { board_id, media_source: mediaSource };
      if (board_section_id) body.board_section_id = board_section_id;
      if (title) body.title = title;
      if (description) body.description = description;
      if (alt_text) body.alt_text = alt_text;
      if (link) body.link = link;

      const data = await apiRequest("/pins", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "update_pin",
  "Update an existing pin's title, description, alt text, link, or move it to a different board/section",
  {
    pin_id: z.string().describe("The ID of the pin to update"),
    title: z.string().optional().describe("New pin title"),
    description: z.string().optional().describe("New pin description"),
    alt_text: z.string().optional().describe("New alt text for the pin image"),
    link: z.string().optional().describe("New destination URL"),
    board_id: z
      .string()
      .optional()
      .describe("Board ID to move the pin to"),
    board_section_id: z
      .string()
      .optional()
      .describe("Board section ID to move the pin to"),
  },
  async ({ pin_id, title, description, alt_text, link, board_id, board_section_id }) => {
    try {
      const body = {};
      if (title !== undefined) body.title = title;
      if (description !== undefined) body.description = description;
      if (alt_text !== undefined) body.alt_text = alt_text;
      if (link !== undefined) body.link = link;
      if (board_id !== undefined) body.board_id = board_id;
      if (board_section_id !== undefined)
        body.board_section_id = board_section_id;

      const data = await apiRequest(`/pins/${pin_id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "delete_pin",
  "Delete a pin by its ID. This action is irreversible.",
  {
    pin_id: z.string().describe("The ID of the pin to delete"),
  },
  async ({ pin_id }) => {
    try {
      await apiRequest(`/pins/${pin_id}`, { method: "DELETE" });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, deleted: true }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "pin_analytics",
  "Get analytics for a specific pin over a date range. Returns metrics like impressions, clicks, saves, comments, and reactions.",
  {
    pin_id: z.string().describe("The ID of the pin"),
    start_date: z
      .string()
      .describe("Start date in YYYY-MM-DD format"),
    end_date: z
      .string()
      .describe("End date in YYYY-MM-DD format"),
  },
  async ({ pin_id, start_date, end_date }) => {
    try {
      const params = new URLSearchParams({
        start_date,
        end_date,
        metric_types:
          "IMPRESSION,OUTBOUND_CLICK,PIN_CLICK,SAVE,TOTAL_COMMENTS,TOTAL_REACTIONS",
        app_types: "ALL",
        split_field: "NO_SPLIT",
      });
      const data = await apiRequest(`/pins/${pin_id}/analytics?${params}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "save_pin",
  "Save (repin) an existing pin to a board, optionally into a specific section",
  {
    pin_id: z.string().describe("The ID of the pin to save"),
    board_id: z.string().describe("The ID of the board to save the pin to"),
    board_section_id: z
      .string()
      .optional()
      .describe("The ID of the board section to save the pin to"),
  },
  async ({ pin_id, board_id, board_section_id }) => {
    try {
      const body = { board_id };
      if (board_section_id) body.board_section_id = board_section_id;
      const data = await apiRequest(`/pins/${pin_id}/save`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ============ Convenience Tools ============

server.tool(
  "search_boards",
  "Search the authenticated user's boards by name (client-side filter). Fetches up to 100 boards and filters by query string.",
  {
    query: z.string().describe("Search query to match against board names"),
  },
  async ({ query }) => {
    try {
      const data = await apiRequest(`/boards?page_size=100`);
      const boards = data.items || [];
      const queryLower = query.toLowerCase();
      const matching = boards.filter((board) =>
        board.name.toLowerCase().includes(queryLower)
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { query, boards: matching, total: matching.length },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "board_summary",
  "Get a summary of a board including its details, pin count, and list of sections",
  {
    board_id: z.string().describe("The ID of the board"),
  },
  async ({ board_id }) => {
    try {
      // Fetch board details and sections in parallel
      const [boardData, sectionsData] = await Promise.all([
        apiRequest(`/boards/${board_id}`),
        apiRequest(`/boards/${board_id}/sections`),
      ]);

      const sections = sectionsData.items || [];

      const summary = {
        board: boardData,
        pinCount: boardData.pin_count || 0,
        sectionCount: sections.length,
        sections: sections.map((s) => ({ id: s.id, name: s.name })),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ============ Start Server ============

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
