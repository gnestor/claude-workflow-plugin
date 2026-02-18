#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Google Ads API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write google-ads-client.ts <command> [args...]
 *
 * Commands:
 *   list-accounts                                              - List accessible Google Ads accounts
 *   gaql [customer-id] "<query>"                               - Execute GAQL query
 *   campaigns [customer-id] [days]                             - Campaign performance report
 *   ad-groups [customer-id] [campaign-id]                      - Ad group performance
 *   search-terms [customer-id] [days] [limit]                  - Search terms report
 *   keywords [customer-id] [campaign-id]                       - Keyword performance
 *   shopping [customer-id] [days] [limit]                      - Shopping/product performance
 *   recommendations [customer-id]                              - Get optimization recommendations
 *   update-budget <customer-id> <budget-id> <amount-micros>    - Update campaign budget
 *   update-target-roas <customer-id> <campaign-id> <target>    - Update target ROAS
 *   update-campaign-status <customer-id> <campaign-id> <status> - Enable/pause campaign
 *   update-ad-group-status <customer-id> <ad-group-id> <status> - Enable/pause ad group
 *   add-negative-keyword <customer-id> <campaign-id> "<keyword>" - Add negative keyword
 *   update-keyword-status <customer-id> <criterion-id> <status> - Enable/pause keyword
 *   apply-recommendation <customer-id> <recommendation-id>      - Apply a recommendation
 *   dismiss-recommendation <customer-id> <recommendation-id>    - Dismiss a recommendation
 *
 * Keyword Planner Commands:
 *   keyword-ideas [customer-id] "<seed-keywords>" [--url <url>] [--location <geo-id>]  - Generate keyword ideas
 *   search-volume [customer-id] "<keywords>"                    - Get search volume for keywords
 */

import "@std/dotenv/load";
import { getAccessToken as getSharedOAuthToken } from "../../scripts/google.ts";

// API configuration
const GOOGLE_ADS_API_VERSION = "v19";
const SCOPES = ["https://www.googleapis.com/auth/adwords"];

// Environment variables
const DEVELOPER_TOKEN = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
const DEFAULT_CUSTOMER_ID = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID");
const LOGIN_CUSTOMER_ID = Deno.env.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID");

/**
 * Get access token using shared Google OAuth
 */
async function getAccessToken(): Promise<string> {
  return await getSharedOAuthToken(SCOPES);
}

/**
 * Make authenticated request to Google Ads API
 */
async function googleAdsApiRequest(
  endpoint: string,
  options: RequestInit = {},
  customerId?: string
): Promise<any> {
  const accessToken = await getAccessToken();

  if (!DEVELOPER_TOKEN) {
    throw new Error(
      "GOOGLE_ADS_DEVELOPER_TOKEN not set in .env. Get your developer token at https://ads.google.com/aw/apicenter"
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": DEVELOPER_TOKEN,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add login-customer-id for manager account access
  if (LOGIN_CUSTOMER_ID) {
    headers["login-customer-id"] = LOGIN_CUSTOMER_ID;
  }

  const baseUrl = customerId
    ? `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}`
    : `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Ads API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Execute GAQL query using SearchStream
 */
async function executeGaql(customerId: string, query: string) {
  const startTime = Date.now();

  try {
    const data = await googleAdsApiRequest(
      "/googleAds:searchStream",
      {
        method: "POST",
        body: JSON.stringify({ query }),
      },
      customerId
    );

    const duration = Date.now() - startTime;

    // Flatten the streamed results
    const rows = Array.isArray(data)
      ? data.flatMap((chunk: any) => chunk.results || [])
      : data.results || [];

    return {
      success: true,
      query,
      rows,
      rowCount: rows.length,
      duration,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      query,
    };
  }
}

/**
 * List all accessible Google Ads accounts
 */
async function listAccounts() {
  try {
    const data = await googleAdsApiRequest("/customers:listAccessibleCustomers");

    // Extract customer IDs from resource names
    const customers = (data.resourceNames || []).map((name: string) => {
      const id = name.replace("customers/", "");
      return { resourceName: name, customerId: id };
    });

    return {
      success: true,
      customers,
      count: customers.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get campaign performance report
 */
async function getCampaigns(customerId: string, days: number = 30) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.bidding_strategy_type,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date DURING LAST_${days}_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `;

  const result = await executeGaql(customerId, query);

  if (result.success && result.rows) {
    // Transform rows for readability
    result.rows = result.rows.map((row: any) => ({
      id: row.campaign?.id,
      name: row.campaign?.name,
      status: row.campaign?.status,
      channelType: row.campaign?.advertisingChannelType,
      biddingStrategy: row.campaign?.biddingStrategyType,
      budgetMicros: row.campaignBudget?.amountMicros,
      budgetDollars: row.campaignBudget?.amountMicros
        ? Number(row.campaignBudget.amountMicros) / 1_000_000
        : null,
      impressions: Number(row.metrics?.impressions || 0),
      clicks: Number(row.metrics?.clicks || 0),
      costMicros: row.metrics?.costMicros,
      costDollars: row.metrics?.costMicros
        ? Number(row.metrics.costMicros) / 1_000_000
        : 0,
      conversions: Number(row.metrics?.conversions || 0),
      conversionValue: Number(row.metrics?.conversionsValue || 0),
      ctr: Number(row.metrics?.ctr || 0),
      avgCpc: row.metrics?.averageCpc
        ? Number(row.metrics.averageCpc) / 1_000_000
        : 0,
    }));
  }

  return result;
}

/**
 * Get ad group performance report
 */
async function getAdGroups(customerId: string, campaignId?: string) {
  let whereClause = "ad_group.status != 'REMOVED'";
  if (campaignId) {
    whereClause += ` AND campaign.id = ${campaignId}`;
  }

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group.status,
      ad_group.type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc
    FROM ad_group
    WHERE segments.date DURING LAST_30_DAYS
      AND ${whereClause}
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;

  const result = await executeGaql(customerId, query);

  if (result.success && result.rows) {
    result.rows = result.rows.map((row: any) => ({
      campaignId: row.campaign?.id,
      campaignName: row.campaign?.name,
      adGroupId: row.adGroup?.id,
      adGroupName: row.adGroup?.name,
      status: row.adGroup?.status,
      type: row.adGroup?.type,
      impressions: Number(row.metrics?.impressions || 0),
      clicks: Number(row.metrics?.clicks || 0),
      costDollars: row.metrics?.costMicros
        ? Number(row.metrics.costMicros) / 1_000_000
        : 0,
      conversions: Number(row.metrics?.conversions || 0),
      conversionValue: Number(row.metrics?.conversionsValue || 0),
      ctr: Number(row.metrics?.ctr || 0),
      avgCpc: row.metrics?.averageCpc
        ? Number(row.metrics.averageCpc) / 1_000_000
        : 0,
    }));
  }

  return result;
}

/**
 * Get search terms report
 */
async function getSearchTerms(
  customerId: string,
  days: number = 30,
  limit: number = 100
) {
  const query = `
    SELECT
      search_term_view.search_term,
      search_term_view.status,
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc
    FROM search_term_view
    WHERE segments.date DURING LAST_${days}_DAYS
    ORDER BY metrics.impressions DESC
    LIMIT ${limit}
  `;

  const result = await executeGaql(customerId, query);

  if (result.success && result.rows) {
    result.rows = result.rows.map((row: any) => ({
      searchTerm: row.searchTermView?.searchTerm,
      status: row.searchTermView?.status,
      campaignId: row.campaign?.id,
      campaignName: row.campaign?.name,
      adGroupId: row.adGroup?.id,
      adGroupName: row.adGroup?.name,
      impressions: Number(row.metrics?.impressions || 0),
      clicks: Number(row.metrics?.clicks || 0),
      costDollars: row.metrics?.costMicros
        ? Number(row.metrics.costMicros) / 1_000_000
        : 0,
      conversions: Number(row.metrics?.conversions || 0),
      conversionValue: Number(row.metrics?.conversionsValue || 0),
      ctr: Number(row.metrics?.ctr || 0),
      avgCpc: row.metrics?.averageCpc
        ? Number(row.metrics.averageCpc) / 1_000_000
        : 0,
    }));
  }

  return result;
}

/**
 * Get keyword performance report
 */
async function getKeywords(customerId: string, campaignId?: string) {
  let whereClause = "ad_group_criterion.status != 'REMOVED'";
  if (campaignId) {
    whereClause += ` AND campaign.id = ${campaignId}`;
  }

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc
    FROM keyword_view
    WHERE segments.date DURING LAST_30_DAYS
      AND ${whereClause}
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;

  const result = await executeGaql(customerId, query);

  if (result.success && result.rows) {
    result.rows = result.rows.map((row: any) => ({
      campaignId: row.campaign?.id,
      campaignName: row.campaign?.name,
      adGroupId: row.adGroup?.id,
      adGroupName: row.adGroup?.name,
      criterionId: row.adGroupCriterion?.criterionId,
      keyword: row.adGroupCriterion?.keyword?.text,
      matchType: row.adGroupCriterion?.keyword?.matchType,
      status: row.adGroupCriterion?.status,
      impressions: Number(row.metrics?.impressions || 0),
      clicks: Number(row.metrics?.clicks || 0),
      costDollars: row.metrics?.costMicros
        ? Number(row.metrics.costMicros) / 1_000_000
        : 0,
      conversions: Number(row.metrics?.conversions || 0),
      conversionValue: Number(row.metrics?.conversionsValue || 0),
      ctr: Number(row.metrics?.ctr || 0),
      avgCpc: row.metrics?.averageCpc
        ? Number(row.metrics.averageCpc) / 1_000_000
        : 0,
    }));
  }

  return result;
}

/**
 * Get shopping/product performance report
 */
async function getShoppingPerformance(
  customerId: string,
  days: number = 30,
  limit: number = 100
) {
  const query = `
    SELECT
      segments.product_title,
      segments.product_item_id,
      segments.product_brand,
      segments.product_type_l1,
      segments.product_type_l2,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM shopping_performance_view
    WHERE segments.date DURING LAST_${days}_DAYS
    ORDER BY metrics.conversions_value DESC
    LIMIT ${limit}
  `;

  const result = await executeGaql(customerId, query);

  if (result.success && result.rows) {
    result.rows = result.rows.map((row: any) => ({
      productTitle: row.segments?.productTitle,
      productId: row.segments?.productItemId,
      brand: row.segments?.productBrand,
      category1: row.segments?.productTypeL1,
      category2: row.segments?.productTypeL2,
      impressions: Number(row.metrics?.impressions || 0),
      clicks: Number(row.metrics?.clicks || 0),
      costDollars: row.metrics?.costMicros
        ? Number(row.metrics.costMicros) / 1_000_000
        : 0,
      conversions: Number(row.metrics?.conversions || 0),
      conversionValue: Number(row.metrics?.conversionsValue || 0),
      roas:
        row.metrics?.costMicros && Number(row.metrics.costMicros) > 0
          ? Number(row.metrics?.conversionsValue || 0) /
            (Number(row.metrics.costMicros) / 1_000_000)
          : 0,
    }));
  }

  return result;
}

/**
 * Get optimization recommendations
 */
async function getRecommendations(customerId: string) {
  const query = `
    SELECT
      recommendation.resource_name,
      recommendation.type,
      recommendation.campaign,
      recommendation.ad_group,
      recommendation.dismissed,
      recommendation.impact.base_metrics.impressions,
      recommendation.impact.base_metrics.clicks,
      recommendation.impact.base_metrics.cost_micros,
      recommendation.impact.potential_metrics.impressions,
      recommendation.impact.potential_metrics.clicks,
      recommendation.impact.potential_metrics.cost_micros
    FROM recommendation
    WHERE recommendation.dismissed = FALSE
    ORDER BY recommendation.impact.base_metrics.impressions DESC
    LIMIT 50
  `;

  const result = await executeGaql(customerId, query);

  if (result.success && result.rows) {
    result.rows = result.rows.map((row: any) => {
      const resourceName = row.recommendation?.resourceName || "";
      const recommendationId = resourceName.split("/").pop();

      return {
        resourceName,
        recommendationId,
        type: row.recommendation?.type,
        campaign: row.recommendation?.campaign,
        adGroup: row.recommendation?.adGroup,
        dismissed: row.recommendation?.dismissed,
        baseMetrics: {
          impressions: Number(
            row.recommendation?.impact?.baseMetrics?.impressions || 0
          ),
          clicks: Number(row.recommendation?.impact?.baseMetrics?.clicks || 0),
          costDollars: row.recommendation?.impact?.baseMetrics?.costMicros
            ? Number(row.recommendation.impact.baseMetrics.costMicros) /
              1_000_000
            : 0,
        },
        potentialMetrics: {
          impressions: Number(
            row.recommendation?.impact?.potentialMetrics?.impressions || 0
          ),
          clicks: Number(
            row.recommendation?.impact?.potentialMetrics?.clicks || 0
          ),
          costDollars: row.recommendation?.impact?.potentialMetrics?.costMicros
            ? Number(row.recommendation.impact.potentialMetrics.costMicros) /
              1_000_000
            : 0,
        },
      };
    });
  }

  return result;
}

/**
 * Update campaign budget
 */
async function updateBudget(
  customerId: string,
  budgetId: string,
  amountMicros: number
) {
  try {
    const data = await googleAdsApiRequest(
      "/campaignBudgets:mutate",
      {
        method: "POST",
        body: JSON.stringify({
          operations: [
            {
              update: {
                resourceName: `customers/${customerId}/campaignBudgets/${budgetId}`,
                amountMicros: String(amountMicros),
              },
              updateMask: "amountMicros",
            },
          ],
        }),
      },
      customerId
    );

    return {
      success: true,
      budgetId,
      newAmountMicros: amountMicros,
      newAmountDollars: amountMicros / 1_000_000,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      budgetId,
    };
  }
}

/**
 * Update campaign target ROAS
 */
async function updateTargetRoas(
  customerId: string,
  campaignId: string,
  targetRoas: number
) {
  try {
    const data = await googleAdsApiRequest(
      "/campaigns:mutate",
      {
        method: "POST",
        body: JSON.stringify({
          operations: [
            {
              update: {
                resourceName: `customers/${customerId}/campaigns/${campaignId}`,
                maximizeConversionValue: {
                  targetRoas: targetRoas,
                },
              },
              updateMask: "maximizeConversionValue.targetRoas",
            },
          ],
        }),
      },
      customerId
    );

    return {
      success: true,
      campaignId,
      newTargetRoas: targetRoas,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      campaignId,
    };
  }
}

/**
 * Update campaign status (ENABLED, PAUSED)
 */
async function updateCampaignStatus(
  customerId: string,
  campaignId: string,
  status: string
) {
  const validStatuses = ["ENABLED", "PAUSED"];
  const normalizedStatus = status.toUpperCase();

  if (!validStatuses.includes(normalizedStatus)) {
    return {
      success: false,
      error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
    };
  }

  try {
    const data = await googleAdsApiRequest(
      "/campaigns:mutate",
      {
        method: "POST",
        body: JSON.stringify({
          operations: [
            {
              update: {
                resourceName: `customers/${customerId}/campaigns/${campaignId}`,
                status: normalizedStatus,
              },
              updateMask: "status",
            },
          ],
        }),
      },
      customerId
    );

    return {
      success: true,
      campaignId,
      newStatus: normalizedStatus,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      campaignId,
    };
  }
}

/**
 * Update ad group status (ENABLED, PAUSED)
 */
async function updateAdGroupStatus(
  customerId: string,
  adGroupId: string,
  status: string
) {
  const validStatuses = ["ENABLED", "PAUSED"];
  const normalizedStatus = status.toUpperCase();

  if (!validStatuses.includes(normalizedStatus)) {
    return {
      success: false,
      error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
    };
  }

  try {
    const data = await googleAdsApiRequest(
      "/adGroups:mutate",
      {
        method: "POST",
        body: JSON.stringify({
          operations: [
            {
              update: {
                resourceName: `customers/${customerId}/adGroups/${adGroupId}`,
                status: normalizedStatus,
              },
              updateMask: "status",
            },
          ],
        }),
      },
      customerId
    );

    return {
      success: true,
      adGroupId,
      newStatus: normalizedStatus,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      adGroupId,
    };
  }
}

/**
 * Add negative keyword to campaign
 */
async function addNegativeKeyword(
  customerId: string,
  campaignId: string,
  keyword: string
) {
  try {
    const data = await googleAdsApiRequest(
      "/campaignCriteria:mutate",
      {
        method: "POST",
        body: JSON.stringify({
          operations: [
            {
              create: {
                campaign: `customers/${customerId}/campaigns/${campaignId}`,
                keyword: {
                  text: keyword,
                  matchType: "BROAD",
                },
                negative: true,
              },
            },
          ],
        }),
      },
      customerId
    );

    return {
      success: true,
      campaignId,
      keyword,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      campaignId,
      keyword,
    };
  }
}

/**
 * Update keyword status (ENABLED, PAUSED)
 */
async function updateKeywordStatus(
  customerId: string,
  adGroupId: string,
  criterionId: string,
  status: string
) {
  const validStatuses = ["ENABLED", "PAUSED"];
  const normalizedStatus = status.toUpperCase();

  if (!validStatuses.includes(normalizedStatus)) {
    return {
      success: false,
      error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
    };
  }

  try {
    const data = await googleAdsApiRequest(
      "/adGroupCriteria:mutate",
      {
        method: "POST",
        body: JSON.stringify({
          operations: [
            {
              update: {
                resourceName: `customers/${customerId}/adGroupCriteria/${adGroupId}~${criterionId}`,
                status: normalizedStatus,
              },
              updateMask: "status",
            },
          ],
        }),
      },
      customerId
    );

    return {
      success: true,
      criterionId,
      newStatus: normalizedStatus,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      criterionId,
    };
  }
}

/**
 * Apply a recommendation
 */
async function applyRecommendation(
  customerId: string,
  recommendationId: string
) {
  try {
    const data = await googleAdsApiRequest(
      "/recommendations:apply",
      {
        method: "POST",
        body: JSON.stringify({
          operations: [
            {
              resourceName: `customers/${customerId}/recommendations/${recommendationId}`,
            },
          ],
        }),
      },
      customerId
    );

    return {
      success: true,
      recommendationId,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      recommendationId,
    };
  }
}

/**
 * Dismiss a recommendation
 */
async function dismissRecommendation(
  customerId: string,
  recommendationId: string
) {
  try {
    const data = await googleAdsApiRequest(
      "/recommendations:dismiss",
      {
        method: "POST",
        body: JSON.stringify({
          operations: [
            {
              resourceName: `customers/${customerId}/recommendations/${recommendationId}`,
            },
          ],
        }),
      },
      customerId
    );

    return {
      success: true,
      recommendationId,
      result: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      recommendationId,
    };
  }
}

// ============================================================================
// Keyword Planner Functions
// ============================================================================

/**
 * Generate keyword ideas from seed keywords and/or URL
 *
 * Uses KeywordPlanIdeaService.GenerateKeywordIdeas
 * https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas
 */
async function generateKeywordIdeas(
  customerId: string,
  seedKeywords: string[],
  seedUrl?: string,
  geoTargetId: string = "2840", // USA by default
  languageId: string = "1000" // English by default
) {
  try {
    const requestBody: Record<string, any> = {
      // Target US, English by default
      geoTargetConstants: [`geoTargetConstants/${geoTargetId}`],
      language: `languageConstants/${languageId}`,
      // Include all networks
      keywordPlanNetwork: "GOOGLE_SEARCH_AND_PARTNERS",
      // Request historical metrics
      historicalMetricsOptions: {
        includeAverageCpc: true,
      },
    };

    // Add seed keywords if provided
    if (seedKeywords && seedKeywords.length > 0) {
      requestBody.keywordSeed = {
        keywords: seedKeywords,
      };
    }

    // Add URL seed if provided
    if (seedUrl) {
      requestBody.urlSeed = {
        url: seedUrl,
      };
    }

    // If both provided, use keyword and URL seed
    if (seedKeywords?.length > 0 && seedUrl) {
      requestBody.keywordAndUrlSeed = {
        url: seedUrl,
        keywords: seedKeywords,
      };
      delete requestBody.keywordSeed;
      delete requestBody.urlSeed;
    }

    const data = await googleAdsApiRequest(
      ":generateKeywordIdeas",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      },
      customerId
    );

    // Transform the results for readability
    const results = (data.results || []).map((result: any) => {
      const metrics = result.keywordIdeaMetrics || {};
      return {
        keyword: result.text,
        avgMonthlySearches: metrics.avgMonthlySearches
          ? Number(metrics.avgMonthlySearches)
          : null,
        competition: metrics.competition,
        competitionIndex: metrics.competitionIndex
          ? Number(metrics.competitionIndex)
          : null,
        lowTopOfPageBidMicros: metrics.lowTopOfPageBidMicros
          ? Number(metrics.lowTopOfPageBidMicros) / 1_000_000
          : null,
        highTopOfPageBidMicros: metrics.highTopOfPageBidMicros
          ? Number(metrics.highTopOfPageBidMicros) / 1_000_000
          : null,
        avgCpcMicros: metrics.averageCpcMicros
          ? Number(metrics.averageCpcMicros) / 1_000_000
          : null,
      };
    });

    return {
      success: true,
      seedKeywords,
      seedUrl,
      geoTarget: geoTargetId,
      language: languageId,
      results,
      resultCount: results.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      seedKeywords,
      seedUrl,
    };
  }
}

/**
 * Get historical search volume for specific keywords
 *
 * Uses KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics
 * https://developers.google.com/google-ads/api/docs/keyword-planning/generate-historical-metrics
 */
async function getKeywordSearchVolume(
  customerId: string,
  keywords: string[],
  geoTargetId: string = "2840", // USA by default
  languageId: string = "1000" // English by default
) {
  try {
    const requestBody = {
      keywords,
      geoTargetConstants: [`geoTargetConstants/${geoTargetId}`],
      language: `languageConstants/${languageId}`,
      keywordPlanNetwork: "GOOGLE_SEARCH_AND_PARTNERS",
      historicalMetricsOptions: {
        includeAverageCpc: true,
      },
    };

    const data = await googleAdsApiRequest(
      ":generateKeywordHistoricalMetrics",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      },
      customerId
    );

    // Transform results
    const results = (data.results || []).map((result: any) => {
      const metrics = result.keywordMetrics || {};
      const monthlySearches = metrics.monthlySearchVolumes || [];

      return {
        keyword: result.text,
        avgMonthlySearches: metrics.avgMonthlySearches
          ? Number(metrics.avgMonthlySearches)
          : null,
        competition: metrics.competition,
        competitionIndex: metrics.competitionIndex
          ? Number(metrics.competitionIndex)
          : null,
        lowTopOfPageBidDollars: metrics.lowTopOfPageBidMicros
          ? Number(metrics.lowTopOfPageBidMicros) / 1_000_000
          : null,
        highTopOfPageBidDollars: metrics.highTopOfPageBidMicros
          ? Number(metrics.highTopOfPageBidMicros) / 1_000_000
          : null,
        avgCpcDollars: metrics.averageCpcMicros
          ? Number(metrics.averageCpcMicros) / 1_000_000
          : null,
        monthlySearchVolumes: monthlySearches.map((m: any) => ({
          year: m.year,
          month: m.month,
          searches: Number(m.monthlySearches || 0),
        })),
      };
    });

    return {
      success: true,
      keywords,
      geoTarget: geoTargetId,
      language: languageId,
      results,
      resultCount: results.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      keywords,
    };
  }
}

/**
 * Get customer ID from args or environment
 */
function getCustomerId(args: string[], index: number): string | null {
  const fromArgs = args[index];
  if (fromArgs && /^\d+$/.test(fromArgs.replace(/-/g, ""))) {
    // Strip hyphens from customer ID
    return fromArgs.replace(/-/g, "");
  }
  return DEFAULT_CUSTOMER_ID?.replace(/-/g, "") || null;
}

/**
 * Main CLI handler
 */
async function main() {
  const args = Deno.args;
  const command = args[0];

  if (!command) {
    console.log(
      JSON.stringify({
        success: false,
        error: "No command provided. Run with --help for usage.",
        availableCommands: [
          "list-accounts",
          "gaql",
          "campaigns",
          "ad-groups",
          "search-terms",
          "keywords",
          "shopping",
          "recommendations",
          "update-budget",
          "update-target-roas",
          "update-campaign-status",
          "update-ad-group-status",
          "add-negative-keyword",
          "update-keyword-status",
          "apply-recommendation",
          "dismiss-recommendation",
        ],
      })
    );
    Deno.exit(1);
  }

  let result: any;

  try {
    switch (command) {
      case "list-accounts":
        result = await listAccounts();
        break;

      case "gaql": {
        const customerId = getCustomerId(args, 1);
        // If first arg is customer ID, query is second arg, else query is first arg
        const query =
          customerId === args[1]?.replace(/-/g, "") ? args[2] : args[1];
        if (!customerId) {
          result = {
            success: false,
            error:
              "Customer ID required. Set GOOGLE_ADS_CUSTOMER_ID in .env or provide as argument.",
          };
        } else if (!query) {
          result = { success: false, error: "GAQL query required" };
        } else {
          result = await executeGaql(customerId, query);
        }
        break;
      }

      case "campaigns": {
        const customerId = getCustomerId(args, 1);
        // If customer ID was provided as arg, days is in arg[2], otherwise arg[1]
        const customerIdProvided = args[1] && /^\d+$/.test(args[1].replace(/-/g, ""));
        const days = customerIdProvided ? (parseInt(args[2]) || 30) : (parseInt(args[1]) || 30);
        if (!customerId) {
          result = {
            success: false,
            error:
              "Customer ID required. Set GOOGLE_ADS_CUSTOMER_ID in .env or provide as argument.",
          };
        } else {
          result = await getCampaigns(customerId, days);
        }
        break;
      }

      case "ad-groups": {
        const customerId = getCustomerId(args, 1);
        const campaignId = args[2];
        if (!customerId) {
          result = {
            success: false,
            error:
              "Customer ID required. Set GOOGLE_ADS_CUSTOMER_ID in .env or provide as argument.",
          };
        } else {
          result = await getAdGroups(customerId, campaignId);
        }
        break;
      }

      case "search-terms": {
        const customerId = getCustomerId(args, 1);
        const days = parseInt(args[2]) || 30;
        const limit = parseInt(args[3]) || 100;
        if (!customerId) {
          result = {
            success: false,
            error:
              "Customer ID required. Set GOOGLE_ADS_CUSTOMER_ID in .env or provide as argument.",
          };
        } else {
          result = await getSearchTerms(customerId, days, limit);
        }
        break;
      }

      case "keywords": {
        const customerId = getCustomerId(args, 1);
        const campaignId = args[2];
        if (!customerId) {
          result = {
            success: false,
            error:
              "Customer ID required. Set GOOGLE_ADS_CUSTOMER_ID in .env or provide as argument.",
          };
        } else {
          result = await getKeywords(customerId, campaignId);
        }
        break;
      }

      case "shopping": {
        const customerId = getCustomerId(args, 1);
        const days = parseInt(args[2]) || 30;
        const limit = parseInt(args[3]) || 100;
        if (!customerId) {
          result = {
            success: false,
            error:
              "Customer ID required. Set GOOGLE_ADS_CUSTOMER_ID in .env or provide as argument.",
          };
        } else {
          result = await getShoppingPerformance(customerId, days, limit);
        }
        break;
      }

      case "recommendations": {
        const customerId = getCustomerId(args, 1);
        if (!customerId) {
          result = {
            success: false,
            error:
              "Customer ID required. Set GOOGLE_ADS_CUSTOMER_ID in .env or provide as argument.",
          };
        } else {
          result = await getRecommendations(customerId);
        }
        break;
      }

      case "update-budget": {
        const customerId = args[1]?.replace(/-/g, "");
        const budgetId = args[2];
        const amountMicros = parseInt(args[3]);
        if (!customerId || !budgetId || isNaN(amountMicros)) {
          result = {
            success: false,
            error:
              "Usage: update-budget <customer-id> <budget-id> <amount-micros>",
          };
        } else {
          result = await updateBudget(customerId, budgetId, amountMicros);
        }
        break;
      }

      case "update-target-roas": {
        const customerId = args[1]?.replace(/-/g, "");
        const campaignId = args[2];
        const targetRoas = parseFloat(args[3]);
        if (!customerId || !campaignId || isNaN(targetRoas)) {
          result = {
            success: false,
            error:
              "Usage: update-target-roas <customer-id> <campaign-id> <target-roas>",
          };
        } else {
          result = await updateTargetRoas(customerId, campaignId, targetRoas);
        }
        break;
      }

      case "update-campaign-status": {
        const customerId = args[1]?.replace(/-/g, "");
        const campaignId = args[2];
        const status = args[3];
        if (!customerId || !campaignId || !status) {
          result = {
            success: false,
            error:
              "Usage: update-campaign-status <customer-id> <campaign-id> <status>",
          };
        } else {
          result = await updateCampaignStatus(customerId, campaignId, status);
        }
        break;
      }

      case "update-ad-group-status": {
        const customerId = args[1]?.replace(/-/g, "");
        const adGroupId = args[2];
        const status = args[3];
        if (!customerId || !adGroupId || !status) {
          result = {
            success: false,
            error:
              "Usage: update-ad-group-status <customer-id> <ad-group-id> <status>",
          };
        } else {
          result = await updateAdGroupStatus(customerId, adGroupId, status);
        }
        break;
      }

      case "add-negative-keyword": {
        const customerId = args[1]?.replace(/-/g, "");
        const campaignId = args[2];
        const keyword = args[3];
        if (!customerId || !campaignId || !keyword) {
          result = {
            success: false,
            error:
              'Usage: add-negative-keyword <customer-id> <campaign-id> "<keyword>"',
          };
        } else {
          result = await addNegativeKeyword(customerId, campaignId, keyword);
        }
        break;
      }

      case "update-keyword-status": {
        const customerId = args[1]?.replace(/-/g, "");
        const adGroupId = args[2];
        const criterionId = args[3];
        const status = args[4];
        if (!customerId || !adGroupId || !criterionId || !status) {
          result = {
            success: false,
            error:
              "Usage: update-keyword-status <customer-id> <ad-group-id> <criterion-id> <status>",
          };
        } else {
          result = await updateKeywordStatus(
            customerId,
            adGroupId,
            criterionId,
            status
          );
        }
        break;
      }

      case "apply-recommendation": {
        const customerId = args[1]?.replace(/-/g, "");
        const recommendationId = args[2];
        if (!customerId || !recommendationId) {
          result = {
            success: false,
            error:
              "Usage: apply-recommendation <customer-id> <recommendation-id>",
          };
        } else {
          result = await applyRecommendation(customerId, recommendationId);
        }
        break;
      }

      case "dismiss-recommendation": {
        const customerId = args[1]?.replace(/-/g, "");
        const recommendationId = args[2];
        if (!customerId || !recommendationId) {
          result = {
            success: false,
            error:
              "Usage: dismiss-recommendation <customer-id> <recommendation-id>",
          };
        } else {
          result = await dismissRecommendation(customerId, recommendationId);
        }
        break;
      }

      // Keyword Planner Commands
      case "keyword-ideas": {
        const customerId = getCustomerId(args, 1);
        // Parse arguments - look for seed keywords and optional flags
        const customerIdProvided = args[1] && /^\d+$/.test(args[1].replace(/-/g, ""));
        const startIdx = customerIdProvided ? 2 : 1;

        // Find the seed keywords (first non-flag argument after customer ID)
        let seedKeywordsStr = "";
        let seedUrl: string | undefined;
        let geoTargetId = "2840"; // USA default

        for (let i = startIdx; i < args.length; i++) {
          if (args[i] === "--url" && args[i + 1]) {
            seedUrl = args[i + 1];
            i++;
          } else if (args[i] === "--location" && args[i + 1]) {
            geoTargetId = args[i + 1];
            i++;
          } else if (!args[i].startsWith("--")) {
            seedKeywordsStr = args[i];
          }
        }

        const seedKeywords = seedKeywordsStr
          ? seedKeywordsStr.split(",").map((k) => k.trim())
          : [];

        if (!customerId) {
          result = {
            success: false,
            error:
              "Customer ID required. Set GOOGLE_ADS_CUSTOMER_ID in .env or provide as argument.",
          };
        } else if (seedKeywords.length === 0 && !seedUrl) {
          result = {
            success: false,
            error:
              'Usage: keyword-ideas [customer-id] "keyword1,keyword2" [--url <url>] [--location <geo-id>]',
            examples: [
              'keyword-ideas "corduroy shorts,vintage shorts"',
              'keyword-ideas --url https://example.com',
              'keyword-ideas "shorts" --url https://example.com --location 2840',
            ],
            commonGeoTargets: {
              "2840": "United States",
              "2826": "United Kingdom",
              "2124": "Canada",
              "2036": "Australia",
            },
          };
        } else {
          result = await generateKeywordIdeas(
            customerId,
            seedKeywords,
            seedUrl,
            geoTargetId
          );
        }
        break;
      }

      case "search-volume": {
        const customerId = getCustomerId(args, 1);
        const customerIdProvided = args[1] && /^\d+$/.test(args[1].replace(/-/g, ""));
        const keywordsArg = customerIdProvided ? args[2] : args[1];

        if (!customerId) {
          result = {
            success: false,
            error:
              "Customer ID required. Set GOOGLE_ADS_CUSTOMER_ID in .env or provide as argument.",
          };
        } else if (!keywordsArg) {
          result = {
            success: false,
            error: 'Usage: search-volume [customer-id] "keyword1,keyword2,keyword3"',
            examples: [
              'search-volume "corduroy shorts,bell bottoms,dolphin shorts"',
              'search-volume 1234567890 "vintage shorts"',
            ],
          };
        } else {
          const keywords = keywordsArg.split(",").map((k) => k.trim());
          result = await getKeywordSearchVolume(customerId, keywords);
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
