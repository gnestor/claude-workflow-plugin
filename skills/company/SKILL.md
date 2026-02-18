---
name: company
description: >
  Company context including business overview, team structure, goals, products,
  and department-specific information. Activate when the user asks about company
  operations, team members, business strategy, department workflows, or needs
  context about the business.
---

# Company Context

This skill provides business context for the agent. Replace the example data below with your own business information.

## Business Overview

<!-- Replace with your business information -->

**Business name:** Acme Co
**Industry:** E-commerce / Retail
**Founded:** 2020
**Products/Services:** Consumer goods
**Description:** A brief description of what your business does, your value proposition, and what makes you unique.

> **Example (Hammies):** Hammies is a retro fashion brand specializing in classic styles from the 1960s and 70s. Founded in 2017. Best known for shorts and bell bottoms. Grew from $0 to $3M in first 4 years.

## Website & Social

- Website: https://www.example.com
- Instagram: https://www.instagram.com/example
- TikTok: https://www.tiktok.com/@example

> **Example (Hammies):**
> - Website: https://www.hammies.com
> - Instagram: https://www.instagram.com/hammiesshorts
> - TikTok: https://www.tiktok.com/@hammiesshorts

## Team

### Internal Team

<!-- List your core team members with roles and responsibilities -->

- **[Name]** (@handle): [Title]. [Responsibilities].
- **[Name]** (@handle): [Title]. [Responsibilities].

> **Example (Hammies):**
> - **Grant Nestor** (@Grant Nestor): Founder and CEO. Operations, website, finance, partnerships.
> - **Erin Plaster** (@ELP): Development and production manager.
> - **Daisy Weber** (@daisy w): Content strategist. Plans content calendar, writes creative briefs.

### External Partners

<!-- List contractors, agencies, and service providers -->

- **[Name/Company]** (@handle): [Role]. [Description].

> **Example (Hammies):**
> - **Ryan Bukstein** (@Ryan Bukstein): Marketing consultant, owner of SMPL Brand Consulting. Develops marketing strategy.
> - **Jake Ryder** (@Jake-Ryder): Media buyer. Manages Meta and Google ad accounts.
> - **Distribution Management (DM)**: 3PL provider. Fulfillment center in Dallas, TX.

## Current State

### Seasonality

- **High season:** [Months]
- **Slow season:** [Months]

> **Example (Hammies):** High season: March-August. Slow season: September-February.

### Target Customer

<!-- Describe your ideal customer profile -->

[Demographics, psychographics, interests, values]

> **Example (Hammies):** Vintage lover, hip, colorful, outdoorsy, fun-loving, creative, free-thinking.

### Goals

<!-- List your current business goals in priority order -->

1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

> **Example (Hammies):**
> 1. Reduce expenses (ad spend, COGS, contractor costs)
> 2. Invest in organic social to offset ad spend
> 3. Invest in AI to automate workflows and reduce labor costs
> 4. Expand customer base with new personas
> 5. Improve inventory planning and health

## Reference Files

Detailed context is stored in `references/`:

| File | Description |
|------|-------------|
| [overview.md](references/overview.md) | Business overview, history, and current state |
| [team.md](references/team.md) | Team directory with roles and contact info |
| [goals.md](references/goals.md) | Goals, KPIs, and trajectory |
| [products.md](references/products.md) | Product catalog and details |

Add additional reference files as your business context grows:

| File | Description |
|------|-------------|
| `references/marketing.md` | Marketing strategy and channels |
| `references/finance.md` | Financial context and metrics |
| `references/operations.md` | Operations and logistics |
| `references/customer-service.md` | Support and customer experience |

These files are populated and updated as the agent learns about the business through conversations and workflows.
