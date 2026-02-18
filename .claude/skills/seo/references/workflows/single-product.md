# Single Product/Collection SEO Optimization Workflow

## Overview

Targeted SEO optimization for a specific product or collection. Use this workflow for new product launches, underperforming products, or collection refreshes.

**Duration:** 15-30 minutes per product
**Output:** Optimized meta tags and description for immediate use

## When to Use

- New product launch (before going live)
- Product with declining traffic/sales
- Collection page refresh
- Seasonal product updates
- After receiving specific keyword insights

## Prerequisites

- Product handle or URL
- Google Search Console access
- Brand voice guide reference

## Workflow Steps

### Step 1: Identify the Product

**Input Options:**
- Product handle: `mens-navy-corduroy-shorts`
- Product URL: `https://example.com/products/mens-navy-corduroy-shorts`
- Collection: `shorts`

**Get Current Product Data:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/shopify/scripts/shopify-client.ts \
  product mens-navy-corduroy-shorts
```

**Or via PostgreSQL:**
```sql
SELECT data FROM shopify_products
WHERE data->>'handle' = 'mens-navy-corduroy-shorts'
```

### Step 2: Fetch Search Data for Product

**Get queries driving traffic to this product:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/search-console-client.ts \
  url-queries sc-domain:example.com \
  "https://example.com/products/mens-navy-corduroy-shorts" 90
```

**Get related queries (broader search):**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/search-console-client.ts \
  top-queries sc-domain:example.com 90 --filter "corduroy shorts"
```

### Step 3: Analyze Current Content

**Extract and Review:**
```
const analysis = {
  current: {
    title: product.title,
    meta_title: product.metafields_global_title_tag || "(empty)",
    meta_description: product.metafields_global_description_tag || "(empty)",
    description: stripHtml(product.body_html),
    word_count: countWords(product.body_html)
  },
  keywords: {
    present: findKeywords(product.body_html, targetKeywords),
    missing: targetKeywords.filter(k => !product.body_html.includes(k))
  },
  seo_score: calculateSEOScore(product)
};
```

**SEO Checklist:**
| Element | Status | Notes |
|---------|--------|-------|
| Meta title | ❌ Empty | Needs creation |
| Meta description | ❌ Empty | Needs creation |
| H1 tag | ✅ Present | Product title |
| Primary keyword | ❌ Missing | "corduroy shorts" not in content |
| Word count | ✅ 180 words | Adequate |
| Brand voice | ✅ Good | Has tagline |

### Step 4: Research Target Keywords

**For this specific product, identify:**

1. **Primary keyword** (highest volume, most relevant)
   - Example: "corduroy shorts" for corduroy products

2. **Secondary keywords** (supporting terms)
   - "mens corduroy shorts"
   - "vintage shorts"
   - "stretch corduroy"

3. **Long-tail keywords** (specific, lower competition)
   - "mens vintage corduroy shorts 3 inch"

**Keyword Selection Criteria:**
- Relevance to product (exact match or close)
- Search volume (impressions in GSC)
- Current position (is it achievable?)
- Purchase intent (transactional > informational)

### Step 4.5: Quick Competitor SERP Check

**Goal:** Validate keyword targets by checking current SERP competition

For the primary keyword, perform a quick Google search (incognito mode):

**30-Second SERP Analysis:**
1. Who ranks #1-3? (Brand names and page types)
2. Are they product pages, category pages, or articles?
3. Any SERP features present? (Images, FAQs, reviews)
4. What's the approximate content length?

**Quick Difficulty Assessment:**

| What You See | Difficulty | Action |
|--------------|------------|--------|
| Small brands, blogs, outdated content | Easy | Full optimization, expect results |
| Mix of retailers and brands | Medium | Optimize well, may take 2-3 months |
| Amazon, major retailers dominating | Hard | Focus on long-tail variants instead |
| Wikipedia, authoritative sites | Very Hard | Target different keyword |

**Competitor Content Audit (Top 3 Results):**
- Do they have FAQ sections? → Add FAQ if not present in your content
- Do they show product specs clearly? → Match or exceed detail level
- Do they have schema markup? → Verify your markup is complete
- What's their word count? → Aim for similar or higher

**Example Quick Check:**
```
Keyword: "corduroy shorts men"
#1: nordstrom.com/category - Category page, basic
#2: amazon.com/search - Product listings, reviews
#3: chubbies.com/product - Product page, detailed

Assessment: Medium difficulty - can compete with better content
Action: Add FAQ, ensure detailed specs, highlight unique features
```

### Step 5: Generate Optimized Content

**Meta Title (50-60 characters):**
```
Format: {Gender's} {Color} {Material} {Product Type} | Your Brand
Example: Men's Navy Corduroy Shorts | Your Brand (35 chars)
```

**Meta Description (150-160 characters):**
```
Format: {Primary keyword} with {key feature}. {Material}. {Value prop}. {CTA}.
Example: Vintage-inspired men's corduroy shorts with 3" inseam. Stretch fabric
         for all-day comfort. Free shipping on orders $100+. (140 chars)
```

**Description Structure:**
```html
<p>The Your Brand Short is a vintage-inspired <strong>corduroy short</strong> with
a 3" inseam and elastic waist. These <strong>men's stretch corduroy shorts</strong>
bring back the classic 80s style that skaters, surfers, and Tom Selleck made famous.</p>

<p>This short style was popularized in the 1970s in Southern California. Your Brand
has revived the once forgotten shorts in all their wide-waled corduroy glory.</p>

<p>In <em>short</em>, the Your Brand Short is a homage to a time when shorts were
shorter, fuzzier, and more colorful. These are your dad's shorts!</p>

<ul>
<li>🌱 Stretch corduroy (98% cotton, 2% Lycra)</li>
<li>📏 3" inseam</li>
<li>🤸 Elastic waist for all-day comfort</li>
<li>💎 Copper snap closure</li>
<li>📏 Available in sizes 26-40</li>
</ul>
```

### Step 6: Compare Before/After

**Generate Diff:**
```markdown
## Meta Title
- Before: (empty)
- After: Men's Navy Corduroy Shorts | Your Brand

## Meta Description
- Before: (empty)
- After: Vintage-inspired men's corduroy shorts with 3" inseam...

## Description Changes
- Added: "corduroy short" (2 mentions)
- Added: "men's stretch corduroy shorts"
- Added: "vintage" in opening
- Preserved: Brand voice, tagline, emoji bullets
```

**Keyword Density Check:**
```
Primary: "corduroy shorts" - 2 mentions / 180 words = 1.1% ✅
Secondary: "vintage" - 2 mentions = 1.1% ✅
Total keyword density: ~3% ✅ (under 5% threshold)
```

### Step 7: Apply Changes

**Option A: Manual Update**
1. Go to Shopify Admin > Products > [Product]
2. Update "SEO Title" field
3. Update "SEO Description" field
4. Update "Description" field
5. Save

**Option B: API Update**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/shopify/scripts/shopify-client.ts \
  update-product mens-navy-corduroy-shorts \
  --meta-title "Men's Navy Corduroy Shorts | Your Brand" \
  --meta-description "Vintage-inspired men's corduroy shorts..." \
  --body-html "<p>The Your Brand Short is..."
```

### Step 8: Verify Changes

**Check Live Page:**
1. Visit product URL
2. View page source (Ctrl+U)
3. Verify `<title>` tag
4. Verify `<meta name="description">`
5. Verify body content

**Request Indexing:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/search-console-client.ts \
  inspect-url sc-domain:example.com \
  "https://example.com/products/mens-navy-corduroy-shorts"
```

## Collection Optimization

For collection pages, the workflow is similar but focuses on:

### Collection-Specific Elements

**Meta Title:**
```
{Collection Name} - {Primary Keyword} | Your Brand
Example: Bell Bottoms - Vintage 70s Flare Pants | Your Brand
```

**Collection Description:**
- Overview of product category
- Key differentiators
- Link to best sellers
- Size/fit guidance

**Example Collection Description:**
```html
<p>Shop our collection of vintage-inspired <strong>bell bottoms</strong> and
<strong>flare pants</strong>. Each pair features our signature tailored fit
with dramatic 11-12" flare, just like the <strong>70s bell bottom pants</strong>
your parents wore.</p>

<p>Available in stretch corduroy and denim, our bell bottoms come in 12 colors
and sizes 26-40. These are your dad's pants!</p>
```

## Quick Reference

### Character Limits
| Element | Limit | Display |
|---------|-------|---------|
| Meta Title | 50-60 chars | 580px width |
| Meta Description | 150-160 chars | 920px width |
| URL slug | Keep short | Readable |

### Keyword Placement Priority
1. Meta title (first 30 characters)
2. Meta description (first sentence)
3. First paragraph of description
4. H1/product title
5. Image alt text

### Brand Voice Quick Tips
- Tagline: "These are your {dad's/mom's} {product}!"
- Tone: Nostalgic, playful, witty
- Avoid: "Premium", "trendy", marketing speak
- Include: Era references (70s, 80s), material specs

## Output

After completing single product optimization:

```json
{
  "product": "mens-navy-corduroy-shorts",
  "changes": {
    "meta_title": {
      "before": "",
      "after": "Men's Navy Corduroy Shorts | Your Brand"
    },
    "meta_description": {
      "before": "",
      "after": "Vintage-inspired men's corduroy shorts..."
    },
    "keywords_added": ["corduroy shorts", "vintage shorts"],
    "estimated_impact": "High - 4,888 monthly impressions for 'corduroy shorts'"
  },
  "next_steps": [
    "Monitor rankings in 2-4 weeks",
    "Check CTR improvement",
    "Consider updating similar products"
  ]
}
```

## Related Workflows

- [full-catalog.md](full-catalog.md) - Complete catalog optimization
- [webpage.md](webpage.md) - Non-product page optimization
