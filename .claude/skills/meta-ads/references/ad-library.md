# Competitor Research with Meta Ad Library

## API Limitations

The Meta Ad Library API (`/ads_archive`) only returns data for:
- Ads running in **EU** or **Brazil**
- **Political/issue ads** (globally)

For general competitor research (US ads, non-political), the API will return empty results.

## Using the Ad Library API

For EU/Brazil or political ads:

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts ad-library \
  --search "competitor name" \
  --country US \
  --limit 50
```

### Available Fields

| Field | Description |
|-------|-------------|
| `ad_creative_bodies` | Ad copy text |
| `ad_creative_link_captions` | Link preview captions |
| `ad_creative_link_descriptions` | Link descriptions |
| `ad_creative_link_titles` | Headline text |
| `ad_delivery_start_time` | When ad started running |
| `ad_delivery_stop_time` | When ad stopped (if applicable) |
| `ad_snapshot_url` | URL to view ad preview |
| `page_name` | Advertiser page name |
| `publisher_platforms` | Where ad runs (facebook, instagram) |
| `estimated_audience_size` | Estimated reach range |

### What's NOT Available

- Exact targeting parameters
- Custom audience sources
- Lookalike audience logic
- Conversion data
- Return on ad spend (ROAS)
- Budget information

---

## Browser Automation Approach (Primary)

For general competitor research, use Claude-in-Chrome MCP to browse the Ad Library directly.

### Step-by-Step Workflow

#### 1. Navigate to Ad Library

```
mcp__claude-in-chrome__navigate
url: https://www.facebook.com/ads/library
```

#### 2. Search for Competitor

- Click the search box ("Search by keyword or advertiser")
- Type the brand name
- **Important**: Wait for autocomplete dropdown
- Select the verified advertiser (look for checkmark and follower count)

#### 3. Scroll to Load Ads

Scroll down to load more ads before extraction:

```
mcp__claude-in-chrome__computer
action: scroll
scroll_direction: down
scroll_amount: 10
```

Repeat 2-3 times to load ~50+ ads.

#### 4. Extract Ad Data with JavaScript

Use this JavaScript pattern to extract ad details programmatically:

```
(function(){
  var txt = document.body.innerText;
  var ids = txt.match(/Library ID: [0-9]+/g) || [];
  var u = [...new Set(ids.map(function(x){ return x.replace("Library ID: ",""); }))];
  var r = [];
  u.forEach(function(id){
    var i = txt.indexOf("Library ID: " + id);
    var c = txt.substring(i, i + 1000);
    var dm = c.match(/Started running on ([A-Za-z]+ [0-9]+, [0-9]+)/);
    var cap = "";
    var si = c.indexOf("Sponsored");
    if(si > -1){
      var as = c.substring(si + 9, si + 400);
      var li = as.indexOf("Low impression");
      var bi = as.indexOf("BODEN");
      var ei = Math.min(li > -1 ? li : 400, bi > -1 ? bi : 400);
      cap = as.substring(0, ei);
    }
    var hl = "";
    var bdi = c.indexOf("BODEN.COM");
    if(bdi > -1){
      var ab = c.substring(bdi + 10, bdi + 70);
      var shi = ab.indexOf("Shop Now");
      var fri = ab.indexOf("Free");
      var he = Math.min(shi > -1 ? shi : 70, fri > -1 ? fri : 70);
      hl = ab.substring(0, he);
    }
    var inf = "";
    var wi = c.indexOf("Boden with ");
    if(wi > -1){
      var aw = c.substring(wi + 11, wi + 50);
      var spi = aw.indexOf("Sponsored");
      if(spi > -1) inf = aw.substring(0, spi);
    }
    r.push({
      id: id,
      date: dm ? dm[1] : "",
      caption: cap.trim(),
      headline: hl.trim(),
      influencer: inf.trim(),
      url: "https://facebook.com/ads/library/?id=" + id
    });
  });
  return JSON.stringify(r);
})()
```

**Key Notes:**
- Use `[0-9]` instead of `\d` in regex (Unicode handling)
- Wrap in IIFE to avoid syntax errors
- Adjust brand name detection (e.g., "BODEN.COM") for each competitor

#### 5. Take Screenshots for Vision Analysis

Screenshot interesting ads for creative analysis:

```
mcp__claude-in-chrome__computer
action: screenshot
```

#### 6. Generate Report

Create markdown report using template: `/workflows/competitor-analysis/boden-meta-ads-analysis.md`

Include:
- Campaign themes with headlines and captions
- Influencer partnerships table
- Sample ads table (ID, date, headline, caption)
- Key insights

### Quick Example

```
1. Navigate to facebook.com/ads/library
2. Search: "Boden" → Select "Boden" (verified, 845K followers)
3. Scroll down 3x to load ads
4. Run JavaScript extraction
5. Screenshot top campaigns
6. Generate analysis report
```

---

## Vision Analysis Prompts

When analyzing competitor ad screenshots with Claude vision:

### General Strategy Analysis

> "Analyze these competitor ads. Identify:
> 1. Primary messaging themes
> 2. Visual style patterns (colors, imagery, layouts)
> 3. Call-to-action patterns
> 4. Target audience signals
> 5. Promotional strategies (discounts, urgency, social proof)"

### Creative Format Analysis

> "Compare these ad creatives:
> 1. Which formats are used (single image, carousel, video)?
> 2. What's the ratio of product-focused vs lifestyle imagery?
> 3. How much text appears on images?
> 4. What's the dominant color palette?"

### Copy Analysis

> "Analyze the ad copy in these screenshots:
> 1. Headline patterns (length, style, hooks)
> 2. Body copy approaches (features vs benefits)
> 3. CTA button text variations
> 4. Use of emojis, capitalization, punctuation"

### Competitive Positioning

> "Based on these ads, analyze the competitor's positioning:
> 1. What customer pain points do they address?
> 2. What's their unique value proposition?
> 3. How do they differentiate from alternatives?
> 4. What audience segments are they targeting?"

---

## Tracking Competitor Ad Longevity

High-performing ads typically run for extended periods. When researching:

1. Note `ad_delivery_start_time` for each ad
2. Calculate days running: `today - start_date`
3. Ads running 30+ days are likely performing well
4. Look for patterns in long-running creative

---

## Competitive Research Best Practices

### Regular Monitoring
- Check competitor ads weekly
- Track new creative launches
- Note seasonal campaign changes

### Documentation
- Save screenshots to Air for reference
- Tag by competitor, format, theme
- Build a swipe file of high-performers

### Analysis Framework
1. **What** - Describe the ad creative
2. **Who** - Identify target audience
3. **Why** - Infer the objective
4. **How** - Note the execution approach
5. **Learn** - Extract applicable insights

### Applying Insights
- Don't copy directly (differentiate!)
- Adapt successful patterns to your brand
- Test hypotheses from competitor analysis
- Track if inspired ads outperform baseline
