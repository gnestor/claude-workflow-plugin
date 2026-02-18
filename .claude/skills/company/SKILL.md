---
name: company
description: >
  Company context including business overview, team structure, goals, products,
  and department-specific information. Activate when the user asks about company
  operations, team members, business strategy, department workflows, or needs
  context about the business.
---

# Company Context

This skill provides business context for the agent. It is populated during the setup workflow.

## Setup

Run the setup workflow to populate this skill:

```
Ask the agent: "Run the setup workflow"
```

The setup workflow will ask about your business and populate the sections below and the reference files.

## Business Overview

<!-- Populated during setup -->

**Business name:**
**Industry:**
**Products/Services:**
**Description:**

## Team Directory

<!-- Populated during setup -->

## Goals & KPIs

<!-- Populated during setup -->

## Reference Files

Department-specific context is stored in `references/`:

| File | Description |
|------|-------------|
| `references/overview.md` | Business overview and current state |
| `references/team.md` | Team directory and roles |
| `references/goals.md` | Goals, KPIs, and trajectory |
| `references/products.md` | Product catalog and details |
| `references/marketing.md` | Marketing strategy and channels |
| `references/finance.md` | Financial context and metrics |
| `references/operations.md` | Operations and logistics |
| `references/customer-service.md` | Support and customer experience |

These files are populated and updated as the agent learns about the business through conversations and workflows.
