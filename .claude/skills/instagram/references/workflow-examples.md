# Instagram Workflow Examples

Common workflows showing how to translate natural language requests into API calls.

---

## Example 1: Analyze Recent Post Performance

**User:** "How did our last 5 posts perform?"

**Process:**
1. Identify: Performance analysis = insights data
2. Choose source: "Recent" = Graph API for fresh data
3. Get media list, then get insights for each

**Execution:**
```bash
# Step 1: List recent media
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts list-media --limit 5

# Step 2: For each media ID, get insights
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-media-insights <media-id-1>
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-media-insights <media-id-2>
# ... etc
```

**Alternative (PostgreSQL for historical):**
```sql
SELECT
  data->>'permalink' as url,
  data->>'caption' as caption,
  (data->>'like_count')::int as likes,
  data->>'timestamp' as posted_at
FROM instagram_media
ORDER BY data->>'timestamp' DESC
LIMIT 5;
```

---

## Example 2: Download UGC (Tagged Posts)

**User:** "Download the last 10 posts we're tagged in"

**Process:**
1. Identify: Download UGC = Instaloader
2. Tagged posts = Profile.get_tagged_posts()
3. Execute download command

**Execution:**
```bash
# Download new tagged posts (uses --latest-stamps to skip already downloaded)
python .claude/skills/instagram/scripts/instaloader-client.py download-tagged --fast-update

# Or with custom output and limit
python .claude/skills/instagram/scripts/instaloader-client.py download-tagged --output-dir ./assets/tagged --limit 10
```

**Output:** Posts saved to `~/Air/YourBrand/Instagram/{profile}/{shortcode}.*`

**Default settings:**
- Output: `~/Air/YourBrand/Instagram`
- Organizes by poster profile name
- Files named by Instagram shortcode
- Uses `--latest-stamps` when `--fast-update` is used

---

## Example 3: Respond to Comments

**User:** "Reply to the comments on our latest post"

**Process:**
1. Get latest post ID
2. List comments on that post
3. Reply to each comment

**Execution:**
```bash
# Step 1: Get latest media
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts list-media --limit 1

# Step 2: List comments (use media ID from step 1)
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts list-comments 17995222012505411

# Step 3: Reply to specific comment
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts reply-to-comment 17864532198765432 'Thanks for the love!'
```

---

## Example 4: Post to Feed

**User:** "Post this image to our feed with caption 'Summer vibes'"

**Process:**
1. Media must be at a public URL (upload to Air or S3 first)
2. Create media container
3. Publish container

**Execution:**
```bash
# Step 1: Create container
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-container \
  --media-type IMAGE \
  --media-url 'https://your-cdn.com/image.jpg' \
  --caption 'Summer vibes'

# Step 2: Publish (use container ID from step 1)
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts publish-container 17864532198765432
```

---

## Example 5: Post a Reel

**User:** "Post this video as a reel"

**Process:**
1. Video must be at a public URL
2. Create REELS container
3. Wait for processing
4. Publish

**Execution:**
```bash
# Step 1: Create container
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-container \
  --media-type REELS \
  --media-url 'https://your-cdn.com/video.mp4' \
  --caption 'Check this out!' \
  --share-to-feed true

# Step 2: Check status (videos need processing)
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-container-status 17864532198765432

# Step 3: When status is FINISHED, publish
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts publish-container 17864532198765432
```

---

## Example 6: Follower Trends Over Time

**User:** "Show me our follower growth this month"

**Process:**
1. Identify: Historical trends = PostgreSQL
2. Query instagram_profile table

**Execution (PostgreSQL):**
```sql
SELECT
  date,
  (data->>'followers_count')::int as followers,
  (data->>'followers_count')::int - LAG((data->>'followers_count')::int) OVER (ORDER BY date) as daily_change
FROM instagram_profile
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date;
```

---

## Example 7: Research a User

**User:** "Tell me about @competitor_brand"

**Process:**
1. Identify: Research other user = Instaloader
2. Get profile info

**Execution:**
```bash
python .claude/skills/instagram/scripts/instaloader-client.py get-profile competitor_brand
```

**Output:**
```json
{
  "success": true,
  "profile": {
    "username": "competitor_brand",
    "full_name": "Competitor Brand",
    "biography": "Their bio...",
    "followers": 50000,
    "followees": 500,
    "is_verified": true
  }
}
```

---

## Example 8: Download Competitor Content

**User:** "Download the last 5 posts from @competitor_brand"

**Process:**
1. Use Instaloader to download profile media

**Execution:**
```bash
python .claude/skills/instagram/scripts/instaloader-client.py download-profile competitor_brand --output-dir ./assets/competitor --limit 5
```

---

## Example 9: Post a Carousel

**User:** "Post these 3 images as a carousel"

**Process:**
1. Create carousel items for each image
2. Create carousel container with children
3. Publish

**Execution:**
```bash
# Step 1: Create individual items
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-carousel-item --media-type IMAGE --media-url 'https://cdn.com/img1.jpg'
# Returns: {"itemId": "17864532198765431"}

deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-carousel-item --media-type IMAGE --media-url 'https://cdn.com/img2.jpg'
# Returns: {"itemId": "17864532198765432"}

deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-carousel-item --media-type IMAGE --media-url 'https://cdn.com/img3.jpg'
# Returns: {"itemId": "17864532198765433"}

# Step 2: Create carousel container
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-container \
  --media-type CAROUSEL_ALBUM \
  --children '17864532198765431,17864532198765432,17864532198765433' \
  --caption 'Check out our new collection!'

# Step 3: Publish
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts publish-container <container-id>
```

---

## Example 10: Post to Story

**User:** "Share this image to our story"

**Process:**
1. Create and publish story in one step

**Execution:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-story --media-url 'https://cdn.com/story.jpg'
```

---

## Example 11: Get Account Insights

**User:** "What's our reach been like this week?"

**Process:**
1. Use Graph API for account-level insights

**Execution:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-account-insights --period week --metrics reach,impressions,accounts_engaged
```

---

## Example 12: Find Top Performing Posts

**User:** "What were our best performing posts this year?"

**Process:**
1. Use PostgreSQL for historical analysis

**Execution:**
```sql
SELECT
  data->>'permalink' as url,
  SUBSTRING(data->>'caption', 1, 100) as caption_preview,
  (data->>'like_count')::int as likes,
  data->>'media_type' as type,
  data->>'timestamp' as posted_at
FROM instagram_media
WHERE data->>'timestamp' >= '2025-01-01'
ORDER BY (data->>'like_count')::int DESC
LIMIT 10;
```

---

## Example 13: Send Private Reply (DM)

**User:** "Send a DM to the person who commented asking about sizing"

**Process:**
1. Get comment ID from comment list
2. Send private reply

**Execution:**
```bash
# Private reply sends a DM to the commenter
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts send-private-reply 17864532198765432 'Hi! Check out our size guide at example.com/sizing'
```

---

## Example 14: Analyze Comments on a Post

**User:** "What are people saying about our latest post?"

**Process:**
1. Get post shortcode from URL
2. Use Instaloader to get detailed comments

**Execution:**
```bash
# Get comments with metadata
python .claude/skills/instagram/scripts/instaloader-client.py get-comments CvN1rBjvVOn --limit 30
```

---

## Example 15: Download Stories from a User

**User:** "Save the stories from @influencer before they expire"

**Process:**
1. Use Instaloader to download active stories

**Execution:**
```bash
python .claude/skills/instagram/scripts/instaloader-client.py download-stories influencer --output-dir ./assets/stories
```

---

## Example 16: Get Our Follower List

**User:** "Who are our most engaged followers?"

**Process:**
1. Use Instaloader to get follower details
2. Sort by their engagement metrics

**Execution:**
```bash
python .claude/skills/instagram/scripts/instaloader-client.py get-followers --limit 200
```

Then analyze the results to find followers with high engagement.

---

## Example 17: Analyze Insights Trends

**User:** "How has our engagement changed over the last 30 days?"

**Process:**
1. Use PostgreSQL instagram_insights table

**Execution:**
```sql
SELECT
  date,
  (data->>'reach')::int as reach,
  (data->>'impressions')::int as impressions,
  (data->>'total_interactions')::int as interactions,
  ROUND((data->>'total_interactions')::numeric / NULLIF((data->>'reach')::numeric, 0) * 100, 2) as engagement_rate
FROM instagram_insights
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date;
```

---

## Data Source Quick Reference

| Question Type | Data Source | Why |
|---------------|-------------|-----|
| "How did X post perform?" | Graph API | Real-time insights |
| "Show trends over time" | PostgreSQL | Historical data |
| "Download tagged posts" | Instaloader | UGC access |
| "Post to feed/story" | Graph API | Official publishing |
| "Research @username" | Instaloader | Other users' data |
| "Reply to comment" | Graph API | Official engagement |
| "Get follower list" | Instaloader | Detailed follower data |
| "Best posts this year" | PostgreSQL | Historical analysis |
