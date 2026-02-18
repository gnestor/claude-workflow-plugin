#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Meta Marketing API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write meta-ads-client.ts <command> [args...]
 *
 * Commands:
 *   test-auth                                           - Test authentication
 *   account-info                                        - Get ad account info
 *   list-campaigns [--status <status>] [--limit <n>]    - List campaigns
 *   get-campaign <campaign-id>                          - Get campaign details
 *   list-adsets [--campaign-id <id>] [--limit <n>]      - List ad sets
 *   get-adset <adset-id>                                - Get ad set details
 *   list-ads [--adset-id <id>] [--limit <n>]            - List ads
 *   get-ad <ad-id>                                      - Get ad details
 *   list-creatives [--limit <n>]                        - List ad creatives
 *   get-creative <creative-id>                          - Get creative details
 *   list-audiences                                      - List custom audiences
 *   get-audience <audience-id>                          - Get audience details
 *   insights <object-id> [--level <level>] [--date-preset <preset>] [--breakdowns <breakdowns>]
 *   ad-library --search <terms> --country <code> [--limit <n>]
 *   create-campaign '<json>'                            - Create campaign
 *   update-campaign <campaign-id> '<json>'              - Update campaign
 *   update-campaign-status <campaign-id> <ACTIVE|PAUSED> - Enable/pause campaign
 *   create-adset '<json>'                               - Create ad set
 *   update-adset <adset-id> '<json>'                    - Update ad set
 *   update-adset-budget <adset-id> <amount-cents>       - Update ad set budget
 *   update-adset-status <adset-id> <ACTIVE|PAUSED>      - Enable/pause ad set
 *   create-creative '<json>'                            - Create ad creative
 *   create-ad '<json>'                                  - Create ad
 *   update-ad-status <ad-id> <ACTIVE|PAUSED>            - Enable/pause ad
 *   upload-image <file-path>                            - Upload ad image
 */

import "@std/dotenv/load";

// API configuration
const META_API_VERSION = "v24.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// Environment variables
const ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN");
const AD_ACCOUNT_ID = Deno.env.get("META_AD_ACCOUNT_ID");

// Common fields for API requests
const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "status",
  "objective",
  "buying_type",
  "daily_budget",
  "lifetime_budget",
  "budget_remaining",
  "created_time",
  "updated_time",
  "start_time",
  "stop_time",
].join(",");

const ADSET_FIELDS = [
  "id",
  "name",
  "status",
  "campaign_id",
  "daily_budget",
  "lifetime_budget",
  "budget_remaining",
  "billing_event",
  "optimization_goal",
  "bid_strategy",
  "bid_amount",
  "targeting",
  "created_time",
  "updated_time",
  "start_time",
  "end_time",
].join(",");

const AD_FIELDS = [
  "id",
  "name",
  "status",
  "adset_id",
  "campaign_id",
  "creative",
  "created_time",
  "updated_time",
].join(",");

const CREATIVE_FIELDS = [
  "id",
  "name",
  "status",
  "title",
  "body",
  "call_to_action_type",
  "image_url",
  "video_id",
  "thumbnail_url",
  "object_story_spec",
  "effective_object_story_id",
].join(",");

const AUDIENCE_FIELDS = [
  "id",
  "name",
  "description",
  "subtype",
  "approximate_count_lower_bound",
  "approximate_count_upper_bound",
  "data_source",
  "delivery_status",
  "operation_status",
  "time_created",
  "time_updated",
].join(",");

const INSIGHTS_FIELDS = [
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
  "impressions",
  "clicks",
  "spend",
  "reach",
  "frequency",
  "ctr",
  "cpc",
  "cpm",
  "cpp",
  "conversions",
  "conversion_values",
  "cost_per_conversion",
  "actions",
  "action_values",
  "date_start",
  "date_stop",
].join(",");

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  let i = 0;

  while (i < args.length) {
    if (args[i].startsWith("--")) {
      const key = args[i].substring(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith("--")) {
        result[key] = nextArg;
        i += 2;
      } else {
        result[key] = true;
        i++;
      }
    } else {
      i++;
    }
  }

  return result;
}

/**
 * Make authenticated request to Meta Graph API
 */
async function metaApiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  if (!ACCESS_TOKEN) {
    throw new Error(
      "META_ACCESS_TOKEN not set in .env. Generate a token at https://developers.facebook.com/tools/explorer/"
    );
  }

  const url = new URL(`${META_API_BASE}${endpoint}`);

  // Add access token to URL params for GET requests
  if (!options.method || options.method === "GET") {
    url.searchParams.set("access_token", ACCESS_TOKEN);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // For POST requests, add access token to body or URL
  if (options.method === "POST") {
    if (options.body && typeof options.body === "string") {
      const body = JSON.parse(options.body);
      body.access_token = ACCESS_TOKEN;
      options.body = JSON.stringify(body);
    } else {
      url.searchParams.set("access_token", ACCESS_TOKEN);
    }
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const error = data.error || { message: "Unknown error", code: response.status };
    throw new Error(
      `Meta API error (${error.code}): ${error.message}${error.error_subcode ? ` [${error.error_subcode}]` : ""}`
    );
  }

  return data;
}

/**
 * Get the ad account ID (with act_ prefix)
 */
function getAccountId(): string {
  if (!AD_ACCOUNT_ID) {
    throw new Error(
      "META_AD_ACCOUNT_ID not set in .env. Find your account ID in Ads Manager."
    );
  }
  return AD_ACCOUNT_ID.startsWith("act_") ? AD_ACCOUNT_ID : `act_${AD_ACCOUNT_ID}`;
}

// ============================================================================
// Account Operations
// ============================================================================

/**
 * Test authentication
 */
async function testAuth() {
  try {
    const data = await metaApiRequest("/me?fields=id,name");
    const accountId = getAccountId();
    const accountData = await metaApiRequest(`/${accountId}?fields=id,name,account_status,currency,timezone_name,amount_spent`);

    return {
      success: true,
      user: data,
      adAccount: {
        id: accountData.id,
        name: accountData.name,
        status: accountData.account_status,
        currency: accountData.currency,
        timezone: accountData.timezone_name,
        amountSpentCents: accountData.amount_spent,
        amountSpentDollars: accountData.amount_spent ? Number(accountData.amount_spent) / 100 : 0,
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
 * Get ad account info
 */
async function getAccountInfo() {
  try {
    const accountId = getAccountId();
    const data = await metaApiRequest(
      `/${accountId}?fields=id,name,account_status,currency,timezone_name,amount_spent,balance,spend_cap,business,funding_source_details`
    );

    return {
      success: true,
      account: {
        id: data.id,
        name: data.name,
        status: data.account_status,
        currency: data.currency,
        timezone: data.timezone_name,
        amountSpentCents: data.amount_spent,
        amountSpentDollars: data.amount_spent ? Number(data.amount_spent) / 100 : 0,
        balanceCents: data.balance,
        balanceDollars: data.balance ? Number(data.balance) / 100 : 0,
        spendCapCents: data.spend_cap,
        spendCapDollars: data.spend_cap ? Number(data.spend_cap) / 100 : null,
        business: data.business,
        fundingSource: data.funding_source_details,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// Campaign Operations
// ============================================================================

/**
 * List campaigns
 */
async function listCampaigns(options: { status?: string; limit?: number } = {}) {
  try {
    const accountId = getAccountId();
    const limit = options.limit || 50;

    let endpoint = `/${accountId}/campaigns?fields=${CAMPAIGN_FIELDS}&limit=${limit}`;
    if (options.status) {
      endpoint += `&filtering=[{"field":"status","operator":"EQUAL","value":"${options.status}"}]`;
    }

    const data = await metaApiRequest(endpoint);

    const campaigns = (data.data || []).map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      buyingType: campaign.buying_type,
      dailyBudgetCents: campaign.daily_budget,
      dailyBudgetDollars: campaign.daily_budget ? Number(campaign.daily_budget) / 100 : null,
      lifetimeBudgetCents: campaign.lifetime_budget,
      lifetimeBudgetDollars: campaign.lifetime_budget ? Number(campaign.lifetime_budget) / 100 : null,
      budgetRemainingCents: campaign.budget_remaining,
      budgetRemainingDollars: campaign.budget_remaining ? Number(campaign.budget_remaining) / 100 : null,
      createdTime: campaign.created_time,
      updatedTime: campaign.updated_time,
      startTime: campaign.start_time,
      stopTime: campaign.stop_time,
    }));

    return {
      success: true,
      campaigns,
      count: campaigns.length,
      paging: data.paging,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get campaign details
 */
async function getCampaign(campaignId: string) {
  try {
    const data = await metaApiRequest(`/${campaignId}?fields=${CAMPAIGN_FIELDS}`);

    return {
      success: true,
      campaign: {
        id: data.id,
        name: data.name,
        status: data.status,
        objective: data.objective,
        buyingType: data.buying_type,
        dailyBudgetCents: data.daily_budget,
        dailyBudgetDollars: data.daily_budget ? Number(data.daily_budget) / 100 : null,
        lifetimeBudgetCents: data.lifetime_budget,
        lifetimeBudgetDollars: data.lifetime_budget ? Number(data.lifetime_budget) / 100 : null,
        budgetRemainingCents: data.budget_remaining,
        budgetRemainingDollars: data.budget_remaining ? Number(data.budget_remaining) / 100 : null,
        createdTime: data.created_time,
        updatedTime: data.updated_time,
        startTime: data.start_time,
        stopTime: data.stop_time,
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
 * Create campaign
 */
async function createCampaign(campaignData: any) {
  try {
    const accountId = getAccountId();
    const data = await metaApiRequest(`/${accountId}/campaigns`, {
      method: "POST",
      body: JSON.stringify(campaignData),
    });

    return {
      success: true,
      campaignId: data.id,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update campaign
 */
async function updateCampaign(campaignId: string, updateData: any) {
  try {
    const data = await metaApiRequest(`/${campaignId}`, {
      method: "POST",
      body: JSON.stringify(updateData),
    });

    return {
      success: true,
      campaignId,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update campaign status
 */
async function updateCampaignStatus(campaignId: string, status: string) {
  const validStatuses = ["ACTIVE", "PAUSED"];
  const normalizedStatus = status.toUpperCase();

  if (!validStatuses.includes(normalizedStatus)) {
    return {
      success: false,
      error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
    };
  }

  return updateCampaign(campaignId, { status: normalizedStatus });
}

// ============================================================================
// Ad Set Operations
// ============================================================================

/**
 * List ad sets
 */
async function listAdSets(options: { campaignId?: string; limit?: number } = {}) {
  try {
    const accountId = getAccountId();
    const limit = options.limit || 50;

    let endpoint = `/${accountId}/adsets?fields=${ADSET_FIELDS}&limit=${limit}`;
    if (options.campaignId) {
      endpoint += `&filtering=[{"field":"campaign_id","operator":"EQUAL","value":"${options.campaignId}"}]`;
    }

    const data = await metaApiRequest(endpoint);

    const adsets = (data.data || []).map((adset: any) => ({
      id: adset.id,
      name: adset.name,
      status: adset.status,
      campaignId: adset.campaign_id,
      dailyBudgetCents: adset.daily_budget,
      dailyBudgetDollars: adset.daily_budget ? Number(adset.daily_budget) / 100 : null,
      lifetimeBudgetCents: adset.lifetime_budget,
      lifetimeBudgetDollars: adset.lifetime_budget ? Number(adset.lifetime_budget) / 100 : null,
      budgetRemainingCents: adset.budget_remaining,
      budgetRemainingDollars: adset.budget_remaining ? Number(adset.budget_remaining) / 100 : null,
      billingEvent: adset.billing_event,
      optimizationGoal: adset.optimization_goal,
      bidStrategy: adset.bid_strategy,
      bidAmountCents: adset.bid_amount,
      bidAmountDollars: adset.bid_amount ? Number(adset.bid_amount) / 100 : null,
      targeting: adset.targeting,
      createdTime: adset.created_time,
      updatedTime: adset.updated_time,
      startTime: adset.start_time,
      endTime: adset.end_time,
    }));

    return {
      success: true,
      adsets,
      count: adsets.length,
      paging: data.paging,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get ad set details
 */
async function getAdSet(adsetId: string) {
  try {
    const data = await metaApiRequest(`/${adsetId}?fields=${ADSET_FIELDS}`);

    return {
      success: true,
      adset: {
        id: data.id,
        name: data.name,
        status: data.status,
        campaignId: data.campaign_id,
        dailyBudgetCents: data.daily_budget,
        dailyBudgetDollars: data.daily_budget ? Number(data.daily_budget) / 100 : null,
        lifetimeBudgetCents: data.lifetime_budget,
        lifetimeBudgetDollars: data.lifetime_budget ? Number(data.lifetime_budget) / 100 : null,
        budgetRemainingCents: data.budget_remaining,
        budgetRemainingDollars: data.budget_remaining ? Number(data.budget_remaining) / 100 : null,
        billingEvent: data.billing_event,
        optimizationGoal: data.optimization_goal,
        bidStrategy: data.bid_strategy,
        bidAmountCents: data.bid_amount,
        bidAmountDollars: data.bid_amount ? Number(data.bid_amount) / 100 : null,
        targeting: data.targeting,
        createdTime: data.created_time,
        updatedTime: data.updated_time,
        startTime: data.start_time,
        endTime: data.end_time,
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
 * Create ad set
 */
async function createAdSet(adsetData: any) {
  try {
    const accountId = getAccountId();
    const data = await metaApiRequest(`/${accountId}/adsets`, {
      method: "POST",
      body: JSON.stringify(adsetData),
    });

    return {
      success: true,
      adsetId: data.id,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update ad set
 */
async function updateAdSet(adsetId: string, updateData: any) {
  try {
    const data = await metaApiRequest(`/${adsetId}`, {
      method: "POST",
      body: JSON.stringify(updateData),
    });

    return {
      success: true,
      adsetId,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update ad set budget
 */
async function updateAdSetBudget(adsetId: string, amountCents: number) {
  return updateAdSet(adsetId, { daily_budget: amountCents });
}

/**
 * Update ad set status
 */
async function updateAdSetStatus(adsetId: string, status: string) {
  const validStatuses = ["ACTIVE", "PAUSED"];
  const normalizedStatus = status.toUpperCase();

  if (!validStatuses.includes(normalizedStatus)) {
    return {
      success: false,
      error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
    };
  }

  return updateAdSet(adsetId, { status: normalizedStatus });
}

// ============================================================================
// Ad Operations
// ============================================================================

/**
 * List ads
 */
async function listAds(options: { adsetId?: string; limit?: number } = {}) {
  try {
    const accountId = getAccountId();
    const limit = options.limit || 50;

    let endpoint = `/${accountId}/ads?fields=${AD_FIELDS}&limit=${limit}`;
    if (options.adsetId) {
      endpoint += `&filtering=[{"field":"adset_id","operator":"EQUAL","value":"${options.adsetId}"}]`;
    }

    const data = await metaApiRequest(endpoint);

    const ads = (data.data || []).map((ad: any) => ({
      id: ad.id,
      name: ad.name,
      status: ad.status,
      adsetId: ad.adset_id,
      campaignId: ad.campaign_id,
      creative: ad.creative,
      createdTime: ad.created_time,
      updatedTime: ad.updated_time,
    }));

    return {
      success: true,
      ads,
      count: ads.length,
      paging: data.paging,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get ad details
 */
async function getAd(adId: string) {
  try {
    const data = await metaApiRequest(`/${adId}?fields=${AD_FIELDS}`);

    return {
      success: true,
      ad: {
        id: data.id,
        name: data.name,
        status: data.status,
        adsetId: data.adset_id,
        campaignId: data.campaign_id,
        creative: data.creative,
        createdTime: data.created_time,
        updatedTime: data.updated_time,
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
 * Create ad
 */
async function createAd(adData: any) {
  try {
    const accountId = getAccountId();
    const data = await metaApiRequest(`/${accountId}/ads`, {
      method: "POST",
      body: JSON.stringify(adData),
    });

    return {
      success: true,
      adId: data.id,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update ad status
 */
async function updateAdStatus(adId: string, status: string) {
  const validStatuses = ["ACTIVE", "PAUSED"];
  const normalizedStatus = status.toUpperCase();

  if (!validStatuses.includes(normalizedStatus)) {
    return {
      success: false,
      error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
    };
  }

  try {
    const data = await metaApiRequest(`/${adId}`, {
      method: "POST",
      body: JSON.stringify({ status: normalizedStatus }),
    });

    return {
      success: true,
      adId,
      newStatus: normalizedStatus,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// Creative Operations
// ============================================================================

/**
 * List ad creatives
 */
async function listCreatives(options: { limit?: number } = {}) {
  try {
    const accountId = getAccountId();
    const limit = options.limit || 50;

    const data = await metaApiRequest(
      `/${accountId}/adcreatives?fields=${CREATIVE_FIELDS}&limit=${limit}`
    );

    return {
      success: true,
      creatives: data.data || [],
      count: (data.data || []).length,
      paging: data.paging,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get creative details
 */
async function getCreative(creativeId: string) {
  try {
    const data = await metaApiRequest(`/${creativeId}?fields=${CREATIVE_FIELDS}`);

    return {
      success: true,
      creative: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create ad creative
 */
async function createCreative(creativeData: any) {
  try {
    const accountId = getAccountId();
    const data = await metaApiRequest(`/${accountId}/adcreatives`, {
      method: "POST",
      body: JSON.stringify(creativeData),
    });

    return {
      success: true,
      creativeId: data.id,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// Audience Operations
// ============================================================================

/**
 * List custom audiences
 */
async function listAudiences() {
  try {
    const accountId = getAccountId();
    const data = await metaApiRequest(
      `/${accountId}/customaudiences?fields=${AUDIENCE_FIELDS}`
    );

    const audiences = (data.data || []).map((audience: any) => ({
      id: audience.id,
      name: audience.name,
      description: audience.description,
      subtype: audience.subtype,
      approximateCountLower: audience.approximate_count_lower_bound,
      approximateCountUpper: audience.approximate_count_upper_bound,
      dataSource: audience.data_source,
      deliveryStatus: audience.delivery_status,
      operationStatus: audience.operation_status,
      timeCreated: audience.time_created,
      timeUpdated: audience.time_updated,
    }));

    return {
      success: true,
      audiences,
      count: audiences.length,
      paging: data.paging,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get audience details
 */
async function getAudience(audienceId: string) {
  try {
    const data = await metaApiRequest(`/${audienceId}?fields=${AUDIENCE_FIELDS}`);

    return {
      success: true,
      audience: {
        id: data.id,
        name: data.name,
        description: data.description,
        subtype: data.subtype,
        approximateCountLower: data.approximate_count_lower_bound,
        approximateCountUpper: data.approximate_count_upper_bound,
        dataSource: data.data_source,
        deliveryStatus: data.delivery_status,
        operationStatus: data.operation_status,
        timeCreated: data.time_created,
        timeUpdated: data.time_updated,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// Insights Operations
// ============================================================================

/**
 * Get insights (performance metrics)
 */
async function getInsights(
  objectId: string,
  options: {
    level?: string;
    datePreset?: string;
    breakdowns?: string;
    timeIncrement?: string;
  } = {}
) {
  try {
    const level = options.level || "ad";
    const datePreset = options.datePreset || "last_30d";

    let endpoint = `/${objectId}/insights?fields=${INSIGHTS_FIELDS}&level=${level}&date_preset=${datePreset}`;

    if (options.breakdowns) {
      endpoint += `&breakdowns=${options.breakdowns}`;
    }

    if (options.timeIncrement) {
      endpoint += `&time_increment=${options.timeIncrement}`;
    }

    const data = await metaApiRequest(endpoint);

    const insights = (data.data || []).map((row: any) => ({
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      adsetId: row.adset_id,
      adsetName: row.adset_name,
      adId: row.ad_id,
      adName: row.ad_name,
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
      dateStart: row.date_start,
      dateStop: row.date_stop,
    }));

    return {
      success: true,
      insights,
      count: insights.length,
      paging: data.paging,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// Ad Library Operations (Competitor Research)
// ============================================================================

/**
 * Search Ad Library
 * Note: Only returns results for EU/Brazil or political ads
 */
async function searchAdLibrary(options: {
  searchTerms: string;
  country: string;
  limit?: number;
}) {
  try {
    const limit = options.limit || 50;

    const endpoint = `/ads_archive?search_terms=${encodeURIComponent(options.searchTerms)}&ad_reached_countries=['${options.country}']&ad_type=ALL&fields=id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url,page_id,page_name,publisher_platforms,estimated_audience_size&limit=${limit}`;

    const data = await metaApiRequest(endpoint);

    return {
      success: true,
      ads: data.data || [],
      count: (data.data || []).length,
      paging: data.paging,
      note: "Ad Library API only returns results for EU/Brazil or political ads. For general competitor research, use browser automation at facebook.com/ads/library",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      note: "Ad Library API only returns results for EU/Brazil or political ads. For general competitor research, use browser automation at facebook.com/ads/library",
    };
  }
}

// ============================================================================
// Media Upload Operations
// ============================================================================

/**
 * Upload image for ads
 */
async function uploadImage(filePath: string) {
  try {
    const accountId = getAccountId();

    // Read file and convert to base64
    const fileData = await Deno.readFile(filePath);
    const base64Data = btoa(String.fromCharCode(...fileData));

    const formData = new FormData();
    formData.append("access_token", ACCESS_TOKEN!);
    formData.append("bytes", base64Data);

    const response = await fetch(`${META_API_BASE}/${accountId}/adimages`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const error = data.error || { message: "Upload failed" };
      throw new Error(`Meta API error: ${error.message}`);
    }

    // Extract image hash from response
    const images = data.images || {};
    const imageData = Object.values(images)[0] as any;

    return {
      success: true,
      imageHash: imageData?.hash,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// CLI Handler
// ============================================================================

async function main() {
  const args = Deno.args;
  const command = args[0];

  if (!command) {
    console.log(
      JSON.stringify({
        success: false,
        error: "No command provided. Run with --help for usage.",
        availableCommands: [
          "test-auth",
          "account-info",
          "list-campaigns",
          "get-campaign",
          "list-adsets",
          "get-adset",
          "list-ads",
          "get-ad",
          "list-creatives",
          "get-creative",
          "list-audiences",
          "get-audience",
          "insights",
          "ad-library",
          "create-campaign",
          "update-campaign",
          "update-campaign-status",
          "create-adset",
          "update-adset",
          "update-adset-budget",
          "update-adset-status",
          "create-creative",
          "create-ad",
          "update-ad-status",
          "upload-image",
        ],
      })
    );
    Deno.exit(1);
  }

  let result: any;
  const parsedArgs = parseArgs(args.slice(1));

  try {
    switch (command) {
      case "test-auth":
        result = await testAuth();
        break;

      case "account-info":
        result = await getAccountInfo();
        break;

      // Campaign operations
      case "list-campaigns":
        result = await listCampaigns({
          status: parsedArgs.status as string,
          limit: parsedArgs.limit ? parseInt(parsedArgs.limit as string) : undefined,
        });
        break;

      case "get-campaign": {
        const campaignId = args[1];
        if (!campaignId) {
          result = { success: false, error: "Campaign ID required" };
        } else {
          result = await getCampaign(campaignId);
        }
        break;
      }

      case "create-campaign": {
        const jsonData = args[1];
        if (!jsonData) {
          result = { success: false, error: "JSON data required" };
        } else {
          result = await createCampaign(JSON.parse(jsonData));
        }
        break;
      }

      case "update-campaign": {
        const campaignId = args[1];
        const jsonData = args[2];
        if (!campaignId || !jsonData) {
          result = { success: false, error: "Campaign ID and JSON data required" };
        } else {
          result = await updateCampaign(campaignId, JSON.parse(jsonData));
        }
        break;
      }

      case "update-campaign-status": {
        const campaignId = args[1];
        const status = args[2];
        if (!campaignId || !status) {
          result = { success: false, error: "Campaign ID and status required" };
        } else {
          result = await updateCampaignStatus(campaignId, status);
        }
        break;
      }

      // Ad Set operations
      case "list-adsets":
        result = await listAdSets({
          campaignId: parsedArgs["campaign-id"] as string,
          limit: parsedArgs.limit ? parseInt(parsedArgs.limit as string) : undefined,
        });
        break;

      case "get-adset": {
        const adsetId = args[1];
        if (!adsetId) {
          result = { success: false, error: "Ad set ID required" };
        } else {
          result = await getAdSet(adsetId);
        }
        break;
      }

      case "create-adset": {
        const jsonData = args[1];
        if (!jsonData) {
          result = { success: false, error: "JSON data required" };
        } else {
          result = await createAdSet(JSON.parse(jsonData));
        }
        break;
      }

      case "update-adset": {
        const adsetId = args[1];
        const jsonData = args[2];
        if (!adsetId || !jsonData) {
          result = { success: false, error: "Ad set ID and JSON data required" };
        } else {
          result = await updateAdSet(adsetId, JSON.parse(jsonData));
        }
        break;
      }

      case "update-adset-budget": {
        const adsetId = args[1];
        const amountCents = parseInt(args[2]);
        if (!adsetId || isNaN(amountCents)) {
          result = { success: false, error: "Ad set ID and amount (cents) required" };
        } else {
          result = await updateAdSetBudget(adsetId, amountCents);
        }
        break;
      }

      case "update-adset-status": {
        const adsetId = args[1];
        const status = args[2];
        if (!adsetId || !status) {
          result = { success: false, error: "Ad set ID and status required" };
        } else {
          result = await updateAdSetStatus(adsetId, status);
        }
        break;
      }

      // Ad operations
      case "list-ads":
        result = await listAds({
          adsetId: parsedArgs["adset-id"] as string,
          limit: parsedArgs.limit ? parseInt(parsedArgs.limit as string) : undefined,
        });
        break;

      case "get-ad": {
        const adId = args[1];
        if (!adId) {
          result = { success: false, error: "Ad ID required" };
        } else {
          result = await getAd(adId);
        }
        break;
      }

      case "create-ad": {
        const jsonData = args[1];
        if (!jsonData) {
          result = { success: false, error: "JSON data required" };
        } else {
          result = await createAd(JSON.parse(jsonData));
        }
        break;
      }

      case "update-ad-status": {
        const adId = args[1];
        const status = args[2];
        if (!adId || !status) {
          result = { success: false, error: "Ad ID and status required" };
        } else {
          result = await updateAdStatus(adId, status);
        }
        break;
      }

      // Creative operations
      case "list-creatives":
        result = await listCreatives({
          limit: parsedArgs.limit ? parseInt(parsedArgs.limit as string) : undefined,
        });
        break;

      case "get-creative": {
        const creativeId = args[1];
        if (!creativeId) {
          result = { success: false, error: "Creative ID required" };
        } else {
          result = await getCreative(creativeId);
        }
        break;
      }

      case "create-creative": {
        const jsonData = args[1];
        if (!jsonData) {
          result = { success: false, error: "JSON data required" };
        } else {
          result = await createCreative(JSON.parse(jsonData));
        }
        break;
      }

      // Audience operations
      case "list-audiences":
        result = await listAudiences();
        break;

      case "get-audience": {
        const audienceId = args[1];
        if (!audienceId) {
          result = { success: false, error: "Audience ID required" };
        } else {
          result = await getAudience(audienceId);
        }
        break;
      }

      // Insights operations
      case "insights": {
        const objectId = args[1];
        if (!objectId) {
          result = { success: false, error: "Object ID required (campaign, adset, ad, or account ID)" };
        } else {
          result = await getInsights(objectId, {
            level: parsedArgs.level as string,
            datePreset: parsedArgs["date-preset"] as string,
            breakdowns: parsedArgs.breakdowns as string,
            timeIncrement: parsedArgs["time-increment"] as string,
          });
        }
        break;
      }

      // Ad Library operations
      case "ad-library": {
        const searchTerms = parsedArgs.search as string;
        const country = parsedArgs.country as string;
        if (!searchTerms || !country) {
          result = { success: false, error: "--search and --country required" };
        } else {
          result = await searchAdLibrary({
            searchTerms,
            country,
            limit: parsedArgs.limit ? parseInt(parsedArgs.limit as string) : undefined,
          });
        }
        break;
      }

      // Media upload
      case "upload-image": {
        const filePath = args[1];
        if (!filePath) {
          result = { success: false, error: "File path required" };
        } else {
          result = await uploadImage(filePath);
        }
        break;
      }

      default:
        result = {
          success: false,
          error: `Unknown command: ${command}`,
        };
    }
  } catch (error: any) {
    result = {
      success: false,
      error: error.message,
    };
  }

  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.main) {
  main();
}
