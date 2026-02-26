---
name: google-ai-studio
description: "Google AI Studio Gemini API integration for text generation, image generation with Nano Banana Pro, embeddings, and multimodal AI. Activate when user asks about AI image generation, text generation with Gemini, embeddings, or mentions Google AI Studio, Nano Banana, Nano Banana Pro, or Gemini models."
category: ~~ai-generation
service: google-ai-studio
---

# Google AI Studio

## Purpose

Access to Google's Gemini models through AI Studio API for text generation, image generation (Nano Banana Pro), embeddings, and multimodal AI capabilities. Authentication uses an API key (not OAuth) managed by the client script.

## When to Use

Activate this skill when the user:
- Mentions "Gemini", "AI Studio", "Nano Banana", or "generate image"
- Needs to generate images with AI
- Wants text generation with Google's Gemini models
- Needs to create embeddings for semantic search
- Wants multimodal AI tasks (image + text)

## When NOT to Use

- Working with Google Workspace (Gmail, Drive, Sheets) — use respective skills
- Need Claude's capabilities — use direct conversation
- Working with other image APIs (Stable Diffusion, DALL-E)

## Client Script

**Path:** `skills/google-ai-studio/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `generate-text --prompt <text>` | Generate text content. Optional: `--model`, `--temperature`, `--max-tokens` |
| `generate-image --prompt <text>` | Generate image from text prompt. Optional: `--model` (nbp, nb), `--output-path` |
| `edit-image --prompt <text> --image-path <path>` | Edit existing image with natural language. Optional: `--model`, `--output-path` |
| `embed --text <text>` | Generate text embedding. Optional: `--model` |
| `upload-file --path <path>` | Upload file for multimodal use. Optional: `--mime-type` |

## Key API Concepts

**Gemini API** at `generativelanguage.googleapis.com`. Uses **API key auth** (not OAuth like other Google services).

### Available Models

**Text Generation:**
- `gemini-2.0-flash` — Fast, efficient (default)
- `gemini-2.0-flash-lite` — Fastest, most cost-effective
- `gemini-2.5-pro-preview-05-06` — Most capable reasoning
- `gemini-2.5-flash-preview-05-20` — Fast with enhanced capabilities

**Image Generation:**
- `nano-banana-pro` / `nbp` -> `gemini-3-pro-image-preview` (default, best quality)
- `nano-banana` / `nb` -> `gemini-2.5-flash-image` (faster, 500 images/day free tier)

**Embeddings:**
- `text-embedding-004` — Latest embedding model (default)

### Aspect Ratios (Image Generation)

| Ratio | Best For |
|-------|----------|
| `1:1` | Instagram posts, profile pictures |
| `16:9` | YouTube thumbnails, presentations |
| `9:16` | Instagram stories, TikTok, mobile |
| `4:3` | Traditional photos |
| `3:4` | Portrait orientation |

### Rate Limits

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

## For Complex Operations

```javascript
import { apiRequest } from '../../../lib/http.js';
const data = await apiRequest('google-ai-studio', '/v1beta/models/gemini-2.0-flash:generateContent');
```

## Reference Files
- [models.md](references/models.md) — Available models with specs, pricing, and rate limits
- [image-generation.md](references/image-generation.md) — Nano Banana Pro guide with prompting tips and workflows
- [request-schemas.md](references/request-schemas.md) — API request and response schemas
