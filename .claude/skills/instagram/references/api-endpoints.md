# Instagram Graph API Endpoints Reference

## Base URLs

- **Instagram Graph API**: `https://graph.instagram.com`
- **Facebook Graph API**: `https://graph.facebook.com/v21.0`

All requests require an access token as a query parameter: `?access_token=TOKEN`

---

## User Endpoints

### GET /me
Get the authenticated user's profile information.

**Fields:**
- `id` - Instagram User ID
- `username` - Instagram username
- `name` - Display name
- `biography` - Bio text
- `website` - Website URL
- `followers_count` - Number of followers
- `follows_count` - Number of accounts following
- `media_count` - Number of posts
- `profile_picture_url` - Profile picture URL
- `account_type` - BUSINESS, MEDIA_CREATOR, or PERSONAL

**Example:**
```
GET /me?fields=id,username,name,biography,followers_count,media_count
```

### GET /me/insights
Get account-level insights.

**Parameters:**
- `metric` - Comma-separated metrics
- `period` - day, week, days_28, month, lifetime

**Available Metrics:**
- `reach` - Unique accounts reached
- `impressions` - Total times content was viewed
- `accounts_engaged` - Unique accounts that engaged
- `total_interactions` - Total likes, comments, shares, saves
- `profile_views` - Profile visits (deprecated Jan 2025)

**Example:**
```
GET /me/insights?metric=reach,impressions,accounts_engaged&period=day
```

---

## Media Endpoints

### GET /me/media
List the user's media.

**Fields for each media:**
- `id` - Media ID
- `caption` - Caption text
- `media_type` - IMAGE, VIDEO, CAROUSEL_ALBUM, REELS
- `media_url` - URL of media (images) or video
- `permalink` - Public URL
- `timestamp` - ISO 8601 timestamp
- `like_count` - Number of likes
- `comments_count` - Number of comments
- `thumbnail_url` - Thumbnail for videos

**Parameters:**
- `limit` - Number of results (default 25, max 100)
- `after` - Pagination cursor

**Example:**
```
GET /me/media?fields=id,caption,media_type,permalink,like_count&limit=25
```

### GET /{media-id}
Get details for a specific media object.

**Additional Fields:**
- `children` - For carousels, list of child media
- `username` - Username of poster

**Example:**
```
GET /{media-id}?fields=id,caption,media_type,media_url,like_count,children{id,media_type,media_url}
```

### GET /{media-id}/insights
Get insights for a specific media object.

**Metrics by Media Type:**

**Images/Carousels:**
- `impressions` - Times seen
- `reach` - Unique accounts
- `engagement` - Likes + comments
- `saved` - Times saved

**Videos (non-Reels):**
- `impressions`
- `reach`
- `video_views` (deprecated Jan 2025)

**Reels:**
- `comments` - Comment count
- `likes` - Like count
- `reach` - Unique accounts
- `saved` - Save count
- `shares` - Share count
- `plays` - Video plays

**Example:**
```
GET /{media-id}/insights?metric=impressions,reach,engagement,saved
```

### GET /me/tags
Get media where the user is tagged.

**Fields:** Same as /me/media

**Example:**
```
GET /me/tags?fields=id,caption,media_type,permalink,username&limit=25
```

---

## Comment Endpoints

### GET /{media-id}/comments
List comments on a media object.

**Fields:**
- `id` - Comment ID
- `text` - Comment text
- `timestamp` - ISO 8601 timestamp
- `username` - Commenter's username
- `like_count` - Likes on comment
- `replies` - Nested replies (limited)

**Example:**
```
GET /{media-id}/comments?fields=id,text,timestamp,username,like_count&limit=50
```

### GET /{comment-id}
Get a specific comment.

**Example:**
```
GET /{comment-id}?fields=id,text,timestamp,username,like_count,replies{id,text,username}
```

### POST /{media-id}/comments
Post a new comment on media. Requires `instagram_basic` and `instagram_manage_comments` permissions.

**Parameters:**
- `message` - Comment text

**Example:**
```
POST /{media-id}/comments?message=Great%20post!
```

### POST /{comment-id}/replies
Reply to a comment.

**Parameters:**
- `message` - Reply text

**Example:**
```
POST /{comment-id}/replies?message=Thanks!
```

### DELETE /{comment-id}
Delete a comment (only your own comments).

**Example:**
```
DELETE /{comment-id}
```

### POST /{comment-id}?hide=true
Hide a comment from public view.

**Example:**
```
POST /{comment-id}?hide=true
```

---

## Publishing Endpoints

### POST /me/media
Create a media container for publishing.

**For Single Image:**
- `image_url` - Public URL of image (JPEG recommended)
- `caption` - Post caption (optional)
- `location_id` - Facebook Page location ID (optional)
- `user_tags` - Array of tagged users (optional)

**For Single Video:**
- `media_type` - Set to "VIDEO"
- `video_url` - Public URL of video
- `caption` - Post caption
- `thumb_offset` - Thumbnail offset in ms (optional)
- `cover_url` - Custom cover image URL (optional)

**For Reels:**
- `media_type` - Set to "REELS"
- `video_url` - Public URL of video
- `caption` - Post caption
- `share_to_feed` - true/false (default true)
- `cover_url` - Custom cover image URL (optional)
- `audio_name` - Original audio name (optional)

**For Carousel (Album):**
- `media_type` - Set to "CAROUSEL"
- `children` - Comma-separated container IDs
- `caption` - Post caption

**For Carousel Item:**
- `is_carousel_item` - Set to "true"
- `image_url` or `video_url` - Media URL

**For Story:**
- `media_type` - Set to "STORIES"
- `image_url` or `video_url` - Media URL

**Example (Image):**
```
POST /me/media?image_url=https://example.com/image.jpg&caption=Hello%20World
```

**Example (Reel):**
```
POST /me/media?media_type=REELS&video_url=https://example.com/video.mp4&caption=Check%20this%20out
```

### GET /{container-id}
Check container status before publishing.

**Fields:**
- `id` - Container ID
- `status` - IN_PROGRESS, FINISHED, ERROR
- `status_code` - Error code if failed

**Example:**
```
GET /{container-id}?fields=id,status,status_code
```

### POST /me/media_publish
Publish a container to feed.

**Parameters:**
- `creation_id` - Container ID from /me/media

**Example:**
```
POST /me/media_publish?creation_id={container-id}
```

---

## Story Endpoints

### GET /me/stories
List active stories (within 24 hours).

**Fields:**
- `id` - Story media ID
- `media_type` - IMAGE or VIDEO
- `media_url` - URL of media
- `timestamp` - Posted time
- `permalink` - Story URL

**Example:**
```
GET /me/stories?fields=id,media_type,media_url,timestamp,permalink
```

### GET /{story-id}/insights
Get insights for a story.

**Metrics:**
- `impressions` - Times viewed
- `reach` - Unique viewers
- `replies` - Direct message replies
- `taps_forward` - Taps to next story
- `taps_back` - Taps to previous story
- `exits` - Exits from story

**Example:**
```
GET /{story-id}/insights?metric=impressions,reach,replies,exits
```

---

## Private Reply Endpoint

### POST /{comment-id}/private_replies
Send a private DM reply to a commenter. Only works once per comment.

**Parameters:**
- `message` - DM message text

**Uses Facebook Graph API base URL.**

**Example:**
```
POST https://graph.facebook.com/v21.0/{comment-id}/private_replies?message=Thanks%20for%20your%20comment!
```

---

## Rate Limits

### Standard Limits
- **200 calls per user per hour** for most endpoints
- **4,800 calls per user per 24 hours**

### Publishing Limits
- **25 posts per 24 hours** (feed + stories combined)
- **500 comments per 24 hours**

### Insights Caching
- Account insights: Cached for 1-2 hours
- Media insights: Cached for up to 24 hours
- Real-time data may differ from API response

---

## Deprecated Metrics (January 2025)

The following metrics are deprecated starting with API v21:

- `video_views` (for non-Reels content)
- `email_contacts` (time series)
- `profile_views` (use `profile_impressions` instead)
- `website_clicks`
- `phone_call_clicks`

---

## Error Codes

| Code | Description |
|------|-------------|
| 1 | Unknown error |
| 2 | Service temporarily unavailable |
| 4 | Application request limit reached |
| 10 | Permissions error |
| 17 | User request limit reached |
| 100 | Invalid parameter |
| 190 | Invalid access token |
| 200 | Missing permissions |
| 368 | Temporarily blocked |

---

## Required Permissions

| Operation | Permissions Required |
|-----------|---------------------|
| Read profile | `instagram_basic` |
| Read media | `instagram_basic` |
| Read insights | `instagram_manage_insights` |
| Post content | `instagram_content_publish` |
| Manage comments | `instagram_manage_comments` |
| Private replies | `instagram_manage_comments`, `pages_messaging` |

---

## Media Requirements

### Images
- Format: JPEG (recommended), PNG
- Max file size: 8MB
- Aspect ratio: 4:5 to 1.91:1

### Videos (Feed)
- Format: MP4, MOV
- Codec: H.264 recommended
- Max duration: 60 seconds
- Max file size: 100MB
- Aspect ratio: 4:5 to 16:9

### Reels
- Format: MP4, MOV
- Max duration: 90 seconds (some accounts: 60 seconds)
- Max file size: 1GB
- Aspect ratio: 9:16 (vertical)

### Stories
- Images: Same as feed images
- Videos: Max 60 seconds
- Aspect ratio: 9:16 (vertical)
