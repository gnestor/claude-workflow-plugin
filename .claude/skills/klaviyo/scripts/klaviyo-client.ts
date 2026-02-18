#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Klaviyo API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read klaviyo-client.ts <command> [args...]
 *
 * Commands:
 *   account-info                              - Get account details
 *   list-campaigns <channel>                  - List campaigns (email|sms|mobile_push)
 *   get-campaign <id>                         - Get campaign details
 *   create-campaign <json>                    - Create campaign
 *   campaign-report <id> [stats]              - Get campaign performance report
 *   list-flows                                - List flows
 *   get-flow <id>                             - Get flow details
 *   flow-report <id> [stats]                  - Get flow performance report
 *   list-metrics                              - List all metrics
 *   get-metric <id>                           - Get metric details
 *   metric-aggregates <json>                  - Query metric aggregates
 *   list-lists                                - List subscriber lists
 *   get-list <id>                             - Get list details
 *   list-segments                             - List segments
 *   get-segment <id>                          - Get segment details
 *   list-profiles [filter]                    - List profiles
 *   get-profile <id>                          - Get profile by ID
 *   create-profile <json>                     - Create profile
 *   subscribe <list-id> <json>                - Subscribe to list
 *   unsubscribe <list-id> <json>              - Unsubscribe from list
 *   list-events [filter]                      - List events
 *   create-event <json>                       - Create/track event
 *   get-campaign-messages <campaign-id>       - Get messages for a campaign
 *   get-message-template <message-id>         - Get template ID from message
 *   get-template-html <template-id>           - Get template HTML content
 *   list-templates                            - List email templates
 *   get-template <id>                         - Get template details
 *   create-template <json>                    - Create email template
 */

import "@std/dotenv/load";

// Klaviyo API configuration
const KLAVIYO_API_KEY = Deno.env.get("KLAVIYO_PRIVATE_KEY");
const API_BASE = "https://a.klaviyo.com/api";
const API_REVISION = "2024-10-15";

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
 * Make authenticated request to Klaviyo API
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  if (!KLAVIYO_API_KEY) {
    throw new Error(
      "Missing KLAVIYO_PRIVATE_KEY in .env file. See SKILL.md for setup instructions."
    );
  }

  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      revision: API_REVISION,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Klaviyo API error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.errors && errorJson.errors.length > 0) {
        errorMessage += `: ${errorJson.errors.map((e: { detail?: string }) => e.detail).join(", ")}`;
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

// ==================== Account Operations ====================

/**
 * Get account info
 */
async function getAccountInfo(): Promise<{ success: boolean; account?: unknown; error?: string }> {
  try {
    const data = await apiRequest("/accounts");
    return {
      success: true,
      account: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Campaign Operations ====================

/**
 * List campaigns by channel
 */
async function listCampaigns(
  channel: "email" | "sms" | "mobile_push"
): Promise<{ success: boolean; campaigns?: unknown[]; error?: string }> {
  try {
    const filter = encodeURIComponent(`equals(messages.channel,'${channel}')`);
    const data = await apiRequest(`/campaigns?filter=${filter}`) as { data: unknown[] };
    return {
      success: true,
      campaigns: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get campaign by ID
 */
async function getCampaign(id: string): Promise<{ success: boolean; campaign?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/campaigns/${id}`) as { data: unknown };
    return {
      success: true,
      campaign: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create campaign with message
 * Creates a campaign with a message (template must be assigned separately)
 */
async function createCampaign(
  campaignData: {
    name: string;
    subject: string;
    preview_text?: string;
    from_email?: string;
    from_label?: string;
    audiences?: { included?: string[]; excluded?: string[] };
    send_strategy?: { method?: string; options_static?: { datetime?: string } };
  }
): Promise<{ success: boolean; campaign?: unknown; campaignId?: string; messageId?: string; error?: string }> {
  try {
    // For draft campaigns, use method="static" with a future datetime
    // The datetime can be updated later before sending
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now as placeholder

    const payload = {
      data: {
        type: "campaign",
        attributes: {
          name: campaignData.name,
          audiences: campaignData.audiences || { included: [], excluded: [] },
          send_options: {
            use_smart_sending: false,  // Disable smart sending by default
            ignore_unsubscribes: false,
          },
          send_strategy: campaignData.send_strategy || {
            method: "static",
            options_static: {
              datetime: futureDate.toISOString(),
            },
          },
          "campaign-messages": {
            data: [
              {
                type: "campaign-message",
                attributes: {
                  channel: "email",
                  label: "Email 1",
                  content: {
                    subject: campaignData.subject,
                    preview_text: campaignData.preview_text || "",
                    from_email: campaignData.from_email || "news@your-company.com",
                    from_label: campaignData.from_label || "Your Company",
                  },
                },
              },
            ],
          },
        },
      },
    };

    const data = await apiRequest("/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    }) as { data: { id: string; relationships?: { "campaign-messages"?: { data?: Array<{ id: string }> } } } };

    // Extract campaign ID and message ID from response
    const campaignId = data.data?.id;
    const messageId = data.data?.relationships?.["campaign-messages"]?.data?.[0]?.id;

    return {
      success: true,
      campaign: data.data,
      campaignId,
      messageId,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get campaign performance report
 * Note: Requires conversion_metric_id (e.g., "Placed Order" metric ID: QYEYTD)
 */
async function getCampaignReport(
  campaignId: string,
  options?: {
    statistics?: string[];
    conversionMetricId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ success: boolean; report?: unknown; error?: string }> {
  try {
    // Default statistics that are valid for campaign-values-report
    // See: https://developers.klaviyo.com/en/reference/query_campaign_values
    const defaultStats = [
      "average_order_value",
      "bounce_rate",
      "bounced",
      "click_rate",
      "click_to_open_rate",
      "clicks",
      "clicks_unique",
      "conversion_rate",
      "conversion_uniques",
      "conversion_value",
      "conversions",
      "delivered",
      "delivery_rate",
      "open_rate",
      "opens",
      "opens_unique",
      "recipients",
      "spam_complaint_rate",
      "spam_complaints",
      "unsubscribe_rate",
      "unsubscribe_uniques",
      "unsubscribes",
    ];

    const stats = options?.statistics || defaultStats;

    // Default to Placed Order metric if not specified
    const conversionMetricId = options?.conversionMetricId || "QYEYTD";

    // Default timeframe: last 30 days if not specified
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = options?.startDate || thirtyDaysAgo.toISOString();
    const endDate = options?.endDate || now.toISOString();

    const payload = {
      data: {
        type: "campaign-values-report",
        attributes: {
          statistics: stats,
          timeframe: {
            start: startDate,
            end: endDate,
          },
          conversion_metric_id: conversionMetricId,
          filter: `equals(campaign_id,'${campaignId}')`,
        },
      },
    };

    const data = await apiRequest("/campaign-values-reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      report: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Flow Operations ====================

/**
 * List flows
 */
async function listFlows(): Promise<{ success: boolean; flows?: unknown[]; error?: string }> {
  try {
    const data = await apiRequest("/flows") as { data: unknown[] };
    return {
      success: true,
      flows: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get flow by ID
 */
async function getFlow(id: string): Promise<{ success: boolean; flow?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/flows/${id}`) as { data: unknown };
    return {
      success: true,
      flow: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get flow performance report
 */
async function getFlowReport(
  flowId: string,
  statistics?: string[]
): Promise<{ success: boolean; report?: unknown; error?: string }> {
  try {
    const defaultStats = [
      "opens",
      "open_rate",
      "clicks",
      "click_rate",
      "unsubscribes",
      "bounces",
      "delivered",
      "recipients",
      "revenue",
      "conversion_rate",
    ];

    const stats = statistics || defaultStats;

    const payload = {
      data: {
        type: "flow-values-report",
        attributes: {
          statistics: stats,
          filter: `equals(flow_id,'${flowId}')`,
        },
      },
    };

    const data = await apiRequest("/flow-values-reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      report: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Metric Operations ====================

/**
 * List all metrics
 */
async function listMetrics(): Promise<{ success: boolean; metrics?: unknown[]; error?: string }> {
  try {
    const data = await apiRequest("/metrics") as { data: unknown[] };
    return {
      success: true,
      metrics: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get metric by ID
 */
async function getMetric(id: string): Promise<{ success: boolean; metric?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/metrics/${id}`) as { data: unknown };
    return {
      success: true,
      metric: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Query metric aggregates
 */
async function queryMetricAggregates(
  params: {
    metric_id: string;
    measurements: string[];
    interval?: string;
    filter?: string[];
    timezone?: string;
    page_size?: number;
    by?: string[];
    sort?: string;
  }
): Promise<{ success: boolean; aggregates?: unknown; error?: string }> {
  try {
    const payload = {
      data: {
        type: "metric-aggregate",
        attributes: {
          metric_id: params.metric_id,
          measurements: params.measurements,
          interval: params.interval || "day",
          filter: params.filter || [],
          timezone: params.timezone || "UTC",
          page_size: params.page_size || 500,
          by: params.by,
          sort: params.sort,
        },
      },
    };

    const data = await apiRequest("/metric-aggregates", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      aggregates: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== List & Segment Operations ====================

/**
 * List subscriber lists
 */
async function listLists(): Promise<{ success: boolean; lists?: unknown[]; error?: string }> {
  try {
    const data = await apiRequest("/lists") as { data: unknown[] };
    return {
      success: true,
      lists: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get list by ID
 */
async function getList(id: string): Promise<{ success: boolean; list?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/lists/${id}`) as { data: unknown };
    return {
      success: true,
      list: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * List segments
 */
async function listSegments(): Promise<{ success: boolean; segments?: unknown[]; error?: string }> {
  try {
    const data = await apiRequest("/segments") as { data: unknown[] };
    return {
      success: true,
      segments: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get segment by ID
 */
async function getSegment(id: string): Promise<{ success: boolean; segment?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/segments/${id}`) as { data: unknown };
    return {
      success: true,
      segment: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Profile Operations ====================

/**
 * List profiles
 */
async function listProfiles(
  filter?: string
): Promise<{ success: boolean; profiles?: unknown[]; error?: string }> {
  try {
    let endpoint = "/profiles";
    if (filter) {
      endpoint += `?filter=${encodeURIComponent(filter)}`;
    }
    const data = await apiRequest(endpoint) as { data: unknown[] };
    return {
      success: true,
      profiles: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get profile by ID
 */
async function getProfile(id: string): Promise<{ success: boolean; profile?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/profiles/${id}`) as { data: unknown };
    return {
      success: true,
      profile: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create profile
 */
async function createProfile(
  profileData: {
    email?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    properties?: Record<string, unknown>;
  }
): Promise<{ success: boolean; profile?: unknown; error?: string }> {
  try {
    const payload = {
      data: {
        type: "profile",
        attributes: profileData,
      },
    };

    const data = await apiRequest("/profiles", {
      method: "POST",
      body: JSON.stringify(payload),
    }) as { data: unknown };

    return {
      success: true,
      profile: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Subscribe profile to list
 */
async function subscribeToList(
  listId: string,
  profileData: {
    email?: string;
    phone_number?: string;
  }
): Promise<{ success: boolean; subscription?: unknown; error?: string }> {
  try {
    const payload = {
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          profiles: {
            data: [
              {
                type: "profile",
                attributes: profileData,
              },
            ],
          },
        },
        relationships: {
          list: {
            data: {
              type: "list",
              id: listId,
            },
          },
        },
      },
    };

    const data = await apiRequest("/profile-subscription-bulk-create-jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      subscription: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Unsubscribe profile from list
 */
async function unsubscribeFromList(
  listId: string,
  profileData: {
    email?: string;
    phone_number?: string;
  }
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    const payload = {
      data: {
        type: "profile-subscription-bulk-delete-job",
        attributes: {
          profiles: {
            data: [
              {
                type: "profile",
                attributes: profileData,
              },
            ],
          },
        },
        relationships: {
          list: {
            data: {
              type: "list",
              id: listId,
            },
          },
        },
      },
    };

    const data = await apiRequest("/profile-subscription-bulk-delete-jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      result: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Event Operations ====================

/**
 * List events
 */
async function listEvents(
  filter?: string
): Promise<{ success: boolean; events?: unknown[]; error?: string }> {
  try {
    let endpoint = "/events";
    if (filter) {
      endpoint += `?filter=${encodeURIComponent(filter)}`;
    }
    const data = await apiRequest(endpoint) as { data: unknown[] };
    return {
      success: true,
      events: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create/track event
 */
async function createEvent(
  eventData: {
    metric_name: string;
    profile: { email?: string; phone_number?: string };
    properties?: Record<string, unknown>;
    value?: number;
    time?: string;
    unique_id?: string;
  }
): Promise<{ success: boolean; event?: unknown; error?: string }> {
  try {
    const payload = {
      data: {
        type: "event",
        attributes: {
          metric: {
            data: {
              type: "metric",
              attributes: {
                name: eventData.metric_name,
              },
            },
          },
          profile: {
            data: {
              type: "profile",
              attributes: eventData.profile,
            },
          },
          properties: eventData.properties || {},
          value: eventData.value,
          time: eventData.time,
          unique_id: eventData.unique_id,
        },
      },
    };

    const data = await apiRequest("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      event: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Campaign Message Operations ====================

/**
 * Get campaign messages (to find template ID)
 */
async function getCampaignMessages(
  campaignId: string
): Promise<{ success: boolean; messages?: unknown[]; error?: string }> {
  try {
    const data = await apiRequest(`/campaigns/${campaignId}/campaign-messages`) as { data: unknown[] };
    return {
      success: true,
      messages: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get campaign message with template included
 */
async function getMessageTemplate(
  messageId: string
): Promise<{ success: boolean; message?: unknown; templateId?: string; error?: string }> {
  try {
    const data = await apiRequest(`/campaign-messages/${messageId}?include=template`) as {
      data: { relationships?: { template?: { data?: { id?: string } } } };
      included?: Array<{ type: string; id: string }>;
    };

    // Get template ID from relationships or included
    let templateId: string | undefined;
    if (data.data?.relationships?.template?.data?.id) {
      templateId = data.data.relationships.template.data.id;
    } else if (data.included) {
      const template = data.included.find((inc) => inc.type === "template");
      if (template) {
        templateId = template.id;
      }
    }

    return {
      success: true,
      message: data.data,
      templateId,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get template HTML content
 */
async function getTemplateHtml(
  templateId: string
): Promise<{ success: boolean; html?: string; previewText?: string; error?: string }> {
  try {
    const data = await apiRequest(`/templates/${templateId}`) as {
      data: { attributes?: { html?: string; text?: string } };
    };
    return {
      success: true,
      html: data.data?.attributes?.html || "",
      previewText: data.data?.attributes?.text || "",
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Assign template to campaign message
 * Uses the campaign-message-assign-template action endpoint
 */
async function assignTemplateToMessage(
  messageId: string,
  templateId: string
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    const payload = {
      data: {
        type: "campaign-message",
        id: messageId,
        relationships: {
          template: {
            data: {
              type: "template",
              id: templateId,
            },
          },
        },
      },
    };

    const data = await apiRequest("/campaign-message-assign-template/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      result: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update campaign message (subject, preview text, etc.)
 */
async function updateCampaignMessage(
  messageId: string,
  updates: {
    label?: string;
    subject?: string;
    preview_text?: string;
    from_email?: string;
    from_label?: string;
    reply_to_email?: string;
  }
): Promise<{ success: boolean; message?: unknown; error?: string }> {
  try {
    const payload = {
      data: {
        type: "campaign-message",
        id: messageId,
        attributes: {
          label: updates.label || "Email",
          content: {
            subject: updates.subject,
            preview_text: updates.preview_text,
            from_email: updates.from_email || "news@your-company.com",
            from_label: updates.from_label || "Your Company",
            reply_to_email: updates.reply_to_email,
          },
        },
      },
    };

    const data = await apiRequest(`/campaign-messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }) as { data: unknown };

    return {
      success: true,
      message: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Template Operations ====================

/**
 * List email templates
 */
async function listTemplates(): Promise<{ success: boolean; templates?: unknown[]; error?: string }> {
  try {
    const data = await apiRequest("/templates") as { data: unknown[] };
    return {
      success: true,
      templates: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get template by ID
 */
async function getTemplate(id: string): Promise<{ success: boolean; template?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/templates/${id}`) as { data: unknown };
    return {
      success: true,
      template: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create email template
 */
async function createTemplate(
  templateData: {
    name: string;
    html?: string;
    text?: string;
    editor_type?: "CODE" | "USER_DRAGGABLE";
  }
): Promise<{ success: boolean; template?: unknown; error?: string }> {
  try {
    const payload = {
      data: {
        type: "template",
        attributes: {
          name: templateData.name,
          editor_type: templateData.editor_type ?? "USER_DRAGGABLE",
          html: templateData.html || "",
          text: templateData.text || "",
        },
      },
    };

    const data = await apiRequest("/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    }) as { data: unknown };

    return {
      success: true,
      template: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Image Operations ====================

/**
 * Encode Uint8Array to base64 using standard library
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  // Process in chunks to avoid stack overflow
  const CHUNK_SIZE = 0x8000; // 32KB chunks
  let result = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    result += String.fromCharCode.apply(null, [...chunk]);
  }
  return btoa(result);
}

/**
 * Upload image from file
 */
async function uploadImageFromFile(
  filePath: string,
  name?: string
): Promise<{ success: boolean; image?: unknown; url?: string; error?: string }> {
  if (!KLAVIYO_API_KEY) {
    throw new Error(
      "Missing KLAVIYO_PRIVATE_KEY in .env file. See SKILL.md for setup instructions."
    );
  }

  try {
    // Read file and convert to base64
    const fileData = await Deno.readFile(filePath);
    const base64Data = uint8ArrayToBase64(fileData);

    // Determine mime type from extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'gif') mimeType = 'image/gif';

    // Create data URI
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    // Default name to filename if not provided
    const imageName = name || filePath.split('/').pop() || 'image';

    const payload = {
      data: {
        type: "image",
        attributes: {
          name: imageName,
          import_from_url: dataUri,
        },
      },
    };

    const url = `${API_BASE}/images`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        revision: API_REVISION,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Klaviyo API error (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorMessage += `: ${errorJson.errors.map((e: { detail?: string }) => e.detail).join(", ")}`;
        }
      } catch {
        errorMessage += `: ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as {
      data: {
        id: string;
        attributes?: {
          image_url?: string;
          name?: string;
        };
      };
    };

    return {
      success: true,
      image: data.data,
      url: data.data?.attributes?.image_url,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== CLI Handler ====================

async function main() {
  const args = Deno.args;
  const command = args[0];

  if (!command) {
    console.error("Usage: klaviyo-client.ts <command> [args...]");
    console.error("\nCommands:");
    console.error("  account-info                              - Get account details");
    console.error("  list-campaigns <channel>                  - List campaigns (email|sms|mobile_push)");
    console.error("  get-campaign <id>                         - Get campaign details");
    console.error("  create-campaign <json>                    - Create campaign");
    console.error("  campaign-report <id> [stats]              - Get campaign performance report");
    console.error("  list-flows                                - List flows");
    console.error("  get-flow <id>                             - Get flow details");
    console.error("  flow-report <id> [stats]                  - Get flow performance report");
    console.error("  list-metrics                              - List all metrics");
    console.error("  get-metric <id>                           - Get metric details");
    console.error("  metric-aggregates <json>                  - Query metric aggregates");
    console.error("  list-lists                                - List subscriber lists");
    console.error("  get-list <id>                             - Get list details");
    console.error("  list-segments                             - List segments");
    console.error("  get-segment <id>                          - Get segment details");
    console.error("  list-profiles [filter]                    - List profiles");
    console.error("  get-profile <id>                          - Get profile by ID");
    console.error("  create-profile <json>                     - Create profile");
    console.error("  subscribe <list-id> <json>                - Subscribe to list");
    console.error("  unsubscribe <list-id> <json>              - Unsubscribe from list");
    console.error("  list-events [filter]                      - List events");
    console.error("  create-event <json>                       - Create/track event");
    console.error("  get-campaign-messages <campaign-id>       - Get messages for a campaign");
    console.error("  get-message-template <message-id>         - Get template ID from message");
    console.error("  get-template-html <template-id>           - Get template HTML content");
    console.error("  list-templates                            - List email templates");
    console.error("  get-template <id>                         - Get template details");
    console.error("  create-template <json>                    - Create email template");
    console.error("  upload-image <file-path> [name]           - Upload image to Klaviyo");
    Deno.exit(1);
  }

  let result: unknown;

  switch (command) {
    case "account-info":
      result = await getAccountInfo();
      break;

    case "list-campaigns":
      if (!args[1]) {
        console.error("Usage: list-campaigns <channel>");
        console.error("Channels: email, sms, mobile_push");
        Deno.exit(1);
      }
      result = await listCampaigns(args[1] as "email" | "sms" | "mobile_push");
      break;

    case "get-campaign":
      if (!args[1]) {
        console.error("Usage: get-campaign <id>");
        Deno.exit(1);
      }
      result = await getCampaign(args[1]);
      break;

    case "create-campaign":
      if (!args[1]) {
        console.error("Usage: create-campaign <json>");
        Deno.exit(1);
      }
      result = await createCampaign(JSON.parse(args[1]));
      break;

    case "campaign-report":
      if (!args[1]) {
        console.error("Usage: campaign-report <id> [conversion-metric-id]");
        console.error("Default conversion metric: Placed Order (QYEYTD)");
        Deno.exit(1);
      }
      {
        const options = args[2] ? { conversionMetricId: args[2] } : undefined;
        result = await getCampaignReport(args[1], options);
      }
      break;

    case "list-flows":
      result = await listFlows();
      break;

    case "get-flow":
      if (!args[1]) {
        console.error("Usage: get-flow <id>");
        Deno.exit(1);
      }
      result = await getFlow(args[1]);
      break;

    case "flow-report":
      if (!args[1]) {
        console.error("Usage: flow-report <id> [stats]");
        Deno.exit(1);
      }
      {
        const stats = args[2] ? args[2].split(",") : undefined;
        result = await getFlowReport(args[1], stats);
      }
      break;

    case "list-metrics":
      result = await listMetrics();
      break;

    case "get-metric":
      if (!args[1]) {
        console.error("Usage: get-metric <id>");
        Deno.exit(1);
      }
      result = await getMetric(args[1]);
      break;

    case "metric-aggregates":
      if (!args[1]) {
        console.error("Usage: metric-aggregates <json>");
        console.error('Example: metric-aggregates \'{"metric_id":"abc","measurements":["count"]}\'');
        Deno.exit(1);
      }
      result = await queryMetricAggregates(JSON.parse(args[1]));
      break;

    case "list-lists":
      result = await listLists();
      break;

    case "get-list":
      if (!args[1]) {
        console.error("Usage: get-list <id>");
        Deno.exit(1);
      }
      result = await getList(args[1]);
      break;

    case "list-segments":
      result = await listSegments();
      break;

    case "get-segment":
      if (!args[1]) {
        console.error("Usage: get-segment <id>");
        Deno.exit(1);
      }
      result = await getSegment(args[1]);
      break;

    case "list-profiles":
      result = await listProfiles(args[1]);
      break;

    case "get-profile":
      if (!args[1]) {
        console.error("Usage: get-profile <id>");
        Deno.exit(1);
      }
      result = await getProfile(args[1]);
      break;

    case "create-profile":
      if (!args[1]) {
        console.error("Usage: create-profile <json>");
        Deno.exit(1);
      }
      result = await createProfile(JSON.parse(args[1]));
      break;

    case "subscribe":
      if (!args[1] || !args[2]) {
        console.error("Usage: subscribe <list-id> <json>");
        Deno.exit(1);
      }
      result = await subscribeToList(args[1], JSON.parse(args[2]));
      break;

    case "unsubscribe":
      if (!args[1] || !args[2]) {
        console.error("Usage: unsubscribe <list-id> <json>");
        Deno.exit(1);
      }
      result = await unsubscribeFromList(args[1], JSON.parse(args[2]));
      break;

    case "list-events":
      result = await listEvents(args[1]);
      break;

    case "create-event":
      if (!args[1]) {
        console.error("Usage: create-event <json>");
        Deno.exit(1);
      }
      result = await createEvent(JSON.parse(args[1]));
      break;

    case "get-campaign-messages":
      if (!args[1]) {
        console.error("Usage: get-campaign-messages <campaign-id>");
        Deno.exit(1);
      }
      result = await getCampaignMessages(args[1]);
      break;

    case "get-message-template":
      if (!args[1]) {
        console.error("Usage: get-message-template <message-id>");
        Deno.exit(1);
      }
      result = await getMessageTemplate(args[1]);
      break;

    case "get-template-html":
      if (!args[1]) {
        console.error("Usage: get-template-html <template-id>");
        Deno.exit(1);
      }
      result = await getTemplateHtml(args[1]);
      break;

    case "list-templates":
      result = await listTemplates();
      break;

    case "get-template":
      if (!args[1]) {
        console.error("Usage: get-template <id>");
        Deno.exit(1);
      }
      result = await getTemplate(args[1]);
      break;

    case "create-template":
      if (!args[1]) {
        console.error("Usage: create-template <json>");
        Deno.exit(1);
      }
      result = await createTemplate(JSON.parse(args[1]));
      break;

    case "upload-image":
      if (!args[1]) {
        console.error("Usage: upload-image <file-path> [name]");
        Deno.exit(1);
      }
      result = await uploadImageFromFile(args[1], args[2]);
      break;

    case "assign-template":
      if (!args[1] || !args[2]) {
        console.error("Usage: assign-template <message-id> <template-id>");
        Deno.exit(1);
      }
      result = await assignTemplateToMessage(args[1], args[2]);
      break;

    case "update-message":
      if (!args[1] || !args[2]) {
        console.error("Usage: update-message <message-id> <json>");
        console.error('Example: update-message abc123 \'{"subject":"Hello","preview_text":"Preview"}\'');
        Deno.exit(1);
      }
      result = await updateCampaignMessage(args[1], JSON.parse(args[2]));
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
