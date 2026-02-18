---
name: google-drive
description: Google Drive file and folder management. Use for searching, downloading, uploading, updating, organizing, and sharing files in Google Drive. Activate when the user mentions Google Drive, needs to search for files, download documents, upload content, or manage Drive organization.
---

# Google Drive Integration

## Purpose

This skill enables complete interaction with Google Drive through the Drive API v3. It provides full access to files and folders for searching, downloading, uploading, updating, organizing, and sharing content.

**Use this skill for:**
- Searching for files and folders in Google Drive
- Downloading files (documents, spreadsheets, images, etc.)
- Uploading new files and folders
- Updating existing files
- Creating, moving, and organizing folders
- Managing file permissions and sharing
- Listing files with filtering and sorting

## Authentication

Authentication is handled by the MCP server. All Drive API access is managed through the server's OAuth credentials.

## When to Use

Activate this skill when the user:
- Mentions "Google Drive", "Drive", or "GDrive"
- Wants to search for files: "find my presentation about Q4 results"
- Needs to download files: "download the latest budget spreadsheet"
- Wants to upload files: "upload this document to Drive"
- Needs to organize files: "move these files to the Marketing folder"
- Asks about file sharing: "share this with the team"
- Wants to list files in a folder: "show me what's in the Projects folder"

## When NOT to Use

- **Google Sheets data analysis**: Use google-sheets skill for reading/writing spreadsheet data
- **Email**: Use gmail skill for email access
- **Website analytics**: Use google-analytics skill for traffic data
- **Database queries**: Use postgresql skill for cross-source database queries

## Available Operations

Use `~~workspace` tools for all Google Drive operations.

### Search Files
Search for files and folders using Google Drive search syntax.

Returns: List of files with id, name, mimeType, createdTime, modifiedTime, size, webViewLink

### List Files
List files in a specific folder or in My Drive.

### Get File Details
Get detailed information about a specific file.

Returns: Complete file metadata including name, mimeType, size, parents, permissions, sharing settings

### Download File
Download a file from Google Drive to local filesystem.

Supported export types for Google Workspace files:
- Google Docs: PDF, Plain Text, HTML, RTF, DOCX
- Google Sheets: PDF, CSV, XLSX
- Google Slides: PDF, PPTX

### Upload File
Upload a file to Google Drive.

### Update File
Update an existing file's content or metadata.

Metadata fields: `name`, `description`, `mimeType`, `starred`, `trashed`

### Create Folder
Create a new folder in Google Drive.

### Move File
Move a file to a different folder.

### Copy File
Create a copy of a file.

### Delete File
Move a file to trash or permanently delete it.

**Warning**: Permanent deletion cannot be undone. Use trash for recoverable deletion.

### Share File
Manage file permissions and sharing.

Roles: `reader`, `writer`, `commenter`, `owner`
Types: `user`, `group`, `domain`, `anyone`

### Export Google Workspace File
Export Google Docs, Sheets, or Slides to different formats.

## Natural Language to Query Process

### Step 1: Identify the Operation Type

Map user's request to appropriate command:
- "find", "search for" -> search
- "show me files", "list files" -> list
- "download", "get me" -> download
- "upload", "add to drive" -> upload
- "create folder", "make folder" -> create folder
- "move", "relocate" -> move
- "copy", "duplicate" -> copy
- "delete", "remove" -> trash or delete
- "share", "give access" -> share

### Step 2: Parse Search Intent

Convert natural language to search query:

**By name:**
- "budget spreadsheet" -> `name contains 'budget'`

**By file type:**
- "spreadsheets" -> `mimeType='application/vnd.google-apps.spreadsheet'`
- "PDFs" -> `mimeType='application/pdf'`
- "images" -> `mimeType contains 'image/'`
- "folders" -> `mimeType='application/vnd.google-apps.folder'`

**By time:**
- "recent files" -> `modifiedTime > 'YYYY-MM-DDT00:00:00'`

**By owner/sharing:**
- "my files" -> `'me' in owners`
- "shared with me" -> `sharedWithMe = true`

### Step 3: Execute and Present Results

Format results clearly:
- **Search/List**: Show table of files with name, type, modified time, link
- **Download**: Confirm file saved to local path
- **Upload**: Show upload success with Drive link
- **Share**: Confirm permissions added

## Reference Files

Detailed information available in `references/` directory:

- **workflow-examples.md** - Step-by-step examples for common operations
- **search-syntax.md** - Google Drive search query syntax and operators
- **mime-types.md** - Complete list of MIME types for Google Drive files
- **export-formats.md** - Export format options for Google Workspace files

## Security Notes

- Never expose OAuth credentials in output
- Respects Google Drive sharing permissions
- Permanent deletion requires confirmation
- File downloads save to specified local paths only

## Troubleshooting

**"Missing credentials"**
- Verify the MCP server connection is active

**"File not found"**
- Verify file ID is correct (use search to find files)
- Check that file is not in trash
- Ensure account has permission to access file

**"Permission denied"**
- Verify the Google account has appropriate permissions
- Check file sharing settings

**"Export not supported"**
- Check supported export formats in references/export-formats.md
- Use download without export type for non-Google Workspace files

**"Upload failed"**
- Check file exists at specified path
- Verify parent folder ID if specified
- Ensure sufficient Drive storage space
