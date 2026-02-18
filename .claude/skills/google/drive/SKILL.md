---
name: google-drive
description: This skill should be used to access and manage Google Drive files and folders including searching, downloading, uploading, updating, organizing, and sharing files. Activate when the user mentions Google Drive, needs to search for files, download documents, upload content, or manage Drive organization. Supports both files and folders with full CRUD operations.
---

# Google Drive API Integration

## Purpose

This Skill enables complete interaction with Google Drive through the Drive API v3. It provides full access to files and folders for searching, downloading, uploading, updating, organizing, and sharing content.

**Use this skill for:**
- Searching for files and folders in Google Drive
- Downloading files (documents, spreadsheets, images, etc.)
- Uploading new files and folders
- Updating existing files
- Creating, moving, and organizing folders
- Managing file permissions and sharing
- Listing files with filtering and sorting

## When to Use

Activate this Skill when the user:
- Mentions "Google Drive", "Drive", or "GDrive"
- Wants to search for files: "find my presentation about Q4 results"
- Needs to download files: "download the latest budget spreadsheet"
- Wants to upload files: "upload this document to Drive"
- Needs to organize files: "move these files to the Marketing folder"
- Asks about file sharing: "share this with the team"
- Wants to list files in a folder: "show me what's in the Projects folder"
- References Drive-specific operations

## When NOT to Use

- **Google Sheets data analysis**: Use google-sheets skill for reading/writing spreadsheet data
- **Email**: Use gmail skill for email access
- **Website analytics**: Use google-analytics skill for traffic data
- **Database queries**: Use postgresql skill for cross-source database queries

## Prerequisites

Google OAuth credentials in `.env` file:
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_REFRESH_TOKEN` - OAuth refresh token (obtained via `auth` command)

These credentials are shared across all Google API skills (Gmail, Google Analytics, Google Sheets, Google Drive).

## Available Operations

The skill provides the following commands through the `drive-client.ts` script:

### 1. Authenticate

Obtain OAuth refresh token for Drive API access.

**Recommended: Use unified authentication**
```bash
./lib/google-auth.ts
```

**Alternative: Authenticate for Drive only**
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-drive/scripts/drive-client.ts auth
```

This will:
- Print an authorization URL
- Open browser for Google OAuth consent
- Prompt to paste the authorization code
- Save the refresh token to `.env` automatically

**Note**: Only needed once per Google account. Token is shared with Gmail, Google Analytics, and Google Sheets skills. If you use multiple Google skills, unified authentication is recommended.

### 2. Search Files

Search for files and folders using Google Drive search syntax.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts search "<query>" [--limit <number>] [--fields <fields>]
```

Parameters:
- `query`: Drive search query (see Search Query Syntax section)
- `--limit`: Maximum number of results (default: 20)
- `--fields`: Fields to return (default: basic fields)

Returns: List of files with id, name, mimeType, createdTime, modifiedTime, size, webViewLink

Examples:
```bash
# Search for files by name
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts search "name contains 'budget'"

# Search for Google Docs modified recently
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts search "mimeType='application/vnd.google-apps.document' and modifiedTime > '2025-11-01T00:00:00'"

# Search in specific folder
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts search "'1234567890' in parents"
```

### 3. List Files

List files in a specific folder or in My Drive.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts list [folder-id] [--limit <number>] [--order-by <field>]
```

Parameters:
- `folder-id` (optional): Folder ID to list (default: root/My Drive)
- `--limit`: Maximum number of results (default: 20)
- `--order-by`: Sort field (e.g., "name", "modifiedTime desc", "createdTime")

Returns: List of files and folders

Examples:
```bash
# List files in My Drive
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts list

# List files in specific folder
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts list 1234567890abcdef

# List files sorted by modification time
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts list --order-by "modifiedTime desc"
```

### 4. Get File Details

Get detailed information about a specific file.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts get <file-id>
```

Parameters:
- `file-id`: The Drive file ID

Returns: Complete file metadata including name, mimeType, size, parents, permissions, sharing settings

### 5. Download File

Download a file from Google Drive to local filesystem.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-drive/scripts/drive-client.ts download <file-id> <output-path> [--export-type <mimeType>]
```

Parameters:
- `file-id`: The Drive file ID
- `output-path`: Local path where file should be saved
- `--export-type`: For Google Docs/Sheets/Slides, specify export format (e.g., "application/pdf", "text/plain")

Supported export types for Google Workspace files:
- Google Docs: `application/pdf`, `text/plain`, `text/html`, `application/rtf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
- Google Sheets: `application/pdf`, `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX)
- Google Slides: `application/pdf`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` (PPTX)

Examples:
```bash
# Download a regular file
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-drive/scripts/drive-client.ts download 1abc123 ./assets/document.pdf

# Export Google Doc as PDF
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-drive/scripts/drive-client.ts download 1abc123 ./assets/doc.pdf --export-type application/pdf

# Export Google Sheet as CSV
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-drive/scripts/drive-client.ts download 1abc123 ./assets/sheet.csv --export-type text/csv
```

### 6. Upload File

Upload a file to Google Drive.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts upload <file-path> [--name <name>] [--parent <folder-id>] [--mime-type <type>]
```

Parameters:
- `file-path`: Local path to file to upload
- `--name`: Name for the file in Drive (default: use filename from path)
- `--parent`: Folder ID to upload to (default: My Drive root)
- `--mime-type`: MIME type (auto-detected if not specified)

Returns: Uploaded file metadata with ID and webViewLink

Examples:
```bash
# Upload file to My Drive
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts upload ./document.pdf

# Upload to specific folder with custom name
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts upload ./report.xlsx --name "Q4 Report" --parent 1234567890abcdef
```

### 7. Update File

Update an existing file's content or metadata.

```bash
# Update file content
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts update <file-id> <file-path>

# Update file metadata only
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts update-metadata <file-id> '<json-metadata>'
```

Parameters:
- `file-id`: The Drive file ID to update
- `file-path`: Local path to new file content
- `json-metadata`: JSON object with metadata fields to update

Metadata fields: `name`, `description`, `mimeType`, `starred`, `trashed`

Examples:
```bash
# Update file content
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts update 1abc123 ./new-version.pdf

# Rename file
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts update-metadata 1abc123 '{"name":"New Name.pdf"}'

# Star a file
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts update-metadata 1abc123 '{"starred":true}'
```

### 8. Create Folder

Create a new folder in Google Drive.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts create-folder <name> [--parent <folder-id>]
```

Parameters:
- `name`: Name for the new folder
- `--parent`: Parent folder ID (default: My Drive root)

Returns: Created folder metadata with ID

Examples:
```bash
# Create folder in My Drive
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts create-folder "Projects"

# Create subfolder
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts create-folder "2025 Projects" --parent 1234567890abcdef
```

### 9. Move File

Move a file to a different folder.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts move <file-id> <new-parent-id> [--remove-parents <parent-ids>]
```

Parameters:
- `file-id`: The file ID to move
- `new-parent-id`: Destination folder ID
- `--remove-parents`: Comma-separated list of parent IDs to remove (default: all current parents)

Examples:
```bash
# Move file to new folder (removes from all current parents)
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts move 1abc123 1newparent

# Add to new folder without removing from current folders
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts move 1abc123 1newparent --remove-parents ""
```

### 10. Copy File

Create a copy of a file.

```bash
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts copy <file-id> [--name <name>] [--parent <folder-id>]
```

Parameters:
- `file-id`: The file ID to copy
- `--name`: Name for the copy (default: "Copy of [original name]")
- `--parent`: Destination folder ID (default: same as original)

Returns: Copied file metadata

### 11. Delete File

Move a file to trash or permanently delete it.

```bash
# Move to trash
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts trash <file-id>

# Permanently delete
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts delete <file-id>
```

Parameters:
- `file-id`: The file ID to delete

**Warning**: Permanent deletion cannot be undone. Use `trash` for recoverable deletion.

### 12. Share File

Manage file permissions and sharing.

```bash
# Add permission
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts share <file-id> <email> <role> [--type <type>]

# List permissions
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts list-permissions <file-id>

# Remove permission
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts remove-permission <file-id> <permission-id>
```

Parameters:
- `file-id`: The file ID to share
- `email`: Email address to share with
- `role`: Permission role: `reader`, `writer`, `commenter`, `owner`
- `--type`: Permission type: `user` (default), `group`, `domain`, `anyone`

Examples:
```bash
# Share file with user as viewer
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts share 1abc123 user@example.com reader

# Share with editor access
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts share 1abc123 user@example.com writer

# Make publicly viewable
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts share 1abc123 "" reader --type anyone

# List all permissions
deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts list-permissions 1abc123
```

### 13. Export Google Workspace File

Export Google Docs, Sheets, or Slides to different formats.

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-drive/scripts/drive-client.ts export <file-id> <mime-type> <output-path>
```

This is a convenience wrapper around download with --export-type for Google Workspace files.

## Natural Language to Query Process

When a user makes a natural language request about Google Drive, follow this process:

### Step 1: Identify the Operation Type

Map user's request to appropriate command:
- "find", "search for" → `search`
- "show me files", "list files" → `list`
- "download", "get me" → `download`
- "upload", "add to drive" → `upload`
- "update", "replace" → `update`
- "create folder", "make folder" → `create-folder`
- "move", "relocate" → `move`
- "copy", "duplicate" → `copy`
- "delete", "remove" → `trash` or `delete`
- "share", "give access" → `share`

### Step 2: Parse Search Intent

Convert natural language to search query:

**By name:**
- "budget spreadsheet" → `name contains 'budget'`
- "Q4 presentation" → `name contains 'Q4' and name contains 'presentation'`

**By file type:**
- "spreadsheets" → `mimeType='application/vnd.google-apps.spreadsheet'`
- "PDFs" → `mimeType='application/pdf'`
- "images" → `mimeType contains 'image/'`
- "folders" → `mimeType='application/vnd.google-apps.folder'`

**By time:**
- "recent files" → `modifiedTime > '2025-11-01T00:00:00'`
- "created this week" → `createdTime > '2025-11-04T00:00:00'`
- "modified today" → `modifiedTime > '2025-11-06T00:00:00'`

**By owner/sharing:**
- "my files" → `'me' in owners`
- "shared with me" → `sharedWithMe = true`
- "shared by john" → `'john@example.com' in owners`

### Step 3: Find Files if Needed

For operations requiring a file ID (download, update, delete, share):
1. Use `search` to find the file based on natural language description
2. If multiple matches, ask user to clarify
3. Extract file ID from search results
4. Proceed with the operation

### Step 4: Execute the Command

Run the appropriate command with determined parameters.

### Step 5: Handle Google Workspace Files

For Google Docs, Sheets, and Slides:
- **Download**: Must specify export format (PDF, DOCX, CSV, etc.)
- **View**: Provide webViewLink for browser viewing
- **Edit**: Not directly supported via API (provide edit link)

### Step 6: Present Results

Format results clearly:
- **Search/List**: Show table of files with name, type, modified time, link
- **Download**: Confirm file saved to local path
- **Upload**: Show upload success with Drive link
- **Share**: Confirm permissions added
- **Errors**: Provide clear error messages with suggestions

## Reference Files

Detailed information available in `references/` directory:

- **workflow-examples.md** - Step-by-step examples for common operations (find/download, upload/share, organize, bulk download)
- **search-syntax.md** - Google Drive search query syntax and operators
- **mime-types.md** - Complete list of MIME types for Google Drive files
- **export-formats.md** - Export format options for Google Workspace files

Consult these files when building queries or identifying file types.

## Security Notes

- Never expose OAuth credentials in output
- Refresh token stored in `.env` (never commit)
- API uses appropriate scopes (`drive` or `drive.readonly` for read-only)
- Respects Google Drive sharing permissions
- Permanent deletion requires confirmation
- File downloads save to specified local paths only

## Troubleshooting

**"Missing OAuth credentials"**
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
- Run `auth` command to get refresh token

**"Failed to get access token"**
- Re-run `auth` command to refresh OAuth token
- Verify credentials in `.env` are correct

**"Drive API error"**
- Ensure Google Drive API is enabled in Google Cloud Console
- Verify file ID is correct
- Check that the Google account has access to the file

**"File not found"**
- Verify file ID is correct (use `search` to find files)
- Check that file is not in trash
- Ensure account has permission to access file

**"Permission denied"**
- Verify the Google account has appropriate permissions for the file
- Check file sharing settings
- Ensure OAuth scopes include necessary permissions

**"Export not supported"**
- File type may not support the requested export format
- Check supported export formats in references/export-formats.md
- Use `download` without export-type for non-Google Workspace files

**"Upload failed"**
- Check file exists at specified path
- Verify parent folder ID if specified
- Ensure sufficient Drive storage space
- Check file size limits (750 GB for My Drive)

