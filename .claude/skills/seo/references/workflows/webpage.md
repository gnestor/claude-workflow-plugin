# Webpage SEO Optimization Workflow

## Overview

SEO analysis and optimization for non-product pages including landing pages, blog posts, about pages, FAQ pages, and collection pages.

**Duration:** 20-45 minutes per page
**Output:** Optimized content and meta tags

## When to Use

- Landing page launches
- Blog post optimization
- About/brand page refresh
- Collection page updates
- FAQ page enhancement
- Policy page SEO (shipping, returns)

## Prerequisites

- Page URL or path
- Google Analytics access (for traffic data)
- Google Search Console access (for search data)
- Access to edit page content

## Workflow Steps

### Step 1: Identify the Page

**Input Options:**
- Full URL: `https://example.com/pages/about`
- Path: `/pages/about`
- Page type: `about`, `collection`, `blog`, `landing`

**Get Page Content:**

**From Browser (Live Page):**
```
const pageData = {
  url: window.location.pathname,
  title: document.title,
  h1: document.querySelector('h1')?.textContent,
  meta_description: document.querySelector('meta[name="description"]')?.content,
  content: document.querySelector('main')?.innerText,
  word_count: document.querySelector('main')?.innerText.split(/\s+/).length
};
```

**From Shopify API (Pages):**
```bash
GET /admin/api/2024-01/pages.json
```

### Step 2: Gather Performance Data

**Google Analytics - Page Traffic:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/analytics/scripts/ga-client.ts \
  page-data <property-id> /pages/about 90daysAgo today
```

**Metrics to Collect:**
- Page views
- Unique visitors
- Avg. time on page
- Bounce rate
- Traffic sources

**Google Search Console - Search Queries:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/search-console-client.ts \
  url-queries sc-domain:example.com \
  "https://example.com/pages/about" 90
```

**Metrics to Collect:**
- Queries driving impressions
- Click-through rates
- Average positions

### Step 3: Analyze Current SEO State

**Technical SEO Checklist:**

| Element | Status | Recommendation |
|---------|--------|----------------|
| Meta Title | Check length (50-60 chars) | |
| Meta Description | Check length (150-160 chars) | |
| H1 Tag | Single, unique H1 | |
| H2 Tags | Logical hierarchy | |
| URL Structure | Clean, keyword-rich | |
| Internal Links | Links to/from other pages | |
| Image Alt Text | Descriptive, includes keywords | |
| Page Speed | Core Web Vitals | |
| Mobile Friendly | Responsive design | |

**Content Analysis:**
```
const contentAnalysis = {
  word_count: text.split(/\s+/).length,
  reading_level: calculateReadingLevel(text),
  keyword_density: calculateKeywordDensity(text, targetKeywords),
  headings: extractHeadings(html),
  links: {
    internal: countInternalLinks(html),
    external: countExternalLinks(html)
  }
};
```

### Step 4: Identify Target Keywords

**For Different Page Types:**

| Page Type | Keyword Focus | Examples |
|-----------|---------------|----------|
| About | Brand + category | "your-brand shorts company", "vintage shorts brand" |
| Collection | Category + modifiers | "men's shorts collection", "corduroy shorts" |
| Blog | Informational long-tail | "how to style bell bottoms", "70s fashion guide" |
| Landing | Campaign/product focus | "summer shorts sale", "new arrivals" |
| FAQ | Question keywords | "what size should I get" |

**Keyword Research Process:**
1. Review GSC queries for the page
2. Identify gaps (high impressions, low CTR)
3. Research related terms via Google Trends
4. Map keywords to content sections

### Step 5: Optimize Content

**Meta Title Optimization:**
```
Current: About Us | Your Brand
Optimized: About Your Brand - Vintage Shorts & Retro Clothing Brand | Your Brand
```

**Meta Description Optimization:**
```
Current: Learn about our company.
Optimized: Discover Your Brand, the vintage-inspired clothing brand reviving
           70s and 80s styles. Based in Santa Barbara, CA. Shop retro
           shorts, bell bottoms, and more.
```

**Content Optimization:**

**Opening Paragraph (SEO-focused):**
- Include primary keyword in first 100 words
- Answer the core question the page addresses
- Set up the rest of the content

**Body Content:**
- Use H2/H3 tags with keyword variations
- Natural keyword integration (1-1.5% density)
- Add internal links to relevant products/pages
- Include supporting images with alt text

**Closing/CTA:**
- Clear next step for visitor
- Link to products or conversion page
- Reinforce key message

### Step 6: Page-Specific Optimizations

#### About Page
```html
<h1>About Your Brand</h1>
<p>Your Brand is a <strong>vintage-inspired clothing brand</strong> based in
Santa Barbara, California. We specialize in reviving forgotten styles from
the 1970s and 1980s...</p>

<h2>Our Story</h2>
<p>Founded to bring back the <strong>retro shorts</strong> and
<strong>bell bottoms</strong> of a bygone era...</p>

<h2>Our Mission</h2>
<p>We're on a mission to prove that fashion can be both nostalgic and fresh...</p>
```

#### Collection Page
```html
<h1>Men's Shorts Collection</h1>
<p>Shop our collection of <strong>vintage-inspired men's shorts</strong>.
From <strong>corduroy shorts</strong> to <strong>dolphin shorts</strong>,
find the perfect retro style for any occasion.</p>

<h2>Corduroy Shorts</h2>
<p>Our signature <strong>stretch corduroy shorts</strong> feature...</p>

<h2>Dolphin Shorts</h2>
<p>Classic <strong>80s dolphin shorts</strong> in quick-dry nylon...</p>
```

#### Blog Post
```html
<h1>How to Style Bell Bottoms in 2026</h1>
<p>Wondering how to wear <strong>bell bottoms</strong> in modern times?
This guide covers everything from casual to dressy looks...</p>

<h2>Casual Bell Bottom Outfits</h2>
<p>Pair your <strong>corduroy bell bottoms</strong> with a simple tee...</p>

<h2>Dressy Bell Bottom Looks</h2>
<p>For a night out, style your <strong>flare pants</strong> with...</p>
```

### Step 7: Technical Optimizations

**Schema Markup (if applicable):**

For About Page (Organization):
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Brand",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "description": "Vintage-inspired clothing brand",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Santa Barbara",
    "addressRegion": "CA"
  }
}
```

For Blog Post (Article):
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Style Bell Bottoms in 2026",
  "author": {"@type": "Organization", "name": "Your Brand"},
  "datePublished": "2026-01-15",
  "image": "https://example.com/blog/bell-bottoms-hero.jpg"
}
```

For FAQ Page:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What size Your Brand product should I get?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "We recommend ordering your true waist size..."
    }
  }]
}
```

**Internal Linking:**
- Link to relevant products from content
- Link to related blog posts
- Add breadcrumb navigation
- Include footer links to key pages

### Step 8: Apply and Verify

**Apply Changes:**
1. Update page content in Shopify/CMS
2. Update meta tags
3. Add/update schema markup
4. Save and publish

**Verify Implementation:**
- View page source for meta tags
- Test schema with Google Rich Results Test
- Check mobile rendering
- Verify internal links work

**Request Indexing:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/search-console-client.ts \
  inspect-url sc-domain:example.com "https://example.com/pages/about"
```

## Monitoring

### Week 1-2
- [ ] Verify page indexed with new content
- [ ] Check for any display issues
- [ ] Monitor for ranking fluctuations

### Month 1
- [ ] Compare traffic to baseline
- [ ] Review CTR changes for target queries
- [ ] Check bounce rate changes

### Quarter
- [ ] Full performance review
- [ ] Identify new keyword opportunities
- [ ] Plan content updates

## Output Format

```json
{
  "page": "/pages/about",
  "page_type": "about",
  "analysis": {
    "traffic": {
      "monthly_pageviews": 450,
      "avg_time_on_page": "2:15",
      "bounce_rate": "45%"
    },
    "search": {
      "impressions": 1200,
      "clicks": 85,
      "avg_ctr": "7.1%",
      "top_queries": ["your-brand", "about your-brand"]
    }
  },
  "optimizations": {
    "meta_title": {
      "before": "About Us | Your Brand",
      "after": "About Your Brand - Vintage Shorts Brand | Your Brand"
    },
    "meta_description": {
      "before": "Learn about our company.",
      "after": "Discover Your Brand, the vintage-inspired clothing brand..."
    },
    "content_changes": [
      "Added primary keyword to opening paragraph",
      "Added H2 sections with keyword variations",
      "Added internal links to product collections",
      "Added Organization schema markup"
    ]
  },
  "expected_impact": "Medium - informational page, brand awareness focus"
}
```

## Related Workflows

- [full-catalog.md](full-catalog.md) - Product catalog optimization
- [single-product.md](single-product.md) - Single product optimization
