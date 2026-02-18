---
name: instagram
description: Instagram integration for posting, insights, comments, UGC downloads, and user research. Activate when the user asks about Instagram organic content, insights, engagement, or UGC. Not for paid Instagram/Facebook advertising or cross-platform analytics.
---

# Instagram API Integration

## Purpose

This skill enables comprehensive Instagram management through `~~social-media` tools providing multiple data sources:

1. **Instagram Graph API** - Official API for posting, insights, comments, account management
2. **UGC tools** - Download tagged posts, user research, hashtag exploration
3. **PostgreSQL** - Historical data from synced tables (use postgresql skill)

**Use this skill for INSTAGRAM data, content management, and engagement.**

Authentication is handled by the MCP server configuration.

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

- **Paid Instagram ads**: Use meta-ads skill for Instagram/Facebook advertising
- **Pinterest**: Use pinterest skill for Pinterest content
- **Shopify product images**: Use shopify skill for product media
- **Historical Instagram data analysis**: Use postgresql skill with Instagram tables for complex joins

## Data Source Selection

| Use Case | Data Source | Reason |
|----------|-------------|--------|
| Historical post performance | PostgreSQL | Data synced daily |
| Follower trends over time | PostgreSQL | instagram_profile table |
| Real-time post insights | Graph API | Fresh data needed |
| Download our posts | Graph API | Official API with media_url |
| Download tagged posts | UGC tools | Profile.get_tagged_posts() |
| Post to feed/story | Graph API | Official publishing API |
| Reply to comments | Graph API | Official API |
| Reply to DMs | Graph API | Private replies endpoint |
| Research public users | UGC tools | Profile info, posts, stories |
| Download hashtag posts | UGC tools | Hashtag.get_posts() |

## Available Tools

The `~~social-media` MCP server provides tools for:

### Graph API Operations
- **Profile** - Get profile info, account insights
- **Media** - List media, get details, get insights, download media, list tagged media
- **Comments** - List, get, reply to, delete, hide comments
- **Publishing** - Create containers (image, video, reel, carousel), check status, publish, create stories
- **Private replies** - Send DMs in response to comments
- **Stories** - List stories, get story insights

### UGC & Research Operations
- **Downloads** - Download tagged posts, hashtag posts, specific posts, profile media
- **User research** - Get profile info, followers, following, post info, comments
- **Stories & Highlights** - Download active stories and highlights

## Natural Language Translation

### Step 1: Identify the Operation Type

| User Says | Operation Type |
|-----------|---------------|
| "show", "list", "get", "fetch", "find" | Read data |
| "post", "publish", "share", "upload" | Publishing |
| "reply", "respond", "comment" | Engagement |
| "download", "save", "get media" | Download |
| "analyze", "insights", "performance" | Analytics |
| "who tagged us", "UGC", "tagged posts" | UGC tools |
| "followers", "following", "research" | User research |

### Step 2: Choose Data Source

| Context | Data Source |
|---------|-------------|
| "this week", "today", "recent" (analytics) | Graph API |
| "last month", "trends", "over time" | PostgreSQL |
| "download tagged posts", "UGC" | UGC tools |
| "post to feed", "publish", "story" | Graph API |
| "follower list", "who follows us" | UGC tools |
| "competitor", "other account" | UGC tools |

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

Use `~~social-media` tools to create a media container specifying:
- Media type (IMAGE, VIDEO, REELS, CAROUSEL_ALBUM)
- Media URL (publicly accessible)
- Caption (optional)
- Additional options (share-to-feed for reels, cover image for videos)

### 3. Check Status (for videos)

Videos require processing time. Check container status and wait for FINISHED before publishing.

### 4. Publish

Use publish tools once container is in FINISHED status.

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

### UGC Tools
- No official limits (private API)
- Recommended: 1-2 second delays between requests
- Risk of temporary blocks with aggressive use

## Security Notes

### Graph API
- Never expose access tokens
- Tokens expire; use long-lived tokens (60 days)
- Refresh tokens before expiry

### UGC Tools
- Uses separate account to protect main business account
- Risk of account suspension with aggressive use
- Use delays between requests

## Troubleshooting

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Token expired - check MCP configuration; verify permissions |
| 400 Bad Request | Check media URL accessibility; verify params; wait for container FINISHED |
| 429 Rate Limited | Wait and retry; reduce request frequency |
| UGC login failed | Check MCP server credentials |
| Profile not found | Account is private or deleted |
| Session expired | Re-authenticate via MCP server |
