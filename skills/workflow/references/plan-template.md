# PLAN.md Template

Use this template when saving a new workflow. Replace placeholders with actual values.

```markdown
---
name: kebab-case-name
description: "What this workflow does in 1-2 sentences"
triggers:
  - "natural language phrase that should activate this workflow"
  - "another way the user might ask for this"
schedule: null                            # Future: natural language schedule (e.g., "every Monday at 9am")
destination: outputs/                     # Where output goes (default: outputs/, or notion, google-drive, email, etc.)
skills:                                   # Skills this workflow depends on
  - shopify
  - notion
connectors:                               # ~~category tool categories used
  - "~~e-commerce"
  - "~~knowledge-base"
parameters:                               # Values that change between runs
  - name: period
    description: "Time period to analyze"
    default: "last 7 days"
created: YYYY-MM-DD
last_run: null
last_run_status: null                     # success | partial | failed
run_count: 0
---

# Workflow Title

## Objective

What this workflow achieves and why it exists.

## Steps

### 1. Step name
- Action using ~~category tools
- What to do with the result

### 2. Step name
- Next action
- Expected output

### 3. Deliver results
- Save to outputs/ with timestamp
- If destination is specified, also deliver there
```

## Notes

- Steps are the single source of truth. After each execution, the Stop hook updates the steps inline if execution revealed better approaches.
- Use `~~category` placeholders instead of specific tool names to keep workflows tool-agnostic.
- Use `{{parameter_name}}` for values that change between runs. These are resolved from user input or frontmatter defaults at runtime.
- The `schedule` and `destination` fields are designed for future scheduling/API support.
