# Available Gemini Models

## Text Generation Models

### Gemini 2.0 Flash (Recommended Default)
- **Model ID:** `gemini-2.0-flash`
- **Best for:** Fast, general-purpose text generation
- **Context:** 1M tokens input, 8K output
- **Features:** Multimodal (text, image, audio, video), function calling, code execution
- **Speed:** Fast
- **Cost:** Low

### Gemini 2.0 Flash Lite
- **Model ID:** `gemini-2.0-flash-lite`
- **Best for:** Cost-optimized simple tasks
- **Context:** 1M tokens input, 8K output
- **Features:** Text generation, basic multimodal
- **Speed:** Fastest
- **Cost:** Lowest

### Gemini 2.5 Pro Preview
- **Model ID:** `gemini-2.5-pro-preview-05-06`
- **Best for:** Complex reasoning, analysis, coding
- **Context:** 1M tokens input, 64K output
- **Features:** Enhanced reasoning, thinking mode
- **Speed:** Slower
- **Cost:** Higher

### Gemini 2.5 Flash Preview
- **Model ID:** `gemini-2.5-flash-preview-05-20`
- **Best for:** Fast tasks with enhanced capabilities
- **Context:** 1M tokens input, 64K output
- **Features:** Improved reasoning over 2.0
- **Speed:** Fast
- **Cost:** Medium

### Gemini 2.0 Flash Experimental (Image Generation)
- **Model ID:** `gemini-2.0-flash-exp`
- **Best for:** Native image generation and editing
- **Context:** 1M tokens
- **Features:** Can generate images in responses
- **Note:** Use for image editing workflows

## Image Generation Models

### Gemini 3 Pro Image (Nano Banana Pro) - Recommended
- **Model ID:** `gemini-3-pro-image-preview`
- **Best for:** High-quality image generation (Nano Banana Pro)
- **Features:**
  - State-of-the-art image generation
  - Text rendering in multiple languages
  - Style reference images
  - Up to 4K resolution
- **Method:** `generateContent` with `responseModalities: ["IMAGE", "TEXT"]`

### Gemini 2.5 Flash Image - Best Free Tier
- **Model ID:** `gemini-2.5-flash-image`
- **Best for:** Fast image generation with better free tier limits
- **Features:**
  - Good quality image generation
  - Faster generation than Nano Banana Pro
  - 500 images/day free tier (vs 100-500 for Nano Banana Pro)
- **Method:** `generateContent` with `responseModalities: ["IMAGE", "TEXT"]`
- **Use when:** You need more images or faster generation

### Gemini 2.0 Flash Image Generation
- **Model ID:** `gemini-2.0-flash-exp-image-generation`
- **Best for:** Experimental image generation
- **Features:** Can generate and edit images

## Embedding Models

### Text Embedding 004 (Recommended)
- **Model ID:** `text-embedding-004`
- **Dimensions:** 768
- **Best for:** Semantic search, similarity
- **Max tokens:** 2,048

### Text Embedding 005
- **Model ID:** `text-embedding-005`
- **Dimensions:** 768
- **Best for:** Latest embedding quality
- **Max tokens:** 2,048

## Model Selection Guide

| Use Case | Recommended Model |
|----------|-------------------|
| Quick text generation | `gemini-2.0-flash` |
| Cost-sensitive tasks | `gemini-2.0-flash-lite` |
| Complex reasoning | `gemini-2.5-pro` |
| Best quality images | `gemini-3-pro-image-preview` (Nano Banana Pro) |
| Fast/bulk images | `gemini-2.5-flash-image` (better free tier) |
| Image editing | `gemini-3-pro-image-preview` |
| Embeddings | `text-embedding-004` |
| Streaming responses | `gemini-2.0-flash` |

## Rate Limits by Model

| Model | Free Tier (RPM) | Free Tier (RPD) |
|-------|-----------------|-----------------|
| gemini-2.0-flash | 15 | 1,500 |
| gemini-2.0-flash-lite | 30 | 1,500 |
| gemini-2.5-pro | 5 | 50 |
| gemini-3-pro-image-preview | 2 | 100-500 |
| gemini-2.5-flash-image | 2 | 500 |
| text-embedding-004 | 1,500 | 100,000 |

RPM = Requests per minute, RPD = Requests per day
IPM = Images per minute (2 for image models)

**Note:** Image generation API limits are more restrictive than the AI Studio web interface (which allows 500-1,000 images/day).

## Pricing (Pay-as-you-go)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| gemini-2.0-flash | $0.10 | $0.40 |
| gemini-2.0-flash-lite | $0.075 | $0.30 |
| gemini-2.5-pro | $1.25 | $10.00 |
| imagen-3.0 | $0.03/image | - |

Prices subject to change. Check [Google AI pricing](https://ai.google.dev/pricing) for current rates.
