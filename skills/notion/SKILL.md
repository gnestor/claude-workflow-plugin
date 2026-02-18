---
name: notion
description: This skill should be used to access and interact with Notion workspace functionality including searching pages, databases, retrieving content, creating pages, and adding comments. Activate when the user mentions Notion, asks to search Notion, create Notion pages, query databases, or reference Notion content. Supports Markdown formatting for all content. Can scan and cache database schemas for improved query translation.
---

# Notion Workspace Access

## Purpose

This skill enables direct interaction with Notion workspace using `~~knowledge-base` tools. It provides search, retrieval, creation, and query capabilities for pages and databases.

Authentication is handled by the MCP server configuration.

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

## Available Tools

The `~~knowledge-base` MCP server provides tools for:
- **Search** - Search workspace for pages and databases by title or content
- **Pages** - Get page content, create pages (as child or in database), update pages, convert to/from Markdown
- **Databases** - List databases, get database schema, query databases with filters, scan and cache schemas
- **Comments** - Add comments to pages
- **Markdown conversion** - Convert between Markdown and Notion block format

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
   - Search -> use search tools
   - Retrieve content -> use get-page tools
   - Query data -> use query-database tools
   - Create content -> use create-page tools
   - Add feedback -> use add-comment tools
   - List databases -> use list-databases tools
   - Get database schema -> use get-database-schema tools

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
   - For add-comment: extract page ID and comment text

6. **Execute using `~~knowledge-base` tools**

7. **Process the response**:
   - Format results in a user-friendly way
   - For page content, convert blocks to markdown
   - For database queries, format as tables

8. **Handle errors gracefully**:
   - If authentication fails, check MCP server configuration
   - If page not found, suggest searching first
   - If no access, remind user to share pages with integration

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

## Security Notes

- Never expose API tokens in output
- Respect Notion integration permissions (read-only if configured)
- Warn user before creating or modifying content
- The Notion API has rate limits - batch operations when possible

## Troubleshooting

**"Authentication failed"**
- Verify MCP server configuration
- Check token validity at https://www.notion.so/profile/integrations

**"Page not found"**
- Page may not be shared with integration
- Use "Connect to integration" in Notion page settings
- Try searching first to confirm page exists

**"Permission denied"**
- Integration may be read-only
- Check integration capabilities at https://www.notion.so/profile/integrations
- User may need to grant additional permissions
