# GAQL Query Templates

Pre-built queries for common reporting scenarios.

## Campaign Reports

### Campaign Performance Overview
```sql
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  campaign.advertising_channel_type,
  campaign.bidding_strategy_type,
  campaign_budget.amount_micros,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.ctr,
  metrics.average_cpc
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status != 'REMOVED'
ORDER BY metrics.cost_micros DESC
```

### Campaign Performance by Date
```sql
SELECT
  campaign.name,
  segments.date,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY segments.date DESC
```

### Top Spending Campaigns
```sql
SELECT
  campaign.name,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY metrics.cost_micros DESC
LIMIT 10
```

## Ad Group Reports

### Ad Group Performance
```sql
SELECT
  campaign.name,
  ad_group.id,
  ad_group.name,
  ad_group.status,
  ad_group.type,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.ctr,
  metrics.average_cpc
FROM ad_group
WHERE segments.date DURING LAST_30_DAYS
  AND ad_group.status != 'REMOVED'
ORDER BY metrics.cost_micros DESC
LIMIT 100
```

### Ad Groups for Specific Campaign
```sql
SELECT
  ad_group.id,
  ad_group.name,
  ad_group.status,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions
FROM ad_group
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.id = 123456789
  AND ad_group.status != 'REMOVED'
ORDER BY metrics.cost_micros DESC
```

## Keyword Reports

### Keyword Performance
```sql
SELECT
  campaign.name,
  ad_group.name,
  ad_group_criterion.criterion_id,
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  ad_group_criterion.status,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.average_cpc
FROM keyword_view
WHERE segments.date DURING LAST_30_DAYS
  AND ad_group_criterion.status != 'REMOVED'
ORDER BY metrics.cost_micros DESC
LIMIT 100
```

### High-Spend Low-Conversion Keywords
```sql
SELECT
  campaign.name,
  ad_group.name,
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  metrics.cost_micros,
  metrics.conversions,
  metrics.clicks
FROM keyword_view
WHERE segments.date DURING LAST_30_DAYS
  AND metrics.cost_micros > 10000000
  AND metrics.conversions < 1
ORDER BY metrics.cost_micros DESC
LIMIT 50
```

## Search Term Reports

### Top Search Terms
```sql
SELECT
  search_term_view.search_term,
  search_term_view.status,
  campaign.name,
  ad_group.name,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.ctr,
  metrics.average_cpc
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
ORDER BY metrics.impressions DESC
LIMIT 100
```

### Search Terms with Conversions
```sql
SELECT
  search_term_view.search_term,
  campaign.name,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
  AND metrics.conversions > 0
ORDER BY metrics.conversions DESC
LIMIT 100
```

### Search Terms to Negative (High Spend, No Conversions)
```sql
SELECT
  search_term_view.search_term,
  campaign.name,
  ad_group.name,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
  AND metrics.cost_micros > 5000000
  AND metrics.conversions = 0
ORDER BY metrics.cost_micros DESC
LIMIT 50
```

## Shopping/Product Reports

### Product Performance
```sql
SELECT
  segments.product_title,
  segments.product_item_id,
  segments.product_brand,
  segments.product_type_l1,
  segments.product_type_l2,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM shopping_performance_view
WHERE segments.date DURING LAST_30_DAYS
ORDER BY metrics.conversions_value DESC
LIMIT 100
```

### Best ROAS Products
```sql
SELECT
  segments.product_title,
  segments.product_item_id,
  metrics.cost_micros,
  metrics.conversions_value
FROM shopping_performance_view
WHERE segments.date DURING LAST_30_DAYS
  AND metrics.cost_micros > 0
ORDER BY metrics.conversions_value DESC
LIMIT 50
```

### Products by Brand
```sql
SELECT
  segments.product_brand,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM shopping_performance_view
WHERE segments.date DURING LAST_30_DAYS
ORDER BY metrics.conversions_value DESC
LIMIT 50
```

## Recommendations

### All Active Recommendations
```sql
SELECT
  recommendation.resource_name,
  recommendation.type,
  recommendation.campaign,
  recommendation.ad_group,
  recommendation.dismissed,
  recommendation.impact.base_metrics.impressions,
  recommendation.impact.base_metrics.clicks,
  recommendation.impact.base_metrics.cost_micros,
  recommendation.impact.potential_metrics.impressions,
  recommendation.impact.potential_metrics.clicks,
  recommendation.impact.potential_metrics.cost_micros
FROM recommendation
WHERE recommendation.dismissed = FALSE
ORDER BY recommendation.impact.base_metrics.impressions DESC
LIMIT 50
```

## Geographic Reports

### Performance by Location
```sql
SELECT
  geographic_view.country_criterion_id,
  geographic_view.location_type,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions
FROM geographic_view
WHERE segments.date DURING LAST_30_DAYS
ORDER BY metrics.cost_micros DESC
LIMIT 50
```

## Device Reports

### Performance by Device
```sql
SELECT
  segments.device,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
```

## Time Analysis

### Performance by Hour of Day
```sql
SELECT
  segments.hour,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY segments.hour
```

### Performance by Day of Week
```sql
SELECT
  segments.day_of_week,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY segments.day_of_week
```

## Budget Analysis

### Campaign Budgets
```sql
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  campaign_budget.id,
  campaign_budget.name,
  campaign_budget.amount_micros,
  campaign_budget.total_amount_micros,
  campaign_budget.status
FROM campaign
WHERE campaign.status != 'REMOVED'
ORDER BY campaign_budget.amount_micros DESC
```
