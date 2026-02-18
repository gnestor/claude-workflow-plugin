---
name: ai-studio
description: Google AI Studio Gemini API integration for text generation, image generation with Nano Banana Pro, embeddings, and multimodal AI. Activate when user asks about AI image generation, text generation with Gemini, embeddings, or mentions Google AI Studio, Nano Banana, Nano Banana Pro, or Gemini models. Primary use case is generating images using Nano Banana Pro model.
---

# Google AI Studio (Gemini API)

Access to Google's Gemini models through AI Studio API for text generation, image generation (Nano Banana Pro), embeddings, and multimodal AI capabilities.

## Quick Start

```bash
# Test authentication
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts test-auth

# Generate an image with Nano Banana Pro
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "A professional product photo of casual shorts on a beach" \
  --output assets/product-shot.png

# Generate text
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate \
  "Write a tagline for a beach clothing brand"
```

## Authentication

Unlike other Google services, AI Studio uses a simple API key (not OAuth2).

### Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API key" or go to API keys section
3. Create a new API key
4. Add to `.env`:

```bash
GEMINI_API_KEY="your-api-key-here"
```

### Test Authentication

```bash
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts test-auth
```

## Available Commands

### Authentication & Models

| Command | Description |
|---------|-------------|
| `test-auth` | Verify API key is valid |
| `list-models` | List available Gemini models |

### Text Generation

| Command | Description |
|---------|-------------|
| `generate "<prompt>" [options]` | Generate text content |
| `stream "<prompt>" [options]` | Stream text generation (real-time output) |
| `count-tokens "<prompt>" [--model]` | Count tokens in a prompt |

**Options for generate/stream:**
- `--model MODEL` - Model to use (default: gemini-2.0-flash)
- `--temperature TEMP` - Temperature 0.0-2.0 (default: 1.0)
- `--max-tokens N` - Maximum output tokens
- `--system "INSTRUCTION"` - System instruction

### Image Generation (Nano Banana Pro)

| Command | Description |
|---------|-------------|
| `generate-image "<prompt>" [--output PATH] [options]` | Generate image |
| `edit-image "<input>" "<instruction>" --output PATH` | Edit existing image |

**Options for generate-image:**
- `--output PATH` - Output file path (default: `./generated-<timestamp>.png`)
- `--model MODEL` - Image model or alias (default: nano-banana-pro)
  - `nano-banana-pro` or `nbp` → gemini-3-pro-image-preview (best quality)
  - `nano-banana` or `nb` → gemini-2.5-flash-image (faster, better free tier)
- `--aspect RATIO` - Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
- `--references "path1,path2,..."` - Reference images for style (up to 14)

### Embeddings

| Command | Description |
|---------|-------------|
| `embed "<text>" [--model]` | Generate text embedding |
| `embed-batch --input FILE --output FILE` | Batch embeddings from file |

### File Operations

| Command | Description |
|---------|-------------|
| `upload-file <path> [--name NAME]` | Upload file for multimodal use |
| `list-files` | List uploaded files |
| `delete-file <file-id>` | Delete an uploaded file |
| `get-file <file-id>` | Get file metadata |

## Use Cases

### Image Generation with Nano Banana Pro

Generate high-quality images for marketing, product shots, social media:

```bash
# Simple image generation
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "A cute golden retriever puppy playing on a beach at sunset" \
  --output assets/puppy.png

# With specific aspect ratio for Instagram
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "Minimalist flat lay of summer accessories" \
  --output assets/flatlay.png \
  --aspect 1:1

# With reference images for brand consistency
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "Product photo of blue shorts in our brand style" \
  --output assets/branded-product.png \
  --references "assets/{workflow-name}/ref1.jpg,assets/{workflow-name}/ref2.jpg"

# Using Nano Banana (faster, better free tier)
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate-image \
  "A sunny beach scene with palm trees" \
  --output assets/beach.png \
  --model nano-banana
```

### Text Generation

Generate marketing copy, descriptions, summaries:

```bash
# Simple generation
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate \
  "Write 3 Instagram captions for a beach clothing brand"

# With system instruction
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate \
  "Write a product description for casual summer shorts" \
  --system "You are a copywriter for a premium beachwear brand. Write in a casual, friendly tone."

# Streaming for long content
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts stream \
  "Write a blog post about sustainable fashion trends"
```

### Multimodal (Image + Text)

Analyze images by uploading first:

```bash
# Upload an image
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts upload-file \
  product-photo.jpg --name "Product Photo"

# Use in generation (returns file URI to use)
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts generate \
  "Describe this product photo and suggest improvements" \
  --file "files/abc123"
```

### Embeddings

Generate embeddings for semantic search:

```bash
# Single embedding
deno run --allow-net --allow-env --allow-read \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts embed \
  "comfortable beach shorts for summer"

# Batch embeddings
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google/ai-studio/scripts/ai-studio-client.ts embed-batch \
  --input products.txt --output embeddings.json
```

## Available Models

### Text Generation
- `gemini-2.0-flash` - Fast, efficient (default)
- `gemini-2.0-flash-lite` - Fastest, most cost-effective
- `gemini-2.5-pro-preview-05-06` - Most capable reasoning
- `gemini-2.5-flash-preview-05-20` - Fast with enhanced capabilities

### Image Generation
- `nano-banana-pro` / `nbp` → `gemini-3-pro-image-preview` (default, best quality)
- `nano-banana` / `nb` → `gemini-2.5-flash-image` (faster, 500 images/day free tier)

### Embeddings
- `text-embedding-004` - Latest embedding model (default)

See [references/models.md](references/models.md) for full model details.

## Environment Variables

```bash
# Required
GEMINI_API_KEY="your-api-key"

# Optional
GEMINI_DEFAULT_MODEL="gemini-2.0-flash"          # Default text model
GEMINI_IMAGE_MODEL="gemini-3-pro-image-preview"  # Nano Banana Pro
GEMINI_OUTPUT_DIR="."                              # Default image output directory (current working directory)
```

## When to Use This Skill

**Use AI Studio when:**
- Generating images with Nano Banana Pro
- Generating text with Gemini models
- Creating embeddings for search/similarity
- Processing multimodal content (images + text)
- User mentions "Gemini", "AI Studio", "Nano Banana"

**Don't use AI Studio when:**
- Working with Google Workspace (Gmail, Drive, Sheets) - use respective google skills
- Need Claude's capabilities - use direct conversation
- Working with other image APIs (Stable Diffusion, DALL-E)

**For prompting guidance:** See the **visual-design** skill for comprehensive prompting best practices, templates, and workflows for Your Brand brand imagery.

## Troubleshooting

### "Invalid API key"
- Verify `GEMINI_API_KEY` is set in `.env`
- Check key is valid at [Google AI Studio](https://aistudio.google.com/)

### "Model not found"
- Run `list-models` to see available models
- Check model name spelling
- Some models may be preview-only

### "Quota exceeded"
- Free tier has limited requests/day
- Consider upgrading to paid tier
- Check quota at [Google Cloud Console](https://console.cloud.google.com/)

### Image generation fails
- Ensure prompt follows content guidelines
- Try simpler prompts first
- Check that `--output` path directory exists

## Rate Limits

**Text Generation (Free Tier):**
| Model | RPM | RPD |
|-------|-----|-----|
| gemini-2.0-flash | 15 | 1,500 |
| gemini-2.5-pro | 5 | 50 |

**Image Generation (Free Tier):**
| Model | IPM | IPD |
|-------|-----|-----|
| gemini-3-pro-image-preview | 2 | 100-500 |
| gemini-2.5-flash-image | 2 | 500 |

RPM = Requests/min, RPD = Requests/day, IPM = Images/min, IPD = Images/day

**Paid Tier:** $0.02-0.04 per image for higher limits.

## Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Nano Banana Pro Guide](references/image-generation.md)
- [Model Reference](references/models.md)
- [Request Schemas](references/request-schemas.md)
