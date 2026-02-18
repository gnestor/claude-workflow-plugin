---
name: reports
description: >
  Guidelines for creating analysis reports, including templates, structure,
  and best practices. Use when generating reports, summaries, or data
  analysis documents.
---

# Reports Skill

## Purpose

This skill provides guidelines for creating consistent, high-quality analysis reports for the business. Reports should be actionable, data-driven, and follow a standardized structure.

## When to Use

Activate this skill when:

- Performing data analysis that requires documentation
- Creating performance reports (email, ads, sales, etc.)
- Summarizing research findings
- Generating comparative analysis (top vs. bottom performers)
- Documenting business insights or recommendations

## Report Location

**All reports should be saved to:** `reports/`

**Naming convention:** `{topic}-{type}.md`

- Examples: `email-creative-analysis.md`, `q4-sales-summary.md`, `meta-ads-performance.md`

## Report Structure

Every report should follow this standard structure:

```markdown
# [Report Title]

**Analysis Date:** [Date]
**Dataset:** [Description of data analyzed]
**Method:** [Brief methodology]

## Executive Summary

[2-3 paragraph overview of key findings and recommendations]

### Key Findings

1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

## [Section 1: Data/Analysis]

[Detailed analysis with tables, comparisons]

## [Section 2: Insights]

[Patterns, observations, interpretations]

## Recommendations

[Actionable next steps]

## Methodology

[How the analysis was conducted]

### Limitations

[What the analysis doesn't cover]

## Appendix

[Supporting data, full lists, raw outputs]
```

## Best Practices

### Data Presentation

1. **Use tables for comparisons**
2. **Include specific examples** - Don't just state patterns; show concrete examples
3. **Quantify findings** - Use numbers, not vague terms like "many" or "some"

### Writing Style

1. **Lead with insights** - Start with what matters most
2. **Be actionable** - Every finding should suggest what to do
3. **Avoid jargon** - Write for a general business audience
4. **Use active voice** - "Sales increased" not "An increase in sales was observed"

### Visual Analysis

When analyzing visual content (emails, ads, creative):

1. **Describe key visual elements**: Colors, layout, typography, imagery
2. **Note patterns**: What do high performers have in common?
3. **Include screenshots** or file references when helpful
4. **Categorize visual styles**: Give names to patterns you observe

## Report Types

### Performance Analysis Report

For analyzing top vs. bottom performers:

```markdown
## Top Performers Analysis
- Sample campaigns analyzed (table)
- Common characteristics (numbered list)
- Example breakdown

## Bottom Performers Analysis
- Sample campaigns analyzed (table)
- Common characteristics (numbered list)
- Example breakdown

## What Distinguishes Top from Bottom
- Comparison table
```

### Trend Report

For analyzing changes over time:

```markdown
## Historical Context
- Time period covered
- Key metrics tracked

## Trend Analysis
- Charts/tables showing progression
- Inflection points identified

## Drivers of Change
- What caused the trends
```

### Competitive Analysis

For comparing against competitors or benchmarks:

```markdown
## Competitive Landscape
- Who was analyzed
- Methodology

## Comparison Matrix
- Feature-by-feature comparison

## Opportunities
- Where you can differentiate
```

## Integration with Other Skills

When generating reports, use the appropriate data skill to gather data, then apply these guidelines to format and present the analysis.

### Workflow Example

1. **Gather data** using appropriate skill (e.g., Shopify, analytics, etc.)
2. **Analyze** using Task agents or manual review
3. **Document** using this reports skill
4. **Store** in `reports/` directory
5. **Reference** in company skill files if findings are reusable

## Templates

See [references/templates.md](references/templates.md) for copy-paste templates.

## Existing Reports

See `reports/` directory for all generated reports.
