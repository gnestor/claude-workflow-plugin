---
name: seo-audit
description: Run a comprehensive SEO audit with keyword analysis, search performance data, and actionable recommendations.
---

# SEO Audit

Run a comprehensive SEO analysis using search performance data, keyword research, and analytics. Produces actionable recommendations for improving organic search visibility.

## Process

### Step 1: Determine Audit Scope

Ask the user (if not already clear from context):

1. **What scope?**
   - **Full catalog** -- Audit the entire product catalog for SEO gaps and opportunities
   - **Single product** -- Deep-dive optimization for a specific product (ask for product handle or name)
   - **Single page** -- Audit a specific URL or landing page
   - **Collection** -- Optimize a product collection page
2. **What domain?** (if not already known from company context)
3. **Any priority keywords or topics?** (optional -- helps focus the analysis)

### Step 2: Gather Search Data

Pull data from available tools. Not all tools will be configured -- use what is available and note gaps.

**From ~~seo (Search Console):**
- Top queries by impressions and clicks (last 90 days)
- Pages with highest impressions but low CTR (opportunity pages)
- Average position data for target keywords
- Indexing status for key pages

**From ~~search-ads (Google Ads Keyword Planner):**
- Exact monthly search volume for target keywords
- Keyword ideas from seed terms or URL
- Competition level and suggested bids (indicates commercial value)

**From ~~analytics:**
- Top landing pages by organic traffic
- Bounce rate and engagement metrics for organic sessions
- Conversion rate from organic traffic

**From ~~e-commerce (if full catalog audit):**
- Product catalog: titles, descriptions, meta titles, meta descriptions, tags
- Collection structure and hierarchy
- URL slugs and handles

### Step 3: Analyze

#### For Full Catalog Audit

1. **Keyword mapping**: Match each product to its best-fit keywords using search volume and current ranking data
2. **Gap analysis**: Identify products with:
   - Missing or weak meta titles (too short, no keywords, over 60 chars)
   - Missing or weak meta descriptions (too short, no CTA, over 160 chars)
   - Thin product descriptions (under 100 words, no keyword usage)
   - No organic impressions (not indexed or not ranking)
3. **Opportunity scoring**: Score each keyword opportunity using:
   ```
   opportunity_score = (impressions * (1 - current_ctr) * position_weight * intent_multiplier) / 1000
   position_weight = max(0.1, (50 - avg_position) / 50)
   ```
   Intent multipliers: transactional (2.0), commercial (1.5), informational (1.0), navigational (0.8)
4. **Priority ranking**: Sort opportunities by score and group into tiers:
   - 90+ = Critical (immediate action)
   - 70-89 = High priority
   - 50-69 = Medium priority
   - 30-49 = Low priority
   - <30 = Monitor

#### For Single Product/Page Audit

1. **Current state assessment**:
   - Current meta title, meta description, and page content
   - Current search queries driving impressions (from ~~seo)
   - Current ranking positions and CTR
2. **Keyword research**:
   - Primary keyword (highest volume + relevance)
   - Secondary keywords (related terms, long-tail variants)
   - Search intent classification for each
3. **On-page SEO checklist**:
   - Primary keyword in meta title (front-loaded)
   - Primary keyword in meta description
   - Primary keyword in first paragraph of content
   - Semantic variations used throughout
   - Proper heading structure (H1, H2, H3)
   - Internal linking to related products/collections
   - Image alt text with keywords
   - Schema markup present (product, breadcrumb, FAQ)
4. **Competitive analysis**: Check what currently ranks for target keywords and identify content gaps

### Step 4: Generate Recommendations

Structure recommendations by priority and effort:

**Quick wins** (high impact, low effort):
- Meta title and description rewrites
- Missing alt text additions
- Internal link additions

**Medium effort** (high impact, moderate effort):
- Product description rewrites with keyword optimization
- Collection page content additions
- Schema markup implementation

**Strategic** (high impact, high effort):
- New content creation for gap keywords
- Topic cluster development
- Technical SEO improvements

For each recommendation, include:
- **What to change**: Current state vs. recommended state
- **Target keyword**: The primary keyword being optimized for
- **Expected impact**: Estimated traffic gain based on position improvement and search volume
- **Search volume**: Monthly searches for the target keyword (from ~~search-ads if available)

### Step 5: Write the Audit Report

Save to: `reports/seo-audit-{scope}-{date}.md`

Follow this structure:

```markdown
# SEO Audit: [Scope Description]

**Audit Date:** [date]
**Domain:** [domain]
**Period Analyzed:** [date range for search data]
**Data Sources:** [list of tools used]

## Executive Summary

[Overview of SEO health, biggest opportunities, and top recommendations]

### Scorecard

| Metric | Value | Assessment |
|--------|-------|------------|
| Products/pages audited | [N] | |
| Keywords tracked | [N] | |
| Avg. organic CTR | [%] | [Good/Needs work] |
| Pages with missing meta titles | [N] | |
| Pages with missing meta descriptions | [N] | |
| High-opportunity keywords (score 70+) | [N] | |

## Top Keyword Opportunities

| Keyword | Search Volume | Current Position | Current CTR | Opportunity Score | Intent |
|---------|--------------|-----------------|-------------|-------------------|--------|
| [keyword] | [vol] | [pos] | [ctr] | [score] | [type] |

## Findings

### [Finding 1: Title]
[Detailed analysis with data]

### [Finding 2: Title]
[Detailed analysis with data]

## Recommendations

### Quick Wins
1. [Recommendation with specific before/after]

### Medium Effort
1. [Recommendation with specific before/after]

### Strategic
1. [Recommendation with expected impact]

## Optimized Content (if applicable)

[For single product/page audits, include the recommended meta title, meta description, and content outline]

## Methodology

[How the audit was conducted, scoring formula, data sources]

## Appendix

[Full keyword list, complete product audit table, raw data]
```

### Step 6: Present Results

1. Share the executive summary and scorecard
2. Highlight the top 3-5 opportunities with specific recommendations
3. For full catalog audits, offer to generate optimized meta titles/descriptions for priority items
4. Provide the file path to the full report

## SEO Best Practices Reference

### Meta Titles
- Length: 50-60 characters
- Format: `{Primary Keyword} | {Brand Name}`
- Front-load important keywords
- Include product type, color, material where relevant

### Meta Descriptions
- Length: 150-160 characters
- Include primary keyword naturally
- Add a compelling CTA or value proposition
- Mention key differentiators (free shipping, made in USA, etc.)

### Product Descriptions
- Keyword density: 1-1.5% for primary keywords
- Include primary keyword in first paragraph
- Use semantic variations (synonyms, related terms)
- Structure with headers and bullet points
- Maintain brand voice (reference `skills/brand-voice/SKILL.md`)

### Technical SEO Checks
- Product schema structured data (price, availability, reviews)
- Mobile-first indexing compliance
- Core Web Vitals
- Clean URL structure with keywords
- Canonical tags set correctly
- XML sitemap includes all target pages
