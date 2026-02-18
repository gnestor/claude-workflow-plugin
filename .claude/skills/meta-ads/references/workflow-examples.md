# Meta Ads Workflow Examples

## Example 1: Check Campaign Performance

**User says:** "How are my Meta ad campaigns performing?"

**Steps:**

1. List campaigns with insights
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts list-campaigns
```

2. Get insights for account
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts insights act_XXXXX --level campaign --date-preset last_30d
```

3. Format results showing: campaign name, spend, impressions, clicks, CTR, conversions, ROAS

---

## Example 2: Drill Down from Campaign to Ad

**User says:** "Show me the performance breakdown for Campaign X"

**Steps:**

1. Get campaign details
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts get-campaign CAMPAIGN_ID
```

2. List ad sets in campaign
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts list-adsets --campaign-id CAMPAIGN_ID
```

3. Get insights at ad set level
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts insights CAMPAIGN_ID --level adset --date-preset last_7d
```

4. For detailed ad performance
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts insights CAMPAIGN_ID --level ad --date-preset last_7d
```

---

## Example 3: Get Demographics Breakdown

**User says:** "What demographics are my ads reaching?"

**Steps:**

1. Get insights with age and gender breakdown
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts insights act_XXXXX --level campaign --date-preset last_30d --breakdowns age,gender
```

2. Format as table showing performance by age group and gender

---

## Example 4: Update Ad Set Budget

**User says:** "Increase the budget for Ad Set X to $100/day"

**Steps:**

1. Get current ad set details
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts get-adset ADSET_ID
```

2. Display current budget vs proposed:
```
Current daily budget: $50.00
Proposed daily budget: $100.00

Confirm this change? [yes/no]
```

3. After confirmation, update budget (amount in cents)
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts update-adset-budget ADSET_ID 10000
```

---

## Example 5: Pause Underperforming Ads

**User says:** "Pause ads with CTR below 1%"

**Steps:**

1. Get insights at ad level
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts insights act_XXXXX --level ad --date-preset last_7d
```

2. Identify ads with CTR < 1%

3. List affected ads for confirmation:
```
Found 3 ads with CTR < 1%:
- Ad A (CTR: 0.5%, Spend: $120)
- Ad B (CTR: 0.7%, Spend: $85)
- Ad C (CTR: 0.9%, Spend: $45)

Pause these ads? [yes/no]
```

4. After confirmation, pause each ad
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts update-ad-status AD_ID PAUSED
```

---

## Example 6: Create New Ad for Existing Ad Set

**User says:** "Create a new ad in Ad Set X using the image I uploaded"

**Steps:**

1. Upload image (if not already uploaded)
```bash
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts upload-image /path/to/image.jpg
```

2. Create ad creative
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts create-creative '{
    "name": "New Creative Name",
    "object_story_spec": {
      "page_id": "PAGE_ID",
      "link_data": {
        "image_hash": "IMAGE_HASH_FROM_UPLOAD",
        "link": "https://example.com",
        "message": "Your ad copy here",
        "call_to_action": {
          "type": "SHOP_NOW"
        }
      }
    }
  }'
```

3. Create ad linking creative to ad set
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts create-ad '{
    "name": "New Ad Name",
    "adset_id": "ADSET_ID",
    "creative": {"creative_id": "CREATIVE_ID"},
    "status": "PAUSED"
  }'
```

4. After verification, activate the ad
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts update-ad-status AD_ID ACTIVE
```

---

## Example 7: Create Draft Ad from Notion Brief

**User says:** "Create an ad from the brief in Notion"

**Steps:**

1. Query Notion Ad Creative database for ready briefs
```bash
deno run --allow-net --allow-env \
  .claude/skills/notion/scripts/notion-client.ts query-database 17f90722692f46d69adbbef212e30ddb
```

2. Extract from brief:
   - Product/collection
   - Target audience
   - Ad format (image, video, carousel)
   - Copy (headline, body, CTA)
   - Media URLs

3. If media needs upload, upload image
```bash
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts upload-image /path/to/image.jpg
```

4. Create creative with brief content
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts create-creative '<json from brief>'
```

5. Create ad in specified ad set (paused for review)
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts create-ad '{
    "name": "[Brief Name] - Draft",
    "adset_id": "TARGET_ADSET_ID",
    "creative": {"creative_id": "CREATIVE_ID"},
    "status": "PAUSED"
  }'
```

6. Update Notion brief with ad ID and status
```bash
deno run --allow-net --allow-env \
  .claude/skills/notion/scripts/notion-client.ts update-page BRIEF_PAGE_ID "Status: Draft Created\nMeta Ad ID: AD_ID"
```

---

## Example 8: List Custom Audiences

**User says:** "What audiences do we have set up?"

**Steps:**

1. List all custom audiences
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts list-audiences
```

2. Format as table showing: name, type, approximate size, status

---

## Example 9: Check Platform Performance

**User says:** "How are we performing on Instagram vs Facebook?"

**Steps:**

1. Get insights with publisher_platform breakdown
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts insights act_XXXXX --level campaign --date-preset last_30d --breakdowns publisher_platform
```

2. Summarize: Facebook vs Instagram metrics (spend, impressions, CTR, conversions)

---

## Example 10: Daily Performance Check

**User says:** "How did our ads perform yesterday?"

**Steps:**

1. Get insights for yesterday
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts insights act_XXXXX --level campaign --date-preset yesterday
```

2. Compare to previous day or week average

3. Highlight any significant changes (>20% variance)

---

## Example 11: Extract Landing Page URLs from Creatives

**User says:** "Get all the unique landing page URLs from our ad creatives"

**Context:**
Landing page URLs can be stored in multiple nested locations within the creative's `object_story_spec`. The API doesn't provide a single `landing_page_url` field - you need to check multiple paths.

**Steps:**

1. List all creatives with full data
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/meta-ads/scripts/meta-ads-client.ts list-creatives --limit 1000
```

2. Extract URLs by checking all possible paths in creative JSON:

```typescript
// Pseudocode for URL extraction
const urls = new Set<string>()

for (const creative of creatives) {
  let url: string | null = null

  // Check path 1: Direct link_url property (less common)
  if (creative.link_url) {
    url = creative.link_url
  }

  // Check path 2: Link data (common for link/image ads)
  else if (creative.object_story_spec?.link_data?.link) {
    url = creative.object_story_spec.link_data.link
  }

  // Check path 3: Video data call-to-action (common for video ads)
  else if (creative.object_story_spec?.video_data?.call_to_action?.value?.link) {
    url = creative.object_story_spec.video_data.call_to_action.value.link
  }

  // Check path 4: Template data (less common)
  else if (creative.object_story_spec?.template_data?.link) {
    url = creative.object_story_spec.template_data.link
  }

  if (url && url.trim()) {
    urls.add(url.trim())
  }
}

console.log(`Found ${urls.size} unique landing pages`)
```

**Key Learnings:**

- `object_story_spec` is the main container for ad creative data
- Link ads store URLs in `object_story_spec.link_data.link`
- Video ads store URLs in `object_story_spec.video_data.call_to_action.value.link`
- Always check multiple paths and deduplicate with a Set
- URLs may have trailing/leading whitespace - always trim
- Some creatives may not have landing pages (engagement ads, lead forms, etc.)

**Common URL Locations by Creative Type:**

| Creative Type | URL Path |
|---------------|----------|
| Image/Link Ad | `object_story_spec.link_data.link` |
| Video Ad | `object_story_spec.video_data.call_to_action.value.link` |
| Carousel Ad | `object_story_spec.link_data.child_attachments[*].link` (array) |
| Template Ad | `object_story_spec.template_data.link` |
| Legacy | `link_url` (top-level property) |

**Use Case:**
This is useful for:
- Capturing screenshots of all landing pages
- Auditing what pages are being advertised
- Checking for broken links
- Analyzing landing page performance across creatives
