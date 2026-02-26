---
name: pinterest
description: Pinterest content management including boards, pins, media uploads, and analytics. Activate when the user asks about Pinterest boards, creating or uploading pins, querying Pinterest analytics, or managing Pinterest content. Use for bulk uploading images with SEO-optimized metadata (title, description, alt text).
category: ~~social-media
service: pinterest
---

# Pinterest

## Purpose

This skill enables direct interaction with the Pinterest API v5 via a client script. It translates natural language questions into API calls, executes them, and interprets the results. Provides access to boards, pins, board sections, user account data, and analytics.

**Use this skill for Pinterest content management and analytics.**

Authentication is handled automatically by `lib/auth.js`.

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

## Client Script

**Path:** `skills/pinterest/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `test-auth` | Verify authentication is working |
| `get-profile` | Get account profile information |
| `get-analytics --start-date --end-date` | Get account-level analytics for a date range |
| `top-pins --start-date --end-date` | Get top performing pins for a date range |
| `list-followers` | List account followers |
| `list-following` | List accounts being followed |
| `list-boards [--limit, --bookmark]` | List all boards with optional pagination |
| `get-board --board-id` | Get details for a specific board |
| `create-board --name [--description, --privacy]` | Create a new board |
| `update-board --board-id` | Update board details |
| `delete-board --board-id` | Delete a board |
| `list-board-pins --board-id` | List all pins on a board |
| `list-sections --board-id` | List sections within a board |
| `create-section --board-id --name` | Create a new board section |
| `update-section --section-id --name` | Rename a board section |
| `delete-section --section-id` | Delete a board section |
| `list-section-pins --section-id` | List pins within a section |
| `list-pins [--limit, --bookmark]` | List all pins with optional pagination |
| `get-pin --pin-id` | Get details for a specific pin |
| `create-pin --board-id --title --media-url [--description, --alt-text, --link, --section-id]` | Create a new pin |
| `update-pin --pin-id [--title, --description, --alt-text, --link]` | Update pin metadata |
| `delete-pin --pin-id` | Delete a pin |
| `get-pin-analytics --pin-id --start-date --end-date` | Get analytics for a specific pin |
| `save-pin --pin-id --board-id [--section-id]` | Save an existing pin to a board |

## Key API Concepts

Pinterest API v5 (`api.pinterest.com/v5`). Uses bookmark-based pagination for list endpoints. Rate limit is ~1000 requests per minute; add 100-200ms delay between bulk operations. Board privacy options: `PUBLIC`, `PROTECTED`, `SECRET`.

## Bulk Upload Workflow

For bulk uploading images with SEO-optimized metadata:

1. **User provides images**: Folder path or list of image URLs
2. **Claude analyzes each image** and generates:
   - **Title**: SEO-optimized, keyword-rich (100 chars max)
   - **Description**: Engaging, includes relevant keywords (500 chars max)
   - **Alt text**: Descriptive for accessibility
   - **Link**: Product/page URL (if applicable)
3. **User reviews and approves** the generated metadata
4. **Upload pins** using create-pin for each image
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

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('pinterest', '/v5/boards');
```

## Reference Files
- [examples.md](references/examples.md) — Usage patterns and queries
- [documentation.md](references/documentation.md) — Full API documentation
