#!/usr/bin/env node

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { apiRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMAS_DIR = join(__dirname, '..', 'references', 'schemas');

const SERVICE = 'notion';

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

// --- Commands ---

async function testAuth() {
  const result = await apiRequest(SERVICE, '/users/me');
  return result;
}

async function search(flags) {
  const body = {};
  if (flags.query) body.query = flags.query;
  if (flags.type) {
    body.filter = { property: 'object', value: flags.type };
  }
  body.sort = {
    direction: 'descending',
    timestamp: 'last_edited_time',
  };
  if (flags.limit) body.page_size = parseInt(flags.limit, 10);
  const result = await apiRequest(SERVICE, '/search', { method: 'POST', body });
  return result;
}

async function getPage(flags) {
  if (!flags.id) throw new Error('--id is required');
  const page = await apiRequest(SERVICE, `/pages/${flags.id}`);
  const blocks = await apiRequest(SERVICE, `/blocks/${flags.id}/children`);
  return { ...page, children: blocks.results || [] };
}

async function createPage(flags) {
  if (!flags['parent-id']) throw new Error('--parent-id is required');
  const body = {};

  // Determine parent type: if it looks like a database ID, use database_id; otherwise page_id
  // Notion IDs are UUIDs. Databases and pages both use UUIDs, so we use a flag to disambiguate.
  if (flags['parent-type'] === 'page') {
    body.parent = { page_id: flags['parent-id'] };
  } else {
    // Default to database parent
    body.parent = { database_id: flags['parent-id'] };
  }

  if (flags.title) {
    // For database pages, title goes into properties.Name (or title property)
    if (body.parent.database_id) {
      body.properties = {
        Name: { title: [{ text: { content: flags.title } }] },
      };
    } else {
      // For page children, title goes into properties.title
      body.properties = {
        title: [{ text: { content: flags.title } }],
      };
    }
  }

  if (flags.body) {
    const parsed = JSON.parse(flags.body);
    if (parsed.properties) {
      body.properties = { ...body.properties, ...parsed.properties };
    }
    if (parsed.children) {
      body.children = parsed.children;
    }
  }

  const result = await apiRequest(SERVICE, '/pages', { method: 'POST', body });
  return result;
}

async function updatePage(flags) {
  if (!flags['page-id']) throw new Error('--page-id is required');
  if (!flags.body) throw new Error('--body is required (JSON with properties)');
  const parsed = JSON.parse(flags.body);
  const body = {};
  if (parsed.properties) body.properties = parsed.properties;
  if (parsed.archived !== undefined) body.archived = parsed.archived;
  if (parsed.icon) body.icon = parsed.icon;
  if (parsed.cover) body.cover = parsed.cover;
  const result = await apiRequest(SERVICE, `/pages/${flags['page-id']}`, { method: 'PATCH', body });
  return result;
}

async function queryDatabase(flags) {
  if (!flags['database-id']) throw new Error('--database-id is required');
  const body = {};
  if (flags.filter) body.filter = JSON.parse(flags.filter);
  if (flags.sorts) body.sorts = JSON.parse(flags.sorts);
  if (flags.limit) body.page_size = parseInt(flags.limit, 10);
  if (flags.cursor) body.start_cursor = flags.cursor;
  const result = await apiRequest(SERVICE, `/databases/${flags['database-id']}/query`, { method: 'POST', body });
  return result;
}

async function getDatabase(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/databases/${flags.id}`);
  return result;
}

async function createDatabase(flags) {
  if (!flags['parent-id']) throw new Error('--parent-id is required');
  if (!flags.title) throw new Error('--title is required');
  const body = {
    parent: { page_id: flags['parent-id'] },
    title: [{ text: { content: flags.title } }],
    properties: {},
  };
  if (flags.body) {
    const parsed = JSON.parse(flags.body);
    if (parsed.properties) body.properties = parsed.properties;
  }
  // Ensure at least a Name title property exists
  if (!Object.values(body.properties).some(p => p.title !== undefined)) {
    body.properties.Name = { title: {} };
  }
  const result = await apiRequest(SERVICE, '/databases', { method: 'POST', body });
  return result;
}

async function scanDatabases() {
  await mkdir(SCHEMAS_DIR, { recursive: true });

  // Paginate through all databases
  const allDatabases = [];
  let startCursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const body = {
      filter: { property: 'object', value: 'database' },
      page_size: 100,
    };
    if (startCursor) body.start_cursor = startCursor;

    const result = await apiRequest(SERVICE, '/search', { method: 'POST', body });
    allDatabases.push(...(result.results || []));
    hasMore = result.has_more;
    startCursor = result.next_cursor;
  }

  const savedFiles = [];

  for (const db of allDatabases) {
    // Get full database schema
    const full = await apiRequest(SERVICE, `/databases/${db.id}`);
    const title = full.title?.map(t => t.plain_text).join('') || 'untitled';

    // Transform properties object to array with type-specific config
    const properties = Object.entries(full.properties || {}).map(([name, prop]) => ({
      name,
      id: prop.id,
      type: prop.type,
      config: prop[prop.type] || {},
    }));

    const schema = {
      id: full.id,
      title,
      url: full.url,
      properties,
    };

    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const shortId = full.id.replace(/-/g, '').substring(0, 8);
    const fileName = `${sanitizedTitle}_${shortId}.json`;
    await writeFile(join(SCHEMAS_DIR, fileName), JSON.stringify(schema, null, 2));
    savedFiles.push({ title, id: full.id });
  }

  return { totalDatabases: savedFiles.length, schemasDir: SCHEMAS_DIR, databases: savedFiles };
}

// --- CLI Router ---

const COMMANDS = {
  'test-auth': { fn: testAuth, desc: 'Test authentication (GET /users/me)' },
  'search': { fn: search, desc: 'Search pages and databases [--query, --type (page|database), --limit]' },
  'get-page': { fn: getPage, desc: 'Get page with content blocks (--id)' },
  'create-page': { fn: createPage, desc: 'Create page (--parent-id) [--parent-type (page|database), --title, --body (JSON with properties+children)]' },
  'update-page': { fn: updatePage, desc: 'Update page properties (--page-id, --body JSON)' },
  'query-database': { fn: queryDatabase, desc: 'Query a database (--database-id) [--filter (JSON), --sorts (JSON), --limit, --cursor]' },
  'get-database': { fn: getDatabase, desc: 'Get database schema (--id)' },
  'create-database': { fn: createDatabase, desc: 'Create database (--parent-id, --title) [--body (JSON with properties)]' },
  'scan-databases': { fn: scanDatabases, desc: 'Scan all databases, save schemas to references/schemas/' },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Notion CLI\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map(k => k.length));
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(maxLen + 2)}${desc}`);
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
