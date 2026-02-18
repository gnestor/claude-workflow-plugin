# Gemini API Request & Response Schemas

## Base URL
```
https://generativelanguage.googleapis.com/v1beta
```

## Authentication
All requests require the API key as a query parameter:
```
?key=YOUR_API_KEY
```

---

## Content Generation

### Endpoint
```
POST /models/{model}:generateContent
```

### Request Schema
```typescript
interface GenerateContentRequest {
  contents: Content[];
  systemInstruction?: Content;
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
  tools?: Tool[];
}

interface Content {
  role?: "user" | "model";
  parts: Part[];
}

interface Part {
  // Text content
  text?: string;

  // Inline binary data (images, etc.)
  inlineData?: {
    mimeType: string;  // e.g., "image/png"
    data: string;      // base64 encoded
  };

  // Reference to uploaded file
  fileData?: {
    mimeType: string;
    fileUri: string;   // e.g., "files/abc123"
  };
}

interface GenerationConfig {
  temperature?: number;        // 0.0-2.0, default 1.0
  topP?: number;              // 0.0-1.0
  topK?: number;              // 1-100
  maxOutputTokens?: number;   // Max tokens to generate
  stopSequences?: string[];   // Stop generation at these
  responseMimeType?: string;  // "application/json" for JSON mode
  responseModalities?: string[]; // ["TEXT"], ["IMAGE", "TEXT"]
}

interface SafetySetting {
  category: string;  // e.g., "HARM_CATEGORY_HARASSMENT"
  threshold: string; // e.g., "BLOCK_MEDIUM_AND_ABOVE"
}
```

### Response Schema
```typescript
interface GenerateContentResponse {
  candidates: Candidate[];
  usageMetadata?: UsageMetadata;
  modelVersion?: string;
}

interface Candidate {
  content: Content;
  finishReason: "STOP" | "MAX_TOKENS" | "SAFETY" | "RECITATION" | "OTHER";
  index: number;
  safetyRatings?: SafetyRating[];
}

interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}
```

### Example Request
```json
{
  "contents": [
    {
      "parts": [
        { "text": "Write a haiku about coding" }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 100
  }
}
```

### Example Response
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "Lines of code flowing\nBugs hide in the syntax deep\nDebug, rinse, repeat" }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 7,
    "candidatesTokenCount": 19,
    "totalTokenCount": 26
  }
}
```

---

## Streaming Generation

### Endpoint
```
POST /models/{model}:streamGenerateContent?alt=sse
```

### Response Format
Server-Sent Events (SSE) with JSON data:
```
data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}

data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}]}

data: {"candidates":[{"content":{"parts":[{"text":"!"}]},"finishReason":"STOP"}]}
```

---

## Image Generation (Imagen)

### Endpoint
```
POST /models/imagen-3.0-generate-002:predict
```

### Request Schema
```typescript
interface ImageGenerationRequest {
  instances: [
    {
      prompt: string;
    }
  ];
  parameters: {
    sampleCount?: number;     // 1-4, default 1
    aspectRatio?: string;     // "1:1", "16:9", etc.
    negativePrompt?: string;  // What to avoid
    seed?: number;            // For reproducibility
  };
}
```

### Response Schema
```typescript
interface ImageGenerationResponse {
  predictions: [
    {
      bytesBase64Encoded: string;  // Base64 image data
      mimeType: string;            // "image/png"
    }
  ];
}
```

---

## Embeddings

### Endpoint
```
POST /models/{model}:embedContent
```

### Request Schema
```typescript
interface EmbedContentRequest {
  content: Content;
  taskType?: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" |
             "SEMANTIC_SIMILARITY" | "CLASSIFICATION" | "CLUSTERING";
  title?: string;  // For RETRIEVAL_DOCUMENT
}
```

### Response Schema
```typescript
interface EmbedContentResponse {
  embedding: {
    values: number[];  // 768 dimensions for text-embedding-004
  };
}
```

---

## Token Counting

### Endpoint
```
POST /models/{model}:countTokens
```

### Request Schema
```typescript
interface CountTokensRequest {
  contents: Content[];
}
```

### Response Schema
```typescript
interface CountTokensResponse {
  totalTokens: number;
}
```

---

## File Upload

### Step 1: Initialize Upload
```
POST https://generativelanguage.googleapis.com/upload/v1beta/files?key=API_KEY

Headers:
  X-Goog-Upload-Protocol: resumable
  X-Goog-Upload-Command: start
  X-Goog-Upload-Header-Content-Length: {file_size}
  X-Goog-Upload-Header-Content-Type: {mime_type}
  Content-Type: application/json

Body:
{
  "file": {
    "displayName": "My File"
  }
}
```

### Step 2: Upload Content
```
PUT {upload_url_from_step1}

Headers:
  X-Goog-Upload-Command: upload, finalize
  X-Goog-Upload-Offset: 0
  Content-Type: {mime_type}

Body: [raw file bytes]
```

### Response Schema
```typescript
interface FileMetadata {
  name: string;           // "files/abc123"
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  createTime: string;
  updateTime: string;
  expirationTime: string; // Files expire after 48 hours
  sha256Hash: string;
  uri: string;
  state: "PROCESSING" | "ACTIVE" | "FAILED";
}
```

---

## List Models

### Endpoint
```
GET /models
```

### Response Schema
```typescript
interface ListModelsResponse {
  models: Model[];
}

interface Model {
  name: string;                    // "models/gemini-2.0-flash"
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
}
```

---

## Error Responses

```typescript
interface ErrorResponse {
  error: {
    code: number;      // HTTP status code
    message: string;   // Human-readable error
    status: string;    // e.g., "INVALID_ARGUMENT"
    details?: any[];
  };
}
```

### Common Error Codes
| Code | Status | Description |
|------|--------|-------------|
| 400 | INVALID_ARGUMENT | Bad request format |
| 401 | UNAUTHENTICATED | Invalid API key |
| 403 | PERMISSION_DENIED | API not enabled |
| 404 | NOT_FOUND | Model not found |
| 429 | RESOURCE_EXHAUSTED | Rate limit exceeded |
| 500 | INTERNAL | Server error |
