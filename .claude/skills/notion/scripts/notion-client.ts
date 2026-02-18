#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Notion API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write notion-client.ts <command> [args...]
 *
 * Commands:
 *   search <query>                       - Search for pages/databases
 *   get-page <page-id>                   - Get page content
 *   query-database <database-id>         - Query database records
 *   query-database-filtered <database-id> <filter-json> - Query with filter
 *   create-page <parent-id> <title> <content> - Create new page
 *   create-database-page <database-id> <title> <content> - Create page in database
 *   update-page <page-id> <content>     - Append content to page
 *   add-comment <page-id> <text>         - Add comment to page
 *   get-comments <page-id>               - Get comments from page
 *   list-databases                       - List all databases
 *   get-database-schema <database-id>    - Get database schema
 *   scan-databases                       - Scan all databases and save schemas
 *   md-to-notion <markdown>               - Convert markdown to Notion blocks (JSON)
 *   notion-to-md <page-id>                - Convert page blocks to markdown
 */


import '@std/dotenv/load';
import { Client } from "@notionhq/client";

// Initialize Notion client
const notion = new Client({
  auth: Deno.env.get("NOTION_API_TOKEN"),
});

/**
 * Split text into chunks that fit within Notion's 2000 character limit per block
 * Breaks at sentence boundaries when possible
 */
export function chunkText(text: string, maxLength: number = 1900): string[] {
  const chunks: string[] = [];

  // Use a slightly lower limit (1900) to ensure we stay under 2000 with any whitespace
  const safeMaxLength = maxLength;

  // If text is already short enough, return it as-is
  if (text.length <= safeMaxLength) {
    return [text];
  }

  // Split by sentence endings
  const sentencePattern = /(?<=[.!?])\s+/;
  const sentences = text.split(sentencePattern);

  let currentChunk = "";

  for (const sentence of sentences) {
    // If adding this sentence would exceed the limit
    if (currentChunk && (currentChunk + " " + sentence).length > safeMaxLength) {
      // Save current chunk
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else if (currentChunk) {
      // Add sentence to current chunk
      currentChunk += " " + sentence;
    } else {
      currentChunk = sentence;
    }

    // If a single sentence is longer than the limit, split it mid-sentence
    while (currentChunk.length > safeMaxLength) {
      // Find the last space before the limit
      let splitPos = currentChunk.lastIndexOf(" ", safeMaxLength);

      // If no space found, just split at the limit
      if (splitPos === -1) {
        splitPos = safeMaxLength;
      }

      chunks.push(currentChunk.substring(0, splitPos));
      currentChunk = currentChunk.substring(splitPos + 1);
    }
  }

  // Add any remaining content
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Process rich_text array to ensure text content fits within Notion's character limits
 * Preserves mentions and other non-text items
 */
function processRichTextForLimits(richText: any[]): any[][] {
  // Calculate total length
  let totalLength = 0;
  for (const item of richText) {
    if (item.type === 'text' && item.text?.content) {
      totalLength += item.text.content.length;
    } else if (item.plain_text) {
      totalLength += item.plain_text.length;
    }
  }

  // If within limits, return as single array
  if (totalLength <= 1900) {
    return [richText];
  }

  // Need to split - process each item
  const result: any[][] = [];
  let currentGroup: any[] = [];
  let currentLength = 0;

  for (const item of richText) {
    if (item.type === 'text' && item.text?.content) {
      const content = item.text.content;

      if (currentLength + content.length <= 1900) {
        currentGroup.push(item);
        currentLength += content.length;
      } else {
        // Need to chunk this text
        const chunks = chunkText(content);
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          if (i === 0 && currentLength + chunk.length <= 1900) {
            currentGroup.push({
              ...item,
              text: { ...item.text, content: chunk },
            });
            currentLength += chunk.length;
          } else {
            if (currentGroup.length > 0) {
              result.push(currentGroup);
            }
            currentGroup = [{
              ...item,
              text: { ...item.text, content: chunk },
            }];
            currentLength = chunk.length;
          }
        }
      }
    } else {
      // Non-text item (mention, etc.) - add to current group
      const itemLength = item.plain_text?.length || 20;
      if (currentLength + itemLength > 1900 && currentGroup.length > 0) {
        result.push(currentGroup);
        currentGroup = [item];
        currentLength = itemLength;
      } else {
        currentGroup.push(item);
        currentLength += itemLength;
      }
    }
  }

  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }

  return result;
}

/**
 * Process blocks to ensure all text content fits within Notion's character limits
 */
export function processBlocks(blocks: any[]): any[] {
  const processedBlocks: any[] = [];

  for (const block of blocks) {
    const blockType = block.type;

    // Block types that have rich_text
    const richTextBlockTypes = ['paragraph', 'bulleted_list_item', 'numbered_list_item', 'heading_1', 'heading_2', 'heading_3', 'quote', 'callout', 'to_do'];

    if (richTextBlockTypes.includes(blockType) && block[blockType]?.rich_text) {
      const richTextGroups = processRichTextForLimits(block[blockType].rich_text);

      for (const richTextGroup of richTextGroups) {
        const newBlock = {
          object: "block",
          type: blockType,
          [blockType]: {
            ...block[blockType],
            rich_text: richTextGroup,
          },
        };

        // Handle children for list items and toggle blocks
        if (block[blockType]?.children) {
          (newBlock as any)[blockType].children = processBlocks(block[blockType].children);
        }

        processedBlocks.push(newBlock);
      }
    } else if (blockType === "toggle" && block.toggle?.children) {
      // Recursively process children of toggle blocks
      const processedChildren = processBlocks(block.toggle.children);
      processedBlocks.push({
        ...block,
        toggle: {
          ...block.toggle,
          children: processedChildren,
        },
      });
    } else {
      // Keep other block types as-is
      processedBlocks.push(block);
    }
  }

  return processedBlocks;
}

// ============================================================================
// Custom Markdown Parser (replaces @tryfabric/martian)
// ============================================================================

interface RichTextItem {
  type: 'text' | 'mention';
  text?: { content: string; link?: { url: string } };
  mention?: { type: 'page'; page: { id: string } };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text?: string;
}

const defaultAnnotations = {
  bold: false,
  italic: false,
  strikethrough: false,
  underline: false,
  code: false,
  color: 'default' as const,
};

/**
 * Parse inline formatting (bold, italic, code, links, mentions) into rich_text array
 */
function parseInlineFormatting(text: string): RichTextItem[] {
  const richText: RichTextItem[] = [];

  // Regex patterns for inline formatting
  // Order matters: more specific patterns first
  const patterns = [
    // Page mentions: @[text](uuid)
    { regex: /@\[([^\]]+)\]\(([a-f0-9-]{32,36})\)/g, type: 'mention' as const },
    // Links: [text](url)
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' as const },
    // Bold+Italic: ***text*** or ___text___
    { regex: /(\*\*\*|___)(.+?)\1/g, type: 'bold_italic' as const },
    // Bold: **text** or __text__
    { regex: /(\*\*|__)(.+?)\1/g, type: 'bold' as const },
    // Italic: *text* or _text_ (but not inside words for _)
    { regex: /(\*|(?<!\w)_)(.+?)\1(?!\w)/g, type: 'italic' as const },
    // Strikethrough: ~~text~~
    { regex: /~~(.+?)~~/g, type: 'strikethrough' as const },
    // Inline code: `text`
    { regex: /`([^`]+)`/g, type: 'code' as const },
  ];

  // Find all matches with their positions
  interface Match {
    start: number;
    end: number;
    type: string;
    fullMatch: string;
    groups: string[];
  }

  const matches: Match[] = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Check if this position is already covered by an earlier match
      const overlaps = matches.some(m =>
        (match!.index >= m.start && match!.index < m.end) ||
        (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
      );
      if (!overlaps) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: pattern.type,
          fullMatch: match[0],
          groups: match.slice(1),
        });
      }
    }
  }

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Build rich_text array
  let lastEnd = 0;

  for (const match of matches) {
    // Add plain text before this match
    if (match.start > lastEnd) {
      const plainText = text.slice(lastEnd, match.start);
      if (plainText) {
        richText.push({
          type: 'text',
          text: { content: plainText },
          annotations: { ...defaultAnnotations },
        });
      }
    }

    // Add the formatted content
    switch (match.type) {
      case 'mention': {
        const [mentionText, pageId] = match.groups;
        richText.push({
          type: 'mention',
          mention: { type: 'page', page: { id: pageId } },
          annotations: { ...defaultAnnotations },
          plain_text: mentionText,
        });
        break;
      }
      case 'link': {
        const [linkText, url] = match.groups;
        richText.push({
          type: 'text',
          text: { content: linkText, link: { url } },
          annotations: { ...defaultAnnotations },
        });
        break;
      }
      case 'bold_italic': {
        const content = match.groups[1];
        richText.push({
          type: 'text',
          text: { content },
          annotations: { ...defaultAnnotations, bold: true, italic: true },
        });
        break;
      }
      case 'bold': {
        const content = match.groups[1];
        richText.push({
          type: 'text',
          text: { content },
          annotations: { ...defaultAnnotations, bold: true },
        });
        break;
      }
      case 'italic': {
        const content = match.groups[1];
        richText.push({
          type: 'text',
          text: { content },
          annotations: { ...defaultAnnotations, italic: true },
        });
        break;
      }
      case 'strikethrough': {
        const content = match.groups[0];
        richText.push({
          type: 'text',
          text: { content },
          annotations: { ...defaultAnnotations, strikethrough: true },
        });
        break;
      }
      case 'code': {
        const content = match.groups[0];
        richText.push({
          type: 'text',
          text: { content },
          annotations: { ...defaultAnnotations, code: true },
        });
        break;
      }
    }

    lastEnd = match.end;
  }

  // Add remaining plain text
  if (lastEnd < text.length) {
    const plainText = text.slice(lastEnd);
    if (plainText) {
      richText.push({
        type: 'text',
        text: { content: plainText },
        annotations: { ...defaultAnnotations },
      });
    }
  }

  // If no formatting found, return the whole text as plain
  if (richText.length === 0 && text) {
    richText.push({
      type: 'text',
      text: { content: text },
      annotations: { ...defaultAnnotations },
    });
  }

  return richText;
}

/**
 * Create a Notion block with the given type and rich_text
 */
function createBlock(type: string, richText: RichTextItem[], extras: Record<string, any> = {}): any {
  return {
    object: 'block',
    type,
    [type]: {
      rich_text: richText,
      ...extras,
    },
  };
}

/**
 * Check if a string starts with an emoji
 */
function startsWithEmoji(str: string): { emoji: string; rest: string } | null {
  // Common emoji patterns - check first few characters
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/u;
  const match = str.match(emojiRegex);
  if (match) {
    return { emoji: match[0], rest: str.slice(match[0].length).trim() };
  }
  return null;
}

/**
 * Map Obsidian callout types to Notion callout colors
 */
function getCalloutColor(type: string): string {
  const colorMap: Record<string, string> = {
    'info': 'blue_background',
    'note': 'blue_background',
    'tip': 'green_background',
    'hint': 'green_background',
    'important': 'purple_background',
    'warning': 'yellow_background',
    'caution': 'yellow_background',
    'danger': 'red_background',
    'error': 'red_background',
    'bug': 'red_background',
    'example': 'gray_background',
    'quote': 'gray_background',
    'success': 'green_background',
    'question': 'yellow_background',
    'faq': 'yellow_background',
    'abstract': 'blue_background',
    'summary': 'blue_background',
    'tldr': 'blue_background',
    'todo': 'purple_background',
    'failure': 'red_background',
    'fail': 'red_background',
    'missing': 'red_background',
  };
  return colorMap[type.toLowerCase()] || 'gray_background';
}

/**
 * Get default emoji for Obsidian callout types
 */
function getCalloutEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    'info': 'ℹ️',
    'note': '📝',
    'tip': '💡',
    'hint': '💡',
    'important': '❗',
    'warning': '⚠️',
    'caution': '⚠️',
    'danger': '🔴',
    'error': '❌',
    'bug': '🐛',
    'example': '📋',
    'quote': '💬',
    'success': '✅',
    'question': '❓',
    'faq': '❓',
    'abstract': '📄',
    'summary': '📄',
    'tldr': '📄',
    'todo': '☑️',
    'failure': '❌',
    'fail': '❌',
    'missing': '❌',
  };
  return emojiMap[type.toLowerCase()] || 'ℹ️';
}

/**
 * Parse a single line to determine its block type and content
 */
function parseLine(line: string): { type: string; content: string; extras?: Record<string, any> } | null {
  // Heading 3: ### text
  if (line.startsWith('### ')) {
    return { type: 'heading_3', content: line.slice(4) };
  }

  // Heading 2: ## text
  if (line.startsWith('## ')) {
    return { type: 'heading_2', content: line.slice(3) };
  }

  // Heading 1: # text
  if (line.startsWith('# ')) {
    return { type: 'heading_1', content: line.slice(2) };
  }

  // Divider: --- or *** or ___
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
    return { type: 'divider', content: '' };
  }

  // To-do item: - [ ] or - [x]
  const todoMatch = line.match(/^(\s*)- \[([ xX])\] (.*)$/);
  if (todoMatch) {
    const [, indent, checked, content] = todoMatch;
    return {
      type: 'to_do',
      content,
      extras: {
        checked: checked.toLowerCase() === 'x',
        indent: Math.floor(indent.length / 2),
      }
    };
  }

  // Bulleted list: - text or * text (with optional indentation)
  const bulletMatch = line.match(/^(\s*)[-*] (.*)$/);
  if (bulletMatch) {
    const [, indent, content] = bulletMatch;
    return {
      type: 'bulleted_list_item',
      content,
      extras: { indent: Math.floor(indent.length / 2) },
    };
  }

  // Numbered list: 1. text (with optional indentation)
  const numberedMatch = line.match(/^(\s*)\d+\. (.*)$/);
  if (numberedMatch) {
    const [, indent, content] = numberedMatch;
    return {
      type: 'numbered_list_item',
      content,
      extras: { indent: Math.floor(indent.length / 2) },
    };
  }

  // Empty line
  if (line.trim() === '') {
    return null;
  }

  // Default: paragraph
  return { type: 'paragraph', content: line };
}

/**
 * Parse a table from markdown lines
 */
function parseTable(lines: string[], startIndex: number): { block: any; endIndex: number } | null {
  const tableRows: string[][] = [];
  let i = startIndex;

  // Parse rows until we hit a non-table line
  while (i < lines.length) {
    const line = lines[i].trim();

    // Check if it's a table row
    if (!line.startsWith('|') || !line.endsWith('|')) {
      break;
    }

    // Skip separator row (| --- | --- |)
    if (/^\|[\s-:|]+\|$/.test(line)) {
      i++;
      continue;
    }

    // Parse cells
    const cells = line
      .slice(1, -1) // Remove leading and trailing |
      .split('|')
      .map(cell => cell.trim());

    tableRows.push(cells);
    i++;
  }

  if (tableRows.length === 0) {
    return null;
  }

  // Create table block
  const tableWidth = Math.max(...tableRows.map(row => row.length));
  const children = tableRows.map(row => ({
    object: 'block',
    type: 'table_row',
    table_row: {
      cells: row.map(cell => parseInlineFormatting(cell)),
    },
  }));

  // Pad rows to have consistent width
  for (const child of children) {
    while (child.table_row.cells.length < tableWidth) {
      child.table_row.cells.push([{ type: 'text', text: { content: '' }, annotations: { ...defaultAnnotations } }]);
    }
  }

  const block = {
    object: 'block',
    type: 'table',
    table: {
      table_width: tableWidth,
      has_column_header: true,
      has_row_header: false,
      children,
    },
  };

  return { block, endIndex: i - 1 };
}

/**
 * Parse a toggle block from <details> HTML
 */
function parseToggle(lines: string[], startIndex: number): { block: any; endIndex: number } | null {
  let i = startIndex;
  const line = lines[i].trim();

  // Check for <details> start
  if (!line.startsWith('<details')) {
    return null;
  }

  let summaryText = '';
  const contentLines: string[] = [];
  let foundSummary = false;
  let foundEnd = false;

  i++;

  while (i < lines.length) {
    const currentLine = lines[i];
    const trimmed = currentLine.trim();

    // Check for </details>
    if (trimmed === '</details>' || trimmed.includes('</details>')) {
      foundEnd = true;
      break;
    }

    // Check for <summary>
    const summaryMatch = trimmed.match(/<summary>(.*?)<\/summary>/);
    if (summaryMatch) {
      summaryText = summaryMatch[1];
      foundSummary = true;
      i++;
      continue;
    }

    // Standalone <summary> tag
    if (trimmed === '<summary>') {
      foundSummary = true;
      i++;
      // Next line should be the summary content
      if (i < lines.length && !lines[i].trim().startsWith('</summary>')) {
        summaryText = lines[i].trim();
        i++;
        // Skip closing </summary>
        if (i < lines.length && lines[i].trim() === '</summary>') {
          i++;
        }
      }
      continue;
    }

    // Accumulate content
    if (foundSummary) {
      contentLines.push(currentLine);
    }

    i++;
  }

  if (!foundSummary) {
    return null;
  }

  // Parse content as nested blocks
  const childBlocks = contentLines.length > 0
    ? parseMarkdownToBlocks(contentLines.join('\n'))
    : [];

  const block = {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: parseInlineFormatting(summaryText),
      children: childBlocks,
    },
  };

  return { block, endIndex: foundEnd ? i : i - 1 };
}

/**
 * Parse a callout or blockquote from > prefixed lines
 */
function parseBlockquoteOrCallout(lines: string[], startIndex: number): { block: any; endIndex: number } {
  const quotedLines: string[] = [];
  let i = startIndex;

  // Collect all consecutive > lines
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('> ')) {
      quotedLines.push(line.slice(2));
      i++;
    } else if (line === '>') {
      quotedLines.push('');
      i++;
    } else {
      break;
    }
  }

  const firstLine = quotedLines[0] || '';

  // Check for Obsidian-style callout: [!type] Title
  const obsidianMatch = firstLine.match(/^\[!(\w+)\]\s*(.*)$/);
  if (obsidianMatch) {
    const [, type, title] = obsidianMatch;
    const emoji = getCalloutEmoji(type);
    const color = getCalloutColor(type);

    // Combine title with rest of content
    const contentParts: string[] = [];
    if (title) contentParts.push(title);
    contentParts.push(...quotedLines.slice(1).filter(l => l.trim() !== ''));

    const block = {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: parseInlineFormatting(contentParts.join('\n')),
        icon: { type: 'emoji', emoji },
        color,
      },
    };

    return { block, endIndex: i - 1 };
  }

  // Check for emoji-style callout: 👍 Title
  const emojiCheck = startsWithEmoji(firstLine);
  if (emojiCheck) {
    // This is a callout with emoji
    const contentParts: string[] = [];
    if (emojiCheck.rest) contentParts.push(emojiCheck.rest);
    contentParts.push(...quotedLines.slice(1).filter(l => l.trim() !== ''));

    const block = {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: parseInlineFormatting(contentParts.join('\n')),
        icon: { type: 'emoji', emoji: emojiCheck.emoji },
        color: 'gray_background',
      },
    };

    return { block, endIndex: i - 1 };
  }

  // Regular blockquote
  const block = {
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: parseInlineFormatting(quotedLines.join('\n')),
    },
  };

  return { block, endIndex: i - 1 };
}

/**
 * Convert markdown string to Notion blocks
 *
 * Supports:
 * - Headings (# ## ###)
 * - Bulleted lists (-) with nesting
 * - Numbered lists (1.) with nesting
 * - To-do items (- [ ] and - [x])
 * - Bold (**text**), Italic (*text*), Strikethrough (~~text~~)
 * - Inline code (`text`)
 * - Code blocks (```)
 * - Links [text](url)
 * - Page mentions @[text](page-id)
 * - Blockquotes (>) and Callouts (> 👍 or > [!info])
 * - Dividers (---)
 * - Tables (| col | col |)
 * - Toggle blocks (<details>)
 * - Images (![alt](url))
 */
function parseMarkdownToBlocks(markdown: string): any[] {
  const lines = markdown.split('\n');
  const blocks: any[] = [];

  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent: string[] = [];

  // Track list item stacks for nesting
  let listStack: { type: string; block: any; indent: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code block start/end
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Start code block
        inCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim() || 'plain text';
        codeBlockContent = [];
        listStack = [];
        continue;
      } else {
        // End code block
        inCodeBlock = false;
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            rich_text: [{
              type: 'text',
              text: { content: codeBlockContent.join('\n') },
              annotations: { ...defaultAnnotations },
            }],
            language: codeBlockLanguage,
          },
        });
        listStack = [];
        continue;
      }
    }

    // Inside code block - accumulate content
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Check for <details> toggle block
    if (line.trim().startsWith('<details')) {
      const toggleResult = parseToggle(lines, i);
      if (toggleResult) {
        blocks.push(toggleResult.block);
        i = toggleResult.endIndex;
        listStack = [];
        continue;
      }
    }

    // Check for table (line starts and ends with |)
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      const tableResult = parseTable(lines, i);
      if (tableResult) {
        blocks.push(tableResult.block);
        i = tableResult.endIndex;
        listStack = [];
        continue;
      }
    }

    // Check for blockquote/callout (> prefix)
    if (line.startsWith('> ') || line === '>') {
      const quoteResult = parseBlockquoteOrCallout(lines, i);
      blocks.push(quoteResult.block);
      i = quoteResult.endIndex;
      listStack = [];
      continue;
    }

    // Check for standalone image: ![alt](url) or ![alt](url "title")
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (imageMatch) {
      const [, alt, url] = imageMatch;
      blocks.push({
        object: 'block',
        type: 'image',
        image: {
          type: 'external',
          external: { url },
          caption: alt ? parseInlineFormatting(alt) : [],
        },
      });
      listStack = [];
      continue;
    }

    const parsed = parseLine(line);

    if (!parsed) {
      // Empty line - clear list stack
      listStack = [];
      continue;
    }

    const { type, content, extras } = parsed;

    // Handle list items with nesting
    if (type === 'bulleted_list_item' || type === 'numbered_list_item' || type === 'to_do') {
      const indent = extras?.indent || 0;
      const richText = parseInlineFormatting(content);

      const blockExtras: Record<string, any> = {};
      if (type === 'to_do') {
        blockExtras.checked = extras?.checked || false;
      }

      const newBlock = createBlock(type, richText, blockExtras);

      if (indent === 0) {
        // Top-level list item
        blocks.push(newBlock);
        listStack = [{ type, block: newBlock, indent: 0 }];
      } else {
        // Nested list item - find parent
        while (listStack.length > 0 && listStack[listStack.length - 1].indent >= indent) {
          listStack.pop();
        }

        if (listStack.length > 0) {
          const parent = listStack[listStack.length - 1].block;
          const parentType = parent.type;
          if (!parent[parentType].children) {
            parent[parentType].children = [];
          }
          parent[parentType].children.push(newBlock);
          listStack.push({ type, block: newBlock, indent });
        } else {
          // No valid parent found, add as top-level
          blocks.push(newBlock);
          listStack = [{ type, block: newBlock, indent: 0 }];
        }
      }
      continue;
    }

    // Non-list items clear the list stack
    listStack = [];

    // Handle other block types
    switch (type) {
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
      case 'paragraph': {
        const richText = parseInlineFormatting(content);
        blocks.push(createBlock(type, richText));
        break;
      }

      case 'divider':
        blocks.push({
          object: 'block',
          type: 'divider',
          divider: {},
        });
        break;
    }
  }

  // Handle unclosed code block
  if (inCodeBlock && codeBlockContent.length > 0) {
    blocks.push({
      object: 'block',
      type: 'code',
      code: {
        rich_text: [{
          type: 'text',
          text: { content: codeBlockContent.join('\n') },
          annotations: { ...defaultAnnotations },
        }],
        language: codeBlockLanguage,
      },
    });
  }

  return blocks;
}

/**
 * Convert markdown to Notion blocks with support for @[text](page-id) page mentions
 *
 * Usage:
 *   markdownToNotionBlocks("Check out @[My Task](abc123-def456-ghi789) for details")
 *
 * The @[text](page-id) syntax creates a page mention that links to the Notion page
 */
export function markdownToNotionBlocks(markdown: string): any[] {
  // Parse markdown directly to Notion blocks (mentions are handled inline)
  const rawBlocks = parseMarkdownToBlocks(markdown);

  // Process blocks for character limits
  const processedBlocks = processBlocks(rawBlocks);

  return processedBlocks;
}

/**
 * Convert rich_text array to markdown string
 */
function richTextToMarkdown(richText: any[]): string {
  return richText.map(item => {
    let text = '';

    if (item.type === 'text') {
      text = item.text?.content || '';
    } else if (item.type === 'mention') {
      if (item.mention?.type === 'page') {
        // Convert page mention to @[text](page-id) syntax
        const pageId = item.mention.page?.id || '';
        const plainText = item.plain_text || 'page';
        text = `@[${plainText}](${pageId})`;
      } else if (item.mention?.type === 'user') {
        text = `@${item.plain_text || 'user'}`;
      } else if (item.mention?.type === 'date') {
        text = item.mention.date?.start || '';
      } else if (item.mention?.type === 'database') {
        const dbId = item.mention.database?.id || '';
        const plainText = item.plain_text || 'database';
        text = `@[${plainText}](${dbId})`;
      } else {
        text = item.plain_text || '';
      }
    } else if (item.type === 'equation') {
      text = `$${item.equation?.expression || ''}$`;
    } else {
      text = item.plain_text || '';
    }

    // Apply annotations
    const annotations = item.annotations || {};
    if (annotations.bold) text = `**${text}**`;
    if (annotations.italic) text = `*${text}*`;
    if (annotations.strikethrough) text = `~~${text}~~`;
    if (annotations.code) text = `\`${text}\``;

    // Handle links
    if (item.text?.link?.url) {
      text = `[${text}](${item.text.link.url})`;
    }

    return text;
  }).join('');
}

/**
 * Convert a single Notion block to markdown
 */
function blockToMarkdown(block: any, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);
  const blockType = block.type;

  switch (blockType) {
    case 'paragraph':
      return indentStr + richTextToMarkdown(block.paragraph?.rich_text || []);

    case 'heading_1':
      return `# ${richTextToMarkdown(block.heading_1?.rich_text || [])}`;

    case 'heading_2':
      return `## ${richTextToMarkdown(block.heading_2?.rich_text || [])}`;

    case 'heading_3':
      return `### ${richTextToMarkdown(block.heading_3?.rich_text || [])}`;

    case 'bulleted_list_item': {
      const text = richTextToMarkdown(block.bulleted_list_item?.rich_text || []);
      let result = `${indentStr}- ${text}`;

      // Handle nested children
      if (block.bulleted_list_item?.children) {
        const childrenMd = block.bulleted_list_item.children
          .map((child: any) => blockToMarkdown(child, indent + 1))
          .join('\n');
        result += '\n' + childrenMd;
      }
      return result;
    }

    case 'numbered_list_item': {
      const text = richTextToMarkdown(block.numbered_list_item?.rich_text || []);
      let result = `${indentStr}1. ${text}`;

      // Handle nested children
      if (block.numbered_list_item?.children) {
        const childrenMd = block.numbered_list_item.children
          .map((child: any) => blockToMarkdown(child, indent + 1))
          .join('\n');
        result += '\n' + childrenMd;
      }
      return result;
    }

    case 'to_do': {
      const checked = block.to_do?.checked ? 'x' : ' ';
      const text = richTextToMarkdown(block.to_do?.rich_text || []);
      return `${indentStr}- [${checked}] ${text}`;
    }

    case 'toggle': {
      const text = richTextToMarkdown(block.toggle?.rich_text || []);
      let result = `${indentStr}<details>\n${indentStr}<summary>${text}</summary>\n`;

      if (block.toggle?.children) {
        const childrenMd = block.toggle.children
          .map((child: any) => blockToMarkdown(child, indent))
          .join('\n');
        result += childrenMd + '\n';
      }
      result += `${indentStr}</details>`;
      return result;
    }

    case 'quote':
      return block.quote?.rich_text?.map((rt: any) =>
        `> ${richTextToMarkdown([rt])}`
      ).join('\n') || '';

    case 'callout': {
      const icon = block.callout?.icon?.emoji || 'ℹ️';
      const text = richTextToMarkdown(block.callout?.rich_text || []);
      return `> ${icon} ${text}`;
    }

    case 'code': {
      const language = block.code?.language || '';
      const code = richTextToMarkdown(block.code?.rich_text || []);
      return '```' + language + '\n' + code + '\n```';
    }

    case 'divider':
      return '---';

    case 'image': {
      const url = block.image?.file?.url || block.image?.external?.url || '';
      const caption = block.image?.caption?.length > 0
        ? richTextToMarkdown(block.image.caption)
        : 'image';
      return `![${caption}](${url})`;
    }

    case 'bookmark':
      return `[${block.bookmark?.url || ''}](${block.bookmark?.url || ''})`;

    case 'link_preview':
      return `[${block.link_preview?.url || ''}](${block.link_preview?.url || ''})`;

    case 'embed':
      return `[Embed](${block.embed?.url || ''})`;

    case 'video': {
      const url = block.video?.file?.url || block.video?.external?.url || '';
      return `[Video](${url})`;
    }

    case 'file': {
      const url = block.file?.file?.url || block.file?.external?.url || '';
      const name = block.file?.name || 'file';
      return `[${name}](${url})`;
    }

    case 'pdf': {
      const url = block.pdf?.file?.url || block.pdf?.external?.url || '';
      return `[PDF](${url})`;
    }

    case 'table_of_contents':
      return '[TOC]';

    case 'breadcrumb':
      return ''; // No markdown equivalent

    case 'equation':
      return `$$${block.equation?.expression || ''}$$`;

    case 'column_list':
      // Columns don't have a good markdown equivalent, just render children
      return (block.column_list?.children || [])
        .map((child: any) => blockToMarkdown(child, indent))
        .join('\n\n');

    case 'column':
      return (block.column?.children || [])
        .map((child: any) => blockToMarkdown(child, indent))
        .join('\n');

    case 'synced_block':
      return (block.synced_block?.children || [])
        .map((child: any) => blockToMarkdown(child, indent))
        .join('\n');

    case 'template':
      return (block.template?.children || [])
        .map((child: any) => blockToMarkdown(child, indent))
        .join('\n');

    case 'link_to_page': {
      const pageId = block.link_to_page?.page_id || block.link_to_page?.database_id || '';
      return `@[page](${pageId})`;
    }

    case 'table': {
      // Basic table support
      const rows: string[] = [];
      if (block.table?.children) {
        block.table.children.forEach((row: any, rowIndex: number) => {
          if (row.type === 'table_row') {
            const cells = row.table_row?.cells || [];
            const rowText = cells.map((cell: any) => richTextToMarkdown(cell)).join(' | ');
            rows.push(`| ${rowText} |`);

            // Add header separator after first row
            if (rowIndex === 0) {
              const separator = cells.map(() => '---').join(' | ');
              rows.push(`| ${separator} |`);
            }
          }
        });
      }
      return rows.join('\n');
    }

    case 'child_page':
      return `[${block.child_page?.title || 'Untitled'}]`;

    case 'child_database':
      return `[Database: ${block.child_database?.title || 'Untitled'}]`;

    default:
      return '';
  }
}

/**
 * Convert Notion blocks to markdown with support for all block types
 * Page mentions are converted to @[text](page-id) syntax
 *
 * Usage:
 *   const markdown = notionBlocksToMarkdown(blocks);
 */
export function notionBlocksToMarkdown(blocks: any[]): string {
  const lines: string[] = [];
  let prevBlockType = '';

  for (const block of blocks) {
    const markdown = blockToMarkdown(block);

    if (markdown === '') continue;

    // Add extra newline between different block types for readability
    const currentType = block.type;
    if (prevBlockType &&
        !['bulleted_list_item', 'numbered_list_item'].includes(prevBlockType) &&
        !['bulleted_list_item', 'numbered_list_item'].includes(currentType)) {
      lines.push('');
    }

    lines.push(markdown);
    prevBlockType = currentType;
  }

  return lines.join('\n');
}

/**
 * Recursively fetch children for blocks that have them
 */
async function fetchBlockChildren(blocks: any[]): Promise<any[]> {
  const result: any[] = [];

  for (const block of blocks) {
    const newBlock = { ...block };

    // Check if block has children
    if (block.has_children) {
      try {
        const childrenResponse = await notion.blocks.children.list({
          block_id: block.id,
        });

        // Recursively fetch children of children
        const childBlocks = await fetchBlockChildren(childrenResponse.results as any[]);

        // Store children in the appropriate location based on block type
        const blockType = block.type;
        if (newBlock[blockType]) {
          newBlock[blockType] = {
            ...newBlock[blockType],
            children: childBlocks,
          };
        } else {
          newBlock.children = childBlocks;
        }
      } catch (error) {
        console.error(`Error fetching children for block ${block.id}:`, error);
      }
    }

    result.push(newBlock);
  }

  return result;
}

/**
 * Search for pages and databases
 */
async function search(query: string) {
  try {
    const response = await notion.search({
      query,
      filter: {
        property: "object",
        value: "page",
      },
    });

    const results = response.results.map((page: any) => ({
      id: page.id,
      title: page.properties?.title?.title?.[0]?.plain_text ||
             page.properties?.Name?.title?.[0]?.plain_text ||
             "Untitled",
      url: page.url,
      type: page.object,
      last_edited: page.last_edited_time,
    }));

    return {
      success: true,
      results,
      count: results.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get page content
 */
async function getPage(pageId: string) {
  try {
    // Get page properties
    const page = await notion.pages.retrieve({ page_id: pageId });

    // Get page blocks (content)
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });

    return {
      success: true,
      page: {
        id: page.id,
        url: (page as any).url,
        properties: (page as any).properties,
        created_time: (page as any).created_time,
        last_edited_time: (page as any).last_edited_time,
      },
      blocks: blocks.results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Query database
 */
async function queryDatabase(databaseId: string) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    const results = response.results.map((page: any) => ({
      id: page.id,
      properties: page.properties,
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
    }));

    return {
      success: true,
      results,
      count: results.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Query database with filter
 *
 * Filter format follows Notion API filter syntax:
 * https://developers.notion.com/reference/post-database-query-filter
 *
 * Example filter JSON:
 * {
 *   "property": "Priority",
 *   "select": { "equals": "Today" }
 * }
 *
 * Compound filter example:
 * {
 *   "and": [
 *     { "property": "Priority", "select": { "equals": "Today" } },
 *     { "property": "Status", "status": { "does_not_equal": "Completed" } }
 *   ]
 * }
 */
async function queryDatabaseFiltered(databaseId: string, filterJson: string) {
  try {
    const filter = JSON.parse(filterJson);

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: filter,
    });

    const results = response.results.map((page: any) => ({
      id: page.id,
      properties: page.properties,
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
    }));

    return {
      success: true,
      results,
      count: results.length,
      filter: filter,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a new page (child of another page)
 */
async function createPage(parentId: string, title: string, content: string) {
  try {
    // Convert markdown to Notion blocks (supports @[text](page-id) mentions)
    const allBlocks = markdownToNotionBlocks(content);

    // Notion API allows max 100 blocks per request
    const maxBlocksPerRequest = 100;
    const initialBlocks = allBlocks.slice(0, maxBlocksPerRequest);
    const remainingBlocks = allBlocks.slice(maxBlocksPerRequest);

    // Create page with first 100 blocks
    const response = await notion.pages.create({
      parent: { page_id: parentId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: initialBlocks as any,
    });

    // Append remaining blocks in batches of 100
    if (remainingBlocks.length > 0) {
      for (let i = 0; i < remainingBlocks.length; i += maxBlocksPerRequest) {
        const batch = remainingBlocks.slice(i, i + maxBlocksPerRequest);
        await notion.blocks.children.append({
          block_id: response.id,
          children: batch as any,
        });
      }
    }

    return {
      success: true,
      page: {
        id: response.id,
        url: (response as any).url,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a new page in a database
 */
async function createDatabasePage(databaseId: string, title: string, content: string) {
  try {
    // Convert markdown to Notion blocks (supports @[text](page-id) mentions)
    const allBlocks = markdownToNotionBlocks(content);

    // Notion API allows max 100 blocks per request
    const maxBlocksPerRequest = 100;
    const initialBlocks = allBlocks.slice(0, maxBlocksPerRequest);
    const remainingBlocks = allBlocks.slice(maxBlocksPerRequest);

    // Create page with first 100 blocks
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: initialBlocks as any,
    });

    // Append remaining blocks in batches of 100
    if (remainingBlocks.length > 0) {
      for (let i = 0; i < remainingBlocks.length; i += maxBlocksPerRequest) {
        const batch = remainingBlocks.slice(i, i + maxBlocksPerRequest);
        await notion.blocks.children.append({
          block_id: response.id,
          children: batch as any,
        });
      }
    }

    return {
      success: true,
      page: {
        id: response.id,
        url: (response as any).url,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update a page by appending content
 */
async function updatePage(pageId: string, content: string) {
  try {
    // Convert markdown to Notion blocks (supports @[text](page-id) mentions)
    const allBlocks = markdownToNotionBlocks(content);

    // Notion API allows max 100 blocks per request
    const maxBlocksPerRequest = 100;

    // Append blocks in batches of 100
    for (let i = 0; i < allBlocks.length; i += maxBlocksPerRequest) {
      const batch = allBlocks.slice(i, i + maxBlocksPerRequest);
      await notion.blocks.children.append({
        block_id: pageId,
        children: batch as any,
      });
    }

    return {
      success: true,
      page: {
        id: pageId,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Add comment to page
 */
async function addComment(pageId: string, text: string) {
  try {
    const response = await notion.comments.create({
      parent: { page_id: pageId },
      rich_text: [
        {
          text: {
            content: text,
          },
        },
      ],
    });

    return {
      success: true,
      comment: {
        id: response.id,
        created_time: (response as any).created_time,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get comments from a page
 */
async function getComments(pageId: string) {
  try {
    const response = await notion.comments.list({
      block_id: pageId,
    });

    const comments = response.results.map((comment: any) => ({
      id: comment.id,
      created_time: comment.created_time,
      created_by: comment.created_by,
      rich_text: comment.rich_text,
      plain_text: comment.rich_text?.map((rt: any) => rt.plain_text).join('') || '',
    }));

    return {
      success: true,
      comments,
      count: comments.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all databases in the workspace
 */
async function listDatabases() {
  try {
    const response = await notion.search({
      filter: {
        property: "object",
        value: "database",
      },
      page_size: 100,
    });

    const databases = response.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || "Untitled",
      url: db.url,
      created_time: db.created_time,
      last_edited_time: db.last_edited_time,
    }));

    return {
      success: true,
      databases,
      count: databases.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get database schema (properties and their types)
 */
async function getDatabaseSchema(databaseId: string) {
  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    const properties = Object.entries((database as any).properties).map(
      ([name, prop]: [string, any]) => ({
        name,
        id: prop.id,
        type: prop.type,
        config: prop[prop.type] || {},
      })
    );

    return {
      success: true,
      database: {
        id: database.id,
        title: (database as any).title?.[0]?.plain_text || "Untitled",
        url: (database as any).url,
        created_time: (database as any).created_time,
        last_edited_time: (database as any).last_edited_time,
        properties,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update page properties
 */
async function updatePageProperties(pageId: string, propertiesJson: string) {
  try {
    const properties = JSON.parse(propertiesJson);

    const response = await notion.pages.update({
      page_id: pageId,
      properties: properties,
    });

    return {
      success: true,
      page: {
        id: response.id,
        url: (response as any).url,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Scan all databases and save schemas to files
 */
async function scanDatabases() {
  try {
    // Ensure schemas directory exists
    const schemasDir = ".claude/skills/notion/schemas";
    try {
      await Deno.mkdir(schemasDir, { recursive: true });
    } catch {
      // Directory already exists
    }

    // Get all databases
    const dbListResult = await listDatabases();
    if (!dbListResult.success) {
      return dbListResult;
    }

    const schemas: Record<string, any> = {};

    // For each database, get schema
    for (const db of dbListResult.databases || []) {
      console.error(`Scanning database: ${db.title} (${db.id})`);

      const schemaResult = await getDatabaseSchema(db.id);
      if (schemaResult.success) {
        schemas[db.id] = schemaResult.database;

        // Save to file (use database title as filename, sanitized)
        const sanitizedTitle = db.title
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();
        const schemaPath = `${schemasDir}/${sanitizedTitle}_${db.id.substring(0, 8)}.json`;

        await Deno.writeTextFile(
          schemaPath,
          JSON.stringify(schemaResult.database, null, 2)
        );
        console.error(`Saved schema to: ${schemaPath}`);
      }
    }

    return {
      success: true,
      databasesScanned: dbListResult.databases?.length || 0,
      schemas,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.error("Usage: notion-client.ts <command> [args...]");
    console.error("\nCommands:");
    console.error("  search <query>");
    console.error("  get-page <page-id>");
    console.error("  query-database <database-id>");
    console.error("  query-database-filtered <database-id> <filter-json>");
    console.error("  create-page <parent-id> <title> <content>");
    console.error("  create-database-page <database-id> <title> <content>");
    console.error("  update-page <page-id> <content>");
    console.error("  update-page-properties <page-id> <properties-json>");
    console.error("  add-comment <page-id> <text>");
    console.error("  get-comments <page-id>");
    console.error("  list-databases");
    console.error("  get-database-schema <database-id>");
    console.error("  scan-databases");
    console.error("  md-to-notion <markdown>");
    console.error("  notion-to-md <page-id>");
    Deno.exit(1);
  }

  const command = args[0];
  let result;

  switch (command) {
    case "search":
      if (args.length < 2) {
        console.error("Error: search requires a query");
        Deno.exit(1);
      }
      result = await search(args.slice(1).join(" "));
      break;

    case "get-page":
      if (args.length < 2) {
        console.error("Error: get-page requires a page ID");
        Deno.exit(1);
      }
      result = await getPage(args[1]);
      break;

    case "query-database":
      if (args.length < 2) {
        console.error("Error: query-database requires a database ID");
        Deno.exit(1);
      }
      result = await queryDatabase(args[1]);
      break;

    case "query-database-filtered":
      if (args.length < 3) {
        console.error("Error: query-database-filtered requires a database ID and filter JSON");
        Deno.exit(1);
      }
      result = await queryDatabaseFiltered(args[1], args.slice(2).join(" "));
      break;

    case "create-page":
      if (args.length < 4) {
        console.error("Error: create-page requires parent-id, title, and content");
        Deno.exit(1);
      }
      result = await createPage(args[1], args[2], args.slice(3).join(" "));
      break;

    case "create-database-page":
      if (args.length < 4) {
        console.error("Error: create-database-page requires database-id, title, and content");
        Deno.exit(1);
      }
      result = await createDatabasePage(args[1], args[2], args.slice(3).join(" "));
      break;

    case "update-page":
      if (args.length < 3) {
        console.error("Error: update-page requires page-id and content");
        Deno.exit(1);
      }
      result = await updatePage(args[1], args.slice(2).join(" "));
      break;

    case "update-page-properties":
      if (args.length < 3) {
        console.error("Error: update-page-properties requires page-id and properties-json");
        Deno.exit(1);
      }
      result = await updatePageProperties(args[1], args.slice(2).join(" "));
      break;

    case "add-comment":
      if (args.length < 3) {
        console.error("Error: add-comment requires page-id and text");
        Deno.exit(1);
      }
      result = await addComment(args[1], args.slice(2).join(" "));
      break;

    case "get-comments":
      if (args.length < 2) {
        console.error("Error: get-comments requires a page ID");
        Deno.exit(1);
      }
      result = await getComments(args[1]);
      break;

    case "list-databases":
      result = await listDatabases();
      break;

    case "get-database-schema":
      if (args.length < 2) {
        console.error("Error: get-database-schema requires a database ID");
        Deno.exit(1);
      }
      result = await getDatabaseSchema(args[1]);
      break;

    case "scan-databases":
      result = await scanDatabases();
      break;

    case "md-to-notion":
      if (args.length < 2) {
        console.error("Error: md-to-notion requires markdown content");
        Deno.exit(1);
      }
      result = {
        success: true,
        blocks: markdownToNotionBlocks(args.slice(1).join(" ")),
      };
      break;

    case "notion-to-md":
      if (args.length < 2) {
        console.error("Error: notion-to-md requires a page ID");
        Deno.exit(1);
      }
      {
        const pageResult = await getPage(args[1]);
        if (pageResult.success && pageResult.blocks) {
          // Fetch children for blocks that have them
          const blocksWithChildren = await fetchBlockChildren(pageResult.blocks);
          result = {
            success: true,
            markdown: notionBlocksToMarkdown(blocksWithChildren),
          };
        } else {
          result = pageResult;
        }
      }
      break;

    default:
      console.error(`Error: unknown command '${command}'`);
      Deno.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

// Run main if this is the main module
if (import.meta.main) {
  main();
}
