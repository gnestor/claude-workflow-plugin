---
name: air
description: Digital asset management (DAM) for Air.inc including assets, boards, tags, custom fields, and media uploads. Activate when the user asks about Air media library, uploading photos/videos, organizing assets into boards, or managing media metadata. Supports deduplication, bulk uploads, and vision-based content analysis.
category: ~~dam
service: Air.inc
---

# Air.inc

## Purpose

This skill enables direct interaction with the Air.inc API for digital asset management (DAM) using the `~~dam` client script. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to assets, boards, tags, custom fields, uploads, and deduplication features.

**Use this skill for DIGITAL ASSET MANAGEMENT in Air.inc.**

Authentication is handled automatically by lib/auth.js.

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

## Client Script

**Path:** `skills/air/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Test authentication |
| `list-assets` | List assets |
| `get-asset` | Get asset details |
| `delete-asset` | Delete an asset |
| `download-asset` | Download an asset |
| `get-asset-versions` | Get all versions of an asset |
| `get-asset-version` | Get a specific asset version |
| `add-asset-tag` | Add tag to an asset |
| `remove-asset-tag` | Remove tag from an asset |
| `set-custom-field` | Set custom field value on an asset |
| `get-asset-boards` | Get boards an asset belongs to |
| `list-boards` | List boards |
| `get-board` | Get board details |
| `create-board` | Create a board |
| `update-board` | Update a board |
| `delete-board` | Delete a board |
| `list-board-assets` | List assets in a board |
| `add-to-board` | Add assets to a board |
| `remove-from-board` | Remove asset from a board |
| `list-board-guests` | List board guests |
| `add-board-guest` | Add guest to a board |
| `update-board-guest` | Update board guest role |
| `remove-board-guest` | Remove guest from a board |
| `list-custom-fields` | List custom fields |
| `get-custom-field` | Get custom field details |
| `create-custom-field` | Create a custom field |
| `update-custom-field` | Update a custom field |
| `delete-custom-field` | Delete a custom field |
| `add-custom-field-option` | Add option to a select custom field |
| `update-custom-field-option` | Update a custom field option |
| `delete-custom-field-option` | Delete a custom field option |
| `list-tags` | List tags |
| `create-tag` | Create a tag |
| `update-tag` | Update a tag |
| `delete-tag` | Delete a tag |
| `upload-file` | Upload a file |
| `import-url` | Import asset from URL |
| `get-import-status` | Check import status |
| `list-roles` | List available roles |
| `find-duplicates-by-name` | Find duplicate assets by filename |
| `find-duplicates-by-hash` | Find duplicate assets by file hash |
| `check-duplicate` | Check if a file already exists before upload |

## Key API Concepts

- **Base URL**: `https://api.air.inc/shorturl/v1`
- **Workspace ID**: Required for all requests; configured in auth.
- **Pagination**: Cursor-based. Check response for next page indicators.
- **Rate limits**: Back off and retry on 429 errors.
- **Asset IDs**: Case-sensitive strings.

## Upload Workflow

### Small Files (< 5GB)
1. Use `upload-file` directly
2. File is uploaded via FormData

### URL Imports
1. Call `import-url` with the source URL
2. Check status with `get-import-status`
3. Wait for status to be `succeeded`

## Deduplication Workflow

### Before Uploading
1. Check if file already exists using `check-duplicate`
2. If no duplicates, proceed with upload

### Finding Existing Duplicates
- **Find by name** (fast) -- Groups assets with matching filenames
- **Find by hash** (more accurate) -- Groups assets with matching file hashes

### Removing Duplicates
1. Find duplicates using the commands above
2. Review the duplicate groups
3. Decide which to keep (usually the oldest or most organized)
4. Delete the others using `delete-asset`

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
1. Download asset for analysis using `download-asset`
2. The command returns a temp file path
3. Use Claude's Read tool to view and analyze the image

### Common Vision Use Cases
- **Product identification**: "What products are shown in this image?"
- **People detection**: "Are there any people in this photo?"
- **Scene description**: "Describe the setting of this image"
- **Quality assessment**: "Is this image suitable for marketing use?"
- **Text extraction**: "What text appears in this image?"

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('air', '/assets');
```

## Reference Files
- No reference files yet. Add examples.md and documentation.md to references/ as needed.
