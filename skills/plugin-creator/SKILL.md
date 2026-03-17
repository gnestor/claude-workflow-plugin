---
name: plugin-creator
description: Creates inbox source plugins that connect new data sources to the unified inbox. Use when user says "create a plugin for X", "add X to the inbox", "connect X to inbox", "build an inbox plugin for X", or wants to add a new data source to the inbox app.
---

# Inbox Plugin Creator

Creates a TypeScript `SourcePlugin` that appears as a new tab in the unified inbox.

Plugins live at `{workspace}/inbox-plugins/{id}.ts`. The inbox server scans this directory on startup and auto-generates REST routes for each plugin.

## SourcePlugin Interface

```typescript
// packages/inbox/src/types/plugin.ts
export interface SourcePlugin {
  id: string          // Unique slug used in API routes and tab navigation
  name: string        // Display name shown in the nav tab
  icon: string        // Lucide icon name (e.g. "MessageSquare", "Github", "ShoppingCart")
  fieldSchema: FieldDef[]

  query(filters: Record<string, string>, cursor?: string): Promise<QueryResult>
  mutate(id: string, action: string, payload?: unknown): Promise<void>

  // Optional: sub-items (e.g. messages within a channel)
  querySubItems?(itemId: string, filters: Record<string, string>, cursor?: string): Promise<QueryResult>

  // Optional: custom detail view layout (auto-generated from fieldSchema if omitted)
  detailSchema?: WidgetDef[]
}

export interface FieldDef {
  id: string            // Dot-path into the item object, e.g. "status", "author.name"
  label: string
  type: "text" | "html" | "markdown" | "date" | "number" | "boolean" | "select" | "multiselect"
  listRole?: "title" | "subtitle" | "timestamp" | "hidden"  // Inferred from type if omitted
  badge?: { show: "always" | "if-set"; variant?: "default" | "secondary" | "destructive" | "outline" }
  filter?: { filterable: true; filterOptions?: string[] | (() => Promise<string[]>) }
}

export interface QueryResult {
  items: Array<{ id: string; [key: string]: unknown }>
  nextCursor?: string
}
```

**Auth pattern:** Read credentials from `process.env` (sourced from workspace `.env`). No credential storage in plugin files.

## Workflow

### Step 1 — Research the API

Web search for: `{source} API documentation`, `{source} REST API authentication`, `{source} API rate limits`

Identify:
- Base URL and authentication method (API key, OAuth token, Bearer token)
- Primary list/search endpoint (what returns the "items" that appear in the inbox)
- Key fields on each item (id, title/name, timestamps, status, author, body)
- Available actions (archive, mark read, reply, label, etc.)
- Pagination style (cursor, offset, or page-based)
- Rate limits

### Step 2 — Plan the plugin

Before writing code, define:
- **Items**: What objects from this source appear in the inbox? (e.g. issues, orders, messages)
- **Field mapping**: For each API field, choose `type`, `listRole`, whether to badge, whether to filter
  - `listRole: "title"` → primary text in list item
  - `listRole: "subtitle"` → secondary line
  - `listRole: "timestamp"` → date shown in list
  - `listRole: "hidden"` → available in detail view only
- **Icon**: Choose a Lucide icon that matches the source (search lucide.dev)
- **Actions**: What mutations make sense? (archive, snooze, mark-done, reply)
- **Env vars**: What environment variables are needed in `{workspace}/.env`?

Show the user the mapping plan and ask for confirmation before writing code.

### Step 3 — Generate TypeScript

Create `{workspace}/inbox-plugins/{id}.ts`:

```typescript
// Example structure — adapt to the actual API
import type { SourcePlugin } from '../packages/inbox/src/types/plugin'

const BASE_URL = 'https://api.example.com'

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.EXAMPLE_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export default {
  id: '{id}',
  name: '{name}',
  icon: '{LucideIconName}',

  fieldSchema: [
    { id: 'title', label: 'Title', type: 'text', listRole: 'title' },
    { id: 'status', label: 'Status', type: 'select', listRole: 'subtitle',
      badge: { show: 'always' },
      filter: { filterable: true, filterOptions: ['open', 'closed'] } },
    { id: 'created_at', label: 'Created', type: 'date', listRole: 'timestamp' },
    { id: 'body', label: 'Body', type: 'markdown', listRole: 'hidden' },
  ],

  async query(filters, cursor) {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    if (filters.status) params.set('status', filters.status)

    const res = await fetch(`${BASE_URL}/items?${params}`, { headers: getHeaders() })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()

    return {
      items: data.items.map((item: unknown) => ({ id: item.id, ...item })),
      nextCursor: data.next_cursor ?? undefined,
    }
  },

  async mutate(id, action, payload) {
    if (action === 'archive') {
      await fetch(`${BASE_URL}/items/${id}/archive`, {
        method: 'POST',
        headers: getHeaders(),
      })
    }
  },
} satisfies SourcePlugin
```

### Step 4 — Save and activate

1. Write the plugin to `{workspace}/inbox-plugins/{id}.ts`
2. Add required env vars to `{workspace}/.env` (append, don't overwrite)
3. Tell the user:
   - Which env vars to fill in (if not already set)
   - Restart command: `kill -9 $(lsof -ti :3002) && cd packages/inbox && npm run dev:server -- --workspace ../agent`
   - The plugin appears as a new tab in the inbox automatically on restart

## Common Patterns

**Sub-items** (e.g. Slack channel → messages, GitHub repo → PRs):
```typescript
async querySubItems(itemId, filters, cursor) {
  // fetch items within the parent item
}
```

**Async filter options** (fetch valid values from the API):
```typescript
filter: {
  filterable: true,
  filterOptions: async () => {
    const res = await fetch(`${BASE_URL}/labels`, { headers: getHeaders() })
    const data = await res.json()
    return data.labels.map((l: { name: string }) => l.name)
  }
}
```

**HTML body** (sanitized by inbox renderer):
```typescript
{ id: 'body_html', label: 'Body', type: 'html', listRole: 'hidden' }
```
