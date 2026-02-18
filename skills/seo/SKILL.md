---
name: seo
description: SEO research and content optimization for keyword research, search performance analysis, and content generation. Activate when user asks about SEO, keyword opportunities, meta titles/descriptions, search rankings, or wants to optimize product descriptions, collections, or webpages for search. Integrates with Google Search Console, Google Ads Keyword Planner, and Google Trends.
---

# SEO Research & Content Optimization

## Purpose

Comprehensive SEO skill for keyword research, content optimization, and search performance analysis. This is an orchestration skill that combines data from multiple tool categories to identify opportunities and generate optimized content for product catalogs, collections, and webpages.

## Tool Categories Used

This skill integrates tools from multiple `~~` categories:
- **`~~seo`** - Google Search Console for search performance data (impressions, clicks, CTR, position)
- **`~~search-ads`** - Google Ads Keyword Planner for exact search volume and keyword ideas
- **`~~search-trends`** - Google Trends for search interest trends, geographic data, rising queries
- **`~~analytics`** - Google Analytics for traffic and engagement metrics
- **`~~e-commerce`** - Shopify for product catalog data
- **`~~database`** - PostgreSQL for cross-source data queries
- **`~~browser`** - Browser automation for Google Trends fallback if API unavailable

Authentication for all integrated tools is handled by their respective MCP server configurations.

## When to Use

Activate this skill when the user:
- Wants to optimize product descriptions for SEO
- Asks about keyword opportunities or search performance
- Needs to improve meta titles or meta descriptions
- Wants to analyze search traffic or rankings
- Mentions "SEO", "search optimization", "keyword research"
- Asks to optimize a product catalog, collection, or webpage for search

## Available Workflows

### 1. Full Catalog Optimization

Complete SEO audit and optimization for entire product catalog.

**When to use:** Annual or quarterly SEO refresh, new product launches at scale

**Process:**
1. Fetch product catalog from `~~e-commerce` tools or `~~database` tools
2. Get 90-day search performance from `~~seo` tools
3. Research keyword opportunities via `~~search-trends` tools
4. Score keywords using opportunity formula
5. Analyze current descriptions for SEO gaps
6. Generate optimized descriptions with brand voice
7. Export to CSV for Shopify import

**Detailed workflow:** [references/workflows/full-catalog.md](references/workflows/full-catalog.md)

### 2. Single Product/Collection Optimization

Targeted optimization for specific products or collections.

**When to use:** New product launches, underperforming products, collection refreshes

**Process:**
1. Accept product handle or collection name
2. Get specific search data from `~~seo` tools
3. Analyze current content against SEO best practices
4. Generate optimized version
5. Output diff for review

**Detailed workflow:** [references/workflows/single-product.md](references/workflows/single-product.md)

### 3. Webpage Optimization

SEO analysis and recommendations for non-product pages.

**When to use:** Landing pages, blog posts, about pages, collection pages

**Process:**
1. Accept URL or page path
2. Get page data from `~~analytics` tools
3. Get query data from `~~seo` tools for URL
4. Analyze on-page SEO factors
5. Generate recommendations

**Detailed workflow:** [references/workflows/webpage.md](references/workflows/webpage.md)

### 4. Monthly Trends Analysis

Regular trend monitoring to align content with seasonal demand.

**When to use:** Monthly check-ins, quarterly planning, before campaigns

**Process:**
1. Check core product trends via `~~search-trends` tools
2. Identify seasonal patterns and peak periods
3. Find rising queries and emerging opportunities
4. Update content calendar based on findings
5. Adjust optimization priorities

**Detailed workflow:** [references/workflows/monthly-trends.md](references/workflows/monthly-trends.md)

### 5. Topic Cluster Planning

Build comprehensive topic clusters with pillar pages and supporting content.

**When to use:** Building topical authority, creating content strategy, improving internal linking

**Detailed workflow:** [references/workflows/topic-clusters.md](references/workflows/topic-clusters.md)

### 6. Content Gap Analysis

Identify keyword and content opportunities competitors rank for but you don't.

**When to use:** Competitive analysis, content planning, finding new opportunities

**Detailed workflow:** [references/workflows/content-gaps.md](references/workflows/content-gaps.md)

### 7. Performance Forecasting

Predict traffic impact of ranking improvements using CTR benchmarks.

**When to use:** Prioritizing optimization efforts, setting expectations, ROI analysis

**Detailed workflow:** [references/workflows/performance-forecasting.md](references/workflows/performance-forecasting.md)

### 8. A/B Testing Framework

Systematic testing of meta titles and descriptions for CTR improvement.

**When to use:** Validating optimization hypotheses, improving high-value pages

**Detailed workflow:** [references/workflows/ab-testing.md](references/workflows/ab-testing.md)

### 9. Automated Monitoring

Continuous tracking of keyword positions and performance alerts.

**When to use:** Ongoing SEO maintenance, early problem detection

**Detailed workflow:** [references/workflows/monitoring.md](references/workflows/monitoring.md)

### 10. SERP Feature Targeting

Win featured snippets, People Also Ask, and other SERP features.

**When to use:** Increasing visibility beyond rankings, targeting specific features

**Detailed workflow:** [references/workflows/serp-features.md](references/workflows/serp-features.md)

### 11. Competitor Tracking

Systematic monitoring of competitor SEO activities and rankings.

**When to use:** Competitive intelligence, threat detection, opportunity identification

**Detailed workflow:** [references/workflows/competitor-tracking.md](references/workflows/competitor-tracking.md)

### 12. Authority Analysis

Assess domain authority and backlink profiles for keyword prioritization.

**When to use:** Keyword difficulty assessment, link building planning

**Detailed workflow:** [references/workflows/authority-analysis.md](references/workflows/authority-analysis.md)

### 13. AI Citation Tracking

Monitor and optimize presence in AI-generated search responses.

**When to use:** Tracking visibility in AI Overviews, ChatGPT, Perplexity, and other AI search

**Detailed workflow:** [references/workflows/ai-citation-tracking.md](references/workflows/ai-citation-tracking.md)

### 14. Entity Optimization

Improve how search engines and AI systems understand your brand and products.

**When to use:** Knowledge Graph inclusion, improving AI recognition, semantic search

**Detailed workflow:** [references/workflows/entity-optimization.md](references/workflows/entity-optimization.md)

### 15. Voice Search Optimization

Optimize content for voice assistants and conversational queries.

**When to use:** Targeting Google Assistant, Siri, Alexa queries

**Detailed workflow:** [references/workflows/voice-search.md](references/workflows/voice-search.md)

## Keyword Opportunity Scoring

Keywords are scored using the opportunity formula with intent classification:

```
opportunity_score = (impressions x (1 - current_ctr) x position_weight x intent_multiplier) / 1000
position_weight = max(0.1, (50 - avg_position) / 50)
intent_multiplier = 2.0 (transactional), 1.5 (commercial), 1.0 (informational), 0.8 (navigational)
```

**Score tiers:**
- 90+ = Critical (immediate action required)
- 70-89 = High priority
- 50-69 = Medium priority
- 30-49 = Low priority
- <30 = Monitor

**Search Intent Types:**
- **Transactional** (2.0x): "buy corduroy shorts", keywords with purchase signals
- **Commercial** (1.5x): "best retro shorts", comparison/research keywords
- **Informational** (1.0x): "what are dolphin shorts", educational queries
- **Navigational** (0.8x): "your brand website", brand searches

**Detailed methodology:** [references/keyword-scoring.md](references/keyword-scoring.md)

## SEO Best Practices (2026)

### Meta Titles
- Length: 50-60 characters
- Format: `{Primary Keyword} | {Brand Name}`
- Front-load important keywords
- Include product type, color, material where relevant

### Meta Descriptions
- Length: 150-160 characters
- Include primary keyword naturally
- Add compelling CTA or value proposition
- Mention key differentiators (free shipping, made in USA)

### Product Descriptions
- Keyword density: 1-1.5% for primary keywords
- Include primary keyword in first paragraph
- Use semantic variations (synonyms, related terms)
- Structure with headers and bullet points
- Maintain brand voice throughout

### Technical SEO
- Product schema structured data (price, availability, reviews)
- Mobile-first indexing compliance
- Core Web Vitals optimization
- Clean URL structure with keywords

**Full best practices:** [references/best-practices-2026.md](references/best-practices-2026.md)

## Integration with Other Tools

### With `~~seo` (Search Console)
Get top queries, URL-specific queries, and search performance data for the domain.

### With `~~search-ads` (Google Ads / Keyword Planner)
Get exact search volume for keywords and generate keyword ideas from seed keywords or URLs.

### With `~~search-trends` (Google Trends)
Compare keyword interest over time, get geographic breakdowns, and find rising related queries.

### With `~~analytics` (Web Analytics)
Get top pages by traffic and page-specific performance data.

### With `~~e-commerce` (Shopify) / `~~database` (PostgreSQL)
Fetch active product catalog data for optimization.

### With `~~browser` (Google Trends Fallback)
If Trends API access is not available, use browser automation:
1. Navigate to trends.google.com
2. Search for target keywords
3. Extract relative search volume data
4. Compare keyword variations (up to 5)

## Input Templates

### Product Catalog Input
Required fields for bulk optimization:
- `handle` - Product URL slug
- `title` - Product name
- `description` - Current HTML description
- `product_type` - Category/type
- `tags` - Product tags

**Template:** [references/templates/product-catalog-input.md](references/templates/product-catalog-input.md)

### Webpage Input
- `url` - Full URL or path
- `title` - Page title
- `content` - Page content (HTML or text)
- `type` - Page type (landing, blog, about, collection)

**Template:** [references/templates/webpage-input.md](references/templates/webpage-input.md)

## Output Formats

### CSV Export (Shopify-compatible)
```csv
handle,meta_title,meta_description,description_html,primary_keyword,secondary_keywords,opportunity_score
```

### JSON Export
```json
{
  "handle": "product-handle",
  "seo": {
    "meta_title": "...",
    "meta_description": "...",
    "primary_keyword": "...",
    "opportunity_score": 85
  },
  "content": {
    "description_html": "..."
  }
}
```

**Output specifications:** [references/templates/output-csv.md](references/templates/output-csv.md)

## Brand Voice Integration

When generating optimized content, maintain brand voice by referencing the brand-voice skill.

Key brand elements:
- Tagline pattern: "These are your {dad's/mom's} {product}!"
- Tone: Nostalgic Americana, playful, witty
- Avoid: "Premium", "trendy", generic marketing speak

## Troubleshooting

### "No search data available"
- Verify domain is verified in Search Console
- Check date range (data may take 2-3 days to appear)
- Ensure correct domain format (sc-domain:example.com)

### "Low impression count"
- Product may be too new for search data
- Check if product pages are indexed
- Use URL inspection tools to verify indexing status

### "Keywords not ranking"
- Verify keyword is in product content
- Check for technical SEO issues (crawlability, indexing)
- Review competitor rankings for same keyword

## References

- [best-practices-2026.md](references/best-practices-2026.md) - Current SEO standards (including AI/LLM optimization)
- [keyword-scoring.md](references/keyword-scoring.md) - Opportunity scoring methodology with intent classification
- [templates/](references/templates/) - Input/output templates
- [workflows/](references/workflows/) - Detailed workflow documentation
