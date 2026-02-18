#!/usr/bin/env node

/**
 * Google Workspace MCP Server
 *
 * Combines Gmail, Google Drive, Google Sheets, and Google Calendar
 * into a single MCP server using shared OAuth credentials.
 *
 * Environment variables:
 *   GOOGLE_CLIENT_ID      - OAuth2 client ID
 *   GOOGLE_CLIENT_SECRET   - OAuth2 client secret
 *   GOOGLE_REFRESH_TOKEN   - OAuth2 refresh token
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// OAuth2 helper
// ---------------------------------------------------------------------------

async function getAccessToken() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } =
    process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error(
      "Missing OAuth credentials. Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are set."
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh access token: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ---------------------------------------------------------------------------
// Generic authenticated request helpers
// ---------------------------------------------------------------------------

async function googleRequest(url, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error (${response.status}): ${error}`);
  }

  if (response.status === 204) {
    return { success: true };
  }

  return response.json();
}

async function googleRequestRaw(url, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error (${response.status}): ${error}`);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Base64url decoding for Gmail
// ---------------------------------------------------------------------------

function decodeBase64Url(data) {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

// ---------------------------------------------------------------------------
// Gmail helpers
// ---------------------------------------------------------------------------

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1";

function getHeader(message, name) {
  const header = message.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
}

function getEmailBody(message) {
  const payload = message.payload;
  if (!payload) return "";

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }

    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      const html = decodeBase64Url(htmlPart.body.data);
      return html
        .replace(/<style[^>]*>.*?<\/style>/gs, "")
        .replace(/<script[^>]*>.*?<\/script>/gs, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();
    }

    for (const part of payload.parts) {
      if (part.parts) {
        const textSubPart = part.parts.find(
          (p) => p.mimeType === "text/plain"
        );
        if (textSubPart?.body?.data) {
          return decodeBase64Url(textSubPart.body.data);
        }
      }
    }
  }

  return message.snippet || "";
}

function messageToSummary(message) {
  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader(message, "Subject"),
    from: getHeader(message, "From"),
    to: getHeader(message, "To"),
    date: getHeader(message, "Date"),
    snippet: message.snippet || "",
    labels: message.labelIds || [],
    isUnread: message.labelIds?.includes("UNREAD") || false,
    isImportant: message.labelIds?.includes("IMPORTANT") || false,
  };
}

// ---------------------------------------------------------------------------
// Drive helpers
// ---------------------------------------------------------------------------

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

function formatFileSize(bytes) {
  if (!bytes) return "N/A";
  const size = parseInt(bytes);
  if (isNaN(size)) return "N/A";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let fileSize = size;
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }
  return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
}

function formatDriveFile(file) {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: formatFileSize(file.size),
    created: file.createdTime,
    modified: file.modifiedTime,
    webViewLink: file.webViewLink,
    owners: file.owners?.map((o) => o.emailAddress || o.displayName),
    shared: file.shared,
    starred: file.starred,
  };
}

// ---------------------------------------------------------------------------
// Sheets helpers
// ---------------------------------------------------------------------------

const SHEETS_BASE = "https://sheets.googleapis.com/v4";

function extractSpreadsheetId(input) {
  const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) return urlMatch[1];
  return input;
}

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

function formatEvent(event) {
  return {
    id: event.id,
    summary: event.summary || "(No title)",
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    location: event.location,
    description: event.description,
    status: event.status,
    htmlLink: event.htmlLink,
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      name: a.displayName,
      status: a.responseStatus,
    })),
  };
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "google-workspace",
  version: "1.0.0",
});

// ===========================
//  GMAIL TOOLS
// ===========================

server.tool(
  "search_email",
  "Search emails using Gmail query syntax (e.g. 'from:user@example.com', 'subject:invoice', 'is:unread')",
  {
    query: z.string().describe("Gmail search query"),
    maxResults: z
      .number()
      .optional()
      .default(20)
      .describe("Maximum number of results (default 20)"),
  },
  async ({ query, maxResults }) => {
    const encodedQuery = encodeURIComponent(query);
    const data = await googleRequest(
      `${GMAIL_BASE}/users/me/messages?q=${encodedQuery}&maxResults=${maxResults}`
    );

    if (!data.messages || data.messages.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { messages: [], count: 0, query },
              null,
              2
            ),
          },
        ],
      };
    }

    const messages = [];
    for (const msg of data.messages) {
      const full = await googleRequest(
        `${GMAIL_BASE}/users/me/messages/${msg.id}`
      );
      messages.push(messageToSummary(full));
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { messages, count: messages.length, query },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "list_unread",
  "List unread emails from Gmail inbox",
  {
    maxResults: z
      .number()
      .optional()
      .default(20)
      .describe("Maximum number of results (default 20)"),
  },
  async ({ maxResults }) => {
    const data = await googleRequest(
      `${GMAIL_BASE}/users/me/messages?q=is:unread&maxResults=${maxResults}`
    );

    if (!data.messages || data.messages.length === 0) {
      return {
        content: [
          { type: "text", text: JSON.stringify({ messages: [], count: 0 }, null, 2) },
        ],
      };
    }

    const messages = [];
    for (const msg of data.messages) {
      const full = await googleRequest(
        `${GMAIL_BASE}/users/me/messages/${msg.id}`
      );
      messages.push(messageToSummary(full));
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ messages, count: messages.length }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "get_email",
  "Get full email details including body content by message ID",
  {
    messageId: z.string().describe("Gmail message ID"),
  },
  async ({ messageId }) => {
    const message = await googleRequest(
      `${GMAIL_BASE}/users/me/messages/${messageId}`
    );
    const summary = messageToSummary(message);
    const body = getEmailBody(message);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ...summary, body }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "send_email",
  "Send an email via Gmail. Supports plain text and optional CC/BCC.",
  {
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("Plain-text email body"),
    cc: z.string().optional().describe("CC email address(es), comma-separated"),
    bcc: z
      .string()
      .optional()
      .describe("BCC email address(es), comma-separated"),
    replyToMessageId: z
      .string()
      .optional()
      .describe("Message ID to reply to (sets In-Reply-To and References headers)"),
  },
  async ({ to, subject, body, cc, bcc, replyToMessageId }) => {
    let headers = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n`;
    if (cc) headers += `Cc: ${cc}\r\n`;
    if (bcc) headers += `Bcc: ${bcc}\r\n`;

    if (replyToMessageId) {
      // Fetch the original message to get its Message-ID header
      const original = await googleRequest(
        `${GMAIL_BASE}/users/me/messages/${replyToMessageId}?format=metadata&metadataHeaders=Message-ID`
      );
      const messageIdHeader = getHeader(original, "Message-ID");
      if (messageIdHeader) {
        headers += `In-Reply-To: ${messageIdHeader}\r\n`;
        headers += `References: ${messageIdHeader}\r\n`;
      }
    }

    const rawMessage = `${headers}\r\n${body}`;
    const encoded = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const requestBody = { raw: encoded };
    if (replyToMessageId) {
      // Get threadId for threading
      const origMsg = await googleRequest(
        `${GMAIL_BASE}/users/me/messages/${replyToMessageId}?format=minimal`
      );
      requestBody.threadId = origMsg.threadId;
    }

    const result = await googleRequest(
      `${GMAIL_BASE}/users/me/messages/send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { success: true, messageId: result.id, threadId: result.threadId },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "manage_labels",
  "Apply or remove labels from a Gmail message. Can also archive (remove INBOX) or mark read (remove UNREAD).",
  {
    messageId: z.string().describe("Gmail message ID"),
    addLabels: z
      .array(z.string())
      .optional()
      .describe("Label names or IDs to add"),
    removeLabels: z
      .array(z.string())
      .optional()
      .describe("Label names or IDs to remove (use 'INBOX' to archive, 'UNREAD' to mark read)"),
  },
  async ({ messageId, addLabels, removeLabels }) => {
    // Resolve label names to IDs
    const labelsData = await googleRequest(
      `${GMAIL_BASE}/users/me/labels`
    );
    const allLabels = labelsData.labels || [];

    async function resolveLabelId(name) {
      // Check if it's already a system label ID
      const systemLabels = [
        "INBOX",
        "SPAM",
        "TRASH",
        "UNREAD",
        "STARRED",
        "IMPORTANT",
        "SENT",
        "DRAFT",
        "CATEGORY_PERSONAL",
        "CATEGORY_SOCIAL",
        "CATEGORY_PROMOTIONS",
        "CATEGORY_UPDATES",
        "CATEGORY_FORUMS",
      ];
      if (systemLabels.includes(name.toUpperCase())) {
        return name.toUpperCase();
      }

      // Search existing labels
      const existing = allLabels.find(
        (l) => l.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) return existing.id;

      // Create new label
      const newLabel = await googleRequest(
        `${GMAIL_BASE}/users/me/labels`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            labelListVisibility: "labelShow",
            messageListVisibility: "show",
          }),
        }
      );
      return newLabel.id;
    }

    const addLabelIds = [];
    const removeLabelIds = [];

    if (addLabels) {
      for (const label of addLabels) {
        addLabelIds.push(await resolveLabelId(label));
      }
    }
    if (removeLabels) {
      for (const label of removeLabels) {
        removeLabelIds.push(await resolveLabelId(label));
      }
    }

    const modifyBody = {};
    if (addLabelIds.length > 0) modifyBody.addLabelIds = addLabelIds;
    if (removeLabelIds.length > 0) modifyBody.removeLabelIds = removeLabelIds;

    await googleRequest(
      `${GMAIL_BASE}/users/me/messages/${messageId}/modify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modifyBody),
      }
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              messageId,
              labelsAdded: addLabels || [],
              labelsRemoved: removeLabels || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===========================
//  GOOGLE DRIVE TOOLS
// ===========================

server.tool(
  "search_files",
  "Search Google Drive files using Drive query syntax (e.g. \"name contains 'budget'\", \"mimeType='application/pdf'\")",
  {
    query: z
      .string()
      .describe(
        "Drive search query (e.g. \"name contains 'report'\", \"mimeType='application/pdf'\")"
      ),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Maximum number of results (default 20)"),
    orderBy: z
      .string()
      .optional()
      .describe("Sort order (e.g. 'modifiedTime desc', 'name')"),
  },
  async ({ query, limit, orderBy }) => {
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("pageSize", limit.toString());
    params.set(
      "fields",
      "files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,owners,parents,shared,starred)"
    );
    if (orderBy) params.set("orderBy", orderBy);

    const result = await googleRequest(
      `${DRIVE_BASE}/files?${params.toString()}`
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              totalFiles: result.files?.length || 0,
              files: (result.files || []).map(formatDriveFile),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "list_files",
  "List files in a Google Drive folder",
  {
    folderId: z
      .string()
      .optional()
      .default("root")
      .describe("Folder ID (default: root)"),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Maximum number of results (default 20)"),
    orderBy: z
      .string()
      .optional()
      .describe("Sort order (e.g. 'modifiedTime desc', 'name')"),
  },
  async ({ folderId, limit, orderBy }) => {
    const query = `'${folderId}' in parents and trashed = false`;
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("pageSize", limit.toString());
    params.set(
      "fields",
      "files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,owners,parents,shared,starred)"
    );
    if (orderBy) params.set("orderBy", orderBy);

    const result = await googleRequest(
      `${DRIVE_BASE}/files?${params.toString()}`
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              folderId,
              totalFiles: result.files?.length || 0,
              files: (result.files || []).map(formatDriveFile),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "download_file",
  "Download or export a file from Google Drive. For Google Workspace files (Docs, Sheets, Slides), use exportMimeType to specify the export format.",
  {
    fileId: z.string().describe("Google Drive file ID"),
    exportMimeType: z
      .string()
      .optional()
      .describe(
        "MIME type for exporting Google Workspace files (e.g. 'application/pdf', 'text/csv')"
      ),
  },
  async ({ fileId, exportMimeType }) => {
    // First get file metadata to know what we're dealing with
    const meta = await googleRequest(
      `${DRIVE_BASE}/files/${fileId}?fields=id,name,mimeType`
    );

    const url = exportMimeType
      ? `${DRIVE_BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`
      : `${DRIVE_BASE}/files/${fileId}?alt=media`;

    const response = await googleRequestRaw(url);
    const contentType = response.headers.get("content-type") || "";

    // For text-based content, return as text
    if (
      contentType.includes("text") ||
      contentType.includes("json") ||
      contentType.includes("csv") ||
      contentType.includes("xml")
    ) {
      const text = await response.text();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                fileId,
                fileName: meta.name,
                mimeType: meta.mimeType,
                exportedAs: exportMimeType || meta.mimeType,
                content: text,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // For binary content, return base64
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              fileId,
              fileName: meta.name,
              mimeType: meta.mimeType,
              exportedAs: exportMimeType || meta.mimeType,
              contentBase64: base64,
              sizeBytes: buffer.byteLength,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "upload_file",
  "Upload a file to Google Drive from text or base64 content",
  {
    name: z.string().describe("File name"),
    content: z.string().describe("File content (text or base64-encoded)"),
    mimeType: z
      .string()
      .optional()
      .default("text/plain")
      .describe("MIME type of the content (default: text/plain)"),
    isBase64: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether the content is base64-encoded (default: false)"),
    parentId: z
      .string()
      .optional()
      .describe("Parent folder ID to upload into"),
  },
  async ({ name, content, mimeType, isBase64, parentId }) => {
    const accessToken = await getAccessToken();

    const metadata = { name };
    if (parentId) metadata.parents = [parentId];

    const fileBytes = isBase64
      ? Buffer.from(content, "base64")
      : Buffer.from(content, "utf-8");

    const boundary = "-------mcp_boundary_" + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metaPart =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata);

    const filePart =
      delimiter + `Content-Type: ${mimeType}\r\n\r\n`;

    const metaBytes = Buffer.from(metaPart, "utf-8");
    const filePartBytes = Buffer.from(filePart, "utf-8");
    const closeBytes = Buffer.from(closeDelimiter, "utf-8");

    const body = Buffer.concat([metaBytes, filePartBytes, fileBytes, closeBytes]);

    const response = await fetch(
      `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const result = await response.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { success: true, file: formatDriveFile(result) },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===========================
//  GOOGLE SHEETS TOOLS
// ===========================

server.tool(
  "list_sheets",
  "List all sheets (tabs) in a Google Spreadsheet, with their grid dimensions",
  {
    spreadsheetId: z
      .string()
      .describe("Spreadsheet ID or full URL"),
  },
  async ({ spreadsheetId }) => {
    const id = extractSpreadsheetId(spreadsheetId);
    const spreadsheet = await googleRequest(
      `${SHEETS_BASE}/spreadsheets/${id}`
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              spreadsheetId: spreadsheet.spreadsheetId,
              title: spreadsheet.properties.title,
              sheets: spreadsheet.sheets.map((sheet) => ({
                sheetId: sheet.properties.sheetId,
                title: sheet.properties.title,
                index: sheet.properties.index,
                gridProperties: {
                  rowCount: sheet.properties.gridProperties.rowCount,
                  columnCount: sheet.properties.gridProperties.columnCount,
                },
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "get_range",
  "Read values from a range in a Google Spreadsheet (A1 notation)",
  {
    spreadsheetId: z
      .string()
      .describe("Spreadsheet ID or full URL"),
    range: z
      .string()
      .describe("A1 notation range (e.g. 'Sheet1!A1:D10')"),
    valueRenderOption: z
      .enum(["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"])
      .optional()
      .default("FORMATTED_VALUE")
      .describe("How values should be rendered (default: FORMATTED_VALUE)"),
  },
  async ({ spreadsheetId, range, valueRenderOption }) => {
    const id = extractSpreadsheetId(spreadsheetId);
    const params = new URLSearchParams();
    if (valueRenderOption) params.set("valueRenderOption", valueRenderOption);

    const result = await googleRequest(
      `${SHEETS_BASE}/spreadsheets/${id}/values/${encodeURIComponent(range)}?${params.toString()}`
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              range: result.range,
              majorDimension: result.majorDimension,
              values: result.values || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "update_range",
  "Write or update values in a range of a Google Spreadsheet",
  {
    spreadsheetId: z
      .string()
      .describe("Spreadsheet ID or full URL"),
    range: z
      .string()
      .describe("A1 notation range (e.g. 'Sheet1!A1:B2')"),
    values: z
      .array(z.array(z.any()))
      .describe("2D array of values to write (rows x columns)"),
    valueInputOption: z
      .enum(["RAW", "USER_ENTERED"])
      .optional()
      .default("USER_ENTERED")
      .describe("How values should be interpreted (default: USER_ENTERED)"),
  },
  async ({ spreadsheetId, range, values, valueInputOption }) => {
    const id = extractSpreadsheetId(spreadsheetId);
    const params = new URLSearchParams();
    params.set("valueInputOption", valueInputOption);

    const result = await googleRequest(
      `${SHEETS_BASE}/spreadsheets/${id}/values/${encodeURIComponent(range)}?${params.toString()}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      }
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "append_to_sheet",
  "Append rows to the end of a range in a Google Spreadsheet",
  {
    spreadsheetId: z
      .string()
      .describe("Spreadsheet ID or full URL"),
    range: z
      .string()
      .describe("A1 notation range to append to (e.g. 'Sheet1!A1:D1')"),
    values: z
      .array(z.array(z.any()))
      .describe("2D array of rows to append"),
    valueInputOption: z
      .enum(["RAW", "USER_ENTERED"])
      .optional()
      .default("USER_ENTERED")
      .describe("How values should be interpreted (default: USER_ENTERED)"),
    insertDataOption: z
      .enum(["OVERWRITE", "INSERT_ROWS"])
      .optional()
      .default("INSERT_ROWS")
      .describe("Whether to insert new rows or overwrite (default: INSERT_ROWS)"),
  },
  async ({ spreadsheetId, range, values, valueInputOption, insertDataOption }) => {
    const id = extractSpreadsheetId(spreadsheetId);
    const params = new URLSearchParams();
    params.set("valueInputOption", valueInputOption);
    params.set("insertDataOption", insertDataOption);

    const result = await googleRequest(
      `${SHEETS_BASE}/spreadsheets/${id}/values/${encodeURIComponent(range)}:append?${params.toString()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      }
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "create_spreadsheet",
  "Create a new Google Spreadsheet with optional sheet names",
  {
    title: z.string().describe("Spreadsheet title"),
    sheetNames: z
      .array(z.string())
      .optional()
      .describe("Optional list of sheet/tab names to create"),
  },
  async ({ title, sheetNames }) => {
    const body = {
      properties: { title },
    };

    if (sheetNames && sheetNames.length > 0) {
      body.sheets = sheetNames.map((name) => ({
        properties: { title: name },
      }));
    }

    const result = await googleRequest(`${SHEETS_BASE}/spreadsheets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              spreadsheetId: result.spreadsheetId,
              title: result.properties.title,
              url: result.spreadsheetUrl,
              sheets: result.sheets.map((s) => ({
                sheetId: s.properties.sheetId,
                title: s.properties.title,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===========================
//  GOOGLE CALENDAR TOOLS
// ===========================

server.tool(
  "list_events",
  "List events from a Google Calendar within a date range. Defaults to today if no dates provided.",
  {
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("Calendar ID (default: 'primary')"),
    timeMin: z
      .string()
      .optional()
      .describe("Start of time range in ISO 8601 format (e.g. '2025-01-01T00:00:00Z')"),
    timeMax: z
      .string()
      .optional()
      .describe("End of time range in ISO 8601 format"),
    maxResults: z
      .number()
      .optional()
      .default(50)
      .describe("Maximum number of events (default 50)"),
  },
  async ({ calendarId, timeMin, timeMax, maxResults }) => {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      singleEvents: "true",
      orderBy: "startTime",
    });

    // Default to today
    let effectiveTimeMin = timeMin;
    let effectiveTimeMax = timeMax;
    if (!timeMin && !timeMax) {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      effectiveTimeMin = startOfDay.toISOString();
      effectiveTimeMax = endOfDay.toISOString();
    }

    if (effectiveTimeMin) params.set("timeMin", effectiveTimeMin);
    if (effectiveTimeMax) params.set("timeMax", effectiveTimeMax);

    const result = await googleRequest(
      `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              calendarId,
              timeRange: {
                min: effectiveTimeMin,
                max: effectiveTimeMax,
              },
              count: (result.items || []).length,
              events: (result.items || []).map(formatEvent),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "create_event",
  "Create a new event on a Google Calendar",
  {
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("Calendar ID (default: 'primary')"),
    summary: z.string().describe("Event title"),
    description: z.string().optional().describe("Event description"),
    location: z.string().optional().describe("Event location"),
    startDateTime: z
      .string()
      .describe("Event start in ISO 8601 format (e.g. '2025-01-15T10:00:00-08:00')"),
    endDateTime: z
      .string()
      .describe("Event end in ISO 8601 format"),
    startDate: z
      .string()
      .optional()
      .describe("For all-day events: start date (YYYY-MM-DD). Overrides startDateTime."),
    endDate: z
      .string()
      .optional()
      .describe("For all-day events: end date (YYYY-MM-DD). Overrides endDateTime."),
    timeZone: z
      .string()
      .optional()
      .describe("Time zone (e.g. 'America/Los_Angeles')"),
    attendees: z
      .array(z.string())
      .optional()
      .describe("List of attendee email addresses"),
    recurrence: z
      .array(z.string())
      .optional()
      .describe("Recurrence rules (e.g. ['RRULE:FREQ=WEEKLY;COUNT=10'])"),
  },
  async ({
    calendarId,
    summary,
    description,
    location,
    startDateTime,
    endDateTime,
    startDate,
    endDate,
    timeZone,
    attendees,
    recurrence,
  }) => {
    const event = { summary };

    if (description) event.description = description;
    if (location) event.location = location;
    if (recurrence) event.recurrence = recurrence;

    // All-day events use date, timed events use dateTime
    if (startDate) {
      event.start = { date: startDate };
      event.end = { date: endDate || startDate };
    } else {
      event.start = { dateTime: startDateTime };
      event.end = { dateTime: endDateTime };
      if (timeZone) {
        event.start.timeZone = timeZone;
        event.end.timeZone = timeZone;
      }
    }

    if (attendees) {
      event.attendees = attendees.map((email) => ({ email }));
    }

    const result = await googleRequest(
      `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { success: true, event: formatEvent(result) },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "update_event",
  "Update an existing event on a Google Calendar (partial update via PATCH)",
  {
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("Calendar ID (default: 'primary')"),
    eventId: z.string().describe("Event ID to update"),
    summary: z.string().optional().describe("Updated event title"),
    description: z.string().optional().describe("Updated description"),
    location: z.string().optional().describe("Updated location"),
    startDateTime: z
      .string()
      .optional()
      .describe("Updated start in ISO 8601 format"),
    endDateTime: z
      .string()
      .optional()
      .describe("Updated end in ISO 8601 format"),
    startDate: z
      .string()
      .optional()
      .describe("For all-day events: updated start date (YYYY-MM-DD)"),
    endDate: z
      .string()
      .optional()
      .describe("For all-day events: updated end date (YYYY-MM-DD)"),
    timeZone: z.string().optional().describe("Time zone"),
    attendees: z
      .array(z.string())
      .optional()
      .describe("Updated list of attendee email addresses"),
    status: z
      .enum(["confirmed", "tentative", "cancelled"])
      .optional()
      .describe("Event status"),
  },
  async ({
    calendarId,
    eventId,
    summary,
    description,
    location,
    startDateTime,
    endDateTime,
    startDate,
    endDate,
    timeZone,
    attendees,
    status,
  }) => {
    const update = {};

    if (summary !== undefined) update.summary = summary;
    if (description !== undefined) update.description = description;
    if (location !== undefined) update.location = location;
    if (status !== undefined) update.status = status;

    if (startDate) {
      update.start = { date: startDate };
      update.end = { date: endDate || startDate };
    } else if (startDateTime) {
      update.start = { dateTime: startDateTime };
      if (endDateTime) update.end = { dateTime: endDateTime };
      if (timeZone) {
        if (update.start) update.start.timeZone = timeZone;
        if (update.end) update.end.timeZone = timeZone;
      }
    }

    if (attendees) {
      update.attendees = attendees.map((email) => ({ email }));
    }

    const result = await googleRequest(
      `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      }
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { success: true, event: formatEvent(result) },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "delete_event",
  "Delete an event from a Google Calendar",
  {
    calendarId: z
      .string()
      .optional()
      .default("primary")
      .describe("Calendar ID (default: 'primary')"),
    eventId: z.string().describe("Event ID to delete"),
  },
  async ({ calendarId, eventId }) => {
    await googleRequest(
      `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE" }
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `Event ${eventId} deleted from calendar ${calendarId}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Google Workspace MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
