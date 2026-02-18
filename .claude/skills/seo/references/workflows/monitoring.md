# SEO Monitoring & Alerting Workflow

## Overview

Automated tracking system for keyword positions, CTR changes, and SEO performance. This workflow establishes regular monitoring cadence with alerts for significant changes.

**Frequency:** Weekly automated checks, monthly deep analysis
**Output:** Performance dashboards and alert notifications

## Why Monitor Continuously

1. **Early detection** - Catch ranking drops before they impact traffic
2. **Trend identification** - Spot patterns over time
3. **Competitor awareness** - Notice when competitors move
4. **Optimization tracking** - Measure impact of changes
5. **Algorithm updates** - Identify potential algorithm impacts

## Monitoring Framework

### Key Metrics to Track

| Metric | Frequency | Alert Threshold |
|--------|-----------|-----------------|
| Position (top 20 keywords) | Weekly | ±3 positions |
| CTR | Weekly | ±25% change |
| Impressions | Weekly | ±30% change |
| Clicks | Weekly | ±30% change |
| Pages indexed | Monthly | -10% or more |
| Core Web Vitals | Monthly | Any regression |

### Tracking Priorities

**Tier 1: Critical Keywords (Track Daily)**
- Brand terms
- Top 5 revenue-driving keywords
- Keywords with position 1-3

**Tier 2: Important Keywords (Track Weekly)**
- Keywords position 4-10
- High-impression keywords
- Recently optimized keywords

**Tier 3: Opportunity Keywords (Track Monthly)**
- Keywords position 11-30
- Long-tail variations
- New/emerging keywords

## Weekly Monitoring Process

### Step 1: Export Current Data

```bash
# Get top queries from GSC
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-queries sc-domain:example.com 7 500 > weekly-snapshot.json

# Get previous week for comparison
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-queries sc-domain:example.com 7 500 --start-offset=7 > previous-week.json
```

### Step 2: Compare to Baseline

**Tracking spreadsheet structure:**
```csv
keyword,date,impressions,clicks,ctr,position,prev_impressions,prev_clicks,prev_ctr,prev_position,position_change,ctr_change,alert_level
dolphin shorts,2026-01-25,15234,892,5.85%,4.2,14500,845,5.83%,4.0,+0.2,+0.3%,normal
corduroy shorts,2026-01-25,8920,312,3.50%,7.8,9100,420,4.62%,6.2,+1.6,-24.2%,warning
```

### Step 3: Generate Alerts

**Alert rules:**

```typescript
interface AlertRule {
  metric: string;
  condition: "increase" | "decrease" | "any";
  threshold: number;
  severity: "info" | "warning" | "critical";
}

const alertRules: AlertRule[] = [
  // Position alerts
  { metric: "position", condition: "increase", threshold: 3, severity: "warning" },
  { metric: "position", condition: "increase", threshold: 10, severity: "critical" },

  // CTR alerts
  { metric: "ctr", condition: "decrease", threshold: 0.25, severity: "warning" },
  { metric: "ctr", condition: "decrease", threshold: 0.50, severity: "critical" },

  // Traffic alerts
  { metric: "clicks", condition: "decrease", threshold: 0.30, severity: "warning" },
  { metric: "clicks", condition: "decrease", threshold: 0.50, severity: "critical" },

  // Impression alerts
  { metric: "impressions", condition: "decrease", threshold: 0.40, severity: "warning" },
];
```

**Alert output format:**
```json
{
  "alerts": [
    {
      "keyword": "corduroy shorts",
      "severity": "warning",
      "message": "Position dropped from 6.2 to 7.8 (+1.6)",
      "metric": "position",
      "previousValue": 6.2,
      "currentValue": 7.8,
      "change": "+25.8%",
      "suggestedAction": "Review SERP for new competitors, check page for issues"
    }
  ],
  "summary": {
    "critical": 0,
    "warning": 2,
    "info": 5
  }
}
```

### Step 4: Weekly Report

**Automated report template:**

```markdown
# SEO Weekly Report: [Date Range]

## Executive Summary
- **Overall Organic Traffic:** [X] clicks (↑/↓ Y% vs last week)
- **Average Position:** [X] (↑/↓ Y positions)
- **Alerts Generated:** [X] critical, [Y] warning

## Top Movers

### 📈 Biggest Gains
| Keyword | Position Change | CTR Change | Click Change |
|---------|-----------------|------------|--------------|
| [keyword] | 8 → 5 (-3) | +45% | +120 |

### 📉 Biggest Drops
| Keyword | Position Change | CTR Change | Click Change |
|---------|-----------------|------------|--------------|
| [keyword] | 4 → 7 (+3) | -28% | -85 |

## Alerts Requiring Action

### Critical
- None this week

### Warning
- **corduroy shorts**: Position dropped 1.6 places
  - Recommended action: Check competitor content, review on-page optimization

## Keyword Performance by Tier

### Tier 1 (Brand + Top Revenue)
[Table of top keywords with metrics]

### Tier 2 (First Page Opportunities)
[Table of page 1 keywords]

## Next Steps
1. [Action item 1]
2. [Action item 2]
```

## Monthly Deep Analysis

### Step 1: Trend Analysis

**30-day rolling trends:**
```bash
# Get 30-day data
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-queries sc-domain:example.com 30 500 > monthly-data.json
```

**Analyze for patterns:**
- Consistent improvement/decline
- Seasonal effects
- Day-of-week patterns
- Correlation with content changes

### Step 2: Position Distribution

**Track position buckets over time:**

| Bucket | Week 1 | Week 2 | Week 3 | Week 4 | Trend |
|--------|--------|--------|--------|--------|-------|
| Position 1-3 | 15 | 17 | 16 | 18 | ↑ |
| Position 4-10 | 42 | 40 | 43 | 45 | → |
| Position 11-20 | 78 | 82 | 79 | 75 | → |
| Position 21+ | 120 | 118 | 115 | 110 | ↓ |

### Step 3: Opportunity Score Refresh

**Recalculate scores with latest data:**
```bash
cat monthly-data.json | deno run --allow-net --allow-env --allow-read \
  .claude/skills/seo/scripts/seo-client.ts keywords example.com
```

**Compare to previous month:**
- New critical opportunities?
- Resolved opportunities?
- Score changes for tracked keywords?

### Step 4: Index Coverage Check

**Via Search Console:**
```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  index-status sc-domain:example.com
```

**Check for:**
- Decrease in indexed pages
- New crawl errors
- Excluded pages increasing

## Alert Configuration

### Slack/Email Integration

**Alert payload structure:**
```json
{
  "channel": "#seo-alerts",
  "username": "SEO Monitor",
  "icon_emoji": ":chart_with_downwards_trend:",
  "attachments": [
    {
      "color": "warning",
      "title": "SEO Alert: Position Drop",
      "fields": [
        {"title": "Keyword", "value": "corduroy shorts", "short": true},
        {"title": "Severity", "value": "Warning", "short": true},
        {"title": "Position Change", "value": "6.2 → 7.8", "short": true},
        {"title": "Date", "value": "2026-01-25", "short": true}
      ],
      "footer": "SEO Monitoring System"
    }
  ]
}
```

### Notification Rules

| Severity | Notification | Recipients |
|----------|--------------|------------|
| Critical | Immediate | Team channel + DM to lead |
| Warning | Daily digest | Team channel |
| Info | Weekly report | Team channel |

## Dashboard Setup

### Key Dashboard Components

**1. Position Tracking Chart**
```
Time series of average position for top 20 keywords
- 7-day rolling average
- 30-day trend line
- Alert threshold markers
```

**2. CTR Heatmap**
```
CTR by position over time
- Cells colored by CTR performance
- Helps identify CTR optimization opportunities
```

**3. Traffic Waterfall**
```
Click contribution by keyword tier
- Tier 1: [X]% of clicks
- Tier 2: [Y]% of clicks
- Long-tail: [Z]% of clicks
```

**4. Alert History**
```
Timeline of alerts with resolution status
- Open alerts
- Resolved alerts
- False positives (for tuning)
```

### Dashboard Data Sources

```yaml
# Dashboard configuration
dashboards:
  seo_monitor:
    refresh: hourly
    data_sources:
      - type: gsc
        property: sc-domain:example.com
        metrics: [impressions, clicks, ctr, position]
        dimensions: [query, page, date]

      - type: postgres
        query: |
          SELECT * FROM seo_tracking
          WHERE date >= current_date - interval '30 days'

    panels:
      - title: Position Trends
        type: time_series
        metric: position
        group_by: keyword_tier

      - title: Alert Feed
        type: table
        source: alerts
        sort: date DESC
```

## Baseline Establishment

### Initial Setup

**Create baseline snapshot:**
```bash
# Full keyword inventory
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-queries sc-domain:example.com 90 1000 > baseline.json

# Score and categorize
cat baseline.json | deno run --allow-net --allow-env --allow-read \
  .claude/skills/seo/scripts/seo-client.ts keywords example.com \
  > baseline-scored.json
```

**Document baseline:**
```markdown
## Baseline: [Date]

### Summary
- Total tracked keywords: [N]
- Keywords position 1-10: [N]
- Keywords position 11-30: [N]
- Average CTR: [X]%
- Total monthly clicks: [N]

### Top 10 Keywords
[Table]

### Tier Distribution
[Chart data]
```

### Threshold Tuning

**Initial thresholds (adjust based on variance):**

After 4 weeks of monitoring, adjust thresholds based on:
- Normal week-to-week variance
- False positive rate
- Missed important changes

**Tuning process:**
1. Track all changes (regardless of threshold)
2. Mark which were actionable
3. Adjust thresholds to reduce noise while catching important changes

## Automation Scripts

### Cron Job Setup

```bash
# Weekly snapshot (Sunday 6am)
0 6 * * 0 /path/to/weekly-seo-snapshot.sh

# Daily position check (critical keywords)
0 7 * * * /path/to/daily-position-check.sh

# Monthly deep analysis (1st of month)
0 8 1 * * /path/to/monthly-seo-analysis.sh
```

### Sample Snapshot Script

```bash
#!/bin/bash
# weekly-seo-snapshot.sh

DATE=$(date +%Y-%m-%d)
OUTPUT_DIR="workflows/seo/monitoring/weekly"

# Export GSC data
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/search-console/scripts/gsc-client.ts \
  top-queries sc-domain:example.com 7 500 \
  > "$OUTPUT_DIR/snapshot-$DATE.json"

# Generate report
deno run --allow-net --allow-env --allow-read \
  .claude/skills/seo/scripts/seo-client.ts \
  weekly-report "$OUTPUT_DIR/snapshot-$DATE.json" \
  > "$OUTPUT_DIR/report-$DATE.md"

# Check for alerts
# (integrate with notification system)
```

## Output Files

```
workflows/seo/monitoring/
├── baseline.json                    # Initial baseline
├── weekly/
│   ├── snapshot-2026-01-25.json    # Weekly snapshots
│   ├── report-2026-01-25.md        # Weekly reports
│   └── alerts-2026-01-25.json      # Alert log
├── monthly/
│   ├── analysis-2026-01.md         # Monthly deep dive
│   └── trends-2026-01.json         # Trend data
├── alerts/
│   ├── alert-log.csv               # All alerts
│   └── resolution-log.csv          # Alert resolutions
└── config/
    ├── thresholds.json             # Alert thresholds
    └── tracked-keywords.json       # Priority keyword list
```

## Related Workflows

- [performance-forecasting.md](performance-forecasting.md) - Compare forecasts to actuals
- [ab-testing.md](ab-testing.md) - Monitor test performance
- [monthly-trends.md](monthly-trends.md) - Seasonal trend analysis
- [full-catalog.md](full-catalog.md) - Trigger re-optimization based on alerts
