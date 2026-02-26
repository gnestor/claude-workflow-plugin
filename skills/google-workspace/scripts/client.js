#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'google-workspace';

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1';
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const SHEETS_BASE = 'https://sheets.googleapis.com/v4';
const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';

// --- Helpers ---

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

function decodeBase64Url(data) {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function encodeBase64Url(str) {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function getHeader(message, name) {
  return message.payload?.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function getEmailBody(message) {
  const payload = message.payload;
  if (!payload) return '';

  // Direct body on payload
  if (payload.body?.data) return decodeBase64Url(payload.body.data);

  // Check parts
  if (payload.parts) {
    // Prefer text/plain
    const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
    if (textPart?.body?.data) return decodeBase64Url(textPart.body.data);

    // Fall back to text/html with tag stripping
    const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      return decodeBase64Url(htmlPart.body.data)
        .replace(/<style[^>]*>.*?<\/style>/gs, '')
        .replace(/<script[^>]*>.*?<\/script>/gs, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
    }

    // Check nested parts (e.g. multipart/alternative inside multipart/mixed)
    for (const part of payload.parts) {
      if (part.parts) {
        const sub = part.parts.find(p => p.mimeType === 'text/plain');
        if (sub?.body?.data) return decodeBase64Url(sub.body.data);
      }
    }
  }

  return message.snippet || '';
}

function extractSpreadsheetId(input) {
  const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) return urlMatch[1];
  return input;
}

function summarizeMessage(message) {
  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader(message, 'Subject'),
    from: getHeader(message, 'From'),
    to: getHeader(message, 'To'),
    date: getHeader(message, 'Date'),
    snippet: message.snippet,
    labels: message.labelIds || [],
  };
}

// --- Gmail Commands ---

async function gmailSearch(flags) {
  if (!flags.query) throw new Error('--query is required');
  const maxResults = flags.max || '20';

  const list = await apiRequest(SERVICE, '/users/me/messages', {
    baseUrl: GMAIL_BASE,
    params: { q: flags.query, maxResults },
  });

  if (!list.messages || list.messages.length === 0) {
    return { messages: [], resultSizeEstimate: list.resultSizeEstimate || 0 };
  }

  const messages = [];
  for (const msg of list.messages) {
    const full = await apiRequest(SERVICE, `/users/me/messages/${msg.id}`, {
      baseUrl: GMAIL_BASE,
    });
    messages.push(summarizeMessage(full));
  }

  return { messages, resultSizeEstimate: list.resultSizeEstimate || messages.length };
}

async function gmailListUnread(flags) {
  const maxResults = flags.max || '20';

  const list = await apiRequest(SERVICE, '/users/me/messages', {
    baseUrl: GMAIL_BASE,
    params: { q: 'is:unread', maxResults },
  });

  if (!list.messages || list.messages.length === 0) {
    return { messages: [], resultSizeEstimate: list.resultSizeEstimate || 0 };
  }

  const messages = [];
  for (const msg of list.messages) {
    const full = await apiRequest(SERVICE, `/users/me/messages/${msg.id}`, {
      baseUrl: GMAIL_BASE,
    });
    messages.push(summarizeMessage(full));
  }

  return { messages, resultSizeEstimate: list.resultSizeEstimate || messages.length };
}

async function gmailGet(flags) {
  if (!flags.id) throw new Error('--id is required');

  const message = await apiRequest(SERVICE, `/users/me/messages/${flags.id}`, {
    baseUrl: GMAIL_BASE,
  });

  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader(message, 'Subject'),
    from: getHeader(message, 'From'),
    to: getHeader(message, 'To'),
    cc: getHeader(message, 'Cc'),
    bcc: getHeader(message, 'Bcc'),
    date: getHeader(message, 'Date'),
    snippet: message.snippet,
    labels: message.labelIds || [],
    body: getEmailBody(message),
  };
}

async function gmailSend(flags) {
  if (!flags.to) throw new Error('--to is required');
  if (!flags.subject) throw new Error('--subject is required');
  if (!flags.body) throw new Error('--body is required');

  const lines = [];
  lines.push(`To: ${flags.to}`);
  lines.push(`Subject: ${flags.subject}`);
  if (flags.cc) lines.push(`Cc: ${flags.cc}`);
  if (flags.bcc) lines.push(`Bcc: ${flags.bcc}`);
  if (flags['reply-to']) lines.push(`In-Reply-To: ${flags['reply-to']}`);
  if (flags['reply-to']) lines.push(`References: ${flags['reply-to']}`);
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push('MIME-Version: 1.0');
  lines.push('');
  lines.push(flags.body);

  const rawMessage = lines.join('\r\n');
  const encoded = encodeBase64Url(rawMessage);

  const body = { raw: encoded };
  if (flags['reply-to']) {
    body.threadId = flags['thread-id'] || undefined;
  }

  const result = await apiRequest(SERVICE, '/users/me/messages/send', {
    baseUrl: GMAIL_BASE,
    method: 'POST',
    body,
  });

  return result;
}

async function gmailManageLabels(flags) {
  if (!flags.id) throw new Error('--id is required');
  if (!flags.add && !flags.remove) throw new Error('--add and/or --remove is required (comma-separated label names)');

  // Fetch all labels to resolve names to IDs
  const labelsResponse = await apiRequest(SERVICE, '/users/me/labels', {
    baseUrl: GMAIL_BASE,
  });
  const allLabels = labelsResponse.labels || [];

  // System labels that can be used directly by name
  const systemLabels = [
    'INBOX', 'SPAM', 'TRASH', 'UNREAD', 'STARRED', 'IMPORTANT',
    'SENT', 'DRAFT', 'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL',
    'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS',
  ];

  function resolveLabelId(name) {
    const upper = name.trim().toUpperCase();
    if (systemLabels.includes(upper)) return upper;
    const found = allLabels.find(
      l => l.name.toLowerCase() === name.trim().toLowerCase(),
    );
    if (found) return found.id;
    throw new Error(`Label not found: "${name.trim()}"`);
  }

  const addLabelIds = [];
  const removeLabelIds = [];

  if (flags.add) {
    for (const name of flags.add.split(',')) {
      addLabelIds.push(resolveLabelId(name));
    }
  }
  if (flags.remove) {
    for (const name of flags.remove.split(',')) {
      removeLabelIds.push(resolveLabelId(name));
    }
  }

  const body = {};
  if (addLabelIds.length > 0) body.addLabelIds = addLabelIds;
  if (removeLabelIds.length > 0) body.removeLabelIds = removeLabelIds;

  const result = await apiRequest(SERVICE, `/users/me/messages/${flags.id}/modify`, {
    baseUrl: GMAIL_BASE,
    method: 'POST',
    body,
  });

  return result;
}

// --- Drive Commands ---

async function driveSearch(flags) {
  if (!flags.query) throw new Error('--query is required');
  const pageSize = flags.limit || '20';

  const result = await apiRequest(SERVICE, '/files', {
    baseUrl: DRIVE_BASE,
    params: {
      q: flags.query,
      pageSize,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,owners,parents,shared,starred)',
    },
  });

  return result;
}

async function driveList(flags) {
  if (!flags['folder-id']) throw new Error('--folder-id is required');
  const pageSize = flags.limit || '50';

  const result = await apiRequest(SERVICE, '/files', {
    baseUrl: DRIVE_BASE,
    params: {
      q: `'${flags['folder-id']}' in parents and trashed = false`,
      pageSize,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,owners,parents,shared,starred)',
    },
  });

  return result;
}

async function driveDownload(flags) {
  if (!flags.id) throw new Error('--id is required');

  // Google Workspace MIME types that need export
  const exportMimeTypes = {
    'application/vnd.google-apps.document': 'text/plain',
    'application/vnd.google-apps.spreadsheet': 'text/csv',
    'application/vnd.google-apps.presentation': 'text/plain',
    'application/vnd.google-apps.drawing': 'image/png',
  };

  // First get file metadata to determine type
  const meta = await apiRequest(SERVICE, `/files/${flags.id}`, {
    baseUrl: DRIVE_BASE,
    params: { fields: 'id,name,mimeType,size' },
  });

  const exportType = flags['mime-type'] || exportMimeTypes[meta.mimeType];

  let response;
  if (exportType) {
    // Export Google Workspace files
    response = await apiRequest(SERVICE, `/files/${flags.id}/export`, {
      baseUrl: DRIVE_BASE,
      params: { mimeType: exportType },
      raw: true,
    });
  } else {
    // Download binary/regular files
    response = await apiRequest(SERVICE, `/files/${flags.id}`, {
      baseUrl: DRIVE_BASE,
      params: { alt: 'media' },
      raw: true,
    });
  }

  const contentType = response.headers.get('content-type') || '';
  const isText = contentType.includes('text') || contentType.includes('json') || contentType.includes('xml') || contentType.includes('csv');

  if (isText) {
    const text = await response.text();
    return { id: meta.id, name: meta.name, mimeType: meta.mimeType, contentType, content: text };
  } else {
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return { id: meta.id, name: meta.name, mimeType: meta.mimeType, contentType, content_base64: base64 };
  }
}

async function driveUpload(flags) {
  if (!flags.name) throw new Error('--name is required');
  if (!flags.content) throw new Error('--content is required');

  const metadata = { name: flags.name };
  if (flags['parent-id']) metadata.parents = [flags['parent-id']];
  if (flags['mime-type']) metadata.mimeType = flags['mime-type'];

  const boundary = '===multipart_boundary_' + Date.now() + '===';
  const contentType = flags['content-type'] || 'text/plain';

  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${contentType}`,
    '',
    flags.content,
    `--${boundary}--`,
  ].join('\r\n');

  const result = await apiRequest(SERVICE, '/files', {
    baseUrl: DRIVE_UPLOAD_BASE,
    method: 'POST',
    params: { uploadType: 'multipart' },
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipartBody,
  });

  return result;
}

// --- Sheets Commands ---

async function sheetsList(flags) {
  if (!flags.id) throw new Error('--id is required (spreadsheet ID or URL)');
  const spreadsheetId = extractSpreadsheetId(flags.id);

  const result = await apiRequest(SERVICE, `/spreadsheets/${spreadsheetId}`, {
    baseUrl: SHEETS_BASE,
    params: { fields: 'spreadsheetId,properties.title,sheets.properties' },
  });

  const sheets = (result.sheets || []).map(s => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    index: s.properties.index,
    sheetType: s.properties.sheetType,
    rowCount: s.properties.gridProperties?.rowCount,
    columnCount: s.properties.gridProperties?.columnCount,
  }));

  return {
    spreadsheetId: result.spreadsheetId,
    title: result.properties?.title,
    sheets,
  };
}

async function sheetsGetRange(flags) {
  if (!flags.id) throw new Error('--id is required (spreadsheet ID or URL)');
  if (!flags.range) throw new Error('--range is required (e.g. Sheet1!A1:D10)');
  const spreadsheetId = extractSpreadsheetId(flags.id);
  const valueRenderOption = flags['render-option'] || 'FORMATTED_VALUE';

  const result = await apiRequest(SERVICE, `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(flags.range)}`, {
    baseUrl: SHEETS_BASE,
    params: { valueRenderOption },
  });

  return result;
}

async function sheetsUpdateRange(flags) {
  if (!flags.id) throw new Error('--id is required (spreadsheet ID or URL)');
  if (!flags.range) throw new Error('--range is required (e.g. Sheet1!A1:D10)');
  if (!flags.values) throw new Error('--values is required (JSON 2D array, e.g. \'[["a","b"],["c","d"]]\')');
  const spreadsheetId = extractSpreadsheetId(flags.id);
  const valueInputOption = flags['input-option'] || 'USER_ENTERED';

  let values;
  try {
    values = JSON.parse(flags.values);
  } catch {
    throw new Error('--values must be valid JSON (2D array)');
  }

  const result = await apiRequest(SERVICE, `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(flags.range)}`, {
    baseUrl: SHEETS_BASE,
    method: 'PUT',
    params: { valueInputOption },
    body: { range: flags.range, values },
  });

  return result;
}

async function sheetsAppend(flags) {
  if (!flags.id) throw new Error('--id is required (spreadsheet ID or URL)');
  if (!flags.range) throw new Error('--range is required (e.g. Sheet1!A1:D1)');
  if (!flags.values) throw new Error('--values is required (JSON 2D array, e.g. \'[["a","b"],["c","d"]]\')');
  const spreadsheetId = extractSpreadsheetId(flags.id);
  const valueInputOption = flags['input-option'] || 'USER_ENTERED';
  const insertDataOption = flags['insert-option'] || 'INSERT_ROWS';

  let values;
  try {
    values = JSON.parse(flags.values);
  } catch {
    throw new Error('--values must be valid JSON (2D array)');
  }

  const result = await apiRequest(SERVICE, `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(flags.range)}:append`, {
    baseUrl: SHEETS_BASE,
    method: 'POST',
    params: { valueInputOption, insertDataOption },
    body: { range: flags.range, values },
  });

  return result;
}

async function sheetsCreate(flags) {
  if (!flags.title) throw new Error('--title is required');

  const body = {
    properties: { title: flags.title },
  };

  if (flags['sheet-titles']) {
    body.sheets = flags['sheet-titles'].split(',').map(t => ({
      properties: { title: t.trim() },
    }));
  }

  const result = await apiRequest(SERVICE, '/spreadsheets', {
    baseUrl: SHEETS_BASE,
    method: 'POST',
    body,
  });

  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl,
    title: result.properties?.title,
    sheets: (result.sheets || []).map(s => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
    })),
  };
}

// --- Calendar Commands ---

async function calendarList(flags) {
  const calendarId = flags['calendar-id'] || 'primary';
  const maxResults = flags.max || '50';

  // Default to today if no dates specified
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const timeMin = flags['time-min'] || startOfDay.toISOString();
  const timeMax = flags['time-max'] || endOfDay.toISOString();

  const result = await apiRequest(SERVICE, `/calendars/${encodeURIComponent(calendarId)}/events`, {
    baseUrl: CALENDAR_BASE,
    params: {
      maxResults,
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin,
      timeMax,
    },
  });

  return result;
}

async function calendarCreate(flags) {
  const calendarId = flags['calendar-id'] || 'primary';

  if (!flags.summary) throw new Error('--summary is required');

  const event = {
    summary: flags.summary,
  };

  if (flags.description) event.description = flags.description;
  if (flags.location) event.location = flags.location;

  const timezone = flags.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // All-day event
  if (flags['start-date']) {
    event.start = { date: flags['start-date'] };
    event.end = { date: flags['end-date'] || flags['start-date'] };
  } else {
    // Timed event
    if (!flags.start) throw new Error('--start or --start-date is required');
    if (!flags.end) throw new Error('--end is required for timed events');
    event.start = { dateTime: flags.start, timeZone: timezone };
    event.end = { dateTime: flags.end, timeZone: timezone };
  }

  if (flags.attendees) {
    event.attendees = flags.attendees.split(',').map(email => ({ email: email.trim() }));
  }

  const result = await apiRequest(SERVICE, `/calendars/${encodeURIComponent(calendarId)}/events`, {
    baseUrl: CALENDAR_BASE,
    method: 'POST',
    body: event,
  });

  return result;
}

async function calendarUpdate(flags) {
  const calendarId = flags['calendar-id'] || 'primary';
  if (!flags['event-id']) throw new Error('--event-id is required');

  const event = {};

  if (flags.summary) event.summary = flags.summary;
  if (flags.description) event.description = flags.description;
  if (flags.location) event.location = flags.location;

  const timezone = flags.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (flags['start-date']) {
    event.start = { date: flags['start-date'] };
    if (flags['end-date']) event.end = { date: flags['end-date'] };
  } else if (flags.start) {
    event.start = { dateTime: flags.start, timeZone: timezone };
    if (flags.end) event.end = { dateTime: flags.end, timeZone: timezone };
  }

  if (flags.attendees) {
    event.attendees = flags.attendees.split(',').map(email => ({ email: email.trim() }));
  }

  const result = await apiRequest(SERVICE, `/calendars/${encodeURIComponent(calendarId)}/events/${flags['event-id']}`, {
    baseUrl: CALENDAR_BASE,
    method: 'PATCH',
    body: event,
  });

  return result;
}

async function calendarDelete(flags) {
  const calendarId = flags['calendar-id'] || 'primary';
  if (!flags['event-id']) throw new Error('--event-id is required');

  const result = await apiRequest(SERVICE, `/calendars/${encodeURIComponent(calendarId)}/events/${flags['event-id']}`, {
    baseUrl: CALENDAR_BASE,
    method: 'DELETE',
  });

  return result;
}

// --- CLI Router ---

const COMMANDS = {
  // Gmail
  'gmail-search': {
    fn: gmailSearch,
    desc: 'Search Gmail messages (--query) [--max]',
  },
  'gmail-list-unread': {
    fn: gmailListUnread,
    desc: 'List unread Gmail messages [--max]',
  },
  'gmail-get': {
    fn: gmailGet,
    desc: 'Get full email message with decoded body (--id)',
  },
  'gmail-send': {
    fn: gmailSend,
    desc: 'Send email (--to, --subject, --body) [--cc, --bcc, --reply-to, --thread-id]',
  },
  'gmail-manage-labels': {
    fn: gmailManageLabels,
    desc: 'Add/remove labels on a message (--id) [--add, --remove] (comma-separated label names)',
  },

  // Drive
  'drive-search': {
    fn: driveSearch,
    desc: 'Search Drive files (--query) [--limit]',
  },
  'drive-list': {
    fn: driveList,
    desc: 'List files in a Drive folder (--folder-id) [--limit]',
  },
  'drive-download': {
    fn: driveDownload,
    desc: 'Download/export a Drive file (--id) [--mime-type]',
  },
  'drive-upload': {
    fn: driveUpload,
    desc: 'Upload a file to Drive (--name, --content) [--parent-id, --mime-type, --content-type]',
  },

  // Sheets
  'sheets-list': {
    fn: sheetsList,
    desc: 'List sheets/tabs in a spreadsheet (--id)',
  },
  'sheets-get-range': {
    fn: sheetsGetRange,
    desc: 'Get cell values from a range (--id, --range) [--render-option]',
  },
  'sheets-update-range': {
    fn: sheetsUpdateRange,
    desc: 'Update cell values in a range (--id, --range, --values JSON) [--input-option]',
  },
  'sheets-append': {
    fn: sheetsAppend,
    desc: 'Append rows to a sheet (--id, --range, --values JSON) [--input-option, --insert-option]',
  },
  'sheets-create': {
    fn: sheetsCreate,
    desc: 'Create a new spreadsheet (--title) [--sheet-titles comma-separated]',
  },

  // Calendar
  'calendar-list': {
    fn: calendarList,
    desc: 'List calendar events [--calendar-id, --time-min, --time-max, --max]',
  },
  'calendar-create': {
    fn: calendarCreate,
    desc: 'Create calendar event (--summary) [--description, --location, --start, --end, --start-date, --end-date, --timezone, --attendees, --calendar-id]',
  },
  'calendar-update': {
    fn: calendarUpdate,
    desc: 'Update calendar event (--event-id) [--summary, --description, --location, --start, --end, --start-date, --end-date, --timezone, --attendees, --calendar-id]',
  },
  'calendar-delete': {
    fn: calendarDelete,
    desc: 'Delete calendar event (--event-id) [--calendar-id]',
  },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Google Workspace CLI - Gmail, Drive, Sheets, Calendar\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map(k => k.length));
  let lastCategory = '';
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    const category = name.split('-')[0];
    if (category !== lastCategory) {
      if (lastCategory) console.log('');
      console.log(`  ${category.charAt(0).toUpperCase() + category.slice(1)}:`);
      lastCategory = category;
    }
    console.log(`    ${name.padEnd(maxLen + 2)}${desc}`);
  }
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
