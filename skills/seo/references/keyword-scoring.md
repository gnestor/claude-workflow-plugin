# Keyword Opportunity Scoring Methodology

## Overview

This document describes the methodology for scoring and prioritizing keyword opportunities based on search performance data from Google Search Console.

## Opportunity Score Formula

```
opportunity_score = (impressions × (1 - current_ctr) × position_weight × intent_multiplier) / 1000

where:
  position_weight = max(0.1, (50 - avg_position) / 50)
  intent_multiplier = 2.0 (transactional), 1.5 (commercial), 1.0 (informational), 0.8 (navigational)
```

### Components Explained

| Component | Description | Range |
|-----------|-------------|-------|
| `impressions` | Number of times page appeared in search | 0 - unlimited |
| `current_ctr` | Current click-through rate | 0.0 - 1.0 |
| `avg_position` | Average ranking position | 1 - 100+ |
| `position_weight` | Multiplier based on position | 0.1 - 1.0 |
| `intent_multiplier` | Multiplier based on search intent | 0.8 - 2.0 |

### Formula Logic

1. **High impressions** = High search demand for this keyword
2. **Low CTR** = Opportunity to improve (clicks being left on table)
3. **Position weight** = Keywords in positions 1-50 are actionable; extended range captures "striking distance" opportunities
4. **Intent multiplier** = Prioritizes keywords with purchase intent over informational queries

### Position Weight Calculation

| Position | Weight | Interpretation |
|----------|--------|----------------|
| 1 | 0.98 | Already ranking well, small optimization gains |
| 5 | 0.90 | Good position, CTR optimization opportunity |
| 10 | 0.80 | On first page, content improvements can help |
| 20 | 0.60 | Page 2, significant content improvements needed |
| 30 | 0.40 | Page 3, requires content + authority building |
| 40 | 0.20 | Page 4, long-term opportunity |
| 50+ | 0.10 | Floor value - still trackable, requires major effort |

### Search Intent Classification

Classify keywords by user intent to prioritize high-value opportunities:

| Intent | Signal Words | Multiplier | Examples |
|--------|--------------|------------|----------|
| Transactional | buy, shop, order, price, cheap, deal, discount, coupon | 2.0 | "buy corduroy shorts", "your-brand shorts price" |
| Commercial | best, top, review, vs, compare, alternative | 1.5 | "best retro shorts", "chubbies vs your-brand" |
| Informational | what, how, why, guide, tutorial, history | 1.0 | "what are dolphin shorts", "how to style bell bottoms" |
| Navigational | [brand name], website, login, official | 0.8 | "your-brand website", "your-brand shorts" |

**Intent Detection Logic:**
```typescript
function classifyIntent(keyword: string): { intent: string; multiplier: number } {
  const kw = keyword.toLowerCase();

  // Transactional signals
  if (/\b(buy|shop|order|purchase|price|cheap|deal|discount|coupon|sale|free shipping)\b/.test(kw)) {
    return { intent: 'transactional', multiplier: 2.0 };
  }

  // Commercial investigation signals
  if (/\b(best|top|review|vs|versus|compare|comparison|alternative|worth it)\b/.test(kw)) {
    return { intent: 'commercial', multiplier: 1.5 };
  }

  // Navigational signals (brand-specific)
  if (/\b(your-brand|website|official|login|account)\b/.test(kw)) {
    return { intent: 'navigational', multiplier: 0.8 };
  }

  // Informational signals
  if (/\b(what|how|why|when|where|who|guide|tutorial|history|meaning)\b/.test(kw)) {
    return { intent: 'informational', multiplier: 1.0 };
  }

  // Default: assume commercial for product-related terms
  return { intent: 'commercial', multiplier: 1.0 };
}
```

## Score Interpretation

### Tier System

| Score | Tier | Action |
|-------|------|--------|
| 90+ | Critical | Immediate optimization required |
| 70-89 | High | Prioritize in next content update |
| 50-69 | Medium | Include in quarterly review |
| 30-49 | Low | Monitor, optimize when convenient |
| <30 | Monitor | Track but don't actively pursue |

### Example Calculations

**Example 1: High-opportunity transactional keyword**
```
Keyword: "buy dolphin shorts"
Impressions: 5,000
CTR: 0.5% (0.005)
Position: 8.0
Intent: Transactional (multiplier: 2.0)

position_weight = max(0.1, (50 - 8.0) / 50) = 0.84
opportunity_score = (5,000 × (1 - 0.005) × 0.84 × 2.0) / 1000
opportunity_score = (5,000 × 0.995 × 0.84 × 2.0) / 1000
opportunity_score = 8,358 / 1000 = 8.4

Tier: Monitor (but high-value due to transactional intent)
```

**Example 2: High-volume informational keyword**
```
Keyword: "dolphin shorts"
Impressions: 93,820
CTR: 0.07% (0.0007)
Position: 5.3
Intent: Commercial (multiplier: 1.0)

position_weight = max(0.1, (50 - 5.3) / 50) = 0.894
opportunity_score = (93,820 × (1 - 0.0007) × 0.894 × 1.0) / 1000
opportunity_score = (93,820 × 0.9993 × 0.894) / 1000
opportunity_score = 83,829 / 1000 = 83.8

Tier: High (prioritize in next content update)
```

**Example 3: Navigational brand keyword**
```
Keyword: "your-brand shorts"
Impressions: 12,000
CTR: 26% (0.26)
Position: 1.7
Intent: Navigational (multiplier: 0.8)

position_weight = max(0.1, (50 - 1.7) / 50) = 0.966
opportunity_score = (12,000 × (1 - 0.26) × 0.966 × 0.8) / 1000
opportunity_score = (12,000 × 0.74 × 0.966 × 0.8) / 1000
opportunity_score = 6,864 / 1000 = 6.9

Tier: Monitor (already well-optimized brand term)
```

**Example 4: Page 3 keyword with potential**
```
Keyword: "vintage corduroy shorts mens"
Impressions: 8,500
CTR: 0.2% (0.002)
Position: 28.0
Intent: Commercial (multiplier: 1.5)

position_weight = max(0.1, (50 - 28.0) / 50) = 0.44
opportunity_score = (8,500 × (1 - 0.002) × 0.44 × 1.5) / 1000
opportunity_score = (8,500 × 0.998 × 0.44 × 1.5) / 1000
opportunity_score = 5,599 / 1000 = 5.6

Tier: Monitor (but worth targeting - previously would score 0)
```

## Prioritization Matrix

Beyond raw score, consider these factors for final prioritization:

### Primary Factors (in formula)
1. Search volume/impressions
2. Current CTR gap
3. Current position

### Secondary Factors (qualitative)
1. **Purchase intent** - Is searcher likely to buy?
2. **Product relevance** - Do we have a matching product?
3. **Competition** - How hard is this keyword?
4. **Seasonality** - Is this keyword trending up/down?

### Prioritization Decision Tree

```
High Score (70+)?
├── Yes → Is keyword relevant to existing product?
│   ├── Yes → HIGH PRIORITY: Optimize immediately
│   └── No → MEDIUM: Consider product expansion
└── No → Is search volume significant (>1000/month)?
    ├── Yes → MEDIUM: Add to content calendar
    └── No → LOW: Monitor only
```

## Data Collection

### Required Data Points
From Google Search Console (90-day window recommended):

| Field | Source | Notes |
|-------|--------|-------|
| Query | GSC Top Queries | The search term |
| Impressions | GSC | Times shown in search |
| Clicks | GSC | Times clicked |
| CTR | GSC | clicks / impressions |
| Position | GSC | Average ranking position |

### Data Retrieval
Use `~~seo` MCP tools to fetch top queries for the domain with a 90-day window.

## Output Format

### CSV Schema
```csv
keyword,product_category,impressions,clicks,ctr,position,intent,intent_multiplier,opportunity_score,tier,notes
```

### Example Output
```csv
keyword,product_category,impressions,clicks,ctr,position,intent,intent_multiplier,opportunity_score,tier,notes
dolphin shorts,Shorts,93820,68,0.07%,5.3,commercial,1.0,84,High,"Missing from Dolphin Trunk description"
buy corduroy shorts,Shorts,2500,15,0.6%,12.0,transactional,2.0,38,Low,"High-value purchase intent"
best retro shorts,Shorts,5500,42,0.76%,8.2,commercial,1.5,55,Medium,"Comparison shoppers"
what are dolphin shorts,Shorts,3200,28,0.88%,6.5,informational,1.0,28,Monitor,"Educational - create blog post"
your-brand shorts,Shorts,12000,3120,26%,1.7,navigational,0.8,7,Monitor,"Brand term - already optimized"
```

## Keyword Categorization

### By Product Type
- Shorts (corduroy, dolphin, terry)
- Pants (bell bottoms, flares)
- Swim (trunks, swim shorts)
- Tops (shirts, polos, sweaters)

### By Search Intent
| Intent | Example | Value |
|--------|---------|-------|
| Transactional | "buy corduroy shorts" | Highest |
| Commercial | "best retro shorts" | High |
| Informational | "what are dolphin shorts" | Medium |
| Navigational | "your-brand website" | Brand |

### By Funnel Stage
1. **Awareness:** Generic terms ("short shorts")
2. **Consideration:** Modified terms ("vintage corduroy shorts mens")
3. **Decision:** Brand/product terms ("your-brand product navy")

## Implementation Workflow

### Step 1: Data Export
Use `~~seo` MCP tools to export search performance data for the domain (90-day window).

### Step 2: Score Calculation
```typescript
function calculateOpportunityScore(
  impressions: number,
  ctr: number,
  position: number,
  intentMultiplier: number = 1.0
): number {
  const positionWeight = Math.max(0.1, (50 - position) / 50);
  const score = (impressions * (1 - ctr) * positionWeight * intentMultiplier) / 1000;
  return Math.round(score);
}

function classifyIntent(keyword: string): { intent: string; multiplier: number } {
  const kw = keyword.toLowerCase();
  if (/\b(buy|shop|order|price|cheap|deal|discount|coupon|sale)\b/.test(kw)) {
    return { intent: 'transactional', multiplier: 2.0 };
  }
  if (/\b(best|top|review|vs|compare|alternative)\b/.test(kw)) {
    return { intent: 'commercial', multiplier: 1.5 };
  }
  if (/\b(your-brand|website|official|login)\b/.test(kw)) {
    return { intent: 'navigational', multiplier: 0.8 };
  }
  if (/\b(what|how|why|guide|tutorial|history)\b/.test(kw)) {
    return { intent: 'informational', multiplier: 1.0 };
  }
  return { intent: 'commercial', multiplier: 1.0 };
}
```

### Step 3: Tier Assignment
```typescript
function getTier(score: number): string {
  if (score >= 90) return "Critical";
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  if (score >= 30) return "Low";
  return "Monitor";
}
```

### Step 4: Action Planning
For each High/Critical keyword:
1. Identify target product(s)
2. Check current content for keyword presence
3. Generate optimized content
4. Update and monitor

## Monitoring & Iteration

### Weekly Tracking
- Position changes for target keywords
- CTR improvements after optimization
- New keyword opportunities appearing

### Monthly Review
- Re-score all keywords
- Identify new high-opportunity terms
- Retire keywords that improved past threshold

### Quarterly Audit
- Full catalog re-optimization
- Competitive keyword analysis
- Search trend alignment

## Limitations

1. **Position data averaging** - GSC averages position across all impressions
2. **Delayed data** - GSC data is 2-3 days delayed
3. **Sampling** - High-volume sites may show sampled data
4. **Brand vs. Non-brand** - Mix of intent types in same query
5. **Local variation** - Position varies by location

## Advanced Scoring (Optional)

### Search Volume Integration
If Google Trends or third-party volume data available:
```
enhanced_score = opportunity_score × (monthly_volume / 1000)
```

### Competitive Difficulty
Adjust score based on SERP competition:
```
adjusted_score = opportunity_score × difficulty_factor

where difficulty_factor:
- Easy (0.8-1.0): Small sites ranking, few ads
- Medium (0.5-0.8): Mix of site sizes
- Hard (0.2-0.5): Major brands dominating
```
