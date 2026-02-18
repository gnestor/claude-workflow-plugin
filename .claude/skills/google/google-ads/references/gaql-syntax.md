# Google Ads Query Language (GAQL) Reference

## Basic Syntax

```sql
SELECT field1, field2, ...
FROM resource
WHERE condition1 AND condition2
ORDER BY field [ASC|DESC]
LIMIT n
```

## SELECT Clause

Select attributes, metrics, and segments:

```sql
SELECT
  campaign.id,                    -- Resource attribute
  campaign.name,                  -- Resource attribute
  metrics.impressions,            -- Metric
  metrics.clicks,                 -- Metric
  segments.date                   -- Segment
FROM campaign
```

## FROM Clause

Specify the primary resource:

| Resource | Description |
|----------|-------------|
| `campaign` | Campaign-level data |
| `ad_group` | Ad group-level data |
| `ad_group_ad` | Ad-level data |
| `keyword_view` | Keyword performance |
| `search_term_view` | Search terms report |
| `shopping_performance_view` | Shopping/product data |
| `campaign_budget` | Budget information |
| `recommendation` | Optimization recommendations |
| `geographic_view` | Geographic performance |
| `gender_view` | Gender performance |
| `age_range_view` | Age range performance |

## WHERE Clause

### Comparison Operators

| Operator | Description |
|----------|-------------|
| `=` | Equal |
| `!=` | Not equal |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal |
| `<=` | Less than or equal |
| `IN` | In list |
| `NOT IN` | Not in list |
| `LIKE` | Pattern matching |
| `NOT LIKE` | Negative pattern |
| `CONTAINS ANY` | Contains any value |
| `CONTAINS ALL` | Contains all values |
| `CONTAINS NONE` | Contains no values |
| `IS NULL` | Is null |
| `IS NOT NULL` | Is not null |
| `BETWEEN` | Between range |
| `DURING` | Date range shortcut |
| `REGEXP_MATCH` | Regular expression |

### Date Range Shortcuts (DURING)

```sql
WHERE segments.date DURING LAST_7_DAYS
WHERE segments.date DURING LAST_14_DAYS
WHERE segments.date DURING LAST_30_DAYS
WHERE segments.date DURING LAST_MONTH
WHERE segments.date DURING THIS_MONTH
WHERE segments.date DURING LAST_BUSINESS_WEEK
WHERE segments.date DURING LAST_WEEK_MON_SUN
WHERE segments.date DURING LAST_WEEK_SUN_SAT
WHERE segments.date DURING THIS_WEEK_MON_TODAY
WHERE segments.date DURING THIS_WEEK_SUN_TODAY
```

### Specific Date Range

```sql
WHERE segments.date BETWEEN '2024-01-01' AND '2024-01-31'
WHERE segments.date >= '2024-01-01' AND segments.date <= '2024-01-31'
```

### Status Filters

```sql
WHERE campaign.status = 'ENABLED'
WHERE campaign.status != 'REMOVED'
WHERE campaign.status IN ('ENABLED', 'PAUSED')
WHERE ad_group.status = 'ENABLED'
```

### Combining Conditions

```sql
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status != 'REMOVED'
  AND metrics.impressions > 0
```

## ORDER BY Clause

```sql
ORDER BY metrics.cost_micros DESC
ORDER BY metrics.impressions ASC
ORDER BY campaign.name
```

## LIMIT Clause

```sql
LIMIT 100
LIMIT 1000
```

**Note:** Maximum is 10,000 rows per query.

## Common Patterns

### Filter by Campaign Status
```sql
WHERE campaign.status != 'REMOVED'
WHERE campaign.status = 'ENABLED'
```

### Filter by Impressions
```sql
WHERE metrics.impressions > 0
WHERE metrics.impressions > 1000
```

### Filter by Cost
```sql
WHERE metrics.cost_micros > 0
WHERE metrics.cost_micros > 1000000  -- $1
```

### Combine Date and Status
```sql
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status != 'REMOVED'
```

## Field Compatibility

Not all fields can be combined in the same query. Use the [Google Ads API Field Reference](https://developers.google.com/google-ads/api/fields/v18/overview) to check compatibility.

### Rules:
1. Metrics require a date segment to aggregate over
2. Some segments are mutually exclusive
3. Resource attributes from related resources can be joined implicitly

### Example of Implicit Join
```sql
SELECT
  campaign.name,           -- From campaign
  ad_group.name,           -- From ad_group (auto-joined)
  metrics.clicks
FROM ad_group
```

## Error Messages

### "Field is not compatible"
- Check field compatibility in API reference
- Remove incompatible fields from SELECT

### "Cannot use X segment with Y segment"
- Some segments are mutually exclusive
- Remove one of the conflicting segments

### "Metrics require date range"
- Add `segments.date DURING ...` to WHERE clause
- Or add specific date filter
