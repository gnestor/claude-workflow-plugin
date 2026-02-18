# Google Ads API Resources Reference

## Core Resources

### campaign

Campaign-level settings and data.

**Key Fields:**
| Field | Description |
|-------|-------------|
| `campaign.id` | Campaign ID |
| `campaign.name` | Campaign name |
| `campaign.status` | ENABLED, PAUSED, REMOVED |
| `campaign.advertising_channel_type` | SEARCH, DISPLAY, SHOPPING, VIDEO, etc. |
| `campaign.advertising_channel_sub_type` | Sub-type for specialized campaigns |
| `campaign.bidding_strategy_type` | Manual CPC, Target ROAS, etc. |
| `campaign.start_date` | Campaign start date |
| `campaign.end_date` | Campaign end date |
| `campaign.target_roas.target_roas` | Target ROAS value |
| `campaign.maximize_conversion_value.target_roas` | Target ROAS for max conversion value |

### campaign_budget

Budget settings for campaigns.

**Key Fields:**
| Field | Description |
|-------|-------------|
| `campaign_budget.id` | Budget ID |
| `campaign_budget.name` | Budget name |
| `campaign_budget.amount_micros` | Daily budget in micros |
| `campaign_budget.total_amount_micros` | Total budget (for date-bounded budgets) |
| `campaign_budget.status` | ENABLED, REMOVED |
| `campaign_budget.delivery_method` | STANDARD, ACCELERATED |
| `campaign_budget.explicitly_shared` | Whether budget is shared |

### ad_group

Ad group settings and data.

**Key Fields:**
| Field | Description |
|-------|-------------|
| `ad_group.id` | Ad group ID |
| `ad_group.name` | Ad group name |
| `ad_group.status` | ENABLED, PAUSED, REMOVED |
| `ad_group.type` | SEARCH_STANDARD, DISPLAY_STANDARD, etc. |
| `ad_group.cpc_bid_micros` | Default CPC bid |
| `ad_group.target_cpa_micros` | Target CPA |
| `ad_group.target_roas` | Target ROAS |

### ad_group_ad

Individual ads within ad groups.

**Key Fields:**
| Field | Description |
|-------|-------------|
| `ad_group_ad.ad.id` | Ad ID |
| `ad_group_ad.status` | ENABLED, PAUSED, REMOVED |
| `ad_group_ad.ad.type` | TEXT_AD, RESPONSIVE_SEARCH_AD, etc. |
| `ad_group_ad.ad.final_urls` | Landing page URLs |

### ad_group_criterion

Targeting criteria (keywords, audiences, etc.).

**Key Fields:**
| Field | Description |
|-------|-------------|
| `ad_group_criterion.criterion_id` | Criterion ID |
| `ad_group_criterion.status` | ENABLED, PAUSED, REMOVED |
| `ad_group_criterion.keyword.text` | Keyword text |
| `ad_group_criterion.keyword.match_type` | EXACT, PHRASE, BROAD |
| `ad_group_criterion.negative` | Is negative keyword |
| `ad_group_criterion.cpc_bid_micros` | Keyword-level CPC bid |

## View Resources

### keyword_view

Keyword performance metrics.

**Joins with:** campaign, ad_group, ad_group_criterion

### search_term_view

Search terms that triggered ads.

**Key Fields:**
| Field | Description |
|-------|-------------|
| `search_term_view.search_term` | The actual search query |
| `search_term_view.status` | NONE, ADDED, EXCLUDED, ADDED_EXCLUDED |

### shopping_performance_view

Shopping campaign product performance.

**Key Segments:**
| Segment | Description |
|---------|-------------|
| `segments.product_title` | Product title |
| `segments.product_item_id` | Product ID |
| `segments.product_brand` | Product brand |
| `segments.product_type_l1` | Product category level 1 |
| `segments.product_type_l2` | Product category level 2 |
| `segments.product_channel` | ONLINE, LOCAL |

### geographic_view

Performance by geographic location.

**Key Fields:**
| Field | Description |
|-------|-------------|
| `geographic_view.country_criterion_id` | Country ID |
| `geographic_view.location_type` | Type of location targeting |

### recommendation

Optimization recommendations from Google.

**Key Fields:**
| Field | Description |
|-------|-------------|
| `recommendation.resource_name` | Full resource name |
| `recommendation.type` | Recommendation type |
| `recommendation.campaign` | Related campaign |
| `recommendation.ad_group` | Related ad group |
| `recommendation.dismissed` | Whether dismissed |
| `recommendation.impact.base_metrics.*` | Current metrics |
| `recommendation.impact.potential_metrics.*` | Projected metrics |

**Recommendation Types:**
- CAMPAIGN_BUDGET
- KEYWORD
- TEXT_AD
- TARGET_CPA_OPT_IN
- TARGET_ROAS_OPT_IN
- MAXIMIZE_CONVERSIONS_OPT_IN
- RESPONSIVE_SEARCH_AD
- SITELINK_EXTENSION
- CALLOUT_EXTENSION
- And many more...

## Metrics

### Performance Metrics

| Metric | Description |
|--------|-------------|
| `metrics.impressions` | Number of impressions |
| `metrics.clicks` | Number of clicks |
| `metrics.cost_micros` | Total cost in micros |
| `metrics.conversions` | Number of conversions |
| `metrics.conversions_value` | Total conversion value |
| `metrics.all_conversions` | All conversions including cross-device |
| `metrics.all_conversions_value` | All conversion value |

### Rate Metrics

| Metric | Description |
|--------|-------------|
| `metrics.ctr` | Click-through rate |
| `metrics.average_cpc` | Average cost per click (micros) |
| `metrics.average_cpm` | Average cost per 1000 impressions |
| `metrics.average_cpv` | Average cost per view |
| `metrics.conversions_from_interactions_rate` | Conversion rate |

### Quality Metrics

| Metric | Description |
|--------|-------------|
| `metrics.search_impression_share` | Search impression share |
| `metrics.search_rank_lost_impression_share` | Lost impression share (rank) |
| `metrics.search_budget_lost_impression_share` | Lost impression share (budget) |
| `metrics.top_impression_percentage` | Top position rate |
| `metrics.absolute_top_impression_percentage` | Absolute top position rate |

### Video Metrics

| Metric | Description |
|--------|-------------|
| `metrics.video_views` | Number of video views |
| `metrics.video_view_rate` | Video view rate |
| `metrics.video_quartile_p25_rate` | 25% completion rate |
| `metrics.video_quartile_p50_rate` | 50% completion rate |
| `metrics.video_quartile_p75_rate` | 75% completion rate |
| `metrics.video_quartile_p100_rate` | 100% completion rate |

## Segments

### Time Segments

| Segment | Description |
|---------|-------------|
| `segments.date` | Date (YYYY-MM-DD) |
| `segments.week` | Week |
| `segments.month` | Month |
| `segments.quarter` | Quarter |
| `segments.year` | Year |
| `segments.day_of_week` | Day of week |
| `segments.hour` | Hour of day (0-23) |

### Device Segments

| Segment | Description |
|---------|-------------|
| `segments.device` | MOBILE, TABLET, DESKTOP, OTHER |

### Network Segments

| Segment | Description |
|---------|-------------|
| `segments.ad_network_type` | SEARCH, SEARCH_PARTNERS, CONTENT, etc. |

### Conversion Segments

| Segment | Description |
|---------|-------------|
| `segments.conversion_action` | Conversion action resource name |
| `segments.conversion_action_category` | Conversion category |
| `segments.conversion_action_name` | Conversion action name |

## Status Values

### Campaign/Ad Group/Criterion Status

| Status | Description |
|--------|-------------|
| `ENABLED` | Active and running |
| `PAUSED` | Paused by advertiser |
| `REMOVED` | Deleted (not returned by default) |

### Search Term Status

| Status | Description |
|--------|-------------|
| `NONE` | Not added as keyword |
| `ADDED` | Added as positive keyword |
| `EXCLUDED` | Added as negative keyword |
| `ADDED_EXCLUDED` | Both added and excluded |

## Advertising Channel Types

| Type | Description |
|------|-------------|
| `SEARCH` | Search network |
| `DISPLAY` | Display network |
| `SHOPPING` | Shopping campaigns |
| `VIDEO` | Video campaigns |
| `MULTI_CHANNEL` | Cross-network |
| `LOCAL` | Local campaigns |
| `SMART` | Smart campaigns |
| `PERFORMANCE_MAX` | Performance Max |
| `LOCAL_SERVICES` | Local Services |
| `DISCOVERY` | Discovery campaigns |
| `TRAVEL` | Travel campaigns |

## Bidding Strategy Types

| Type | Description |
|------|-------------|
| `MANUAL_CPC` | Manual cost-per-click |
| `MANUAL_CPM` | Manual cost-per-thousand impressions |
| `MANUAL_CPV` | Manual cost-per-view |
| `MAXIMIZE_CLICKS` | Maximize clicks |
| `MAXIMIZE_CONVERSIONS` | Maximize conversions |
| `MAXIMIZE_CONVERSION_VALUE` | Maximize conversion value |
| `TARGET_CPA` | Target cost-per-acquisition |
| `TARGET_ROAS` | Target return on ad spend |
| `TARGET_IMPRESSION_SHARE` | Target impression share |
| `PERCENT_CPC` | Percent CPC |
