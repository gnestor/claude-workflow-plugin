---
name: google-ai-studio
description: Google AI Studio Gemini API integration for text generation, image generation with Nano Banana Pro, embeddings, and multimodal AI. Activate when user asks about AI image generation, text generation with Gemini, embeddings, or mentions Google AI Studio, Nano Banana, Nano Banana Pro, or Gemini models.
---

# Google AI Studio (Gemini API)

Access to Google's Gemini models through AI Studio API for text generation, image generation (Nano Banana Pro), embeddings, and multimodal AI capabilities.

## Authentication

Authentication is handled by the MCP server using the Gemini API key. Unlike other Google services which use OAuth, AI Studio uses a simple API key.

## When to Use

Activate this skill when the user:
- Mentions "Gemini", "AI Studio", "Nano Banana", or "generate image"
- Needs to generate images with AI
- Wants text generation with Google's Gemini models
- Needs to create embeddings for semantic search
- Wants multimodal AI tasks (image + text)

**Don't use AI Studio when:**
- Working with Google Workspace (Gmail, Drive, Sheets) - use respective skills
- Need Claude's capabilities - use direct conversation
- Working with other image APIs (Stable Diffusion, DALL-E)

## Available Operations

Use `~~ai-generation` tools for all AI Studio operations.

### Authentication & Models

| Operation | Description |
|-----------|-------------|
| Test Auth | Verify API key is valid |
| List Models | List available Gemini models |

### Text Generation

| Operation | Description |
|-----------|-------------|
| Generate | Generate text content |
| Stream | Stream text generation (real-time output) |
| Count Tokens | Count tokens in a prompt |

**Options:**
- `model` - Model to use (default: gemini-2.0-flash)
- `temperature` - Temperature 0.0-2.0 (default: 1.0)
- `max-tokens` - Maximum output tokens
- `system` - System instruction

### Image Generation (Nano Banana Pro)

| Operation | Description |
|-----------|-------------|
| Generate Image | Generate image from text prompt |
| Edit Image | Edit existing image with natural language |

**Options:**
- `output` - Output file path
- `model` - Image model or alias (default: nano-banana-pro)
  - `nano-banana-pro` or `nbp` -> gemini-3-pro-image-preview (best quality)
  - `nano-banana` or `nb` -> gemini-2.5-flash-image (faster, better free tier)
- `aspect` - Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4
- `references` - Reference images for style (up to 14)

### Embeddings

| Operation | Description |
|-----------|-------------|
| Embed | Generate text embedding |
| Embed Batch | Batch embeddings from file |

### File Operations

| Operation | Description |
|-----------|-------------|
| Upload File | Upload file for multimodal use |
| List Files | List uploaded files |
| Delete File | Delete an uploaded file |
| Get File | Get file metadata |

## Use Cases

### Image Generation with Nano Banana Pro

Generate high-quality images for marketing, product shots, social media.

**Aspect Ratios:**
| Ratio | Best For |
|-------|----------|
| `1:1` | Instagram posts, profile pictures |
| `16:9` | YouTube thumbnails, presentations |
| `9:16` | Instagram stories, TikTok, mobile |
| `4:3` | Traditional photos |
| `3:4` | Portrait orientation |

### Text Generation

Generate marketing copy, descriptions, summaries with Gemini models.

### Multimodal (Image + Text)

Upload images first, then use them in generation prompts for analysis or description.

### Embeddings

Generate embeddings for semantic search and similarity matching.

## Available Models

### Text Generation
- `gemini-2.0-flash` - Fast, efficient (default)
- `gemini-2.0-flash-lite` - Fastest, most cost-effective
- `gemini-2.5-pro-preview-05-06` - Most capable reasoning
- `gemini-2.5-flash-preview-05-20` - Fast with enhanced capabilities

### Image Generation
- `nano-banana-pro` / `nbp` -> `gemini-3-pro-image-preview` (default, best quality)
- `nano-banana` / `nb` -> `gemini-2.5-flash-image` (faster, 500 images/day free tier)

### Embeddings
- `text-embedding-004` - Latest embedding model (default)

See [references/models.md](references/models.md) for full model details.

## Reference Files

Detailed information available in `references/` directory:

- **models.md** - Available models with specs, pricing, and rate limits
- **image-generation.md** - Nano Banana Pro guide with prompting tips and workflows
- **request-schemas.md** - API request and response schemas

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

## Troubleshooting

### "Invalid API key"
- Verify the MCP server has the Gemini API key configured
- Check key is valid at [Google AI Studio](https://aistudio.google.com/)

### "Model not found"
- Run list models to see available models
- Check model name spelling
- Some models may be preview-only

### "Quota exceeded"
- Free tier has limited requests/day
- Consider upgrading to paid tier

### Image generation fails
- Ensure prompt follows content guidelines
- Try simpler prompts first
- Check that output path directory exists

## Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Nano Banana Pro Guide](references/image-generation.md)
- [Model Reference](references/models.md)
- [Request Schemas](references/request-schemas.md)
