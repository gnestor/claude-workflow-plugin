---
name: report
description: Generate a structured analysis report with executive summary, findings, and recommendations.
---

# Generate Report

Create a structured, data-driven analysis report. Reports follow a standardized format and are saved to the `reports/` directory.

## Process

### Step 1: Determine Report Scope

Ask the user (if not already clear from context):

1. **What topic?** (e.g., "email campaign performance", "Q4 sales", "ad spend efficiency")
2. **What type?** Offer these options:
   - **Performance** -- Top vs. bottom performer analysis
   - **Financial** -- Revenue, costs, margins, P&L
   - **Marketing** -- Campaign effectiveness, channel comparison
   - **Operations** -- Inventory, fulfillment, customer service metrics
   - **Trend** -- Changes over time, seasonal patterns
   - **Competitive** -- Comparison against benchmarks or competitors
3. **What time period?** (e.g., last 30 days, Q4 2025, year-over-year)
4. **Any specific questions to answer?** (optional -- helps focus the analysis)

### Step 2: Gather Data

Use the appropriate `~~category` tools based on the report type:

| Report Type | Primary Data Sources | Secondary Sources |
|-------------|---------------------|-------------------|
| Financial | ~~accounting, ~~e-commerce | ~~database |
| Marketing | ~~email-marketing, ~~paid-social, ~~search-ads | ~~analytics, ~~social-media |
| Operations | ~~e-commerce, ~~customer-support | ~~database |
| Performance | Varies by subject | ~~analytics |
| Trend | ~~analytics, ~~seo | ~~e-commerce |
| Competitive | ~~seo, ~~search-ads | ~~analytics |

**Data gathering guidelines:**
- Pull data for the requested time period
- Include comparison periods where relevant (previous period, year-over-year)
- Quantify everything -- avoid vague terms like "many" or "some"
- If a data source is unavailable, note it and proceed with what is available

### Step 3: Analyze

Perform the analysis appropriate to the report type:

**Performance analysis:**
- Identify top and bottom performers
- Find common characteristics of each group
- Calculate statistical differences

**Financial analysis:**
- Revenue breakdown by channel/product/category
- Cost analysis and margin calculation
- Trend identification and anomaly detection

**Marketing analysis:**
- Channel performance comparison (ROAS, CPA, conversion rate)
- Campaign-level breakdown
- Audience segment analysis

**Operations analysis:**
- Fulfillment metrics (time to ship, delivery rate)
- Inventory health (stockouts, overstock, turnover)
- Customer service metrics (response time, resolution rate, CSAT)

### Step 4: Write the Report

Follow this structure for every report:

```markdown
# [Report Title]

**Analysis Date:** [date]
**Period:** [time range analyzed]
**Data Sources:** [list of ~~category tools used]

## Executive Summary

[2-3 paragraphs: What was analyzed, what was found, what should be done about it. This section should stand alone -- a reader who only reads this should understand the key takeaways.]

### Key Findings

1. [Most important finding with specific numbers]
2. [Second finding with specific numbers]
3. [Third finding with specific numbers]

## Analysis

### [Section by topic area]

[Detailed analysis with tables, comparisons, specific examples]

### [Additional sections as needed]

## Recommendations

[Numbered, actionable recommendations. Each should specify:
- What to do
- Why (tied to a finding)
- Expected impact (quantified if possible)]

## Methodology

**Data sources:** [What was queried]
**Time period:** [Exact dates]
**Metrics used:** [Definitions of key metrics]

### Limitations

[What the analysis does not cover, data gaps, caveats]

## Appendix

[Supporting data tables, full lists, raw query outputs]
```

### Step 5: Save and Present

1. **Save** the report to `reports/{topic}-{type}.md`
   - Examples: `email-campaign-performance.md`, `q4-financial-summary.md`, `meta-ads-roas-analysis.md`
2. **Present** the executive summary and key findings to the user
3. **Share** the file path so the user can access the full report

## Writing Guidelines

### Data Presentation
- Use markdown tables for comparisons
- Include specific examples alongside patterns -- do not just state trends, show the data
- Round numbers appropriately (currency to cents, percentages to one decimal)

### Writing Style
- Lead with insights, not methodology
- Every finding should suggest what to do about it
- Write for a general business audience -- avoid jargon
- Use active voice: "Sales increased 15%" not "A 15% increase in sales was observed"
- Be direct about bad news -- do not bury problems

### Visual Analysis
When the report involves visual content (emails, ads, creative):
- Describe key visual elements (colors, layout, typography, imagery)
- Note patterns across high performers vs. low performers
- Categorize visual styles with descriptive names
- Reference specific assets by name or ID
