# Change Classification Rules

Rules for separating generic (shareable) plugin improvements from company-specific (private) changes.

## Classification Table

| File pattern | Classification | Reason |
|-------------|---------------|--------|
| `skills/*/SKILL.md` (except brand-voice) | Generic | Skill instruction improvements help all users |
| `skills/*/references/*.md` | Generic | Workflow examples and reference data |
| `skills/brand-voice/SKILL.md` | Company-specific | Contains user's brand guidelines |
| `hooks/hooks.json` | Generic | Self-learning prompt improvements |
| `hooks/*.sh` | Generic | Hook script improvements |
| `commands/setup.md` | Generic | Onboarding improvements |
| `CONNECTORS.md` | Generic | New connector options |
| `skills/*/scripts/client.js` | Generic | Client script bug fixes and features |
| `lib/*.js` | Generic | Shared library improvements |
| `lib/services.json` | Generic | Service registry updates |
| `auth/setup.js` | Generic | Auth setup improvements |
| `README.md` | Mixed | See below |
| `.claude-plugin/plugin.json` | Generic | Plugin metadata |
| `.claude/docs/*` | Company-specific | User's business context |
| `.claude/rules/*` | Company-specific | User's preferences |
| `workflows/*` | Company-specific | User's personal automations and outputs |
| `.claude/docs/WORKFLOWS.md` | Company-specific | User's workflow registry |
| `.gitignore` | Generic | Build/ignore rules |

## Mixed Files

### README.md

README.md contains both generic plugin documentation and user-personalized sections:

- **Generic**: Installation, Commands, Skills table, Connectors, Hooks, Contributing, Directory Structure
- **Company-specific**: Agent Identity section (personalized during setup)

When contributing README.md changes, check if the diff touches the Agent Identity section. If so, exclude the file or extract only the generic parts.

## Classification Logic

```
For each changed file:
  1. Match against the classification table above
  2. If "Company-specific" → exclude from contribution
  3. If "Generic" → include in contribution
  4. If "Mixed" → inspect the diff to separate generic from company-specific hunks
  5. If not in the table → ask the user whether to include
```

## Examples

### Generic improvement (include)

```diff
# skills/gorgias/references/workflow-examples.md
+ ## Example 9: Search by Customer Email
+
+ **User says:** "Find all tickets from customer@example.com"
+
+ **Steps:**
+ 1. Use `~~customer-support` `search_tickets` tool with email filter
```

### Company-specific change (exclude)

```diff
# .claude/docs/COMPANY.md
+ **Business name:** Acme Store
+ **Industry:** Fashion / E-commerce
```

### Skill fix (include)

```diff
# skills/seo/SKILL.md
- opportunity_score = (impressions x (1 - current_ctr) x position_weight) / 1000
+ opportunity_score = (impressions x (1 - current_ctr) x position_weight x intent_multiplier) / 1000
```
