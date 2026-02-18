# Topic Cluster Strategy Workflow

## Overview

Topic clusters organize content around central themes (pillars) with supporting pages that link back, building topical authority and improving rankings for competitive terms.

**Duration:** 2-4 hours for initial planning, ongoing maintenance
**Output:** Cluster map, pillar page specifications, internal linking plan

## Why Topic Clusters Matter

1. **Topical Authority** - Google rewards comprehensive coverage of subjects
2. **Internal Linking** - Strategic links distribute page authority
3. **User Experience** - Logical content organization helps navigation
4. **Competitive Edge** - Clusters can outrank individual pages for broad terms
5. **AI Search** - Topical depth improves AI citation likelihood

## Core Concepts

### Pillar Pages
- Comprehensive overview of a broad topic (2000-4000 words)
- Target high-volume, competitive "head" keywords
- Link to all cluster content
- Updated frequently to stay current

### Cluster Content
- Focused pages on specific subtopics (800-1500 words)
- Target long-tail keywords
- Link back to pillar page
- Can be products, blog posts, or category pages

### Topic Clusters for E-commerce

```
                    ┌─────────────────┐
                    │  PILLAR PAGE    │
                    │ "Corduroy Guide"│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Product Page  │   │  Blog Post    │   │ Category Page │
│ Men's Cords   │   │ "How to Style"│   │ All Corduroy  │
└───────────────┘   └───────────────┘   └───────────────┘
        │                    │                    │
        └────────────────────┴────────────────────┘
                             │
                      (all link back to pillar)
```

## Workflow Steps

### Step 1: Identify Core Topics

**Goal:** Define 3-5 pillar topics based on product categories and search demand

**Data Sources:**
- Google Search Console top queries
- Product category structure
- Customer question patterns
- Competitor content analysis

**Pillar Topic Candidates:**

| Topic | Search Volume Signal | Products | Content Potential |
|-------|---------------------|----------|-------------------|
| Corduroy Shorts | High (4,800+ impressions) | 6+ products | Styling, history, care |
| Bell Bottoms | High (55,000+ impressions) | 8+ products | 70s fashion, modern styling |
| Dolphin Shorts | Very High (93,000+ impressions) | 4+ products | 80s nostalgia, athletic wear |
| Retro Fashion | Medium | All products | Era guides, trend coverage |
| Short Shorts Men | High (12,000+ impressions) | Multiple | Style guide, confidence |

**Selection Criteria:**
- [ ] Sufficient search volume (>1,000 monthly impressions)
- [ ] Multiple related products to link
- [ ] Content expansion potential (history, styling, care)
- [ ] Aligns with brand expertise

### Step 2: Map Cluster Architecture

**Goal:** Define pillar page and supporting content for each topic

**Cluster Map Template:**

```markdown
## Cluster: [Topic Name]

### Pillar Page
- **URL:** /pages/[topic]-guide
- **Target Keyword:** [primary keyword]
- **Secondary Keywords:** [list]
- **Word Count Target:** 2500-3500 words
- **Update Frequency:** Quarterly

### Cluster Content

#### Products (Link to Pillar)
1. /products/[product-1] - [primary keyword for product]
2. /products/[product-2] - [primary keyword for product]
3. ...

#### Blog Posts (Create if Missing)
1. "How to Style [Topic]" - [target keyword]
2. "History of [Topic]" - [target keyword]
3. "[Topic] Care Guide" - [target keyword]
4. "[Topic] vs [Alternative]" - [target keyword]

#### Category Pages
1. /collections/[category] - [target keyword]

### Internal Linking Plan
- Pillar → All cluster pages (contextual links)
- All cluster pages → Pillar (in first 100 words)
- Cluster pages → Related cluster pages (where natural)
```

**Example: Corduroy Shorts Cluster**

```markdown
## Cluster: Corduroy Shorts

### Pillar Page
- **URL:** /pages/corduroy-shorts-guide
- **Target Keyword:** corduroy shorts
- **Secondary Keywords:** men's corduroy shorts, stretch corduroy shorts, vintage corduroy shorts
- **Word Count Target:** 3000 words
- **Sections:**
  1. What are corduroy shorts? (definition, history)
  2. Types of corduroy (wide wale, narrow wale, stretch)
  3. How to style corduroy shorts (casual, dressy, seasonal)
  4. Sizing and fit guide
  5. Care instructions
  6. Shop our collection (product links)
  7. FAQ section

### Cluster Content

#### Products
1. /products/mens-corduroy-short-navy - "men's navy corduroy shorts"
2. /products/mens-corduroy-short-black - "men's black corduroy shorts"
3. /products/mens-corduroy-short-tan - "men's tan corduroy shorts"
4. /products/womens-corduroy-short - "women's corduroy shorts"

#### Blog Posts (To Create)
1. "How to Style Corduroy Shorts for Any Season" - styling corduroy shorts
2. "The History of Corduroy: From Royalty to Retro" - corduroy history
3. "Corduroy Care: How to Wash and Maintain" - how to wash corduroy
4. "Corduroy vs Denim Shorts: Which is Right for You?" - corduroy vs denim

#### Category Page
1. /collections/corduroy - "corduroy clothing"

### Internal Linking Plan
- Pillar mentions each product with contextual anchor text
- Each product description links to pillar in first paragraph
- Blog posts link to pillar and relevant products
- Collection page links to pillar in description
```

### Step 3: Audit Existing Content

**Goal:** Identify what content exists and what needs to be created

**Content Inventory Template:**

| Content Type | URL | Exists? | Links to Pillar? | Quality Score | Action |
|--------------|-----|---------|------------------|---------------|--------|
| Pillar Page | /pages/corduroy-guide | No | N/A | N/A | Create |
| Product | /products/mens-cord-navy | Yes | No | 7/10 | Add link |
| Blog | /blogs/styling-corduroy | No | N/A | N/A | Create |
| Collection | /collections/corduroy | Yes | No | 5/10 | Update |

**Quality Score Criteria (1-10):**
- Content depth and accuracy
- Keyword optimization
- Internal linking
- Schema markup
- User engagement signals

### Step 4: Create/Update Pillar Page

**Goal:** Build comprehensive pillar content

**Pillar Page Template:**

```html
<article itemscope itemtype="https://schema.org/Article">
  <h1 itemprop="headline">[Primary Keyword]: The Complete Guide</h1>

  <nav class="table-of-contents">
    <h2>In This Guide</h2>
    <ul>
      <li><a href="#what-are">What Are [Topic]?</a></li>
      <li><a href="#types">Types of [Topic]</a></li>
      <li><a href="#how-to-style">How to Style [Topic]</a></li>
      <li><a href="#sizing">Sizing & Fit Guide</a></li>
      <li><a href="#care">Care Instructions</a></li>
      <li><a href="#shop">Shop [Topic]</a></li>
      <li><a href="#faq">Frequently Asked Questions</a></li>
    </ul>
  </nav>

  <section id="what-are">
    <h2>What Are [Topic]?</h2>
    <p>[Definition and history - 300-500 words]</p>
    <p>[Link to history blog post if exists]</p>
  </section>

  <section id="types">
    <h2>Types of [Topic]</h2>
    <p>[Variations and differences - 400-600 words]</p>
    <p>[Links to specific product types]</p>
  </section>

  <section id="how-to-style">
    <h2>How to Style [Topic]</h2>
    <p>[Styling advice - 500-800 words]</p>
    <p>[Link to styling blog post]</p>
    <p>[Product image galleries]</p>
  </section>

  <section id="sizing">
    <h2>Sizing & Fit Guide</h2>
    <p>[Size chart and fit advice - 300-400 words]</p>
    <p>[Link to general sizing page]</p>
  </section>

  <section id="care">
    <h2>Care Instructions</h2>
    <p>[Washing and maintenance - 200-300 words]</p>
    <p>[Link to care blog post if exists]</p>
  </section>

  <section id="shop">
    <h2>Shop Our [Topic] Collection</h2>
    <div class="product-grid">
      <!-- Product cards with links -->
      <a href="/products/product-1">[Product 1]</a>
      <a href="/products/product-2">[Product 2]</a>
      <!-- etc. -->
    </div>
    <p><a href="/collections/[category]">View All [Topic] →</a></p>
  </section>

  <section id="faq" itemscope itemtype="https://schema.org/FAQPage">
    <h2>Frequently Asked Questions</h2>
    <!-- FAQ schema markup -->
    <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 itemprop="name">[Question 1]</h3>
      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p itemprop="text">[Answer 1]</p>
      </div>
    </div>
    <!-- More FAQs -->
  </section>
</article>
```

**Pillar Page SEO Checklist:**
- [ ] Primary keyword in title, H1, first paragraph
- [ ] Secondary keywords distributed naturally
- [ ] Table of contents with jump links
- [ ] Internal links to all cluster content
- [ ] External links to authoritative sources
- [ ] Images with descriptive alt text
- [ ] FAQ schema markup
- [ ] Article schema markup
- [ ] 2500+ word count
- [ ] Mobile-optimized formatting

### Step 5: Implement Internal Linking

**Goal:** Connect all cluster content with strategic links

**Linking Rules:**

1. **Pillar → Cluster Pages**
   - Link to each cluster page at least once
   - Use descriptive anchor text (not "click here")
   - Place links contextually within content

2. **Cluster Pages → Pillar**
   - Link to pillar in first 100 words
   - Use primary keyword as anchor text
   - Consider a "Learn More" callout box

3. **Cluster → Cluster**
   - Link related products to each other
   - Link blog posts to relevant products
   - Create "You might also like" sections

**Anchor Text Guidelines:**

| Link Type | Anchor Text Example | Avoid |
|-----------|---------------------|-------|
| To Pillar | "our complete corduroy shorts guide" | "click here" |
| To Product | "navy corduroy shorts for men" | "this product" |
| To Blog | "learn how to style corduroy" | "read more" |
| To Collection | "browse all corduroy styles" | "see collection" |

**Product Description Link Template:**
```markdown
The Your Brand Corduroy Short is a vintage-inspired [corduroy short](/pages/corduroy-shorts-guide)
with a 3" inseam. Learn more about [how to style corduroy shorts](/blogs/styling-corduroy)
or explore our [full corduroy collection](/collections/corduroy).
```

### Step 6: Track Cluster Performance

**Goal:** Measure and optimize cluster effectiveness

**Metrics to Track:**

| Metric | Tool | Frequency | Target |
|--------|------|-----------|--------|
| Pillar page rankings | GSC | Weekly | Top 10 for primary keyword |
| Cluster page rankings | GSC | Weekly | Improvement over baseline |
| Internal link clicks | GA4 | Monthly | 10%+ of pillar visitors click to cluster |
| Time on pillar | GA4 | Monthly | 3+ minutes average |
| Pillar → conversion | GA4 | Monthly | Comparable to site average |

**Cluster Health Dashboard:**

```json
{
  "cluster": "Corduroy Shorts",
  "pillar_url": "/pages/corduroy-shorts-guide",
  "metrics": {
    "pillar_position": 8.3,
    "pillar_impressions": 4500,
    "pillar_ctr": 2.1,
    "cluster_pages": 8,
    "pages_linking_to_pillar": 6,
    "avg_cluster_position": 12.4
  },
  "health_score": "B",
  "recommendations": [
    "Add pillar link to 2 products missing links",
    "Create planned blog post: 'Corduroy Care Guide'",
    "Update pillar with seasonal styling section"
  ]
}
```

### Step 7: Expand and Maintain

**Quarterly Maintenance:**
1. Review cluster performance metrics
2. Update pillar with new products/content
3. Identify new cluster content opportunities
4. Fix broken internal links
5. Refresh outdated sections

**Cluster Expansion Signals:**
- New products in category
- Rising search queries (from GSC)
- Customer questions (from support)
- Competitor content gaps
- Seasonal opportunities

## Recommended Clusters

### Priority 1: Immediate Implementation

| Cluster | Pillar Keyword | Est. Search Volume | Products |
|---------|----------------|-------------------|----------|
| Corduroy Shorts | corduroy shorts | 4,800/month | 6+ |
| Bell Bottoms | bell bottoms | 55,000/month | 8+ |
| Dolphin Shorts | dolphin shorts | 93,000/month | 4+ |

### Priority 2: Q2 Implementation

| Cluster | Pillar Keyword | Est. Search Volume | Products |
|---------|----------------|-------------------|----------|
| Short Shorts Men | short shorts men | 12,000/month | 10+ |
| Terry Cloth | terry cloth shorts | 2,400/month | 3+ |
| Retro Fashion | retro fashion guide | 8,100/month | All |

### Priority 3: Future Consideration

| Cluster | Pillar Keyword | Notes |
|---------|----------------|-------|
| 70s Fashion | General lifestyle content |
| 80s Fashion | General lifestyle content |
| Beach Wear | Summer seasonal cluster |

## Output Files

After completing cluster planning:

```
workflows/seo/
├── topic-clusters/
│   ├── cluster-map.json           # All clusters and relationships
│   ├── corduroy-cluster.md        # Individual cluster plan
│   ├── bell-bottoms-cluster.md
│   ├── dolphin-shorts-cluster.md
│   ├── internal-linking-plan.csv  # Link implementation tracking
│   └── cluster-content-briefs/    # Briefs for content to create
│       ├── corduroy-pillar-brief.md
│       ├── corduroy-care-blog-brief.md
│       └── ...
```

## Related Workflows

- [full-catalog.md](full-catalog.md) - Optimize cluster product pages
- [content-gaps.md](content-gaps.md) - Identify missing cluster content
- [monthly-trends.md](monthly-trends.md) - Identify new cluster opportunities
