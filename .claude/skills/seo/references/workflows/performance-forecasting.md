# Performance Forecasting Workflow

## Overview

Predict traffic impact of SEO optimizations using CTR benchmarks and position targets. This workflow helps prioritize efforts and set realistic expectations for optimization campaigns.

**Duration:** 30 minutes for initial setup, 15 minutes per forecast
**Output:** Traffic projections and ROI estimates

## Why Forecasting Matters

1. **Prioritize efforts** - Focus on changes with highest projected impact
2. **Set expectations** - Provide realistic timelines and goals
3. **Measure success** - Compare forecasts to actual results
4. **Justify investment** - Quantify SEO value for stakeholders

## CTR Benchmarks by Position

Based on industry research (2024-2025 data, updated for 2026):

### Organic Search CTR Benchmarks

| Position | Desktop CTR | Mobile CTR | Blended Average |
|----------|-------------|------------|-----------------|
| 1 | 31.7% | 24.0% | 27.6% |
| 2 | 24.7% | 18.6% | 21.4% |
| 3 | 18.7% | 14.1% | 16.2% |
| 4 | 13.6% | 10.1% | 11.7% |
| 5 | 9.5% | 7.1% | 8.1% |
| 6 | 6.1% | 4.5% | 5.2% |
| 7 | 4.0% | 3.0% | 3.4% |
| 8 | 2.9% | 2.2% | 2.5% |
| 9 | 2.2% | 1.6% | 1.9% |
| 10 | 1.6% | 1.2% | 1.4% |
| 11-20 | 0.8% | 0.6% | 0.7% |
| 21-30 | 0.3% | 0.2% | 0.25% |
| 31-50 | 0.1% | 0.08% | 0.09% |

### CTR Modifiers by SERP Feature

| SERP Feature | CTR Impact |
|--------------|------------|
| Featured Snippet present | -30% to position 1-3 |
| AI Overview present | -40% to all positions |
| Shopping ads present | -20% to commercial queries |
| Local pack present | -25% to non-local results |
| Image pack present | -10% to text results |
| No SERP features | +0% (baseline) |

### CTR Modifiers by Query Type

| Query Type | CTR Multiplier |
|------------|----------------|
| Brand query | 1.5x (higher trust) |
| Product query | 1.2x (purchase intent) |
| Informational | 0.9x (multiple clicks) |
| Navigational | 2.0x (specific destination) |

## Traffic Forecast Formula

### Basic Formula

```
monthly_traffic_gain = impressions × (target_ctr - current_ctr)

where:
  impressions = monthly search impressions
  target_ctr = benchmark CTR for target position
  current_ctr = benchmark CTR for current position (or actual CTR)
```

### Enhanced Formula (with modifiers)

```
adjusted_ctr = base_ctr × serp_modifier × query_modifier × brand_modifier

traffic_gain = impressions × (adjusted_target_ctr - adjusted_current_ctr)

confidence_range:
  optimistic = traffic_gain × 1.3
  conservative = traffic_gain × 0.7
```

## Workflow Steps

### Step 1: Gather Keyword Data

**From Google Search Console:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-queries sc-domain:example.com 90 500
```

**Required data per keyword:**
- Current impressions
- Current position
- Current CTR (actual)
- Query type (for modifiers)

### Step 2: Set Position Targets

**Realistic target positions based on current ranking:**

| Current Position | Realistic 90-Day Target | Aggressive Target |
|------------------|-------------------------|-------------------|
| 1-3 | Maintain | Maintain |
| 4-10 | Position - 2 | Position - 4 |
| 11-20 | Position - 3 | Position - 6 |
| 21-30 | Position - 5 | Position - 10 |
| 31-50 | 25 | 15 |
| 50+ | 40 | 25 |

**Example:**
- Current: Position 12 → Target: Position 9 (realistic), Position 6 (aggressive)

### Step 3: Calculate Traffic Forecasts

**Using CLI:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/seo/scripts/seo-client.ts forecast \
  --impressions 10000 --current-position 12 --target-position 5
```

**Manual calculation example:**
```
Keyword: "corduroy shorts men"
Impressions: 10,000/month
Current position: 12 (CTR: 0.7%)
Target position: 5 (CTR: 8.1%)

Traffic gain = 10,000 × (0.081 - 0.007) = 740 clicks/month
Revenue estimate = 740 × conversion_rate × avg_order_value
```

### Step 4: Apply Modifiers

**Check for SERP features:**
1. Search keyword in incognito
2. Note any special SERP features
3. Apply relevant modifier

**Example with AI Overview:**
```
Base forecast: 740 clicks/month
AI Overview modifier: 0.6 (40% reduction)
Adjusted forecast: 740 × 0.6 = 444 clicks/month
```

### Step 5: Aggregate Forecasts

**Create forecast summary:**

| Keyword | Impressions | Current Pos | Target Pos | Forecast Clicks | Confidence |
|---------|-------------|-------------|------------|-----------------|------------|
| corduroy shorts | 10,000 | 12 | 5 | 740 | Medium |
| dolphin shorts | 93,820 | 5 | 3 | 3,755 | High |
| bell bottoms men | 8,500 | 28 | 15 | 544 | Low |
| **Total** | | | | **5,039** | |

### Step 6: Estimate Revenue Impact

**E-commerce revenue formula:**
```
monthly_revenue = forecasted_clicks × conversion_rate × avg_order_value

where:
  conversion_rate = site_avg (typically 2-4% for e-commerce)
  avg_order_value = site_avg (e.g., $75)
```

**Example:**
```
Forecasted clicks: 5,039/month
Conversion rate: 2.5%
Average order value: $75

Monthly revenue = 5,039 × 0.025 × $75 = $9,448/month
Annual impact = $9,448 × 12 = $113,376/year
```

## Forecast Tracking

### Create Tracking Spreadsheet

```csv
keyword,forecast_date,impressions,start_position,target_position,forecasted_clicks,actual_clicks_30d,actual_clicks_60d,actual_clicks_90d,variance
corduroy shorts,2026-01-25,10000,12,5,740,,,
dolphin shorts,2026-01-25,93820,5,3,3755,,,
```

### Monthly Review Process

1. **Export current GSC data** for forecasted keywords
2. **Calculate actual performance** vs. forecast
3. **Identify variance patterns:**
   - Consistently over/under forecasting?
   - Specific keyword types missing targets?
4. **Adjust benchmarks** based on learnings

### Variance Analysis

| Variance | Meaning | Action |
|----------|---------|--------|
| +20% or more | Outperforming forecast | Validate methodology, may have conservative benchmarks |
| +10% to +20% | Slightly outperforming | Healthy range, continue current approach |
| -10% to +10% | On target | Forecasting is accurate |
| -10% to -20% | Underperforming | Check for SERP changes, competitor activity |
| -20% or more | Significant miss | Review assumptions, may need benchmark adjustment |

## CLI Integration

### Forecast Command

```bash
# Single keyword forecast
deno run --allow-net --allow-env --allow-read \
  .claude/skills/seo/scripts/seo-client.ts forecast \
  --impressions 10000 --current-position 12 --target-position 5

# Batch forecast from GSC data
cat gsc-keywords.json | deno run --allow-net --allow-env --allow-read \
  .claude/skills/seo/scripts/seo-client.ts forecast --batch
```

### Output Format

```json
{
  "keyword": "corduroy shorts men",
  "forecast": {
    "impressions": 10000,
    "currentPosition": 12,
    "targetPosition": 5,
    "currentCTR": 0.007,
    "targetCTR": 0.081,
    "forecastedClicks": 740,
    "confidence": "medium",
    "range": {
      "conservative": 518,
      "optimistic": 962
    }
  },
  "revenue": {
    "estimatedMonthlyClicks": 740,
    "estimatedMonthlyRevenue": 1388,
    "assumptions": {
      "conversionRate": 0.025,
      "avgOrderValue": 75
    }
  },
  "timeframe": {
    "targetDate": "90 days",
    "reviewDate": "2026-04-25"
  }
}
```

## Confidence Levels

### High Confidence
- Keywords in positions 1-10
- Stable impression volume (low variance)
- No major SERP feature changes expected
- Historical data available for comparison

### Medium Confidence
- Keywords in positions 11-30
- Moderate impression variance
- Some SERP features present
- Limited historical data

### Low Confidence
- Keywords in positions 30+
- High impression variance
- Multiple SERP features affecting CTR
- New or volatile keywords

## Best Practices

### Setting Expectations

1. **Use conservative estimates** for stakeholder presentations
2. **Provide ranges** rather than single numbers
3. **Include assumptions** clearly in all forecasts
4. **Update benchmarks** quarterly based on actual performance

### Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Ignoring SERP features | Always check live SERP before forecasting |
| Using outdated benchmarks | Update CTR data annually |
| Assuming linear improvement | Use realistic position targets |
| Ignoring seasonality | Adjust for known seasonal patterns |
| Over-promising | Use conservative range for commitments |

### Seasonality Adjustments

For seasonal products, adjust impressions:

| Season | Shorts/Swim | Pants/Bottoms |
|--------|-------------|---------------|
| Q1 (Jan-Mar) | 0.6x | 1.2x |
| Q2 (Apr-Jun) | 1.4x | 0.8x |
| Q3 (Jul-Sep) | 1.3x | 0.7x |
| Q4 (Oct-Dec) | 0.7x | 1.3x |

## Output Files

```
workflows/seo/forecasts/
├── forecast-[date].json           # Full forecast data
├── forecast-summary-[date].md     # Human-readable summary
├── tracking.csv                   # Ongoing tracking
└── variance-report-[date].md      # Monthly variance analysis
```

## Related Workflows

- [full-catalog.md](full-catalog.md) - Use forecasts to prioritize optimization
- [monthly-trends.md](monthly-trends.md) - Incorporate seasonal adjustments
- [content-gaps.md](content-gaps.md) - Forecast impact of new content
