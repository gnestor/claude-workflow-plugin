---
name: playwright
description: Browser automation with Playwright for web scraping, screenshots, form filling, and PDF generation. Activate when the user needs to interact with web pages, take screenshots, fill forms, or extract data from websites. Uses persistent browser sessions.
category: ~~browser
service: Playwright
---

# Playwright Browser Automation

## Purpose

This skill enables browser automation using Playwright with persistent browser sessions. Use for web scraping, screenshots, form filling, JavaScript evaluation, and PDF generation.

## When to Use

Activate this skill when the user:
- Needs to take screenshots of web pages
- Wants to scrape data from websites
- Needs to fill forms or click buttons on web pages
- Wants to generate PDFs from URLs
- Needs to evaluate JavaScript on a page
- Mentions "browser", "scrape", "screenshot", or "web page"

## When NOT to Use

- **API access**: Use the dedicated service skill when an API is available
- **Static file downloads**: Use bash curl/wget for direct file downloads

## Client Script

**Path:** `skills/playwright/scripts/client.js`

### Commands

| Command | Description |
|---------|-------------|
| `navigate` | Open a URL and return page title (--url) |
| `screenshot` | Take screenshot (--url) [--output, --full-page] |
| `click` | Click an element (--url, --selector) |
| `fill` | Fill a form field (--selector, --value) [--url] |
| `evaluate` | Run JavaScript on a page (--url, --script) |
| `pdf` | Generate PDF from URL (--url) [--output] |

## Key Concepts

**Persistent sessions:** Browser data is stored at `~/.config/workflow-plugin/playwright-data/` so login sessions persist between commands.

**Selectors:** Use CSS selectors (e.g., `button#submit`, `.search-input`, `[data-testid="login"]`).

**Screenshots:** Default output is `./screenshot.png`. Use `--full-page` for full page capture.

## Reference Files
- [examples.md](references/examples.md) — Usage patterns
- [documentation.md](references/documentation.md) — Full documentation
