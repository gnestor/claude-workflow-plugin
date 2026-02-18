#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Gorgias API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read gorgias-client.ts <command> [args...]
 *
 * Commands:
 *   test-auth                                    - Test API authentication
 *   account-info                                 - Get account details
 *
 *   # Tickets
 *   list-tickets [options]                       - List tickets with filters
 *   get-ticket <id>                              - Get ticket with messages
 *   search-tickets <query>                       - Full-text search in tickets
 *   create-ticket <json>                         - Create new ticket
 *   update-ticket <id> <json>                    - Update ticket
 *   add-message <ticket-id> <json>               - Add reply/internal note
 *
 *   # Messages
 *   list-messages <ticket-id>                    - List messages for ticket
 *   get-message <message-id>                     - Get single message
 *
 *   # Customers
 *   list-customers [--email X] [--limit N]       - List customers
 *   get-customer <id>                            - Get customer details
 *   search-customers <email>                     - Search by email
 *   get-customer-tickets <customer-id>           - Get tickets for customer
 *   update-customer <id> <json>                  - Update customer
 *   merge-customers <json>                       - Merge duplicate customers
 *
 *   # Satisfaction Surveys
 *   list-surveys [--created-after DATE]          - List satisfaction surveys
 *   get-survey <id>                              - Get survey details
 *
 *   # Tags
 *   list-tags                                    - List all tags
 *   create-tag <json>                            - Create tag
 *   delete-tag <id>                              - Delete tag
 *   add-tag-to-ticket <ticket-id> <tag-id>       - Add tag to ticket
 *   remove-tag-from-ticket <ticket-id> <tag-id>  - Remove tag from ticket
 *
 *   # Users & Teams
 *   list-users                                   - List agents/users
 *   get-user <id>                                - Get user details
 *   list-teams                                   - List teams
 *
 *   # Views & Macros
 *   list-views                                   - List saved views
 *   list-macros                                  - List macros
 *   get-macro <id>                               - Get macro details
 *
 *   # Integrations
 *   list-integrations                            - List connected integrations
 */

import "@std/dotenv/load";

// Gorgias API configuration
const GORGIAS_DOMAIN = Deno.env.get("GORGIAS_DOMAIN");
const GORGIAS_EMAIL = Deno.env.get("GORGIAS_EMAIL");
const GORGIAS_API_TOKEN = Deno.env.get("GORGIAS_API_TOKEN");

function getApiBase(): string {
  if (!GORGIAS_DOMAIN) {
    throw new Error(
      "Missing GORGIAS_DOMAIN in .env file. See SKILL.md for setup instructions."
    );
  }
  return `https://${GORGIAS_DOMAIN}.gorgias.com/api`;
}

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

// ==================== API Request Functions ====================

/**
 * Make authenticated request to Gorgias API
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  if (!GORGIAS_EMAIL) {
    throw new Error(
      "Missing GORGIAS_EMAIL in .env file. See SKILL.md for setup instructions."
    );
  }
  if (!GORGIAS_API_TOKEN) {
    throw new Error(
      "Missing GORGIAS_API_TOKEN in .env file. See SKILL.md for setup instructions."
    );
  }

  const API_BASE = getApiBase();
  const url = `${API_BASE}${endpoint}`;
  const auth = btoa(`${GORGIAS_EMAIL}:${GORGIAS_API_TOKEN}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Gorgias API error (${response.status})`;
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
  maxItems?: number
): Promise<unknown[]> {
  const allItems: unknown[] = [];
  let cursor: string | null = null;
  const pageLimit = 30; // Gorgias max is 30

  do {
    const params = new URLSearchParams();
    params.set("limit", String(pageLimit));
    if (cursor) {
      params.set("cursor", cursor);
    }

    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${endpoint}${separator}${params.toString()}`;
    const response = (await apiRequest(url)) as {
      data: unknown[];
      meta?: { next_cursor?: string | null };
    };

    allItems.push(...(response.data || []));
    cursor = response.meta?.next_cursor || null;

    if (maxItems && allItems.length >= maxItems) {
      return allItems.slice(0, maxItems);
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
    await apiRequest("/account");
    return {
      success: true,
      message: "Authentication successful. Gorgias API credentials are valid.",
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get account info
 */
async function getAccountInfo(): Promise<{ success: boolean; account?: unknown; error?: string }> {
  try {
    const data = await apiRequest("/account");
    return {
      success: true,
      account: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Ticket Operations ====================

interface TicketListOptions {
  status?: string;
  channel?: string;
  customerEmail?: string;
  assigneeUserId?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  limit?: number;
  cursor?: string;
}

/**
 * List tickets with filters
 */
async function listTickets(
  options: TicketListOptions = {}
): Promise<{ success: boolean; tickets?: unknown[]; meta?: unknown; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.cursor) params.set("cursor", options.cursor);
    if (options.status) params.set("status", options.status);
    if (options.channel) params.set("channel", options.channel);
    if (options.assigneeUserId) params.set("assignee_user_id", options.assigneeUserId);
    if (options.createdAfter) params.set("created_datetime__gte", options.createdAfter);
    if (options.createdBefore) params.set("created_datetime__lte", options.createdBefore);
    if (options.updatedAfter) params.set("updated_datetime__gte", options.updatedAfter);

    // Customer email filter requires separate lookup
    let endpoint = `/tickets`;
    if (options.customerEmail) {
      // Search for customer first, then filter tickets
      const customerResult = await searchCustomers(options.customerEmail);
      if (customerResult.success && customerResult.customers && customerResult.customers.length > 0) {
        const customerId = (customerResult.customers[0] as { id: number }).id;
        params.set("customer_id", String(customerId));
      }
    }

    const query = params.toString();
    const data = (await apiRequest(`${endpoint}${query ? `?${query}` : ""}`)) as {
      data: unknown[];
      meta?: unknown;
    };

    return {
      success: true,
      tickets: data.data || [],
      meta: data.meta,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get ticket by ID with messages
 */
async function getTicket(
  ticketId: string
): Promise<{ success: boolean; ticket?: unknown; messages?: unknown[]; error?: string }> {
  try {
    const ticket = await apiRequest(`/tickets/${ticketId}`);
    const messagesData = (await apiRequest(`/tickets/${ticketId}/messages`)) as {
      data: unknown[];
    };

    return {
      success: true,
      ticket,
      messages: messagesData.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Search tickets by query (searches subject and excerpt)
 * Note: Gorgias API doesn't have native text search, so this fetches recent tickets
 * and filters client-side. For historical/comprehensive search, use postgresql skill.
 */
async function searchTickets(
  query: string,
  limit?: number
): Promise<{ success: boolean; tickets?: unknown[]; totalSearched?: number; note?: string; error?: string }> {
  try {
    // Fetch recent tickets to search through
    const maxFetch = Math.min((limit || 20) * 10, 100); // Fetch more to find matches
    const params = new URLSearchParams();
    params.set("limit", String(maxFetch));

    const data = (await apiRequest(`/tickets?${params.toString()}`)) as {
      data: Array<{ subject?: string; excerpt?: string; customer?: { email?: string; name?: string } }>;
      meta?: unknown;
    };

    const allTickets = data.data || [];
    const queryLower = query.toLowerCase();

    // Filter tickets by query in subject, excerpt, or customer info
    const matchingTickets = allTickets.filter((ticket) => {
      const subject = (ticket.subject || "").toLowerCase();
      const excerpt = (ticket.excerpt || "").toLowerCase();
      const customerEmail = (ticket.customer?.email || "").toLowerCase();
      const customerName = (ticket.customer?.name || "").toLowerCase();

      return (
        subject.includes(queryLower) ||
        excerpt.includes(queryLower) ||
        customerEmail.includes(queryLower) ||
        customerName.includes(queryLower)
      );
    });

    const resultTickets = limit ? matchingTickets.slice(0, limit) : matchingTickets;

    return {
      success: true,
      tickets: resultTickets,
      totalSearched: allTickets.length,
      note: `Searched ${allTickets.length} recent tickets. For comprehensive historical search, use postgresql skill with gorgias_tickets table.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create ticket
 */
async function createTicket(
  ticketData: Record<string, unknown>
): Promise<{ success: boolean; ticket?: unknown; error?: string }> {
  try {
    const data = await apiRequest("/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    });
    return {
      success: true,
      ticket: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update ticket
 */
async function updateTicket(
  ticketId: string,
  ticketData: Record<string, unknown>
): Promise<{ success: boolean; ticket?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/tickets/${ticketId}`, {
      method: "PUT",
      body: JSON.stringify(ticketData),
    });
    return {
      success: true,
      ticket: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Add message to ticket
 */
async function addMessage(
  ticketId: string,
  messageData: Record<string, unknown>
): Promise<{ success: boolean; message?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify(messageData),
    });
    return {
      success: true,
      message: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Message Operations ====================

/**
 * List messages for a ticket
 */
async function listMessages(
  ticketId: string
): Promise<{ success: boolean; messages?: unknown[]; error?: string }> {
  try {
    const data = (await apiRequest(`/tickets/${ticketId}/messages`)) as {
      data: unknown[];
    };
    return {
      success: true,
      messages: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get message by ID
 */
async function getMessage(
  messageId: string
): Promise<{ success: boolean; message?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/messages/${messageId}`);
    return {
      success: true,
      message: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Customer Operations ====================

interface CustomerListOptions {
  email?: string;
  limit?: number;
  cursor?: string;
}

/**
 * List customers
 */
async function listCustomers(
  options: CustomerListOptions = {}
): Promise<{ success: boolean; customers?: unknown[]; meta?: unknown; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.cursor) params.set("cursor", options.cursor);
    if (options.email) params.set("email", options.email);

    const query = params.toString();
    const data = (await apiRequest(`/customers${query ? `?${query}` : ""}`)) as {
      data: unknown[];
      meta?: unknown;
    };

    return {
      success: true,
      customers: data.data || [],
      meta: data.meta,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get customer by ID
 */
async function getCustomer(
  customerId: string
): Promise<{ success: boolean; customer?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/customers/${customerId}`);
    return {
      success: true,
      customer: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Search customers by email
 */
async function searchCustomers(
  email: string
): Promise<{ success: boolean; customers?: unknown[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.set("email", email);

    const data = (await apiRequest(`/customers?${params.toString()}`)) as {
      data: unknown[];
    };

    return {
      success: true,
      customers: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get tickets for a customer
 */
async function getCustomerTickets(
  customerId: string,
  limit?: number
): Promise<{ success: boolean; tickets?: unknown[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.set("customer_id", customerId);
    if (limit) params.set("limit", String(limit));

    const data = (await apiRequest(`/tickets?${params.toString()}`)) as {
      data: unknown[];
    };

    return {
      success: true,
      tickets: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update customer
 */
async function updateCustomer(
  customerId: string,
  customerData: Record<string, unknown>
): Promise<{ success: boolean; customer?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/customers/${customerId}`, {
      method: "PUT",
      body: JSON.stringify(customerData),
    });
    return {
      success: true,
      customer: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Merge customers
 */
async function mergeCustomers(
  mergeData: { target_customer_id: number; source_customer_ids: number[] }
): Promise<{ success: boolean; customer?: unknown; error?: string }> {
  try {
    const data = await apiRequest("/customers/merge", {
      method: "POST",
      body: JSON.stringify(mergeData),
    });
    return {
      success: true,
      customer: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Satisfaction Survey Operations ====================

interface SurveyListOptions {
  createdAfter?: string;
  limit?: number;
  cursor?: string;
}

/**
 * List satisfaction surveys
 */
async function listSurveys(
  options: SurveyListOptions = {}
): Promise<{ success: boolean; surveys?: unknown[]; meta?: unknown; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.cursor) params.set("cursor", options.cursor);
    if (options.createdAfter) params.set("created_datetime__gte", options.createdAfter);

    const query = params.toString();
    const data = (await apiRequest(`/satisfaction-surveys${query ? `?${query}` : ""}`)) as {
      data: unknown[];
      meta?: unknown;
    };

    return {
      success: true,
      surveys: data.data || [],
      meta: data.meta,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get satisfaction survey by ID
 */
async function getSurvey(
  surveyId: string
): Promise<{ success: boolean; survey?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/satisfaction-surveys/${surveyId}`);
    return {
      success: true,
      survey: data,
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
    const data = await apiRequest("/tags", {
      method: "POST",
      body: JSON.stringify(tagData),
    });
    return {
      success: true,
      tag: data,
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

/**
 * Add tag to ticket
 */
async function addTagToTicket(
  ticketId: string,
  tagId: string
): Promise<{ success: boolean; ticket?: unknown; error?: string }> {
  try {
    // Get current ticket tags
    const ticketData = (await apiRequest(`/tickets/${ticketId}`)) as {
      tags?: { id: number }[];
    };
    const currentTags = (ticketData.tags || []).map((t) => t.id);

    // Add new tag if not already present
    if (!currentTags.includes(Number(tagId))) {
      currentTags.push(Number(tagId));
    }

    // Update ticket with new tags
    const data = await apiRequest(`/tickets/${ticketId}`, {
      method: "PUT",
      body: JSON.stringify({ tags: currentTags.map((id) => ({ id })) }),
    });

    return {
      success: true,
      ticket: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Remove tag from ticket
 */
async function removeTagFromTicket(
  ticketId: string,
  tagId: string
): Promise<{ success: boolean; ticket?: unknown; error?: string }> {
  try {
    // Get current ticket tags
    const ticketData = (await apiRequest(`/tickets/${ticketId}`)) as {
      tags?: { id: number }[];
    };
    const currentTags = (ticketData.tags || [])
      .map((t) => t.id)
      .filter((id) => id !== Number(tagId));

    // Update ticket with filtered tags
    const data = await apiRequest(`/tickets/${ticketId}`, {
      method: "PUT",
      body: JSON.stringify({ tags: currentTags.map((id) => ({ id })) }),
    });

    return {
      success: true,
      ticket: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== User Operations ====================

/**
 * List users
 */
async function listUsers(): Promise<{
  success: boolean;
  users?: unknown[];
  error?: string;
}> {
  try {
    const data = (await apiRequest("/users")) as { data: unknown[] };
    return {
      success: true,
      users: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get user by ID
 */
async function getUser(
  userId: string
): Promise<{ success: boolean; user?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/users/${userId}`);
    return {
      success: true,
      user: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Team Operations ====================

/**
 * List teams
 */
async function listTeams(): Promise<{
  success: boolean;
  teams?: unknown[];
  error?: string;
}> {
  try {
    const data = (await apiRequest("/teams")) as { data: unknown[] };
    return {
      success: true,
      teams: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== View Operations ====================

/**
 * List views
 */
async function listViews(): Promise<{
  success: boolean;
  views?: unknown[];
  error?: string;
}> {
  try {
    const data = (await apiRequest("/views")) as { data: unknown[] };
    return {
      success: true,
      views: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Macro Operations ====================

/**
 * List macros
 */
async function listMacros(): Promise<{
  success: boolean;
  macros?: unknown[];
  error?: string;
}> {
  try {
    const data = (await apiRequest("/macros")) as { data: unknown[] };
    return {
      success: true,
      macros: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get macro by ID
 */
async function getMacro(
  macroId: string
): Promise<{ success: boolean; macro?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/macros/${macroId}`);
    return {
      success: true,
      macro: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Integration Operations ====================

/**
 * List integrations
 */
async function listIntegrations(): Promise<{
  success: boolean;
  integrations?: unknown[];
  error?: string;
}> {
  try {
    const data = (await apiRequest("/integrations")) as { data: unknown[] };
    return {
      success: true,
      integrations: data.data || [],
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

      case "account-info":
        result = await getAccountInfo();
        break;

      // Tickets
      case "list-tickets":
        result = await listTickets({
          status: flags.status,
          channel: flags.channel,
          customerEmail: flags["customer-email"],
          assigneeUserId: flags["assignee-user-id"],
          createdAfter: flags["created-after"],
          createdBefore: flags["created-before"],
          updatedAfter: flags["updated-after"],
          limit: flags.limit ? parseInt(flags.limit) : undefined,
          cursor: flags.cursor,
        });
        break;

      case "get-ticket":
        if (!positional[0]) {
          console.error("Missing ticket ID");
          Deno.exit(1);
        }
        result = await getTicket(positional[0]);
        break;

      case "search-tickets":
        if (!positional[0]) {
          console.error("Missing search query");
          Deno.exit(1);
        }
        result = await searchTickets(
          positional[0],
          flags.limit ? parseInt(flags.limit) : undefined
        );
        break;

      case "create-ticket":
        if (!positional[0]) {
          console.error("Missing ticket JSON");
          Deno.exit(1);
        }
        result = await createTicket(JSON.parse(positional[0]));
        break;

      case "update-ticket":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: update-ticket <id> <json>");
          Deno.exit(1);
        }
        result = await updateTicket(positional[0], JSON.parse(positional[1]));
        break;

      case "add-message":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: add-message <ticket-id> <json>");
          Deno.exit(1);
        }
        result = await addMessage(positional[0], JSON.parse(positional[1]));
        break;

      // Messages
      case "list-messages":
        if (!positional[0]) {
          console.error("Missing ticket ID");
          Deno.exit(1);
        }
        result = await listMessages(positional[0]);
        break;

      case "get-message":
        if (!positional[0]) {
          console.error("Missing message ID");
          Deno.exit(1);
        }
        result = await getMessage(positional[0]);
        break;

      // Customers
      case "list-customers":
        result = await listCustomers({
          email: flags.email,
          limit: flags.limit ? parseInt(flags.limit) : undefined,
          cursor: flags.cursor,
        });
        break;

      case "get-customer":
        if (!positional[0]) {
          console.error("Missing customer ID");
          Deno.exit(1);
        }
        result = await getCustomer(positional[0]);
        break;

      case "search-customers":
        if (!positional[0]) {
          console.error("Missing email");
          Deno.exit(1);
        }
        result = await searchCustomers(positional[0]);
        break;

      case "get-customer-tickets":
        if (!positional[0]) {
          console.error("Missing customer ID");
          Deno.exit(1);
        }
        result = await getCustomerTickets(
          positional[0],
          flags.limit ? parseInt(flags.limit) : undefined
        );
        break;

      case "update-customer":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: update-customer <id> <json>");
          Deno.exit(1);
        }
        result = await updateCustomer(positional[0], JSON.parse(positional[1]));
        break;

      case "merge-customers":
        if (!positional[0]) {
          console.error("Missing merge JSON");
          Deno.exit(1);
        }
        result = await mergeCustomers(JSON.parse(positional[0]));
        break;

      // Satisfaction Surveys
      case "list-surveys":
        result = await listSurveys({
          createdAfter: flags["created-after"],
          limit: flags.limit ? parseInt(flags.limit) : undefined,
          cursor: flags.cursor,
        });
        break;

      case "get-survey":
        if (!positional[0]) {
          console.error("Missing survey ID");
          Deno.exit(1);
        }
        result = await getSurvey(positional[0]);
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

      case "delete-tag":
        if (!positional[0]) {
          console.error("Missing tag ID");
          Deno.exit(1);
        }
        result = await deleteTag(positional[0]);
        break;

      case "add-tag-to-ticket":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: add-tag-to-ticket <ticket-id> <tag-id>");
          Deno.exit(1);
        }
        result = await addTagToTicket(positional[0], positional[1]);
        break;

      case "remove-tag-from-ticket":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: remove-tag-from-ticket <ticket-id> <tag-id>");
          Deno.exit(1);
        }
        result = await removeTagFromTicket(positional[0], positional[1]);
        break;

      // Users
      case "list-users":
        result = await listUsers();
        break;

      case "get-user":
        if (!positional[0]) {
          console.error("Missing user ID");
          Deno.exit(1);
        }
        result = await getUser(positional[0]);
        break;

      // Teams
      case "list-teams":
        result = await listTeams();
        break;

      // Views
      case "list-views":
        result = await listViews();
        break;

      // Macros
      case "list-macros":
        result = await listMacros();
        break;

      case "get-macro":
        if (!positional[0]) {
          console.error("Missing macro ID");
          Deno.exit(1);
        }
        result = await getMacro(positional[0]);
        break;

      // Integrations
      case "list-integrations":
        result = await listIntegrations();
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
