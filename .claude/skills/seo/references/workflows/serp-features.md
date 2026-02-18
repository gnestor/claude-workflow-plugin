# SERP Feature Targeting Workflow

## Overview

Systematic approach to winning SERP features (featured snippets, People Also Ask, image packs, etc.) that can dramatically increase visibility and CTR beyond traditional organic rankings.

**Duration:** 1-2 hours per feature type analysis
**Output:** Feature-specific optimization recommendations

## Why SERP Features Matter

1. **Increased visibility** - Features appear above or alongside organic results
2. **Higher CTR** - Featured snippets get 8-10% of clicks on the page
3. **Voice search answers** - Featured snippets power voice assistant responses
4. **AI Overview citations** - Well-structured content gets cited in AI Overviews
5. **Brand authority** - Winning features signals expertise

## SERP Feature Types

### Feature Overview

| Feature | Position | CTR Impact | Difficulty | Best For |
|---------|----------|------------|------------|----------|
| Featured Snippet | Position 0 | +8-10% | Medium | How-to, definitions, lists |
| People Also Ask | Above/within results | +3-5% | Medium | FAQ content |
| Image Pack | Top/middle | +2-4% | Low | Visual products |
| Video Carousel | Top | +5-8% | High | Tutorials, reviews |
| AI Overview | Top | Variable | High | Factual, structured content |
| Local Pack | Top 3 | +10-15% | Medium | Local businesses |
| Shopping Results | Top/side | +5-10% | Medium | E-commerce products |

### Feature Opportunity Matrix

| Query Type | Best Feature Targets |
|------------|---------------------|
| "How to..." | Featured snippet (steps), Video |
| "What is..." | Featured snippet (definition), PAA |
| "Best..." | Featured snippet (list), PAA |
| "[Product] vs [Product]" | Featured snippet (table), PAA |
| "[Product] review" | Video, PAA |
| Product names | Image pack, Shopping |
| Local + product | Local pack |

## Featured Snippet Optimization

### Snippet Types

**1. Paragraph Snippets (~70% of snippets)**
- Definition questions: "What is...", "What are..."
- Description questions: "Why does...", "How does..."
- Explanation questions: "What causes..."

**Optimization:**
```html
<!-- Target a 40-60 word answer immediately after the question -->
<h2>What are dolphin shorts?</h2>
<p>Dolphin shorts are short athletic shorts with curved, split leg seams
that became popular in the 1980s. Named for their resemblance to a dolphin's
fin, these shorts typically feature a 2-3 inch inseam, elastic waistband,
and lightweight nylon or polyester fabric. Originally designed for running
and swimming, they've become a retro fashion staple.</p>
```

**2. List Snippets (~20% of snippets)**
- "How to..." questions
- "Best..." queries
- "Types of..." queries
- Step-by-step processes

**Optimization:**
```html
<!-- Use numbered lists for processes, bullet lists for features -->
<h2>How to Style Corduroy Shorts</h2>
<ol>
  <li><strong>Choose the right fit</strong> - Select a length that hits
  mid-thigh for the classic retro look.</li>
  <li><strong>Pick complementary tops</strong> - Pair with tucked-in
  t-shirts, polo shirts, or casual button-downs.</li>
  <li><strong>Select footwear</strong> - Canvas sneakers, boat shoes,
  or sandals complete the vintage aesthetic.</li>
  <li><strong>Add accessories</strong> - Consider a leather belt,
  sunglasses, or a vintage watch.</li>
</ol>
```

**3. Table Snippets (~10% of snippets)**
- Comparison queries
- Specification lookups
- Price comparisons

**Optimization:**
```html
<h2>Your Brand vs Competitor Shorts Comparison</h2>
<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Your Brand</th>
      <th>Chubbies</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Inseam</td>
      <td>3 inches</td>
      <td>5.5 inches</td>
    </tr>
    <tr>
      <td>Style</td>
      <td>Vintage 70s-80s</td>
      <td>Modern casual</td>
    </tr>
    <tr>
      <td>Price range</td>
      <td>$48-68</td>
      <td>$55-75</td>
    </tr>
  </tbody>
</table>
```

### Featured Snippet Checklist

- [ ] Target question appears as H2 or H3 heading
- [ ] Answer immediately follows the heading (within same section)
- [ ] Paragraph answers are 40-60 words
- [ ] List items start with action verbs or bolded keywords
- [ ] Tables have clear headers and 3+ rows
- [ ] Content is factual, not promotional
- [ ] Page ranks in top 10 for target query (prerequisite)

## People Also Ask (PAA) Optimization

### How PAA Works

- Questions related to the main search query
- Expandable boxes that reveal answers
- Clicking one generates more related questions
- Content is pulled from various ranking pages

### PAA Strategy

**1. Research PAA Questions**

For each target keyword, document all PAA questions:

```markdown
## Keyword: "corduroy shorts"

### PAA Questions Found
1. Are corduroy shorts in style?
2. What do you wear with corduroy shorts?
3. Are corduroy shorts good for summer?
4. What is the difference between corduroy and regular shorts?
5. How do you wash corduroy shorts?
```

**2. Create Targeted Content**

For each PAA question, create a dedicated answer section:

```html
<section class="faq-section">
  <h3>Are corduroy shorts in style?</h3>
  <p>Yes, corduroy shorts have made a strong comeback in 2024-2026 fashion.
  The retro 1970s and 1980s aesthetic is popular, and corduroy's texture
  and warmth make it versatile for spring, fall, and even mild winters.
  Major brands and designers have reintroduced corduroy across their
  collections.</p>
</section>
```

**3. Use FAQ Schema**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Are corduroy shorts in style?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes, corduroy shorts have made a strong comeback..."
    }
  }]
}
</script>
```

### PAA Optimization Checklist

- [ ] Researched all PAA questions for target keywords
- [ ] Created dedicated answer sections for top 5 questions
- [ ] Answers are 50-100 words
- [ ] FAQ schema implemented
- [ ] Questions use exact phrasing from SERP
- [ ] Answers are factual and directly address the question

## Image Pack Optimization

### When Images Appear

- Product searches
- Visual queries ("what does X look like")
- Style/fashion queries
- Location queries

### Image Optimization Requirements

| Element | Requirement | Example |
|---------|-------------|---------|
| Filename | Descriptive, hyphenated | `mens-navy-corduroy-shorts.jpg` |
| Alt text | Keyword-rich description | "Men's navy corduroy shorts with 3-inch inseam" |
| Title | Same as alt or more detailed | Same |
| Size | 1200px+ width recommended | 1200 x 1600px |
| Format | WebP preferred, JPEG fallback | `.webp` with `.jpg` fallback |
| Compression | Under 200KB ideally | Use TinyPNG or similar |

### Image SEO Checklist

- [ ] All product images have descriptive filenames
- [ ] Alt text includes primary keyword + product details
- [ ] Images are high resolution (1200px+ width)
- [ ] Images are compressed for fast loading
- [ ] Multiple angles provided per product
- [ ] Lifestyle images show product in use
- [ ] Image sitemap submitted to Search Console

### Structured Data for Images

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Men's Navy Corduroy Shorts",
  "image": [
    "https://example.com/images/mens-navy-corduroy-shorts-front.jpg",
    "https://example.com/images/mens-navy-corduroy-shorts-back.jpg",
    "https://example.com/images/mens-navy-corduroy-shorts-lifestyle.jpg"
  ]
}
</script>
```

## Video Carousel Optimization

### When Video Appears

- "How to" queries
- Tutorial/guide searches
- Review queries
- Entertainment queries

### Video Strategy for E-commerce

| Video Type | Purpose | Length |
|------------|---------|--------|
| Product overview | Show product features | 30-60 sec |
| Styling guide | Demonstrate outfit ideas | 2-3 min |
| Size guide | Help with fit decisions | 1-2 min |
| Behind the scenes | Brand storytelling | 2-5 min |
| Customer testimonials | Social proof | 1-2 min |

### Video SEO Requirements

**1. YouTube Optimization (if hosting there)**
- Title includes target keyword
- Description is 200+ words
- Tags include all relevant keywords
- Custom thumbnail with text overlay
- Chapters/timestamps for longer videos
- End screen with CTAs

**2. On-Page Video Embedding**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "How to Style Corduroy Shorts",
  "description": "Learn 5 different ways to style vintage corduroy shorts...",
  "thumbnailUrl": "https://example.com/video-thumbnails/corduroy-styling.jpg",
  "uploadDate": "2026-01-15",
  "duration": "PT3M45S",
  "contentUrl": "https://www.youtube.com/watch?v=xxx"
}
</script>
```

## AI Overview Optimization

### How AI Overviews Work

- Google's AI synthesizes information from multiple sources
- Appears at top of SERP for informational queries
- Cites sources with links
- Growing in frequency (~30% of queries in 2026)

### Getting Cited in AI Overviews

**Content Requirements:**
1. **Clear, factual statements** - AI extracts quotable facts
2. **Structured format** - Lists, tables, specs are preferred
3. **Unique information** - Original data/insights get cited
4. **Entity clarity** - Make clear what/who the page is about
5. **Comprehensive coverage** - Cover all aspects of the topic

**Optimization Tactics:**

```html
<!-- Start with a clear definition -->
<p><strong>Dolphin shorts</strong> are short athletic shorts featuring
curved, split leg seams that became popular in the 1980s. The standard
inseam is 2-3 inches, and they're typically made from lightweight nylon
or polyester.</p>

<!-- Include specific facts that can be extracted -->
<h3>Key Specifications</h3>
<ul>
  <li>Inseam length: 2-3 inches</li>
  <li>Materials: Nylon (70-100%), Polyester, Spandex blend</li>
  <li>Origin: Popularized in 1980s California</li>
  <li>Use cases: Running, swimming, casual wear, gym</li>
</ul>

<!-- Answer related questions directly -->
<h3>Are dolphin shorts making a comeback?</h3>
<p>Yes. As of 2026, dolphin shorts have experienced a resurgence driven
by 1980s nostalgia and athletic retro fashion trends. Sales of vintage-style
shorts have increased 40% year-over-year according to industry reports.</p>
```

### AI Overview Checklist

- [ ] Page has clear topic/entity focus
- [ ] Definitions appear early in content
- [ ] Specific numbers/facts are included
- [ ] Content answers common questions directly
- [ ] Lists and tables summarize key information
- [ ] Sources are cited for claims when relevant
- [ ] Content is comprehensive (1500+ words for pillar topics)

## SERP Feature Audit Process

### Step 1: Identify Feature Opportunities

For each target keyword, check the current SERP:

```markdown
## Keyword: "how to style corduroy shorts"

### Current SERP Features
- [x] Featured snippet (paragraph) - Currently held by: gq.com
- [x] People Also Ask - 4 questions
- [ ] Image pack - Not present
- [x] Video carousel - 3 videos (YouTube)
- [ ] AI Overview - Not triggered

### Opportunity Assessment
- Featured snippet: Winnable (competitor content is thin)
- PAA: High opportunity (can answer all 4 questions)
- Video: Need to create content
```

### Step 2: Gap Analysis

```markdown
## Featured Snippet Gap Analysis

### Current Holder: gq.com
- Content length: ~45 words
- Format: Paragraph
- Quality: Generic advice

### Our Opportunity
- Create 50-word answer immediately after H2
- Include brand-specific styling tips
- Add supporting list of outfit ideas

### Action Items
1. Add "How to Style Corduroy Shorts" section to corduroy collection page
2. Format answer for snippet extraction
3. Include 5-step styling process below
```

### Step 3: Implementation Priority

| Keyword | Feature | Current Holder | Difficulty | Traffic Potential | Priority |
|---------|---------|----------------|------------|-------------------|----------|
| how to style corduroy | Snippet | gq.com | Medium | 2,400/mo | P1 |
| what are dolphin shorts | Snippet | wikipedia | Hard | 8,100/mo | P2 |
| best retro shorts | PAA | - | Easy | 1,900/mo | P1 |

## Tracking & Measurement

### Feature Tracking Template

```csv
keyword,feature_type,target_date,our_position,feature_holder,feature_won,first_win_date,notes
how to style corduroy,snippet,2026-02-01,8,gq.com,no,,Content added 1/25
what are dolphin shorts,snippet,2026-03-01,4,wikipedia,no,,Need more authority
corduroy care,paa,2026-02-15,12,-,yes,2026-02-10,Won 2 of 4 questions
```

### Measurement Cadence

| Action | Frequency |
|--------|-----------|
| Check snippet ownership | Weekly |
| PAA question research | Monthly |
| Image pack analysis | Monthly |
| Video opportunities | Quarterly |
| AI Overview monitoring | Weekly |

### Success Metrics

| Feature | Success Metric | Target |
|---------|----------------|--------|
| Featured snippets | Snippets won | 5+ per quarter |
| People Also Ask | Questions answered | 20+ answers visible |
| Image pack | Images in pack | 10+ product images |
| Video carousel | Videos appearing | 3+ videos |
| AI Overview | Citations | 5+ brand mentions |

## Output Files

```
workflows/seo/serp-features/
├── audit-[date].md                 # SERP feature audit
├── snippet-opportunities.csv       # Snippet targets
├── paa-questions.md                # PAA question database
├── image-optimization-log.csv      # Image SEO tracking
├── video-content-plan.md           # Video strategy
└── feature-tracking.csv            # Win/loss tracking
```

## Related Workflows

- [topic-clusters.md](topic-clusters.md) - Build authority for competitive features
- [content-gaps.md](content-gaps.md) - Find feature opportunities in gaps
- [ab-testing.md](ab-testing.md) - Test snippet formats
- [monitoring.md](monitoring.md) - Track feature wins/losses
