---
name: context-management
description: Collect, evaluate, and update context pages in context/. Handles entity identification, qmd and grep search for related knowledge, value scoring for backfill prioritization, and structured context page writes. Use whenever gathering context for an email or task, running a backfill session, or creating/updating a context page.
---

# Context Management

Consolidates all operations on `context/` — reading existing knowledge, evaluating whether new content is worth capturing, and writing structured context pages.

The knowledge base has two layers in a single directory tree:
- `context/*.md` — curated summaries (entity pages, decisions, timelines, cross-links)
- `context/gmail/{thread-id}.md` — raw email threads (full content, lossless provenance)
- `context/notion/{page-id}.md` — raw Notion pages (full content, lossless provenance)

Both layers are indexed in the `hammies-context` qmd collection. Curated pages rank higher for entity-identity queries; raw sources rank higher for specific factual lookups. **Raw source files are written exclusively by the context-backfill workflow — do not write to `context/gmail/` or `context/notion/` from within a session.**

---

## Data Source Guide

Choose the right source for each task:

| Task | Use |
|------|-----|
| Find curated context about an entity | **qmd** — `qmd query` against `hammies-context`, then `grep` for exact email/domain |
| Find raw email or Notion source by thread/page ID | **qmd** or direct file: `context/gmail/{id}.md`, `context/notion/{id}.md` |
| Find related Gmail threads by sender | **BigQuery** — SQL, fast, no rate limits |
| Count threads from a contact | **BigQuery** |
| Discover valuable contacts to backfill | **BigQuery** (`valuable-threads.sql` pattern) |
| Search Notion pages by title or content | **BigQuery** (`content_markdown` column available) |
| Read full email body for drafting/assessing | **Gmail API** — `gmail-client.ts get-thread <id>` |
| Semantic search across all indexed knowledge | **qmd** — `qmd query "<question>"` hybrid search (best quality) |
| Find exact wording / full source text | **qmd** or direct read of `context/gmail/` or `context/notion/` file |
| Create Gmail draft or send | **Gmail API** |
| Read full Notion page content | **BigQuery first** (if `content_markdown` is populated); **Notion API** as fallback |
| Create or update a Notion task/page | **Notion API** |

---

## Collect (Read Context)

Use at the start of any email or task processing session to load relevant prior knowledge.

### Step 1 — Identify the entity

From an **email**: extract from the `From:` header:
- `sender_name` (display name)
- `sender_email` (address)
- `sender_domain` (domain part after `@`)

From a **Notion task**: use the task title keywords as the entity name.

Infer `entity_type`:
- `company` — if `sender_domain` matches a context file (e.g., `distributionmgmt.com` → `context/distribution-management.md`)
- `person` — individual at a known company (look up `sender_email` or name in context/)
- `topic` — infer from subject line keywords if no contact match

### Step 2 — Search context pages

Use qmd for semantic discovery, grep for exact match confirmation:

```bash
# Primary: hybrid search (best quality — expansion + BM25 + vector + reranking)
qmd query "<sender_name> OR <sender_domain>" -c hammies-context
```

If qmd returns no results or low-confidence matches, also run:

```bash
# Exact match: confirm email/domain presence in specific files
grep -ri "<sender_domain>" context/*.md -l
```

Combine results, deduplicate. Pattern note: `context/*.md` = curated pages only; `context/**/*.md` includes raw sources.

For each matched curated file:
- Read the file
- Extract the one-line summary (the `>` blockquote line at the top)
- Note the frontmatter `tags`
- Follow `[text](link.md)` references in `## Related` **one level deep** for additional context

Return: list of matched files + summaries + tags.

### Step 3 — Search Gmail for related threads (BigQuery)

```bash
BQ="deno run --allow-all .claude/skills/google/bigquery/scripts/bq-client.ts"
$BQ query "
  SELECT DISTINCT threadId, from_raw, subject, msg_date, snippet
  FROM \`hammies.gmail.messages_headers\`
  WHERE (LOWER(from_raw) LIKE '%<sender_email>%'
      OR LOWER(from_raw) LIKE '%@<sender_domain>%')
    AND 'TRASH' NOT IN UNNEST(labelIds)
    AND 'SPAM' NOT IN UNNEST(labelIds)
  ORDER BY msg_date DESC
  LIMIT 5
"
```

Use the Gmail API only to fetch full thread body after identifying which thread(s) to read:
```bash
GMAIL="deno run --allow-all .claude/skills/google/gmail/scripts/gmail-client.ts"
$GMAIL get-thread <threadId>
```

If the thread is already indexed, prefer the local file: `context/gmail/{threadId}.md` — it has clean formatting and is immediately available.

### Step 4 — Search Notion for related tasks/pages

**Real-time** (for interactive inbox sessions — use API for current data):
```bash
NOTION="deno run --allow-all .claude/skills/notion/scripts/notion-client.ts"
$NOTION search "<entity_name>"
# Filter results to Tasks db: fd81d546-0ca5-4452-8171-15bce4957403
```

**Batch discovery** (for backfill runs — use BigQuery):
```bash
$BQ query "
  SELECT page_id, title, content_markdown, url
  FROM \`hammies.notion.pages\`
  WHERE LOWER(title) LIKE '%<entity_name>%'
     OR LOWER(content_markdown) LIKE '%<entity_name>%'
  LIMIT 5
"
```

Read `content_markdown` directly from BigQuery results. Fall back to `notion-client.ts notion-to-md <page-id>` only when following links to pages not in the BigQuery results.

### Step 5 — Look up email routing

After finding the sender's context page, check for a `## Workflows` section:

```bash
grep -A 20 "^## Workflows" context/<entity-file>.md
```

Parse the Workflows table — try to match the current email:
- `email` trigger rows: `from:` is a case-insensitive substring match on sender address; `subject:` is a case-insensitive substring match on the subject line
- Return the matched workflow file path (or inline action like `task`/`skip`/`assess`)
- Return `null` if no match → caller falls back to `config.yaml`

---

## Evaluate Value (for context-backfill batch runs)

Criteria for deciding whether a contact or Notion page is worth processing. These mirror the logic in `valuable-threads.sql` and `valuable-docs.sql` — the SQL files are the optimized batch implementation; this is the canonical description.

### Email threads worth processing

**Include if:**
- Sender has > 1 thread in Gmail (ongoing relationship, not a one-off)
- Not an automated sender — exclude any address matching: `noreply@`, `no-reply@`, `notifications@`, `updates@`, `mailer-daemon@`, `donotreply@`, `do-not-reply@`, `automated@`, `postmaster@`, or domains: `@paypal.com`, `@stripe.com`, `@shopify.com`, `@klaviyo.com`, `@gorgias.com`, `@slack.com`, `@notion.so`, `@shipmonk.com`, `@zoom.us`, `@later.com`, `@calendly.com`, `@air.inc`, `@triplewhale.com`, plus the full list in `valuable-threads.sql`
- Not a Hammies internal address: `grant@hammies.com`, `grant@hammiesshorts.com`, `grantnestor@gmail.com`, `sarah@hammies.com`, `erin@hammies.com`
- Subject doesn't match transactional patterns: "Your order", "Payment received", "Invoice from", "Order #", "Shipping confirmation", "Receipt from", "has been shipped"

**Priority scoring** (higher = process first):
- `total_threads` count: more threads = higher value
- Last message recency: more recent = higher priority
- Already in `context/` but `last_updated` > 90 days ago: still process

### Notion pages worth processing

Score pages before processing (minimum 15 pts to include):

| Criterion | Points |
|-----------|--------|
| Content length > 500 chars | 10 |
| Content length > 2000 chars | 25 (replaces 10) |
| Content length > 5000 chars | 40 (replaces 25) |
| Tag: `operations`, `finance`, `production`, `sales`, `marketing`, or `development` | +5 per tag (max 20) |
| Database: Tasks | +15 |
| Database: Notes | +10 |
| Database: Projects | +10 |
| Database: Calendar | +5 |

---

## Update (Write Context)

### Key Principles

- **Context files are the hub**: They link to Notion pages, email threads, and other sources — the agent discovers context by searching `context/` and following links
- **Capture anything useful**: The test for whether something gets a context page is: "Will this help the agent answer questions or perform tasks for Hammies in the future?" Not limited to predefined entity types — products, POs, marketing events, vendor processes, pricing structures, seasonal patterns are all fair game.
- **Projects > individual tasks**: Multi-task efforts get context pages; individual tasks are referenced from the project/entity page
- **Sources section**: Every context page should have a `## Sources` section linking to Notion pages, email threads, Google Docs, and other URLs (provenance — where we learned this)
- **Resources section**: Links to tools, documents, spreadsheets, notebooks, and other assets the agent can follow to do work. When processing any content, extract all URLs and add relevant ones to the Resources section of the appropriate context page.
- **Timeline section**: Add `## Timeline` for vendors, partners, key contacts, and projects when the entity has distinct phases, milestones, or a long history. Skip for entities with only routine operational activity.
- **Read before updating**: Before modifying an existing context page, read it first. Only add information not already present. Do not reorganize or rewrite existing content unless it's factually wrong.

### When to create vs. update

- **Create**: entity has no existing context page and passes value evaluation
- **Update**: existing page found; add only new information — do not reorganize, rewrite, or remove existing content unless it's factually wrong

The test for creating a new page: Will this entity accumulate context over time, or is it a one-off detail? One-off details belong on an existing page. Entities that will be referenced from multiple pages or that connect multiple other entities deserve their own page.

### Page format

Follow `context/SCHEMAS.md` for tag taxonomy, section ordering, and per-entity-type required fields.

After any write:
- Update `last_updated` in frontmatter to today's date
- Add cross-links in `## Related` if new relationships were identified
- Log the update in `context-backfill/manifest.json` or `email-manifest.json` as applicable

### Entity Search (bootstrap for new pages)

Run this **once when creating a new context page** to seed its Sources and Resources sections with links from Gmail, Notion, and Google Drive. Skip if the page already has a Sources section.

**Step 1: BigQuery batch search (Gmail + Notion)**

Edit `workflows/context-backfill/entity-search.sql` with the entity, then run:

```bash
BQ_CLI="deno run --allow-all .claude/skills/google/bigquery/scripts/bq-client.ts"
SQL=$(cat workflows/context-backfill/entity-search.sql)
$BQ_CLI query "$SQL"
```

Searches Gmail headers and Notion titles + content in one query. Returns top 10 results per entity/source with `match_type`.

**Step 2: Drive API search**

```bash
DRIVE_CLI="deno run --allow-net --allow-env --allow-read .claude/skills/google/drive/scripts/drive-client.ts"
$DRIVE_CLI search "name contains '<entity name>' or fullText contains '<entity name>'" --limit 10
```

**What to capture from results:**
- **Sources** (provenance): Notion page links, key email thread subjects, Google Drive doc links → add to `## Sources`
- **Resources** (working assets): spreadsheets, notebooks, Figma files, dashboards with descriptions → add to `## Resources`

**Discovery queue**: New entities that surface during entity search but don't yet have context pages → add to `workflows/context-backfill/discovery-queue.json` rather than recursively processing them.

### Workflows section

Add a `## Workflows` section to company and person pages when automation rules exist. Place it **after `## Details`, before `## Timeline`**.

```markdown
## Workflows

Trigger-based automation rules. Each maps an event pattern to a reusable workflow.

| Trigger | Pattern | Workflow |
|---------|---------|----------|
| `email` | `from: @distributionmgmt.com, subject: "Ecommerce Forecast Needed"` | [DM Ecommerce Forecast](../workflows/email-triage/rules/dm-ecommerce-forecast.md) |
| `email` | `from: @distributionmgmt.com, subject: "Retail Forecast Needed"` | [DM Retail Forecast](../workflows/email-triage/rules/dm-retail-forecast.md) |
| `email` | `from: kelly.hoffner@distributionmgmt.com` | `task` — tags: `finance`, assignee: Grant |
```

**Pattern semantics for `email` trigger**:
- `from:` — case-insensitive substring match on the full sender address (name + email)
- `subject:` — case-insensitive substring match on the subject line
- Multiple conditions in one row are ANDed

**Action values**:
- Path to a workflow file (relative to repo root) — standalone and can be invoked directly outside of email-triage
- Inline shorthand: `task`, `skip`, `assess` (same semantics as email-triage config.yaml)

**Future trigger types**: `notion` (page updated), `slack` (message pattern), `webhook` (external event). The table format supports any value in the Trigger column.

### Session End

After updating context pages in a session, the Stop hook will prompt you when context/ has uncommitted changes. At that point:

1. Ensure all new knowledge is captured (any new entities, decisions, or relationships discovered this session that haven't been written yet)
2. Commit all session changes: `git add -A && git commit -m "session: <brief description of what was learned or done>"`
3. The commit message should summarize the session (e.g., "session: add Sourcing Guru context, update DM workflow")

---

## CLI Reference

```bash
# BigQuery
BQ="deno run --allow-all .claude/skills/google/bigquery/scripts/bq-client.ts"
$BQ query "<sql>"

# Gmail API
GMAIL="deno run --allow-all .claude/skills/google/gmail/scripts/gmail-client.ts"
$GMAIL get-email <message-id>
$GMAIL get-thread <thread-id>
$GMAIL search "<query>" --max 10
$GMAIL create-draft "<to>" "Re: <subject>" "<body>" --thread-id <id> --in-reply-to "<message-id>"

# Notion API
NOTION="deno run --allow-all .claude/skills/notion/scripts/notion-client.ts"
$NOTION search "<query>"
$NOTION notion-to-md <page-id>
$NOTION create-database-page <db-id> "Title" "$BODY"
$NOTION update-page-properties <page-id> '<json>'

# Google Drive API
DRIVE="deno run --allow-net --allow-env --allow-read .claude/skills/google/drive/scripts/drive-client.ts"
$DRIVE search "name contains '<name>'" --limit 10

# qmd (knowledge index — covers all of context/)
qmd search "<keyword>" -c hammies-context    # BM25 keyword search (fast, exact terms)
qmd vsearch "<query>" -c hammies-context     # vector similarity search
qmd query "<question>" -c hammies-context    # full hybrid: expansion + BM25 + vector + reranking (best quality)
qmd update                                   # re-index after context-backfill adds new files
qmd embed                                    # generate vector embeddings for newly indexed files
# Or use the qmd_deep_search MCP tool for semantic search from within Claude
```
