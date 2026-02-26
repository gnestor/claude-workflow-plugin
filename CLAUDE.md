# Workflow Plugin

Workflow automation platform for Claude Code. Users install this plugin to create, run, and manage repeatable workflows — orchestrating skills, querying data, and connecting services through natural language.

## How It Works

- **Skills** (`skills/`) provide domain expertise as context. Each skill has a `SKILL.md` with instructions, `scripts/client.js` for API access, and optional `references/` for supporting data. Skills use `~~category` placeholders (e.g., `~~e-commerce`) to reference tool categories defined in `CONNECTORS.md`.
- **Client scripts** (`skills/{service}/scripts/client.js`) provide API access via CLI commands. Shared library at `lib/` handles authentication, HTTP requests, and output formatting.
- **Auth** (`lib/auth.js`) manages encrypted credentials at `~/.config/workflow-plugin/credentials.enc`. OAuth services use a deployed proxy at `https://auth.workflow-plugin.workers.dev`. Connect services with `node auth/setup.js {service}`.
- **Hooks** (`hooks/`) automate workspace maintenance. The Stop hook updates context files after meaningful work.
- **Workflows** (`workflows/` or user-specified location) are user-created automations. Each has a `PLAN.md` (created via plan mode) defining steps, parameters, and triggers. Tracked in `.claude/docs/WORKFLOWS.md`. After execution, the Stop hook updates PLAN.md inline to reflect what actually works. Gitignored — user-specific.
- **User context** (`.claude/docs/`, `.claude/rules/`) stores business info, preferences, and session history. Created by the `customize` skill, maintained by hooks.

## Executing Service Operations

Two patterns for interacting with external services:

**Client script commands** (standard operations):
```bash
node skills/gorgias/scripts/client.js list-tickets --status open --limit 10
node skills/shopify/scripts/client.js query '{ shop { name url } }'
node skills/google-workspace/scripts/client.js gmail-search --query "is:unread"
```

**Inline scripts** (complex orchestration):
```javascript
import { apiRequest, graphqlRequest } from './lib/http.js';
import { fetchAllPages } from './lib/pagination.js';

const orders = await graphqlRequest('shopify', '{ orders(first: 10) { nodes { id name } } }');
const tickets = await apiRequest('gorgias', '/tickets?status=open');
```

## Workflows

Workflows transform multi-step tasks into repeatable automations. They live in a directory with a `PLAN.md` and are tracked in `.claude/docs/WORKFLOWS.md`.

**Creating:** Use Claude Code's plan mode naturally. Step 0 is proposing a workflow directory. After approval, save the plan as PLAN.md and register in `.claude/docs/WORKFLOWS.md`.

**Running:** When a user's request matches a workflow's `triggers` or `description`, read its PLAN.md, resolve parameters, and execute the steps. Save output to `outputs/` or the specified destination.

**Learning:** The Stop hook compares execution to the plan and updates steps inline — PLAN.md always reflects the current best instructions. No separate notes sections.

**Discovering:** Check `.claude/docs/WORKFLOWS.md` when a request might match an existing workflow. Offer to run it instead of starting from scratch.

## Delegating to Subagents

Prefer delegating to subagents when the task is well-scoped and doesn't require conversation context or broad workspace awareness: API queries, data analysis, file exploration, content generation, and multi-step research.

Keep in the main context: tasks that need user interaction, depend on prior conversation, or require iterating on ambiguous requirements.

When delegating, tell subagents to include in their response:
- Key findings and data points discovered
- Anything that contradicts or updates existing workspace context
- Errors encountered and how they were resolved

This ensures the Stop hook can capture learnings that would otherwise be lost in the subagent's separate context.

## Contributing

See `README.md` for full details. Skills are context-only markdown with client scripts. Use `CONNECTORS.md` to map `~~category` placeholders to client scripts. Workflows are user-specific and never contributed upstream.
