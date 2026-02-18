#!/usr/bin/env node

/**
 * Google AI Studio (Gemini API) MCP Server
 *
 * Provides tools for text generation, image generation, image editing,
 * embeddings, and file uploads via the Gemini API.
 *
 * Environment variables:
 *   GEMINI_API_KEY          - Required. Gemini API key.
 *   GEMINI_DEFAULT_MODEL    - Optional. Default text model (default: gemini-2.0-flash).
 *   GEMINI_IMAGE_MODEL      - Optional. Default image model (default: gemini-3-pro-image-preview).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_KEY = process.env.GEMINI_API_KEY;
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_TEXT_MODEL =
  process.env.GEMINI_DEFAULT_MODEL || "gemini-2.0-flash";
const DEFAULT_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-004";

// Image model aliases for convenience
const IMAGE_MODEL_ALIASES = {
  "nano-banana-pro": "gemini-3-pro-image-preview",
  "nano-banana": "gemini-2.5-flash-image",
  nbp: "gemini-3-pro-image-preview",
  nb: "gemini-2.5-flash-image",
};

function resolveImageModel(modelInput) {
  if (!modelInput) return DEFAULT_IMAGE_MODEL;
  return IMAGE_MODEL_ALIASES[modelInput.toLowerCase()] || modelInput;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function getMimeType(filePath) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const types = {
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
  return types[ext] || "application/octet-stream";
}

async function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (dir && dir !== ".") {
    await fs.mkdir(dir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Gemini API request wrapper
// ---------------------------------------------------------------------------

async function geminiRequest(endpoint, options = {}) {
  if (!API_KEY) {
    throw new Error(
      "GEMINI_API_KEY not set in environment. Please set the GEMINI_API_KEY environment variable."
    );
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
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/**
 * generate_text - Generate text content using a Gemini model.
 */
async function generateText({
  prompt,
  model,
  temperature,
  max_tokens,
  system_instruction,
  file_uri,
}) {
  const resolvedModel = model || DEFAULT_TEXT_MODEL;

  const parts = [{ text: prompt }];

  // Optionally prepend a file reference for multimodal input
  if (file_uri) {
    parts.unshift({
      fileData: {
        mimeType: "application/octet-stream",
        fileUri: file_uri,
      },
    });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: temperature ?? 1.0,
      maxOutputTokens: max_tokens,
    },
  };

  if (system_instruction) {
    body.systemInstruction = {
      parts: [{ text: system_instruction }],
    };
  }

  const response = await geminiRequest(
    `/models/${resolvedModel}:generateContent`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  const text = response.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .filter(Boolean)
    .join("");

  const usage = response.usageMetadata
    ? {
        prompt_tokens: response.usageMetadata.promptTokenCount,
        output_tokens: response.usageMetadata.candidatesTokenCount,
        total_tokens: response.usageMetadata.totalTokenCount,
      }
    : undefined;

  return { text, model: resolvedModel, usage };
}

/**
 * generate_image - Generate an image using a Gemini image model.
 */
async function generateImage({ prompt, output_path, model, reference_paths }) {
  const resolvedModel = resolveImageModel(model);

  const parts = [{ text: prompt }];

  // Inline reference images if provided
  if (reference_paths && reference_paths.length > 0) {
    for (const refPath of reference_paths) {
      const imageData = await fs.readFile(refPath);
      const base64 = imageData.toString("base64");
      parts.push({
        inlineData: {
          mimeType: getMimeType(refPath),
          data: base64,
        },
      });
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };

  const response = await geminiRequest(
    `/models/${resolvedModel}:generateContent`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  // Extract image from response
  const imagePart = response.candidates?.[0]?.content?.parts?.find((p) =>
    p.inlineData?.mimeType?.startsWith("image/")
  );

  if (imagePart?.inlineData) {
    const outputFile =
      output_path || `./generated-${Date.now()}.png`;
    await ensureDir(outputFile);
    const bytes = Buffer.from(imagePart.inlineData.data, "base64");
    await fs.writeFile(outputFile, bytes);

    return {
      output_path: path.resolve(outputFile),
      model: resolvedModel,
    };
  }

  // If no image, check for explanatory text
  const textPart = response.candidates?.[0]?.content?.parts?.find(
    (p) => p.text
  );

  throw new Error(
    textPart?.text || "No image generated. Try a different prompt."
  );
}

/**
 * edit_image - Edit an existing image using a Gemini image model.
 */
async function editImage({
  input_path,
  instruction,
  output_path,
  reference_paths,
}) {
  const imageData = await fs.readFile(input_path);
  const base64 = imageData.toString("base64");
  const mimeType = getMimeType(input_path);

  // Build parts: input image, optional references, then instruction text
  const parts = [
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ];

  if (reference_paths && reference_paths.length > 0) {
    for (const refPath of reference_paths) {
      const refData = await fs.readFile(refPath);
      const refBase64 = refData.toString("base64");
      parts.push({
        inlineData: {
          mimeType: getMimeType(refPath),
          data: refBase64,
        },
      });
    }
  }

  parts.push({ text: instruction });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };

  const resolvedModel = DEFAULT_IMAGE_MODEL;

  const response = await geminiRequest(
    `/models/${resolvedModel}:generateContent`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  const imagePart = response.candidates?.[0]?.content?.parts?.find((p) =>
    p.inlineData?.mimeType?.startsWith("image/")
  );

  if (imagePart?.inlineData) {
    await ensureDir(output_path);
    const bytes = Buffer.from(imagePart.inlineData.data, "base64");
    await fs.writeFile(output_path, bytes);

    return {
      output_path: path.resolve(output_path),
      model: resolvedModel,
    };
  }

  throw new Error("No edited image generated. Try a different instruction.");
}

/**
 * embed - Generate a text embedding.
 */
async function embed({ text, model }) {
  const resolvedModel = model || DEFAULT_EMBEDDING_MODEL;

  const body = {
    content: {
      parts: [{ text }],
    },
  };

  const response = await geminiRequest(
    `/models/${resolvedModel}:embedContent`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return {
    embedding: response.embedding.values,
    dimensions: response.embedding.values.length,
    model: resolvedModel,
  };
}

/**
 * upload_file - Upload a file for use in multimodal generation.
 */
async function uploadFile({ file_path, display_name }) {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  const fileContent = await fs.readFile(file_path);
  const mimeType = getMimeType(file_path);
  const name = display_name || path.basename(file_path);

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
    const errorText = await initResponse.text();
    throw new Error(`Upload init failed: ${errorText}`);
  }

  const uploadUrl = initResponse.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new Error("No upload URL returned from initialization request");
  }

  // Step 2: Upload file content
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
    const errorText = await uploadResponse.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  const result = await uploadResponse.json();

  return {
    file_name: result.file?.name,
    display_name: result.file?.displayName,
    mime_type: result.file?.mimeType,
    size_bytes: result.file?.sizeBytes,
    uri: result.file?.uri,
    state: result.file?.state,
    create_time: result.file?.createTime,
    expiration_time: result.file?.expirationTime,
  };
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "google-ai-studio",
  version: "1.0.0",
});

// -- generate_text ----------------------------------------------------------

server.tool(
  "generate_text",
  "Generate text content using a Google Gemini model. Supports optional system instructions, temperature control, and multimodal input via uploaded file URIs.",
  {
    prompt: z.string().describe("The text prompt to send to the model"),
    model: z
      .string()
      .optional()
      .describe(
        `Model ID to use (default: ${DEFAULT_TEXT_MODEL}). Examples: gemini-2.0-flash, gemini-2.5-pro`
      ),
    temperature: z
      .number()
      .min(0)
      .max(2)
      .optional()
      .describe("Sampling temperature between 0.0 and 2.0 (default: 1.0)"),
    max_tokens: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Maximum number of output tokens"),
    system_instruction: z
      .string()
      .optional()
      .describe("System instruction to guide the model's behavior"),
    file_uri: z
      .string()
      .optional()
      .describe(
        "URI of a previously uploaded file (from upload_file) for multimodal input"
      ),
  },
  async (params) => {
    try {
      const result = await generateText(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: error.message },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// -- generate_image ---------------------------------------------------------

server.tool(
  "generate_image",
  "Generate an image from a text prompt using a Gemini image model. Optionally provide reference images to guide style or content. The generated image is saved to disk.",
  {
    prompt: z
      .string()
      .describe("Text prompt describing the image to generate"),
    output_path: z
      .string()
      .optional()
      .describe(
        "File path to save the generated image (default: ./generated-<timestamp>.png)"
      ),
    model: z
      .string()
      .optional()
      .describe(
        `Image model ID or alias (default: ${DEFAULT_IMAGE_MODEL}). Aliases: nano-banana-pro/nbp = gemini-3-pro-image-preview, nano-banana/nb = gemini-2.5-flash-image`
      ),
    reference_paths: z
      .array(z.string())
      .optional()
      .describe(
        "Array of file paths to reference images for style or content guidance"
      ),
  },
  async (params) => {
    try {
      const result = await generateImage(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: error.message },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// -- edit_image --------------------------------------------------------------

server.tool(
  "edit_image",
  "Edit an existing image using a Gemini image model. Provide the input image path, an editing instruction, and the output path. Optionally provide reference images.",
  {
    input_path: z
      .string()
      .describe("File path of the image to edit"),
    instruction: z
      .string()
      .describe(
        "Natural language instruction describing how to edit the image"
      ),
    output_path: z
      .string()
      .describe("File path to save the edited image"),
    reference_paths: z
      .array(z.string())
      .optional()
      .describe(
        "Array of file paths to reference images for guidance"
      ),
  },
  async (params) => {
    try {
      const result = await editImage(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: error.message },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// -- embed ------------------------------------------------------------------

server.tool(
  "embed",
  "Generate a text embedding vector using a Gemini embedding model. Useful for semantic search, clustering, and similarity comparisons.",
  {
    text: z.string().describe("The text to generate an embedding for"),
    model: z
      .string()
      .optional()
      .describe(
        `Embedding model ID (default: ${DEFAULT_EMBEDDING_MODEL})`
      ),
  },
  async (params) => {
    try {
      const result = await embed(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: error.message },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// -- upload_file -------------------------------------------------------------

server.tool(
  "upload_file",
  "Upload a file to the Gemini API for use in multimodal generation. Returns a file URI that can be passed to generate_text's file_uri parameter. Supports images, PDFs, audio, video, and text files.",
  {
    file_path: z
      .string()
      .describe("Absolute path to the file to upload"),
    display_name: z
      .string()
      .optional()
      .describe(
        "Display name for the uploaded file (defaults to the file's basename)"
      ),
  },
  async (params) => {
    try {
      const result = await uploadFile(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: error.message },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
