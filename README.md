# workflow-plugin

Agent infrastructure for the [Hammies inbox](https://github.com/gnestor/agent-inbox) workspace.

## Skills

### context-management

Maintains a two-layer knowledge base in the agent workspace:
- `context/*.md` — curated entity pages (customers, vendors, products, events, etc.)
- `context/{source}/{id}.md` — raw source files (Gmail threads, Notion pages)

Queries context with grep and semantic search before starting work, updates pages after sessions to accumulate knowledge over time.

### workflow

Creates and executes reusable multi-step automations. Workflows live in `workflows/{name}/PLAN.md` and are tracked in `.claude/docs/WORKFLOWS.md`. Plans evolve inline after each run to reflect what actually works.

Modeled on the [skill-creator](https://github.com/anthropics/claude-plugins-official) pattern — workflows are like non-deterministic scripts, skills are like non-deterministic modules.

### plugin-creator

Creates TypeScript `SourcePlugin` files that add new data sources to the inbox app. Given a data source name, the skill:
1. Researches the API (endpoints, auth, pagination)
2. Maps fields to the SourcePlugin interface
3. Generates a TypeScript implementation
4. Saves to `{workspace}/inbox-plugins/`

The inbox server auto-discovers plugins in that directory on startup.

## Hooks

A single Stop hook evaluates whether meaningful work was done. If so:
1. Updates workspace context files (skills, company docs, todos, history, workflows, entity pages)
2. Commits via `/commit` from the commit-commands skill

## Installation

### Via Claude Code

```bash
claude install gnestor/claude-workflow-plugin
```

### With Inbox App

The inbox app loads this plugin automatically via the Claude Agent SDK. See `packages/inbox/server/lib/session-manager.ts`.

### Companion Plugins

Install these alongside for full functionality:

```bash
claude install anthropic-agent-skills
claude install claude-plugins-official/skill-creator
claude install claude-plugins-official/commit-commands
```

## SourcePlugin Interface

Plugins implement:

```typescript
export interface SourcePlugin {
  id: string
  name: string
  icon: string  // Lucide icon name
  fieldSchema: FieldDef[]
  query(filters, cursor?): Promise<{ items, nextCursor? }>
  mutate(id, action, payload?): Promise<void>
  querySubItems?(itemId, filters, cursor?): Promise<{ items, nextCursor? }>
}
```

See `packages/inbox/src/types/plugin.ts` for the full spec.
