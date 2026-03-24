# Slack Plugin — Annotated Example

This is a simplified version of the Slack plugin at `{workspace}/plugins/slack/plugin.ts`. It demonstrates all major plugin capabilities: list view, sub-items, mutations, custom routes, user resolution, and filtering.

## What It Does

- **List view**: Channels and DMs sorted by latest activity, with type/unread badges and filters
- **Detail view**: Messages in a channel (via `querySubItems`) with avatars, names, and thread counts
- **Thread replies**: Custom route to fetch and display thread replies
- **Send messages**: Custom route + mutation to post messages and thread replies
- **Reactions**: Add/remove emoji reactions via mutations
- **Mark read**: Mark a channel as read via mutation
- **Mention resolution**: `<@UID>` mentions in message text resolved to display names server-side

## Key Design Decisions

1. **`slackGet()` helper** — Slim HTTP helper with auth, error checking, and response parsing.
2. **User cache with avatars** — A `Map<string, { name, avatar? }>` caches resolved user info to avoid N+1 API calls. Pending lookups are deduped via a Promise map.
3. **Channel type mapping** — Plugin uses friendly names ("dm", "channel") while Slack API uses ("im", "public_channel"). A `typeMap` bridges them.
4. **Sub-items for messages** — `querySubItems(channelId)` returns messages. The generic PluginDetail renders these as `MessageRow` components with avatars.
5. **Server-side mention resolution** — `resolveTextMentions()` replaces `<@UID>` with `@DisplayName` before returning message text, so the client doesn't need Slack-specific logic.
6. **`labelFn` for boolean badges** — The `isUnread` badge uses `labelFn` to show "unread" instead of raw "true".
7. **External URLs** — Each channel includes an `externalUrl` linking to Slack's web client.

## Source Code

```typescript
import type { Plugin, PluginItem, PluginContext } from "{inbox}/src/types/plugin.js"

const SLACK_BASE = "https://slack.com/api"

// ── API Helper ──────────────────────────────────────────────────────────────

async function slackGet<T>(method: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
  const token = process.env.SLACK_API_TOKEN ?? process.env.SLACK_BOT_TOKEN
  if (!token) throw new Error("SLACK_API_TOKEN is not set in workspace .env")
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString()
  const res = await fetch(`${SLACK_BASE}${method}${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as { ok: boolean; error?: string } & T
  if (!data.ok) throw new Error(`Slack API error (${method}): ${data.error}`)
  return data
}

// ── User Resolution ─────────────────────────────────────────────────────────
// Caches user ID → { name, avatar } to avoid repeated API calls.
// Pending lookups are deduped so concurrent resolves for the same user share one fetch.

const userCache = new Map<string, { name: string; avatar?: string }>()
const pendingLookups = new Map<string, Promise<{ name: string; avatar?: string }>>()

async function resolveUser(userId: string): Promise<{ name: string; avatar?: string }> {
  if (userCache.has(userId)) return userCache.get(userId)!
  if (pendingLookups.has(userId)) return pendingLookups.get(userId)!

  const lookup = (async () => {
    try {
      const result = await slackGet<{ user: { profile?: { display_name?: string; real_name?: string; image_48?: string }; name: string } }>(
        "/users.info", { user: userId }
      )
      const name = result.user.profile?.display_name || result.user.profile?.real_name || result.user.name
      const avatar = result.user.profile?.image_48
      const resolved = { name, avatar }
      userCache.set(userId, resolved)
      return resolved
    } catch {
      const fallback = { name: userId }
      userCache.set(userId, fallback)
      return fallback
    } finally {
      pendingLookups.delete(userId)
    }
  })()
  pendingLookups.set(userId, lookup)
  return lookup
}

// ── Mention Resolution ──────────────────────────────────────────────────────
// Resolve <@UID> mentions in message text to @DisplayName server-side.

async function resolveTextMentions(text: string): Promise<string> {
  const mentionPattern = /<@([A-Z0-9]+)(?:\|([^>]+))?>/g
  const matches = [...text.matchAll(mentionPattern)]
  if (matches.length === 0) return text
  const uniqueIds = [...new Set(matches.map((m) => m[1]))]
  const resolved = await Promise.all(uniqueIds.map(async (id) => [id, (await resolveUser(id)).name] as const))
  const nameMap = new Map(resolved)
  return text.replace(mentionPattern, (_, uid, displayName) => `@${displayName || nameMap.get(uid) || uid}`)
}

// ── Item Mapping ────────────────────────────────────────────────────────────

async function toChannelItem(ch: any, team?: string): Promise<PluginItem> {
  const channelType = ch.is_im ? "dm" : ch.is_mpim ? "group_dm" : ch.is_private ? "private_channel" : "channel"
  let channelName = ch.name ?? ch.id
  if (ch.is_im && ch.user) channelName = (await resolveUser(ch.user)).name

  return {
    id: ch.id,
    channelName,
    channelType,
    isUnread: (ch.unread_count ?? 0) > 0,
    unreadCount: ch.unread_count ?? 0,
    memberCount: ch.num_members,
    latestTs: ch.latest?.ts,
    latestText: ch.latest?.text ? await resolveTextMentions(ch.latest.text) : undefined,
    externalUrl: team ? `https://app.slack.com/client/${team}/${ch.id}` : undefined,
  }
}

async function toMessageItem(msg: any): Promise<PluginItem> {
  const user = msg.user ? await resolveUser(msg.user) : undefined
  const text = await resolveTextMentions(msg.text)
  return {
    id: msg.ts,
    ts: msg.ts,
    text,
    userName: user?.name,
    userAvatar: user?.avatar,
    userId: msg.user,
    isBot: !!msg.bot_id,
    threadTs: msg.thread_ts,
    replyCount: msg.reply_count ?? 0,
  }
}

// ── Plugin Definition ───────────────────────────────────────────────────────

const slackPlugin: Plugin = {
  id: "slack",
  name: "Slack",
  icon: "MessageSquare",
  emoji: "💬",
  auth: { integrationId: "slack", scope: "workspace" },

  fieldSchema: [
    { id: "channelName", label: "Channel", type: "text", listRole: "title" },
    { id: "latestText", label: "Latest message", type: "text", listRole: "subtitle" },
    { id: "latestTs", label: "Last active", type: "date", listRole: "timestamp" },
    {
      id: "channelType", label: "Type", type: "select",
      filter: { filterable: true, filterOptions: ["channel", "private_channel", "dm", "group_dm"], filterType: "select" },
      badge: { show: "always", variant: "secondary",
        colorFn: (v) => v === "dm" ? "bg-chart-2/20 text-chart-2" : "bg-foreground/10 text-foreground" },
    },
    {
      id: "isUnread", label: "Read status", type: "boolean",
      filter: { filterable: true, filterOptions: ["unread", "read"], filterType: "select" },
      badge: { show: "if-set", variant: "secondary",
        labelFn: (v) => v === "true" ? "unread" : "",
        colorFn: (v) => v === "true" ? "bg-chart-3/20 text-chart-3" : "" },
    },
    { id: "unreadCount", label: "Unread count", type: "number", badge: { show: "if-set", variant: "outline" } },
  ],

  async query(filters, cursor) {
    const typeMap: Record<string, string> = { channel: "public_channel", private_channel: "private_channel", dm: "im", group_dm: "mpim" }
    const typeFilter = filters["channelType"]
    const slackTypes = typeFilter
      ? typeFilter.split(",").map((t) => typeMap[t.trim()] ?? t.trim()).join(",")
      : "public_channel,private_channel,im,mpim"

    const result = await slackGet<{ channels: any[]; response_metadata?: { next_cursor?: string } }>(
      "/conversations.list", { types: slackTypes, limit: 100, exclude_archived: true, ...(cursor ? { cursor } : {}) }
    )

    let items = await Promise.all(result.channels.map((ch) => toChannelItem(ch)))
    const unreadFilter = filters["isUnread"]
    if (unreadFilter === "unread") items = items.filter((i) => i.isUnread)
    else if (unreadFilter === "read") items = items.filter((i) => !i.isUnread)
    items.sort((a, b) => parseFloat(b.latestTs as string ?? "0") - parseFloat(a.latestTs as string ?? "0"))

    return { items, nextCursor: result.response_metadata?.next_cursor || undefined }
  },

  async getItem(channelId) {
    const result = await slackGet<{ channel: any }>("/conversations.info", { channel: channelId, include_num_members: true })
    return toChannelItem(result.channel)
  },

  async querySubItems(channelId, _filters, cursor) {
    const result = await slackGet<{ messages: any[]; response_metadata?: { next_cursor?: string } }>(
      "/conversations.history", { channel: channelId, limit: 50, ...(cursor ? { cursor } : {}) }
    )
    const messages = result.messages.filter((m: any) => m.type === "message" && !m.subtype)
    const items = await Promise.all(messages.map(toMessageItem))
    return { items, nextCursor: result.response_metadata?.next_cursor || undefined }
  },

  async mutate(channelId, action, payload) {
    switch (action) {
      case "mark-read": {
        const history = await slackGet<{ messages: Array<{ ts: string }> }>("/conversations.history", { channel: channelId, limit: 1 })
        if (history.messages[0]?.ts) await slackGet("/conversations.mark", { channel: channelId, ts: history.messages[0].ts })
        break
      }
      case "reply": {
        const { text, threadTs } = (payload ?? {}) as { text?: string; threadTs?: string }
        if (!text) throw new Error("reply requires { text }")
        await slackGet("/chat.postMessage", { channel: channelId, text, ...(threadTs ? { thread_ts: threadTs } : {}) })
        break
      }
    }
  },

  routes(app, { getContext }) {
    app.post("/send", async (c) => {
      const { channel, text, threadTs } = await c.req.json()
      if (!channel || !text) return c.json({ error: "channel and text are required" }, 400)
      await slackGet("/chat.postMessage", { channel, text, ...(threadTs ? { thread_ts: threadTs } : {}) })
      return c.json({ ok: true })
    })

    app.get("/thread/:channel/:ts", async (c) => {
      const { channel, ts } = c.req.param()
      const result = await slackGet<{ messages: any[] }>("/conversations.replies", { channel, ts, limit: 100 })
      const items = await Promise.all(result.messages.filter((m: any) => m.type === "message").map(toMessageItem))
      return c.json({ items })
    })
  },
}

export default slackPlugin
```

## Env Vars Required

Add to `{workspace}/.env`:

```
SLACK_API_TOKEN=xoxp-...   # User token (preferred — has all scopes)
# or
SLACK_BOT_TOKEN=xoxb-...   # Bot token (standard operations only)
```

## What This Plugin Gets Automatically

Just by implementing the `Plugin` interface, the inbox gives you:
- Sidebar entry with 💬 emoji and "Slack" label
- Virtual-scrolled list view with channel type, read status, and unread count badges
- Filter popover with Type and Read status dropdowns
- Badge toggle menu (detail levels) for Type, Read status, and Unread count
- Message list detail view with avatars and resolved @mentions (via querySubItems)
- "Open in Slack" link in the detail header (via externalUrl field)
- Session linking support (any channel can be attached to an agent session)
- REST API at `/api/slack/*` (items, sub-items, mutate, thread, send)
