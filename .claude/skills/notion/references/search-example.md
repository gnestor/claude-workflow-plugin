# Notion Search Examples

## Example 1: Search for Marketing Pages

**User request:** "Find all marketing-related pages in Notion"

**Command:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts search "Marketing"
```

**Expected output:**
```json
{
  "success": true,
  "results": [
    {
      "id": "abc123...",
      "title": "Marketing Strategy 2025",
      "url": "https://notion.so/...",
      "type": "page",
      "last_edited": "2025-10-27T..."
    }
  ],
  "count": 1
}
```

## Example 2: Search for Databases

**User request:** "Show me the Product database"

**Command:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts search "Product"
```

## Example 3: Find Recent Notes

**User request:** "Find my notes from this week"

**Command:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts search "notes"
```

Then filter results by date in post-processing.
