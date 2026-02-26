#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'google-trends';

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

function buildQuery(params) {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

// --- Commands ---

async function interestOverTime(flags) {
  if (!flags.terms) throw new Error('--terms is required (comma-separated)');
  const params = {
    terms: flags.terms,
    time: flags.time || 'now 7-d',
  };
  if (flags.geo) params.geo = flags.geo;
  const result = await apiRequest(SERVICE, `/graph${buildQuery(params)}`);
  return result;
}

async function relatedQueries(flags) {
  if (!flags.term) throw new Error('--term is required');
  const params = { term: flags.term };
  if (flags.time) params.time = flags.time;
  if (flags.geo) params.geo = flags.geo;
  const result = await apiRequest(SERVICE, `/relatedQueries${buildQuery(params)}`);
  return result;
}

async function relatedTopics(flags) {
  if (!flags.term) throw new Error('--term is required');
  const params = { term: flags.term };
  if (flags.time) params.time = flags.time;
  if (flags.geo) params.geo = flags.geo;
  const result = await apiRequest(SERVICE, `/relatedTopics${buildQuery(params)}`);
  return result;
}

async function interestByRegion(flags) {
  if (!flags.terms) throw new Error('--terms is required (comma-separated)');
  const params = {
    terms: flags.terms,
    resolution: flags.resolution || 'COUNTRY',
  };
  if (flags.time) params.time = flags.time;
  const result = await apiRequest(SERVICE, `/comparedByRegion${buildQuery(params)}`);
  return result;
}

async function status() {
  const result = await apiRequest(SERVICE, '/graph?terms=test&time=now%207-d');
  return result;
}

// --- CLI Router ---

const COMMANDS = {
  'interest-over-time': {
    fn: interestOverTime,
    desc: 'Interest over time (--terms comma-sep) [--time, --geo]',
  },
  'related-queries': {
    fn: relatedQueries,
    desc: 'Related queries (--term) [--time, --geo]',
  },
  'related-topics': {
    fn: relatedTopics,
    desc: 'Related topics (--term) [--time, --geo]',
  },
  'interest-by-region': {
    fn: interestByRegion,
    desc: 'Interest by region (--terms comma-sep) [--time, --resolution]',
  },
  'status': {
    fn: status,
    desc: 'Health check (GET /graph with test query)',
  },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
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
