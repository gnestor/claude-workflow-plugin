---
name: seo
description: SEO research and content optimization for keyword research, search performance analysis, and content generation. Activate when user asks about SEO, keyword opportunities, meta titles/descriptions, search rankings, or wants to optimize product descriptions, collections, or webpages for search. Integrates with Google Search Console, Google Ads Keyword Planner, and Google Trends.
---

# SEO Research & Content Optimization

## Purpose

Comprehensive SEO skill for keyword research, content optimization, and search performance analysis. Combines Google Search Console data, Analytics, and keyword research tools to identify opportunities and generate optimized content for product catalogs, collections, and webpages.

## When to Use

Activate this skill when the user:
- Wants to optimize product descriptions for SEO
- Asks about keyword opportunities or search performance
- Needs to improve meta titles or meta descriptions
- Wants to analyze search traffic or rankings
- Mentions "SEO", "search optimization", "keyword research"
- Asks to optimize a product catalog, collection, or webpage for search

## Prerequisites

### Required Skills

This skill integrates with:
- **google/search-console** - Search performance data (impressions, clicks, CTR, position)
- **google/google-ads** - Keyword Planner for exact search volume and keyword ideas
- **google/trends** - Search interest trends, geographic data, rising queries (API in alpha)
- **google/analytics** - Traffic and engagement metrics
- **shopify** or **postgresql** - Product catalog data
- **Browser automation** (Claude in Chrome) - Google Trends fallback if API unavailable

### Authentication

Ensure Google skills are authenticated:
```bash
./lib/google-auth.ts
```

## Available Workflows

### 1. Full Catalog Optimization

Complete SEO audit and optimization for entire product catalog.

**When to use:** Annual or quarterly SEO refresh, new product launches at scale

**Process:**
1. Fetch product catalog from Shopify/PostgreSQL
2. Get 90-day search performance from Google Search Console
3. Research keyword opportunities via Google Trends
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
2. Get specific search data for related terms
3. Analyze current content against SEO best practices
4. Generate optimized version
5. Output diff for review

**Detailed workflow:** [references/workflows/single-product.md](references/workflows/single-product.md)

### 3. Webpage Optimization

SEO analysis and recommendations for non-product pages.

**When to use:** Landing pages, blog posts, about pages, collection pages

**Process:**
1. Accept URL or page path
2. Get Google Analytics page data
3. Get Search Console query data for URL
4. Analyze on-page SEO factors
5. Generate recommendations

**Detailed workflow:** [references/workflows/webpage.md](references/workflows/webpage.md)

### 4. Monthly Trends Analysis

Regular trend monitoring to align content with seasonal demand.

**When to use:** Monthly check-ins, quarterly planning, before campaigns

**Process:**
1. Check core product trends in Google Trends
2. Identify seasonal patterns and peak periods
3. Find rising queries and emerging opportunities
4. Update content calendar based on findings
5. Adjust optimization priorities

**Detailed workflow:** [references/workflows/monthly-trends.md](references/workflows/monthly-trends.md)

### 5. Topic Cluster Planning

Build comprehensive topic clusters with pillar pages and supporting content.

**When to use:** Building topical authority, creating content strategy, improving internal linking

**Process:**
1. Identify pillar topic based on product category
2. Map cluster content (products, blogs, guides, FAQs)
3. Define internal linking structure
4. Create content briefs for missing pieces
5. Track cluster performance metrics

**Detailed workflow:** [references/workflows/topic-clusters.md](references/workflows/topic-clusters.md)

### 6. Content Gap Analysis

Identify keyword and content opportunities competitors rank for but you don't.

**When to use:** Competitive analysis, content planning, finding new opportunities

**Process:**
1. Extract your keyword footprint from GSC
2. Research competitor keywords via SERP analysis
3. Compare and identify gaps
4. Prioritize by opportunity score
5. Create content briefs for high-priority gaps

**Detailed workflow:** [references/workflows/content-gaps.md](references/workflows/content-gaps.md)

### 7. Performance Forecasting

Predict traffic impact of ranking improvements using CTR benchmarks.

**When to use:** Prioritizing optimization efforts, setting expectations, ROI analysis

**Process:**
1. Gather current position and impression data
2. Set realistic position targets
3. Calculate expected traffic gain using CTR benchmarks
4. Apply modifiers for SERP features
5. Estimate revenue impact

**Detailed workflow:** [references/workflows/performance-forecasting.md](references/workflows/performance-forecasting.md)

### 8. A/B Testing Framework

Systematic testing of meta titles and descriptions for CTR improvement.

**When to use:** Validating optimization hypotheses, improving high-value pages

**Process:**
1. Select test candidates (high impression, room for improvement)
2. Create variations with clear hypotheses
3. Run sequential tests with baseline comparison
4. Analyze for statistical significance
5. Apply winning variations

**Detailed workflow:** [references/workflows/ab-testing.md](references/workflows/ab-testing.md)

### 9. Automated Monitoring

Continuous tracking of keyword positions and performance alerts.

**When to use:** Ongoing SEO maintenance, early problem detection

**Process:**
1. Set up weekly automated snapshots
2. Configure alert thresholds
3. Generate weekly performance reports
4. Monthly deep analysis
5. Dashboard maintenance

**Detailed workflow:** [references/workflows/monitoring.md](references/workflows/monitoring.md)

### 10. SERP Feature Targeting

Win featured snippets, People Also Ask, and other SERP features.

**When to use:** Increasing visibility beyond rankings, targeting specific features

**Process:**
1. Audit current SERP for target keywords
2. Identify feature opportunities (snippets, PAA, images)
3. Optimize content format for each feature type
4. Implement structured data markup
5. Track feature wins/losses

**Detailed workflow:** [references/workflows/serp-features.md](references/workflows/serp-features.md)

### 11. Competitor Tracking

Systematic monitoring of competitor SEO activities and rankings.

**When to use:** Competitive intelligence, threat detection, opportunity identification

**Process:**
1. Define competitor set (direct, indirect, content)
2. Track shared keyword positions weekly
3. Monitor competitor content changes
4. Alert on significant ranking movements
5. Analyze competitor strategies monthly

**Detailed workflow:** [references/workflows/competitor-tracking.md](references/workflows/competitor-tracking.md)

### 12. Authority Analysis

Assess domain authority and backlink profiles for keyword prioritization.

**When to use:** Keyword difficulty assessment, link building planning

**Process:**
1. Baseline your domain authority
2. Benchmark against competitors
3. Calculate keyword rankability scores
4. Identify link building opportunities
5. Track authority growth

**Detailed workflow:** [references/workflows/authority-analysis.md](references/workflows/authority-analysis.md)

### 13. AI Citation Tracking

Monitor and optimize presence in AI-generated search responses.

**When to use:** Tracking visibility in AI Overviews, ChatGPT, Perplexity, and other AI search

**Process:**
1. Define queries to track across AI platforms
2. Weekly manual sampling of AI responses
3. Log citations, brand mentions, and competitor presence
4. Analyze content that gets cited vs. ignored
5. Optimize content structure for AI citation

**Detailed workflow:** [references/workflows/ai-citation-tracking.md](references/workflows/ai-citation-tracking.md)

### 14. Entity Optimization

Improve how search engines and AI systems understand your brand and products.

**When to use:** Knowledge Graph inclusion, improving AI recognition, semantic search

**Process:**
1. Map brand, product, and category entities
2. Define entity attributes and relationships
3. Implement comprehensive schema markup
4. Build Wikidata/Wikipedia presence
5. Track entity recognition across platforms

**Detailed workflow:** [references/workflows/entity-optimization.md](references/workflows/entity-optimization.md)

### 15. Voice Search Optimization

Optimize content for voice assistants and conversational queries.

**When to use:** Targeting Google Assistant, Siri, Alexa queries

**Process:**
1. Research conversational query variants
2. Create FAQ-style content with concise answers
3. Implement speakable and HowTo schema
4. Optimize for featured snippet capture
5. Test across voice platforms

**Detailed workflow:** [references/workflows/voice-search.md](references/workflows/voice-search.md)

## CLI Tool

```bash
# Analyze search performance for a domain
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts analyze your-domain.com

# Generate keyword opportunity report
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts keywords your-domain.com --days 90

# Audit single product SEO
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts audit <product-handle>

# Analyze content gaps vs competitors
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts gaps \
  --owned=owned-keywords.csv --competitor=competitor-keywords.csv

# Forecast traffic gain from position improvement
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts forecast 10000 12 5 \
  --keyword="corduroy shorts" --conversion-rate=0.025 --aov=75

# Competitor tracking tools
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts competitors list

# AI citation tracking
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts ai-tracking queries

# Export results
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts export csv
```

## Keyword Opportunity Scoring

Keywords are scored using the opportunity formula with intent classification:

```
opportunity_score = (impressions × (1 - current_ctr) × position_weight × intent_multiplier) / 1000
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

## Input Templates

### Product Catalog Input
Required fields for bulk optimization:
- `handle` - Product URL slug
- `title` - Product name
- `description` - Current HTML description
- `product_type` - Category/type
- `tags` - Product tags

Optional fields:
- `meta_title` - Current meta title
- `meta_description` - Current meta description
- `vendor` - Brand/vendor name
- `collections` - Collection memberships

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

## Integration Examples

### With Google Search Console
```bash
# Get top queries for domain
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-queries sc-domain:your-domain.com 90
```

### With Google Ads Keyword Planner
```bash
# Get exact search volume for keywords
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts \
  search-volume "corduroy shorts,dolphin shorts,bell bottoms"

# Generate keyword ideas from seed keywords
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts \
  keyword-ideas "vintage shorts,retro clothing"

# Generate keyword ideas from URL
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/google-ads/scripts/google-ads-client.ts \
  keyword-ideas --url https://your-domain.com
```

### With Google Trends API
```bash
# Compare keyword interest over time
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-over-time "corduroy shorts,dolphin shorts"

# Get geographic breakdown
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  interest-by-region "vintage shorts" --geo US --resolution REGION

# Find rising related queries
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/trends/scripts/trends-client.ts \
  related-queries "retro fashion"
```

**Note:** Google Trends API is in alpha (July 2025). Apply for access at:
https://developers.google.com/search/apis/trends

### With Google Analytics
```bash
# Get top pages by traffic
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/analytics/scripts/ga-client.ts \
  top-pages <property-id> 90daysAgo today
```

### With Shopify/PostgreSQL
```sql
-- Fetch active products
SELECT data FROM shopify_products WHERE data->>'status' = 'active'
```

### With Browser (Google Trends Fallback)
If Trends API access is not available, use Claude in Chrome:
1. Navigate to trends.google.com
2. Search for target keywords
3. Extract relative search volume data
4. Compare keyword variations (up to 5)

## Brand Voice Integration

When generating optimized content, maintain brand voice by referencing:
- [workflows/product-catalog-optimization/brand-voice.md](../../../workflows/product-catalog-optimization/brand-voice.md)

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
- Use `inspect-url` command to verify indexing status

### "Keywords not ranking"
- Verify keyword is in product content
- Check for technical SEO issues (crawlability, indexing)
- Review competitor rankings for same keyword

## References

- [best-practices-2026.md](references/best-practices-2026.md) - Current SEO standards (including AI/LLM optimization)
- [keyword-scoring.md](references/keyword-scoring.md) - Opportunity scoring methodology with intent classification
- [templates/](references/templates/) - Input/output templates
- [workflows/](references/workflows/) - Detailed workflow documentation
- [roadmap.md](references/roadmap.md) - Future improvement plans and priorities

## Related Skills

- `google/search-console` - Search performance data (impressions, clicks, CTR, position)
- `google/google-ads` - Keyword Planner for exact search volume and keyword ideas
- `google/trends` - Search interest trends and geographic data (API in alpha)
- `google/analytics` - Traffic analytics
- `shopify` - Product catalog management
- `postgresql` - Cross-source data queries
