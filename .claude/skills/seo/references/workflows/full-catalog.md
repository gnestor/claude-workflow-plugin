# Full Catalog SEO Optimization Workflow

## Overview

Complete SEO audit and optimization for an entire product catalog. This is the most comprehensive workflow, typically run quarterly or annually.

**Duration:** 2-4 hours depending on catalog size
**Output:** CSV file ready for Shopify bulk import

## Prerequisites

- Google Search Console verified for domain
- Shopify/PostgreSQL access for product data
- Brand voice guide available
- Browser access for Google Trends (optional)

## Workflow Steps

### Step 1: Fetch Product Catalog

**Goal:** Get all active products from Shopify

**Using Shopify Skill:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/shopify/scripts/shopify-client.ts products --status active
```

**Using PostgreSQL:**
```sql
SELECT data FROM shopify_products
WHERE data->>'status' = 'active'
ORDER BY data->>'title'
```

**Output:** JSON array of products with handle, title, body_html, product_type, tags

**Checkpoint:** Verify product count matches expected (e.g., ~255 products)

### Step 2: Deduplicate Products

**Goal:** Remove color/size variants to get unique base products

Products like "Men's Short (Navy)" and "Men's Short (Black)" are the same base product with different colors.

**Deduplication Logic:**
```
// Group by base handle (remove color suffix)
const baseProducts = new Map();
products.forEach(p => {
  const baseHandle = p.handle.replace(/-[a-z]+(-[a-z]+)?$/, '');
  const baseTitle = p.title.replace(/\s*\([^)]+\)\s*$/, '');

  if (!baseProducts.has(baseHandle)) {
    baseProducts.set(baseHandle, {
      ...p,
      base_handle: baseHandle,
      base_title: baseTitle,
      variants: [p.handle]
    });
  } else {
    baseProducts.get(baseHandle).variants.push(p.handle);
  }
});
```

**Checkpoint:** ~50-60 unique base products from ~255 total

### Step 3: Fetch Search Performance Data

**Goal:** Get keyword data from Google Search Console

**Command:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/search-console-client.ts \
  top-queries sc-domain:example.com 90
```

**Data Retrieved:**
- Query (search term)
- Impressions (times shown in search)
- Clicks (times clicked)
- CTR (click-through rate)
- Position (average ranking)

**Checkpoint:** Should return 100+ queries with meaningful data

### Step 4: Research Keyword Opportunities (Optional)

**Goal:** Supplement GSC data with search volume estimates from Google Trends

**Using Browser (Claude in Chrome):**
1. Navigate to trends.google.com
2. Search for high-impression keywords
3. Compare variations (e.g., "dolphin shorts" vs "dolphin swim trunks")
4. Note relative search volume

**Key Searches:**
- Product category terms: "corduroy shorts", "bell bottoms"
- Style modifiers: "vintage shorts", "retro pants"
- Material terms: "terry cloth shorts", "stretch corduroy"

### Step 5: Score Keywords

**Goal:** Calculate opportunity score for each keyword with intent classification

**Formula:**
```
opportunity_score = (impressions × (1 - current_ctr) × position_weight × intent_multiplier) / 1000
position_weight = max(0.1, (50 - avg_position) / 50)
intent_multiplier = 2.0 (transactional), 1.5 (commercial), 1.0 (informational), 0.8 (navigational)
```

**Scoring Script:**
```bash
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts keywords example.com
```

**Or manually:**
```typescript
function classifyIntent(keyword) {
  const kw = keyword.toLowerCase();
  if (/\b(buy|shop|order|price|cheap|deal|discount)\b/.test(kw)) {
    return { intent: 'transactional', multiplier: 2.0 };
  }
  if (/\b(best|top|review|vs|compare|alternative)\b/.test(kw)) {
    return { intent: 'commercial', multiplier: 1.5 };
  }
  if (/\b(your-brand|website|official)\b/.test(kw)) {
    return { intent: 'navigational', multiplier: 0.8 };
  }
  if (/\b(what|how|why|guide|tutorial)\b/.test(kw)) {
    return { intent: 'informational', multiplier: 1.0 };
  }
  return { intent: 'commercial', multiplier: 1.0 };
}

function scoreKeyword(query) {
  const { intent, multiplier } = classifyIntent(query.keyword);
  const positionWeight = Math.max(0.1, (50 - query.position) / 50);
  const score = (query.impressions * (1 - query.ctr) * positionWeight * multiplier) / 1000;
  return { ...query, opportunity_score: Math.round(score), tier: getTier(score), intent };
}
```

**Output:** Keyword table sorted by opportunity score with intent classification

**Checkpoint:** Identify top 10-15 high-opportunity keywords

### Step 5.5: Competitor SERP Analysis

**Goal:** Assess difficulty and learn from competitors for top keywords

For each high-opportunity keyword (score 50+), analyze the current SERP:

**Manual Analysis (Using Browser):**
1. Search each keyword in an incognito window
2. Document the top 3-5 results:
   - Domain/brand name
   - Page type (product, category, blog, etc.)
   - Content length estimate
   - SERP features present (images, reviews, FAQ, video)

**SERP Analysis Template:**

| Keyword | #1 Result | #2 Result | #3 Result | Difficulty | Notes |
|---------|-----------|-----------|-----------|------------|-------|
| dolphin shorts | chubbies.com/product | amazon.com/listing | target.com/product | Medium | E-commerce dominated |
| what are dolphin shorts | wikipedia.org | blog.com/history | reddit.com/thread | Easy | Informational, few brands |
| buy corduroy shorts | amazon.com | nordstrom.com | gap.com | Hard | Major retailers |

**Difficulty Assessment:**

| SERP Composition | Difficulty | Multiplier |
|------------------|------------|------------|
| Small/medium sites, few ads | Easy | 1.0 |
| Mix of brand sizes | Medium | 0.8 |
| Major retailers/brands dominating | Hard | 0.5 |
| Wikipedia/authoritative sites | Very Hard | 0.3 |

**Apply Difficulty to Scores:**
```
adjusted_score = opportunity_score × difficulty_multiplier
```

**What to Learn from Competitors:**
- Content format (bullets, tables, videos?)
- Word count of ranking pages
- FAQ sections present?
- Schema markup used?
- Internal linking patterns

**Checkpoint:** Adjusted keyword priorities based on realistic ranking potential

### Step 6: Map Keywords to Products

**Goal:** Assign target keywords to each product

**Mapping Logic:**
```
const keywordMap = {
  "dolphin shorts": ["dolphin-trunk"],
  "bell bottoms": ["mens-bell-bottom", "womens-bell-bottom"],
  "corduroy shorts": ["mens-corduroy-short", "womens-corduroy-short"],
  "terry cloth shorts": ["terry-short"],
  // etc.
};
```

**Considerations:**
- Match by product type
- Match by tags
- Consider search intent (informational vs transactional)

### Step 7: Analyze Current Descriptions

**Goal:** Identify SEO gaps in current content

**Analysis Checklist:**
- [ ] Primary keyword present?
- [ ] Gender modifier included?
- [ ] Material mentioned?
- [ ] Era/style keyword present?
- [ ] Meta title set?
- [ ] Meta description set?

**Gap Report:**
```markdown
## Product: dolphin-trunk-navy

### Missing Keywords
- "dolphin shorts" (93k impressions, never mentioned)
- "80s swim trunks" (1.2k impressions)

### Missing Elements
- Meta title (currently empty)
- Meta description (currently empty)
- Gender modifier in description

### Current Description Analysis
- Word count: 150 words
- Primary keyword density: 0% (missing)
- Brand voice: Good
```

### Step 8: Generate Optimized Descriptions

**Goal:** Create SEO-optimized content maintaining brand voice

**Template Structure:**
```markdown
## Meta Title (50-60 chars)
{Gender's} {Color} {Material} {Product Type} | Your Brand

## Meta Description (150-160 chars)
{Primary keyword} with {key feature}. {Material benefit}. {Value prop}. Free shipping $100+.

## Description
### Opening Paragraph (SEO-focused)
The Your Brand {Product} is a {primary keyword phrase} with {key differentiator}.

### Brand Story
{Product} is a homage to {era}. These are your {dad's/mom's} {product}!

### Details (Bullet Points)
- {emoji} Material: {composition}
- {emoji} Fit: {measurement}
- {emoji} Features: {details}
```

**Brand Voice Reference:** [brand-voice.md](../../../../workflows/product-catalog-optimization/brand-voice.md)

### Step 9: Quality Review

**Goal:** Ensure all optimized content meets standards

**Review Checklist:**
- [ ] Meta titles 50-60 characters
- [ ] Meta descriptions 150-160 characters
- [ ] Primary keyword in first paragraph
- [ ] No keyword stuffing (1-1.5% density max)
- [ ] Brand voice preserved
- [ ] Closing tagline included
- [ ] HTML valid
- [ ] No duplicate content across products

### Step 10: Export to CSV

**Goal:** Create Shopify-compatible import file

**CSV Format:**
```csv
handle,meta_title,meta_description,description_html,primary_keyword,secondary_keywords,opportunity_score
```

**Export Command:**
```bash
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts export csv \
  --output workflows/seo/seo-optimized-products.csv
```

### Step 11: User Review Checkpoint

**Goal:** Get user approval before Shopify update

**Present to User:**
1. Summary of changes (X products, Y keywords)
2. Top 5 highest-impact changes
3. Sample before/after comparison
4. CSV file for review

**Ask:**
- Any products to exclude?
- Any keyword preferences to adjust?
- Ready to proceed with Shopify update?

### Step 12: Update Shopify

**Goal:** Apply optimized content to live products

**Using Shopify Admin:**
1. Go to Products > Import
2. Upload CSV file
3. Map columns to Shopify fields
4. Review and confirm

**Using Shopify API:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/shopify/scripts/shopify-client.ts \
  bulk-update workflows/seo/seo-optimized-products.csv
```

**Checkpoint:** Verify changes on 3-5 random products

## Post-Optimization

### Immediate (Day 1)
- [ ] Verify all products updated correctly
- [ ] Check for any display issues
- [ ] Confirm meta tags showing in page source

### Short-term (Week 1-2)
- [ ] Submit updated sitemap to Search Console
- [ ] Monitor for indexing of changes
- [ ] Check for any ranking fluctuations

### Medium-term (Month 1-3)
- [ ] Track CTR changes for target keywords
- [ ] Monitor position changes
- [ ] Compare traffic to baseline

### Long-term (Quarter)
- [ ] Full re-analysis of keyword opportunities
- [ ] Identify new gaps
- [ ] Plan next optimization cycle

## Output Files

```
workflows/seo/
├── seo-optimized-products.csv       # Shopify import
├── seo-optimization-report.json     # Full analysis
├── keyword-opportunities.csv        # Keyword data
├── seo-optimization-summary.md      # Human summary
└── descriptions.md                  # All descriptions
```

## Troubleshooting

### "No search data for product"
- Product may be too new
- URL not indexed yet
- Check with `inspect-url` command

### "Keyword already optimized"
- Check current CTR
- If CTR > 5%, likely already well-optimized
- Focus on lower CTR keywords

### "Brand voice drift"
- Re-read brand voice guide
- Check tagline pattern
- Avoid generic marketing language

## Related Workflows

- [single-product.md](single-product.md) - Single product optimization
- [webpage.md](webpage.md) - Non-product page optimization
