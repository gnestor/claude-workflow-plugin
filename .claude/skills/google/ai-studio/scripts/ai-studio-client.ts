#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Google AI Studio (Gemini API) Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write ai-studio-client.ts <command> [args...]
 *
 * Commands:
 *   test-auth                                    - Test API key validity
 *   list-models                                  - List available models
 *   generate "<prompt>" [options]                - Generate text content
 *   stream "<prompt>" [options]                  - Stream text generation
 *   generate-image "<prompt>" --output PATH      - Generate image with Nano Banana Pro
 *   edit-image "<input>" "<instruction>" --output PATH - Edit an image
 *   embed "<text>" [--model MODEL]               - Generate text embedding
 *   embed-batch --input FILE --output FILE       - Batch embeddings
 *   upload-file <path> [--name NAME]             - Upload file for multimodal
 *   list-files                                   - List uploaded files
 *   delete-file <file-id>                        - Delete uploaded file
 *   get-file <file-id>                           - Get file metadata
 *   count-tokens "<prompt>" [--model MODEL]      - Count tokens in prompt
 */

import "@std/dotenv/load";

// Configuration
const API_KEY = Deno.env.get("GEMINI_API_KEY");
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_TEXT_MODEL = Deno.env.get("GEMINI_DEFAULT_MODEL") || "gemini-2.0-flash";
const DEFAULT_IMAGE_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") || "gemini-3-pro-image-preview";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-004";
const DEFAULT_OUTPUT_DIR = Deno.env.get("GEMINI_OUTPUT_DIR") || ".";

// Model aliases for friendly names
const IMAGE_MODEL_ALIASES: Record<string, string> = {
  "nano-banana-pro": "gemini-3-pro-image-preview",
  "nano-banana": "gemini-2.5-flash-image",
  "nbp": "gemini-3-pro-image-preview",
  "nb": "gemini-2.5-flash-image",
};

// Resolve model alias to actual model ID
function resolveImageModel(modelInput: string | undefined): string {
  if (!modelInput) return DEFAULT_IMAGE_MODEL;
  const lower = modelInput.toLowerCase();
  return IMAGE_MODEL_ALIASES[lower] || modelInput;
}

// Types
interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  fileData?: {
    mimeType: string;
    fileUri: string;
  };
}

interface Content {
  role?: string;
  parts: Part[];
}

interface GenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  responseMimeType?: string;
  responseModalities?: string[];
}

interface GenerateContentRequest {
  contents: Content[];
  generationConfig?: GenerationConfig;
  systemInstruction?: Content;
}

interface Candidate {
  content: Content;
  finishReason: string;
  index: number;
}

interface GenerateContentResponse {
  candidates: Candidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface Model {
  name: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
}

interface FileMetadata {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  createTime: string;
  updateTime: string;
  expirationTime: string;
  sha256Hash: string;
  uri: string;
  state: string;
}

// Utility functions

// Chunked base64 encoding to avoid stack overflow with large files
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000; // 32KB chunks
  let result = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    result += String.fromCharCode(...chunk);
  }
  return btoa(result);
}

// Chunked base64 decoding for large responses
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    txt: "text/plain",
    json: "application/json",
    mp4: "video/mp4",
    mp3: "audio/mp3",
    wav: "audio/wav",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

function parseArgs(args: string[]): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith("--")) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

async function ensureDir(path: string): Promise<void> {
  const dir = path.substring(0, path.lastIndexOf("/"));
  if (dir) {
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch {
      // Directory may already exist
    }
  }
}

// API request wrapper
async function geminiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  const url = `${API_BASE}${endpoint}`;
  const separator = url.includes("?") ? "&" : "?";

  const response = await fetch(`${url}${separator}key=${API_KEY}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  return response.json();
}

// Test authentication
async function testAuth(): Promise<{ success: boolean; message: string }> {
  try {
    await geminiRequest<{ models: Model[] }>("/models");
    return {
      success: true,
      message: "API key is valid",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Authentication failed: ${message}`,
    };
  }
}

// List available models
async function listModels(): Promise<{
  success: boolean;
  models?: Array<{
    name: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    methods: string[];
  }>;
  error?: string;
}> {
  try {
    const data = await geminiRequest<{ models: Model[] }>("/models");

    const models = data.models.map((m) => ({
      name: m.name.replace("models/", ""),
      displayName: m.displayName,
      description: m.description,
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
      methods: m.supportedGenerationMethods,
    }));

    return { success: true, models };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Generate content
async function generateContent(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    system?: string;
    fileUri?: string;
  } = {}
): Promise<{
  success: boolean;
  text?: string;
  usage?: {
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  error?: string;
}> {
  try {
    const model = options.model || DEFAULT_TEXT_MODEL;

    const parts: Part[] = [{ text: prompt }];

    // Add file reference if provided
    if (options.fileUri) {
      parts.unshift({
        fileData: {
          mimeType: "image/jpeg", // Will be overridden by actual file type
          fileUri: options.fileUri,
        },
      });
    }

    const body: GenerateContentRequest = {
      contents: [{ parts }],
      generationConfig: {
        temperature: options.temperature ?? 1.0,
        maxOutputTokens: options.maxTokens,
      },
    };

    if (options.system) {
      body.systemInstruction = {
        parts: [{ text: options.system }],
      };
    }

    const response = await geminiRequest<GenerateContentResponse>(
      `/models/${model}:generateContent`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    const text = response.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("");

    return {
      success: true,
      text,
      usage: response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount,
            outputTokens: response.usageMetadata.candidatesTokenCount,
            totalTokens: response.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Stream content generation
async function streamContent(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    system?: string;
  } = {}
): Promise<void> {
  if (!API_KEY) {
    console.error(JSON.stringify({ success: false, error: "GEMINI_API_KEY not set" }));
    return;
  }

  const model = options.model || DEFAULT_TEXT_MODEL;

  const body: GenerateContentRequest = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 1.0,
      maxOutputTokens: options.maxTokens,
    },
  };

  if (options.system) {
    body.systemInstruction = {
      parts: [{ text: options.system }],
    };
  }

  const response = await fetch(
    `${API_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(JSON.stringify({ success: false, error }));
    return;
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  if (!reader) {
    console.error(JSON.stringify({ success: false, error: "No response body" }));
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            await Deno.stdout.write(encoder.encode(text));
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  }

  console.log(); // Final newline
}

// Generate image with Gemini image generation model
async function generateImage(
  prompt: string,
  options: {
    output: string;
    model?: string;
    aspect?: string;
    references?: string[];
  }
): Promise<{
  success: boolean;
  outputPath?: string;
  model?: string;
  error?: string;
}> {
  try {
    const model = resolveImageModel(options.model);

    // Build parts array with prompt and optional reference images
    const parts: Part[] = [{ text: prompt }];

    // Add reference images if provided
    if (options.references && options.references.length > 0) {
      for (const refPath of options.references) {
        const imageData = await Deno.readFile(refPath);
        const base64 = uint8ArrayToBase64(imageData);
        parts.push({
          inlineData: {
            mimeType: getMimeType(refPath),
            data: base64,
          },
        });
      }
    }

    // Build the request for generateContent with image output
    const body: GenerateContentRequest = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    const response = await geminiRequest<GenerateContentResponse>(
      `/models/${model}:generateContent`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    // Look for image data in response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.mimeType?.startsWith("image/")
    );

    if (imagePart?.inlineData) {
      await ensureDir(options.output);
      const bytes = base64ToUint8Array(imagePart.inlineData.data);
      await Deno.writeFile(options.output, bytes);

      return {
        success: true,
        outputPath: options.output,
        model,
      };
    }

    // Check if there's a text response explaining why no image was generated
    const textPart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.text
    );

    return {
      success: false,
      error: textPart?.text || "No image generated. Try a different prompt.",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Edit image
async function editImage(
  inputPath: string,
  instruction: string,
  outputPath: string,
  references?: string[]
): Promise<{
  success: boolean;
  outputPath?: string;
  error?: string;
}> {
  try {
    // Read the input image
    const imageData = await Deno.readFile(inputPath);
    const base64 = uint8ArrayToBase64(imageData);
    const mimeType = getMimeType(inputPath);

    // Build parts: input image first, then optional references, then instruction
    const parts: Part[] = [
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ];

    // Add reference images if provided
    if (references && references.length > 0) {
      for (const refPath of references) {
        const refData = await Deno.readFile(refPath);
        const refBase64 = uint8ArrayToBase64(refData);
        parts.push({
          inlineData: {
            mimeType: getMimeType(refPath),
            data: refBase64,
          },
        });
      }
    }

    parts.push({ text: instruction });

    const body: GenerateContentRequest = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    const response = await geminiRequest<GenerateContentResponse>(
      `/models/${DEFAULT_IMAGE_MODEL}:generateContent`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    // Look for image data in response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.mimeType?.startsWith("image/")
    );

    if (imagePart?.inlineData) {
      await ensureDir(outputPath);
      const bytes = base64ToUint8Array(imagePart.inlineData.data);
      await Deno.writeFile(outputPath, bytes);

      return {
        success: true,
        outputPath,
      };
    }

    return {
      success: false,
      error: "No edited image generated",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Generate embedding
async function embedContent(
  text: string,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<{
  success: boolean;
  embedding?: number[];
  dimensions?: number;
  error?: string;
}> {
  try {
    const body = {
      content: {
        parts: [{ text }],
      },
    };

    const response = await geminiRequest<{
      embedding: { values: number[] };
    }>(`/models/${model}:embedContent`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return {
      success: true,
      embedding: response.embedding.values,
      dimensions: response.embedding.values.length,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Batch embeddings
async function embedBatch(
  inputFile: string,
  outputFile: string,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<{
  success: boolean;
  count?: number;
  outputFile?: string;
  error?: string;
}> {
  try {
    const content = await Deno.readTextFile(inputFile);
    const lines = content.split("\n").filter((l) => l.trim());

    const embeddings: Array<{ text: string; embedding: number[] }> = [];

    for (const line of lines) {
      const result = await embedContent(line, model);
      if (result.success && result.embedding) {
        embeddings.push({ text: line, embedding: result.embedding });
      }
    }

    await Deno.writeTextFile(outputFile, JSON.stringify(embeddings, null, 2));

    return {
      success: true,
      count: embeddings.length,
      outputFile,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Upload file
async function uploadFile(
  filePath: string,
  displayName?: string
): Promise<{
  success: boolean;
  file?: FileMetadata;
  error?: string;
}> {
  try {
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY not set");
    }

    const fileContent = await Deno.readFile(filePath);
    const mimeType = getMimeType(filePath);
    const name = displayName || filePath.split("/").pop() || "file";

    // Step 1: Initialize resumable upload
    const initResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "X-Goog-Upload-Protocol": "resumable",
          "X-Goog-Upload-Command": "start",
          "X-Goog-Upload-Header-Content-Length": String(fileContent.length),
          "X-Goog-Upload-Header-Content-Type": mimeType,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: { displayName: name },
        }),
      }
    );

    if (!initResponse.ok) {
      const error = await initResponse.text();
      throw new Error(`Upload init failed: ${error}`);
    }

    const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
    if (!uploadUrl) {
      throw new Error("No upload URL returned");
    }

    // Step 2: Upload content
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "X-Goog-Upload-Command": "upload, finalize",
        "X-Goog-Upload-Offset": "0",
        "Content-Type": mimeType,
      },
      body: fileContent,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const result = await uploadResponse.json();

    return {
      success: true,
      file: result.file,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// List files
async function listFiles(): Promise<{
  success: boolean;
  files?: FileMetadata[];
  error?: string;
}> {
  try {
    const response = await geminiRequest<{ files?: FileMetadata[] }>("/files");
    return {
      success: true,
      files: response.files || [],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Get file
async function getFile(fileId: string): Promise<{
  success: boolean;
  file?: FileMetadata;
  error?: string;
}> {
  try {
    const file = await geminiRequest<FileMetadata>(`/files/${fileId}`);
    return { success: true, file };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Delete file
async function deleteFile(fileId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await geminiRequest(`/files/${fileId}`, { method: "DELETE" });
    return { success: true, message: `File ${fileId} deleted` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Count tokens
async function countTokens(
  prompt: string,
  model: string = DEFAULT_TEXT_MODEL
): Promise<{
  success: boolean;
  totalTokens?: number;
  error?: string;
}> {
  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const response = await geminiRequest<{ totalTokens: number }>(
      `/models/${model}:countTokens`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    return {
      success: true,
      totalTokens: response.totalTokens,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Main CLI handler
async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.error("Usage: ai-studio-client.ts <command> [args...]");
    console.error("\nCommands:");
    console.error("  test-auth                              - Test API key");
    console.error("  list-models                            - List available models");
    console.error('  generate "<prompt>" [options]          - Generate text');
    console.error('  stream "<prompt>" [options]            - Stream text generation');
    console.error('  generate-image "<prompt>" [--output PATH] - Generate image');
    console.error('  edit-image "<input>" "<instruction>" --output PATH');
    console.error('  embed "<text>" [--model MODEL]         - Generate embedding');
    console.error("  embed-batch --input FILE --output FILE - Batch embeddings");
    console.error("  upload-file <path> [--name NAME]       - Upload file");
    console.error("  list-files                             - List uploaded files");
    console.error("  get-file <file-id>                     - Get file metadata");
    console.error("  delete-file <file-id>                  - Delete file");
    console.error('  count-tokens "<prompt>" [--model]      - Count tokens');
    console.error("\nOptions for generate/stream:");
    console.error("  --model MODEL        Model to use");
    console.error("  --temperature TEMP   Temperature (0.0-2.0)");
    console.error("  --max-tokens N       Maximum output tokens");
    console.error('  --system "TEXT"      System instruction');
    console.error("  --file URI           File URI for multimodal");
    console.error("\nOptions for generate-image:");
    console.error("  --output PATH        Output file path (default: ./generated-<timestamp>.png)");
    console.error("  --model MODEL        Image model or alias:");
    console.error("                         nano-banana-pro, nbp → gemini-3-pro-image-preview (default)");
    console.error("                         nano-banana, nb      → gemini-2.5-flash-image");
    console.error("  --aspect RATIO       Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)");
    console.error('  --references "p1,p2" Reference image paths');
    Deno.exit(1);
  }

  const command = args[0];
  let result;

  switch (command) {
    case "test-auth":
      result = await testAuth();
      break;

    case "list-models":
      result = await listModels();
      break;

    case "generate": {
      const prompt = args[1];
      if (!prompt) {
        console.error("Error: generate requires a prompt");
        Deno.exit(1);
      }
      const opts = parseArgs(args.slice(2));
      result = await generateContent(prompt, {
        model: opts.model as string,
        temperature: opts.temperature ? parseFloat(opts.temperature as string) : undefined,
        maxTokens: opts["max-tokens"] ? parseInt(opts["max-tokens"] as string) : undefined,
        system: opts.system as string,
        fileUri: opts.file as string,
      });
      break;
    }

    case "stream": {
      const prompt = args[1];
      if (!prompt) {
        console.error("Error: stream requires a prompt");
        Deno.exit(1);
      }
      const opts = parseArgs(args.slice(2));
      await streamContent(prompt, {
        model: opts.model as string,
        temperature: opts.temperature ? parseFloat(opts.temperature as string) : undefined,
        maxTokens: opts["max-tokens"] ? parseInt(opts["max-tokens"] as string) : undefined,
        system: opts.system as string,
      });
      return; // Stream already outputs directly
    }

    case "generate-image": {
      const prompt = args[1];
      if (!prompt) {
        console.error("Error: generate-image requires a prompt");
        Deno.exit(1);
      }
      const opts = parseArgs(args.slice(2));
      // Auto-generate output path if not provided
      const outputPath = opts.output as string ||
        `${DEFAULT_OUTPUT_DIR}/generated-${Date.now()}.png`;
      const references = opts.references
        ? (opts.references as string).split(",").map((p) => p.trim())
        : undefined;
      result = await generateImage(prompt, {
        output: outputPath,
        model: opts.model as string,
        aspect: opts.aspect as string,
        references,
      });
      break;
    }

    case "edit-image": {
      const inputPath = args[1];
      const instruction = args[2];
      if (!inputPath || !instruction) {
        console.error("Error: edit-image requires <input> and <instruction>");
        Deno.exit(1);
      }
      const opts = parseArgs(args.slice(3));
      if (!opts.output) {
        console.error("Error: edit-image requires --output PATH");
        Deno.exit(1);
      }
      const refs = opts.references
        ? (opts.references as string).split(",").map((p) => p.trim())
        : undefined;
      result = await editImage(inputPath, instruction, opts.output as string, refs);
      break;
    }

    case "embed": {
      const text = args[1];
      if (!text) {
        console.error("Error: embed requires text");
        Deno.exit(1);
      }
      const opts = parseArgs(args.slice(2));
      result = await embedContent(text, opts.model as string);
      break;
    }

    case "embed-batch": {
      const opts = parseArgs(args.slice(1));
      if (!opts.input || !opts.output) {
        console.error("Error: embed-batch requires --input FILE --output FILE");
        Deno.exit(1);
      }
      result = await embedBatch(
        opts.input as string,
        opts.output as string,
        opts.model as string
      );
      break;
    }

    case "upload-file": {
      const filePath = args[1];
      if (!filePath) {
        console.error("Error: upload-file requires a file path");
        Deno.exit(1);
      }
      const opts = parseArgs(args.slice(2));
      result = await uploadFile(filePath, opts.name as string);
      break;
    }

    case "list-files":
      result = await listFiles();
      break;

    case "get-file": {
      const fileId = args[1];
      if (!fileId) {
        console.error("Error: get-file requires a file ID");
        Deno.exit(1);
      }
      result = await getFile(fileId);
      break;
    }

    case "delete-file": {
      const fileId = args[1];
      if (!fileId) {
        console.error("Error: delete-file requires a file ID");
        Deno.exit(1);
      }
      result = await deleteFile(fileId);
      break;
    }

    case "count-tokens": {
      const prompt = args[1];
      if (!prompt) {
        console.error("Error: count-tokens requires a prompt");
        Deno.exit(1);
      }
      const opts = parseArgs(args.slice(2));
      result = await countTokens(prompt, opts.model as string);
      break;
    }

    default:
      console.error(`Error: unknown command '${command}'`);
      Deno.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

// Run main
if (import.meta.main) {
  main();
}
