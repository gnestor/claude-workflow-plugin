# Image Generation with Nano Banana Pro

## Overview

Nano Banana Pro (Imagen 3.0) is Google's state-of-the-art image generation model, offering:
- High-quality image generation up to 4K resolution
- Clear, readable text in images
- Style transfer with reference images
- Multiple aspect ratios

## Basic Usage

```bash
# Simple image generation
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "A golden retriever playing on a sunny beach" \
  --output assets/dog.png
```

## Aspect Ratios

| Ratio | Best For |
|-------|----------|
| `1:1` | Instagram posts, profile pictures |
| `16:9` | YouTube thumbnails, presentations |
| `9:16` | Instagram stories, TikTok, mobile |
| `4:3` | Traditional photos |
| `3:4` | Portrait orientation |

```bash
# Instagram story format
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "Summer beach vibes aesthetic" \
  --output assets/story.png \
  --aspect 9:16
```

## Style Reference Images

Use up to 14 reference images to guide the style:

```bash
# With brand style references
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "Product photo of blue shorts, matching reference style" \
  --output assets/product.png \
  --references "brand/ref1.jpg,brand/ref2.jpg,brand/ref3.jpg"
```

## Prompt Engineering Tips

### Be Specific
Instead of: "A cat"
Use: "A fluffy orange tabby cat sitting on a windowsill, soft natural lighting, shallow depth of field"

### Include Style Keywords
- **Photography styles:** portrait, landscape, macro, aerial, street photography
- **Art styles:** watercolor, oil painting, digital art, sketch, anime
- **Lighting:** golden hour, studio lighting, dramatic shadows, soft diffused light
- **Mood:** cozy, dramatic, minimalist, vibrant, nostalgic

### Product Photography Prompts

```
Professional product photo of [product],
white background,
soft studio lighting,
high-end commercial photography style,
sharp focus,
clean composition
```

### Lifestyle Photography Prompts

```
Lifestyle photo of [product] in use,
natural setting,
authentic candid moment,
warm natural lighting,
editorial style
```

### Social Media Prompts

```
Instagram-worthy photo of [subject],
aesthetic composition,
[color palette] tones,
trendy and modern feel,
high engagement style
```

## Image Editing

Edit existing images with natural language:

```bash
# Remove background
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts edit-image \
  "input.jpg" \
  "Remove the background and make it transparent" \
  --output output.png

# Change colors
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts edit-image \
  "product.jpg" \
  "Change the shorts from blue to red" \
  --output red-product.png

# Add elements
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts edit-image \
  "beach.jpg" \
  "Add a beautiful sunset in the background" \
  --output sunset-beach.png
```

## Text in Images

Nano Banana Pro can render readable text:

```bash
# Create a poster with text
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "Modern minimalist poster with the text 'SUMMER SALE' in bold sans-serif font, pastel colors, clean design" \
  --output assets/poster.png
```

**Tips for text rendering:**
- Specify font style (sans-serif, serif, handwritten)
- Keep text short and simple
- Use quotes around exact text
- Mention text position if important

## Content Guidelines

Nano Banana Pro follows Google's content policies. Avoid:
- Explicit or adult content
- Violence or gore
- Hate speech or discrimination
- Real people without consent
- Copyrighted characters

## Best Practices

1. **Iterate on prompts** - Start simple, add detail
2. **Use reference images** - For consistent brand style
3. **Specify quality** - "high quality", "detailed", "sharp"
4. **Include context** - Setting, lighting, mood
5. **Test aspect ratios** - Match your platform needs

## Common Issues

### "Image not generated"
- Prompt may violate content guidelines
- Try rephrasing or simplifying
- Check API quota

### Poor text rendering
- Keep text short (1-4 words)
- Specify font style clearly
- Use simple, common fonts

### Inconsistent style
- Add more reference images
- Be more specific about style
- Use consistent lighting descriptions

## Example Workflows

### E-commerce Product Shots
```bash
# Generate product on white background
generate-image "Professional product photo of casual cotton shorts, white background, soft shadows, e-commerce style" --output product-white.png

# Generate lifestyle shot
generate-image "Lifestyle photo of man wearing casual shorts walking on beach, golden hour, candid editorial style" --output product-lifestyle.png
```

### Social Media Content
```bash
# Instagram post
generate-image "Aesthetic flat lay of summer essentials: sunglasses, shorts, sandals, arranged on sandy surface, soft natural light, Instagram style" --output instagram-flatlay.png --aspect 1:1

# Instagram story
generate-image "Behind the scenes at photo shoot, candid moment, warm tones, story format" --output story-bts.png --aspect 9:16
```
