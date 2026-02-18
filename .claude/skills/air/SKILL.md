---
name: air
description: Digital asset management (DAM) for Air.inc including assets, boards, tags, custom fields, and media uploads. Activate when the user asks about Air media library, uploading photos/videos, organizing assets into boards, or managing media metadata. Supports deduplication, bulk uploads, and vision-based content analysis.
---

# Air API Integration

## Purpose

This Skill enables direct interaction with the Air.inc API for digital asset management (DAM). It translates natural language questions into API calls, executes them, and interprets the results. Provides access to assets, boards, tags, custom fields, uploads, and deduplication features.

**Use this skill for DIGITAL ASSET MANAGEMENT in Air.inc.**

## When to Use

Activate this Skill when the user:
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

## Setup

1. Log in to Air.inc
2. Go to Settings → API
3. Generate an API key
4. Note your workspace ID from the URL
5. Save to `.env`:
   - `AIR_API_KEY=your-key`
   - `AIR_WORKSPACE_ID=your-workspace-id`

## Available Operations

### 1. Authentication

#### Test Authentication
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts test-auth
```

### 2. Assets

#### List Assets
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-assets [--board-id ID] [--limit N] [--cursor TOKEN] [--search QUERY]
```

Parameters:
- `--board-id` (optional): Filter by board
- `--limit` (optional): Max results to return
- `--cursor` (optional): Pagination cursor
- `--search` (optional): Search query

#### Get Asset Details
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts get-asset <asset-id>
```

#### Delete Asset
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts delete-asset <asset-id>
```

#### Download Asset
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts download-asset <asset-id> <output-path>
```

#### Get Asset Versions
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts get-asset-versions <asset-id>
```

#### Add Tag to Asset
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-asset-tag <asset-id> <version-id> <tag-id>
```

#### Remove Tag from Asset
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts remove-asset-tag <asset-id> <version-id> <tag-id>
```

#### Set Custom Field Value
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts set-custom-field <asset-id> <field-id> <value>
```

#### Get Asset's Boards
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts get-asset-boards <asset-id>
```

### 3. Boards

#### List Boards
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-boards [--limit N] [--cursor TOKEN]
```

#### Get Board Details
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts get-board <board-id>
```

#### Create Board
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts create-board '{"name": "Summer 2025", "description": "Summer collection assets"}'
```

#### Update Board
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts update-board <board-id> '{"name": "Updated Name"}'
```

#### Delete Board
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts delete-board <board-id>
```

#### List Board Assets
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-board-assets <board-id> [--limit N]
```

#### Add Assets to Board
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-assets-to-board <board-id> '["asset-id-1", "asset-id-2"]'
```

#### Remove Asset from Board
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts remove-asset-from-board <board-id> <asset-id>
```

#### List Board Guests
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-board-guests <board-id>
```

#### Add Guest to Board
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-board-guest <board-id> '{"email": "guest@example.com", "roleId": "role-id"}'
```

#### Remove Guest from Board
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts remove-board-guest <board-id> <guest-id>
```

### 4. Custom Fields

#### List Custom Fields
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-custom-fields
```

#### Create Custom Field
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts create-custom-field '{"name": "Product Type", "type": "single-select"}'
```

Supported types: `single-select`, `multi-select`, `plain-text`, `date`

#### Update Custom Field
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts update-custom-field <field-id> '{"name": "New Name"}'
```

#### Delete Custom Field
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts delete-custom-field <field-id>
```

#### Add Option to Select Field
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-custom-field-option <field-id> '{"name": "Option Name", "color": "#FF0000"}'
```

### 5. Tags

#### List Tags
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-tags
```

#### Create Tag
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts create-tag '{"name": "Product Shot", "color": "#00FF00"}'
```

#### Update Tag
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts update-tag <tag-id> '{"name": "Updated Name"}'
```

#### Delete Tag
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts delete-tag <tag-id>
```

### 6. Uploads

#### Upload File
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts upload /path/to/file.jpg [--board-id ID] [--name "Custom Name"]
```

Parameters:
- `--board-id` (optional): Add to board after upload
- `--name` (optional): Custom filename

#### Import from URL
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts import-url '{"url": "https://example.com/image.jpg", "name": "Imported Image", "boardId": "optional-board-id"}'
```

#### Check Import Status
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts get-import-status <import-id>
```

Import status values: `pending`, `inProgress`, `failed`, `succeeded`

### 7. Roles

#### List Roles
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-roles
```

### 8. Deduplication

#### Find Duplicates by Filename
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts find-duplicates-by-name [--board-id ID]
```

Returns groups of assets with matching filenames.

#### Find Duplicates by Hash
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts find-duplicates-by-hash [--board-id ID]
```

Returns groups of assets with matching file hashes (if provided by API).

#### Check if File Exists Before Upload
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts check-duplicate /path/to/file.jpg [--board-id ID]
```

Returns whether a matching asset already exists (by name or hash).

### 9. Vision Analysis

#### Download Asset for Vision Analysis
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts download-for-analysis <asset-id>
```

Downloads the asset to a temp file and returns the path. Use Claude's vision capabilities to analyze the image by reading the temp file.

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
1. Use the `upload` command directly
2. File is uploaded via FormData

### Large Files (>= 5GB)
For files 5GB or larger, use multipart upload:
1. Initialize upload to get presigned URLs
2. Upload file in chunks
3. Complete the upload

(Note: The current implementation uses direct upload. For files >= 5GB, consider chunking or using the Air web interface.)

### URL Imports
1. Call `import-url` with the source URL
2. Check status with `get-import-status`
3. Wait for status to be `succeeded`

## Deduplication Workflow

### Before Uploading
```bash
# Check if file already exists
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts check-duplicate /path/to/file.jpg

# If no duplicates, upload
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts upload /path/to/file.jpg
```

### Finding Existing Duplicates
```bash
# Find by name (fast)
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts find-duplicates-by-name

# Find by hash (more accurate, but depends on API providing hashes)
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts find-duplicates-by-hash
```

### Removing Duplicates
1. Find duplicates using commands above
2. Review the duplicate groups
3. Decide which to keep (usually the oldest or most organized)
4. Delete the others using `delete-asset`

## Vision Integration Workflow

### Analyzing Asset Content
1. Download asset for analysis:
```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts download-for-analysis <asset-id>
```

2. The command returns a temp file path like `/tmp/air-vision-abc123.jpg`

3. Use Claude's Read tool to view and analyze the image:
```
Read the image at /tmp/air-vision-abc123.jpg and identify any products visible in it.
```

### Common Vision Use Cases
- **Product identification**: "What products are shown in this image?"
- **People detection**: "Are there any people in this photo?"
- **Scene description**: "Describe the setting of this image"
- **Quality assessment**: "Is this image suitable for marketing use?"
- **Text extraction**: "What text appears in this image?"

## Reference Files

Detailed information available in `references/` directory:

- **boards.md** - Top-level board IDs and descriptions for navigating the workspace
- **workflow-examples.md** - Step-by-step examples for common operations (uploads, boards, bulk operations)
- **api-endpoints.md** - Complete API endpoint reference

## Rate Limits

The Air API has rate limits. If you encounter rate limit errors:
1. Wait a few seconds before retrying
2. Reduce the frequency of API calls
3. Use pagination to fetch data in smaller batches

## Security Notes

- Never expose `AIR_API_KEY` in logs or responses
- Never expose `AIR_WORKSPACE_ID` in public code
- Store credentials securely in `.env` file
- The `.env` file should be in `.gitignore`

## Troubleshooting

### Authentication Errors
```
Error: Air API error (401): Unauthorized
```
- Verify `AIR_API_KEY` is correct
- Verify `AIR_WORKSPACE_ID` is correct
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
- Your API key may not have the required permissions
- Check workspace settings for API permissions

