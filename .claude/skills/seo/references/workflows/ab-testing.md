# SEO A/B Testing Framework

## Overview

Systematic approach to testing meta title and description variations to improve click-through rates. This framework enables data-driven optimization decisions with statistical confidence.

**Duration:** 2-4 weeks minimum test duration
**Output:** Validated optimizations with measured impact

## Why A/B Test SEO Elements

1. **Validate assumptions** - Prove which approach works better
2. **Reduce risk** - Test before rolling out changes
3. **Compound gains** - Small CTR improvements across many pages add up
4. **Build knowledge** - Learn what resonates with your audience

## What to Test

### High-Impact Elements (Priority 1)

| Element | Impact | Test Type |
|---------|--------|-----------|
| Meta title structure | High | Format, keyword placement |
| Meta description CTA | High | Different calls-to-action |
| Title character count | Medium | Short vs. full-length |
| Brand name position | Medium | Beginning vs. end |

### Medium-Impact Elements (Priority 2)

| Element | Impact | Test Type |
|---------|--------|-----------|
| Emoji in title/description | Medium | With vs. without |
| Price in title | Medium | Include vs. exclude |
| Shipping mention | Medium | "Free shipping" variations |
| Social proof | Medium | "1000+ sold" type claims |

### Low-Impact Elements (Priority 3)

| Element | Impact | Test Type |
|---------|--------|-----------|
| Punctuation | Low | Period vs. no period |
| Capitalization | Low | Title Case vs. Sentence case |
| Pipe vs. dash | Low | "| Brand" vs. "- Brand" |

## Test Design Principles

### Sample Size Requirements

**Minimum requirements for statistical significance:**

| Metric | Minimum Sample | Ideal Sample |
|--------|----------------|--------------|
| Impressions per variant | 1,000 | 5,000+ |
| Clicks per variant | 50 | 200+ |
| Test duration | 2 weeks | 4 weeks |

### Confidence Level

Target 95% confidence level (p < 0.05) before declaring a winner.

**Quick significance calculator:**
```
MDE (Minimum Detectable Effect) = 2.8 × sqrt((p × (1-p) × 2) / n)

where:
  p = baseline CTR
  n = sample size per variant
```

**Example:**
```
Baseline CTR: 3%
Sample size: 1,000 impressions per variant

MDE = 2.8 × sqrt((0.03 × 0.97 × 2) / 1000)
MDE = 2.8 × sqrt(0.0582 / 1000)
MDE = 2.8 × 0.00763
MDE = 2.1%

Minimum detectable improvement: 3% → 5.1% CTR
```

## Test Setup Process

### Step 1: Select Test Candidates

**Criteria for test selection:**
- High impressions (1000+/month minimum)
- Stable position (not fluctuating significantly)
- Room for improvement (CTR below benchmark)
- Important to business (high-value products)

**Candidate identification query:**
```sql
-- Find test candidates from GSC data
SELECT
  query,
  impressions,
  clicks,
  (clicks::float / impressions) as ctr,
  position
FROM gsc_queries
WHERE impressions >= 1000
  AND position <= 15
  AND (clicks::float / impressions) < 0.05
ORDER BY impressions DESC
LIMIT 20;
```

### Step 2: Create Variations

**Variation naming convention:**
```
[element]-[change]-[date]
title-keyword-first-2026-01
desc-free-shipping-cta-2026-01
```

**Documentation template:**
```markdown
## Test: [Test Name]

**Hypothesis:** [What you expect to happen and why]

**Control (A):**
- Title: [Current title]
- Description: [Current description]

**Variant (B):**
- Title: [New title]
- Description: [New description]

**Primary Metric:** CTR
**Secondary Metrics:** Position, Clicks

**Start Date:** [Date]
**Minimum Duration:** 2 weeks
**Target Sample:** 2,000 impressions per variant
```

### Step 3: Implementation

**For Shopify:**

Since you can't run true split tests on meta tags, use sequential testing:

1. **Baseline period:** Track current performance for 2+ weeks
2. **Test period:** Implement variant for 2+ weeks
3. **Compare:** Analyze before/after performance

**Track in spreadsheet:**
```csv
date,variant,impressions,clicks,ctr,position,notes
2026-01-01,control,145,4,2.76%,8.2,baseline start
2026-01-02,control,152,5,3.29%,7.9,
...
2026-01-15,control,161,5,3.11%,8.1,baseline end
2026-01-16,variant,158,7,4.43%,8.0,test start
```

### Step 4: Statistical Analysis

**Calculate significance:**

```typescript
function calculateSignificance(
  controlImpressions: number,
  controlClicks: number,
  variantImpressions: number,
  variantClicks: number
): { significant: boolean; confidence: number; uplift: number } {
  const controlCTR = controlClicks / controlImpressions;
  const variantCTR = variantClicks / variantImpressions;

  // Pooled proportion
  const pooledCTR = (controlClicks + variantClicks) /
                    (controlImpressions + variantImpressions);

  // Standard error
  const se = Math.sqrt(
    pooledCTR * (1 - pooledCTR) *
    (1/controlImpressions + 1/variantImpressions)
  );

  // Z-score
  const z = (variantCTR - controlCTR) / se;

  // Two-tailed p-value approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    significant: pValue < 0.05,
    confidence: (1 - pValue) * 100,
    uplift: ((variantCTR - controlCTR) / controlCTR) * 100
  };
}
```

**Quick significance check:**

| Control CTR | Variant CTR | Min Impressions | Significant? |
|-------------|-------------|-----------------|--------------|
| 2% | 3% | 2,000 | Maybe (need 3,000+) |
| 2% | 4% | 1,000 | Likely |
| 3% | 4% | 3,000 | Maybe (need 5,000+) |
| 3% | 5% | 1,500 | Likely |

### Step 5: Decision Making

**Decision framework:**

| Confidence | Uplift | Decision |
|------------|--------|----------|
| ≥95% | Positive | Implement variant |
| ≥95% | Negative | Keep control |
| 90-95% | >20% | Consider implementing |
| <90% | Any | Continue testing |

**Document outcome:**
```markdown
## Test Results: [Test Name]

**Duration:** [Start] to [End]
**Sample Size:** [N] impressions per variant

### Results

| Metric | Control | Variant | Change |
|--------|---------|---------|--------|
| Impressions | 2,500 | 2,400 | -4% |
| Clicks | 75 | 108 | +44% |
| CTR | 3.0% | 4.5% | +50% |

**Statistical Confidence:** 97.2%
**Decision:** Implement variant

### Learnings
- [What we learned]
- [Implications for future tests]
```

## Variation Guidelines

### Meta Title Variations

**Pattern 1: Keyword Position**
```
Control: Men's Corduroy Shorts | Your Brand
Test A:  Corduroy Shorts for Men | Your Brand
Test B:  Your Brand Men's Corduroy Shorts
```

**Pattern 2: Benefit Inclusion**
```
Control: Men's Corduroy Shorts | Your Brand
Test A:  Men's Stretch Corduroy Shorts | Your Brand
Test B:  Men's Corduroy Shorts - Free Shipping | Your Brand
```

**Pattern 3: Structure**
```
Control: Men's Corduroy Shorts | Your Brand
Test A:  Corduroy Shorts | Men's Vintage Style | Your Brand
Test B:  [Sale] Men's Corduroy Shorts | Your Brand
```

### Meta Description Variations

**Pattern 1: CTA Type**
```
Control: Vintage-inspired corduroy shorts with 3" inseam. Free shipping $100+.
Test A:  Vintage-inspired corduroy shorts with 3" inseam. Shop now →
Test B:  Vintage-inspired corduroy shorts with 3" inseam. Get yours today.
```

**Pattern 2: Opening Hook**
```
Control: Vintage-inspired corduroy shorts...
Test A:  Your dad wore these. Now you can too...
Test B:  The shorts that defined the 80s...
```

**Pattern 3: Social Proof**
```
Control: Vintage-inspired corduroy shorts with 3" inseam.
Test A:  ★★★★★ Vintage-inspired corduroy shorts with 3" inseam.
Test B:  1000+ sold! Vintage-inspired corduroy shorts with 3" inseam.
```

## Test Tracking Template

### Master Test Log

```csv
test_id,element,hypothesis,control,variant,start_date,end_date,status,winner,confidence,uplift,notes
T001,title,keyword first improves CTR,Men's Corduroy Shorts | Your Brand,Corduroy Shorts for Men | Your Brand,2026-01-15,2026-01-29,complete,variant,97%,+23%,Implement to similar products
T002,description,CTA improves clicks,Free shipping $100+,Shop now →,2026-02-01,,running,,,,
```

### Weekly Check-in

```markdown
## Week [N] Test Report

### Active Tests
| Test | Days Running | Sample Size | Current CTR Diff | Projected End |
|------|--------------|-------------|------------------|---------------|
| T002 | 7 | 1,200 | +12% | Feb 15 |

### Tests Approaching Decision
- T002: Need 800 more impressions for significance

### Next Tests Queue
1. Title: Price inclusion test
2. Description: Emoji test
```

## Common Pitfalls

### Avoid These Mistakes

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Stopping too early | False positives | Wait for minimum sample size |
| Testing during anomalies | Skewed data | Avoid holidays, sales events |
| Testing multiple elements | Can't isolate effect | One change at a time |
| Ignoring seasonality | Confounding factors | Compare same time period YoY |
| No documentation | Lost learnings | Log every test |

### Confounding Factors

**Control for these:**
- Position changes (affects CTR independently)
- SERP feature changes (new AI Overview, etc.)
- Competitor activity
- Seasonal patterns
- Algorithm updates

## Integration with Workflows

### With Full Catalog Optimization
1. Run A/B tests on top 10 products first
2. Apply learnings to remaining catalog
3. Monitor for consistent results

### With Monthly Trends
1. Pause tests during high-volatility periods
2. Consider seasonal messaging tests
3. Use trend data for test prioritization

### With Performance Forecasting
1. Use forecast to estimate test value
2. Prioritize tests with highest projected impact
3. Validate forecasts with test results

## Output Files

```
workflows/seo/ab-tests/
├── test-log.csv                    # Master test log
├── active-tests/
│   ├── T002-description-cta.md     # Active test documentation
│   └── T003-title-price.md
├── completed-tests/
│   ├── T001-title-keyword.md       # Completed test with results
│   └── ...
├── learnings.md                    # Aggregated insights
└── variation-library.md            # Proven variations
```

## Related Workflows

- [performance-forecasting.md](performance-forecasting.md) - Estimate test impact
- [single-product.md](single-product.md) - Apply test learnings
- [full-catalog.md](full-catalog.md) - Scale successful tests
