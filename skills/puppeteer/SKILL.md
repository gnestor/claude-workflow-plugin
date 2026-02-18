---
name: puppeteer
description: Browser automation skill for interacting with web pages, scraping data, and automating workflows. Activate when the user needs to interact with websites, inspect pages, find selectors, test interactions, or automate browser-based tasks. Useful for scraping, form filling, and testing.
---

# Puppeteer / Browser Automation

## Purpose

This skill enables browser automation using `~~browser` tools. It provides capabilities for navigating web pages, interacting with elements, taking screenshots, and automating browser-based workflows.

Authentication is handled by the MCP server configuration.

## When to Use

Activate this skill when the user:
- Needs to interact with a website programmatically
- Wants to scrape data from a web page
- Asks to "inspect what's on the page" or "find elements"
- Needs to automate a browser-based workflow
- Wants to take screenshots of web pages
- Needs to fill forms or click buttons on websites
- Wants to debug a web page or find selectors

## Available Tools

The `~~browser` MCP server provides tools for:
- **Navigation** - Navigate to URLs, go back/forward, reload pages
- **Page inspection** - Get page info, find elements, get DOM content
- **Interaction** - Click elements, type text, select options, handle modals
- **Screenshots** - Take full-page or element screenshots
- **JavaScript execution** - Run arbitrary JavaScript on the page
- **Downloads** - Handle file downloads from web pages

## Common Patterns

### Login with CAPTCHA/2FA

When encountering CAPTCHA or 2FA during automation:
1. Detect CAPTCHA presence by looking for recaptcha elements
2. Alert the user and wait for manual intervention
3. Poll for CAPTCHA completion (check for token)
4. Continue automation once solved

### Date Range Selection

For date picker interactions:
1. Find the date input element
2. Click to select all existing text (triple-click)
3. Type the new date value with a slight delay
4. Press Enter to close the picker

### Handle Modals

When unexpected modals appear:
1. Check for modal elements with a short timeout
2. If found, click the close/dismiss button
3. If not found, continue with the workflow

### Download Files

When downloading files from websites:
1. Find and click the download/export button
2. Wait for the download to complete
3. Locate the downloaded file in the assets directory

## Selector Priority

When multiple selectors are available, prefer in this order:

1. **ID selectors** (`#email`) - Most stable
2. **ARIA labels** (`aria/Email Address`) - Semantic and stable
3. **Name attributes** (`input[name="email"]`) - Usually stable
4. **CSS classes** (`.email-input`) - Can change with styling
5. **XPath** - Last resort, very fragile

## Debugging Guidance

When a script or interaction fails:

1. **Inspect the page** - Use page inspection tools to see current state and available elements
2. **Find the right selector** - Search for elements by text content to discover correct selectors
3. **Test interactions** - Try clicking or typing on elements to verify they work
4. **Take screenshots** - Capture the current page state for visual debugging
5. **Execute JavaScript** - Run JS on the page to examine DOM state

### Common Issues

**"Timeout waiting for selector"**
- The selector may be wrong - use find/search tools to discover the correct one
- The page may not have loaded fully - increase wait time
- The element may be in an iframe - check for iframes

**"Element not clickable"**
- Element may be covered by another element (modal, overlay)
- Element may be outside viewport - scroll to it first
- Element may be disabled - check element state

**"Navigation timeout"**
- Page may be slow to load - increase timeout
- Page may redirect - check final URL
- Network issue - verify the URL is accessible

## Guidelines

### DO:
- Use page inspection tools before interacting with elements
- Add reasonable waits between interactions
- Handle unexpected modals and popups gracefully
- Use ARIA labels and semantic selectors when available
- Take screenshots during debugging to understand page state

### DON'T:
- Hardcode credentials or sensitive data
- Use fragile XPath selectors when better options exist
- Skip error handling
- Assume page layout without inspecting first
- Interact too quickly without allowing page transitions
