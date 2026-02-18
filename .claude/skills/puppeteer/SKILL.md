---
name: puppeteer
description: This skill should be used to convert Chrome DevTools Recorder exports to Puppeteer scripts and debug/build scripts using CDP (Chrome DevTools Protocol). Activate when the user needs to connect to a live Chrome instance to inspect pages, find selectors, test interactions, or build automation scripts from natural language instructions. Useful for converting recordings, debugging failing scripts, or building new automation from scratch.
---

# Puppeteer Skill

## Purpose

This skill helps create and debug browser automation scripts. It provides:

1. **Recording → Script Conversion**: Transform Chrome DevTools Recorder exports into production-ready Puppeteer scripts
2. **Interactive Debugging**: Connect to live Chrome via CDP to inspect pages, find selectors, test interactions, and fix failing scripts

## When to Use

Activate this skill when the user:

- References a Chrome DevTools Recorder JSON file (e.g., "recordings/Download DM Report.json")
- Asks to "convert a recording to a script"
- Says "the script is failing at..." or "I need help finding a selector"
- Wants to build a script from scratch using natural language
- Needs to "inspect what's on the page" or "find elements"

## The Workflow

### 1. Record the Workflow

Use Chrome DevTools Recorder to capture the workflow:

1. Open Chrome DevTools (F12)
2. Go to "Recorder" tab
3. Click "Start new recording"
4. Perform actions in the browser (login, navigate, fill forms, download, etc.)
5. Click "End recording"
6. Export as JSON to `/assets/chrome-recordings/`

### 2. Generate Puppeteer Script

Convert the recording to a Puppeteer script using this skill:

```
Convert assets/chrome-recordings/my-workflow.json to a Puppeteer script
```

The skill will:
- Analyze the recording
- Generate a script using the standard pattern
- Save to `/workflows/browser-automations/{workflow-name}/`
- Make it executable

**Standard Script Pattern:**
```typescript
#!/usr/bin/env -S deno run --allow-all

import { Page } from 'puppeteer';
import { runInBrowser } from 'lib/puppeteer.ts';
import '@std/dotenv/load';

export const workflow = (
  param1: string,
  param2: Date
): Promise<Uint8Array> => {
  return runInBrowser(async (page: Page) => {
    // Automation logic here
    console.log('Step 1: Navigating...');
    await page.goto('https://example.com');

    // ... more steps ...

    return result;
  });
};

async function main() {
  // Show help if requested
  const args = Deno.args;
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Script Name\n');
    console.log('Usage:');
    console.log('  deno run --allow-all script.ts [param1] [param2]\n');
    console.log('Arguments:');
    console.log('  param1      Description (default: value)');
    console.log('  param2      Description (default: value)\n');
    console.log('Examples:');
    console.log('  deno run --allow-all script.ts');
    console.log('  deno run --allow-all script.ts value1 value2\n');
    console.log('Environment variables required:');
    console.log('  PLATFORM_USERNAME');
    console.log('  PLATFORM_PASSWORD');
    Deno.exit(0);
  }

  // Validate credentials
  if (!Deno.env.get('PLATFORM_USERNAME') || !Deno.env.get('PLATFORM_PASSWORD')) {
    console.error('✗ Missing credentials in .env file');
    console.error('  Required: PLATFORM_USERNAME, PLATFORM_PASSWORD');
    Deno.exit(1);
  }

  // Parse command-line arguments with defaults
  const param1 = args[0] || 'default-value';
  const param2 = args[1] || 'default-value';

  // Run workflow
  try {
    const result = await workflow(param1, param2);
    console.log('✓ Success');
    return { success: true };
  } catch (error) {
    console.error('✗ Error:', (error as Error).message);
    return { success: false };
  }
}

if (import.meta.main) {
  const result = await main();
  Deno.exit(result.success ? 0 : 1);
}
```

**Key Features:**
- Uses `runInBrowser()` helper from [lib/puppeteer.ts](../../lib/puppeteer.ts)
- Auto-connects to existing Chrome or launches new instance
- Replaces credentials with environment variables
- Parameterizes dates and configurable values
- Helpful console.log statements for each step
- Proper error handling

### 3. Test the Script

Run the generated script:

```bash
deno run --allow-all workflows/browser-automations/{workflow-name}/my-workflow.ts
```

The script will:
- Connect to existing Chrome (port 9222) or launch a new instance
- Create a new page/tab
- Run the automation
- Close the page (but leave Chrome running for debugging)

**Keep Chrome running during testing!** If the script fails, the Chrome instance stays open for using CDP tools to debug.

### 4. Debug with CDP Tools

When a script fails or times out, use the unified CDP tool to debug:

```bash
# Inspect the current page
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts inspect

# Find the right selector
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts find "Post Performance"

# Test clicking an element
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts click "#submit-button"

# Execute JavaScript
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts eval "document.title"

# Take a screenshot
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts screenshot debug-state
```

**CDP Commands:**
- `inspect` - Show page information and clickable elements
- `find "<text>"` - Find elements and suggest selectors
- `click "<selector>"` - Click an element
- `eval "<javascript>"` - Execute JavaScript on the page
- `screenshot [name]` - Take a screenshot (saved to assets/)

### 5. Fix and Retry

Once the issue is identified:

1. Update the script with the correct selector/logic
2. Re-run the script from the beginning OR
3. Manually navigate back in Chrome and test the next step
4. Repeat until the script completes successfully

**Important:** Don't close Chrome during debugging! Keep the browser open to:
- Inspect the current state
- Try different selectors
- Test interactions
- Navigate back and retry steps

## Auto-Launch Chrome

Generated scripts automatically handle Chrome lifecycle:

- **Existing Chrome:** Connects to Chrome running on port 9222
- **No Chrome:** Launches new Chrome instance with remote debugging
- **After execution:** Closes the page/tab but leaves Chrome running
- **On error:** Leaves Chrome open for debugging

**Manually launching Chrome (optional):**
```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 &

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222 &
```

**Benefits of pre-launching:**
- Reuse browser across multiple runs (faster)
- Maintain login sessions
- Manually intervene for CAPTCHA/2FA

## Common Patterns

### Login with CAPTCHA/2FA

```typescript
// Check for CAPTCHA
const hasCaptcha = await page.evaluate(() => {
  const captchaElements = document.querySelectorAll('[class*="recaptcha"]');
  return captchaElements.length > 0;
});

if (hasCaptcha) {
  console.log('🔒 CAPTCHA detected! Please solve it in the browser.');
  console.log('   Waiting up to 2 minutes...');

  // Poll for CAPTCHA completion
  let solved = false;
  for (let i = 0; i < 40; i++) {
    await wait(3000);
    const token = await page.evaluate(() => {
      const el = document.querySelector('textarea[name="g-recaptcha-response"]') as HTMLTextAreaElement;
      return el?.value || '';
    });

    if (token.length > 50) {
      console.log('✓ CAPTCHA solved!');
      solved = true;
      break;
    }
  }

  if (!solved) {
    throw new Error('CAPTCHA not solved within 2 minutes');
  }
}
```

### Date Range Selection

```typescript
// Type directly into date inputs
const startDateInput = await page.waitForSelector('#StartDate', { visible: true });
await startDateInput.click({ clickCount: 3 }); // Select all
await startDateInput.type(startDate, { delay: 50 });

const endDateInput = await page.waitForSelector('#EndDate', { visible: true });
await endDateInput.click({ clickCount: 3 });
await endDateInput.type(endDate, { delay: 50 });
await page.keyboard.press('Enter'); // Close picker
```

### Download Files

```typescript
// The runInBrowser helper configures downloads automatically
// Files are saved to ./assets/

console.log('Clicking export button...');
const exportButton = await page.waitForSelector('aria/Export CSV', { visible: true });
await exportButton?.click();

console.log('Waiting for download...');
await wait(3000); // Give it time to download

// Optionally read the downloaded file
const files = [];
for await (const entry of Deno.readDir('./assets')) {
  if (entry.isFile && entry.name.endsWith('.csv')) {
    files.push(entry.name);
  }
}

if (files.length > 0) {
  const latestFile = files[files.length - 1];
  const data = await Deno.readFile(`./assets/${latestFile}`);
  console.log(`Downloaded: ${latestFile} (${data.length} bytes)`);
}
```

### Handle Modals

```typescript
console.log('Checking for modal...');
try {
  const closeModal = await page.waitForSelector('modal-container > div > a', {
    visible: true,
    timeout: 3000
  });
  if (closeModal) {
    await closeModal.click();
    await wait(500);
  }
} catch {
  console.log('No modal found, continuing...');
}
```

## Selector Priority

When multiple selectors are available, prefer in this order:

1. **ID selectors** (`#email`) - Most stable
2. **ARIA labels** (`aria/Email Address`) - Semantic and stable
3. **Name attributes** (`input[name="email"]`) - Usually stable
4. **CSS classes** (`.email-input`) - Can change with styling
5. **XPath** - Last resort, very fragile

## Guidelines

### DO:
- ✅ Use the standard script pattern with `workflow` and `main` functions
- ✅ Use `runInBrowser()` helper from lib/puppeteer.ts
- ✅ Add helpful console.log statements for each step
- ✅ Replace credentials with environment variables
- ✅ Parameterize dates and configurable values
- ✅ Handle CAPTCHA and 2FA gracefully
- ✅ Use CDP tools to debug failing scripts
- ✅ Keep Chrome running during testing

### DON'T:
- ❌ Hardcode credentials or sensitive data
- ❌ Hardcode dates or time-dependent values
- ❌ Skip error handling
- ❌ Use fragile XPath selectors when better options exist
- ❌ Close Chrome while debugging
- ❌ Forget to make script executable

## Example Debugging Session

**Script fails:**
```
Error: Timeout waiting for selector "#export-button"
```

**Debug with CDP:**
```bash
# 1. Inspect the page
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts inspect
# Output shows: Button has ID "download-btn", not "export-button"

# 2. Find the correct selector
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts find "Export"
# Output: Recommended: #download-btn

# 3. Test clicking it
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts click "#download-btn"
# Output: ✓ Clicked successfully

# 4. Take a screenshot to confirm
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts screenshot after-click
```

**Fix the script:**
```typescript
// Change:
const exportButton = await page.waitForSelector('#export-button', { visible: true });

// To:
const exportButton = await page.waitForSelector('#download-btn', { visible: true });
```

**Re-run and continue testing!**

