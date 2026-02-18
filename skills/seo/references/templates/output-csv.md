# Output Format Specifications

## Overview

This document defines output formats for SEO optimization results, designed for compatibility with Shopify bulk import and manual review workflows.

## Primary Output: CSV (Shopify Compatible)

### Product Optimization CSV

**Filename:** `seo-optimized-products.csv`

**Columns:**

| Column | Type | Description | Shopify Field |
|--------|------|-------------|---------------|
| `handle` | string | Product URL slug | `Handle` |
| `meta_title` | string | Optimized meta title | `SEO Title` |
| `meta_description` | string | Optimized meta description | `SEO Description` |
| `description_html` | string | Optimized HTML description | `Body (HTML)` |
| `primary_keyword` | string | Target primary keyword | N/A (reference) |
| `secondary_keywords` | string | Comma-separated keywords | N/A (reference) |
| `opportunity_score` | number | Keyword opportunity score | N/A (reference) |

**Example:**
```csv
handle,meta_title,meta_description,description_html,primary_keyword,secondary_keywords,opportunity_score
mens-navy-corduroy-shorts,"Men's Navy Corduroy Shorts | Your Brand","Vintage-inspired men's corduroy shorts with 3"" inseam. Stretch fabric for all-day comfort. Free shipping $100+.","<p>The Your Brand Short is a vintage-inspired <strong>corduroy short</strong>...</p>",corduroy shorts,"mens shorts, vintage shorts, 80s shorts",45
```

### CSV Encoding Rules

1. **Quoting:** Fields containing commas, quotes, or newlines must be quoted
2. **Escaping:** Double quotes within fields escaped as `""`
3. **Encoding:** UTF-8
4. **Line endings:** Unix (LF) or Windows (CRLF)
5. **Header:** Required first row

### HTML in CSV

When including HTML in CSV:
- Wrap entire field in double quotes
- Escape internal quotes: `""` instead of `"`
- Preserve line breaks within quotes
- Remove any carriage returns

```csv
handle,description_html
product-1,"<p>First paragraph.</p>
<p>Second paragraph with ""quotes"".</p>"
```

## Secondary Output: JSON

### Full Optimization Report

**Filename:** `seo-optimization-report.json`

```json
{
  "generated_at": "2026-01-22T10:30:00Z",
  "domain": "example.com",
  "analysis_period_days": 90,
  "summary": {
    "products_analyzed": 52,
    "products_optimized": 48,
    "keywords_identified": 45,
    "critical_opportunities": 3,
    "high_opportunities": 8
  },
  "keywords": [
    {
      "keyword": "dolphin shorts",
      "impressions": 93820,
      "clicks": 68,
      "ctr": 0.0007,
      "position": 5.3,
      "opportunity_score": 69,
      "tier": "High",
      "target_products": ["dolphin-trunk-navy", "dolphin-trunk-black"]
    }
  ],
  "products": [
    {
      "handle": "dolphin-trunk-navy",
      "original": {
        "meta_title": "",
        "meta_description": "",
        "description_preview": "The Your Brand Dolphin Trunk is..."
      },
      "optimized": {
        "meta_title": "Men's Navy Dolphin Shorts | Your Brand",
        "meta_description": "Retro dolphin shorts in quick-dry nylon...",
        "description_html": "<p>The Your Brand Dolphin Trunk is...</p>"
      },
      "changes": {
        "meta_title_added": true,
        "meta_description_added": true,
        "keywords_added": ["dolphin shorts", "retro swim trunks"],
        "opportunity_score": 69
      }
    }
  ]
}
```

### Keyword Report JSON

**Filename:** `keyword-opportunities.json`

```json
{
  "generated_at": "2026-01-22T10:30:00Z",
  "source": "google_search_console",
  "period": {
    "start": "2025-10-24",
    "end": "2026-01-22",
    "days": 90
  },
  "keywords": [
    {
      "keyword": "dolphin shorts",
      "category": "Shorts",
      "metrics": {
        "impressions": 93820,
        "clicks": 68,
        "ctr": 0.0007,
        "position": 5.3
      },
      "scoring": {
        "opportunity_score": 69,
        "tier": "High",
        "position_weight": 0.735
      },
      "analysis": {
        "current_presence": false,
        "target_products": ["dolphin-trunk"],
        "action": "Add to product descriptions"
      }
    }
  ]
}
```

## Markdown Output

### Optimization Summary

**Filename:** `seo-optimization-summary.md`

```markdown
# SEO Optimization Summary

**Generated:** 2026-01-22
**Domain:** example.com
**Period:** 90 days

## Key Findings

### Critical Opportunities (Score 90+)
None identified.

### High Opportunities (Score 70-89)
| Keyword | Impressions | CTR | Position | Action |
|---------|-------------|-----|----------|--------|
| dolphin shorts | 93,820 | 0.07% | 5.3 | Add to Dolphin Trunk |
| bell bottoms | 55,538 | 0.19% | 6.9 | Add to all pants |

### Products Updated
- 48 products optimized
- 45 meta titles added
- 45 meta descriptions added
- 12 keywords integrated

## Next Steps
1. Upload seo-optimized-products.csv to Shopify
2. Verify changes on live site
3. Monitor rankings over next 4 weeks
4. Re-run analysis in 90 days
```

## Shopify Import Format

### Bulk Product Update CSV

For Shopify's native bulk editor, use this format:

**Filename:** `shopify-product-update.csv`

```csv
Handle,Title,Body (HTML),SEO Title,SEO Description
mens-navy-corduroy-shorts,Men's Corduroy Short (Navy),"<p>The Your Brand Short is...</p>",Men's Navy Corduroy Shorts | Your Brand,"Vintage-inspired men's corduroy shorts..."
```

### Matrixify Format

For Matrixify (bulk import app), include additional fields:

```csv
Handle,Title,Body HTML,Metafield: title_tag [string],Metafield: description_tag [string]
mens-navy-corduroy-shorts,Men's Corduroy Short (Navy),"<p>...</p>",Men's Navy Corduroy Shorts | Your Brand,"Vintage-inspired..."
```

## Diff Output

### Before/After Comparison

**Filename:** `seo-changes-diff.md`

```markdown
# SEO Changes: dolphin-trunk-navy

## Meta Title
- **Before:** (empty)
- **After:** Men's Navy Dolphin Shorts | Your Brand

## Meta Description
- **Before:** (empty)
- **After:** Retro dolphin shorts in quick-dry nylon. Split leg seam, 3" inseam. Perfect for beach or pool. Ships free $100+.

## Description
```diff
- <p>The Your Brand Dolphin Trunk is our newest swim trunk.</p>
+ <p>The Your Brand Dolphin Trunk is our newest <strong>dolphin shorts</strong> style swim trunk.</p>

- <p>Made from quick-dry nylon.</p>
+ <p>These retro <strong>dolphin shorts</strong> are made from quick-dry nylon with a classic split leg seam.</p>
```

## Keywords Added
- dolphin shorts (primary)
- retro swim trunks
- 80s dolphin shorts
```

## Export Functions

### Generate CSV
```typescript
function exportToCSV(products: OptimizedProduct[]): string {
  const headers = [
    'handle',
    'meta_title',
    'meta_description',
    'description_html',
    'primary_keyword',
    'secondary_keywords',
    'opportunity_score'
  ];

  const rows = products.map(p => [
    p.handle,
    escapeCSV(p.meta_title),
    escapeCSV(p.meta_description),
    escapeCSV(p.description_html),
    p.primary_keyword,
    p.secondary_keywords.join(', '),
    p.opportunity_score
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

### Generate JSON
```typescript
function exportToJSON(report: OptimizationReport): string {
  return JSON.stringify(report, null, 2);
}
```

## File Locations

Default output directory: `workflows/seo/`

```
workflows/seo/
├── seo-optimized-products.csv      # Shopify import
├── seo-optimization-report.json    # Full report
├── keyword-opportunities.csv       # Keyword analysis
├── keyword-opportunities.json      # Keyword data
├── seo-optimization-summary.md     # Human-readable summary
└── seo-changes-diff.md             # Before/after comparison
```

## Related Templates

- [product-catalog-input.md](product-catalog-input.md) - Input format for products
- [webpage-input.md](webpage-input.md) - Input format for webpages
