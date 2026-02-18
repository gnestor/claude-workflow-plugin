#!/usr/bin/env node

/**
 * Meta Marketing API MCP Server
 *
 * Provides tools for managing Facebook/Instagram ad campaigns, ad sets, ads,
 * creatives, audiences, insights, and ad library search via the Meta Graph API.
 *
 * Environment variables:
 *   META_ACCESS_TOKEN   - Meta API access token (required)
 *   META_AD_ACCOUNT_ID  - Ad account ID, with or without act_ prefix (required for most operations)
 *   META_APP_ID         - Meta App ID (optional, for app-level operations)
 *   META_APP_SECRET     - Meta App Secret (optional, for app-level operations)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// API configuration
// ---------------------------------------------------------------------------

const META_API_VERSION = "v24.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

// ---------------------------------------------------------------------------
// Common field sets
// ---------------------------------------------------------------------------

const CAMPAIGN_FIELDS = [
  "id", "name", "status", "objective", "buying_type",
  "daily_budget", "lifetime_budget", "budget_remaining",
  "created_time", "updated_time", "start_time", "stop_time",
].join(",");

const ADSET_FIELDS = [
  "id", "name", "status", "campaign_id",
  "daily_budget", "lifetime_budget", "budget_remaining",
  "billing_event", "optimization_goal", "bid_strategy", "bid_amount",
  "targeting", "created_time", "updated_time", "start_time", "end_time",
].join(",");

const AD_FIELDS = [
  "id", "name", "status", "adset_id", "campaign_id",
  "creative", "created_time", "updated_time",
].join(",");

const CREATIVE_FIELDS = [
  "id", "name", "status", "title", "body",
  "call_to_action_type", "image_url", "video_id", "thumbnail_url",
  "object_story_spec", "effective_object_story_id",
].join(",");

const AUDIENCE_FIELDS = [
  "id", "name", "description", "subtype",
  "approximate_count_lower_bound", "approximate_count_upper_bound",
  "data_source", "delivery_status", "operation_status",
  "time_created", "time_updated",
].join(",");

const INSIGHTS_FIELDS = [
  "campaign_id", "campaign_name", "adset_id", "adset_name",
  "ad_id", "ad_name", "impressions", "clicks", "spend",
  "reach", "frequency", "ctr", "cpc", "cpm", "cpp",
  "conversions", "conversion_values", "cost_per_conversion",
  "actions", "action_values", "date_start", "date_stop",
].join(",");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAccountId() {
  if (!AD_ACCOUNT_ID) {
    throw new Error(
      "META_AD_ACCOUNT_ID not set. Find your account ID in Ads Manager."
    );
  }
  return AD_ACCOUNT_ID.startsWith("act_") ? AD_ACCOUNT_ID : `act_${AD_ACCOUNT_ID}`;
}

async function metaApiRequest(endpoint, options = {}) {
  if (!ACCESS_TOKEN) {
    throw new Error(
      "META_ACCESS_TOKEN not set. Generate a token at https://developers.facebook.com/tools/explorer/"
    );
  }

  const url = new URL(`${META_API_BASE}${endpoint}`);

  // GET requests: token on URL
  if (!options.method || options.method === "GET") {
    url.searchParams.set("access_token", ACCESS_TOKEN);
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // POST requests: inject token into JSON body (or URL if no body)
  if (options.method === "POST") {
    if (options.body && typeof options.body === "string") {
      const body = JSON.parse(options.body);
      body.access_token = ACCESS_TOKEN;
      options.body = JSON.stringify(body);
    } else {
      url.searchParams.set("access_token", ACCESS_TOKEN);
    }
  }

  const response = await fetch(url.toString(), { ...options, headers });
  const data = await response.json();

  if (!response.ok || data.error) {
    const error = data.error || { message: "Unknown error", code: response.status };
    throw new Error(
      `Meta API error (${error.code}): ${error.message}${error.error_subcode ? ` [${error.error_subcode}]` : ""}`
    );
  }

  return data;
}

/** Convert cents string to dollars (Meta budgets are in cents). */
function centsToDollars(cents) {
  return cents ? Number(cents) / 100 : null;
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "meta-ads",
  version: "1.0.0",
});

// ===== Account tools =======================================================

server.tool(
  "test_auth",
  "Test Meta API authentication and return user + ad account info",
  {},
  async () => {
    try {
      const user = await metaApiRequest("/me?fields=id,name");
      const accountId = getAccountId();
      const account = await metaApiRequest(
        `/${accountId}?fields=id,name,account_status,currency,timezone_name,amount_spent`
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            user,
            adAccount: {
              id: account.id,
              name: account.name,
              status: account.account_status,
              currency: account.currency,
              timezone: account.timezone_name,
              amountSpentCents: account.amount_spent,
              amountSpentDollars: centsToDollars(account.amount_spent),
            },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "get_account_info",
  "Get detailed ad account information including balance, spend cap, and funding source",
  {},
  async () => {
    try {
      const accountId = getAccountId();
      const data = await metaApiRequest(
        `/${accountId}?fields=id,name,account_status,currency,timezone_name,amount_spent,balance,spend_cap,business,funding_source_details`
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            account: {
              id: data.id,
              name: data.name,
              status: data.account_status,
              currency: data.currency,
              timezone: data.timezone_name,
              amountSpentCents: data.amount_spent,
              amountSpentDollars: centsToDollars(data.amount_spent),
              balanceCents: data.balance,
              balanceDollars: centsToDollars(data.balance),
              spendCapCents: data.spend_cap,
              spendCapDollars: centsToDollars(data.spend_cap),
              business: data.business,
              fundingSource: data.funding_source_details,
            },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

// ===== Campaign tools ======================================================

server.tool(
  "list_campaigns",
  "List ad campaigns with optional status filter. Returns campaign details including budgets and dates.",
  {
    status: z.string().optional().describe("Filter by status: ACTIVE, PAUSED, DELETED, ARCHIVED"),
    limit: z.number().optional().describe("Maximum number of campaigns to return (default 50)"),
  },
  async ({ status, limit }) => {
    try {
      const accountId = getAccountId();
      const l = limit || 50;
      let endpoint = `/${accountId}/campaigns?fields=${CAMPAIGN_FIELDS}&limit=${l}`;
      if (status) {
        endpoint += `&filtering=[{"field":"status","operator":"EQUAL","value":"${status}"}]`;
      }

      const data = await metaApiRequest(endpoint);
      const campaigns = (data.data || []).map((c) => ({
        id: c.id, name: c.name, status: c.status,
        objective: c.objective, buyingType: c.buying_type,
        dailyBudgetCents: c.daily_budget, dailyBudgetDollars: centsToDollars(c.daily_budget),
        lifetimeBudgetCents: c.lifetime_budget, lifetimeBudgetDollars: centsToDollars(c.lifetime_budget),
        budgetRemainingCents: c.budget_remaining, budgetRemainingDollars: centsToDollars(c.budget_remaining),
        createdTime: c.created_time, updatedTime: c.updated_time,
        startTime: c.start_time, stopTime: c.stop_time,
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, campaigns, count: campaigns.length, paging: data.paging }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "get_campaign",
  "Get detailed information about a specific campaign by ID",
  {
    campaign_id: z.string().describe("The campaign ID"),
  },
  async ({ campaign_id }) => {
    try {
      const data = await metaApiRequest(`/${campaign_id}?fields=${CAMPAIGN_FIELDS}`);
      const campaign = {
        id: data.id, name: data.name, status: data.status,
        objective: data.objective, buyingType: data.buying_type,
        dailyBudgetCents: data.daily_budget, dailyBudgetDollars: centsToDollars(data.daily_budget),
        lifetimeBudgetCents: data.lifetime_budget, lifetimeBudgetDollars: centsToDollars(data.lifetime_budget),
        budgetRemainingCents: data.budget_remaining, budgetRemainingDollars: centsToDollars(data.budget_remaining),
        createdTime: data.created_time, updatedTime: data.updated_time,
        startTime: data.start_time, stopTime: data.stop_time,
      };
      return { content: [{ type: "text", text: JSON.stringify({ success: true, campaign }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "create_campaign",
  "Create a new ad campaign. Requires at minimum: name, objective, status, and special_ad_categories.",
  {
    name: z.string().describe("Campaign name"),
    objective: z.string().describe("Campaign objective (e.g. OUTCOME_TRAFFIC, OUTCOME_CONVERSIONS, OUTCOME_AWARENESS, OUTCOME_LEADS, OUTCOME_ENGAGEMENT, OUTCOME_SALES)"),
    status: z.string().optional().describe("Initial status: ACTIVE or PAUSED (default PAUSED)"),
    special_ad_categories: z.array(z.string()).optional().describe("Special ad categories, e.g. ['NONE'] or ['HOUSING', 'CREDIT', 'EMPLOYMENT']"),
    daily_budget: z.number().optional().describe("Daily budget in cents"),
    lifetime_budget: z.number().optional().describe("Lifetime budget in cents"),
    buying_type: z.string().optional().describe("Buying type: AUCTION (default) or RESERVED"),
    extra_fields: z.record(z.any()).optional().describe("Any additional fields to include in the campaign creation payload"),
  },
  async ({ name, objective, status, special_ad_categories, daily_budget, lifetime_budget, buying_type, extra_fields }) => {
    try {
      const accountId = getAccountId();
      const payload = {
        name,
        objective,
        status: status || "PAUSED",
        special_ad_categories: special_ad_categories || ["NONE"],
        ...(daily_budget !== undefined && { daily_budget }),
        ...(lifetime_budget !== undefined && { lifetime_budget }),
        ...(buying_type && { buying_type }),
        ...(extra_fields || {}),
      };

      const data = await metaApiRequest(`/${accountId}/campaigns`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return { content: [{ type: "text", text: JSON.stringify({ success: true, campaignId: data.id, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "update_campaign",
  "Update a campaign's properties (name, budget, status, etc.)",
  {
    campaign_id: z.string().describe("The campaign ID to update"),
    update_data: z.record(z.any()).describe("Object of fields to update (e.g. { name, daily_budget, status })"),
  },
  async ({ campaign_id, update_data }) => {
    try {
      const data = await metaApiRequest(`/${campaign_id}`, {
        method: "POST",
        body: JSON.stringify(update_data),
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, campaignId: campaign_id, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "update_campaign_status",
  "Enable or pause a campaign",
  {
    campaign_id: z.string().describe("The campaign ID"),
    status: z.enum(["ACTIVE", "PAUSED"]).describe("New status: ACTIVE or PAUSED"),
  },
  async ({ campaign_id, status }) => {
    try {
      const data = await metaApiRequest(`/${campaign_id}`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, campaignId: campaign_id, newStatus: status, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

// ===== Ad Set tools ========================================================

server.tool(
  "list_adsets",
  "List ad sets, optionally filtered by campaign ID",
  {
    campaign_id: z.string().optional().describe("Filter ad sets by campaign ID"),
    limit: z.number().optional().describe("Maximum number of ad sets to return (default 50)"),
  },
  async ({ campaign_id, limit }) => {
    try {
      const accountId = getAccountId();
      const l = limit || 50;
      let endpoint = `/${accountId}/adsets?fields=${ADSET_FIELDS}&limit=${l}`;
      if (campaign_id) {
        endpoint += `&filtering=[{"field":"campaign_id","operator":"EQUAL","value":"${campaign_id}"}]`;
      }
      const data = await metaApiRequest(endpoint);
      const adsets = (data.data || []).map((a) => ({
        id: a.id, name: a.name, status: a.status, campaignId: a.campaign_id,
        dailyBudgetCents: a.daily_budget, dailyBudgetDollars: centsToDollars(a.daily_budget),
        lifetimeBudgetCents: a.lifetime_budget, lifetimeBudgetDollars: centsToDollars(a.lifetime_budget),
        budgetRemainingCents: a.budget_remaining, budgetRemainingDollars: centsToDollars(a.budget_remaining),
        billingEvent: a.billing_event, optimizationGoal: a.optimization_goal,
        bidStrategy: a.bid_strategy, bidAmountCents: a.bid_amount, bidAmountDollars: centsToDollars(a.bid_amount),
        targeting: a.targeting,
        createdTime: a.created_time, updatedTime: a.updated_time,
        startTime: a.start_time, endTime: a.end_time,
      }));
      return { content: [{ type: "text", text: JSON.stringify({ success: true, adsets, count: adsets.length, paging: data.paging }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "get_adset",
  "Get detailed information about a specific ad set",
  {
    adset_id: z.string().describe("The ad set ID"),
  },
  async ({ adset_id }) => {
    try {
      const data = await metaApiRequest(`/${adset_id}?fields=${ADSET_FIELDS}`);
      const adset = {
        id: data.id, name: data.name, status: data.status, campaignId: data.campaign_id,
        dailyBudgetCents: data.daily_budget, dailyBudgetDollars: centsToDollars(data.daily_budget),
        lifetimeBudgetCents: data.lifetime_budget, lifetimeBudgetDollars: centsToDollars(data.lifetime_budget),
        budgetRemainingCents: data.budget_remaining, budgetRemainingDollars: centsToDollars(data.budget_remaining),
        billingEvent: data.billing_event, optimizationGoal: data.optimization_goal,
        bidStrategy: data.bid_strategy, bidAmountCents: data.bid_amount, bidAmountDollars: centsToDollars(data.bid_amount),
        targeting: data.targeting,
        createdTime: data.created_time, updatedTime: data.updated_time,
        startTime: data.start_time, endTime: data.end_time,
      };
      return { content: [{ type: "text", text: JSON.stringify({ success: true, adset }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "create_adset",
  "Create a new ad set within a campaign. Requires campaign_id, name, targeting, billing_event, optimization_goal, and budget.",
  {
    campaign_id: z.string().describe("Parent campaign ID"),
    name: z.string().describe("Ad set name"),
    targeting: z.record(z.any()).describe("Targeting spec object (geo_locations, age_min, age_max, genders, interests, etc.)"),
    billing_event: z.string().describe("Billing event: IMPRESSIONS, LINK_CLICKS, etc."),
    optimization_goal: z.string().describe("Optimization goal: REACH, IMPRESSIONS, LINK_CLICKS, CONVERSIONS, etc."),
    daily_budget: z.number().optional().describe("Daily budget in cents"),
    lifetime_budget: z.number().optional().describe("Lifetime budget in cents"),
    bid_strategy: z.string().optional().describe("Bid strategy: LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP"),
    bid_amount: z.number().optional().describe("Bid amount in cents (required for some bid strategies)"),
    status: z.string().optional().describe("Initial status: ACTIVE or PAUSED (default PAUSED)"),
    start_time: z.string().optional().describe("Start time in ISO 8601 format"),
    end_time: z.string().optional().describe("End time in ISO 8601 format"),
    extra_fields: z.record(z.any()).optional().describe("Any additional fields for ad set creation"),
  },
  async ({ campaign_id, name, targeting, billing_event, optimization_goal, daily_budget, lifetime_budget, bid_strategy, bid_amount, status, start_time, end_time, extra_fields }) => {
    try {
      const accountId = getAccountId();
      const payload = {
        campaign_id,
        name,
        targeting,
        billing_event,
        optimization_goal,
        status: status || "PAUSED",
        ...(daily_budget !== undefined && { daily_budget }),
        ...(lifetime_budget !== undefined && { lifetime_budget }),
        ...(bid_strategy && { bid_strategy }),
        ...(bid_amount !== undefined && { bid_amount }),
        ...(start_time && { start_time }),
        ...(end_time && { end_time }),
        ...(extra_fields || {}),
      };

      const data = await metaApiRequest(`/${accountId}/adsets`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, adsetId: data.id, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "update_adset",
  "Update an ad set's properties",
  {
    adset_id: z.string().describe("The ad set ID to update"),
    update_data: z.record(z.any()).describe("Object of fields to update (e.g. { name, daily_budget, targeting, status })"),
  },
  async ({ adset_id, update_data }) => {
    try {
      const data = await metaApiRequest(`/${adset_id}`, {
        method: "POST",
        body: JSON.stringify(update_data),
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, adsetId: adset_id, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "update_adset_budget",
  "Update an ad set's daily budget",
  {
    adset_id: z.string().describe("The ad set ID"),
    amount_cents: z.number().describe("New daily budget in cents"),
  },
  async ({ adset_id, amount_cents }) => {
    try {
      const data = await metaApiRequest(`/${adset_id}`, {
        method: "POST",
        body: JSON.stringify({ daily_budget: amount_cents }),
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, adsetId: adset_id, newBudgetCents: amount_cents, newBudgetDollars: amount_cents / 100, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "update_adset_status",
  "Enable or pause an ad set",
  {
    adset_id: z.string().describe("The ad set ID"),
    status: z.enum(["ACTIVE", "PAUSED"]).describe("New status: ACTIVE or PAUSED"),
  },
  async ({ adset_id, status }) => {
    try {
      const data = await metaApiRequest(`/${adset_id}`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, adsetId: adset_id, newStatus: status, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

// ===== Ad tools ============================================================

server.tool(
  "list_ads",
  "List ads, optionally filtered by ad set ID",
  {
    adset_id: z.string().optional().describe("Filter ads by ad set ID"),
    limit: z.number().optional().describe("Maximum number of ads to return (default 50)"),
  },
  async ({ adset_id, limit }) => {
    try {
      const accountId = getAccountId();
      const l = limit || 50;
      let endpoint = `/${accountId}/ads?fields=${AD_FIELDS}&limit=${l}`;
      if (adset_id) {
        endpoint += `&filtering=[{"field":"adset_id","operator":"EQUAL","value":"${adset_id}"}]`;
      }
      const data = await metaApiRequest(endpoint);
      const ads = (data.data || []).map((ad) => ({
        id: ad.id, name: ad.name, status: ad.status,
        adsetId: ad.adset_id, campaignId: ad.campaign_id,
        creative: ad.creative,
        createdTime: ad.created_time, updatedTime: ad.updated_time,
      }));
      return { content: [{ type: "text", text: JSON.stringify({ success: true, ads, count: ads.length, paging: data.paging }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "get_ad",
  "Get detailed information about a specific ad",
  {
    ad_id: z.string().describe("The ad ID"),
  },
  async ({ ad_id }) => {
    try {
      const data = await metaApiRequest(`/${ad_id}?fields=${AD_FIELDS}`);
      const ad = {
        id: data.id, name: data.name, status: data.status,
        adsetId: data.adset_id, campaignId: data.campaign_id,
        creative: data.creative,
        createdTime: data.created_time, updatedTime: data.updated_time,
      };
      return { content: [{ type: "text", text: JSON.stringify({ success: true, ad }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "create_ad",
  "Create a new ad. Requires name, adset_id, creative, and status.",
  {
    name: z.string().describe("Ad name"),
    adset_id: z.string().describe("Parent ad set ID"),
    creative: z.record(z.any()).describe("Creative spec, e.g. { creative_id: '123' } or inline creative object"),
    status: z.string().optional().describe("Initial status: ACTIVE or PAUSED (default PAUSED)"),
    extra_fields: z.record(z.any()).optional().describe("Any additional fields for ad creation"),
  },
  async ({ name, adset_id, creative, status, extra_fields }) => {
    try {
      const accountId = getAccountId();
      const payload = {
        name,
        adset_id,
        creative,
        status: status || "PAUSED",
        ...(extra_fields || {}),
      };
      const data = await metaApiRequest(`/${accountId}/ads`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, adId: data.id, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "update_ad_status",
  "Enable or pause an ad",
  {
    ad_id: z.string().describe("The ad ID"),
    status: z.enum(["ACTIVE", "PAUSED"]).describe("New status: ACTIVE or PAUSED"),
  },
  async ({ ad_id, status }) => {
    try {
      const data = await metaApiRequest(`/${ad_id}`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, adId: ad_id, newStatus: status, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

// ===== Creative tools ======================================================

server.tool(
  "list_creatives",
  "List ad creatives for the ad account",
  {
    limit: z.number().optional().describe("Maximum number of creatives to return (default 50)"),
  },
  async ({ limit }) => {
    try {
      const accountId = getAccountId();
      const l = limit || 50;
      const data = await metaApiRequest(`/${accountId}/adcreatives?fields=${CREATIVE_FIELDS}&limit=${l}`);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, creatives: data.data || [], count: (data.data || []).length, paging: data.paging }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "get_creative",
  "Get detailed information about a specific ad creative",
  {
    creative_id: z.string().describe("The creative ID"),
  },
  async ({ creative_id }) => {
    try {
      const data = await metaApiRequest(`/${creative_id}?fields=${CREATIVE_FIELDS}`);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, creative: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "create_creative",
  "Create a new ad creative. Pass object_story_spec for link ads, image ads, video ads, etc.",
  {
    name: z.string().describe("Creative name"),
    object_story_spec: z.record(z.any()).optional().describe("Object story spec for the creative (page_id, link_data, video_data, etc.)"),
    extra_fields: z.record(z.any()).optional().describe("Any additional fields for creative creation (title, body, call_to_action_type, image_hash, etc.)"),
  },
  async ({ name, object_story_spec, extra_fields }) => {
    try {
      const accountId = getAccountId();
      const payload = {
        name,
        ...(object_story_spec && { object_story_spec }),
        ...(extra_fields || {}),
      };
      const data = await metaApiRequest(`/${accountId}/adcreatives`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { content: [{ type: "text", text: JSON.stringify({ success: true, creativeId: data.id, result: data }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

// ===== Audience tools ======================================================

server.tool(
  "list_audiences",
  "List custom audiences for the ad account",
  {},
  async () => {
    try {
      const accountId = getAccountId();
      const data = await metaApiRequest(`/${accountId}/customaudiences?fields=${AUDIENCE_FIELDS}`);
      const audiences = (data.data || []).map((a) => ({
        id: a.id, name: a.name, description: a.description, subtype: a.subtype,
        approximateCountLower: a.approximate_count_lower_bound,
        approximateCountUpper: a.approximate_count_upper_bound,
        dataSource: a.data_source, deliveryStatus: a.delivery_status,
        operationStatus: a.operation_status,
        timeCreated: a.time_created, timeUpdated: a.time_updated,
      }));
      return { content: [{ type: "text", text: JSON.stringify({ success: true, audiences, count: audiences.length, paging: data.paging }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

server.tool(
  "get_audience",
  "Get detailed information about a specific custom audience",
  {
    audience_id: z.string().describe("The custom audience ID"),
  },
  async ({ audience_id }) => {
    try {
      const data = await metaApiRequest(`/${audience_id}?fields=${AUDIENCE_FIELDS}`);
      const audience = {
        id: data.id, name: data.name, description: data.description, subtype: data.subtype,
        approximateCountLower: data.approximate_count_lower_bound,
        approximateCountUpper: data.approximate_count_upper_bound,
        dataSource: data.data_source, deliveryStatus: data.delivery_status,
        operationStatus: data.operation_status,
        timeCreated: data.time_created, timeUpdated: data.time_updated,
      };
      return { content: [{ type: "text", text: JSON.stringify({ success: true, audience }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

// ===== Insights tools ======================================================

server.tool(
  "get_insights",
  "Get performance insights (metrics) for a campaign, ad set, ad, or the entire ad account. Returns impressions, clicks, spend, CTR, CPC, CPM, conversions, and more.",
  {
    object_id: z.string().describe("The ID of the object to get insights for (campaign ID, ad set ID, ad ID, or ad account ID)"),
    level: z.string().optional().describe("Aggregation level: ad, adset, campaign, account (default: ad)"),
    date_preset: z.string().optional().describe("Date preset: today, yesterday, this_month, last_month, this_quarter, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year (default: last_30d)"),
    breakdowns: z.string().optional().describe("Comma-separated breakdowns: age, gender, country, region, placement, device_platform, publisher_platform, impression_device, etc."),
    time_increment: z.string().optional().describe("Time increment for daily/weekly/monthly data: 1 (daily), 7 (weekly), monthly, all_days"),
  },
  async ({ object_id, level, date_preset, breakdowns, time_increment }) => {
    try {
      const lvl = level || "ad";
      const preset = date_preset || "last_30d";
      let endpoint = `/${object_id}/insights?fields=${INSIGHTS_FIELDS}&level=${lvl}&date_preset=${preset}`;
      if (breakdowns) endpoint += `&breakdowns=${breakdowns}`;
      if (time_increment) endpoint += `&time_increment=${time_increment}`;

      const data = await metaApiRequest(endpoint);
      const insights = (data.data || []).map((row) => ({
        campaignId: row.campaign_id, campaignName: row.campaign_name,
        adsetId: row.adset_id, adsetName: row.adset_name,
        adId: row.ad_id, adName: row.ad_name,
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        spendCents: row.spend ? Math.round(Number(row.spend) * 100) : 0,
        spendDollars: row.spend ? Number(row.spend) : 0,
        reach: Number(row.reach || 0),
        frequency: Number(row.frequency || 0),
        ctr: Number(row.ctr || 0),
        cpc: row.cpc ? Number(row.cpc) : null,
        cpm: row.cpm ? Number(row.cpm) : null,
        cpp: row.cpp ? Number(row.cpp) : null,
        conversions: row.conversions,
        conversionValues: row.conversion_values,
        costPerConversion: row.cost_per_conversion,
        actions: row.actions,
        actionValues: row.action_values,
        dateStart: row.date_start, dateStop: row.date_stop,
      }));

      return { content: [{ type: "text", text: JSON.stringify({ success: true, insights, count: insights.length, paging: data.paging }, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

// ===== Ad Library tools ====================================================

server.tool(
  "ad_library_search",
  "Search the Meta Ad Library for competitor ads. Note: Only returns results for EU/Brazil or political/social issue ads in other regions.",
  {
    search_terms: z.string().describe("Search terms to look for in ads"),
    country: z.string().describe("Two-letter country code (e.g. US, GB, DE, BR)"),
    limit: z.number().optional().describe("Maximum number of results (default 50)"),
  },
  async ({ search_terms, country, limit }) => {
    try {
      const l = limit || 50;
      const endpoint = `/ads_archive?search_terms=${encodeURIComponent(search_terms)}&ad_reached_countries=['${country}']&ad_type=ALL&fields=id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url,page_id,page_name,publisher_platforms,estimated_audience_size&limit=${l}`;
      const data = await metaApiRequest(endpoint);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            ads: data.data || [],
            count: (data.data || []).length,
            paging: data.paging,
            note: "Ad Library API only returns results for EU/Brazil or political ads. For general competitor research, use facebook.com/ads/library directly.",
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message,
            note: "Ad Library API only returns results for EU/Brazil or political ads. For general competitor research, use facebook.com/ads/library directly.",
          }),
        }],
      };
    }
  }
);

// ===== Image upload tool ===================================================

server.tool(
  "upload_image",
  "Upload an image for use in ad creatives. Provide the image as a base64-encoded string. Returns the image hash needed for creating creatives.",
  {
    image_base64: z.string().describe("Base64-encoded image data"),
    filename: z.string().optional().describe("Original filename (for reference only)"),
  },
  async ({ image_base64, filename }) => {
    try {
      const accountId = getAccountId();

      if (!ACCESS_TOKEN) {
        throw new Error("META_ACCESS_TOKEN not set.");
      }

      // Use FormData to upload the image via multipart/form-data
      const formData = new FormData();
      formData.append("access_token", ACCESS_TOKEN);
      formData.append("bytes", image_base64);
      if (filename) {
        formData.append("name", filename);
      }

      const response = await fetch(`${META_API_BASE}/${accountId}/adimages`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const error = data.error || { message: "Upload failed" };
        throw new Error(`Meta API error: ${error.message}`);
      }

      const images = data.images || {};
      const imageData = Object.values(images)[0];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            imageHash: imageData?.hash,
            result: data,
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }) }] };
    }
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting Meta Ads MCP server:", error);
  process.exit(1);
});
