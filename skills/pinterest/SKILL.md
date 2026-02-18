---
name: pinterest
description: Pinterest content management including boards, pins, media uploads, and analytics. Activate when the user asks about Pinterest boards, creating or uploading pins, querying Pinterest analytics, or managing Pinterest content. Use for bulk uploading images with SEO-optimized metadata (title, description, alt text).
---

# Pinterest API Integration

## Purpose

This skill enables direct interaction with the Pinterest API v5 using `~~social-media` tools. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to boards, pins, board sections, user account data, and analytics.

**Use this skill for Pinterest content management and analytics.**

Authentication is handled by the MCP server configuration.

## When to Use

Activate this skill when the user:
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

## Available Tools

The `~~social-media` MCP server provides tools for:
- **Account** - Get account info, analytics, top pins, followers/following
- **Boards** - List, get, create, update, delete boards; list board pins; search boards; get board summary
- **Board Sections** - List, create, update, delete sections; list section pins
- **Pins** - List, get, create, update, delete pins; get pin analytics; save pin to board
- **Media** - Upload images, create pins with various media sources (URL, base64, video)

## Natural Language to API Translation

### Step 1: Identify the Resource Type

Map natural language terms:
- "boards", "collections" -> boards operations
- "pins", "images", "photos", "posts" -> pins operations
- "sections", "folders" -> board sections
- "analytics", "performance", "stats" -> analytics endpoints
- "followers", "following" -> user account

### Step 2: Determine the Operation

| User Intent | Operation |
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
- By name: First search-boards, get ID
- By ID: Use directly

**Date ranges:**
- "last week" -> 7 days ago to today
- "this month" -> first of month to today
- "January 2025" -> 2025-01-01 to 2025-01-31

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
4. **Upload pins** using create-pin tools for each image
5. **Report results**: Success/failure summary

### Pin Creation Data Structure

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
- `video_id`: Use `media_id` from register-media
- `multiple_image_urls`: Use `items` array for carousel pins

## Board Management

**Privacy options for boards:** `PUBLIC`, `PROTECTED`, `SECRET`

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

- Never expose client secrets or refresh tokens in output
- Refresh tokens may rotate - tokens are managed by MCP server
- Always use HTTPS for image URLs
- Be cautious with delete operations - they cannot be undone

## Troubleshooting

**"Authentication failed"**
- Verify MCP server configuration
- Re-authenticate if tokens have expired

**"Board not found"**
- Use list-boards to see available boards
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
- Check MCP server configuration for required permissions
