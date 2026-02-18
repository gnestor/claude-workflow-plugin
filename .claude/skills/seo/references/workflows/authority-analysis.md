# Backlink & Authority Analysis Workflow

## Overview

Understanding domain authority and backlink profiles to assess competitive landscape, prioritize keywords by rankability, and identify link-building opportunities.

**Frequency:** Quarterly deep analysis, monthly monitoring
**Output:** Authority benchmarks and link opportunity reports

## Why Authority Matters

1. **Ranking potential** - Higher authority = ability to rank for competitive terms
2. **Keyword prioritization** - Focus on terms where your authority is sufficient
3. **Competitive gaps** - Understand what separates you from competitors
4. **Growth tracking** - Measure long-term SEO progress
5. **Link opportunity identification** - Find sites willing to link

## Understanding Domain Authority

### What Domain Authority Is

- **Not a Google metric** - Third-party approximation of ranking strength
- **Relative measure** - Useful for comparison, not absolute ranking prediction
- **Based on backlinks** - Primarily measures link profile quality and quantity
- **Log scale** - Going from 30 to 40 is harder than 20 to 30

### Authority Score Interpretation

| DA Range | Interpretation | Ranking Expectation |
|----------|----------------|---------------------|
| 0-20 | New/small site | Long-tail keywords only |
| 21-40 | Developing site | Medium competition keywords |
| 41-60 | Established site | Most keywords winnable with content |
| 61-80 | Strong site | Can compete for competitive terms |
| 81-100 | Authoritative | Can rank for almost anything |

### Authority Sources

Since we don't have paid tool access, use free alternatives:

| Tool | Metric | Free Limit | URL |
|------|--------|------------|-----|
| Moz | Domain Authority (DA) | 10/month | moz.com/link-explorer |
| Ahrefs | Domain Rating (DR) | Limited | ahrefs.com/free-seo-tools |
| SEMrush | Authority Score | Limited | semrush.com |
| Majestic | Trust Flow | Limited | majestic.com |
| Chrome extensions | Various | Unlimited | MozBar, Ubersuggest |

## Authority Assessment Process

### Step 1: Baseline Your Authority

**Gather metrics:**
```markdown
## Domain Authority Baseline: example.com

### Current Metrics (Date: 2026-01-25)
| Metric | Value | Source |
|--------|-------|--------|
| Moz DA | 35 | moz.com |
| Ahrefs DR | 32 | ahrefs.com |
| Referring Domains | 180 | Search Console |
| Total Backlinks | 1,200 | Search Console |
| Top Link | Example.com (DA 65) | Manual check |

### Historical Trend
| Date | DA | DR | Referring Domains |
|------|----|----|-------------------|
| 2025-01 | 28 | 25 | 120 |
| 2025-07 | 32 | 29 | 155 |
| 2026-01 | 35 | 32 | 180 |
```

### Step 2: Benchmark Against Competitors

**Competitor authority comparison:**
```markdown
## Competitive Authority Analysis

| Domain | DA | DR | Ref Domains | Key Advantage |
|--------|----|----|-------------|---------------|
| example.com | 35 | 32 | 180 | - |
| chubbies.com | 52 | 48 | 650 | More press coverage |
| bearbottom.com | 38 | 35 | 220 | Similar level |
| vintage1946.com | 28 | 24 | 95 | Lower authority |

### Authority Gap Analysis
- **Vs. Chubbies:** 17 DA gap, need 470+ new referring domains
- **Vs. Bearbottom:** 3 DA gap, competitive parity achievable
- **Vs. Vintage1946:** 7 DA advantage, can outrank for same keywords
```

### Step 3: Calculate Keyword Difficulty

**Authority-based difficulty assessment:**

```
rankability_score = your_da / average_top10_da

where:
  > 1.0 = Good chance to rank
  0.8-1.0 = Competitive, possible with great content
  0.5-0.8 = Challenging, may need authority building
  < 0.5 = Very difficult, focus elsewhere
```

**Example calculations:**
```markdown
## Keyword Rankability Analysis

| Keyword | Top 10 Avg DA | Your DA | Ratio | Rankability |
|---------|---------------|---------|-------|-------------|
| corduroy shorts | 45 | 35 | 0.78 | Challenging |
| dolphin shorts history | 35 | 35 | 1.00 | Good |
| best mens shorts | 62 | 35 | 0.56 | Difficult |
| your-brand shorts | 28 | 35 | 1.25 | Easy |
| vintage 80s shorts | 38 | 35 | 0.92 | Competitive |
```

### Step 4: Segment Keyword Targets by Authority

**Priority matrix:**

| Authority Match | Content Quality Needed | Timeline |
|-----------------|------------------------|----------|
| Ratio > 1.0 | Good content wins | 1-3 months |
| Ratio 0.8-1.0 | Excellent content needed | 3-6 months |
| Ratio 0.5-0.8 | Best content + some links | 6-12 months |
| Ratio < 0.5 | Authority building required | 12+ months |

## Backlink Analysis

### Step 1: Export Your Backlinks

**From Google Search Console:**
```
1. Go to Search Console > Links
2. Export "Top linking sites" and "Top linked pages"
3. Save as backlinks-[date].csv
```

**Data to capture:**
```csv
linking_domain,linking_page,linked_page,anchor_text,da_estimate,link_type,date_found
example.com,/article,/products/shorts,your-brand shorts,45,editorial,2025-06-15
blog.com,/review,/,click here,32,review,2025-08-20
```

### Step 2: Categorize Links

**Link type categories:**

| Type | Description | Value | Example |
|------|-------------|-------|---------|
| Editorial | Naturally earned, in-content | High | Magazine feature |
| Review | Product review mention | High | Blog review |
| Directory | Business listing | Low | Yelp, BBB |
| Social | Social profile | Low | Twitter, Instagram |
| Forum/UGC | User mentions | Low | Reddit, Quora |
| Resource | Resource page listing | Medium | "Best of" lists |

### Step 3: Identify High-Value Links

**High-value link characteristics:**
- DA 40+ domain
- Relevant niche (fashion, retail, lifestyle)
- Editorial context (not paid/sponsored)
- Follow attribute (not nofollow)
- Traffic-driving potential

**High-value link inventory:**
```markdown
## Top 10 Most Valuable Backlinks

| Linking Domain | DA | Anchor Text | Linked Page | Type | Traffic Est |
|----------------|----|-----------| ------------|------|-------------|
| gq.com | 92 | "Your Brand shorts" | /products/shorts | Editorial | 500/mo |
| menshealth.com | 88 | "retro shorts brand" | / | Editorial | 200/mo |
| reddit.com/r/fashion | 98 | "these shorts" | /products/dolphin | UGC | 100/mo |
```

### Step 4: Find Link Gaps

**Competitor links you don't have:**
```markdown
## Link Gap Analysis

### Sites linking to Chubbies but not your brand
| Domain | DA | Page Linking | Topic | Opportunity |
|--------|----|--------------| ------|-------------|
| esquire.com | 89 | /style/shorts | Men's shorts guide | Pitch for inclusion |
| buzzfeed.com | 94 | /shopping/best | Best shorts list | Product review |
| fashionbeans.com | 62 | /reviews | Shorts review | Send product |

### Outreach Priority
1. Esquire - Update their guide, mention our unique styles
2. BuzzFeed - Product for review, emphasize retro angle
3. FashionBeans - Review opportunity, send samples
```

## Link Building Opportunities

### Opportunity Types for E-commerce

**1. Product Reviews**
- Send products to fashion bloggers
- Target: DA 30-60 lifestyle blogs
- Approach: Personalized pitch + free product

**2. Resource Page Links**
- Find "best shorts" or "retro fashion" lists
- Target: DA 40+ content sites
- Approach: Suggest addition with unique angle

**3. Broken Link Building**
- Find broken links to competitor products
- Target: Any relevant site
- Approach: Offer your page as replacement

**4. Digital PR**
- Newsworthy content (trends, data, stories)
- Target: DA 60+ news/magazine sites
- Approach: Press releases, journalist outreach

**5. Brand Mentions**
- Find unlinked mentions of your brand
- Target: Any mention without link
- Approach: Polite request to add link

### Link Opportunity Template

```markdown
## Link Opportunity: [Site Name]

### Site Details
- **URL:** example.com
- **DA:** 55
- **Relevance:** Fashion/lifestyle blog
- **Contact:** editor@example.com

### Opportunity Type
- [ ] Product review
- [x] Resource page inclusion
- [ ] Broken link replacement
- [ ] Brand mention conversion
- [ ] Guest content

### Specific Page
- URL: example.com/best-retro-shorts
- Current content: Lists 8 brands, not including us
- Our angle: Authentic 80s aesthetic, unique inseams

### Outreach Plan
1. Initial email: [Date]
2. Follow-up: [Date + 7 days]
3. Final attempt: [Date + 14 days]

### Status
- [ ] Outreach sent
- [ ] Response received
- [ ] Link acquired
- [ ] Link verified
```

## Authority Building Strategy

### Quick Wins (1-3 months)

| Tactic | Expected DA Impact | Effort |
|--------|-------------------|--------|
| Claim brand mentions | +1-2 DA | Low |
| Product reviews (5-10) | +2-3 DA | Medium |
| Local citations | +1 DA | Low |
| Industry directories | +1 DA | Low |

### Medium-Term (3-6 months)

| Tactic | Expected DA Impact | Effort |
|--------|-------------------|--------|
| Guest posts (5-10) | +3-5 DA | High |
| Resource page links (10+) | +2-3 DA | Medium |
| Influencer partnerships | +2-4 DA | High |
| Press coverage | +3-5 DA | High |

### Long-Term (6-12 months)

| Tactic | Expected DA Impact | Effort |
|--------|-------------------|--------|
| Original research/data | +5-10 DA | High |
| Industry awards | +2-3 DA | Medium |
| Partnership links | +3-5 DA | Medium |
| Digital PR campaigns | +5-10 DA | High |

## Tracking & Measurement

### Monthly Metrics

```csv
month,da_moz,dr_ahrefs,referring_domains,new_links,lost_links,link_velocity
2026-01,35,32,180,12,3,+9
2026-02,36,33,188,15,5,+10
2026-03,37,34,200,18,6,+12
```

### Link Velocity Goals

| Current DA | Target Monthly New Links | Target Velocity |
|------------|--------------------------|-----------------|
| 20-30 | 5-10 | Steady growth |
| 30-40 | 10-20 | Accelerated |
| 40-50 | 15-25 | Competitive |
| 50+ | 20-40 | Market leader |

### Authority Growth Dashboard

```markdown
## Authority Dashboard - [Month]

### Current Status
- **DA:** 36 (+1 from last month)
- **Referring Domains:** 188 (+8)
- **Link Velocity:** +10/month

### Progress vs. Competitors
| Competitor | Their DA | Gap | Gap Change |
|------------|----------|-----|------------|
| Chubbies | 52 | -16 | -1 (closing) |
| Bearbottom | 38 | -2 | 0 (holding) |

### Link Acquisition This Month
- Editorial links: 3
- Review links: 5
- Directory links: 4
- Total quality links: 8

### Outreach Pipeline
- Opportunities identified: 25
- Outreach sent: 20
- Responses: 8
- Links acquired: 3
- Conversion rate: 15%
```

## Integration with Opportunity Scoring

### Authority-Adjusted Scoring

Update the opportunity score formula to include difficulty:

```
adjusted_score = opportunity_score × authority_factor

where:
  authority_factor = min(1.0, your_da / top10_avg_da)
```

**Example:**
```
Keyword: "best mens shorts"
Original opportunity score: 85
Your DA: 35
Top 10 average DA: 62
Authority factor: 35/62 = 0.56
Adjusted score: 85 × 0.56 = 48

Interpretation: High potential but authority gap makes it challenging
Action: Build authority before prioritizing this keyword
```

## Output Files

```
workflows/seo/authority/
├── baseline/
│   └── authority-baseline-[date].md
├── competitor-comparison/
│   └── authority-comparison-[date].md
├── backlinks/
│   ├── backlink-export-[date].csv
│   └── link-analysis-[date].md
├── opportunities/
│   ├── link-opportunities.csv
│   └── outreach-tracker.csv
├── tracking/
│   └── authority-history.csv
└── keyword-difficulty/
    └── difficulty-analysis-[date].md
```

## Related Workflows

- [competitor-tracking.md](competitor-tracking.md) - Compare competitor authority
- [content-gaps.md](content-gaps.md) - Prioritize gaps by authority match
- [performance-forecasting.md](performance-forecasting.md) - Factor authority into forecasts
- [full-catalog.md](full-catalog.md) - Use authority for keyword prioritization
