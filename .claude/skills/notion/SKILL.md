---
name: notion
description: This skill should be used to access and interact with Notion workspace functionality including searching pages, databases, retrieving content, creating pages, and adding comments. Activate when the user mentions Notion, asks to search Notion, create Notion pages, query databases, or reference Notion content. Supports Markdown formatting for all content. Can scan and cache database schemas for improved query translation.
---

# Notion Workspace Access

## Purpose

This Skill enables direct interaction with Notion workspace using the Notion API. It provides search, retrieval, creation, and query capabilities without requiring an MCP server.

## When to Use

Activate this Skill when the user:
- Mentions "Notion" or asks to work with Notion content
- Wants to search for pages or databases: "find my Marketing page in Notion"
- Needs to retrieve page content: "read the Sales Strategy page"
- Wants to create new pages: "create a new meeting notes page"
- Needs to query databases: "show me all products in the inventory database"
- References Notion URLs or page IDs
- Asks to add comments to Notion pages

## When NOT to Use

- **Shopify data**: Use shopify skill for orders, products, inventory
- **Cross-source queries**: Use postgresql skill when joining Notion data with other sources
- **Website analytics**: Use google-analytics skill for traffic and behavior data

## Setup

1. Go to [notion.so/my-integrations](https://notion.so/my-integrations)
2. Click **New integration**
3. Name it and select your workspace
4. Copy the **Internal Integration Secret**
5. Share the Notion pages/databases you want the agent to access with the integration
6. Save to `.env`:
   - `NOTION_API_TOKEN=your-token`

## Markdown Support

**All page creation and update operations automatically convert Markdown to formatted Notion blocks** using a custom parser. Supported formats include:
- Headings (# H1, ## H2, ### H3)
- **Bold**, *italic*, ~~strikethrough~~, and `inline code`
- Bulleted and numbered lists (including nested)
- To-do items (- [ ] and - [x])
- Code blocks with language syntax
- Links [text](url)
- **Page mentions** using `@[text](page-id)` syntax
- Blockquotes (>)
- Dividers (---)
- **Callouts** (emoji or Obsidian syntax)
- **Tables** (| col | col |)
- **Toggle blocks** (`<details>`)
- **Images** (![alt](url))

The script automatically handles Notion's 100-block-per-request limit by batching blocks.

### Page Mentions

Use the special `@[text](page-id)` syntax to create clickable page mentions in Notion:

```markdown
- @[Review inventory](2e7273f5-ffd9-8047-9bd0-c3f0c91909e4)
- Check @[My Task](abc12345-def6-7890-abcd-ef1234567890) for details
```

This creates Notion page mentions that link directly to the referenced pages.

### Callouts

Two callout formats are supported:

**Emoji format:**
```markdown
> 👍 Success
>
> This is a success message.
```

**Obsidian format** (auto-assigns emoji and color based on type):
```markdown
> [!warning] Be careful
> This is a warning message.
```

Supported Obsidian types: `info`, `note`, `tip`, `warning`, `danger`, `error`, `bug`, `example`, `quote`, `success`, `question`, `todo`, `failure`, `abstract`, `summary`.

### Tables

Standard markdown tables are converted to Notion tables:

```markdown
| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |
| Cell 3 | Cell 4 |
```

### Toggle Blocks

HTML `<details>` tags become Notion toggle blocks:

```markdown
<details>
<summary>Click to expand</summary>
Hidden content here.

- Supports nested lists
- And other blocks
</details>
```

### Images

Standalone images on their own line:

```markdown
![Alt text](https://example.com/image.png)
```

## Available Operations

### 1. Search Workspace

Search for pages and databases by title or content.

**Usage:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts search "Marketing Strategy"
```

### 2. Get Page Content

Retrieve full content of a specific page by ID or URL.

**Usage:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts get-page <page-id>
```

### 3. Query Database

Query a database and retrieve records with filtering.

**Usage:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts query-database <database-id>
```

### 4. Create Page

Create a new page in Notion with title and content.

**Usage:**
```bash
# Create as child of another page
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts create-page <parent-id> "Page Title" "Page content here"

# Create in a database (supports Markdown formatting)
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts create-database-page <database-id> "Page Title" "Markdown content here"
```

**Note:** The `create-database-page` command converts Markdown to properly formatted Notion blocks (headings, lists, bold, italic, etc.) and automatically handles the 100-block-per-request limit by batching.

### 5. Update Page

Append content to an existing page (supports Markdown formatting).

**Usage:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts update-page <page-id> "Markdown content to append"
```

**Note:** The `update-page` command converts Markdown to properly formatted Notion blocks and appends them to the end of the page. Handles 100-block-per-request limit automatically.

### 6. Add Comment

Add a comment to a specific page.

**Usage:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts add-comment <page-id> "Comment text"
```

### 7. List Databases

List all databases in the workspace.

**Usage:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts list-databases
```

### 8. Get Database Schema

Get detailed schema information for a specific database, including all properties and their types.

**Usage:**
```bash
deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts get-database-schema <database-id>
```

### 9. Scan Databases

Scan all databases in the workspace and save their schemas to static files for reference. This creates a local cache of database structures that can be used to understand database schemas without repeatedly querying the API.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-write .claude/skills/notion/scripts/notion-client.ts scan-databases
```

**Output:**
- Saves schema files to `.claude/skills/notion/references/schemas/`
- Each file is named `{database_title}_{database_id}.json`
- Contains database properties, types, and configurations

**Schema file structure:**
```json
{
  "id": "fd81d546-0ca5-4452-8171-15bce4957403",
  "title": "Tasks",
  "url": "https://www.notion.so/fd81d5460ca54452817115bce4957403",
  "properties": [
    {
      "name": "Priority",
      "type": "select",
      "config": {
        "options": [
          {"name": "Today", "color": "red"},
          {"name": "This Week", "color": "yellow"}
        ]
      }
    }
  ]
}
```

**When to use:**
- After adding new databases to the workspace
- When schema files are missing or outdated

### 10. Convert Markdown to Notion Blocks

Convert markdown text to Notion API block format. Supports page mentions with `@[text](page-id)` syntax.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/notion/scripts/notion-client.ts md-to-notion "## Heading
- Item with @[Task Link](abc12345-def6-7890-abcd-ef1234567890)"
```

**Output:** JSON array of Notion blocks ready for API use.

### 11. Convert Notion Page to Markdown

Fetch a Notion page and convert all blocks to markdown. Page mentions are converted to `@[text](page-id)` syntax.

**Usage:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/notion/scripts/notion-client.ts notion-to-md <page-id>
```

**Output:** JSON with `markdown` field containing the converted content.

## Instructions

When a user requests Notion-related operations:

1. **Identify the operation type**:
   - Search → use `search` command
   - Retrieve content → use `get-page` command
   - Query data → use `query-database` command
   - Create content → use `create-page` command
   - Add feedback → use `add-comment` command
   - List databases → use `list-databases` command
   - Get database schema → use `get-database-schema` command
   - Cache all database schemas → use `scan-databases` command

2. **Look up database IDs and schemas from references**:
   - **ALWAYS check `.claude/skills/notion/references/schemas/` FIRST** to find databases by name
   - Schema files are named `{database_name}_{database_id}.json` (e.g., `tasks_fd81d546.json`)
   - Use `Glob` to search for databases: `Glob(".claude/skills/notion/references/schemas/*tasks*.json")`
   - Each schema file contains:
     - `id`: The full database UUID to use in API calls
     - `title`: The database name
     - `url`: Direct link to the database in Notion
     - `properties`: Array of all filterable/queryable properties with their types and options

3. **Use schema properties for filtering**:
   - Read the schema file to find available properties and their exact names
   - For `select`/`multi_select` properties, use the exact option names from `config.options`
   - For `status` properties, use option names from `config.options` (e.g., "Completed", "In Progress")
   - For `people` properties, you need the user's Notion ID (Grant Nestor = `93b12d56-258b-4e53-84d8-e826737d291b`)
   - For `relation` properties, the `config.database_id` shows the related database

   **Example**: To filter Tasks where Priority = "Today":
   ```bash
   # 1. Read schema to find property names and options
   # From tasks_fd81d546.json: Priority is a "select" with options ["Today", "This Week", "This Month", "Next Month"]

   # 2. Build filter using exact property name and option value
   deno run --allow-net --allow-env --allow-read .claude/skills/notion/scripts/notion-client.ts \
     query-database-filtered fd81d546-0ca5-4452-8171-15bce4957403 \
     '{"property":"Priority","select":{"equals":"Today"}}'
   ```

4. **Fallback to Notion Workspace Organization section**:
   - If schema files are not available, check the "Notion Workspace Organization" section below
   - Extract database IDs from the URLs listed there

5. **Extract parameters**:
   - For search: extract search query
   - For get-page: extract page ID from URL or search if only title provided
   - For query-database: use database ID from schema file, build filter using schema properties
   - For create-page in database: use `create-database-page` command with database ID, extract title and content (content can be Markdown)
   - For create-page as child: use `create-page` command with parent page ID
   - For add-comment: extract page ID and comment text
   - For get-database-schema: use database ID from schema file

6. **Execute the command**:
   - Run the appropriate Deno script command
   - Pass parameters as arguments (use database ID not name)

7. **Process the response**:
   - Parse JSON output from the script
   - Format results in a user-friendly way
   - For page content, convert blocks to markdown
   - For database queries, format as tables

8. **Handle errors gracefully**:
   - If authentication fails, remind user to check `NOTION_API_TOKEN`
   - If page not found, suggest searching first
   - If no access, remind user to share pages with integration

## Notion Workspace Organization

### Your Brand Databases

- [Tasks](https://www.notion.so/fd81d5460ca54452817115bce4957403?pvs=21): A database of tasks, organized by assignee (team members), project, tag, priority, and status
- [Projects](https://www.notion.so/22c273f5ffd980bfa867d58cad1cce02?pvs=21): A database of projects that are associated with tasks
- [Notes](https://www.notion.so/c26c91221f7b451ab8467d1981338116?pvs=21): A database of notes ranging from personal daily notes, meeting notes, working docs for projects, knowledge base articles, etc. organized by tag, date, and creator.
- [Calendar](https://www.notion.so/66dfb65232f14b24b7df0d4b52528f42?pvs=21): A database of events including email and SMS campaigns, photo shoots, development and production milestones, etc. organized by date, assignee, status, and tag.
- [Links](https://www.notion.so/0477302243004bd7aac1d5f7b9aac828?pvs=21): A database of links to external resources such as Google Sheets, Figma pages, photo albums, Pinterest boards, etc. organized by tag.
- [Tags](https://www.notion.so/8cc69cbff95f46aa9a076854e9e968d6?pvs=21): A database of tags to use across databases, such as [Tasks](https://www.notion.so/fd81d5460ca54452817115bce4957403?pvs=21), [Calendar](https://www.notion.so/66dfb65232f14b24b7df0d4b52528f42?pvs=21), [Development Tracker](https://www.notion.so/70f5c5c304d248daae45efe982e7a75c?pvs=21), etc.
- [Products](https://www.notion.so/f5b3a454823e416ab0999f19b18f419d?pvs=21): A database products to use across databases such as [Development Tracker](https://www.notion.so/70f5c5c304d248daae45efe982e7a75c?pvs=21), [Ad Creative](https://www.notion.so/17f90722692f46d69adbbef212e30ddb?pvs=21), etc.
- [Ad Creative](https://www.notion.so/17f90722692f46d69adbbef212e30ddb?pvs=21): A database of ad creative briefs primarily for Meta ads organized status, product(s), audience, format, etc.
- [Development Tracker](https://www.notion.so/70f5c5c304d248daae45efe982e7a75c?pvs=21): A database of products in development, from concept to delivery, organized by status, season, purchase order, style number, etc.
- [Purchase Orders](https://www.notion.so/36ef3445c33f45a18fda139081cc3f4a?pvs=21): A database of purchase orders for product inventory organized by season.
- [Syle Numbers](https://www.notion.so/fbadaef7825d46de96a028083edc64a9?pvs=21): Style numbers used to track product styles in [Purchase Orders](https://www.notion.so/36ef3445c33f45a18fda139081cc3f4a?pvs=21) and [Development Tracker](https://www.notion.so/70f5c5c304d248daae45efe982e7a75c?pvs=21)
- [People](https://www.notion.so/a464880c0762417eb8ef3f209f3dab5e?pvs=21): A list of people such as influencers, content creators, models, photographers, studios, etc. organized by tag, status, location, etc.
- [Tutorials](https://www.notion.so/a1a0b0e0e5ff495bbb3e0de8af4ef40d?pvs=21): A database of tutorials such as articles and screen recordings for internal processes and workflows, focused primarily on customer service but including marketing and operations, organized by format, category, tag, and expertise level.
- [Stockists](https://www.notion.so/99983c63d8f947418550c7111cd75f02?pvs=21): A database of retailers that sell Your Brand organized by status, location, and tag.
- [Press](https://www.notion.so/64699611f1ca495aa76523ff0fa3a455?pvs=21): A database of press featuring Your Brand organized by status and tag.

### Private Personal Databases

- [My To Do](https://www.notion.so/your-workspace/ee0b3e48af7248748bc95a354c73c006?v=84da97a509c84094ae07df9af9f7f54a): A database of my personal tasks organized by project, tag, priority, and status, shared with my wife Sarah.
- [My Notes](https://www.notion.so/your-workspace/4af79ac2ed1e44ed8f17dd41b104575e?v=84c0fb50dc864c61b2bb6607c29f4ac0): A database of my personal notes, excluding journal entries, organized by tag.
- [Journal](https://www.notion.so/your-workspace/95036ce241d1489bb7c5ecac76f2dbe6?v=84c0fb50dc864c61b2bb6607c29f4ac0): A database of my journal entries organized by date and tag.
- [Projects](https://www.notion.so/your-workspace/fd2381bf80eb4b8dac7773af1d0dcc89?v=4a65b4caeb164879a7965fbbe872b50c): A database of my personal projects.
- [People](https://www.notion.so/your-workspace/1f9c88f3fa6e4b1290f1da26ffc5454f?v=84f849b25d5b462a964c22e64c4bef6d): A database of people I have met.
- [Links](https://www.notion.so/your-workspace/1758a48debe44da6a6003ad0c1bffe47?v=06aa532a044f4f6bbceef37dcfaef6ac): A database of my personal links.

## Examples

### Example 1: Search for a Page

User: "Find my Fall 2025 Catalog Shoot page in Notion"

Steps:
1. Run search command: `deno run --allow-net --allow-env .claude/skills/notion/scripts/notion-client.ts search "Fall 2025 Catalog Shoot"`
2. Parse results to find matching page
3. Display page title, ID, and URL
4. Optionally offer to retrieve full content

### Example 2: Create a New Page

User: "Create a note for today's meetings"

Steps:
1. Search schemas: `Glob(".claude/skills/notion/references/schemas/*notes*.json")`
2. Read `notes_c26c9122.json` to get database ID: `c26c9122-1f7b-451a-b846-7d1981338116`
3. Generate title: "[Today's Date in MM/DD/YY format]"
4. Create outline for the meeting notes
5. Run create-database-page command with the database ID
6. Confirm creation and provide link to new page

### Example 3: Query a Database with Filter

User: "Show me all tasks assigned to me with priority Today"

Steps:
1. Search schemas: `Glob(".claude/skills/notion/references/schemas/*tasks*.json")`
2. Read `tasks_fd81d546.json` to find:
   - Database ID: `fd81d546-0ca5-4452-8171-15bce4957403`
   - Priority property is `select` type with options: "Today", "This Week", "This Month", "Next Month"
   - Assignee property is `people` type
3. Build compound filter:
   ```json
   {"and":[
     {"property":"Priority","select":{"equals":"Today"}},
     {"property":"Assignee","people":{"contains":"93b12d56-258b-4e53-84d8-e826737d291b"}}
   ]}
   ```
4. Run query-database-filtered command with database ID and filter
5. Format results for user

## Notion Blocks to Markdown Converter

The `notion-to-markdown.ts` module provides comprehensive conversion of Notion blocks to Markdown/HTML format. This is useful for exporting Notion content to other systems like Obsidian.

**Supported block types:**
- Text blocks (paragraph, headings, quote, callout)
- List blocks (bulleted, numbered, to-do with checkboxes)
- Code blocks (with language syntax)
- Toggle blocks (as HTML details/summary)
- Tables (as Markdown tables)
- Media (images, videos, files, PDFs, embeds)
- Advanced blocks (equations, synced blocks, columns)
- Links (bookmarks, link previews, page links)

**Usage (as importable module):**
```typescript
import { blocksToMarkdown } from ".claude/skills/notion/scripts/notion-to-markdown.ts";

// Convert blocks array to Markdown string
const markdown = await blocksToMarkdown(blocks, notionClient);
```

**Features:**
- Recursive handling of nested blocks (toggle headings, list item children)
- Optional image downloading with local path mapping
- Rich text formatting preservation (bold, italic, strikethrough, code, colors)
- Callouts converted to Obsidian callout format
- Date mentions converted to Obsidian internal links

## Tool Access

This Skill is restricted to:
- **Read**: For reading example files and documentation
- **Write**: For creating temporary files if needed for complex operations
- **Bash**: For executing Deno scripts that call the Notion API

## Security Notes

- Never expose `NOTION_API_TOKEN` in output
- Respect Notion integration permissions (read-only if configured)
- Warn user before creating or modifying content
- The Notion API has rate limits - batch operations when possible

## Troubleshooting

**"Authentication failed"**
- Check `NOTION_API_TOKEN` is set in `.env`
- Verify token is valid at https://www.notion.so/profile/integrations

**"Page not found"**
- Page may not be shared with integration
- Use "Connect to integration" in Notion page settings
- Try searching first to confirm page exists

**"Permission denied"**
- Integration may be read-only
- Check integration capabilities at https://www.notion.so/profile/integrations
- User may need to grant additional permissions

