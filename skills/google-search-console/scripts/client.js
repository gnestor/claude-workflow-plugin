#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'google-search-console';
const SC_BASE = 'https://searchconsole.googleapis.com';

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

async function listSites() {
  const result = await apiRequest(SERVICE, '/webmasters/v3/sites', {
    baseUrl: SC_BASE,
  });
  return result;
}

async function topQueries(flags) {
  if (!flags['site-url']) throw new Error('--site-url is required');
  const siteUrl = encodeURIComponent(flags['site-url']);
  const rowLimit = flags.limit ? parseInt(flags.limit, 10) : 25;

  const body = {
    startDate: flags['start-date'],
    endDate: flags['end-date'],
    dimensions: ['query'],
    rowLimit,
  };

  const result = await apiRequest(
    SERVICE,
    `/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
    { baseUrl: SC_BASE, method: 'POST', body },
  );
  return result;
}

async function topPages(flags) {
  if (!flags['site-url']) throw new Error('--site-url is required');
  const siteUrl = encodeURIComponent(flags['site-url']);
  const rowLimit = flags.limit ? parseInt(flags.limit, 10) : 25;

  const body = {
    startDate: flags['start-date'],
    endDate: flags['end-date'],
    dimensions: ['page'],
    rowLimit,
  };

  const result = await apiRequest(
    SERVICE,
    `/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
    { baseUrl: SC_BASE, method: 'POST', body },
  );
  return result;
}

async function queryAnalytics(flags) {
  if (!flags['site-url']) throw new Error('--site-url is required');
  const siteUrl = encodeURIComponent(flags['site-url']);
  const rowLimit = flags.limit ? parseInt(flags.limit, 10) : 25;

  const dimensions = flags.dimensions
    ? flags.dimensions.split(',').map(d => d.trim())
    : ['query'];

  const body = {
    startDate: flags['start-date'],
    endDate: flags['end-date'],
    dimensions,
    rowLimit,
  };

  if (flags.filters) {
    try {
      body.dimensionFilterGroups = JSON.parse(flags.filters);
    } catch {
      throw new Error('--filters must be a valid JSON string');
    }
  }

  const result = await apiRequest(
    SERVICE,
    `/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
    { baseUrl: SC_BASE, method: 'POST', body },
  );
  return result;
}

async function inspectUrl(flags) {
  if (!flags['site-url']) throw new Error('--site-url is required');
  if (!flags.url) throw new Error('--url is required');

  const body = {
    inspectionUrl: flags.url,
    siteUrl: flags['site-url'],
  };

  const result = await apiRequest(SERVICE, '/v1/urlInspection/index:inspect', {
    baseUrl: SC_BASE,
    method: 'POST',
    body,
  });
  return result;
}

async function listSitemaps(flags) {
  if (!flags['site-url']) throw new Error('--site-url is required');
  const siteUrl = encodeURIComponent(flags['site-url']);

  const result = await apiRequest(
    SERVICE,
    `/webmasters/v3/sites/${siteUrl}/sitemaps`,
    { baseUrl: SC_BASE },
  );
  return result;
}

// --- CLI Router ---

const COMMANDS = {
  'list-sites': {
    fn: listSites,
    desc: 'List all sites in Search Console',
  },
  'top-queries': {
    fn: topQueries,
    desc: 'Top search queries (--site-url) [--start-date, --end-date, --limit]',
  },
  'top-pages': {
    fn: topPages,
    desc: 'Top pages (--site-url) [--start-date, --end-date, --limit]',
  },
  'query-analytics': {
    fn: queryAnalytics,
    desc: 'Query search analytics (--site-url) [--start-date, --end-date, --dimensions, --limit, --filters]',
  },
  'inspect-url': {
    fn: inspectUrl,
    desc: 'Inspect a URL (--site-url, --url)',
  },
  'list-sitemaps': {
    fn: listSitemaps,
    desc: 'List sitemaps for a site (--site-url)',
  },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
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
