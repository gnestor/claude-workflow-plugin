---
name: instagram
description: Instagram integration for posting, insights, comments, UGC downloads, and user research. Activate when the user asks about Instagram organic content, insights, engagement, or UGC. Not for paid Instagram/Facebook advertising or cross-platform analytics.
category: ~~social-media
service: Instagram
---

# Instagram

## Purpose

This skill enables comprehensive Instagram management through the client script, providing multiple data sources:

1. **Instagram Graph API** - Official API for posting, insights, comments, account management
2. **UGC tools** - Download tagged posts, user research, hashtag exploration
3. **PostgreSQL** - Historical data from synced tables (use postgresql skill)

**Use this skill for INSTAGRAM data, content management, and engagement.**

Authentication is handled automatically by lib/auth.js.

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

## Client Script

**Path:** `skills/instagram/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Verify authentication and API access |
| `get-profile` | Get profile info and metadata |
| `get-account-insights` | Get account-level insights and metrics |
| `list-media` | List media posts with optional filters |
| `get-media` | Get details for a specific media post |
| `get-media-insights` | Get performance insights for a specific post |
| `list-stories` | List active stories |
| `get-story-insights` | Get insights for a specific story |
| `list-comments` | List comments on a media post |
| `get-comment` | Get details for a specific comment |
| `reply-to-comment` | Reply to a comment |
| `delete-comment` | Delete a comment |
| `hide-comment` | Hide a comment from public view |
| `send-private-reply` | Send a DM in response to a comment |
| `list-tagged-media` | List posts the account is tagged in |
| `create-container` | Create a media container (image, video, reel, carousel) |
| `create-carousel-item` | Create a carousel item for a multi-image post |
| `create-story` | Create a story container |
| `get-container-status` | Check processing status of a media container |
| `publish-container` | Publish a finished container to the feed |

## Key API Concepts

- **Base URL:** `graph.instagram.com` (Graph API)
- **Publishing:** Container-based workflow (create container, check status, publish)
- **Rate limits:** 200 calls/hour (Graph API), 25 posts/24 hours
- **Insights caching:** Data cached for 1-2 hours by Instagram
- **Media URLs:** Must be publicly accessible for publishing

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

## Publishing Workflow

### 1. Prepare Media

Media must be hosted at a publicly accessible URL. Instagram servers will fetch the media.

Supported formats:
- Images: JPEG (recommended), PNG
- Videos: MP4, MOV (H.264 codec recommended)
- Max video length: 90 seconds for Reels, 60 seconds for feed videos

### 2. Create Container

Use `create-container` specifying:
- Media type (IMAGE, VIDEO, REELS, CAROUSEL_ALBUM)
- Media URL (publicly accessible)
- Caption (optional)
- Additional options (share-to-feed for reels, cover image for videos)

### 3. Check Status (for videos)

Videos require processing time. Use `get-container-status` and wait for FINISHED before publishing.

### 4. Publish

Use `publish-container` once container is in FINISHED status.

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

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('instagram', '/me/media');
```

## Reference Files
- [examples.md](references/examples.md) — Usage patterns and queries
- [documentation.md](references/documentation.md) — Full API documentation
