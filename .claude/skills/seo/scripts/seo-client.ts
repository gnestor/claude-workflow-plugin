#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * SEO Research & Optimization Client for Claude Code Skill
 *
 * This CLI orchestrates SEO workflows by integrating with:
 * - Google Search Console (keyword data)
 * - Shopify/PostgreSQL (product catalog)
 * - Google Analytics (traffic data)
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write seo-client.ts <command> [args...]
 *
 * Commands:
 *   analyze <domain>                    - Analyze search performance for a domain
 *   keywords <domain> [--days N]        - Generate keyword opportunity report
 *   score <impressions> <ctr> <position> - Calculate opportunity score for a keyword
 *   audit <product-handle>              - Audit single product SEO
 *   export <format> [--output file]     - Export results (csv, json, md)
 *   help                                - Show usage information
 */

import "@std/dotenv/load";

// ============================================================================
// Types
// ============================================================================

interface KeywordData {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface ScoredKeyword extends KeywordData {
  opportunityScore: number;
  tier: string;
  positionWeight: number;
  intent: string;
  intentMultiplier: number;
}

interface ProductSEOAudit {
  handle: string;
  title: string;
  currentMetaTitle: string;
  currentMetaDescription: string;
  wordCount: number;
  keywordsPresent: string[];
  keywordsMissing: string[];
  seoScore: number;
  issues: string[];
  recommendations: string[];
}

interface SEOReport {
  generatedAt: string;
  domain: string;
  analysisPeriodDays: number;
  summary: {
    keywordsAnalyzed: number;
    criticalOpportunities: number;
    highOpportunities: number;
    mediumOpportunities: number;
  };
  keywords: ScoredKeyword[];
}

// ============================================================================
// Search Intent Classification
// ============================================================================

/**
 * Classify search intent based on keyword signals
 * Returns intent type and scoring multiplier
 */
function classifyIntent(keyword: string): { intent: string; multiplier: number } {
  const kw = keyword.toLowerCase();

  // Transactional signals - highest value
  if (/\b(buy|shop|order|purchase|price|cheap|deal|discount|coupon|sale|free shipping)\b/.test(kw)) {
    return { intent: "transactional", multiplier: 2.0 };
  }

  // Commercial investigation signals - high value
  if (/\b(best|top|review|vs|versus|compare|comparison|alternative|worth it|rated)\b/.test(kw)) {
    return { intent: "commercial", multiplier: 1.5 };
  }

  // Navigational signals (brand-specific) - lower value, already converting
  // Add your brand name to the regex below for navigational intent detection
  if (/\b(website|official|login|account|store)\b/.test(kw)) {
    return { intent: "navigational", multiplier: 0.8 };
  }

  // Informational signals - awareness stage
  if (/\b(what|how|why|when|where|who|guide|tutorial|history|meaning|are|is)\b/.test(kw)) {
    return { intent: "informational", multiplier: 1.0 };
  }

  // Default: assume commercial intent for product-related terms
  return { intent: "commercial", multiplier: 1.0 };
}

// ============================================================================
// Opportunity Scoring
// ============================================================================

/**
 * Calculate opportunity score for a keyword
 *
 * Formula: (impressions × (1 - ctr) × positionWeight × intentMultiplier) / 1000
 * Position weight: max(0.1, (50 - position) / 50)
 */
function calculateOpportunityScore(
  impressions: number,
  ctr: number,
  position: number,
  intentMultiplier: number = 1.0
): { score: number; positionWeight: number; tier: string } {
  const positionWeight = Math.max(0.1, (50 - position) / 50);
  const score = Math.round((impressions * (1 - ctr) * positionWeight * intentMultiplier) / 1000);

  let tier: string;
  if (score >= 90) tier = "Critical";
  else if (score >= 70) tier = "High";
  else if (score >= 50) tier = "Medium";
  else if (score >= 30) tier = "Low";
  else tier = "Monitor";

  return { score, positionWeight, tier };
}

/**
 * Score a list of keywords with intent classification
 */
function scoreKeywords(keywords: KeywordData[]): ScoredKeyword[] {
  return keywords.map((kw) => {
    const { intent, multiplier } = classifyIntent(kw.keyword);
    const { score, positionWeight, tier } = calculateOpportunityScore(
      kw.impressions,
      kw.ctr,
      kw.position,
      multiplier
    );
    return {
      ...kw,
      opportunityScore: score,
      tier,
      positionWeight,
      intent,
      intentMultiplier: multiplier,
    };
  });
}

// ============================================================================
// CTR Benchmarks & Forecasting
// ============================================================================

/**
 * CTR benchmarks by position (blended desktop/mobile averages)
 * Based on 2024-2025 industry research
 */
const CTR_BENCHMARKS: Record<number, number> = {
  1: 0.276,
  2: 0.214,
  3: 0.162,
  4: 0.117,
  5: 0.081,
  6: 0.052,
  7: 0.034,
  8: 0.025,
  9: 0.019,
  10: 0.014,
};

/**
 * Get CTR benchmark for a given position
 */
function getCTRBenchmark(position: number): number {
  if (position <= 0) return 0.276;
  if (position <= 10) {
    const floor = Math.floor(position);
    const ceil = Math.ceil(position);
    if (floor === ceil) return CTR_BENCHMARKS[floor];
    // Interpolate between positions
    const floorCTR = CTR_BENCHMARKS[floor];
    const ceilCTR = CTR_BENCHMARKS[ceil];
    return floorCTR + (ceilCTR - floorCTR) * (position - floor);
  }
  if (position <= 20) return 0.007;
  if (position <= 30) return 0.0025;
  if (position <= 50) return 0.0009;
  return 0.0003;
}

/**
 * Forecast traffic gain from position improvement
 */
interface ForecastResult {
  impressions: number;
  currentPosition: number;
  targetPosition: number;
  currentCTR: number;
  targetCTR: number;
  forecastedClicks: number;
  confidence: "high" | "medium" | "low";
  range: {
    conservative: number;
    optimistic: number;
  };
  revenueEstimate?: {
    monthlyClicks: number;
    monthlyRevenue: number;
    annualRevenue: number;
    assumptions: {
      conversionRate: number;
      avgOrderValue: number;
    };
  };
}

function forecastTrafficGain(
  impressions: number,
  currentPosition: number,
  targetPosition: number,
  options?: {
    conversionRate?: number;
    avgOrderValue?: number;
  }
): ForecastResult {
  const currentCTR = getCTRBenchmark(currentPosition);
  const targetCTR = getCTRBenchmark(targetPosition);
  const forecastedClicks = Math.round(impressions * (targetCTR - currentCTR));

  // Determine confidence level
  let confidence: "high" | "medium" | "low";
  if (currentPosition <= 10 && targetPosition <= 10) {
    confidence = "high";
  } else if (currentPosition <= 30) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  // Calculate range
  const conservativeMultiplier = confidence === "high" ? 0.8 : confidence === "medium" ? 0.7 : 0.5;
  const optimisticMultiplier = confidence === "high" ? 1.2 : confidence === "medium" ? 1.3 : 1.5;

  const result: ForecastResult = {
    impressions,
    currentPosition,
    targetPosition,
    currentCTR,
    targetCTR,
    forecastedClicks: Math.max(0, forecastedClicks),
    confidence,
    range: {
      conservative: Math.max(0, Math.round(forecastedClicks * conservativeMultiplier)),
      optimistic: Math.round(forecastedClicks * optimisticMultiplier),
    },
  };

  // Add revenue estimate if conversion data provided
  if (options?.conversionRate && options?.avgOrderValue) {
    const monthlyClicks = Math.max(0, forecastedClicks);
    const monthlyRevenue = monthlyClicks * options.conversionRate * options.avgOrderValue;
    result.revenueEstimate = {
      monthlyClicks,
      monthlyRevenue: Math.round(monthlyRevenue),
      annualRevenue: Math.round(monthlyRevenue * 12),
      assumptions: {
        conversionRate: options.conversionRate,
        avgOrderValue: options.avgOrderValue,
      },
    };
  }

  return result;
}

/**
 * Run forecast and output results
 */
function runForecast(
  impressions: number,
  currentPosition: number,
  targetPosition: number,
  keyword?: string,
  conversionRate?: number,
  avgOrderValue?: number
): void {
  const forecast = forecastTrafficGain(impressions, currentPosition, targetPosition, {
    conversionRate,
    avgOrderValue,
  });

  console.log(JSON.stringify({
    success: true,
    keyword: keyword || "(not specified)",
    forecast: {
      impressions: forecast.impressions,
      currentPosition: forecast.currentPosition,
      targetPosition: forecast.targetPosition,
      currentCTR: (forecast.currentCTR * 100).toFixed(2) + "%",
      targetCTR: (forecast.targetCTR * 100).toFixed(2) + "%",
      forecastedClicks: forecast.forecastedClicks,
      confidence: forecast.confidence,
      range: {
        conservative: forecast.range.conservative,
        optimistic: forecast.range.optimistic,
      },
    },
    revenue: forecast.revenueEstimate ? {
      monthlyClicks: forecast.revenueEstimate.monthlyClicks,
      monthlyRevenue: "$" + forecast.revenueEstimate.monthlyRevenue.toLocaleString(),
      annualRevenue: "$" + forecast.revenueEstimate.annualRevenue.toLocaleString(),
      assumptions: {
        conversionRate: (forecast.revenueEstimate.assumptions.conversionRate * 100).toFixed(1) + "%",
        avgOrderValue: "$" + forecast.revenueEstimate.assumptions.avgOrderValue,
      },
    } : {
      note: "Add --conversion-rate and --aov to estimate revenue",
    },
    interpretation: getForecastInterpretation(forecast),
  }, null, 2));
}

function getForecastInterpretation(forecast: ForecastResult): string {
  if (forecast.forecastedClicks <= 0) {
    return "No traffic gain expected - target position must be better than current position.";
  }

  const confidenceNote = forecast.confidence === "high"
    ? "High confidence forecast based on stable first-page positions."
    : forecast.confidence === "medium"
    ? "Medium confidence - actual results may vary by 30%."
    : "Low confidence - treat as directional guidance only.";

  return `Moving from position ${forecast.currentPosition.toFixed(1)} to ${forecast.targetPosition.toFixed(1)} could generate ~${forecast.forecastedClicks.toLocaleString()} additional monthly clicks. ${confidenceNote}`;
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze domain search performance
 */
async function analyzeDomain(domain: string, days: number = 90): Promise<void> {
  console.log(JSON.stringify({
    success: true,
    message: "Domain analysis requires Google Search Console data",
    instructions: [
      "1. Run Google Search Console query for the domain:",
      `   deno run --allow-net --allow-env --allow-read \\`,
      `     .claude/skills/google/search-console/scripts/gsc-client.ts \\`,
      `     top-queries sc-domain:${domain} ${days} 100`,
      "",
      "2. Use the returned data with the 'keywords' command to score opportunities",
      "",
      "3. Or pipe the output directly:",
      `   gsc-client.ts top-queries sc-domain:${domain} ${days} | seo-client.ts keywords`,
    ],
    domain,
    analysisPeriodDays: days,
  }, null, 2));
}

/**
 * Generate keyword opportunity report from provided data
 */
async function generateKeywordReport(
  domain: string,
  days: number = 90
): Promise<void> {
  // Read from stdin if available
  let inputData: string | null = null;

  try {
    // Check if there's data on stdin (non-blocking)
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(1024 * 1024); // 1MB buffer
    const bytesRead = await Deno.stdin.read(buffer);

    if (bytesRead && bytesRead > 0) {
      inputData = decoder.decode(buffer.subarray(0, bytesRead));
    }
  } catch {
    // No stdin data available
  }

  if (inputData) {
    try {
      const data = JSON.parse(inputData);
      const keywords: KeywordData[] = (data.topQueries || data.rows || []).map(
        (row: Record<string, unknown>) => ({
          keyword: row.query || row.keys?.[0] || "",
          impressions: row.impressions || 0,
          clicks: row.clicks || 0,
          ctr: typeof row.ctr === "string"
            ? parseFloat(row.ctr) / 100
            : row.ctr || 0,
          position: typeof row.position === "string"
            ? parseFloat(row.position)
            : row.position || 0,
        })
      );

      const scoredKeywords = scoreKeywords(keywords);
      const sortedKeywords = scoredKeywords.sort(
        (a, b) => b.opportunityScore - a.opportunityScore
      );

      const report: SEOReport = {
        generatedAt: new Date().toISOString(),
        domain,
        analysisPeriodDays: days,
        summary: {
          keywordsAnalyzed: sortedKeywords.length,
          criticalOpportunities: sortedKeywords.filter((k) => k.tier === "Critical").length,
          highOpportunities: sortedKeywords.filter((k) => k.tier === "High").length,
          mediumOpportunities: sortedKeywords.filter((k) => k.tier === "Medium").length,
        },
        keywords: sortedKeywords,
      };

      console.log(JSON.stringify(report, null, 2));
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to parse input data: ${error.message}`,
      }));
    }
  } else {
    console.log(JSON.stringify({
      success: true,
      message: "Keyword report generation requires Search Console data",
      instructions: [
        "Option 1: Pipe GSC data directly:",
        `  deno run --allow-net --allow-env --allow-read \\`,
        `    .claude/skills/google/search-console/scripts/gsc-client.ts \\`,
        `    top-queries sc-domain:${domain} ${days} 100 | \\`,
        `  deno run --allow-net --allow-env --allow-read --allow-write \\`,
        `    .claude/skills/seo/scripts/seo-client.ts keywords ${domain}`,
        "",
        "Option 2: Save GSC data first:",
        `  1. gsc-client.ts top-queries sc-domain:${domain} ${days} > keywords.json`,
        `  2. cat keywords.json | seo-client.ts keywords ${domain}`,
        "",
        "Option 3: Use individual score command:",
        `  seo-client.ts score <impressions> <ctr> <position>`,
      ],
      domain,
      analysisPeriodDays: days,
    }, null, 2));
  }
}

/**
 * Score a single keyword
 */
function scoreKeyword(
  impressions: number,
  ctr: number,
  position: number,
  keyword?: string
): void {
  const { intent, multiplier } = keyword
    ? classifyIntent(keyword)
    : { intent: "commercial", multiplier: 1.0 };

  const { score, positionWeight, tier } = calculateOpportunityScore(
    impressions,
    ctr,
    position,
    multiplier
  );

  console.log(JSON.stringify({
    success: true,
    input: {
      impressions,
      ctr: (ctr * 100).toFixed(2) + "%",
      position: position.toFixed(1),
      keyword: keyword || "(not provided)",
    },
    intent: {
      classification: intent,
      multiplier: multiplier,
    },
    calculation: {
      positionWeight: positionWeight.toFixed(3),
      intentMultiplier: multiplier.toFixed(1),
      formula: `(${impressions} × (1 - ${ctr.toFixed(4)}) × ${positionWeight.toFixed(3)} × ${multiplier.toFixed(1)}) / 1000`,
    },
    result: {
      opportunityScore: score,
      tier,
    },
    interpretation: getScoreInterpretation(score, tier, intent),
  }, null, 2));
}

function getScoreInterpretation(score: number, tier: string, intent?: string): string {
  const intentNote = intent === "transactional"
    ? " High purchase intent - prioritize even at lower scores."
    : intent === "commercial"
    ? " Good commercial intent - potential buyers researching."
    : intent === "navigational"
    ? " Brand search - already aware, focus on conversion."
    : "";

  switch (tier) {
    case "Critical":
      return "Immediate optimization required. High impressions with low CTR - significant traffic opportunity." + intentNote;
    case "High":
      return "Prioritize in next content update. Good opportunity for CTR improvement." + intentNote;
    case "Medium":
      return "Include in quarterly review. Moderate optimization potential." + intentNote;
    case "Low":
      return "Monitor but don't prioritize. Limited impact expected." + intentNote;
    default:
      return "Track for future reference. Currently low priority." + intentNote;
  }
}

/**
 * Audit a single product's SEO
 */
async function auditProduct(handle: string): Promise<void> {
  console.log(JSON.stringify({
    success: true,
    message: "Product SEO audit requires product data from Shopify",
    instructions: [
      "1. Fetch product data:",
      `   deno run --allow-net --allow-env --allow-read \\`,
      `     .claude/skills/shopify/scripts/shopify-client.ts \\`,
      `     product ${handle}`,
      "",
      "2. Manual audit checklist:",
      "   □ Meta title present and 50-60 characters",
      "   □ Meta description present and 150-160 characters",
      "   □ Primary keyword in first paragraph",
      "   □ Gender modifier included (men's/women's)",
      "   □ Material mentioned in description",
      "   □ Era/style keyword present (vintage, retro, 70s, 80s)",
      "   □ Brand tagline included",
      "",
      "3. Check Search Console for keyword data:",
      `   deno run --allow-net --allow-env --allow-read \\`,
      `     .claude/skills/google/search-console/scripts/gsc-client.ts \\`,
      `     inspect-url sc-domain:example.com https://example.com/products/${handle}`,
    ],
    productHandle: handle,
  }, null, 2));
}

/**
 * Analyze content gaps between owned keywords and competitor keywords
 */
interface GapAnalysisResult {
  keyword: string;
  yourPosition: number | null;
  competitor: string;
  competitorPosition: number;
  gapType: "content_gap" | "ranking_gap" | "format_gap";
  volumeEstimate: number;
  priority: string;
  intent: string;
}

async function analyzeContentGaps(
  ownedFile?: string,
  competitorFile?: string
): Promise<void> {
  // Read owned keywords from stdin or file
  let ownedKeywords: Map<string, number> = new Map();
  let competitorKeywords: { keyword: string; position: number; source: string }[] = [];

  // Try to read from stdin
  try {
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(1024 * 1024);
    const bytesRead = await Deno.stdin.read(buffer);

    if (bytesRead && bytesRead > 0) {
      const inputData = decoder.decode(buffer.subarray(0, bytesRead));
      try {
        const data = JSON.parse(inputData);

        // Handle GSC format
        if (data.topQueries || data.rows) {
          const queries = data.topQueries || data.rows || [];
          for (const row of queries) {
            const keyword = row.query || row.keys?.[0] || "";
            const position = typeof row.position === "string"
              ? parseFloat(row.position)
              : row.position || 100;
            if (keyword && position < 50) {
              ownedKeywords.set(keyword.toLowerCase(), position);
            }
          }
        }
      } catch {
        // Try CSV format
        const lines = inputData.trim().split("\n");
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(",");
          if (parts.length >= 2) {
            const keyword = parts[0].replace(/"/g, "").toLowerCase();
            const position = parseFloat(parts[parts.length - 2]) || 100;
            if (keyword && position < 50) {
              ownedKeywords.set(keyword, position);
            }
          }
        }
      }
    }
  } catch {
    // No stdin data
  }

  // If no data provided, show instructions
  if (ownedKeywords.size === 0) {
    console.log(JSON.stringify({
      success: true,
      message: "Content gap analysis requires keyword data",
      instructions: [
        "## Step 1: Export your keywords from GSC",
        "",
        "deno run --allow-net --allow-env --allow-read \\",
        "  .claude/skills/google/search-console/scripts/gsc-client.ts \\",
        "  top-queries sc-domain:example.com 90 500 > owned-keywords.json",
        "",
        "## Step 2: Research competitor keywords manually",
        "",
        "Create a CSV file with competitor keywords:",
        "```",
        "keyword,position,source",
        "how to style shorts,3,chubbies.com",
        "best summer shorts,1,gq.com",
        "```",
        "",
        "## Step 3: Run gap analysis",
        "",
        "cat owned-keywords.json | deno run --allow-net --allow-env --allow-read --allow-write \\",
        "  .claude/skills/seo/scripts/seo-client.ts gaps \\",
        "  --competitor competitor-keywords.csv",
        "",
        "## Alternative: Quick gap identification",
        "",
        "Pipe your GSC data to identify keywords with improvement potential:",
        "",
        "cat owned-keywords.json | deno run --allow-net --allow-env --allow-read --allow-write \\",
        "  .claude/skills/seo/scripts/seo-client.ts gaps",
        "",
        "This will identify keywords where you rank but could improve.",
      ],
      workflow: "See: references/workflows/content-gaps.md",
    }, null, 2));
    return;
  }

  // Identify gap opportunities from owned keywords
  const gaps: GapAnalysisResult[] = [];

  for (const [keyword, position] of ownedKeywords) {
    const { intent, multiplier } = classifyIntent(keyword);

    // Ranking gaps: keywords where we rank 11-50 (page 2+)
    if (position >= 11 && position <= 50) {
      const volumeEstimate = Math.round(100 - position) * 10; // Rough estimate
      const score = volumeEstimate * multiplier;

      gaps.push({
        keyword,
        yourPosition: position,
        competitor: "(SERP analysis needed)",
        competitorPosition: 0,
        gapType: "ranking_gap",
        volumeEstimate,
        priority: score >= 100 ? "P2" : score >= 50 ? "P3" : "P4",
        intent,
      });
    }
  }

  // Sort by priority and position
  gaps.sort((a, b) => {
    const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
    const priorityDiff = (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
    if (priorityDiff !== 0) return priorityDiff;
    return (a.yourPosition || 100) - (b.yourPosition || 100);
  });

  const report = {
    success: true,
    generatedAt: new Date().toISOString(),
    summary: {
      ownedKeywords: ownedKeywords.size,
      rankingGaps: gaps.filter(g => g.gapType === "ranking_gap").length,
      contentGaps: gaps.filter(g => g.gapType === "content_gap").length,
      p1Opportunities: gaps.filter(g => g.priority === "P1").length,
      p2Opportunities: gaps.filter(g => g.priority === "P2").length,
    },
    gaps: gaps.slice(0, 50), // Top 50 gaps
    nextSteps: [
      "1. For ranking gaps: Analyze top 3 SERP results for each keyword",
      "2. For content gaps: Create content briefs using workflow",
      "3. Prioritize P1/P2 opportunities for immediate action",
      "4. See: references/workflows/content-gaps.md for full process",
    ],
  };

  console.log(JSON.stringify(report, null, 2));
}

/**
 * AI Citation Tracking
 */
interface AICitationQuery {
  query: string;
  category: "brand" | "product" | "informational" | "comparison" | "purchase";
}

// Default queries to track for AI citations
const DEFAULT_AI_TRACKING_QUERIES: AICitationQuery[] = [
  // Brand queries
  { query: "what is [brand]", category: "brand" },
  { query: "[brand] [product]", category: "brand" },
  { query: "[brand] clothing", category: "brand" },
  // Product queries
  { query: "best [product category]", category: "product" },
  { query: "[product type] for men", category: "product" },
  { query: "vintage style [product] men", category: "product" },
  // Informational queries
  { query: "what are [product type]", category: "informational" },
  { query: "history of [material]", category: "informational" },
  { query: "[era] fashion [product]", category: "informational" },
  // Comparison queries
  { query: "[brand] vs [competitor]", category: "comparison" },
  { query: "best [product category] brands", category: "comparison" },
  // Purchase queries
  { query: "where to buy [product type]", category: "purchase" },
  { query: "[product type] online", category: "purchase" },
];

function analyzeAICitations(action?: string): void {
  if (action === "queries") {
    console.log(JSON.stringify({
      success: true,
      message: "AI Citation Tracking Queries",
      queries: DEFAULT_AI_TRACKING_QUERIES,
      byCategory: {
        brand: DEFAULT_AI_TRACKING_QUERIES.filter(q => q.category === "brand").length,
        product: DEFAULT_AI_TRACKING_QUERIES.filter(q => q.category === "product").length,
        informational: DEFAULT_AI_TRACKING_QUERIES.filter(q => q.category === "informational").length,
        comparison: DEFAULT_AI_TRACKING_QUERIES.filter(q => q.category === "comparison").length,
        purchase: DEFAULT_AI_TRACKING_QUERIES.filter(q => q.category === "purchase").length,
      },
      instructions: [
        "To customize tracking queries, edit DEFAULT_AI_TRACKING_QUERIES in seo-client.ts",
        "Or create a tracking-queries.json file in workflows/seo/ai-citations/",
      ],
    }, null, 2));
    return;
  }

  if (action === "template") {
    const template = {
      date: new Date().toISOString().split("T")[0],
      query: "[search query]",
      platform: "google_aio | chatgpt | perplexity | bing_copilot",
      cited: true,
      citation_type: "direct_link | brand_mention | paraphrase | none",
      position: "1-5 or null",
      our_url_if_cited: "https://example.com/...",
      competitors_cited: ["competitor1.com", "competitor2.com"],
      content_cited_url: "URL of competitor content that was cited instead",
      notes: "Observations and action items",
    };

    console.log(JSON.stringify({
      success: true,
      message: "AI Citation Tracking Template",
      template,
      csvFormat: "date,query,platform,cited,citation_type,position,competitors_cited,our_url_if_cited,notes",
      usage: [
        "Use this template to log AI citation checks",
        "Save results to: workflows/seo/ai-citations/tracking/",
        "Recommended: Check each platform weekly for top 10 queries",
      ],
    }, null, 2));
    return;
  }

  if (action === "schedule") {
    console.log(JSON.stringify({
      success: true,
      message: "Recommended AI Citation Tracking Schedule",
      weeklySchedule: {
        monday: { platform: "Google AI Overview", queries: 10, time: "30 min" },
        tuesday: { platform: "ChatGPT", queries: 10, time: "30 min" },
        wednesday: { platform: "Perplexity", queries: 10, time: "30 min" },
        thursday: { platform: "Bing Copilot", queries: 10, time: "30 min" },
        friday: { platform: "Analysis & Logging", queries: 0, time: "30 min" },
      },
      monthlyAnalysis: [
        "Compile weekly results into monthly report",
        "Calculate citation rate by platform and category",
        "Identify content gaps from competitors who are cited",
        "Create optimization recommendations",
      ],
      outputFiles: [
        "workflows/seo/ai-citations/tracking/citation-log-[date].csv",
        "workflows/seo/ai-citations/reports/weekly-report-[date].md",
        "workflows/seo/ai-citations/reports/monthly-dashboard.csv",
      ],
    }, null, 2));
    return;
  }

  if (action === "metrics") {
    console.log(JSON.stringify({
      success: true,
      message: "AI Citation Tracking Metrics",
      keyMetrics: [
        {
          metric: "Citation Rate",
          definition: "% of tracked queries where our content is cited",
          target: ">30%",
          calculation: "(citations / total_queries) × 100",
        },
        {
          metric: "Brand Mention Rate",
          definition: "% of queries where brand name appears",
          target: ">50% for brand queries",
          calculation: "(brand_mentions / brand_queries) × 100",
        },
        {
          metric: "Citation Position",
          definition: "Average position when cited (1-5 sources)",
          target: "Top 3",
          calculation: "sum(positions) / citations_count",
        },
        {
          metric: "Competitor Gap",
          definition: "Difference between our citations and top competitor",
          target: "Positive (we > them)",
          calculation: "our_citations - competitor_citations",
        },
      ],
      successTargets: {
        "6_months": {
          overall_citation_rate: "40%",
          brand_query_citations: "80%",
          product_query_citations: "35%",
          competitor_gap: "+5",
        },
      },
    }, null, 2));
    return;
  }

  // Default: show overview
  console.log(JSON.stringify({
    success: true,
    message: "AI Citation Tracking Tools",
    description: "Monitor and optimize presence in AI-generated search responses",
    commands: {
      "ai-tracking queries": "Show queries to track",
      "ai-tracking template": "Get citation logging template",
      "ai-tracking schedule": "View recommended tracking schedule",
      "ai-tracking metrics": "See key metrics and targets",
    },
    platforms: [
      { name: "Google AI Overviews", share: "~60%", priority: "High" },
      { name: "ChatGPT Search", share: "~15%", priority: "Medium" },
      { name: "Perplexity", share: "~10%", priority: "Medium" },
      { name: "Bing Copilot", share: "~8%", priority: "Low" },
    ],
    workflows: [
      "references/workflows/ai-citation-tracking.md - Full tracking process",
      "references/workflows/entity-optimization.md - Improve AI recognition",
      "references/workflows/voice-search.md - Voice assistant optimization",
    ],
    quickStart: [
      "1. Review queries to track with 'ai-tracking queries'",
      "2. Set up weekly tracking schedule with 'ai-tracking schedule'",
      "3. Use template to log results: 'ai-tracking template'",
      "4. Calculate metrics monthly: 'ai-tracking metrics'",
    ],
  }, null, 2));
}

/**
 * Competitor analysis and tracking
 */
interface CompetitorProfile {
  name: string;
  domain: string;
  type: "direct" | "indirect" | "content";
  priority: "high" | "medium" | "low";
}

// Default competitor set
const DEFAULT_COMPETITORS: CompetitorProfile[] = [
  { name: "Chubbies", domain: "chubbies.com", type: "direct", priority: "high" },
  { name: "Bearbottom", domain: "bearbottomclothing.com", type: "direct", priority: "medium" },
  { name: "Vintage 1946", domain: "vintage1946.com", type: "direct", priority: "medium" },
  { name: "GQ", domain: "gq.com", type: "content", priority: "medium" },
  { name: "The Strategist", domain: "nymag.com/strategist", type: "content", priority: "low" },
];

function analyzeCompetitors(action?: string): void {
  if (action === "list") {
    console.log(JSON.stringify({
      success: true,
      competitors: DEFAULT_COMPETITORS,
      instructions: [
        "To customize your competitor set, edit the DEFAULT_COMPETITORS array in seo-client.ts",
        "Or create a competitors.json file in workflows/seo/competitors/",
      ],
    }, null, 2));
    return;
  }

  if (action === "template") {
    const template = {
      name: "[Competitor Name]",
      domain: "competitor.com",
      type: "direct | indirect | content",
      priority: "high | medium | low",
      profile: {
        product_overlap: "List of overlapping product categories",
        price_positioning: "lower | similar | higher",
        unique_selling_props: ["USP 1", "USP 2"],
        estimated_traffic: "X/month",
        domain_authority: "XX",
        top_keywords: ["keyword1", "keyword2", "keyword3"],
        content_strategy: "Description of their content approach",
        swot: {
          strengths: ["Strength 1", "Strength 2"],
          weaknesses: ["Weakness 1", "Weakness 2"],
          opportunities: ["Opportunity 1"],
          threats: ["Threat 1"],
        },
      },
      tracking: {
        keywords_to_monitor: ["keyword1", "keyword2"],
        pages_to_watch: ["https://competitor.com/page1"],
        update_frequency: "weekly | monthly",
      },
    };

    console.log(JSON.stringify({
      success: true,
      message: "Competitor profile template",
      template,
      usage: "Copy this template to create competitor profiles in workflows/seo/competitors/",
    }, null, 2));
    return;
  }

  // Default: show competitor analysis overview
  console.log(JSON.stringify({
    success: true,
    message: "Competitor Analysis Tools",
    commands: {
      "competitors list": "Show current competitor set",
      "competitors template": "Get competitor profile template",
    },
    competitors: {
      direct: DEFAULT_COMPETITORS.filter(c => c.type === "direct").length,
      indirect: DEFAULT_COMPETITORS.filter(c => c.type === "indirect").length,
      content: DEFAULT_COMPETITORS.filter(c => c.type === "content").length,
      total: DEFAULT_COMPETITORS.length,
    },
    workflows: [
      "references/workflows/competitor-tracking.md - Full competitor tracking process",
      "references/workflows/serp-features.md - Track feature ownership",
      "references/workflows/authority-analysis.md - Compare domain authority",
    ],
    quickStart: [
      "1. Define your competitor set with 'competitors template'",
      "2. For each competitor, identify shared keywords",
      "3. Track weekly position changes for shared keywords",
      "4. Set up alerts for significant movements",
    ],
  }, null, 2));
}

/**
 * Export report in specified format
 */
async function exportReport(format: string, outputFile?: string): Promise<void> {
  console.log(JSON.stringify({
    success: true,
    message: "Export requires data to be piped in",
    instructions: [
      "1. Generate keyword report and export:",
      `   seo-client.ts keywords example.com | seo-client.ts export ${format}`,
      "",
      "2. Supported formats:",
      "   csv  - Comma-separated values (Shopify-compatible)",
      "   json - Full JSON report",
      "   md   - Markdown summary",
      "",
      "3. Redirect to file:",
      `   seo-client.ts keywords example.com | seo-client.ts export csv > keywords.csv`,
    ],
    format,
    outputFile: outputFile || "(stdout)",
  }, null, 2));
}

// ============================================================================
// CSV Export
// ============================================================================

function exportToCSV(keywords: ScoredKeyword[]): string {
  const headers = [
    "keyword",
    "impressions",
    "clicks",
    "ctr",
    "position",
    "intent",
    "intent_multiplier",
    "opportunity_score",
    "tier",
  ];

  const rows = keywords.map((kw) => [
    escapeCSV(kw.keyword),
    kw.impressions.toString(),
    kw.clicks.toString(),
    (kw.ctr * 100).toFixed(2) + "%",
    kw.position.toFixed(1),
    kw.intent,
    kw.intentMultiplier.toFixed(1),
    kw.opportunityScore.toString(),
    kw.tier,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ============================================================================
// Markdown Export
// ============================================================================

function exportToMarkdown(report: SEOReport): string {
  const lines = [
    `# SEO Keyword Opportunity Report`,
    "",
    `**Domain:** ${report.domain}`,
    `**Generated:** ${report.generatedAt}`,
    `**Analysis Period:** ${report.analysisPeriodDays} days`,
    "",
    `## Summary`,
    "",
    `| Tier | Count |`,
    `|------|-------|`,
    `| Critical | ${report.summary.criticalOpportunities} |`,
    `| High | ${report.summary.highOpportunities} |`,
    `| Medium | ${report.summary.mediumOpportunities} |`,
    `| Total Analyzed | ${report.summary.keywordsAnalyzed} |`,
    "",
    `## Top Opportunities`,
    "",
    `| Keyword | Impressions | CTR | Position | Intent | Score | Tier |`,
    `|---------|-------------|-----|----------|--------|-------|------|`,
  ];

  const topKeywords = report.keywords.slice(0, 20);
  for (const kw of topKeywords) {
    lines.push(
      `| ${kw.keyword} | ${kw.impressions.toLocaleString()} | ${(kw.ctr * 100).toFixed(2)}% | ${kw.position.toFixed(1)} | ${kw.intent} | ${kw.opportunityScore} | ${kw.tier} |`
    );
  }

  lines.push("");
  lines.push("## Next Steps");
  lines.push("");
  lines.push("1. Review Critical/High tier keywords");
  lines.push("2. Map keywords to products");
  lines.push("3. Update product descriptions with target keywords");
  lines.push("4. Monitor rankings over next 4 weeks");

  return lines.join("\n");
}

// ============================================================================
// CLI
// ============================================================================

function printUsage(): void {
  console.log(`SEO Research & Optimization CLI

Usage: seo-client.ts <command> [args...]

Commands:
  analyze <domain>                      - Analyze search performance for a domain
  keywords <domain> [--days N]          - Generate keyword opportunity report
  score <impressions> <ctr> <position> [keyword] - Calculate opportunity score with intent
  forecast <impressions> <current-pos> <target-pos> - Forecast traffic gain from ranking improvement
  gaps                                  - Identify content gaps from GSC data
  competitors [list|template]           - Competitor analysis and tracking tools
  ai-tracking [queries|template|schedule|metrics] - AI citation tracking tools
  audit <product-handle>                - Audit single product SEO
  export <format> [--output file]       - Export results (csv, json, md)
  help                                  - Show this help message

Examples:
  # Analyze domain (shows instructions)
  seo-client.ts analyze example.com

  # Calculate score for a single keyword (with intent classification)
  seo-client.ts score 93820 0.0007 5.3 "buy dolphin shorts"

  # Generate keyword report from GSC data
  gsc-client.ts top-queries sc-domain:example.com 90 | seo-client.ts keywords example.com

  # Audit a product
  seo-client.ts audit mens-navy-corduroy-shorts

  # Identify content gaps from GSC data
  gsc-client.ts top-queries sc-domain:example.com 90 500 | seo-client.ts gaps

  # Forecast traffic gain from position improvement
  seo-client.ts forecast 10000 12 5 --keyword="corduroy shorts"

  # Forecast with revenue estimate
  seo-client.ts forecast 10000 12 5 --conversion-rate=0.025 --aov=75

Scoring Tiers:
  90+  = Critical  - Immediate optimization required
  70-89 = High     - Prioritize in next content update
  50-69 = Medium   - Include in quarterly review
  30-49 = Low      - Monitor, optimize when convenient
  <30  = Monitor   - Track but don't actively pursue

Integration:
  This CLI works with:
  - google/search-console (gsc-client.ts) for keyword data
  - shopify (shopify-client.ts) for product data
  - postgresql (pg-client.ts) for bulk queries

For detailed workflows, see:
  .claude/skills/seo/references/workflows/`);
}

// ============================================================================
// Main
// ============================================================================

const command = Deno.args[0];

switch (command) {
  case "analyze": {
    const domain = Deno.args[1];
    const daysArg = Deno.args.find((a) => a.startsWith("--days="));
    const days = daysArg ? parseInt(daysArg.split("=")[1]) : 90;

    if (!domain) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: analyze <domain>",
        example: "seo-client.ts analyze example.com",
      }));
      break;
    }

    await analyzeDomain(domain, days);
    break;
  }

  case "keywords": {
    const domain = Deno.args[1] || "unknown";
    const daysArg = Deno.args.find((a) => a.startsWith("--days="));
    const days = daysArg ? parseInt(daysArg.split("=")[1]) : 90;

    await generateKeywordReport(domain, days);
    break;
  }

  case "score": {
    const impressions = parseFloat(Deno.args[1]);
    const ctr = parseFloat(Deno.args[2]);
    const position = parseFloat(Deno.args[3]);
    const keywordArg = Deno.args.find((a) => a.startsWith("--keyword="));
    const keyword = keywordArg ? keywordArg.split("=")[1] : Deno.args[4];

    if (isNaN(impressions) || isNaN(ctr) || isNaN(position)) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: score <impressions> <ctr> <position> [keyword]",
        example: 'seo-client.ts score 93820 0.0007 5.3 "dolphin shorts"',
        notes: [
          "impressions: number of search impressions",
          "ctr: click-through rate as decimal (0.0007 = 0.07%)",
          "position: average ranking position",
          "keyword: (optional) the search term for intent classification",
        ],
      }));
      break;
    }

    scoreKeyword(impressions, ctr, position, keyword);
    break;
  }

  case "forecast": {
    const impressions = parseFloat(Deno.args[1]);
    const currentPosition = parseFloat(Deno.args[2]);
    const targetPosition = parseFloat(Deno.args[3]);
    const keywordArg = Deno.args.find((a) => a.startsWith("--keyword="));
    const keyword = keywordArg ? keywordArg.split("=")[1] : undefined;
    const conversionArg = Deno.args.find((a) => a.startsWith("--conversion-rate="));
    const conversionRate = conversionArg ? parseFloat(conversionArg.split("=")[1]) : undefined;
    const aovArg = Deno.args.find((a) => a.startsWith("--aov="));
    const avgOrderValue = aovArg ? parseFloat(aovArg.split("=")[1]) : undefined;

    if (isNaN(impressions) || isNaN(currentPosition) || isNaN(targetPosition)) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: forecast <impressions> <current-position> <target-position>",
        example: 'seo-client.ts forecast 10000 12 5 --keyword="corduroy shorts"',
        options: [
          "--keyword=<keyword>     Keyword for context",
          "--conversion-rate=<rate> Conversion rate (e.g., 0.025 for 2.5%)",
          "--aov=<value>           Average order value (e.g., 75)",
        ],
      }));
      break;
    }

    runForecast(impressions, currentPosition, targetPosition, keyword, conversionRate, avgOrderValue);
    break;
  }

  case "gaps": {
    const ownedArg = Deno.args.find((a) => a.startsWith("--owned="));
    const competitorArg = Deno.args.find((a) => a.startsWith("--competitor="));
    const ownedFile = ownedArg ? ownedArg.split("=")[1] : undefined;
    const competitorFile = competitorArg ? competitorArg.split("=")[1] : undefined;

    await analyzeContentGaps(ownedFile, competitorFile);
    break;
  }

  case "competitors": {
    const action = Deno.args[1]; // list, template, or undefined
    analyzeCompetitors(action);
    break;
  }

  case "ai-tracking": {
    const action = Deno.args[1]; // queries, template, schedule, metrics, or undefined
    analyzeAICitations(action);
    break;
  }

  case "audit": {
    const handle = Deno.args[1];

    if (!handle) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: audit <product-handle>",
        example: "seo-client.ts audit mens-navy-corduroy-shorts",
      }));
      break;
    }

    await auditProduct(handle);
    break;
  }

  case "export": {
    const format = Deno.args[1];
    const outputArg = Deno.args.find((a) => a.startsWith("--output="));
    const outputFile = outputArg ? outputArg.split("=")[1] : undefined;

    if (!format || !["csv", "json", "md"].includes(format)) {
      console.log(JSON.stringify({
        success: false,
        error: "Usage: export <format> [--output=file]",
        formats: ["csv", "json", "md"],
        example: "seo-client.ts export csv --output=keywords.csv",
      }));
      break;
    }

    await exportReport(format, outputFile);
    break;
  }

  case "help":
  case "--help":
  case "-h":
    printUsage();
    break;

  default:
    if (command) {
      console.log(JSON.stringify({
        success: false,
        error: `Unknown command: ${command}`,
        hint: "Run 'seo-client.ts help' for usage information",
      }));
    } else {
      printUsage();
    }
}
