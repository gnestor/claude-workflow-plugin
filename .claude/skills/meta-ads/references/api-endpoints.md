# Meta Marketing API Endpoints Reference

## Base URL

```
https://graph.facebook.com/v24.0
```

## Object Hierarchy

```
Ad Account (act_XXXXXX)
├── Campaigns
│   ├── Ad Sets
│   │   ├── Ads
│   │   └── Targeting
│   └── Budget
├── Custom Audiences
└── Ad Creatives
```

## Account Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/act_{account_id}` | GET | Get account info |
| `/act_{account_id}/campaigns` | GET | List campaigns |
| `/act_{account_id}/campaigns` | POST | Create campaign |
| `/act_{account_id}/adsets` | GET | List ad sets |
| `/act_{account_id}/adsets` | POST | Create ad set |
| `/act_{account_id}/ads` | GET | List ads |
| `/act_{account_id}/ads` | POST | Create ad |
| `/act_{account_id}/adcreatives` | GET | List creatives |
| `/act_{account_id}/adcreatives` | POST | Create creative |
| `/act_{account_id}/customaudiences` | GET | List audiences |
| `/act_{account_id}/adimages` | POST | Upload image |
| `/act_{account_id}/advideos` | POST | Upload video |

## Object Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{campaign_id}` | GET | Get campaign |
| `/{campaign_id}` | POST | Update campaign |
| `/{campaign_id}/insights` | GET | Get campaign insights |
| `/{adset_id}` | GET | Get ad set |
| `/{adset_id}` | POST | Update ad set |
| `/{adset_id}/insights` | GET | Get ad set insights |
| `/{ad_id}` | GET | Get ad |
| `/{ad_id}` | POST | Update ad |
| `/{ad_id}/insights` | GET | Get ad insights |
| `/{creative_id}` | GET | Get creative |
| `/{audience_id}` | GET | Get audience |

## Ad Library Endpoint

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ads_archive` | GET | Search Ad Library (EU/Brazil/political only) |

## Insights Fields

### Core Metrics
- `impressions` - Number of times ads were on screen
- `clicks` - Total clicks
- `spend` - Total amount spent (in account currency)
- `reach` - Number of unique people who saw ads
- `frequency` - Average times each person saw ads

### Engagement Metrics
- `ctr` - Click-through rate
- `cpc` - Cost per click
- `cpm` - Cost per 1,000 impressions
- `cpp` - Cost per 1,000 people reached

### Conversion Metrics
- `conversions` - Total conversions
- `conversion_values` - Total value of conversions
- `cost_per_conversion` - Average cost per conversion
- `actions` - Breakdown of actions by type
- `action_values` - Value of actions by type

### Video Metrics
- `video_p25_watched_actions` - 25% video watched
- `video_p50_watched_actions` - 50% video watched
- `video_p75_watched_actions` - 75% video watched
- `video_p100_watched_actions` - 100% video watched

## Breakdown Options

| Breakdown | Values |
|-----------|--------|
| `age` | 18-24, 25-34, 35-44, 45-54, 55-64, 65+ |
| `gender` | male, female, unknown |
| `country` | ISO country codes |
| `region` | Regions within countries |
| `publisher_platform` | facebook, instagram, audience_network, messenger |
| `platform_position` | feed, story, explore, reels, etc. |
| `device_platform` | mobile, desktop |
| `impression_device` | iPhone, Android, Desktop, etc. |

## Date Presets

| Preset | Description |
|--------|-------------|
| `today` | Today |
| `yesterday` | Yesterday |
| `this_month` | Current month to date |
| `last_month` | Previous full month |
| `this_quarter` | Current quarter to date |
| `last_3d` | Last 3 days |
| `last_7d` | Last 7 days |
| `last_14d` | Last 14 days |
| `last_28d` | Last 28 days |
| `last_30d` | Last 30 days |
| `last_90d` | Last 90 days |
| `lifetime` | All time |

## Campaign Objectives

| Objective | Description |
|-----------|-------------|
| `OUTCOME_AWARENESS` | Brand awareness |
| `OUTCOME_ENGAGEMENT` | Post engagement, page likes |
| `OUTCOME_LEADS` | Lead generation |
| `OUTCOME_SALES` | Conversions, catalog sales |
| `OUTCOME_TRAFFIC` | Website traffic |
| `OUTCOME_APP_PROMOTION` | App installs |

## Status Values

| Status | Description |
|--------|-------------|
| `ACTIVE` | Running |
| `PAUSED` | Paused by user |
| `DELETED` | Deleted |
| `ARCHIVED` | Archived |
| `PENDING_REVIEW` | Under review |
| `DISAPPROVED` | Rejected |
| `WITH_ISSUES` | Has delivery issues |

## Currency Handling

Meta API returns currency values in the account's currency (typically USD):
- Values are returned as strings with decimals (e.g., "50.00")
- Budget fields (daily_budget, lifetime_budget) are in cents (integer)
- $50.00 = 5000 (cents)

## Rate Limits

- Standard: 200 calls per hour per ad account
- Marketing API: Higher limits with approved app
- Batch requests: Up to 50 requests per batch

## Error Codes

| Code | Description |
|------|-------------|
| 1 | Unknown error |
| 2 | Service temporarily unavailable |
| 4 | Application request limit reached |
| 17 | User request limit reached |
| 100 | Invalid parameter |
| 190 | Invalid access token |
| 200 | Permission error |
| 294 | Ad account disabled |

## API Reference Links

- [Marketing API Overview](https://developers.facebook.com/docs/marketing-api)
- [Campaign API](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group)
- [Ad Set API](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign)
- [Ad API](https://developers.facebook.com/docs/marketing-api/reference/adgroup)
- [Insights API](https://developers.facebook.com/docs/marketing-api/insights)
- [Ad Library API](https://developers.facebook.com/docs/marketing-api/reference/ads_archive)
