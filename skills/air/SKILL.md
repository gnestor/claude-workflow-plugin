---
name: air
description: Digital asset management (DAM) for Air.inc including assets, boards, tags, custom fields, and media uploads. Activate when the user asks about Air media library, uploading photos/videos, organizing assets into boards, or managing media metadata. Supports deduplication, bulk uploads, and vision-based content analysis.
---

# Air API Integration

## Purpose

This skill enables direct interaction with the Air.inc API for digital asset management (DAM) using `~~dam` tools. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to assets, boards, tags, custom fields, uploads, and deduplication features.

**Use this skill for DIGITAL ASSET MANAGEMENT in Air.inc.**

Authentication is handled by the MCP server configuration.

## When to Use

Activate this skill when the user:
- Mentions "Air", "Air.inc", "media library", or "DAM"
- Asks about digital assets: "Show me all assets in Air"
- Asks about boards: "Create a new board for Summer 2025"
- Asks about uploads: "Upload these photos to Air"
- Asks about organization: "Tag all product photos"
- Asks about duplicates: "Find duplicate images in Air"
- Asks about media analysis: "Identify products in these images"
- Wants to manage guests: "Share this board with john@example.com"
- References creative assets, brand assets, or media management

## When NOT to Use

- **Pinterest uploads**: Use pinterest skill for Pinterest boards and pins
- **Google Drive storage**: Use google-drive skill for Drive files
- **Shopify product images**: Use shopify skill for product media
- **General file storage**: Use appropriate cloud storage skills

## Available Tools

The `~~dam` MCP server provides tools for:
- **Assets** - List, get, delete, download assets; get asset versions; manage tags and custom fields on assets; get asset's boards
- **Boards** - List, get, create, update, delete boards; list board assets; add/remove assets from boards; manage board guests
- **Custom Fields** - List, create, update, delete custom fields; add options to select fields
- **Tags** - List, create, update, delete tags
- **Uploads** - Upload files, import from URL, check import status
- **Deduplication** - Find duplicates by filename or hash; check if file exists before upload
- **Vision Analysis** - Download assets for vision-based content analysis
- **Roles** - List available roles for guest management

## Natural Language to API Translation

### Step 1: Identify the Resource Type

| User Says | Resource |
|-----------|----------|
| "assets", "media", "files", "images", "photos", "videos" | Assets |
| "boards", "folders", "collections" | Boards |
| "tags", "labels" | Tags |
| "custom fields", "metadata", "properties" | Custom Fields |
| "duplicates", "copies", "repeated" | Deduplication |

### Step 2: Identify the Operation

| User Says | Operation |
|-----------|-----------|
| "show", "list", "get", "find", "search" | Read (list/get) |
| "create", "add", "new", "upload" | Create/Upload |
| "update", "change", "edit", "rename" | Update |
| "delete", "remove", "trash" | Delete |
| "organize", "tag", "categorize" | Metadata operations |
| "share", "invite", "add guest" | Guest management |
| "download", "export" | Download |
| "analyze", "identify", "what's in" | Vision analysis |

### Step 3: Extract Parameters

- Asset/Board IDs from context or previous queries
- Search terms from quoted text
- File paths for uploads
- JSON data for complex operations

## Upload Workflow

### Small Files (< 5GB)
1. Use the upload tools directly
2. File is uploaded via FormData

### URL Imports
1. Call import-url with the source URL
2. Check status with get-import-status
3. Wait for status to be `succeeded`

## Deduplication Workflow

### Before Uploading
1. Check if file already exists using check-duplicate tools
2. If no duplicates, proceed with upload

### Finding Existing Duplicates
- **Find by name** (fast) - Groups assets with matching filenames
- **Find by hash** (more accurate) - Groups assets with matching file hashes

### Removing Duplicates
1. Find duplicates using tools above
2. Review the duplicate groups
3. Decide which to keep (usually the oldest or most organized)
4. Delete the others using delete-asset tools

## Bulk Upload Workflow

For bulk uploading multiple files:
1. List files to upload
2. Check each for duplicates
3. Upload non-duplicate files
4. Optionally add to a board
5. Apply tags or custom field values
6. Report results (success/failure summary)

## Vision Integration Workflow

### Analyzing Asset Content
1. Download asset for analysis using vision tools
2. The tool returns a temp file path
3. Use Claude's Read tool to view and analyze the image

### Common Vision Use Cases
- **Product identification**: "What products are shown in this image?"
- **People detection**: "Are there any people in this photo?"
- **Scene description**: "Describe the setting of this image"
- **Quality assessment**: "Is this image suitable for marketing use?"
- **Text extraction**: "What text appears in this image?"

## Rate Limits

The Air API has rate limits. If you encounter rate limit errors:
1. Wait a few seconds before retrying
2. Reduce the frequency of API calls
3. Use pagination to fetch data in smaller batches

## Security Notes

- Never expose API keys or workspace IDs in logs or responses
- Credentials are managed by MCP server configuration

## Troubleshooting

### Authentication Errors
```
Error: Air API error (401): Unauthorized
```
- Verify MCP server configuration
- Check that the API key has not been revoked

### Not Found Errors
```
Error: Air API error (404): Not found
```
- Verify the asset/board/tag ID exists
- Check that you have access to the resource
- IDs are case-sensitive

### Rate Limit Errors
```
Error: Air API error (429): Too many requests
```
- Wait a few seconds and retry
- Reduce the frequency of API calls

### Upload Errors
```
Error: Upload failed (413): Payload too large
```
- File exceeds size limit
- For large files, consider using the Air web interface

### Permission Errors
```
Error: Air API error (403): Forbidden
```
- API key may not have the required permissions
- Check MCP server configuration for API permissions
