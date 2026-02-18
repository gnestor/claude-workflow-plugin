# Competitor Tracking Workflow

## Overview

Systematic monitoring of competitor SEO activities, rankings, and content strategies. This workflow enables proactive response to competitive changes and identification of new opportunities.

**Frequency:** Weekly checks, monthly deep analysis
**Output:** Competitive intelligence reports and alerts

## Why Track Competitors

1. **Early warning** - Detect ranking threats before they impact traffic
2. **Learn strategies** - Understand what works for competitors
3. **Find gaps** - Identify opportunities they're missing
4. **Benchmark progress** - Measure your improvement against the field
5. **Content ideas** - Discover successful content formats and topics

## Competitor Set Definition

### Competitor Types

| Type | Definition | Tracking Priority |
|------|------------|-------------------|
| Direct | Same products, same audience | High - track weekly |
| Indirect | Similar products, overlapping audience | Medium - track monthly |
| Content | Ranks for your target keywords (blogs, publishers) | Medium - track monthly |
| Aspirational | Industry leaders you want to match | Low - track quarterly |

### Defining Your Competitor Set

**Step 1: Identify by Product Overlap**
```markdown
## Direct Competitors (Same Products)

| Competitor | Domain | Product Overlap | Notes |
|------------|--------|-----------------|-------|
| Chubbies | chubbies.com | Shorts, casual wear | Main competitor, similar positioning |
| Bearbottom | bearbottomclothing.com | Shorts, comfort wear | Price-focused |
| Vintage 1946 | vintage1946.com | Retro menswear | Similar aesthetic |
| Goodfellow | target.com/goodfellow | Shorts, basics | Mass market |
```

**Step 2: Identify by Keyword Overlap**

Search your top 10 keywords and note who ranks:

```markdown
## Content Competitors (Keyword Overlap)

| Competitor | Domain | Keywords Competing | Content Type |
|------------|--------|-------------------|--------------|
| GQ | gq.com | "best shorts", "how to style" | Editorial |
| Strategist | nymag.com/strategist | "best [product]" guides | Reviews |
| Reddit | reddit.com | "shorts recommendations" | UGC |
```

**Step 3: Score and Prioritize**

```
competitor_priority = (keyword_overlap × product_overlap × market_share) / effort_to_track

where:
  keyword_overlap = 0-1 (percentage of keywords where you both rank)
  product_overlap = 0-1 (percentage of product category overlap)
  market_share = 0-1 (relative market presence)
  effort_to_track = 1-5 (difficulty of tracking)
```

### Competitor Profile Template

```markdown
# Competitor Profile: [Competitor Name]

## Overview
- **Domain:** example.com
- **Type:** Direct / Indirect / Content
- **Priority:** High / Medium / Low
- **Last Updated:** [Date]

## Product Overlap
- Categories competing: [list]
- Price positioning: Lower / Similar / Higher
- Unique selling props: [list]

## SEO Profile
- Estimated organic traffic: [X]/month
- Domain authority estimate: [X]
- Top ranking keywords: [list top 10]
- Content strategy: Blog / Guides / Product-only

## SWOT Analysis
### Strengths
- [Strength 1]
- [Strength 2]

### Weaknesses
- [Weakness 1]
- [Weakness 2]

### Opportunities
- [What we can exploit]

### Threats
- [What threatens our position]

## Tracking Metrics
- Keywords to monitor: [list]
- Pages to watch: [URLs]
- Update frequency: Weekly / Monthly
```

## Weekly Competitor Check

### Step 1: Position Tracking

For each shared keyword, track positions:

```csv
keyword,your_position,competitor_a,competitor_b,competitor_c,date,change_you,change_a,change_b,change_c
corduroy shorts,8,5,12,15,2026-01-25,+1,-2,0,+3
dolphin shorts,4,3,8,-,2026-01-25,0,0,-1,-
bell bottoms,6,4,2,18,2026-01-25,-2,0,0,+1
```

### Step 2: Movement Alerts

**Alert triggers:**

| Condition | Alert Level | Action |
|-----------|-------------|--------|
| Competitor gains 5+ positions | Warning | Analyze their changes |
| Competitor enters top 3 | Critical | Immediate content review |
| New competitor appears in top 10 | Info | Add to tracking |
| Competitor drops 10+ positions | Opportunity | Check for deindex/penalty |

**Alert template:**
```markdown
## Competitor Alert: [Date]

### Critical
- **[Competitor]** moved from position 8 to 3 for "corduroy shorts"
  - Likely cause: New content published [URL]
  - Recommended action: Analyze content, update our page

### Warning
- **[Competitor]** gained 5 positions for "best retro shorts"
  - Likely cause: Technical improvement (speed)
  - Recommended action: Monitor next week

### Opportunities
- **[Competitor]** dropped from position 2 to 25 for "dolphin shorts"
  - Likely cause: Page removed/redirected
  - Recommended action: Target position 2
```

### Step 3: Content Change Detection

**What to monitor:**
- New pages published
- Significant page updates
- Meta title/description changes
- New product launches

**Simple monitoring approach:**
```bash
# Track competitor page changes using web archive
# Check: https://web.archive.org/web/[competitor-url]

# Or use simple hash comparison
curl -s "https://competitor.com/page" | md5sum
# Store hash, compare weekly
```

## Monthly Deep Analysis

### Competitor Content Audit

For each key competitor, analyze:

**1. Content Inventory**
```markdown
## [Competitor] Content Audit - [Month]

### Blog/Content Pages
| URL | Title | Word Count | Target Keyword | Position |
|-----|-------|------------|----------------|----------|
| /blog/style-guide | Summer Style Guide | 2,500 | summer shorts style | 4 |
| /blog/care-tips | Shorts Care | 1,200 | how to wash shorts | 8 |

### Product Pages
| Category | # Products | Avg Description Length | Schema? | FAQ? |
|----------|------------|------------------------|---------|------|
| Shorts | 45 | 150 words | Yes | No |
| Shirts | 30 | 120 words | Yes | No |

### Key Findings
- They have [X] blog posts we don't
- Their product descriptions are [longer/shorter]
- They use [feature] we don't
```

**2. Keyword Gap Analysis**

Keywords competitor ranks for that you don't:

```csv
keyword,competitor_position,your_position,impressions_estimate,priority
how to fold shorts,3,-,2400,P2
shorts for big thighs,5,-,8100,P1
chubbies alternative,1,-,1200,P1
```

**3. Backlink Profile Comparison**

| Metric | You | Competitor A | Competitor B |
|--------|-----|--------------|--------------|
| Domain Authority | 35 | 52 | 41 |
| Total Backlinks | 1,200 | 8,500 | 3,200 |
| Referring Domains | 180 | 650 | 320 |
| Editorial Links | 25 | 120 | 45 |

### Competitive Response Plan

Based on monthly analysis, create action plan:

```markdown
## Competitive Response Plan - [Month]

### Priority 1: Immediate Actions
- [ ] Create content for "shorts for big thighs" (competitor ranking)
- [ ] Add FAQ schema to product pages (competitor advantage)
- [ ] Improve page speed (competitor faster)

### Priority 2: This Quarter
- [ ] Build pillar page for corduroy (competitor has one)
- [ ] Launch style guide blog series (content gap)
- [ ] Acquire 10 editorial links (authority gap)

### Priority 3: Backlog
- [ ] Video content strategy (competitor has videos)
- [ ] Size recommendation tool (competitor feature)
```

## Competitor Content Strategies

### Common E-commerce SEO Patterns

| Strategy | What It Looks Like | When to Copy |
|----------|-------------------|--------------|
| Buying guides | "Best X for Y" articles | High keyword volume |
| Comparison pages | "X vs Y" landing pages | Branded searches exist |
| How-to content | Style guides, tutorials | Informational queries |
| User guides | Care, sizing, fit guides | Post-purchase queries |
| Seasonal content | "Summer 2026" pages | Seasonal demand |

### Analyzing Competitor Content Quality

**Content Scoring Rubric:**

| Element | Weight | Score 1-5 |
|---------|--------|-----------|
| Comprehensiveness | 25% | How complete is the coverage? |
| Unique value | 25% | Does it offer something others don't? |
| User experience | 20% | How well-structured and readable? |
| Visual quality | 15% | Images, videos, graphics |
| Technical SEO | 15% | Schema, speed, mobile |

**Example Analysis:**
```markdown
## Content Analysis: Chubbies Style Guide

### Scoring
- Comprehensiveness: 4/5 - Covers most outfit ideas
- Unique value: 3/5 - Generic advice, not unique
- User experience: 5/5 - Well-designed, easy to read
- Visual quality: 4/5 - Good photos, no video
- Technical SEO: 4/5 - Has schema, could be faster

**Total Score:** 4.0/5

### Opportunities to Beat
1. Add video content for outfits
2. Include price-tier recommendations
3. Add seasonal/occasion breakdown
4. Create interactive outfit builder
```

## Tracking Infrastructure

### Spreadsheet Structure

**Sheet 1: Competitor Master List**
```csv
competitor,domain,type,priority,last_updated,da_estimate,traffic_estimate,products_count
Chubbies,chubbies.com,direct,high,2026-01-25,52,450000,120
Bearbottom,bearbottomclothing.com,direct,medium,2026-01-25,38,180000,85
```

**Sheet 2: Keyword Tracking**
```csv
keyword,our_position,chubbies,bearbottom,gq,strategist,date
corduroy shorts,8,5,12,15,-,2026-01-25
dolphin shorts,4,3,8,-,-,2026-01-25
```

**Sheet 3: Content Changes Log**
```csv
date,competitor,change_type,url,description,impact_assessment
2026-01-20,Chubbies,new_page,/blog/summer-guide,Summer 2026 style guide,May compete for "summer shorts"
2026-01-18,Bearbottom,update,/products/shorts,Added FAQ section,Product page improvement
```

**Sheet 4: Alerts History**
```csv
date,competitor,keyword,alert_type,details,action_taken,resolved
2026-01-15,Chubbies,corduroy shorts,position_gain,5 to 3,Updated our content,yes
```

### Automation Options

**Weekly position checks:**
```bash
#!/bin/bash
# competitor-check.sh

DATE=$(date +%Y-%m-%d)
KEYWORDS="corduroy+shorts,dolphin+shorts,bell+bottoms"

# Use Google Search Console for your positions
# Use manual SERP checks or third-party tools for competitors

# Log results
echo "$DATE,corduroy shorts,8,5,12" >> competitor-tracking.csv
```

## Output Files

```
workflows/seo/competitors/
├── competitor-profiles/
│   ├── chubbies-profile.md
│   ├── bearbottom-profile.md
│   └── ...
├── tracking/
│   ├── keyword-positions.csv
│   ├── alerts-history.csv
│   └── content-changes.csv
├── monthly-reports/
│   ├── competitor-report-2026-01.md
│   └── ...
├── response-plans/
│   └── competitive-response-q1-2026.md
└── competitor-set.json
```

## Integration with Other Workflows

### With Content Gap Analysis
- Use competitor keywords to identify gaps
- Prioritize gaps based on competitor performance

### With SERP Feature Targeting
- Track which features competitors hold
- Prioritize features competitors are winning

### With Monitoring
- Include competitor alerts in weekly reports
- Track competitive position changes alongside own metrics

### With Forecasting
- Use competitor performance to estimate realistic targets
- Factor competitive pressure into forecasts

## Competitive Intelligence Ethics

### Do's
- Monitor public information (rankings, content, pricing)
- Analyze published content for insights
- Track publicly available metrics
- Use SERP data for position tracking

### Don'ts
- Access competitor analytics (unless authorized)
- Scrape at rates that harm their site
- Use deceptive means to access private data
- Copy content or designs directly

## Related Workflows

- [content-gaps.md](content-gaps.md) - Find gaps in competitor strategies
- [serp-features.md](serp-features.md) - Track feature ownership
- [monitoring.md](monitoring.md) - Integrate competitor alerts
- [performance-forecasting.md](performance-forecasting.md) - Set competitive targets
