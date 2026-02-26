#!/usr/bin/env node

import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { success, error } from '../../../lib/output.js';

// ---------------------------------------------------------------------------
// Persistent browser context
// ---------------------------------------------------------------------------

const BROWSER_DATA_DIR = join(homedir(), '.config', 'workflow-plugin', 'playwright-data');

async function getBrowser() {
  return await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
    headless: true,
    viewport: { width: 1280, height: 720 },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function navigate(flags) {
  if (!flags.url) throw new Error('--url is required');
  const context = await getBrowser();
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(flags.url, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    const finalUrl = page.url();
    return { title, url: finalUrl };
  } finally {
    await context.close();
  }
}

async function screenshot(flags) {
  if (!flags.url) throw new Error('--url is required');
  const outputPath = flags.output || './screenshot.png';
  const fullPage = !!flags['full-page'];
  const context = await getBrowser();
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(flags.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: outputPath, fullPage });
    const title = await page.title();
    return { title, url: page.url(), screenshot: outputPath };
  } finally {
    await context.close();
  }
}

async function click(flags) {
  if (!flags.selector) throw new Error('--selector is required');
  if (!flags.url) throw new Error('--url is required');
  const context = await getBrowser();
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(flags.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.click(flags.selector);
    // Wait for any navigation or network activity after click
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    const title = await page.title();
    return { title, url: page.url(), clicked: flags.selector };
  } finally {
    await context.close();
  }
}

async function fill(flags) {
  if (!flags.selector) throw new Error('--selector is required');
  if (!flags.value) throw new Error('--value is required');
  const context = await getBrowser();
  try {
    const page = context.pages()[0] || await context.newPage();
    if (flags.url) {
      await page.goto(flags.url, { waitUntil: 'networkidle', timeout: 30000 });
    }
    await page.fill(flags.selector, flags.value);
    const title = await page.title();
    return { title, url: page.url(), filled: flags.selector, value: flags.value };
  } finally {
    await context.close();
  }
}

async function evaluate(flags) {
  if (!flags.url) throw new Error('--url is required');
  if (!flags.script) throw new Error('--script is required');
  const context = await getBrowser();
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(flags.url, { waitUntil: 'networkidle', timeout: 30000 });
    const result = await page.evaluate(flags.script);
    return { result };
  } finally {
    await context.close();
  }
}

async function generatePdf(flags) {
  if (!flags.url) throw new Error('--url is required');
  const outputPath = flags.output || './page.pdf';
  const context = await getBrowser();
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(flags.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.pdf({ path: outputPath, format: 'A4' });
    return { url: flags.url, pdf: outputPath };
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// CLI Router
// ---------------------------------------------------------------------------

const COMMANDS = {
  'navigate': {
    fn: navigate,
    desc: 'Open a URL and return page title (--url)',
  },
  'screenshot': {
    fn: screenshot,
    desc: 'Take a screenshot of a URL (--url) [--output, --full-page]',
  },
  'click': {
    fn: click,
    desc: 'Click an element on a page (--url, --selector)',
  },
  'fill': {
    fn: fill,
    desc: 'Fill a form field (--selector, --value) [--url]',
  },
  'evaluate': {
    fn: evaluate,
    desc: 'Run JavaScript in the page context (--url, --script)',
  },
  'pdf': {
    fn: generatePdf,
    desc: 'Generate a PDF from a URL (--url) [--output]',
  },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map(k => k.length));
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(maxLen + 2)}${desc}`);
  }
  console.log('\nExamples:');
  console.log('  client.js navigate --url https://example.com');
  console.log('  client.js screenshot --url https://example.com --output ./shot.png --full-page');
  console.log('  client.js click --url https://example.com --selector "button#submit"');
  console.log('  client.js fill --url https://example.com --selector "#search" --value "hello"');
  console.log('  client.js evaluate --url https://example.com --script "document.title"');
  console.log('  client.js pdf --url https://example.com --output ./page.pdf');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !COMMANDS[command]) {
    if (command) console.error(`Unknown command: ${command}\n`);
    printUsage();
    process.exit(command ? 1 : 0);
  }

  const commandArgs = args.slice(1);
  const flags = parseFlags(commandArgs);

  try {
    const result = await COMMANDS[command].fn(flags);
    success(result);
  } catch (err) {
    error(err);
  }
}

main();
