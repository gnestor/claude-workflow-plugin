# Content Gap Analysis Workflow

## Overview

Content gap analysis identifies topics and keywords that competitors rank for but you don't. This reveals opportunities to create content that captures search traffic you're currently missing.

**Duration:** 2-3 hours for initial analysis
**Output:** Prioritized content opportunities with briefs

## Why Content Gap Analysis Matters

1. **Discover blind spots** - Find topics you haven't considered
2. **Competitive intelligence** - Learn from competitor successes
3. **Strategic content planning** - Prioritize high-impact content
4. **Capture market share** - Target keywords competitors own
5. **Topic cluster expansion** - Identify missing cluster content

## Prerequisites

- List of 3-5 direct competitors
- Google Search Console access
- Browser for manual SERP research
- Spreadsheet for tracking

## Workflow Steps

### Step 1: Identify Competitors

**Goal:** Define competitors for analysis

**Competitor Types:**

| Type | Definition | Example |
|------|------------|---------|
| Direct | Same products, same audience | Chubbies, Bearbottom |
| Indirect | Similar products, overlapping audience | Patagonia, REI |
| Content | Ranks for your target keywords | Fashion blogs, retailers |

**Selection Criteria:**
- Ranks for keywords you want
- Similar product category
- Active content marketing
- Comparable domain authority (or slightly higher)

**Example Competitor Set:**
```json
{
  "direct_competitors": [
    {"name": "Chubbies", "domain": "chubbies.com", "focus": "Shorts, casual wear"},
    {"name": "Bearbottom", "domain": "bearbottomclothing.com", "focus": "Shorts, comfort wear"},
    {"name": "Vintage 1946", "domain": "vintage1946.com", "focus": "Retro menswear"}
  ],
  "content_competitors": [
    {"name": "GQ", "domain": "gq.com", "focus": "Men's fashion content"},
    {"name": "The Strategist", "domain": "nymag.com/strategist", "focus": "Product recommendations"}
  ]
}
```

### Step 2: Extract Your Keyword Footprint

**Goal:** Document keywords you currently rank for

**Using Google Search Console:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-queries sc-domain:example.com 90 500
```

**Export columns:**
- Query (keyword)
- Impressions
- Clicks
- Position
- URL

**Create "owned keywords" list:**
- Keywords where position < 30
- Keywords with > 100 impressions
- Save as `owned-keywords.csv`

### Step 3: Research Competitor Keywords

**Goal:** Identify keywords competitors rank for

**Method A: Manual SERP Research**

For each target keyword category, search and document who ranks:

```markdown
## Keyword: "corduroy shorts men"

| Position | Domain | Page Type | Title |
|----------|--------|-----------|-------|
| 1 | nordstrom.com | Category | Men's Corduroy Shorts |
| 2 | amazon.com | Search | Corduroy Shorts for Men |
| 3 | chubbies.com | Product | The Cords - Corduroy Shorts |
| 4 | example.com | Product | Men's Corduroy Short |
| 5 | jcrew.com | Category | Men's Corduroy Shorts |
```

**Method B: Use SEO Tools (if available)**

Tools like Ahrefs, SEMrush, or Moz can extract competitor keywords directly.

**Method C: Site Search Operators**

Search Google for competitor content:
```
site:chubbies.com shorts
site:chubbies.com "how to"
site:chubbies.com blog
```

Document all unique content topics/keywords found.

### Step 4: Compare and Identify Gaps

**Goal:** Find keywords competitors rank for that you don't

**Gap Analysis Matrix:**

| Keyword | You | Competitor A | Competitor B | Gap Type |
|---------|-----|--------------|--------------|----------|
| corduroy shorts | Pos 4 | Pos 2 | Pos 8 | Improvement |
| how to style shorts | - | Pos 3 | Pos 12 | **Content Gap** |
| best summer shorts | - | Pos 1 | Pos 5 | **Content Gap** |
| shorts for big thighs | - | Pos 6 | - | **Content Gap** |
| chubbies alternative | - | Pos 1 | - | **Brand Gap** |

**Gap Types:**
1. **Content Gap** - No page exists on your site for this topic
2. **Ranking Gap** - Page exists but ranks poorly vs competitors
3. **Format Gap** - Competitors have better content format (video, guide, comparison)
4. **Brand Gap** - Competitor brand searches (opportunity for comparison content)

### Step 5: Prioritize Opportunities

**Goal:** Rank gaps by potential value

**Scoring Framework:**

```
gap_priority_score = search_volume × intent_value × difficulty_factor × relevance

where:
  search_volume = estimated monthly searches (1-100 scale)
  intent_value = transactional (3), commercial (2), informational (1)
  difficulty_factor = easy (1.0), medium (0.7), hard (0.4)
  relevance = highly relevant (1.0), somewhat (0.7), tangential (0.4)
```

**Priority Matrix:**

| Priority | Score | Action |
|----------|-------|--------|
| P1 - Critical | 150+ | Create immediately, high-quality content |
| P2 - High | 100-149 | Schedule for next content cycle |
| P3 - Medium | 50-99 | Add to content calendar |
| P4 - Low | <50 | Monitor, create opportunistically |

**Example Prioritization:**

| Gap Keyword | Volume | Intent | Difficulty | Relevance | Score | Priority |
|-------------|--------|--------|------------|-----------|-------|----------|
| how to style corduroy shorts | 40 | 1 (info) | easy (1.0) | high (1.0) | 40 | P3 |
| best short shorts for men | 80 | 2 (comm) | medium (0.7) | high (1.0) | 112 | P2 |
| chubbies vs your-brand | 20 | 2 (comm) | easy (1.0) | high (1.0) | 40 | P3 |
| buy vintage shorts online | 60 | 3 (trans) | hard (0.4) | high (1.0) | 72 | P3 |

### Step 6: Create Content Briefs

**Goal:** Provide actionable briefs for content creation

**Content Brief Template:**

```markdown
# Content Brief: [Title]

## Overview
- **Target Keyword:** [primary keyword]
- **Secondary Keywords:** [list]
- **Search Intent:** [informational/commercial/transactional]
- **Priority Score:** [number]
- **Gap Type:** [content/ranking/format]

## Competitive Analysis
- **Top 3 Ranking Pages:**
  1. [URL] - [word count], [key features]
  2. [URL] - [word count], [key features]
  3. [URL] - [word count], [key features]

- **Content Patterns:**
  - Average word count: [number]
  - Common sections: [list]
  - Media used: [images/video/tables]
  - Schema types: [FAQ/HowTo/Article]

## Content Requirements

### Minimum Requirements
- Word count: [number based on competitors + 20%]
- Images: [number]
- Internal links: [to products, to pillar page]
- Schema markup: [types]

### Structure
1. [H2 Section 1] - [description]
2. [H2 Section 2] - [description]
3. [H2 Section 3] - [description]
4. FAQ Section - [3-5 questions]

### Differentiation Strategy
- What competitors miss: [gap in their content]
- Our unique angle: [brand voice, expertise, products]
- Value-add ideas: [original research, better visuals, etc.]

## Success Metrics
- Target position: [number]
- Traffic goal: [monthly visits]
- Conversion action: [product clicks, email signup]

## Timeline
- Draft due: [date]
- Review: [date]
- Publish: [date]
- First ranking check: [date + 4 weeks]
```

**Example Brief:**

```markdown
# Content Brief: Best Short Shorts for Men (2026 Guide)

## Overview
- **Target Keyword:** best short shorts for men
- **Secondary Keywords:** short inseam shorts, 5 inch shorts men, mens running shorts
- **Search Intent:** Commercial investigation
- **Priority Score:** 112
- **Gap Type:** Content gap (no guide exists)

## Competitive Analysis
- **Top 3 Ranking Pages:**
  1. gq.com/story/best-short-shorts - 2,400 words, listicle format, 15 products
  2. runnersworld.com/gear/shorts - 1,800 words, focused on athletic
  3. strategist.com/best-shorts - 3,000 words, comprehensive guide

- **Content Patterns:**
  - Average word count: 2,400
  - Common sections: intro, categories, product picks, FAQ
  - Media used: product photos, size charts
  - Schema types: Article, FAQ, Product mentions

## Content Requirements

### Minimum Requirements
- Word count: 2,800+
- Images: 10+ product photos
- Internal links: To all relevant products, to sizing guide
- Schema markup: Article, FAQ

### Structure
1. Introduction - Why short shorts are back, confidence messaging
2. How to Choose - Inseam guide, fit types, materials
3. Best for Athletic - Running, gym, sports picks
4. Best for Casual - Beach, vacation, everyday
5. Best Vintage/Retro - 70s-80s inspired (your brand strength)
6. Sizing & Fit Guide - Link to detailed guide
7. FAQ Section - 5 common questions

### Differentiation Strategy
- What competitors miss: Vintage/retro category underserved, confidence messaging
- Our unique angle: Heritage brand with authentic retro designs
- Value-add ideas: "Dad shorts" styling advice, era-specific recommendations

## Success Metrics
- Target position: Top 10
- Traffic goal: 500 monthly visits
- Conversion action: Click to product page

## Timeline
- Draft due: Feb 15
- Review: Feb 18
- Publish: Feb 22
- First ranking check: Mar 22
```

### Step 7: Track and Iterate

**Goal:** Monitor gap closure over time

**Tracking Spreadsheet:**

| Gap Keyword | Brief Created | Published | Initial Position | Current Position | Status |
|-------------|---------------|-----------|------------------|------------------|--------|
| best short shorts men | Jan 28 | Feb 22 | - | 34 | Indexing |
| how to style corduroy | Feb 5 | Feb 28 | - | - | Draft |
| chubbies alternative | - | - | - | - | Backlog |

**Monthly Review:**
1. Check position changes for gap content
2. Identify new gaps from competitor monitoring
3. Update priorities based on performance
4. Create new briefs for next cycle

## CLI Integration

**Gap Analysis Command:**

```bash
# Compare your keywords against competitor research
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/seo/scripts/seo-client.ts gaps \
  --owned owned-keywords.csv \
  --competitor competitor-keywords.csv \
  --output content-gaps.csv
```

**Output Format:**
```csv
keyword,your_position,competitor,competitor_position,gap_type,volume_estimate,priority
how to style shorts,-,chubbies.com,3,content_gap,2400,P2
best summer shorts,-,gq.com,1,content_gap,8100,P1
corduroy care,42,chubbies.com,8,ranking_gap,1200,P3
```

## Common Content Gap Categories

### For E-commerce Fashion Brands

| Gap Category | Example Keywords | Content Type |
|--------------|------------------|--------------|
| "How to" styling | how to style [product] | Blog post |
| "Best of" lists | best [category] for [use case] | Listicle/guide |
| Comparisons | [competitor] vs [you], [product a] vs [product b] | Comparison page |
| Buying guides | [category] buying guide | Long-form guide |
| Care/maintenance | how to wash [material], [product] care | FAQ/guide |
| Occasion-based | [product] for [occasion] | Blog/landing page |
| Body type | [product] for [body type] | Inclusive guide |
| Seasonal | summer [product], winter [category] | Seasonal landing |

### Quick Win Gaps

Easy content gaps that can be filled quickly:

1. **FAQ pages** - Answer common questions competitors ignore
2. **Comparison pages** - "[Competitor] Alternative" searches
3. **Material guides** - Explain fabrics you use
4. **Sizing guides** - Comprehensive fit content
5. **Care instructions** - Maintenance for your products

## Output Files

```
workflows/seo/content-gaps/
├── gap-analysis-[date].csv          # Full gap analysis
├── prioritized-opportunities.csv    # Scored and prioritized
├── content-briefs/                  # Individual briefs
│   ├── best-short-shorts-brief.md
│   ├── corduroy-styling-brief.md
│   └── ...
├── competitor-research/             # Raw competitor data
│   ├── chubbies-keywords.csv
│   ├── bearbottom-keywords.csv
│   └── serp-research-notes.md
└── tracking.csv                     # Progress tracking
```

## Related Workflows

- [topic-clusters.md](topic-clusters.md) - Identify cluster content gaps
- [full-catalog.md](full-catalog.md) - Optimize existing content
- [monthly-trends.md](monthly-trends.md) - Identify trending gap topics
