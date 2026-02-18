---
name: instagram
description: Instagram integration including Graph API (posting, insights, comments) and instaloader (UGC downloads, user research). Activate when the user asks about Instagram organic content, insights, engagement, or UGC. Not for paid Instagram/Facebook advertising or cross-platform analytics.
---

# Instagram API Integration

## Purpose

This skill enables comprehensive Instagram management through multiple data sources:

1. **Instagram Graph API** - Official API for posting, insights, comments, account management
2. **Instaloader** - Python library for downloading UGC (tagged posts, user research)
3. **PostgreSQL** - Historical data from synced tables

**Use this skill for INSTAGRAM data, content management, and engagement.**

## When to Use

Activate this skill when the user:
- Mentions "Instagram", "IG", or your brand's Instagram handle
- Asks about Instagram posts, reels, stories, or insights
- Wants to post content to Instagram feed or stories
- Asks about comments, likes, or engagement
- Wants to download UGC (posts we're tagged in)
- Asks about follower data or user research
- Wants to analyze Instagram performance
- Asks about tagged posts or mentions
- Wants to respond to comments or DMs

## When NOT to Use

- **Pinterest**: Use pinterest skill for Pinterest content
- **Shopify product images**: Use shopify skill for product media
- **Historical Instagram data analysis**: Use postgresql skill with Instagram tables for complex joins
- **General social media questions**: This skill is specific to Instagram

## Data Source Selection

| Use Case | Data Source | Reason |
|----------|-------------|--------|
| Historical post performance | PostgreSQL | Data synced daily |
| Follower trends over time | PostgreSQL | instagram_profile table |
| Real-time post insights | Graph API | Fresh data needed |
| Download our posts | Graph API | Official API with media_url |
| Download tagged posts | Instaloader | Profile.get_tagged_posts() |
| Post to feed/story | Graph API | Official publishing API |
| Reply to comments | Graph API | Official API |
| Reply to DMs | Graph API | Private replies endpoint |
| Follower list with details | Instaloader | Graph API requires special permissions |
| Research public users | Instaloader | Profile info, posts, stories |
| Download hashtag posts | Instaloader | Hashtag.get_posts() |

## Setup

1. Go to the [Meta Developer Portal](https://developers.facebook.com)
2. Create an app with Instagram Graph API access
3. Generate a long-lived access token
4. Save to `.env`:
   - `INSTAGRAM_ACCESS_TOKEN=your-token`

## Available Operations

### Graph API Client (instagram-client.ts)

#### 1. Authentication

##### Test Authentication
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts test-auth
```

#### 2. Account & Profile

##### Get Profile
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-profile
```

Returns: id, username, name, biography, website, followers_count, follows_count, media_count, profile_picture_url

##### Get Account Insights
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-account-insights --period day --metrics reach,impressions,accounts_engaged
```

Parameters:
- `--period`: day, week, days_28 (default: day)
- `--metrics`: comma-separated list (reach, impressions, accounts_engaged, total_interactions, profile_views)

#### 3. Media

##### List Media
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts list-media [--limit N]
```

Returns: Array of media objects with id, caption, media_type, media_url, permalink, timestamp, like_count, comments_count

##### Get Media Details
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-media <media-id>
```

##### Get Media Insights
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-media-insights <media-id>
```

Returns: impressions, reach, engagement, saved, video_views (for videos)

##### Download Media
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/instagram/scripts/instagram-client.ts download-media <media-id> <output-path>
```

##### List Tagged Media
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts list-tagged-media [--limit N]
```

Returns: Media where the account is tagged (via Graph API)

#### 4. Comments

##### List Comments
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts list-comments <media-id> [--limit N]
```

##### Get Comment
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-comment <comment-id>
```

##### Reply to Comment
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts reply-to-comment <comment-id> '<message>'
```

##### Delete Comment
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts delete-comment <comment-id>
```

##### Hide Comment
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts hide-comment <comment-id>
```

#### 5. Publishing

##### Create Media Container (Image)
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-container --media-type IMAGE --media-url 'https://...' --caption 'Your caption here'
```

##### Create Media Container (Video/Reel)
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-container --media-type REELS --media-url 'https://...' --caption 'Your caption' --share-to-feed true
```

Parameters:
- `--media-type`: IMAGE, VIDEO, CAROUSEL_ALBUM, REELS
- `--media-url`: Public URL of media (must be accessible by Instagram servers)
- `--caption`: Post caption (optional)
- `--share-to-feed`: For reels, whether to also show in feed (default: true)
- `--cover-url`: Cover image URL for videos (optional)
- `--thumb-offset`: Thumbnail offset in ms for videos (optional)

##### Create Carousel Container
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-carousel-item --media-type IMAGE --media-url 'https://...'
# Repeat for each item, then:
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-container --media-type CAROUSEL_ALBUM --children 'id1,id2,id3' --caption 'Caption'
```

##### Publish Container
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts publish-container <container-id>
```

Note: Container must be in FINISHED status. Use `get-container-status` to check.

##### Get Container Status
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-container-status <container-id>
```

Returns: id, status (IN_PROGRESS, FINISHED, ERROR), status_code

##### Create Story
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-story --media-url 'https://...'
```

#### 6. Private Replies (DMs)

##### Send Private Reply
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts send-private-reply <comment-id> '<message>'
```

Sends a DM to the user who made a comment. Only works once per comment.

#### 7. Stories

##### List Stories
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts list-stories
```

##### Get Story Insights
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-story-insights <story-id>
```

Returns: impressions, reach, replies, exits, taps_forward, taps_back

### Instaloader Client (instaloader-client.py)

#### 1. Authentication

##### Login
```bash
python .claude/skills/instagram/scripts/instaloader-client.py login
```

Creates session file in ~/.config/instaloader/

##### Test Authentication
```bash
python .claude/skills/instagram/scripts/instaloader-client.py test-auth
```

#### 2. UGC Downloads

##### Download Tagged Posts
```bash
# Download new tagged posts (incremental, uses --latest-stamps)
python .claude/skills/instagram/scripts/instaloader-client.py download-tagged --fast-update

# Download to custom directory
python .claude/skills/instagram/scripts/instaloader-client.py download-tagged --output-dir ./assets/tagged --limit 10
```

Downloads posts where your account is tagged.

**Default settings:**
- Output: `~/Air/Instagram`
- Directory pattern: `{profile}` (organizes by poster username)
- Filename pattern: `{shortcode}`
- Uses `--latest-stamps` when `--fast-update` is specified (skips already downloaded posts)

##### Download Hashtag Posts
```bash
python .claude/skills/instagram/scripts/instaloader-client.py download-hashtag yourbrand --output-dir ./assets/hashtag [--limit 20]
```

##### Download Specific Post
```bash
python .claude/skills/instagram/scripts/instaloader-client.py download-post <shortcode> --output-dir ./assets/posts
```

Shortcode is the part after /p/ in the URL (e.g., CvN1rBjvVOn from instagram.com/p/CvN1rBjvVOn/)

##### Download Profile Media
```bash
python .claude/skills/instagram/scripts/instaloader-client.py download-profile <username> --output-dir ./assets/profiles [--limit 10]
```

#### 3. User Research

##### Get Profile Info
```bash
python .claude/skills/instagram/scripts/instaloader-client.py get-profile <username>
```

Returns: username, full_name, biography, followers, followees, mediacount, is_verified, is_private, is_business_account, profile_pic_url

##### Get Followers
```bash
python .claude/skills/instagram/scripts/instaloader-client.py get-followers [--limit 100]
```

Returns list of follower profiles with username, full_name, followers, is_verified

##### Get Following
```bash
python .claude/skills/instagram/scripts/instaloader-client.py get-following [--limit 100]
```

##### Get Post Info
```bash
python .claude/skills/instagram/scripts/instaloader-client.py get-post-info <shortcode>
```

Returns: shortcode, url, caption, likes, comments, date, owner, tagged_users, location, hashtags

##### Get Comments on Post
```bash
python .claude/skills/instagram/scripts/instaloader-client.py get-comments <shortcode> [--limit 50]
```

#### 4. Stories & Highlights

##### Download Stories
```bash
python .claude/skills/instagram/scripts/instaloader-client.py download-stories <username> --output-dir ./assets/stories
```

Downloads active stories (disappear after 24 hours).

##### Download Highlights
```bash
python .claude/skills/instagram/scripts/instaloader-client.py download-highlights <username> --output-dir ./assets/highlights
```

## Natural Language Translation

### Step 1: Identify the Operation Type

| User Says | Operation Type |
|-----------|---------------|
| "show", "list", "get", "fetch", "find" | Read data |
| "post", "publish", "share", "upload" | Publishing |
| "reply", "respond", "comment" | Engagement |
| "download", "save", "get media" | Download |
| "analyze", "insights", "performance" | Analytics |
| "who tagged us", "UGC", "tagged posts" | Instaloader |
| "followers", "following", "research" | User research |

### Step 2: Choose Data Source

| Context | Data Source |
|---------|-------------|
| "this week", "today", "recent" (analytics) | Graph API |
| "last month", "trends", "over time" | PostgreSQL |
| "download tagged posts", "UGC" | Instaloader |
| "post to feed", "publish", "story" | Graph API |
| "follower list", "who follows us" | Instaloader |
| "competitor", "other account" | Instaloader |

### Step 3: Extract Parameters

- **Media IDs**: From previous queries or permalinks
- **Shortcodes**: Extract from URLs (after /p/ or /reel/)
- **Usernames**: Remove @ prefix if present
- **Dates**: Convert to API format
- **Limits**: Default to reasonable values (10-50)

## Publishing Workflow

### 1. Prepare Media

Media must be hosted at a publicly accessible URL. Instagram servers will fetch the media.

Supported formats:
- Images: JPEG (recommended), PNG
- Videos: MP4, MOV (H.264 codec recommended)
- Max video length: 90 seconds for Reels, 60 seconds for feed videos

### 2. Create Container

```bash
# For image
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-container --media-type IMAGE --media-url 'https://...' --caption 'Caption'

# For reel
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts create-container --media-type REELS --media-url 'https://...' --caption 'Caption'
```

### 3. Check Status (for videos)

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts get-container-status <container-id>
```

Wait for status: FINISHED before publishing.

### 4. Publish

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/instagram/scripts/instagram-client.ts publish-container <container-id>
```

## PostgreSQL Integration

For historical data, use the postgresql skill with these tables:

- `instagram_media` - Our posts (id, data jsonb with caption, media_url, permalink, timestamp, like_count, media_type)
- `instagram_tags` - Posts we're tagged in (id, data jsonb with caption, username, permalink, timestamp)
- `instagram_stories` - Our stories (id, data jsonb with media_url, permalink, timestamp)
- `instagram_profile` - Profile metrics over time (date, data jsonb with followers_count, follows_count, media_count)
- `instagram_insights` - Daily insights (date, data jsonb with reach, impressions, likes, comments, saves, shares)

Example query for top-performing posts:
```sql
SELECT
  data->>'permalink' as url,
  data->>'caption' as caption,
  (data->>'like_count')::int as likes,
  data->>'timestamp' as posted_at
FROM instagram_media
ORDER BY (data->>'like_count')::int DESC
LIMIT 10;
```

## Rate Limits

### Graph API
- 200 calls per user per hour (standard)
- Publishing: 25 posts per 24 hours
- Insights: Cached for 1-2 hours

### Instaloader
- No official limits (private API)
- Use `--request-timeout` for delays
- Recommended: 1-2 second delays between requests
- Risk of temporary blocks with aggressive use

## Security Notes

### Graph API
- Never expose FACEBOOK_ACCESS_TOKEN or INSTAGRAM_ACCESS_TOKEN
- Tokens expire; use long-lived tokens (60 days)
- Refresh tokens before expiry

### Instaloader
- Uses separate account (leonide02) to protect main business account
- Session files stored in ~/.config/instaloader/
- Risk of account suspension with aggressive use
- Against Instagram TOS but commonly used for legitimate purposes
- Use `--request-timeout` flag to add delays

## Troubleshooting

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Token expired - generate new; check permissions |
| 400 Bad Request | Check media URL accessibility; verify params; wait for container FINISHED |
| 429 Rate Limited | Wait and retry; reduce request frequency |
| Instaloader login failed | Check credentials; use app password for 2FA |
| Profile not found | Account is private or deleted |
| Session expired | Re-run `login` command |

