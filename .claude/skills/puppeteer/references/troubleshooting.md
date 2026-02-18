# Puppeteer Troubleshooting

## Common Errors and Solutions

### page.waitForTimeout is not a function

**Error:**
```
TypeError: page.waitForTimeout is not a function
```

**Cause:**
The `page.waitForTimeout()` method was deprecated and removed in Puppeteer v21+.

**Solution:**
Replace with standard Promise-based timeout:

```typescript
// ❌ Don't use (deprecated)
await page.waitForTimeout(2000)

// ✅ Use instead
await new Promise(resolve => setTimeout(resolve, 2000))
```

**Example:**
```typescript
// Wait for page to fully load after navigation
await page.goto(url, { waitUntil: 'networkidle2' })
await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 additional seconds
```

This pattern works in all Puppeteer versions and is more explicit about what's happening.

### Selector Not Found

**Error:**
```
TimeoutError: Waiting for selector "#button" failed: timeout 30000ms exceeded
```

**Common Causes:**
1. Element hasn't loaded yet
2. Selector is incorrect
3. Element is in a different frame/iframe
4. Element is hidden or not visible

**Solutions:**

**1. Increase timeout:**
```typescript
await page.waitForSelector('#button', { timeout: 60000 })
```

**2. Wait for specific network conditions:**
```typescript
await page.goto(url, { waitUntil: 'networkidle2' })
```

**3. Use CDP tools to find correct selector:**
```bash
deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts find "Button Text"
```

**4. Check for iframes:**
```typescript
const frame = page.frames().find(f => f.url().includes('example.com'))
if (frame) {
  await frame.waitForSelector('#button')
}
```

**5. Wait for visibility:**
```typescript
await page.waitForSelector('#button', { visible: true })
```

### Navigation Timeout

**Error:**
```
TimeoutError: Navigation timeout of 30000ms exceeded
```

**Solutions:**

**1. Increase navigation timeout:**
```typescript
await page.goto(url, { timeout: 60000 })
```

**2. Use different waitUntil strategy:**
```typescript
// Less strict - waits for initial load
await page.goto(url, { waitUntil: 'domcontentloaded' })

// More strict - waits for all network activity to cease
await page.goto(url, { waitUntil: 'networkidle0' })

// Balanced - waits for most network activity (recommended)
await page.goto(url, { waitUntil: 'networkidle2' })
```

**3. Handle slow pages gracefully:**
```typescript
try {
  await page.goto(url, { timeout: 15000, waitUntil: 'networkidle2' })
} catch (error) {
  console.log('Page took too long, continuing anyway...')
  await new Promise(resolve => setTimeout(resolve, 2000))
}
```

### Screenshot Capture Failures

**Problem:** Screenshots are blank or cut off.

**Solutions:**

**1. Wait for content to load:**
```typescript
await page.goto(url, { waitUntil: 'networkidle2' })
await new Promise(resolve => setTimeout(resolve, 2000)) // Extra time for rendering
await page.screenshot({ path: 'screenshot.png' })
```

**2. Set viewport for consistent sizing:**
```typescript
await page.setViewport({ width: 1280, height: 960 })
await page.goto(url)
await page.screenshot({ path: 'screenshot.png', fullPage: true })
```

**3. Handle cookie banners and modals:**
```typescript
// Try to close common interruptions
try {
  const cookieBanner = await page.$('[class*="cookie"]', { timeout: 2000 })
  if (cookieBanner) await cookieBanner.click()
} catch {
  // No cookie banner found, continue
}
```

### Chrome Connection Issues

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:9222
```

**Solution:**
The `runInBrowser()` helper automatically launches Chrome if not running. If you're seeing this error:

1. Close any existing Chrome instances
2. Let the script launch Chrome automatically
3. Or manually launch with remote debugging:

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check &

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222 &
```

### Memory Issues with Large Syncs

**Problem:** Script crashes or hangs when processing many URLs.

**Solutions:**

**1. Process in batches:**
```typescript
const urls = [...] // Large list
const batchSize = 10

for (let i = 0; i < urls.length; i += batchSize) {
  const batch = urls.slice(i, i + batchSize)
  await Promise.all(batch.map(url => captureScreenshot(page, url)))

  // Give system time to free memory
  await new Promise(resolve => setTimeout(resolve, 1000))
}
```

**2. Reuse page instead of creating new ones:**
```typescript
// ✅ Good - reuse page
for (const url of urls) {
  await page.goto(url)
  await page.screenshot({ path: `screenshot-${i}.png` })
}

// ❌ Bad - creates many page objects
for (const url of urls) {
  const newPage = await browser.newPage()
  await newPage.goto(url)
  await newPage.screenshot({ path: `screenshot-${i}.png` })
  await newPage.close()
}
```

**3. Close browser between large batches:**
```typescript
const runInBrowser = (await import('lib/puppeteer.ts')).runInBrowser

// Process first batch
await runInBrowser(async (page) => {
  // ... process batch 1
})

// Browser closes automatically, freeing memory

// Process second batch
await runInBrowser(async (page) => {
  // ... process batch 2
})
```

### Rate Limiting and External API Errors

**Problem:** Target website blocks or rate-limits requests.

**Solutions:**

**1. Add delays between requests:**
```typescript
for (const url of urls) {
  await page.goto(url)
  await page.screenshot({ path: `screenshot.png` })

  // Wait 2-5 seconds between requests
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
}
```

**2. Rotate user agents:**
```typescript
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  // ... more user agents
]

await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)])
```

**3. Handle failures gracefully:**
```typescript
for (const url of urls) {
  try {
    await page.goto(url, { timeout: 15000 })
    await page.screenshot({ path: `${filename}.png` })
    console.log(`✓ Captured ${url}`)
  } catch (error) {
    console.log(`✗ Failed ${url}: ${error.message}`)
    // Continue with next URL instead of crashing
  }
}
```

## Best Practices

1. **Always use `runInBrowser()` helper** - Handles Chrome lifecycle automatically
2. **Wait for networkidle2** - Most reliable for ensuring page is ready
3. **Use CDP tools for debugging** - Faster than trial-and-error
4. **Keep Chrome open during development** - Allows inspection and debugging
5. **Process in batches for large datasets** - Prevents memory issues
6. **Handle errors gracefully** - Don't let one failure crash entire script
7. **Add delays between requests** - Prevents rate limiting
8. **Use standard Promise timeouts** - More portable than Puppeteer-specific methods
