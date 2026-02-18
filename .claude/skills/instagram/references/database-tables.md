# Instagram PostgreSQL Tables Reference

These tables are synced daily from the Instagram Graph API and contain historical data for analysis.

---

## instagram_media

Our Instagram posts (feed posts, reels, carousels).

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key (Instagram media ID) |
| `data` | jsonb | Post data |

### JSONB Fields (data column)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Instagram media ID |
| `caption` | string | Post caption text |
| `media_url` | string | URL of the media file |
| `permalink` | string | Public Instagram URL |
| `timestamp` | date/string | Posted timestamp (ISO 8601) |
| `like_count` | integer | Number of likes |
| `media_type` | string | IMAGE, VIDEO, CAROUSEL_ALBUM |
| `thumbnail_url` | string | Thumbnail URL (for videos) |

### Example Queries

```sql
-- Get all posts ordered by likes
SELECT
  data->>'permalink' as url,
  data->>'caption' as caption,
  (data->>'like_count')::int as likes,
  data->>'media_type' as type,
  data->>'timestamp' as posted_at
FROM instagram_media
ORDER BY (data->>'like_count')::int DESC;

-- Get posts from last 30 days
SELECT *
FROM instagram_media
WHERE (data->>'timestamp')::timestamp >= NOW() - INTERVAL '30 days';

-- Count posts by media type
SELECT
  data->>'media_type' as media_type,
  COUNT(*) as count
FROM instagram_media
GROUP BY data->>'media_type';

-- Search posts by caption
SELECT data->>'permalink', data->>'caption'
FROM instagram_media
WHERE data->>'caption' ILIKE '%summer%';
```

---

## instagram_tags

Posts where @yourbrand is tagged by other users.

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key (Instagram media ID) |
| `data` | jsonb | Tagged post data |

### JSONB Fields (data column)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Instagram media ID |
| `caption` | string | Post caption |
| `username` | string | Username who tagged us |
| `permalink` | string | Public Instagram URL |
| `timestamp` | date/string | Posted timestamp |
| `like_count` | integer | Number of likes |
| `media_type` | string | IMAGE, VIDEO, CAROUSEL_ALBUM |
| `media_url` | string | Media file URL |

### Example Queries

```sql
-- Get all users who tagged us
SELECT DISTINCT data->>'username' as username
FROM instagram_tags;

-- Get top tagged posts by engagement
SELECT
  data->>'username' as user,
  data->>'permalink' as url,
  (data->>'like_count')::int as likes,
  data->>'timestamp' as posted_at
FROM instagram_tags
ORDER BY (data->>'like_count')::int DESC
LIMIT 20;

-- Find UGC mentioning specific hashtags
SELECT *
FROM instagram_tags
WHERE data->>'caption' ILIKE '%your-brand%'
   OR data->>'caption' ILIKE '%shortshorts%';

-- Count tags by user
SELECT
  data->>'username' as username,
  COUNT(*) as tag_count
FROM instagram_tags
GROUP BY data->>'username'
ORDER BY tag_count DESC;
```

---

## instagram_stories

Our Instagram stories (historical, even after 24-hour expiration).

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key (Instagram story ID) |
| `data` | jsonb | Story data |

### JSONB Fields (data column)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Instagram story ID |
| `media_url` | string | URL of the story media |
| `permalink` | string | Story URL (may expire) |
| `timestamp` | date/string | Posted timestamp |
| `media_type` | string | IMAGE or VIDEO |
| `caption` | string | Story caption/text overlay |
| `thumbnail_url` | string | Thumbnail URL |
| `like_count` | integer | Story likes (usually 0) |

### Example Queries

```sql
-- Get all stories from last week
SELECT
  data->>'permalink' as url,
  data->>'caption' as caption,
  data->>'media_type' as type,
  data->>'timestamp' as posted_at
FROM instagram_stories
WHERE (data->>'timestamp')::timestamp >= NOW() - INTERVAL '7 days';

-- Count stories by type
SELECT
  data->>'media_type' as type,
  COUNT(*) as count
FROM instagram_stories
GROUP BY data->>'media_type';
```

---

## instagram_profile

Profile metrics over time (followers, following, media count).

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `date` | date | Date of snapshot |
| `data` | jsonb | Profile data |

### JSONB Fields (data column)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Instagram user ID |
| `name` | string | Display name |
| `username` | string | Username (yourbrand) |
| `website` | string | Website URL |
| `media_count` | integer | Number of posts |
| `follows_count` | integer | Accounts we follow |
| `followers_count` | integer | Our follower count |

### Example Queries

```sql
-- Get follower growth over time
SELECT
  date,
  (data->>'followers_count')::int as followers
FROM instagram_profile
ORDER BY date DESC
LIMIT 30;

-- Calculate daily follower change
SELECT
  date,
  (data->>'followers_count')::int as followers,
  (data->>'followers_count')::int - LAG((data->>'followers_count')::int) OVER (ORDER BY date) as daily_change
FROM instagram_profile
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date;

-- Get follower milestones
SELECT
  date,
  (data->>'followers_count')::int as followers
FROM instagram_profile
WHERE (data->>'followers_count')::int % 1000 < 50
ORDER BY date;

-- Compare current vs 30 days ago
WITH current_data AS (
  SELECT (data->>'followers_count')::int as followers
  FROM instagram_profile
  ORDER BY date DESC
  LIMIT 1
),
past_data AS (
  SELECT (data->>'followers_count')::int as followers
  FROM instagram_profile
  WHERE date <= CURRENT_DATE - INTERVAL '30 days'
  ORDER BY date DESC
  LIMIT 1
)
SELECT
  c.followers as current_followers,
  p.followers as followers_30d_ago,
  c.followers - p.followers as growth,
  ROUND(((c.followers - p.followers)::numeric / p.followers * 100), 2) as growth_percent
FROM current_data c, past_data p;
```

---

## instagram_insights

Daily account-level insights.

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `date` | date | Date of snapshot |
| `data` | jsonb | Insights data |

### JSONB Fields (data column)

| Field | Type | Description |
|-------|------|-------------|
| `likes` | integer | Total likes received |
| `reach` | integer | Unique accounts reached |
| `saves` | integer | Total saves |
| `shares` | integer | Total shares |
| `replies` | integer | Story/DM replies |
| `comments` | integer | Total comments |
| `impressions` | integer | Total content views |
| `website_clicks` | integer | Link clicks |
| `accounts_engaged` | integer | Unique engaged accounts |
| `profile_links_taps` | integer | Profile link taps |
| `total_interactions` | integer | All interactions combined |
| `profile_impressions` | integer | Profile views |
| `profile_views` | integer | Profile visits |
| `email_contacts` | integer | Email button clicks |
| `follower_count` | integer | Net follower change |

### Example Queries

```sql
-- Get daily engagement metrics
SELECT
  date,
  (data->>'reach')::int as reach,
  (data->>'impressions')::int as impressions,
  (data->>'total_interactions')::int as interactions,
  (data->>'likes')::int as likes,
  (data->>'comments')::int as comments
FROM instagram_insights
ORDER BY date DESC
LIMIT 30;

-- Calculate engagement rate
SELECT
  date,
  (data->>'total_interactions')::int as interactions,
  (data->>'reach')::int as reach,
  ROUND(
    (data->>'total_interactions')::numeric /
    NULLIF((data->>'reach')::numeric, 0) * 100,
    2
  ) as engagement_rate
FROM instagram_insights
WHERE (data->>'reach')::int > 0
ORDER BY date DESC;

-- Weekly averages
SELECT
  DATE_TRUNC('week', date) as week,
  ROUND(AVG((data->>'reach')::int)) as avg_reach,
  ROUND(AVG((data->>'impressions')::int)) as avg_impressions,
  ROUND(AVG((data->>'total_interactions')::int)) as avg_interactions
FROM instagram_insights
GROUP BY DATE_TRUNC('week', date)
ORDER BY week DESC;

-- Find best and worst days
SELECT
  date,
  (data->>'total_interactions')::int as interactions,
  (data->>'reach')::int as reach
FROM instagram_insights
ORDER BY (data->>'total_interactions')::int DESC
LIMIT 10;

-- Month-over-month comparison
WITH this_month AS (
  SELECT
    SUM((data->>'reach')::int) as total_reach,
    SUM((data->>'impressions')::int) as total_impressions,
    SUM((data->>'total_interactions')::int) as total_interactions
  FROM instagram_insights
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
),
last_month AS (
  SELECT
    SUM((data->>'reach')::int) as total_reach,
    SUM((data->>'impressions')::int) as total_impressions,
    SUM((data->>'total_interactions')::int) as total_interactions
  FROM instagram_insights
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND date < DATE_TRUNC('month', CURRENT_DATE)
)
SELECT
  tm.total_reach as this_month_reach,
  lm.total_reach as last_month_reach,
  ROUND(((tm.total_reach - lm.total_reach)::numeric / lm.total_reach * 100), 2) as reach_change_pct,
  tm.total_interactions as this_month_interactions,
  lm.total_interactions as last_month_interactions
FROM this_month tm, last_month lm;
```

---

## Cross-Table Queries

### Correlate Posts with Daily Insights

```sql
-- Find which posts drove the most engagement days
WITH post_dates AS (
  SELECT
    id,
    data->>'permalink' as url,
    DATE((data->>'timestamp')::timestamp) as post_date
  FROM instagram_media
)
SELECT
  p.url,
  p.post_date,
  (i.data->>'total_interactions')::int as day_interactions,
  (i.data->>'reach')::int as day_reach
FROM post_dates p
JOIN instagram_insights i ON i.date = p.post_date
ORDER BY (i.data->>'total_interactions')::int DESC
LIMIT 10;
```

### UGC Volume vs Follower Growth

```sql
-- Compare UGC tags with follower growth
SELECT
  DATE_TRUNC('week', (t.data->>'timestamp')::timestamp) as week,
  COUNT(DISTINCT t.id) as ugc_posts,
  MAX((p.data->>'followers_count')::int) - MIN((p.data->>'followers_count')::int) as follower_change
FROM instagram_tags t
JOIN instagram_profile p ON p.date BETWEEN
  DATE((t.data->>'timestamp')::timestamp) AND
  DATE((t.data->>'timestamp')::timestamp) + INTERVAL '7 days'
GROUP BY DATE_TRUNC('week', (t.data->>'timestamp')::timestamp)
ORDER BY week DESC;
```

---

## Notes

- All `data` columns use JSONB format for flexibility
- Timestamps are stored as ISO 8601 strings
- Use `::int` or `::numeric` for numeric comparisons
- Use `NULLIF(..., 0)` when dividing to avoid division by zero
- Data is synced daily; real-time data should use Graph API
