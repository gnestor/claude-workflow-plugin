---
name: notion
description: This skill should be used to access and interact with Notion workspace functionality including searching pages, databases, retrieving content, creating pages, and adding comments. Activate when the user mentions Notion, asks to search Notion, create Notion pages, query databases, or reference Notion content. Supports Markdown formatting for all content. Can scan and cache database schemas for improved query translation.
category: ~~knowledge-base
service: notion
---

# Notion

## Purpose

This skill enables direct interaction with the Notion workspace via a client script. It provides search, retrieval, creation, and query capabilities for pages and databases.

Authentication is handled automatically by `lib/auth.js`.

## When to Use

Activate this skill when the user:
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

## Client Script

**Path:** `skills/notion/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Verify authentication is working |
| `search [--query, --type, --limit]` | Search workspace for pages and databases |
| `get-page --id` | Get page content by ID |
| `create-page --parent-id [--parent-type, --title, --body JSON]` | Create a new page |
| `update-page --page-id --body JSON` | Update an existing page |
| `query-database --database-id [--filter JSON, --sorts JSON, --limit, --cursor]` | Query a database with filters and sorts |
| `get-database --id` | Get database schema and metadata |
| `create-database --parent-id --title [--body JSON]` | Create a new database |
| `scan-databases` | Scan all databases, save schemas to `references/schemas/` |

## Key API Concepts

Notion API v1 (`api.notion.com/v1`). Everything is a page, database, or block. Databases have typed properties (select, multi_select, status, people, relation, etc.) with structured filter/sort syntax. All content supports Markdown conversion.

## Markdown Support

**All page creation and update operations automatically convert Markdown to formatted Notion blocks.** Supported formats include:
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

### Page Mentions

Use the special `@[text](page-id)` syntax to create clickable page mentions in Notion:

```markdown
- @[Review inventory](2e7273f5-ffd9-8047-9bd0-c3f0c91909e4)
- Check @[My Task](abc12345-def6-7890-abcd-ef1234567890) for details
```

### Callouts

Two callout formats are supported:

**Emoji format:**
```markdown
> Success
>
> This is a success message.
```

**Obsidian format** (auto-assigns emoji and color based on type):
```markdown
> [!warning] Be careful
> This is a warning message.
```

Supported Obsidian types: `info`, `note`, `tip`, `warning`, `danger`, `error`, `bug`, `example`, `quote`, `success`, `question`, `todo`, `failure`, `abstract`, `summary`.

## Instructions

When a user requests Notion-related operations:

1. **Identify the operation type**:
   - Search -> use `search` command
   - Retrieve content -> use `get-page` command
   - Query data -> use `query-database` command
   - Create content -> use `create-page` command
   - List databases -> use `search --type database`
   - Get database schema -> use `get-database` command

2. **Look up database IDs and schemas from references**:
   - **ALWAYS check `references/schemas/` FIRST** to find databases by name
   - Schema files are named `{database_name}_{database_id}.json`
   - Use `Glob` to search for databases: `Glob("skills/notion/references/schemas/*tasks*.json")`
   - Each schema file contains:
     - `id`: The full database UUID to use in API calls
     - `title`: The database name
     - `url`: Direct link to the database in Notion
     - `properties`: Array of all filterable/queryable properties with their types and options

3. **Use schema properties for filtering**:
   - Read the schema file to find available properties and their exact names
   - For `select`/`multi_select` properties, use the exact option names from `config.options`
   - For `status` properties, use option names from `config.options`
   - For `people` properties, you need the user's Notion ID
   - For `relation` properties, the `config.database_id` shows the related database

4. **Fallback to Notion Workspace Organization section**:
   - If schema files are not available, check the "Notion Workspace Organization" section below
   - Extract database IDs from the URLs listed there

5. **Extract parameters**:
   - For search: extract search query
   - For get-page: extract page ID from URL or search if only title provided
   - For query-database: use database ID from schema file, build filter using schema properties
   - For create-page in database: use database ID, extract title and content (content can be Markdown)
   - For create-page as child: use parent page ID

6. **Execute using client script commands**

7. **Process the response**:
   - Format results in a user-friendly way
   - For page content, convert blocks to markdown
   - For database queries, format as tables

## Notion Workspace Organization

### Your Brand Databases

- [Tasks](https://www.notion.so/fd81d5460ca54452817115bce4957403?pvs=21): A database of tasks, organized by assignee, project, tag, priority, and status
- [Projects](https://www.notion.so/22c273f5ffd980bfa867d58cad1cce02?pvs=21): A database of projects associated with tasks
- [Notes](https://www.notion.so/c26c91221f7b451ab8467d1981338116?pvs=21): A database of notes organized by tag, date, and creator
- [Calendar](https://www.notion.so/66dfb65232f14b24b7df0d4b52528f42?pvs=21): A database of events organized by date, assignee, status, and tag
- [Links](https://www.notion.so/0477302243004bd7aac1d5f7b9aac828?pvs=21): A database of links to external resources organized by tag
- [Tags](https://www.notion.so/8cc69cbff95f46aa9a076854e9e968d6?pvs=21): A database of tags to use across databases
- [Products](https://www.notion.so/f5b3a454823e416ab0999f19b18f419d?pvs=21): A database of products
- [Ad Creative](https://www.notion.so/17f90722692f46d69adbbef212e30ddb?pvs=21): A database of ad creative briefs
- [Development Tracker](https://www.notion.so/70f5c5c304d248daae45efe982e7a75c?pvs=21): A database of products in development
- [Purchase Orders](https://www.notion.so/36ef3445c33f45a18fda139081cc3f4a?pvs=21): A database of purchase orders
- [Style Numbers](https://www.notion.so/fbadaef7825d46de96a028083edc64a9?pvs=21): Style numbers for tracking product styles
- [People](https://www.notion.so/a464880c0762417eb8ef3f209f3dab5e?pvs=21): A list of people (influencers, content creators, etc.)
- [Tutorials](https://www.notion.so/a1a0b0e0e5ff495bbb3e0de8af4ef40d?pvs=21): A database of tutorials organized by format, category, tag, and expertise level
- [Stockists](https://www.notion.so/99983c63d8f947418550c7111cd75f02?pvs=21): A database of retailers
- [Press](https://www.notion.so/64699611f1ca495aa76523ff0fa3a455?pvs=21): A database of press features

### Private Personal Databases

- [My To Do](https://www.notion.so/your-workspace/ee0b3e48af7248748bc95a354c73c006?v=84da97a509c84094ae07df9af9f7f54a): Personal tasks
- [My Notes](https://www.notion.so/your-workspace/4af79ac2ed1e44ed8f17dd41b104575e?v=84c0fb50dc864c61b2bb6607c29f4ac0): Personal notes
- [Journal](https://www.notion.so/your-workspace/95036ce241d1489bb7c5ecac76f2dbe6?v=84c0fb50dc864c61b2bb6607c29f4ac0): Journal entries
- [Projects](https://www.notion.so/your-workspace/fd2381bf80eb4b8dac7773af1d0dcc89?v=4a65b4caeb164879a7965fbbe872b50c): Personal projects
- [People](https://www.notion.so/your-workspace/1f9c88f3fa6e4b1290f1da26ffc5454f?v=84f849b25d5b462a964c22e64c4bef6d): People I have met
- [Links](https://www.notion.so/your-workspace/1758a48debe44da6a6003ad0c1bffe47?v=06aa532a044f4f6bbceef37dcfaef6ac): Personal links

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('notion', '/v1/pages');
```

## Reference Files
- [examples.md](references/examples.md) — Usage patterns and queries
- [documentation.md](references/documentation.md) — Full API documentation
