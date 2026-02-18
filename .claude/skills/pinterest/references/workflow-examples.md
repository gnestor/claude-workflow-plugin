# Pinterest Workflow Examples

## Example 1: Create a Board and Upload Pins

**User Request:** "Create a new Pinterest board called 'Summer 2025 Collection' and upload these 5 product photos"

### Step-by-Step

1. **Create the board:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-board '{"name": "Summer 2025 Collection", "description": "New arrivals for Summer 2025", "privacy": "PUBLIC"}'
```

Response includes `board.id` (e.g., "1234567890")

2. **For each image, create a pin:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-pin '{
  "board_id": "1234567890",
  "title": "Your Brand Blue Corduroy Shorts - Summer Essential",
  "description": "Classic blue corduroy shorts perfect for beach days and summer adventures. Made with premium cotton blend for all-day comfort. Shop now at example.com",
  "alt_text": "Blue corduroy shorts with elastic waistband on white background",
  "link": "https://example.com/products/blue-corduroy-shorts",
  "media_source": {
    "source_type": "image_url",
    "url": "https://cdn.shopify.com/s/files/your-brand/blue-shorts.jpg"
  }
}'
```

3. **Repeat for remaining images with appropriate metadata**

---

## Example 2: Organize Existing Pins into Sections

**User Request:** "Create sections on my Product Catalog board for different product categories"

### Step-by-Step

1. **Find the board:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts search-boards "Product Catalog"
```

2. **Create sections:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-section "1234567890" "Shorts"
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-section "1234567890" "Tops"
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-section "1234567890" "Accessories"
```

3. **Move pins to sections using save-pin:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts save-pin "<pin-id>" "1234567890" "<section-id>"
```

---

## Example 3: Analyze Pin Performance

**User Request:** "Show me how my pins performed last month"

### Step-by-Step

1. **Get account-level analytics:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts account-analytics 2025-12-01 2025-12-31
```

2. **Get top performing pins:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts top-pins 2025-12-01 2025-12-31
```

3. **For specific pin analytics:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts pin-analytics "<pin-id>" 2025-12-01 2025-12-31
```

---

## Example 4: Bulk Upload with AI-Generated Metadata

**User Request:** "Upload all images from our Fall catalog shoot to Pinterest with SEO-optimized descriptions"

### Workflow

1. **Identify or create target board:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts search-boards "Fall 2025 Catalog"
```

If not found:
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-board '{"name": "Fall 2025 Catalog", "privacy": "PUBLIC"}'
```

2. **For each image, Claude generates metadata:**

| Image | Generated Title | Generated Description | Generated Alt Text |
|-------|-----------------|----------------------|-------------------|
| brand-rust.jpg | "Rust Corduroy Shorts - Fall Must-Have" | "Warm rust corduroy shorts perfect for autumn. Pair with your favorite sweater for a classic fall look. Premium cotton blend, elastic waistband. Shop now." | "Rust colored corduroy shorts with button fly on autumn leaves background" |
| brand-olive.jpg | "Olive Green Shorts - Earth Tone Essential" | "Versatile olive green shorts that transition from summer to fall. Comfortable fit, classic Your Brand style. Perfect for layering." | "Olive green corduroy shorts styled with brown leather belt" |

3. **Present metadata for user approval**

4. **Upload each pin with 200ms delay between requests:**
```bash
# Pin 1
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-pin '{
  "board_id": "1234567890",
  "title": "Rust Corduroy Shorts - Fall Must-Have",
  "description": "Warm rust corduroy shorts perfect for autumn...",
  "alt_text": "Rust colored corduroy shorts with button fly on autumn leaves background",
  "link": "https://example.com/products/rust-corduroy-shorts",
  "media_source": {"source_type": "image_url", "url": "https://..."}
}'

# Wait 200ms

# Pin 2
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts create-pin '{...}'
```

5. **Report results:**
```
Bulk Upload Complete:
- Total images: 25
- Successfully uploaded: 25
- Failed: 0
- Board: Fall 2025 Catalog (https://pinterest.com/yourbrand/fall-2025-catalog)
```

---

## Example 5: Clean Up Boards

**User Request:** "Delete all pins from my test board"

### Step-by-Step

1. **Find the board:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts search-boards "test"
```

2. **List all pins on the board:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts list-board-pins "<board-id>" 100
```

3. **Delete each pin (with user confirmation):**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts delete-pin "<pin-id>"
```

4. **Optionally delete the board itself:**
```bash
deno run --allow-net --allow-env --allow-read .claude/skills/pinterest/scripts/pinterest-client.ts delete-board "<board-id>"
```

---

## SEO Best Practices for Pinterest

### Title (100 characters max)
- Include primary keyword near the beginning
- Be descriptive but concise
- Use action words when appropriate
- Example: "Blue Corduroy Shorts - Summer Beach Essential | Your Brand"

### Description (500 characters max)
- Include 2-3 relevant keywords naturally
- Write for humans, not just search
- Include a call-to-action
- Mention product benefits
- Example: "Classic blue corduroy shorts perfect for beach days and summer adventures. Made with premium cotton blend for all-day comfort. Features elastic waistband and button fly. Available in sizes XS-XXL. Shop the Your Brand collection for timeless casual style."

### Alt Text (500 characters max)
- Describe what's in the image
- Include product details visible in image
- Helpful for accessibility
- Example: "Model wearing blue corduroy shorts at the beach, paired with white t-shirt and sandals"

### Link
- Use product page URL when applicable
- Ensure URL is valid and loads correctly
- Use UTM parameters for tracking if desired
- Example: "https://example.com/products/blue-corduroy-shorts?utm_source=pinterest&utm_medium=organic"

---

## Common Keyword Categories for Your Brand

### Product Types
- corduroy shorts, vintage shorts, casual shorts
- beach wear, summer essentials, vacation clothes

### Style/Aesthetic
- retro style, 70s fashion, vintage aesthetic
- laid-back, California style, beach vibes

### Occasions
- beach day, summer vacation, casual weekend
- outdoor adventure, road trip, festival wear

### Colors
- blue shorts, rust shorts, olive green shorts
- earth tones, classic colors, seasonal colors
