---
name: pinterest
description: Pinterest content management including boards, pins, media uploads, and analytics. Activate when the user asks about Pinterest boards, creating or uploading pins, querying Pinterest analytics, or managing Pinterest content. Use for bulk uploading images with SEO-optimized metadata (title, description, alt text).
---

# Pinterest API Integration

## Purpose

This Skill enables direct interaction with the Pinterest API v5. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to boards, pins, board sections, user account data, and analytics.

**Use this skill for Pinterest content management and analytics.**

## When to Use

Activate this Skill when the user:
- Mentions "Pinterest", "pins", or "boards" in the context of social media
- Wants to list or search boards: "Show me my Pinterest boards"
- Needs to create boards: "Create a new Pinterest board called Summer 2025"
- Wants to upload pins: "Upload this image to my Product Photos board"
- Needs to query pin analytics: "How is my pin performing?"
- Asks about followers: "List my Pinterest followers"
- Wants to organize content: "Create a section on my board"
- Needs to bulk upload images with optimized metadata

## When NOT to Use

- **Instagram**: Use instagram skill for Instagram content
- **General social media scheduling**: This is for direct Pinterest API operations
- **Cross-platform analytics**: Use dedicated analytics tools
- **Cross-source queries**: Use postgresql skill when joining Pinterest data with Shopify, Gorgias, or other sources

## Prerequisites

Pinterest API credentials in `.env` file. Two options:

**Option A: Direct Access Token (for trial apps)**
- `PINTEREST_ACCESS_TOKEN` - Access token from Pinterest Developer Portal

**Option B: Full OAuth (for approved apps)**
- `PINTEREST_CLIENT_ID` - OAuth2 App ID from Pinterest Developer Portal
- `PINTEREST_CLIENT_SECRET` - OAuth2 App Secret
- `PINTEREST_REFRESH_TOKEN` - OAuth2 refresh token (obtained via auth flow)

## Setup Instructions

### 1. Create Pinterest Developer Application

1. Go to [Pinterest Developers](https://developers.pinterest.com/)
2. Create a new app or select existing one
3. Request required scopes: `boards:read`, `boards:write`, `pins:read`, `pins:write`, `user_accounts:read`

### 2. Configure Environment Variables

**Option A: Trial App (access token only)**

If your app is pending approval and you only have an access token:

```bash
PINTEREST_ACCESS_TOKEN="your-access-token"
```

Note: Access tokens expire (typically 30 days). You'll need to regenerate from the Developer Portal when expired.

**Option B: Approved App (full OAuth)**

Once your app is approved and you have the client secret:

```bash
PINTEREST_CLIENT_ID="your-app-id"
PINTEREST_CLIENT_SECRET="your-app-secret"
```

Then run the authentication command:

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/pinterest/scripts/pinterest-client.ts auth
```

This will:
1. Open your browser to Pinterest's OAuth consent page
2. After authorization, you'll be redirected (the page will error - that's expected)
3. Copy the full URL and paste it back into the terminal
4. Save refresh token to `.env` automatically

## Available Operations

### Authentication

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/pinterest/scripts/pinterest-client.ts auth
```

### User Account

#### Get Account Info
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts account-info
```

#### Get Account Analytics
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts account-analytics <start-date> <end-date>
```

Parameters: Dates in YYYY-MM-DD format

#### Get Top Pins
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts top-pins <start-date> <end-date>
```

#### List Followers/Following
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts list-followers [page-size]
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts list-following [page-size]
```

### Boards

#### List Boards
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts list-boards [page-size]
```

#### Get Board
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts get-board <board-id>
```

#### Create Board
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-board '{"name": "Board Name", "description": "Optional description", "privacy": "PUBLIC"}'
```

Privacy options: `PUBLIC`, `PROTECTED`, `SECRET`

#### Update Board
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts update-board <board-id> '{"name": "New Name"}'
```

#### Delete Board
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts delete-board <board-id>
```

#### List Pins on Board
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts list-board-pins <board-id> [page-size]
```

#### Search Boards
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts search-boards "query"
```

#### Get Board Summary
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts board-summary <board-id>
```

### Board Sections

#### List Sections
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts list-sections <board-id>
```

#### Create Section
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-section <board-id> "Section Name"
```

#### Update Section
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts update-section <board-id> <section-id> "New Name"
```

#### Delete Section
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts delete-section <board-id> <section-id>
```

#### List Pins in Section
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts list-section-pins <board-id> <section-id>
```

### Pins

#### List Pins
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts list-pins [page-size]
```

#### Get Pin
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts get-pin <pin-id>
```

#### Create Pin
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-pin '<json>'
```

**JSON Structure for create-pin:**
```json
{
  "board_id": "123456789",
  "board_section_id": "optional-section-id",
  "title": "Pin Title (100 chars max)",
  "description": "Pin description with keywords (500 chars max)",
  "alt_text": "Descriptive alt text for accessibility",
  "link": "https://example.com/product-page",
  "media_source": {
    "source_type": "image_url",
    "url": "https://example.com/image.jpg"
  }
}
```

**media_source options:**
- `image_url`: Use `url` field with public image URL
- `image_base64`: Use `data` field with base64 encoded image
- `video_id`: Use `media_id` from register-media command
- `multiple_image_urls`: Use `items` array for carousel pins

#### Update Pin
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts update-pin <pin-id> '{"title": "New Title"}'
```

#### Delete Pin
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts delete-pin <pin-id>
```

#### Get Pin Analytics
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts pin-analytics <pin-id> <start-date> <end-date>
```

#### Save Pin to Board
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts save-pin <pin-id> <board-id> [section-id]
```

## Natural Language to API Translation

### Step 1: Identify the Resource Type

Map natural language terms:
- "boards", "collections" → boards operations
- "pins", "images", "photos", "posts" → pins operations
- "sections", "folders" → board sections
- "analytics", "performance", "stats" → analytics endpoints
- "followers", "following" → user account

### Step 2: Determine the Operation

| User Intent | Command |
|------------|---------|
| "Show me my boards" | list-boards |
| "What pins are on X board?" | list-board-pins |
| "Create a new board called X" | create-board |
| "Upload this image to X board" | create-pin |
| "How is my pin performing?" | pin-analytics |
| "Delete the pin" | delete-pin |
| "Add a section to board" | create-section |
| "Search for my X board" | search-boards |

### Step 3: Extract Parameters

**Board identification:**
- By name: First `search-boards`, get ID
- By ID: Use directly

**Date ranges:**
- "last week" → 7 days ago to today
- "this month" → first of month to today
- "January 2025" → 2025-01-01 to 2025-01-31

### Step 4: Build and Execute

Example: "Upload product-photo.jpg to my Product Photos board"
1. Run `search-boards "Product Photos"` to find board ID
2. Run `create-pin` with board_id and image URL

## Bulk Upload Workflow

For bulk uploading images with SEO-optimized metadata:

### Process

1. **User provides images**: Folder path or list of image URLs
2. **Claude analyzes each image** and generates:
   - **Title**: SEO-optimized, keyword-rich (100 chars max)
   - **Description**: Engaging, includes relevant keywords (500 chars max)
   - **Alt text**: Descriptive for accessibility
   - **Link**: Product/page URL (if applicable)
3. **User reviews and approves** the generated metadata
4. **Upload pins** using create-pin command for each image
5. **Report results**: Success/failure summary

### Example Workflow

```
User: "Bulk upload the photos from our Summer 2025 shoot to Pinterest"

Claude:
1. Identifies/creates target board
2. For each image:
   - Analyzes image content
   - Generates optimized title, description, alt text
   - Presents for approval
3. Uploads each pin with generated metadata
4. Reports: "Uploaded 25 pins to Summer 2025 board"
```

See [workflow-examples.md](references/workflow-examples.md) for detailed examples.

## Rate Limits

Pinterest API has rate limits:
- Standard endpoints: ~1000 requests per minute
- Analytics endpoints: May have lower limits
- Bulk operations: Add 100-200ms delay between requests

If rate limited:
- Wait 1 minute before retrying
- Reduce request frequency
- Use pagination for large datasets

## Security Notes

- Never expose `PINTEREST_CLIENT_SECRET` or `PINTEREST_REFRESH_TOKEN` in output
- Refresh tokens may rotate - script auto-saves new tokens
- Always use HTTPS for image URLs
- Be cautious with delete operations - they cannot be undone

## Troubleshooting

**"Authentication failed"**
- Check `PINTEREST_CLIENT_ID` and `PINTEREST_CLIENT_SECRET` are correct
- Verify `PINTEREST_REFRESH_TOKEN` is valid
- Re-run `auth` command to get new tokens

**"Board not found"**
- Use `list-boards` to see available boards
- Check board ID format (numeric string)
- Board may be private or deleted

**"Pin creation failed"**
- Verify board_id is correct
- Check image URL is accessible
- Ensure media_source format is correct
- Title must be under 100 characters

**"Rate limit exceeded"**
- Wait 1 minute before retrying
- Add delays between bulk operations
- Reduce request frequency

**"Invalid scope"**
- Re-authenticate with correct scopes
- Verify app has required permissions in Pinterest Developer Portal

