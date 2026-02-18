# Recap Templates

## Formatting Guidelines

Use simple markdown:

- **Headers** for sections and subsections (not bold text like `**Section:**`)
- **Blockquotes** for quoted text, user prompts, or thinking
- **Lists** for enumerating items
- **Inline formatting** (`code`, *italics*, **bold**) sparingly
- **Tables** when comparing data

## Session Summary Template

Use this template for `workflows/yyyy-mm-dd-hh-mm-ss-workflow-title.md` files:

```markdown
# [Descriptive Title]

**Date:** YYYY-MM-DD

## Initial Prompt

> [Exact user request quoted]

## Plan

[The approved approach/plan that was executed]

### Phase 1: [Phase Name]
- Key decision or approach

### Phase 2: [Phase Name]
- Key decision or approach

## Execution Summary

### [Task 1 Name]

[What was done, key commands, findings]

### [Task 2 Name]

[What was done, key commands, findings]

## Result

### Deliverables

- [List of files created, outputs produced]

### Findings

[Key findings, data tables, conclusions]

### Recommendations

[If applicable - actionable next steps]

## Appendix: Skill Revisions

| Skill | File | Change |
|-------|------|--------|
| `skill-name` | `SKILL.md` | Added troubleshooting section for X error |
| `skill-name` | `references/workflow-examples.md` | Added example for Y pattern |
| `your-brand` | `references/marketing.md` | Added competitor analysis section |
```

## Department Insights Section Template

Use when adding analysis findings to `.claude/skills/your-brand/references/<dept>.md`:

**Available departments:** marketing, finance, production, customer-service, logistics, content, creative, sales, shopify, analytics, operations, development

```markdown
### [Analysis Topic] ([Date Range])

Analysis Date: [Month Year]
Source: [workflows/filename.md](../../workflows/filename.md)

[2-3 sentence explanation of the main discovery]

| Metric | Period 1 | Period 2 | Change |
|--------|----------|----------|--------|
| Metric 1 | Value | Value | % |
| Metric 2 | Value | Value | % |

**Root causes:**
1. Cause with supporting data
2. Cause with supporting data

**Recommendations:**
1. Actionable recommendation
2. Actionable recommendation
```

## Skill Error/Fix Template

Use when adding troubleshooting to a skill's SKILL.md:

```markdown
## Troubleshooting

### [Error Description]

**Symptom:** [What the user sees or what fails]

**Cause:** [Why this happens]

**Solution:** [How to fix it]

```bash
# Example fix command if applicable
```
```

## Workflow Example Template

Use when adding to a skill's `references/workflow-examples.md`:

````markdown
## Example: [Descriptive Title]

User Question: "[Natural language question this answers]"

### Process

1. Step one name
   ```bash
   command
   ```

2. Step two name

### Sample Output

[Example output or data table]

### Interpretation

- Key insight one
- Key insight two
````

## Reference IDs Template

When adding discovered IDs or constants to a skill:

```markdown
## Common [Resource] IDs

| Resource | ID | Use Case |
|----------|-----|----------|
| Name 1 | `id` | When to use |
| Name 2 | `id` | When to use |

Use `[command]` to verify IDs or find additional resources.
```
