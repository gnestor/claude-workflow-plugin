#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Gmail API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write gmail-client.ts <command> [args...]
 *
 * Commands:
 *   auth                                    - Authenticate and obtain refresh token
 *   list-unread [max-results]               - List unread emails
 *   list-important [max-results]            - List important emails
 *   get-email <message-id>                  - Get email details
 *   search <query> [max-results]            - Search emails with Gmail syntax
 *   analyze-priority [max-results]          - Analyze and categorize emails by priority
 *   apply-label <message-id> <label>        - Apply label to email
 *   archive <message-id>                    - Archive email
 *   mark-read <message-id>                  - Mark email as read
 *   create-task <message-id> [database-id]  - Create Notion task from email
 */

import "@std/dotenv/load";
import { Client as NotionClient } from "@notionhq/client";
import { getAccessToken as getSharedOAuthToken, authenticate as authenticateOAuth } from "../../scripts/google.ts";

// Gmail API types and interfaces
interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
      parts?: any[];
    }>;
  };
  internalDate?: string;
}

interface EmailSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  labels: string[];
  isUnread: boolean;
  isImportant: boolean;
}

interface PriorityEmail extends EmailSummary {
  priority: "high" | "medium" | "low";
  priorityScore: number;
  reasoning: string;
}

// Gmail API OAuth2 configuration
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
];

/**
 * Get OAuth2 access token from refresh token (uses shared OAuth library)
 */
async function getAccessToken(): Promise<string> {
  return getSharedOAuthToken(SCOPES);
}

/**
 * Make authenticated request to Gmail API
 */
async function gmailRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  return response.json();
}

/**
 * Decode base64url encoded data
 */
function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);
  return new TextDecoder().decode(
    Uint8Array.from(decoded, (c) => c.charCodeAt(0))
  );
}

/**
 * Extract header value from message
 */
function getHeader(message: GmailMessage, name: string): string {
  const header = message.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
}

/**
 * Get email body from message
 */
function getEmailBody(message: GmailMessage): string {
  const payload = message.payload;
  if (!payload) return "";

  // Try direct body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Try parts
  if (payload.parts) {
    // Look for text/plain first
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }

    // Fall back to text/html
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      const html = decodeBase64Url(htmlPart.body.data);
      // Basic HTML to text conversion
      return html
        .replace(/<style[^>]*>.*?<\/style>/gs, "")
        .replace(/<script[^>]*>.*?<\/script>/gs, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();
    }

    // Recursive search in nested parts
    for (const part of payload.parts) {
      if (part.parts) {
        const textSubPart = part.parts.find((p) => p.mimeType === "text/plain");
        if (textSubPart?.body?.data) {
          return decodeBase64Url(textSubPart.body.data);
        }
      }
    }
  }

  return message.snippet || "";
}

/**
 * Convert Gmail message to EmailSummary
 */
function messageToSummary(message: GmailMessage): EmailSummary {
  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader(message, "Subject"),
    from: getHeader(message, "From"),
    date: getHeader(message, "Date"),
    snippet: message.snippet || "",
    labels: message.labelIds || [],
    isUnread: message.labelIds?.includes("UNREAD") || false,
    isImportant: message.labelIds?.includes("IMPORTANT") || false,
  };
}

/**
 * Authenticate with Gmail API using OAuth2
 */
async function authenticate() {
  return authenticateOAuth(SCOPES, "Gmail");
}

/**
 * List unread emails
 */
async function listUnread(maxResults: number = 50) {
  try {
    const data = await gmailRequest(
      `/users/me/messages?q=is:unread&maxResults=${maxResults}`
    );

    if (!data.messages || data.messages.length === 0) {
      return {
        success: true,
        messages: [],
        count: 0,
      };
    }

    // Get full message details
    const messages: EmailSummary[] = [];
    for (const msg of data.messages) {
      const fullMessage = await gmailRequest(`/users/me/messages/${msg.id}`);
      messages.push(messageToSummary(fullMessage));
    }

    return {
      success: true,
      messages,
      count: messages.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List important emails
 */
async function listImportant(maxResults: number = 50) {
  try {
    const data = await gmailRequest(
      `/users/me/messages?q=is:important&maxResults=${maxResults}`
    );

    if (!data.messages || data.messages.length === 0) {
      return {
        success: true,
        messages: [],
        count: 0,
      };
    }

    // Get full message details
    const messages: EmailSummary[] = [];
    for (const msg of data.messages) {
      const fullMessage = await gmailRequest(`/users/me/messages/${msg.id}`);
      messages.push(messageToSummary(fullMessage));
    }

    return {
      success: true,
      messages,
      count: messages.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get email details
 */
async function getEmail(messageId: string) {
  try {
    const message = await gmailRequest(`/users/me/messages/${messageId}`);
    const summary = messageToSummary(message);
    const body = getEmailBody(message);

    return {
      success: true,
      email: {
        ...summary,
        body,
        rawMessage: message,
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
 * Search emails
 */
async function searchEmails(query: string, maxResults: number = 50) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const data = await gmailRequest(
      `/users/me/messages?q=${encodedQuery}&maxResults=${maxResults}`
    );

    if (!data.messages || data.messages.length === 0) {
      return {
        success: true,
        messages: [],
        count: 0,
        query,
      };
    }

    // Get full message details
    const messages: EmailSummary[] = [];
    for (const msg of data.messages) {
      const fullMessage = await gmailRequest(`/users/me/messages/${msg.id}`);
      messages.push(messageToSummary(fullMessage));
    }

    return {
      success: true,
      messages,
      count: messages.length,
      query,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate priority score for an email
 */
function calculatePriority(email: EmailSummary): PriorityEmail {
  let score = 0;
  const reasons: string[] = [];

  // Check if marked as important by Gmail
  if (email.isImportant) {
    score += 30;
    reasons.push("marked as important");
  }

  // Check for urgent keywords
  const urgentKeywords = [
    "urgent",
    "asap",
    "deadline",
    "important",
    "critical",
    "time-sensitive",
    "action required",
  ];
  const subjectLower = email.subject.toLowerCase();
  const snippetLower = email.snippet.toLowerCase();

  for (const keyword of urgentKeywords) {
    if (subjectLower.includes(keyword) || snippetLower.includes(keyword)) {
      score += 25;
      reasons.push(`contains "${keyword}"`);
      break;
    }
  }

  // Check for financial/payment keywords
  const financialKeywords = [
    "invoice",
    "payment",
    "bill",
    "receipt",
    "charge",
    "subscription",
  ];
  for (const keyword of financialKeywords) {
    if (subjectLower.includes(keyword) || snippetLower.includes(keyword)) {
      score += 20;
      reasons.push("financial/payment related");
      break;
    }
  }

  // Check for questions
  if (
    subjectLower.includes("?") ||
    snippetLower.includes("can you") ||
    snippetLower.includes("could you") ||
    snippetLower.includes("would you")
  ) {
    score += 15;
    reasons.push("contains question or request");
  }

  // Check for no-reply addresses (lower priority)
  if (
    email.from.toLowerCase().includes("no-reply") ||
    email.from.toLowerCase().includes("noreply")
  ) {
    score -= 20;
    reasons.push("automated no-reply email");
  }

  // Check for marketing/promotional
  const marketingKeywords = [
    "unsubscribe",
    "newsletter",
    "promotion",
    "deal",
    "sale",
    "offer",
  ];
  for (const keyword of marketingKeywords) {
    if (snippetLower.includes(keyword)) {
      score -= 15;
      reasons.push("marketing/promotional content");
      break;
    }
  }

  // Determine priority category
  let priority: "high" | "medium" | "low";
  if (score >= 40) {
    priority = "high";
  } else if (score >= 15) {
    priority = "medium";
  } else {
    priority = "low";
  }

  return {
    ...email,
    priority,
    priorityScore: score,
    reasoning: reasons.join(", ") || "no special indicators",
  };
}

/**
 * Analyze email priority
 */
async function analyzePriority(maxResults: number = 50) {
  try {
    // Get unread emails
    const unreadResult = await listUnread(maxResults);

    if (!unreadResult.success || !unreadResult.messages) {
      return unreadResult;
    }

    // Calculate priority for each email
    const priorityEmails = unreadResult.messages.map(calculatePriority);

    // Sort by priority score (highest first)
    priorityEmails.sort((a, b) => b.priorityScore - a.priorityScore);

    // Group by priority
    const high = priorityEmails.filter((e) => e.priority === "high");
    const medium = priorityEmails.filter((e) => e.priority === "medium");
    const low = priorityEmails.filter((e) => e.priority === "low");

    return {
      success: true,
      emails: priorityEmails,
      summary: {
        total: priorityEmails.length,
        high: high.length,
        medium: medium.length,
        low: low.length,
      },
      grouped: {
        high,
        medium,
        low,
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
 * Apply label to email
 */
async function applyLabel(messageId: string, labelName: string) {
  try {
    // First, get all labels to find or create the label
    const labelsData = await gmailRequest("/users/me/labels");
    let labelId = labelsData.labels.find(
      (l: any) => l.name.toLowerCase() === labelName.toLowerCase()
    )?.id;

    // Create label if it doesn't exist
    if (!labelId) {
      const newLabel = await gmailRequest("/users/me/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: labelName,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        }),
      });
      labelId = newLabel.id;
    }

    // Apply label to message
    await gmailRequest(`/users/me/messages/${messageId}/modify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addLabelIds: [labelId],
      }),
    });

    return {
      success: true,
      messageId,
      label: labelName,
      labelId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Archive email (remove from inbox)
 */
async function archiveEmail(messageId: string) {
  try {
    await gmailRequest(`/users/me/messages/${messageId}/modify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removeLabelIds: ["INBOX"],
      }),
    });

    return {
      success: true,
      messageId,
      archived: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Mark email as read
 */
async function markAsRead(messageId: string) {
  try {
    await gmailRequest(`/users/me/messages/${messageId}/modify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removeLabelIds: ["UNREAD"],
      }),
    });

    return {
      success: true,
      messageId,
      read: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create Notion task from email
 */
async function createNotionTask(
  messageId: string,
  databaseId: string = "fd81d5460ca54452817115bce4957403"
) {
  try {
    // Get email details
    const emailResult = await getEmail(messageId);
    if (!emailResult.success || !emailResult.email) {
      return {
        success: false,
        error: "Failed to retrieve email",
      };
    }

    const email = emailResult.email;

    // Calculate priority
    const priorityEmail = calculatePriority(email);

    // Initialize Notion client
    const notionToken = Deno.env.get("NOTION_API_TOKEN");
    if (!notionToken) {
      return {
        success: false,
        error: "NOTION_API_TOKEN not set in .env",
      };
    }

    const notion = new NotionClient({ auth: notionToken });

    // Create task content
    const emailUrl = `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
    const taskContent = `
## Email Details

**From:** ${email.from}
**Date:** ${email.date}
**Priority:** ${priorityEmail.priority.toUpperCase()}

---

${email.body}

---

[Open in Gmail](${emailUrl})
`;

    // Create page in Notion
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: email.subject || "(No Subject)",
              },
            },
          ],
        },
        Status: {
          status: {
            name: "To Do",
          },
        },
        Priority: {
          select: {
            name:
              priorityEmail.priority.charAt(0).toUpperCase() +
              priorityEmail.priority.slice(1),
          },
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: { content: taskContent },
              },
            ],
          },
        },
      ],
    });

    return {
      success: true,
      messageId,
      notionPage: {
        id: response.id,
        url: (response as any).url,
      },
      email: {
        subject: email.subject,
        from: email.from,
        priority: priorityEmail.priority,
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
 * Main CLI handler
 */
async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.error("Usage: gmail-client.ts <command> [args...]");
    console.error("\nCommands:");
    console.error("  auth");
    console.error("  list-unread [max-results]");
    console.error("  list-important [max-results]");
    console.error("  get-email <message-id>");
    console.error("  search <query> [max-results]");
    console.error("  analyze-priority [max-results]");
    console.error("  apply-label <message-id> <label>");
    console.error("  archive <message-id>");
    console.error("  mark-read <message-id>");
    console.error("  create-task <message-id> [database-id]");
    Deno.exit(1);
  }

  const command = args[0];
  let result;

  switch (command) {
    case "auth":
      result = await authenticate();
      break;

    case "list-unread":
      {
        const maxResults = args[1] ? parseInt(args[1]) : 50;
        result = await listUnread(maxResults);
      }
      break;

    case "list-important":
      {
        const maxResults = args[1] ? parseInt(args[1]) : 50;
        result = await listImportant(maxResults);
      }
      break;

    case "get-email":
      if (args.length < 2) {
        console.error("Error: get-email requires a message ID");
        Deno.exit(1);
      }
      result = await getEmail(args[1]);
      break;

    case "search":
      if (args.length < 2) {
        console.error("Error: search requires a query");
        Deno.exit(1);
      }
      {
        const query = args[1];
        const maxResults = args[2] ? parseInt(args[2]) : 50;
        result = await searchEmails(query, maxResults);
      }
      break;

    case "analyze-priority":
      {
        const maxResults = args[1] ? parseInt(args[1]) : 50;
        result = await analyzePriority(maxResults);
      }
      break;

    case "apply-label":
      if (args.length < 3) {
        console.error("Error: apply-label requires message-id and label");
        Deno.exit(1);
      }
      result = await applyLabel(args[1], args[2]);
      break;

    case "archive":
      if (args.length < 2) {
        console.error("Error: archive requires a message ID");
        Deno.exit(1);
      }
      result = await archiveEmail(args[1]);
      break;

    case "mark-read":
      if (args.length < 2) {
        console.error("Error: mark-read requires a message ID");
        Deno.exit(1);
      }
      result = await markAsRead(args[1]);
      break;

    case "create-task":
      if (args.length < 2) {
        console.error("Error: create-task requires a message ID");
        Deno.exit(1);
      }
      {
        const databaseId = args[2];
        result = await createNotionTask(args[1], databaseId);
      }
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
