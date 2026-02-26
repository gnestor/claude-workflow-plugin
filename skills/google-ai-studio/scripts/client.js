#!/usr/bin/env node

import { writeFile, readFile } from 'node:fs/promises';
import { apiRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'google-ai-studio';

const MODEL_ALIASES = {
  nbp: 'gemini-3-pro-image',
  nb: 'gemini-2.5-flash-image',
};

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

function resolveModel(model) {
  return MODEL_ALIASES[model] || model;
}

// --- Commands ---

async function generateText(flags) {
  if (!flags.prompt) throw new Error('--prompt is required');
  const model = resolveModel(flags.model || 'gemini-2.5-flash');
  const body = {
    contents: [{ parts: [{ text: flags.prompt }] }],
  };
  const generationConfig = {};
  if (flags.temperature) generationConfig.temperature = parseFloat(flags.temperature);
  if (flags['max-tokens']) generationConfig.maxOutputTokens = parseInt(flags['max-tokens'], 10);
  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }
  const result = await apiRequest(SERVICE, `/models/${model}:generateContent`, {
    method: 'POST',
    body,
  });
  return result;
}

async function generateImage(flags) {
  if (!flags.prompt) throw new Error('--prompt is required');
  const model = resolveModel(flags.model || 'gemini-2.5-flash-image');
  const body = {
    contents: [{ parts: [{ text: flags.prompt }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  };
  const result = await apiRequest(SERVICE, `/models/${model}:generateContent`, {
    method: 'POST',
    body,
  });
  if (flags['output-path'] && result.candidates?.[0]?.content?.parts) {
    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        await writeFile(flags['output-path'], buffer);
        return { saved: flags['output-path'], mimeType: part.inlineData.mimeType };
      }
    }
  }
  return result;
}

async function editImage(flags) {
  if (!flags.prompt) throw new Error('--prompt is required');
  if (!flags['image-path']) throw new Error('--image-path is required');
  const model = resolveModel(flags.model || 'gemini-2.5-flash-image');
  const imageData = await readFile(flags['image-path']);
  const base64 = imageData.toString('base64');
  const mimeType = flags['image-path'].endsWith('.png') ? 'image/png' : 'image/jpeg';
  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: flags.prompt },
        ],
      },
    ],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  };
  const result = await apiRequest(SERVICE, `/models/${model}:generateContent`, {
    method: 'POST',
    body,
  });
  if (flags['output-path'] && result.candidates?.[0]?.content?.parts) {
    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        await writeFile(flags['output-path'], buffer);
        return { saved: flags['output-path'], mimeType: part.inlineData.mimeType };
      }
    }
  }
  return result;
}

async function embed(flags) {
  if (!flags.text) throw new Error('--text is required');
  const model = flags.model || 'text-embedding-004';
  const body = {
    content: { parts: [{ text: flags.text }] },
  };
  const result = await apiRequest(SERVICE, `/models/${model}:embedContent`, {
    method: 'POST',
    body,
  });
  return result;
}

async function uploadFile(flags) {
  if (!flags['file-path']) throw new Error('--file-path is required');
  if (!flags['mime-type']) throw new Error('--mime-type is required');
  const fileData = await readFile(flags['file-path']);
  const numBytes = fileData.length;

  // Step 1: Initiate resumable upload
  const initResult = await apiRequest(SERVICE, '', {
    method: 'POST',
    baseUrl: 'https://generativelanguage.googleapis.com/upload/v1beta/files',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(numBytes),
      'X-Goog-Upload-Header-Content-Type': flags['mime-type'],
    },
    body: { file: { displayName: flags['file-path'].split('/').pop() } },
    raw: true,
  });

  const uploadUrl = initResult.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) throw new Error('Failed to get upload URL');

  // Step 2: Upload the file bytes
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(numBytes),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: fileData,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Upload failed: HTTP ${uploadRes.status}: ${text}`);
  }

  return await uploadRes.json();
}

// --- CLI Router ---

const COMMANDS = {
  'generate-text': {
    fn: generateText,
    desc: 'Generate text (--prompt) [--model, --temperature, --max-tokens]',
  },
  'generate-image': {
    fn: generateImage,
    desc: 'Generate image (--prompt) [--model, --output-path]',
  },
  'edit-image': {
    fn: editImage,
    desc: 'Edit image (--prompt, --image-path) [--model, --output-path]',
  },
  'embed': {
    fn: embed,
    desc: 'Embed text (--text) [--model]',
  },
  'upload-file': {
    fn: uploadFile,
    desc: 'Upload file (--file-path, --mime-type)',
  },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(maxLen + 2)}${desc}`);
  }
  console.log('\nModel aliases: nbp=gemini-3-pro-image, nb=gemini-2.5-flash-image');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !COMMANDS[command]) {
    if (command) console.error(`Unknown command: ${command}\n`);
    printUsage();
    process.exit(command ? 1 : 0);
  }

  const flags = parseFlags(args.slice(1));

  try {
    const result = await COMMANDS[command].fn(flags);
    success(result);
  } catch (err) {
    error(err);
  }
}

main();
