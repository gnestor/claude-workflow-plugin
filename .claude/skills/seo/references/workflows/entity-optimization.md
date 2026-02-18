# Entity Optimization Workflow

## Overview

Improve how search engines and AI systems understand your brand, products, and content as distinct entities. Strong entity recognition leads to better rankings, Knowledge Panel appearance, and AI citations.

**Frequency:** Quarterly audit, ongoing implementation
**Output:** Entity map, schema recommendations, Knowledge Graph strategy

## Why Entity Optimization Matters

1. **Knowledge Graph inclusion** - Appear in Google's Knowledge Panel
2. **AI understanding** - AI systems recognize your brand/products as entities
3. **Semantic search** - Rank for related queries without exact keyword match
4. **Brand SERP control** - Own more of your brand search results
5. **Voice search** - Entities power voice assistant answers

## Entity Fundamentals

### What is an Entity?

An entity is a thing (person, place, organization, product, concept) that:
- Has a unique identity
- Can be distinctly identified
- Has attributes and relationships
- Exists independently of how it's described

**Examples:**
- **Brand entity:** "Your Brand" (the company)
- **Product entity:** "Example Product A" (specific product)
- **Concept entity:** "Dolphin shorts" (product category)
- **Person entity:** Founder/CEO name

### Entity vs Keyword

| Aspect | Keyword | Entity |
|--------|---------|--------|
| Nature | String of text | Conceptual thing |
| Example | "corduroy shorts" | Example Product B (product) |
| Search behavior | Exact/partial match | Semantic understanding |
| AI handling | Pattern matching | Knowledge retrieval |

## Entity Mapping

### Step 1: Identify Your Entities

**Brand Entities:**
```markdown
## Brand Entity Map

### Primary Entity: Your Brand
**Type:** Organization/Brand
**Description:** Vintage-inspired athletic wear company specializing in retro shorts
**Founded:** [Year]
**Headquarters:** [Location]
**Key attributes:**
- Retro/vintage aesthetic
- Short shorts specialist
- 1970s-80s inspired
- American-made

**Related entities:**
- Founder: [Name]
- Products: Dolphin Shorts, Corduroy Shorts, Bell Bottoms
- Categories: Men's shorts, Athletic wear, Retro fashion
```

**Product Entities:**
```markdown
## Product Entity: Example Product A

**Type:** Product
**Brand:** Your Brand
**Category:** Shorts > Athletic Shorts > Dolphin Shorts
**Description:** Vintage-style athletic shorts with 2-3" inseam and curved leg seams

**Attributes:**
- Inseam: 2-3 inches
- Materials: Nylon, polyester
- Style: Retro, 1980s-inspired
- Use cases: Running, gym, casual wear

**Variants:**
- Navy Dolphin Shorts
- Red Dolphin Shorts
- Striped Dolphin Shorts

**Related entities:**
- Part of: Your Brand Shorts Collection
- Similar to: Running shorts, Gym shorts
- Inspired by: 1980s athletic wear
```

### Step 2: Map Entity Relationships

Create a visual or structured map:

```
                    Your Brand (Brand)
                         |
        +----------------+----------------+
        |                |                |
   Founder          Products         Location
        |                |
        |    +-----------+-----------+
        |    |           |           |
        |  Dolphin    Corduroy    Bell
        |  Shorts     Shorts     Bottoms
        |    |           |           |
        |  (variants)  (variants)  (variants)
        |
    [Name] - Person Entity
```

### Step 3: Define Entity Attributes

For each entity, document:

```markdown
## Entity Attribute Sheet: Example Product A

### Identifiers
- Name: Example Product A
- SKU pattern: HMDS-*
- URL: example.com/products/dolphin-shorts
- Image: [canonical product image URL]

### Classification
- Schema type: Product
- Category: Clothing > Shorts > Athletic Shorts
- Industry: Fashion/Apparel

### Descriptive Attributes
- Short description (50 chars): Retro 80s-style athletic shorts
- Long description (150 chars): Vintage-inspired dolphin shorts with curved leg seams, 2-3" inseam, perfect for running, gym, or casual summer wear.

### Relationships
- Made by: Your Brand (Organization)
- Part of: Shorts Collection
- Similar to: Running shorts, Gym shorts
- Related to: 1980s fashion, Retro athletic wear

### Metrics
- Price range: $48-68
- Rating: 4.8/5
- Review count: 500+
```

## Schema.org Implementation

### Brand/Organization Schema

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://example.com/#organization",
  "name": "Your Brand",
  "alternateName": ["Your Brand Shorts", "Your Brand Clothing"],
  "url": "https://example.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://example.com/logo.png",
    "width": 600,
    "height": 60
  },
  "description": "Vintage-inspired athletic wear company specializing in retro shorts from the 1970s and 1980s era.",
  "foundingDate": "2015",
  "founder": {
    "@type": "Person",
    "name": "[Founder Name]"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "[City]",
    "addressRegion": "[State]",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://www.facebook.com/yourbrand",
    "https://www.instagram.com/yourbrand",
    "https://twitter.com/yourbrand"
  ],
  "brand": {
    "@type": "Brand",
    "@id": "https://example.com/#brand",
    "name": "Your Brand",
    "slogan": "These are your dad's shorts!"
  }
}
</script>
```

### Product Schema with Entity Links

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://example.com/products/dolphin-shorts#product",
  "name": "Example Product A",
  "description": "Vintage-style athletic shorts with curved leg seams and 2-3 inch inseam, inspired by 1980s running culture.",
  "image": [
    "https://example.com/images/dolphin-shorts-front.jpg",
    "https://example.com/images/dolphin-shorts-back.jpg"
  ],
  "brand": {
    "@id": "https://example.com/#brand"
  },
  "manufacturer": {
    "@id": "https://example.com/#organization"
  },
  "category": "Clothing > Shorts > Athletic Shorts",
  "material": ["Nylon", "Polyester", "Spandex"],
  "color": "Navy",
  "size": ["S", "M", "L", "XL", "XXL"],
  "audience": {
    "@type": "PeopleAudience",
    "suggestedGender": "male",
    "suggestedMinAge": 18
  },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/dolphin-shorts",
    "priceCurrency": "USD",
    "price": "54.00",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "523"
  },
  "isRelatedTo": [
    {
      "@type": "Product",
      "name": "Example Product B",
      "url": "https://example.com/products/corduroy-shorts"
    }
  ]
}
</script>
```

### FAQ Schema for Entity Context

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Your Brand?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Your Brand is a vintage-inspired athletic wear brand specializing in retro shorts from the 1970s and 1980s era. Founded in 2015, the company is known for its dolphin shorts, corduroy shorts, and bell bottoms that capture the nostalgic American athletic aesthetic."
      }
    },
    {
      "@type": "Question",
      "name": "What are Example Product A?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Example Product A are vintage-style athletic shorts featuring a 2-3 inch inseam and curved, split leg seams reminiscent of 1980s running shorts. Made from lightweight nylon and polyester, they're designed for running, gym workouts, and casual summer wear."
      }
    }
  ]
}
</script>
```

### BreadcrumbList for Category Hierarchy

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Shorts",
      "item": "https://example.com/collections/shorts"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Dolphin Shorts",
      "item": "https://example.com/products/dolphin-shorts"
    }
  ]
}
</script>
```

## Knowledge Graph Optimization

### Getting into Google's Knowledge Graph

**Requirements for Knowledge Panel:**

1. **Wikipedia presence** - Most reliable path
2. **Wikidata entry** - Structured data source for Knowledge Graph
3. **Consistent NAP** - Name, Address, Phone across web
4. **Authority signals** - Press coverage, citations
5. **Schema markup** - Structured data on your site

### Wikidata Entry Guide

**Step 1: Check if entry exists**
- Search wikidata.org for your brand
- If exists, verify and enhance
- If not, create new entry

**Step 2: Create/Edit Wikidata entry**

```
Label: Your Brand
Description: American vintage-inspired athletic wear company
Also known as: Your Brand Shorts, Your Brand Clothing

Statements:
- instance of: business (Q4830453)
- industry: clothing industry (Q3041792)
- country: United States (Q30)
- official website: https://example.com
- founded: [year]
- headquarters location: [city]
- product or material produced: shorts (Q223269)
```

**Step 3: Add references**
- Link to press articles
- Company website
- Social media profiles

### Wikipedia Notability

To qualify for Wikipedia:
- Significant press coverage (not self-published)
- Notable awards or achievements
- Industry impact or innovation
- Third-party reliable sources

**If not yet notable:**
- Build press coverage
- Get featured in industry publications
- Win awards or recognition
- Wait for organic notability

## On-Page Entity Signals

### Entity Definition Section

Include clear entity definition on key pages:

```html
<section class="about-entity">
  <h2>About Your Brand</h2>
  <p><strong>Your Brand</strong> is a vintage-inspired athletic wear company
  founded in 2015, specializing in retro shorts from the 1970s and 1980s era.
  Based in [Location], Your Brand has become known for its authentic reproduction
  of classic American athletic styles, including dolphin shorts, corduroy
  shorts, and bell bottoms.</p>

  <h3>What We're Known For</h3>
  <ul>
    <li>Authentic 1980s-style dolphin shorts</li>
    <li>Vintage corduroy shorts collection</li>
    <li>Retro bell bottom pants</li>
    <li>Made in USA manufacturing</li>
  </ul>
</section>
```

### Entity-First Product Descriptions

Structure product descriptions to define the entity:

```html
<div class="product-description">
  <!-- Entity definition first -->
  <p><strong>Example Product A</strong> are vintage-style athletic shorts
  inspired by the running shorts of 1980s California. These shorts feature the
  signature curved, split leg seams that gave dolphin shorts their name.</p>

  <!-- Attributes as structured data -->
  <h3>Specifications</h3>
  <dl>
    <dt>Inseam</dt>
    <dd>2-3 inches</dd>
    <dt>Materials</dt>
    <dd>70% Nylon, 25% Polyester, 5% Spandex</dd>
    <dt>Style</dt>
    <dd>Retro athletic, 1980s-inspired</dd>
  </dl>

  <!-- Relationship context -->
  <h3>Part of the Collection</h3>
  <p>The Dolphin Shorts are part of Your Brand's Athletic Classics collection,
  alongside our <a href="/products/running-shorts">Running Shorts</a> and
  <a href="/products/gym-shorts">Gym Shorts</a>.</p>
</div>
```

### Internal Linking for Entity Relationships

```html
<!-- Link entities to their "home" pages -->
<p>Shop all <a href="/collections/dolphin-shorts">Dolphin Shorts</a> from
<a href="/pages/about">Your Brand</a>.</p>

<!-- Use consistent anchor text for entities -->
<p>Our <a href="/products/dolphin-shorts">Example Product A</a> are
the most popular item in our <a href="/collections/shorts">Shorts Collection</a>.</p>
```

## Entity Audit Checklist

### Brand Entity Audit

- [ ] Organization schema on homepage
- [ ] Consistent brand name across all pages
- [ ] About page with comprehensive brand info
- [ ] Social profiles linked and verified
- [ ] Google Business Profile claimed (if applicable)
- [ ] Wikidata entry created/verified
- [ ] Press mentions with brand name
- [ ] Industry directory listings

### Product Entity Audit

For each product:
- [ ] Product schema with complete attributes
- [ ] Unique product identifier (SKU, GTIN if applicable)
- [ ] Category breadcrumb schema
- [ ] Related products linked
- [ ] FAQ schema for product questions
- [ ] Image alt text includes product entity name
- [ ] Review schema with aggregate rating

### Category Entity Audit

For each category:
- [ ] Collection page with category definition
- [ ] Category schema (ItemList or CollectionPage)
- [ ] Parent-child category relationships
- [ ] Cross-category linking
- [ ] FAQ for category-level questions

## Measuring Entity Recognition

### Search Console Signals

**Brand query patterns:**
```
[brand name]           -> Direct brand searches
[brand] + [product]    -> Product entity recognition
[brand] + [category]   -> Category association
```

**Track in GSC:**
- Brand queries volume and CTR
- Product name queries
- "What is [brand]" queries
- "[brand] vs [competitor]" queries

### Knowledge Panel Check

1. Search your brand name in Google
2. Check if Knowledge Panel appears
3. If yes, verify information accuracy
4. If no, continue building entity signals

### AI System Recognition Test

Test entity recognition across platforms:

```markdown
## Entity Recognition Test - [Date]

### Query: "What is Your Brand?"

**Google AI Overview:**
- [ ] Correctly identifies as company
- [ ] Mentions product categories
- [ ] Shows accurate founding info

**ChatGPT:**
- [ ] Recognizes brand
- [ ] Describes products accurately
- [ ] Links to correct website

**Perplexity:**
- [ ] Entity recognized
- [ ] Attributes correct
- [ ] Sources cited
```

## Output Files

```
workflows/seo/entities/
├── entity-map.md              # Full entity relationship map
├── schema/
│   ├── organization.json      # Brand schema template
│   ├── product-template.json  # Product schema template
│   └── faq-template.json      # FAQ schema template
├── audit/
│   ├── brand-audit-[date].md
│   └── product-audit-[date].md
├── wikidata/
│   └── wikidata-entry.md      # Wikidata entry content
└── tracking/
    └── entity-recognition.csv  # AI recognition tracking
```

## Related Workflows

- [ai-citation-tracking.md](ai-citation-tracking.md) - Entity recognition improves AI citations
- [serp-features.md](serp-features.md) - Entities power rich results
- [best-practices-2026.md](../best-practices-2026.md) - Schema implementation details
- [topic-clusters.md](topic-clusters.md) - Topic entities and clustering
