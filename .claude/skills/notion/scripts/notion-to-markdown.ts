/**
 * Notion to Markdown Converter
 *
 * Converts Notion blocks to Markdown/HTML format for Obsidian.
 * Supports all 60+ Notion block types with proper formatting preservation.
 */

import type { Client } from "@notionhq/client";

// Type definitions for Notion blocks
export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

export interface RichTextItem {
  type: string;
  text?: { content: string; link?: { url: string } | null };
  mention?: any;
  equation?: { expression: string };
  plain_text: string;
  href?: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}

/**
 * Convert array of Notion blocks to Markdown
 */
export async function blocksToMarkdown(
  blocks: NotionBlock[],
  notion?: Client,
  indent = 0,
  imageMap?: Map<string, string>
): Promise<string> {
  const results: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const markdown = await blockToMarkdown(block, notion, indent, imageMap);
    if (markdown) {
      results.push(markdown);
    }
  }

  // Join blocks with appropriate spacing
  // Use single newline for consecutive list items, double for others
  const output: string[] = [];
  for (let i = 0; i < results.length; i++) {
    output.push(results[i]);

    if (i < results.length - 1) {
      const currentBlock = blocks[i];
      const nextBlock = blocks[i + 1];

      // Check if both are list items
      const isCurrentList = ['bulleted_list_item', 'numbered_list_item', 'to_do'].includes(currentBlock.type);
      const isNextList = ['bulleted_list_item', 'numbered_list_item', 'to_do'].includes(nextBlock.type);

      // Use single newline for consecutive list items, double for everything else
      output.push(isCurrentList && isNextList ? '\n' : '\n\n');
    }
  }

  return output.join('');
}

/**
 * Convert a single Notion block to Markdown
 */
export async function blockToMarkdown(
  block: NotionBlock,
  notion?: Client,
  indent = 0,
  imageMap?: Map<string, string>
): Promise<string> {
  const indentStr = '    '.repeat(indent);

  switch (block.type) {
    // Text blocks
    case 'paragraph':
      const paragraphText = paragraphToMarkdown(block);

      // Handle nested children in paragraphs
      if (block.paragraph.children && block.paragraph.children.length > 0) {
        // If parent has text, convert to heading and render children normally
        if (paragraphText.trim()) {
          const children = await blocksToMarkdown(block.paragraph.children, notion, indent, imageMap);
          return `${indentStr}### ${paragraphText}\n\n${children}`;
        }
        // If no parent text, just process children normally
        const children = await blocksToMarkdown(block.paragraph.children, notion, indent, imageMap);
        return children;
      } else if (block.has_children && notion) {
        // Fetch children if not included
        try {
          const response = await notion.blocks.children.list({ block_id: block.id });
          const childBlocks = response.results as NotionBlock[];

          // If parent has text, convert to heading and render children normally
          if (paragraphText.trim()) {
            const children = await blocksToMarkdown(childBlocks, notion, indent, imageMap);
            return `${indentStr}### ${paragraphText}\n\n${children}`;
          }
          // If no parent text, just process children normally
          const children = await blocksToMarkdown(childBlocks, notion, indent, imageMap);
          return children;
        } catch (error) {
          console.warn(`Failed to fetch paragraph children for block ${block.id}:`, error);
        }
      }

      // No children, just return the paragraph
      return indentStr + paragraphText;

    case 'heading_1':
      return await headingToMarkdown(block, 1, notion, imageMap);

    case 'heading_2':
      return await headingToMarkdown(block, 2, notion, imageMap);

    case 'heading_3':
      return await headingToMarkdown(block, 3, notion, imageMap);

    case 'quote':
      const quoteText = richTextToMarkdown(block.quote.rich_text);
      return indentStr + quoteText.split('\n').map(line => `> ${line}`).join('\n');

    case 'callout':
      return indentStr + await calloutToMarkdown(block);

    // List blocks
    case 'bulleted_list_item':
      const bulletText = richTextToMarkdown(block.bulleted_list_item.rich_text);
      let bulletResult = indentStr + `- ${bulletText}`;
      // Check for pre-loaded children first
      if (block.bulleted_list_item.children && block.bulleted_list_item.children.length > 0) {
        const children = await blocksToMarkdown(block.bulleted_list_item.children, notion, indent + 1, imageMap);
        if (children) bulletResult += '\n' + children;
      } else if (block.has_children && notion) {
        // Fetch children from API if they exist but weren't pre-loaded
        try {
          const response = await notion.blocks.children.list({ block_id: block.id });
          const childBlocks = response.results as NotionBlock[];
          if (childBlocks.length > 0) {
            const children = await blocksToMarkdown(childBlocks, notion, indent + 1, imageMap);
            if (children) bulletResult += '\n' + children;
          }
        } catch (error) {
          console.warn(`Failed to fetch bullet children for block ${block.id}:`, error);
        }
      }
      return bulletResult;

    case 'numbered_list_item':
      const numberText = richTextToMarkdown(block.numbered_list_item.rich_text);
      let numberResult = indentStr + `1. ${numberText}`;
      // Check for pre-loaded children first
      if (block.numbered_list_item.children && block.numbered_list_item.children.length > 0) {
        const children = await blocksToMarkdown(block.numbered_list_item.children, notion, indent + 1, imageMap);
        if (children) numberResult += '\n' + children;
      } else if (block.has_children && notion) {
        // Fetch children from API if they exist but weren't pre-loaded
        try {
          const response = await notion.blocks.children.list({ block_id: block.id });
          const childBlocks = response.results as NotionBlock[];
          if (childBlocks.length > 0) {
            const children = await blocksToMarkdown(childBlocks, notion, indent + 1, imageMap);
            if (children) numberResult += '\n' + children;
          }
        } catch (error) {
          console.warn(`Failed to fetch numbered list children for block ${block.id}:`, error);
        }
      }
      return numberResult;

    case 'to_do':
      const checked = block.to_do.checked ? 'x' : ' ';
      const todoText = richTextToMarkdown(block.to_do.rich_text);
      let todoResult = indentStr + `- [${checked}] ${todoText}`;
      // Check for pre-loaded children first
      if (block.to_do.children && block.to_do.children.length > 0) {
        const children = await blocksToMarkdown(block.to_do.children, notion, indent + 1, imageMap);
        if (children) todoResult += '\n' + children;
      } else if (block.has_children && notion) {
        // Fetch children from API if they exist but weren't pre-loaded
        try {
          const response = await notion.blocks.children.list({ block_id: block.id });
          const childBlocks = response.results as NotionBlock[];
          if (childBlocks.length > 0) {
            const children = await blocksToMarkdown(childBlocks, notion, indent + 1, imageMap);
            if (children) todoResult += '\n' + children;
          }
        } catch (error) {
          console.warn(`Failed to fetch todo children for block ${block.id}:`, error);
        }
      }
      return todoResult;

    // Code block
    case 'code':
      return codeToMarkdown(block, indentStr);

    // Toggle block
    case 'toggle':
      return await toggleToMarkdown(block, notion, imageMap);

    // Divider
    case 'divider':
      return indentStr + '---';

    // Table
    case 'table':
      return await tableToMarkdown(block, notion);

    // Columns
    case 'column_list':
      return await columnListToHtml(block, notion, imageMap);

    // Media blocks
    case 'image':
      const localPath = imageMap?.get(block.id);
      return indentStr + imageToMarkdown(block, localPath);

    case 'video':
      return indentStr + videoToHtml(block);

    case 'file':
      return indentStr + fileToMarkdown(block);

    case 'pdf':
      return indentStr + pdfToHtml(block);

    case 'bookmark':
      return indentStr + bookmarkToMarkdown(block);

    case 'embed':
      return indentStr + embedToHtml(block);

    // Advanced blocks
    case 'equation':
      return indentStr + equationToMarkdown(block);

    case 'table_of_contents':
      return indentStr + tocToHtml(block);

    case 'breadcrumb':
      return indentStr + breadcrumbToHtml(block);

    // Link blocks
    case 'link_to_page':
      return indentStr + linkToPageToMarkdown(block);

    case 'link_preview':
      return indentStr + linkPreviewToMarkdown(block);

    // Synced block - resolve to source content
    case 'synced_block':
      return await syncedBlockToMarkdown(block, notion, imageMap);

    // Database blocks
    case 'child_database':
      return childDatabaseToMarkdown(block);

    case 'child_page':
      return childPageToMarkdown(block);

    // Unsupported blocks
    case 'unsupported':
      console.warn(`Unsupported block type: ${block.type}`);
      return indentStr + `<!-- Unsupported block type: ${block.type} -->`;

    default:
      console.warn(`Unknown block type: ${block.type}`);
      return indentStr + `<!-- Unknown block type: ${block.type} -->`;
  }
}

/**
 * Convert Notion rich text to Markdown
 */
export function richTextToMarkdown(richText: RichTextItem[]): string {
  if (!richText || richText.length === 0) return '';

  return richText.map((item) => {
    let content = item.plain_text;

    // Handle mentions
    if (item.type === 'mention') {
      return mentionToMarkdown(item);
    }

    // Handle equations
    if (item.type === 'equation' && item.equation) {
      return `$${item.equation.expression}$`;
    }

    // Apply text formatting (order matters for nested formatting)
    if (item.annotations.bold) content = `**${content}**`;
    if (item.annotations.italic) content = `*${content}*`;
    if (item.annotations.strikethrough) content = `~~${content}~~`;
    if (item.annotations.code) content = `\`${content}\``;

    // Handle underline (no native Markdown, use HTML)
    if (item.annotations.underline) {
      content = `<u>${content}</u>`;
    }

    // Handle colors (using HTML for non-default colors)
    if (item.annotations.color !== 'default') {
      const colorMap: Record<string, string> = {
        gray: '#9B9A97',
        brown: '#64473A',
        orange: '#D9730D',
        yellow: '#DFAB01',
        green: '#0F7B6C',
        blue: '#0B6E99',
        purple: '#6940A5',
        pink: '#AD1A72',
        red: '#E03E3E',
      };

      const bgColorMap: Record<string, string> = {
        gray_background: '#EBECED',
        brown_background: '#E9E5E3',
        orange_background: '#FADEC9',
        yellow_background: '#FBF3DB',
        green_background: '#DDEDEA',
        blue_background: '#DDEBF1',
        purple_background: '#EAE4F2',
        pink_background: '#F4DFEB',
        red_background: '#FBE4E4',
      };

      const color = colorMap[item.annotations.color] || bgColorMap[item.annotations.color];
      if (color) {
        const isBg = item.annotations.color.includes('_background');
        content = isBg
          ? `<span style="background-color: ${color};">${content}</span>`
          : `<span style="color: ${color};">${content}</span>`;
      }
    }

    // Handle links
    // If the link text equals the URL, just show the plain URL
    if (item.href) {
      if (content === item.href) {
        content = item.href;
      } else {
        content = `[${content}](${item.href})`;
      }
    }

    return content;
  }).join('');
}

/**
 * Convert paragraph block to Markdown
 */
function paragraphToMarkdown(block: NotionBlock): string {
  return richTextToMarkdown(block.paragraph.rich_text);
}

/**
 * Convert heading block to Markdown (handles toggle headings with children)
 */
async function headingToMarkdown(
  block: NotionBlock,
  level: 1 | 2 | 3,
  notion?: Client,
  imageMap?: Map<string, string>
): Promise<string> {
  const headingKey = `heading_${level}` as 'heading_1' | 'heading_2' | 'heading_3';
  const headingData = block[headingKey];
  let headingText = richTextToMarkdown(headingData.rich_text);

  // Remove bold markers from headings (e.g., "**Source**" -> "Source")
  headingText = headingText.replace(/^\*\*(.+)\*\*$/, '$1');

  // Rename "Source" to "Transcript" for voice memo entries
  if (headingText === 'Source') {
    headingText = 'Transcript';
  }

  const prefix = '#'.repeat(level);

  // Basic heading without children
  let result = `${prefix} ${headingText}`;

  // Handle toggle headings (headings with children)
  if (block.has_children && notion) {
    try {
      const response = await notion.blocks.children.list({ block_id: block.id });
      const children = response.results as NotionBlock[];

      if (children.length > 0) {
        const childrenMarkdown = await blocksToMarkdown(children, notion, 0, imageMap);
        result += '\n\n' + childrenMarkdown;
      }
    } catch (error) {
      console.warn(`Failed to fetch heading children for block ${block.id}:`, error);
    }
  }

  return result;
}

/**
 * Convert code block to Markdown
 */
function codeToMarkdown(block: NotionBlock, indentStr = ''): string {
  const language = block.code.language || '';
  const code = richTextToMarkdown(block.code.rich_text);

  // Indent each line of code content when inside a list item
  const indentedCode = code
    .split('\n')
    .map(line => indentStr + line)
    .join('\n');

  return `${indentStr}\`\`\`${language}\n${indentedCode}\n${indentStr}\`\`\``;
}

/**
 * Convert callout block to Obsidian callout format
 */
async function calloutToMarkdown(block: NotionBlock): Promise<string> {
  const icon = block.callout.icon?.emoji || '📝';
  const text = richTextToMarkdown(block.callout.rich_text);

  // Map Notion callout colors to Obsidian callout types
  const colorTypeMap: Record<string, string> = {
    gray: 'note',
    brown: 'note',
    orange: 'warning',
    yellow: 'warning',
    green: 'success',
    blue: 'info',
    purple: 'info',
    pink: 'note',
    red: 'danger',
    gray_background: 'note',
    brown_background: 'note',
    orange_background: 'warning',
    yellow_background: 'warning',
    green_background: 'success',
    blue_background: 'info',
    purple_background: 'info',
    pink_background: 'note',
    red_background: 'danger',
  };

  const calloutType = colorTypeMap[block.callout.color] || 'note';
  const lines = text.split('\n');

  return `> [!${calloutType}] ${icon}\n${lines.map(line => `> ${line}`).join('\n')}`;
}

/**
 * Convert toggle block to HTML details/summary
 */
async function toggleToMarkdown(block: NotionBlock, notion?: Client, imageMap?: Map<string, string>): Promise<string> {
  const title = richTextToMarkdown(block.toggle.rich_text);

  let children = '';
  if (block.toggle.children && block.toggle.children.length > 0) {
    children = await blocksToMarkdown(block.toggle.children, notion, 0, imageMap);
  } else if (block.has_children && notion) {
    // Fetch children if not included
    try {
      const response = await notion.blocks.children.list({ block_id: block.id });
      children = await blocksToMarkdown(response.results as NotionBlock[], notion, 0, imageMap);
    } catch (error) {
      console.warn(`Failed to fetch toggle children for block ${block.id}:`, error);
    }
  }

  return `<details>\n<summary>${title}</summary>\n\n${children}\n\n</details>`;
}

/**
 * Convert table to Markdown table format
 */
async function tableToMarkdown(block: NotionBlock, notion?: Client): Promise<string> {
  if (!notion) {
    return '<!-- Table: Notion API client required to fetch table data -->';
  }

  try {
    // Fetch table rows
    const response = await notion.blocks.children.list({ block_id: block.id });
    const rows = response.results as NotionBlock[];

    if (rows.length === 0) return '';

    // Build Markdown table
    const tableWidth = block.table.table_width;
    const hasColumnHeader = block.table.has_column_header;
    const hasRowHeader = block.table.has_row_header;

    const tableRows: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.type !== 'table_row') continue;

      const cells = row.table_row.cells.map((cell: RichTextItem[]) =>
        richTextToMarkdown(cell).replace(/\|/g, '\\|') // Escape pipes
      );

      tableRows.push(`| ${cells.join(' | ')} |`);

      // Add header separator after first row if has column header
      if (i === 0 && hasColumnHeader) {
        tableRows.push(`| ${Array(tableWidth).fill('---').join(' | ')} |`);
      }
    }

    return tableRows.join('\n');
  } catch (error) {
    console.warn(`Failed to fetch table rows for block ${block.id}:`, error);
    return '<!-- Failed to load table -->';
  }
}

/**
 * Convert column list to HTML columns
 */
async function columnListToHtml(block: NotionBlock, notion?: Client, imageMap?: Map<string, string>): Promise<string> {
  if (!notion) {
    return '<!-- Columns: Notion API client required -->';
  }

  try {
    const response = await notion.blocks.children.list({ block_id: block.id });
    const columns = response.results as NotionBlock[];

    const columnContents: string[] = [];

    for (const column of columns) {
      if (column.type !== 'column') continue;

      let columnContent = '';
      if (column.column.children) {
        columnContent = await blocksToMarkdown(column.column.children, notion, 0, imageMap);
      } else {
        const colResponse = await notion.blocks.children.list({ block_id: column.id });
        columnContent = await blocksToMarkdown(colResponse.results as NotionBlock[], notion, 0, imageMap);
      }

      columnContents.push(`<div class="notion-column">\n\n${columnContent}\n\n</div>`);
    }

    return `<div class="notion-column-list">\n\n${columnContents.join('\n\n')}\n\n</div>`;
  } catch (error) {
    console.warn(`Failed to fetch columns for block ${block.id}:`, error);
    return '<!-- Failed to load columns -->';
  }
}

/**
 * Convert image block to Markdown
 * @param block - The image block
 * @param localImagePath - Optional local path to use instead of Notion URL
 */
function imageToMarkdown(block: NotionBlock, localImagePath?: string): string {
  const imageData = block.image;
  const caption = imageData.caption ? richTextToMarkdown(imageData.caption) : '';

  let url = '';
  if (localImagePath) {
    // Use local path if provided
    url = localImagePath;
  } else {
    // Otherwise use Notion URL
    if (imageData.type === 'external') {
      url = imageData.external.url;
    } else if (imageData.type === 'file') {
      url = imageData.file.url;
    }
  }

  return caption ? `![${caption}](${url})` : `![](${url})`;
}

/**
 * Convert video block to HTML
 */
function videoToHtml(block: NotionBlock): string {
  const videoData = block.video;
  const caption = videoData.caption ? richTextToMarkdown(videoData.caption) : '';

  let url = '';
  if (videoData.type === 'external') {
    url = videoData.external.url;
  } else if (videoData.type === 'file') {
    url = videoData.file.url;
  }

  // Check if it's an embeddable video (YouTube, Vimeo, etc.)
  if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
    return `<iframe src="${url}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>${caption ? `\n<p><em>${caption}</em></p>` : ''}`;
  }

  return `<video controls src="${url}"></video>${caption ? `\n<p><em>${caption}</em></p>` : ''}`;
}

/**
 * Convert file block to Markdown link
 */
function fileToMarkdown(block: NotionBlock): string {
  const fileData = block.file;
  const caption = fileData.caption ? richTextToMarkdown(fileData.caption) : 'Download file';

  let url = '';
  if (fileData.type === 'external') {
    url = fileData.external.url;
  } else if (fileData.type === 'file') {
    url = fileData.file.url;
  }

  return `[${caption}](${url})`;
}

/**
 * Convert PDF block to HTML embed
 */
function pdfToHtml(block: NotionBlock): string {
  const pdfData = block.pdf;
  const caption = pdfData.caption ? richTextToMarkdown(pdfData.caption) : '';

  let url = '';
  if (pdfData.type === 'external') {
    url = pdfData.external.url;
  } else if (pdfData.type === 'file') {
    url = pdfData.file.url;
  }

  return `<embed src="${url}" type="application/pdf" width="100%" height="600px" />${caption ? `\n<p><em>${caption}</em></p>` : ''}`;
}

/**
 * Convert bookmark block to Markdown
 */
function bookmarkToMarkdown(block: NotionBlock): string {
  const url = block.bookmark.url;
  const captionText = block.bookmark.caption ? richTextToMarkdown(block.bookmark.caption) : '';
  // Use URL as display text if caption is empty
  const displayText = captionText.trim() || url;

  return `[${displayText}](${url})`;
}

/**
 * Convert embed block to HTML
 */
function embedToHtml(block: NotionBlock): string {
  const url = block.embed.url;
  const caption = block.embed.caption ? richTextToMarkdown(block.embed.caption) : '';

  return `<iframe src="${url}" width="100%" height="400px" frameborder="0"></iframe>${caption ? `\n<p><em>${caption}</em></p>` : ''}`;
}

/**
 * Convert equation block to LaTeX
 */
function equationToMarkdown(block: NotionBlock): string {
  return `$$\n${block.equation.expression}\n$$`;
}

/**
 * Convert table of contents to HTML
 */
function tocToHtml(block: NotionBlock): string {
  return `<div class="notion-toc">
<!-- Table of Contents will be generated by Obsidian -->
</div>`;
}

/**
 * Convert breadcrumb to HTML
 */
function breadcrumbToHtml(block: NotionBlock): string {
  return `<nav class="notion-breadcrumb">
<!-- Breadcrumb navigation -->
</nav>`;
}

/**
 * Convert link_to_page block to Markdown link
 */
function linkToPageToMarkdown(block: NotionBlock): string {
  const pageId = block.link_to_page.page_id || block.link_to_page.database_id;
  return `[Notion Page](https://notion.so/${pageId})`;
}

/**
 * Convert link_preview block to Markdown
 */
function linkPreviewToMarkdown(block: NotionBlock): string {
  const url = block.link_preview.url;
  return `[${url}](${url})`;
}

/**
 * Convert synced block to its source content
 */
async function syncedBlockToMarkdown(block: NotionBlock, notion?: Client, imageMap?: Map<string, string>): Promise<string> {
  if (!notion) {
    return '<!-- Synced Block: Notion API client required -->';
  }

  try {
    // If this is a synced_from block, fetch the original
    if (block.synced_block.synced_from) {
      const sourceBlockId = block.synced_block.synced_from.block_id;

      // Fetch source block
      const sourceBlock = await notion.blocks.retrieve({ block_id: sourceBlockId }) as NotionBlock;

      // Fetch source block's children
      const response = await notion.blocks.children.list({ block_id: sourceBlockId });
      const children = response.results as NotionBlock[];

      return await blocksToMarkdown(children, notion, 0, imageMap);
    } else {
      // This is the original synced block
      const response = await notion.blocks.children.list({ block_id: block.id });
      return await blocksToMarkdown(response.results as NotionBlock[], notion, 0, imageMap);
    }
  } catch (error) {
    console.warn(`Failed to resolve synced block ${block.id}:`, error);
    return '<!-- Failed to resolve synced block -->';
  }
}

/**
 * Convert child_database block to Markdown
 * Returns empty string to skip database views (e.g., Activity sections)
 */
function childDatabaseToMarkdown(block: NotionBlock): string {
  return ''; // Skip database views entirely
}

/**
 * Convert child_page block to link
 */
function childPageToMarkdown(block: NotionBlock): string {
  const title = block.child_page.title || 'Untitled Page';
  return `[📄 ${title}](https://notion.so/${block.id})`;
}

/**
 * Convert mention to Markdown
 */
function mentionToMarkdown(item: RichTextItem): string {
  if (!item.mention) return item.plain_text;

  const mention = item.mention;

  switch (mention.type) {
    case 'user':
      // User mention - plain text (no link)
      return `@${item.plain_text}`;

    case 'page':
      // Page mention - Notion deep link (remove dashes from ID)
      const pageId = mention.page.id.replace(/-/g, '');
      return `[${item.plain_text}](https://notion.so/${pageId})`;

    case 'database':
      // Database mention - Notion deep link
      const dbId = mention.database.id.replace(/-/g, '');
      return `[${item.plain_text}](https://notion.so/${dbId})`;

    case 'date':
      // Date mention - Obsidian internal link format
      const dateStr = mention.date?.start || item.plain_text;
      return `[[${dateStr}]]`;

    case 'link_preview':
      // Link preview - use URL from mention or plain text
      const url = mention.link_preview?.url || item.plain_text;
      return `[${url}](${url})`;

    default:
      return item.plain_text;
  }
}
