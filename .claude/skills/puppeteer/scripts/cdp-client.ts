#!/usr/bin/env -S deno run --allow-all

/// <reference lib="dom" />

/**
 * CDP - Unified Chrome DevTools Protocol debugging tool
 *
 * This tool connects to a running Chrome instance and provides commands for:
 * - Inspecting pages
 * - Finding selectors
 * - Clicking elements
 * - Executing JavaScript
 * - Taking screenshots
 *
 * Usage:
 *   deno run --allow-all .claude/skills/puppeteer/scripts/cdp-client.ts <command> [args]
 *
 * Commands:
 *   inspect                        Show page information and clickable elements
 *   find "<text>"                  Find elements matching text and suggest selectors
 *   click "<selector>"             Click an element
 *   eval "<javascript>"            Execute JavaScript on the page
 *   screenshot [filename]          Take a screenshot (saves to assets/)
 *
 * Examples:
 *   cdp-client.ts inspect
 *   cdp-client.ts find "Post Performance"
 *   cdp-client.ts click "#submit-button"
 *   cdp-client.ts eval "document.title"
 *   cdp-client.ts screenshot login-page
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// ============================================================================
// Core CDP Functions
// ============================================================================

interface CDPConnection {
	browser: Browser;
	page: Page;
}

/**
 * Connect to Chrome instance running with remote debugging
 */
async function connectToCDP(port: number = 9222): Promise<CDPConnection> {
	try {
		const browser = await puppeteer.connect({
			browserURL: `http://127.0.0.1:${port}`,
		});

		const pages = await browser.pages();
		const page = pages[pages.length - 1]; // Get most recent page

		return { browser, page };
	} catch (error) {
		throw new Error(
			`Failed to connect to Chrome at port ${port}. ` +
			`Make sure Chrome is running with --remote-debugging-port=${port}`
		);
	}
}

/**
 * Get page information
 */
async function getPageInfo(page: Page) {
	const url = page.url();
	const title = await page.title();

	return {
		url,
		title,
		viewport: await page.viewport(),
	};
}

/**
 * Find elements matching text content
 */
async function findElementsByText(page: Page, text: string, options: { exact?: boolean } = {}) {
	const elements = await page.evaluate(({ searchText, exact }) => {
		const allElements = Array.from(document.querySelectorAll('*'));
		const matches: Array<{
			tagName: string;
			id: string;
			className: string;
			textContent: string;
			selector: string;
			xpath: string;
		}> = [];

		for (const el of allElements) {
			const elementText = el.textContent?.trim() || '';
			const matchesSearch = exact
				? elementText === searchText
				: elementText.toLowerCase().includes(searchText.toLowerCase());

			if (matchesSearch && elementText.length < 200) { // Avoid huge text blocks
				// Generate CSS selector
				let selector = el.tagName.toLowerCase();
				if (el.id) selector = `#${el.id}`;
				else if (el.className) selector += `.${el.className.split(' ')[0]}`;

				// Generate XPath
				const getXPath = (element: Element): string => {
					if (element.id) return `//*[@id="${element.id}"]`;
					if (element === document.body) return '/html/body';

					let ix = 0;
					const siblings = element.parentNode?.children || [];
					for (let i = 0; i < siblings.length; i++) {
						const sibling = siblings[i];
						if (sibling === element) {
							const parentPath = element.parentNode ? getXPath(element.parentNode as Element) : '';
							return `${parentPath}/${element.tagName.toLowerCase()}[${ix + 1}]`;
						}
						if (sibling.tagName === element.tagName) ix++;
					}
					return '';
				};

				matches.push({
					tagName: el.tagName,
					id: el.id,
					className: el.className as string,
					textContent: elementText.substring(0, 100),
					selector,
					xpath: getXPath(el),
				});
			}
		}

		return matches;
	}, { searchText: text, exact: options.exact || false });

	return elements;
}

/**
 * Get all clickable elements on the page
 */
async function getClickableElements(page: Page) {
	return await page.evaluate(() => {
		const clickable = Array.from(
			document.querySelectorAll('a, button, input[type="button"], input[type="submit"], [role="button"], [onclick]')
		);

		return clickable.slice(0, 50).map(el => ({
			tagName: el.tagName,
			id: el.id,
			className: el.className,
			textContent: el.textContent?.trim().substring(0, 50) || '',
			href: (el as HTMLAnchorElement).href || '',
			type: (el as HTMLInputElement).type || '',
		}));
	});
}

/**
 * Take screenshot
 */
async function takeScreenshot(page: Page, path: string) {
	await page.screenshot({ path, fullPage: true });
	return path;
}

/**
 * Get selector suggestions for an element description
 */
async function getSelectorSuggestions(page: Page, description: string) {
	const elements = await findElementsByText(page, description, { exact: false });

	if (elements.length === 0) {
		return {
			success: false,
			message: `No elements found matching "${description}"`,
			suggestions: [],
		};
	}

	// Rank suggestions by quality
	const ranked = elements.map(el => {
		let confidence: 'high' | 'medium' | 'low' = 'low';

		if (el.id) confidence = 'high';
		else if (el.className && !el.className.includes('ng-') && !el.className.includes('ember-')) {
			confidence = 'medium';
		}

		return {
			element: el,
			confidence,
			recommended: el.id ? `#${el.id}` : el.selector,
		};
	});

	// Sort by confidence
	ranked.sort((a, b) => {
		const confidenceOrder = { high: 0, medium: 1, low: 2 };
		return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
	});

	return {
		success: true,
		count: elements.length,
		suggestions: ranked.slice(0, 10),
		recommended: ranked[0],
	};
}

// ============================================================================
// CLI Commands
// ============================================================================

const COMMANDS = {
	inspect: 'Show page information and clickable elements',
	find: 'Find elements matching text and suggest selectors',
	click: 'Click an element using a selector',
	eval: 'Execute JavaScript on the page',
	screenshot: 'Take a screenshot of the current page',
};

function showUsage() {
	console.log('CDP - Chrome DevTools Protocol debugging tool\n');
	console.log('Usage: cdp-client.ts <command> [args]\n');
	console.log('Commands:');
	Object.entries(COMMANDS).forEach(([cmd, desc]) => {
		console.log(`  ${cmd.padEnd(15)} ${desc}`);
	});
	console.log('\nExamples:');
	console.log('  cdp-client.ts inspect');
	console.log('  cdp-client.ts find "Post Performance"');
	console.log('  cdp-client.ts click "#submit-button"');
	console.log('  cdp-client.ts eval "document.title"');
	console.log('  cdp-client.ts screenshot login-page');
}

async function commandInspect() {
	console.log('🔍 Connecting to Chrome...');

	const { browser, page } = await connectToCDP();
	console.log('✓ Connected to Chrome\n');

	// Get page info
	const info = await getPageInfo(page);
	console.log('📄 Page Information:');
	console.log(`  URL: ${info.url}`);
	console.log(`  Title: ${info.title}`);
	console.log(`  Viewport: ${info.viewport?.width}x${info.viewport?.height}\n`);

	// Get clickable elements
	console.log('🖱️  Clickable Elements (first 20):');
	const clickable = await getClickableElements(page);
	clickable.slice(0, 20).forEach((el, i) => {
		const text = el.textContent ? ` - "${el.textContent}"` : '';
		const id = el.id ? ` #${el.id}` : '';
		const href = el.href ? ` (${el.href})` : '';
		console.log(`  ${i + 1}. ${el.tagName}${id}${text}${href}`);
	});

	await browser.disconnect();
	console.log('\n✓ Done');
}

async function commandFind(description: string) {
	if (!description) {
		console.error('Error: Missing search text');
		console.error('Usage: cdp-client.ts find "<element description>"');
		console.error('Example: cdp-client.ts find "Post Performance"');
		Deno.exit(1);
	}

	console.log(`🔍 Searching for elements matching "${description}"...`);

	const { browser, page } = await connectToCDP();

	const result = await getSelectorSuggestions(page, description);

	if (!result.success || !result.recommended) {
		console.log(`\n✗ ${result.message || 'No elements found'}`);
		await browser.disconnect();
		Deno.exit(1);
	}

	console.log(`\n✓ Found ${result.count} matching element(s)\n`);

	console.log('📍 Recommended Selector:');
	const rec = result.recommended;
	console.log(`  Selector: ${rec.recommended}`);
	console.log(`  Confidence: ${rec.confidence}`);
	console.log(`  Element: <${rec.element.tagName.toLowerCase()}> "${rec.element.textContent}"`);
	console.log(`  ID: ${rec.element.id || '(none)'}`);
	console.log(`  Class: ${rec.element.className || '(none)'}`);

	if (result.suggestions.length > 1) {
		console.log(`\n📋 Alternative Suggestions (${result.suggestions.length - 1} more):`);
		result.suggestions.slice(1, 6).forEach((sug, i) => {
			console.log(`\n  ${i + 1}. ${sug.recommended} (${sug.confidence} confidence)`);
			console.log(`     <${sug.element.tagName.toLowerCase()}> "${sug.element.textContent}"`);
		});
	}

	await browser.disconnect();
	console.log('\n✓ Done');
}

async function commandClick(selector: string) {
	if (!selector) {
		console.error('Error: Missing selector');
		console.error('Usage: cdp-client.ts click "<selector>"');
		console.error('Example: cdp-client.ts click "#submit-button"');
		Deno.exit(1);
	}

	console.log(`🖱️  Clicking element: ${selector}...`);

	const { browser, page } = await connectToCDP();

	try {
		const element = await page.waitForSelector(selector, { visible: true, timeout: 5000 });
		if (!element) {
			console.error(`✗ Element not found: ${selector}`);
			await browser.disconnect();
			Deno.exit(1);
		}

		await element.click();
		console.log('✓ Clicked successfully');

		// Wait a moment to see the result
		await new Promise(resolve => setTimeout(resolve, 500));

		const info = await getPageInfo(page);
		console.log(`\n📄 Current Page: ${info.url}`);
	} catch (error) {
		console.error(`✗ Error clicking element: ${(error as Error).message}`);
		await browser.disconnect();
		Deno.exit(1);
	}

	await browser.disconnect();
	console.log('✓ Done');
}

async function commandEval(script: string) {
	if (!script) {
		console.error('Error: Missing JavaScript code');
		console.error('Usage: cdp-client.ts eval "<javascript>"');
		console.error('Example: cdp-client.ts eval "document.title"');
		Deno.exit(1);
	}

	console.log(`⚡ Executing JavaScript...`);

	const { browser, page } = await connectToCDP();

	try {
		const result = await page.evaluate(script);
		console.log('\n📤 Result:');
		console.log(JSON.stringify(result, null, 2));
	} catch (error) {
		console.error(`✗ Error executing JavaScript: ${(error as Error).message}`);
		await browser.disconnect();
		Deno.exit(1);
	}

	await browser.disconnect();
	console.log('\n✓ Done');
}

async function commandScreenshot(filename?: string) {
	const defaultFilename = filename || `screenshot-${Date.now()}`;
	const screenshotDir = 'assets';
	const path = `${screenshotDir}/${defaultFilename}.png`;

	console.log(`📸 Taking screenshot...`);

	const { browser, page } = await connectToCDP();

	try {
		// Ensure screenshot directory exists
		await Deno.mkdir(screenshotDir, { recursive: true });

		await takeScreenshot(page, path);
		console.log(`✓ Screenshot saved to: ${path}`);
	} catch (error) {
		console.error(`✗ Error taking screenshot: ${(error as Error).message}`);
		await browser.disconnect();
		Deno.exit(1);
	}

	await browser.disconnect();
	console.log('✓ Done');
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
	const command = Deno.args[0];
	const arg = Deno.args[1];

	if (!command || command === '--help' || command === '-h') {
		showUsage();
		Deno.exit(0);
	}

	try {
		switch (command) {
			case 'inspect':
				await commandInspect();
				break;
			case 'find':
				await commandFind(arg);
				break;
			case 'click':
				await commandClick(arg);
				break;
			case 'eval':
				await commandEval(arg);
				break;
			case 'screenshot':
				await commandScreenshot(arg);
				break;
			default:
				console.error(`Unknown command: ${command}\n`);
				showUsage();
				Deno.exit(1);
		}
	} catch (error) {
		console.error('\n✗ Error:', (error as Error).message);
		console.error('\nMake sure Chrome is running with remote debugging:');
		console.error('  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
		Deno.exit(1);
	}
}

if (import.meta.main) {
	main();
}
