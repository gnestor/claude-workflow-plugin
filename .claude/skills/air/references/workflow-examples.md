# Air API Workflow Examples

## Example 1: Upload Product Photos to Board

**Scenario**: Upload a batch of product photos to a specific board.

### Step 1: Find or create the target board

```bash
# List existing boards
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-boards

# Or create a new board
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts create-board '{"name": "Product Photos Q1 2025", "description": "Product photography for Q1 campaign"}'
```

### Step 2: Upload photos to the board

```bash
# Upload with board assignment
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts upload /path/to/photo1.jpg --board-id abc123
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts upload /path/to/photo2.jpg --board-id abc123
```

### Step 3: Tag the uploaded assets

```bash
# First, list available tags
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-tags

# Then tag each asset (need asset ID from upload response)
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-asset-tag <asset-id> <version-id> <tag-id>
```

---

## Example 2: Bulk Upload with Deduplication Check

**Scenario**: Upload multiple files but skip any that already exist.

### Step 1: Check each file before upload

```bash
# Check if file already exists
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts check-duplicate /path/to/photo.jpg
```

Response:
```json
{
  "success": true,
  "isDuplicate": false,
  "nameMatches": [],
  "hashMatches": [],
  "localName": "photo.jpg",
  "localHash": "abc123..."
}
```

### Step 2: Upload only non-duplicates

```bash
# If isDuplicate is false, proceed with upload
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts upload /path/to/photo.jpg --board-id xyz789
```

### Bash loop for bulk operations

```bash
for file in /path/to/photos/*.jpg; do
  result=$(deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts check-duplicate "$file")
  is_dup=$(echo "$result" | jq -r '.isDuplicate')
  if [ "$is_dup" = "false" ]; then
    deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts upload "$file" --board-id abc123
  else
    echo "Skipping duplicate: $file"
  fi
done
```

---

## Example 3: Organize Assets with Tags and Custom Fields

**Scenario**: Categorize assets using tags and custom fields.

### Step 1: Create custom field for categorization

```bash
# Create a single-select field for product type
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts create-custom-field '{"name": "Product Type", "type": "single-select"}'
```

### Step 2: Add options to the field

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-custom-field-option <field-id> '{"name": "Tops", "color": "#FF6B6B"}'
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-custom-field-option <field-id> '{"name": "Bottoms", "color": "#4ECDC4"}'
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-custom-field-option <field-id> '{"name": "Accessories", "color": "#45B7D1"}'
```

### Step 3: Create tags for status

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts create-tag '{"name": "Approved", "color": "#2ECC71"}'
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts create-tag '{"name": "Needs Review", "color": "#F1C40F"}'
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts create-tag '{"name": "Rejected", "color": "#E74C3C"}'
```

### Step 4: Apply to assets

```bash
# Set custom field value
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts set-custom-field <asset-id> <field-id> "Tops"

# Add status tag
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-asset-tag <asset-id> <version-id> <approved-tag-id>
```

---

## Example 4: Vision Analysis for Product Identification

**Scenario**: Analyze product photos to identify what products are shown.

### Step 1: Download asset for analysis

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts download-for-analysis <asset-id>
```

Response:
```json
{
  "success": true,
  "tempPath": "/tmp/air-vision-abc123.jpg",
  "assetName": "product-shot-001.jpg",
  "mimeType": "image/jpeg",
  "size": 2048576,
  "message": "Asset downloaded to /tmp/air-vision-abc123.jpg. Use the Read tool to analyze the image with Claude's vision capabilities."
}
```

### Step 2: Analyze with Claude Vision

Ask Claude:
> "Read the image at /tmp/air-vision-abc123.jpg and tell me what products are visible. Describe the colors, styles, and any visible details."

### Step 3: Tag based on analysis

Based on Claude's analysis, apply appropriate tags:

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-asset-tag <asset-id> <version-id> <product-tag-id>
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts set-custom-field <asset-id> <product-type-field-id> "Shorts"
```

---

## Example 5: Find and Remove Duplicate Assets

**Scenario**: Clean up duplicate files in your media library.

### Step 1: Find duplicates by name

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts find-duplicates-by-name
```

Response:
```json
{
  "success": true,
  "duplicates": [
    {
      "name": "product-hero.jpg",
      "count": 3,
      "assets": [
        {"id": "asset1", "name": "product-hero.jpg", "createdAt": "2024-01-15"},
        {"id": "asset2", "name": "product-hero.jpg", "createdAt": "2024-02-20"},
        {"id": "asset3", "name": "Product-Hero.jpg", "createdAt": "2024-03-01"}
      ]
    }
  ],
  "totalDuplicates": 2
}
```

### Step 2: Review and decide which to keep

Compare the assets:
- asset1: Original from January (keep)
- asset2: Duplicate from February (delete)
- asset3: Another duplicate from March (delete)

### Step 3: Delete duplicates

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts delete-asset asset2
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts delete-asset asset3
```

---

## Example 6: Share Board with External Collaborators

**Scenario**: Share a board with an external partner for review.

### Step 1: Get available roles

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-roles
```

### Step 2: Add guest to board

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts add-board-guest <board-id> '{"email": "partner@example.com", "roleId": "viewer-role-id"}'
```

### Step 3: List current guests

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-board-guests <board-id>
```

### Step 4: Update guest permissions if needed

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts update-board-guest <board-id> <guest-id> '{"roleId": "editor-role-id"}'
```

### Step 5: Remove guest when done

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts remove-board-guest <board-id> <guest-id>
```

---

## Example 7: Import Assets from External URLs

**Scenario**: Import images from a website or CDN into Air.

### Step 1: Import from URL

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts import-url '{"url": "https://cdn.example.com/image.jpg", "name": "Imported Campaign Image", "boardId": "target-board-id"}'
```

### Step 2: Check import status

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts get-import-status <import-id>
```

Response:
```json
{
  "success": true,
  "status": {
    "status": "succeeded",
    "assetId": "new-asset-id"
  }
}
```

### Step 3: Verify the imported asset

```bash
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts get-asset <new-asset-id>
```

---

## Example 8: Autonomous Content Discovery

**Scenario**: An agent needs to find specific content (e.g., for designing an email, creating an ad, or building a landing page).

### Step 1: Consult boards.md to identify target boards

The board reference (`references/boards.md`) contains:
- **Keywords** for each board to help match your search intent
- **Board structure** showing sub-boards and organization
- **Finding Content table** mapping content types to boards

**Example queries and matching boards:**

| Agent needs... | Keywords match | Target board |
|----------------|----------------|--------------|
| UGC for social proof | ugc, user generated, tagged | Instagram, TikTok |
| Product photos for catalog | product, photos, images, catalog | Product Media |
| Assets for email campaign | email, campaign, newsletter | Emails |
| Ad creative | ads, advertising, paid | Ads |
| Best brand photos for PR | hero, press, evergreen | Hero |
| Content featuring bells | bells, products | Products |

### Step 2: Search using AI-friendly terms

Asset descriptions are AI-generated and won't recognize product names or SKUs. Translate product names to generic visual descriptions:

| Your Brand Product | AI-Friendly Search Terms |
|-----------------|--------------------------|
| Navy Dolphin Trunks | "dolphin", "navy shorts", "navy trunks", "swim trunks" |
| Burgundy Bells | "burgundy pants", "bell bottoms", "wide leg", "burgundy" |
| Cabana Set | "matching set", "cabana", "shirt shorts set" |
| Stovepipe Pants | "straight leg", "stovepipe", "slim pants" |
| Terry Polo | "polo shirt", "terry cloth", "collared shirt" |

```bash
# Search within a specific board
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-assets --board-id <board-id> --search "<search-term>" --limit 20
```

### Step 3: Review results and refine

Results include AI-generated data to help refine searches:

```json
{
  "id": "asset-id",
  "coverVersion": {
    "summary": "AI-generated description of the image content...",
    "smartTags": [
      {"name": "tag1"},
      {"name": "tag2"}
    ],
    "urls": {
      "thumbnail": "https://...",
      "preview": "https://..."
    }
  }
}
```

Use `smartTags` from results to discover better search terms.

### Step 4: Download assets

```bash
# Download single asset
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts download-asset <asset-id> <output-path>

# Example: Download to assets/media
mkdir -p assets/media
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts download-asset abc123 assets/media/product-shot.jpg
```

### Workflow for Autonomous Content Discovery

When an agent needs to find content without human guidance:

1. **Parse the request** - Identify content type needed (UGC, product shots, lifestyle, etc.)
2. **Match keywords** - Use boards.md keywords to find relevant board(s)
3. **Translate product names** - Convert specific product names to visual descriptions
4. **Search multiple boards** - Cast a wide net if unsure which board has the content
5. **Review and filter** - Use smartTags and summaries to identify best matches
6. **Download and use** - Retrieve assets for the task at hand

### Example: Email Design Agent

An agent designing an email needs lifestyle photos of bells:

```bash
# 1. Check boards.md - "email" keyword → Emails board, "bells" → Products board

# 2. Search Emails board for existing email assets with bells
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-assets --board-id f660cb89-6fd1-4e0e-afab-d043e06e8beb --search "bell bottoms" --limit 10

# 3. Also search Products board for bell-specific content
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-assets --board-id 56dcc14f-eb9b-456b-93ab-cecf1a20e4e0 --search "bells" --limit 10

# 4. For lifestyle UGC, search Instagram
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts list-assets --board-id 993a738c-9f0c-4586-90f9-7784423a84c9 --search "bell bottoms lifestyle" --limit 10

# 5. Download best matches
deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/air/scripts/air-client.ts download-asset <best-match-id> assets/media/bells-lifestyle.jpg
```
