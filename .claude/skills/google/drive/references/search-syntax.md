# Google Drive Search Query Syntax

Complete reference for Google Drive search queries used with the `search` command.

## Basic Syntax

Google Drive search queries use a structured syntax with operators and values:

```
field operator 'value'
```

Multiple conditions can be combined with `and`, `or`, and `not`.

## Field Operators

### Equality Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `name = 'Document.pdf'` |
| `!=` | Not equals | `mimeType != 'application/pdf'` |
| `contains` | Contains text | `name contains 'report'` |

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `>` | Greater than | `modifiedTime > '2025-01-01T00:00:00'` |
| `>=` | Greater than or equal | `createdTime >= '2025-01-01T00:00:00'` |
| `<` | Less than | `modifiedTime < '2025-12-31T23:59:59'` |
| `<=` | Less than or equal | `createdTime <= '2025-12-31T23:59:59'` |

### Membership Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `in` | Is in collection | `'me' in owners` |
| `has` | Contains any | `'user@example.com' in writers` |

## Searchable Fields

### File Metadata

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | File name | `name contains 'budget'` |
| `fullText` | string | File content and name | `fullText contains 'quarterly report'` |
| `mimeType` | string | MIME type | `mimeType = 'application/pdf'` |
| `modifiedTime` | datetime | Last modified time | `modifiedTime > '2025-11-01T00:00:00'` |
| `createdTime` | datetime | Creation time | `createdTime >= '2025-01-01T00:00:00'` |
| `viewedByMeTime` | datetime | Last viewed by me | `viewedByMeTime > '2025-11-01T00:00:00'` |

### Boolean Fields

| Field | Description | Example |
|-------|-------------|---------|
| `starred` | File is starred | `starred = true` |
| `trashed` | File is in trash | `trashed = false` |
| `sharedWithMe` | Shared with me | `sharedWithMe = true` |
| `hidden` | File is hidden | `hidden = false` |

### Ownership & Sharing

| Field | Description | Example |
|-------|-------------|---------|
| `owners` | File owners | `'user@example.com' in owners` |
| `writers` | Users with write permission | `'user@example.com' in writers` |
| `readers` | Users with read permission | `'user@example.com' in readers` |
| `sharingUser` | User who shared the file | `sharingUser = 'user@example.com'` |

### Organization

| Field | Description | Example |
|-------|-------------|---------|
| `parents` | Parent folders | `'1abc123' in parents` |
| `properties` | Custom properties | `properties has { key='department' and value='marketing' }` |

### Special Operators

| Field | Description | Example |
|-------|-------------|---------|
| `'me' in owners` | Files I own | `'me' in owners` |
| `'me' in writers` | Files I can edit | `'me' in writers` |
| `'me' in readers` | Files I can view | `'me' in readers` |

## Combining Queries

### Logical Operators

Use `and`, `or`, and `not` to combine conditions:

```bash
# AND - both conditions must be true
"name contains 'report' and mimeType = 'application/pdf'"

# OR - either condition can be true
"mimeType = 'image/jpeg' or mimeType = 'image/png'"

# NOT - condition must be false
"not mimeType contains 'google-apps'"
```

### Grouping with Parentheses

Use parentheses to control evaluation order:

```bash
"(name contains 'report' or name contains 'summary') and mimeType = 'application/pdf'"
```

## Date/Time Format

Dates must be in RFC 3339 format (ISO 8601):

```
YYYY-MM-DDTHH:MM:SS[.sss][Z|±HH:MM]
```

Examples:
- `2025-11-06T00:00:00` - Start of day
- `2025-11-06T23:59:59` - End of day
- `2025-11-06T12:30:00-08:00` - With timezone
- `2025-11-06T12:30:00Z` - UTC time

## Common Query Patterns

### Find Files by Name

```bash
# Exact match
"name = 'Budget 2025.xlsx'"

# Contains text
"name contains 'budget'"

# Multiple keywords
"name contains 'Q4' and name contains 'report'"

# Starts with (use contains)
"name contains 'Report-'"
```

### Find Files by Type

```bash
# Single MIME type
"mimeType = 'application/pdf'"

# Multiple types (OR)
"mimeType = 'image/jpeg' or mimeType = 'image/png'"

# Category (wildcard with contains)
"mimeType contains 'image/'"

# Google Workspace files only
"mimeType contains 'application/vnd.google-apps'"

# Non-Google files
"not mimeType contains 'application/vnd.google-apps'"
```

### Find Files by Date

```bash
# Modified today (approximate)
"modifiedTime > '2025-11-06T00:00:00'"

# Modified this week
"modifiedTime > '2025-11-04T00:00:00'"

# Modified this month
"modifiedTime >= '2025-11-01T00:00:00'"

# Created in date range
"createdTime > '2025-01-01T00:00:00' and createdTime < '2025-02-01T00:00:00'"

# Viewed recently
"viewedByMeTime > '2025-11-01T00:00:00'"

# Not modified in 6 months
"modifiedTime < '2025-05-06T00:00:00'"
```

### Find Files by Location

```bash
# In specific folder
"'1abc123' in parents"

# In My Drive root
"'root' in parents"

# In any folder (not root)
"not 'root' in parents"

# Shared with me
"sharedWithMe = true"

# Not in trash
"trashed = false"
```

### Find Files by Ownership

```bash
# Files I own
"'me' in owners"

# Files owned by specific user
"'user@example.com' in owners"

# Files I can edit
"'me' in writers"

# Files shared by specific user
"sharingUser = 'user@example.com'"
```

### Find Files by Content

```bash
# Search in file content and name
"fullText contains 'quarterly earnings'"

# Multiple keywords
"fullText contains 'budget' and fullText contains '2025'"
```

### Find Starred or Special Files

```bash
# Starred files
"starred = true"

# Starred PDFs
"starred = true and mimeType = 'application/pdf'"

# Not starred
"starred = false"
```

### Complex Queries

```bash
# Recent PDFs in specific folder
"'1abc123' in parents and mimeType = 'application/pdf' and modifiedTime > '2025-11-01T00:00:00'"

# Shared spreadsheets modified this week
"sharedWithMe = true and mimeType contains 'spreadsheet' and modifiedTime > '2025-11-04T00:00:00'"

# My documents not in trash
"'me' in owners and mimeType contains 'document' and trashed = false"

# Large image files (requires combining with file size check after search)
"mimeType contains 'image/' and modifiedTime > '2025-01-01T00:00:00'"

# Files in multiple folders (requires separate searches or OR)
"'1abc123' in parents or '1def456' in parents"
```

## Default Filters

When not specified, the following defaults apply:

- `trashed = false` - Files not in trash (always included unless overridden)

## Limitations

1. **File Size**: Cannot directly search by file size in query (must filter results)
2. **File Content**: Full-text search is limited to certain file types (Google Docs, PDFs, etc.)
3. **Wildcards**: No traditional wildcards like `*` or `?` - use `contains` instead
4. **Regular Expressions**: Not supported in search queries
5. **Custom Metadata**: Search on properties requires specific syntax

## Special Characters

When searching for special characters, use single quotes around values:

```bash
# File with apostrophe
"name contains 'John\\'s Report'"

# File with quotes
"name contains 'The \\"Best\\" Report'"
```

## Performance Tips

1. **Be specific**: More specific queries return faster
2. **Use MIME types**: Filtering by type is faster than content search
3. **Use parent folders**: Searching within folders is faster than global search
4. **Avoid fullText**: Full-text search is slower than name-based search
5. **Use date ranges**: Narrow date ranges improve performance

## Examples by Use Case

### Project Management
```bash
# Find project files from this quarter
"name contains 'Project' and createdTime >= '2025-10-01T00:00:00' and mimeType contains 'application/vnd.google-apps'"

# Find all meeting notes
"name contains 'meeting' and mimeType = 'application/vnd.google-apps.document'"
```

### Media Management
```bash
# Find recent photos
"mimeType contains 'image/' and createdTime > '2025-11-01T00:00:00'"

# Find videos larger than 100MB (requires post-processing)
"mimeType contains 'video/' and modifiedTime > '2025-01-01T00:00:00'"
```

### Document Organization
```bash
# Find unorganized files in root
"'root' in parents and not mimeType = 'application/vnd.google-apps.folder'"

# Find duplicates by name (requires grouping results)
"name contains 'copy' or name contains 'duplicate'"
```

### Compliance & Cleanup
```bash
# Find old files not modified in 2 years
"modifiedTime < '2023-01-01T00:00:00' and trashed = false"

# Find files shared publicly (requires permissions check)
"sharedWithMe = false and 'me' in owners"
```
