import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "gorgias", version: "1.0.0" });

// ==================== API Helper ====================

async function gorgiasApi(method, path, body) {
  const domain = process.env.GORGIAS_DOMAIN;
  const email = process.env.GORGIAS_EMAIL;
  const token = process.env.GORGIAS_API_TOKEN;

  if (!domain) throw new Error("Missing GORGIAS_DOMAIN environment variable");
  if (!email) throw new Error("Missing GORGIAS_EMAIL environment variable");
  if (!token) throw new Error("Missing GORGIAS_API_TOKEN environment variable");

  const auth = Buffer.from(`${email}:${token}`).toString("base64");

  const res = await fetch(`https://${domain}.gorgias.com/api${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Gorgias API error (${res.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) errorMessage += `: ${errorJson.message}`;
      else if (errorJson.error) errorMessage += `: ${errorJson.error}`;
    } catch {
      errorMessage += `: ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const text = await res.text();
  if (!text) return { success: true };
  return JSON.parse(text);
}

function result(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(error) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { error: error instanceof Error ? error.message : String(error) },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}

// ==================== Auth Tools ====================

server.tool("test_auth", "Test Gorgias API authentication", {}, async () => {
  try {
    await gorgiasApi("GET", "/account");
    return result({
      success: true,
      message: "Authentication successful. Gorgias API credentials are valid.",
    });
  } catch (error) {
    return errorResult(error);
  }
});

server.tool(
  "get_account_info",
  "Get Gorgias account details",
  {},
  async () => {
    try {
      const data = await gorgiasApi("GET", "/account");
      return result({ success: true, account: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ==================== Ticket Tools ====================

server.tool(
  "list_tickets",
  "List tickets with optional filters for status, channel, customer email, assignee, and date ranges",
  {
    status: z
      .string()
      .optional()
      .describe("Filter by status (open, closed)"),
    channel: z
      .string()
      .optional()
      .describe(
        "Filter by channel (email, chat, instagram-direct-message, etc.)"
      ),
    customer_email: z
      .string()
      .optional()
      .describe("Filter by customer email address"),
    assignee_user_id: z
      .string()
      .optional()
      .describe("Filter by assigned agent user ID"),
    created_after: z
      .string()
      .optional()
      .describe("Filter tickets created after this date (ISO format)"),
    created_before: z
      .string()
      .optional()
      .describe("Filter tickets created before this date (ISO format)"),
    updated_after: z
      .string()
      .optional()
      .describe("Filter tickets updated after this date (ISO format)"),
    limit: z
      .number()
      .optional()
      .describe("Max results per page (default 30, max 30)"),
    cursor: z.string().optional().describe("Pagination cursor for next page"),
  },
  async (params) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.set("limit", String(params.limit));
      if (params.cursor) searchParams.set("cursor", params.cursor);
      if (params.status) searchParams.set("status", params.status);
      if (params.channel) searchParams.set("channel", params.channel);
      if (params.assignee_user_id)
        searchParams.set("assignee_user_id", params.assignee_user_id);
      if (params.created_after)
        searchParams.set("created_datetime__gte", params.created_after);
      if (params.created_before)
        searchParams.set("created_datetime__lte", params.created_before);
      if (params.updated_after)
        searchParams.set("updated_datetime__gte", params.updated_after);

      // Customer email filter requires looking up customer first
      if (params.customer_email) {
        const customerData = await gorgiasApi(
          "GET",
          `/customers?email=${encodeURIComponent(params.customer_email)}`
        );
        if (customerData.data && customerData.data.length > 0) {
          searchParams.set("customer_id", String(customerData.data[0].id));
        }
      }

      const query = searchParams.toString();
      const data = await gorgiasApi(
        "GET",
        `/tickets${query ? `?${query}` : ""}`
      );
      return result({
        success: true,
        tickets: data.data || [],
        meta: data.meta,
      });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "get_ticket",
  "Get a ticket by ID including its messages",
  {
    ticket_id: z.string().describe("The ticket ID"),
  },
  async ({ ticket_id }) => {
    try {
      const ticket = await gorgiasApi("GET", `/tickets/${ticket_id}`);
      const messagesData = await gorgiasApi(
        "GET",
        `/tickets/${ticket_id}/messages`
      );
      return result({
        success: true,
        ticket,
        messages: messagesData.data || [],
      });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "search_tickets",
  "Search recent tickets by keyword in subject, excerpt, or customer info. For comprehensive historical search, use the postgresql skill.",
  {
    query: z.string().describe("Search query string"),
    limit: z
      .number()
      .optional()
      .describe("Max number of matching results to return (default 20)"),
  },
  async ({ query, limit }) => {
    try {
      const maxFetch = Math.min((limit || 20) * 10, 100);
      const data = await gorgiasApi("GET", `/tickets?limit=${maxFetch}`);
      const allTickets = data.data || [];
      const queryLower = query.toLowerCase();

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

      const resultTickets = limit
        ? matchingTickets.slice(0, limit)
        : matchingTickets;

      return result({
        success: true,
        tickets: resultTickets,
        total_searched: allTickets.length,
        note: `Searched ${allTickets.length} recent tickets. For comprehensive historical search, use postgresql skill with gorgias_tickets table.`,
      });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "create_ticket",
  "Create a new support ticket",
  {
    channel: z
      .string()
      .optional()
      .describe("Channel (email, chat, etc.)"),
    subject: z.string().optional().describe("Ticket subject"),
    messages: z
      .array(
        z.object({
          body_text: z.string().optional().describe("Plain text body"),
          body_html: z.string().optional().describe("HTML body"),
          from_agent: z.boolean().optional().describe("Whether from agent"),
          channel: z.string().optional().describe("Message channel"),
          via: z.string().optional().describe("Message source"),
          sender: z
            .object({
              email: z.string().optional(),
              name: z.string().optional(),
            })
            .optional()
            .describe("Sender info"),
          receiver: z
            .object({
              email: z.string().optional(),
              name: z.string().optional(),
            })
            .optional()
            .describe("Receiver info"),
        })
      )
      .optional()
      .describe("Initial messages"),
    customer: z
      .object({
        id: z.number().optional(),
        email: z.string().optional(),
        name: z.string().optional(),
      })
      .optional()
      .describe("Customer info"),
    assignee_user: z
      .object({ id: z.number() })
      .optional()
      .describe("Assigned agent"),
    tags: z
      .array(z.object({ id: z.number() }))
      .optional()
      .describe("Tags to apply"),
    status: z.string().optional().describe("Ticket status"),
  },
  async (params) => {
    try {
      const data = await gorgiasApi("POST", "/tickets", params);
      return result({ success: true, ticket: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "update_ticket",
  "Update a ticket (status, assignee, tags, subject, etc.)",
  {
    ticket_id: z.string().describe("The ticket ID to update"),
    status: z.string().optional().describe("New status (open, closed)"),
    assignee_user: z
      .object({ id: z.number() })
      .optional()
      .describe("New assigned agent"),
    subject: z.string().optional().describe("New subject"),
    tags: z
      .array(z.object({ id: z.number() }))
      .optional()
      .describe("Replace all tags"),
    priority: z.string().optional().describe("Priority level"),
    spam: z.boolean().optional().describe("Mark as spam"),
  },
  async ({ ticket_id, ...updateData }) => {
    try {
      const data = await gorgiasApi("PUT", `/tickets/${ticket_id}`, updateData);
      return result({ success: true, ticket: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "add_message",
  "Add a reply or internal note to a ticket",
  {
    ticket_id: z.string().describe("The ticket ID"),
    body_text: z.string().optional().describe("Plain text message body"),
    body_html: z.string().optional().describe("HTML message body"),
    from_agent: z
      .boolean()
      .optional()
      .describe("Whether message is from agent (true) or customer (false)"),
    channel: z
      .string()
      .optional()
      .describe("Message channel (email, internal-note, etc.)"),
    via: z
      .string()
      .optional()
      .describe("Message source (helpdesk, api, etc.)"),
    sender: z
      .object({
        email: z.string().optional(),
        name: z.string().optional(),
      })
      .optional()
      .describe("Sender info"),
    receiver: z
      .object({
        email: z.string().optional(),
        name: z.string().optional(),
      })
      .optional()
      .describe("Receiver info"),
  },
  async ({ ticket_id, ...messageData }) => {
    try {
      const data = await gorgiasApi(
        "POST",
        `/tickets/${ticket_id}/messages`,
        messageData
      );
      return result({ success: true, message: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ==================== Message Tools ====================

server.tool(
  "list_messages",
  "List all messages for a ticket",
  {
    ticket_id: z.string().describe("The ticket ID"),
  },
  async ({ ticket_id }) => {
    try {
      const data = await gorgiasApi(
        "GET",
        `/tickets/${ticket_id}/messages`
      );
      return result({ success: true, messages: data.data || [] });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "get_message",
  "Get a single message by ID",
  {
    message_id: z.string().describe("The message ID"),
  },
  async ({ message_id }) => {
    try {
      const data = await gorgiasApi("GET", `/messages/${message_id}`);
      return result({ success: true, message: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ==================== Customer Tools ====================

server.tool(
  "list_customers",
  "List customers with optional email filter",
  {
    email: z.string().optional().describe("Filter by email address"),
    limit: z.number().optional().describe("Max results"),
    cursor: z.string().optional().describe("Pagination cursor"),
  },
  async (params) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.set("limit", String(params.limit));
      if (params.cursor) searchParams.set("cursor", params.cursor);
      if (params.email) searchParams.set("email", params.email);

      const query = searchParams.toString();
      const data = await gorgiasApi(
        "GET",
        `/customers${query ? `?${query}` : ""}`
      );
      return result({
        success: true,
        customers: data.data || [],
        meta: data.meta,
      });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "get_customer",
  "Get customer details by ID",
  {
    customer_id: z.string().describe("The customer ID"),
  },
  async ({ customer_id }) => {
    try {
      const data = await gorgiasApi("GET", `/customers/${customer_id}`);
      return result({ success: true, customer: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "search_customers",
  "Search customers by email address",
  {
    email: z.string().describe("Email address to search for"),
  },
  async ({ email }) => {
    try {
      const data = await gorgiasApi(
        "GET",
        `/customers?email=${encodeURIComponent(email)}`
      );
      return result({ success: true, customers: data.data || [] });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "get_customer_tickets",
  "Get all tickets for a specific customer",
  {
    customer_id: z.string().describe("The customer ID"),
    limit: z.number().optional().describe("Max results"),
  },
  async ({ customer_id, limit }) => {
    try {
      const searchParams = new URLSearchParams();
      searchParams.set("customer_id", customer_id);
      if (limit) searchParams.set("limit", String(limit));

      const data = await gorgiasApi(
        "GET",
        `/tickets?${searchParams.toString()}`
      );
      return result({ success: true, tickets: data.data || [] });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "update_customer",
  "Update customer details",
  {
    customer_id: z.string().describe("The customer ID to update"),
    name: z.string().optional().describe("Customer name"),
    email: z.string().optional().describe("Customer email"),
    note: z.string().optional().describe("Internal note about customer"),
    language: z.string().optional().describe("Customer language"),
    timezone: z.string().optional().describe("Customer timezone"),
    external_id: z.string().optional().describe("External system ID"),
  },
  async ({ customer_id, ...customerData }) => {
    try {
      // Remove undefined fields
      const cleanData = Object.fromEntries(
        Object.entries(customerData).filter(([, v]) => v !== undefined)
      );
      const data = await gorgiasApi(
        "PUT",
        `/customers/${customer_id}`,
        cleanData
      );
      return result({ success: true, customer: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "merge_customers",
  "Merge duplicate customers into a target customer",
  {
    target_customer_id: z
      .number()
      .describe("The customer ID to keep (merge target)"),
    source_customer_ids: z
      .array(z.number())
      .describe("Array of customer IDs to merge into the target"),
  },
  async (params) => {
    try {
      const data = await gorgiasApi("POST", "/customers/merge", params);
      return result({ success: true, customer: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ==================== Satisfaction Survey Tools ====================

server.tool(
  "list_surveys",
  "List satisfaction surveys with optional date filter",
  {
    created_after: z
      .string()
      .optional()
      .describe("Filter surveys created after this date (ISO format)"),
    limit: z.number().optional().describe("Max results"),
    cursor: z.string().optional().describe("Pagination cursor"),
  },
  async (params) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.set("limit", String(params.limit));
      if (params.cursor) searchParams.set("cursor", params.cursor);
      if (params.created_after)
        searchParams.set("created_datetime__gte", params.created_after);

      const query = searchParams.toString();
      const data = await gorgiasApi(
        "GET",
        `/satisfaction-surveys${query ? `?${query}` : ""}`
      );
      return result({
        success: true,
        surveys: data.data || [],
        meta: data.meta,
      });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "get_survey",
  "Get satisfaction survey details by ID",
  {
    survey_id: z.string().describe("The survey ID"),
  },
  async ({ survey_id }) => {
    try {
      const data = await gorgiasApi(
        "GET",
        `/satisfaction-surveys/${survey_id}`
      );
      return result({ success: true, survey: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ==================== Tag Tools ====================

server.tool("list_tags", "List all tags", {}, async () => {
  try {
    const data = await gorgiasApi("GET", "/tags");
    return result({ success: true, tags: data.data || [] });
  } catch (error) {
    return errorResult(error);
  }
});

server.tool(
  "create_tag",
  "Create a new tag",
  {
    name: z.string().describe("Tag name"),
    decoration: z
      .object({
        color: z.string().optional().describe("Tag color hex code"),
      })
      .optional()
      .describe("Tag decoration options"),
  },
  async (params) => {
    try {
      const data = await gorgiasApi("POST", "/tags", params);
      return result({ success: true, tag: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "delete_tag",
  "Delete a tag by ID",
  {
    tag_id: z.string().describe("The tag ID to delete"),
  },
  async ({ tag_id }) => {
    try {
      await gorgiasApi("DELETE", `/tags/${tag_id}`);
      return result({
        success: true,
        message: `Tag ${tag_id} deleted successfully.`,
      });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "add_tag_to_ticket",
  "Add a tag to a ticket (preserves existing tags)",
  {
    ticket_id: z.string().describe("The ticket ID"),
    tag_id: z.string().describe("The tag ID to add"),
  },
  async ({ ticket_id, tag_id }) => {
    try {
      // Get current ticket tags
      const ticketData = await gorgiasApi("GET", `/tickets/${ticket_id}`);
      const currentTags = (ticketData.tags || []).map((t) => t.id);

      // Add new tag if not already present
      if (!currentTags.includes(Number(tag_id))) {
        currentTags.push(Number(tag_id));
      }

      // Update ticket with new tags
      const data = await gorgiasApi("PUT", `/tickets/${ticket_id}`, {
        tags: currentTags.map((id) => ({ id })),
      });
      return result({ success: true, ticket: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "remove_tag_from_ticket",
  "Remove a tag from a ticket (preserves other tags)",
  {
    ticket_id: z.string().describe("The ticket ID"),
    tag_id: z.string().describe("The tag ID to remove"),
  },
  async ({ ticket_id, tag_id }) => {
    try {
      // Get current ticket tags
      const ticketData = await gorgiasApi("GET", `/tickets/${ticket_id}`);
      const currentTags = (ticketData.tags || [])
        .map((t) => t.id)
        .filter((id) => id !== Number(tag_id));

      // Update ticket with filtered tags
      const data = await gorgiasApi("PUT", `/tickets/${ticket_id}`, {
        tags: currentTags.map((id) => ({ id })),
      });
      return result({ success: true, ticket: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ==================== User Tools ====================

server.tool("list_users", "List all agents/users", {}, async () => {
  try {
    const data = await gorgiasApi("GET", "/users");
    return result({ success: true, users: data.data || [] });
  } catch (error) {
    return errorResult(error);
  }
});

server.tool(
  "get_user",
  "Get user/agent details by ID",
  {
    user_id: z.string().describe("The user ID"),
  },
  async ({ user_id }) => {
    try {
      const data = await gorgiasApi("GET", `/users/${user_id}`);
      return result({ success: true, user: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ==================== Team Tools ====================

server.tool("list_teams", "List all teams", {}, async () => {
  try {
    const data = await gorgiasApi("GET", "/teams");
    return result({ success: true, teams: data.data || [] });
  } catch (error) {
    return errorResult(error);
  }
});

// ==================== View Tools ====================

server.tool("list_views", "List all saved views", {}, async () => {
  try {
    const data = await gorgiasApi("GET", "/views");
    return result({ success: true, views: data.data || [] });
  } catch (error) {
    return errorResult(error);
  }
});

// ==================== Macro Tools ====================

server.tool("list_macros", "List all macros", {}, async () => {
  try {
    const data = await gorgiasApi("GET", "/macros");
    return result({ success: true, macros: data.data || [] });
  } catch (error) {
    return errorResult(error);
  }
});

server.tool(
  "get_macro",
  "Get macro details by ID",
  {
    macro_id: z.string().describe("The macro ID"),
  },
  async ({ macro_id }) => {
    try {
      const data = await gorgiasApi("GET", `/macros/${macro_id}`);
      return result({ success: true, macro: data });
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ==================== Integration Tools ====================

server.tool(
  "list_integrations",
  "List all connected integrations",
  {},
  async () => {
    try {
      const data = await gorgiasApi("GET", "/integrations");
      return result({ success: true, integrations: data.data || [] });
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ==================== Start Server ====================

const transport = new StdioServerTransport();
await server.connect(transport);
