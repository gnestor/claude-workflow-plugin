# Monthly Trends Analysis Workflow

## Overview

Regular trend analysis ensures content is optimized for seasonal demand and emerging opportunities. Run this workflow monthly, with deeper analysis quarterly.

**Duration:** 30-45 minutes
**Output:** Seasonality calendar and content timing recommendations

## When to Run

- **Monthly:** Quick trend check for upcoming opportunities
- **Quarterly:** Full seasonality analysis and content calendar planning
- **Before campaigns:** Validate timing for planned content/promotions
- **After anomalies:** Investigate unexpected traffic changes

## Prerequisites

- Google Trends access (API or browser)
- Google Search Console data (last 12+ months for YoY comparison)
- Product catalog awareness

## Monthly Workflow

### Step 1: Check Core Product Trends

**Goal:** Understand current search interest for main product categories

**Using Google Trends API:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-over-time "corduroy shorts,dolphin shorts,bell bottoms" --months 12
```

**Using Browser (if API unavailable):**
1. Navigate to trends.google.com
2. Compare up to 5 core product terms
3. Set timeframe to "Past 12 months"
4. Filter by United States
5. Note relative interest and peak periods

**Key Metrics:**
- Current interest vs. 3 months ago
- Peak months for each category
- Rising vs. declining trends

### Step 2: Identify Seasonal Patterns

**Goal:** Map product demand to calendar

**Seasonality Calendar Template:**

| Month | High-Demand Products | Search Triggers | Content Focus |
|-------|---------------------|-----------------|---------------|
| Jan | Bell Bottoms, Sweaters | New Year, Winter | Winter lookbooks |
| Feb | -- | Valentine's | Couples styles |
| Mar | Shorts (preview) | Spring break | Beach prep |
| Apr | Shorts, Light pants | Easter, Warm weather | New arrivals |
| May | All shorts | Memorial Day | Summer kickoff |
| Jun | Dolphin shorts, Swim | Summer, Beach | Vacation styles |
| Jul | All shorts | Peak summer | Mid-season sale |
| Aug | Shorts, Back-to-school | Late summer | Final summer push |
| Sep | Bell bottoms, Cords | Fall fashion | Transitional looks |
| Oct | Corduroy, Long pants | Halloween, Fall | Cozy styles |
| Nov | All products | Black Friday, Holidays | Gift guides |
| Dec | All products | Christmas, New Year | Holiday shipping |

**Action:** Update calendar based on current Trends data

### Step 3: Check Rising Queries

**Goal:** Identify emerging opportunities

**Using Google Trends:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  related-queries "retro shorts" --type rising
```

**Categories to Monitor:**
- Style terms (vintage, retro, 70s, 80s)
- Material terms (corduroy, terry cloth, nylon)
- Competitor brand names
- Fashion trend terms

**Rising Query Indicators:**
- "Breakout" = 5000%+ increase, significant opportunity
- 100%+ increase = worth investigating
- New terms not seen before = potential content gap

### Step 4: Geographic Analysis

**Goal:** Identify regional opportunities

**Using Google Trends:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-by-region "corduroy shorts" --geo US --resolution REGION
```

**Key Questions:**
- Which states show highest interest?
- Are there regional style preferences?
- Does interest align with shipping/advertising focus?

### Step 5: Compare Year-over-Year

**Goal:** Understand if trends are growing or declining

**Using Google Search Console:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  compare-periods sc-domain:example.com \
  --current "2026-01-01,2026-01-31" \
  --previous "2025-01-01,2025-01-31"
```

**Metrics to Compare:**
- Total impressions YoY
- Top query impressions YoY
- New queries appearing
- Queries that disappeared

### Step 6: Update Content Calendar

**Goal:** Align content creation with demand

**Content Timing Rules:**
- Publish seasonal content **4-6 weeks before** peak demand
- Update existing content **2-3 weeks before** peak
- Promote/advertise **1-2 weeks before** and during peak
- Archive seasonal content **2 weeks after** peak ends

**Monthly Content Actions:**

| If Trend Shows | Action |
|----------------|--------|
| Rising interest (next 30 days) | Prioritize related content updates |
| Peak approaching (60 days) | Create new seasonal content now |
| Declining from peak | Shift focus to next seasonal opportunity |
| Breakout query | Investigate for new product/content opportunity |
| Competitor rising | Analyze their content, consider response |

## Quarterly Deep Dive

Every 3 months, conduct a more thorough analysis:

### Q1 (January)
- Plan spring/summer content
- Review holiday performance
- Set annual SEO goals

### Q2 (April)
- Optimize for summer peak
- Mid-year performance review
- Adjust based on Q1 learnings

### Q3 (July)
- Plan fall/winter content
- Review summer performance
- Back-to-school preparation

### Q4 (October)
- Holiday content preparation
- Black Friday/Cyber Monday optimization
- Year-end performance analysis

## Output Format

### Monthly Trends Report

```json
{
  "report_date": "2026-01-25",
  "period": "January 2026",
  "core_trends": {
    "corduroy_shorts": {
      "current_interest": 45,
      "3_month_change": "+12%",
      "peak_month": "September",
      "status": "off-season"
    },
    "dolphin_shorts": {
      "current_interest": 28,
      "3_month_change": "-8%",
      "peak_month": "June",
      "status": "approaching (5 months)"
    },
    "bell_bottoms": {
      "current_interest": 62,
      "3_month_change": "+5%",
      "peak_month": "October",
      "status": "post-peak, steady"
    }
  },
  "rising_queries": [
    {"query": "70s inspired shorts", "growth": "breakout"},
    {"query": "vintage gym shorts", "growth": "+180%"}
  ],
  "recommendations": [
    "Create '70s inspired shorts' landing page",
    "Update dolphin shorts content by March",
    "Maintain bell bottoms momentum with winter styling content"
  ],
  "content_calendar_updates": [
    {"date": "2026-02-15", "action": "Publish spring shorts preview"},
    {"date": "2026-03-01", "action": "Update dolphin shorts meta/descriptions"},
    {"date": "2026-04-01", "action": "Launch summer collection SEO push"}
  ]
}
```

## Integration with SEO Workflow

This workflow feeds into:

1. **Full Catalog Optimization** - Prioritize products approaching peak season
2. **Single Product Optimization** - Focus on rising trend products first
3. **Keyword Scoring** - Add seasonality factor to opportunity scores

### Seasonality Scoring Adjustment

```typescript
function adjustForSeasonality(
  opportunityScore: number,
  monthsUntilPeak: number
): number {
  // Boost scores for products approaching peak
  if (monthsUntilPeak <= 2) return opportunityScore * 1.5;
  if (monthsUntilPeak <= 4) return opportunityScore * 1.25;
  // Reduce scores for off-season products
  if (monthsUntilPeak >= 8) return opportunityScore * 0.75;
  return opportunityScore;
}
```

## Related Workflows

- [full-catalog.md](full-catalog.md) - Use trends data to prioritize optimization
- [single-product.md](single-product.md) - Focus on seasonally relevant products
