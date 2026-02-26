#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { getCredentials } from '../../../lib/auth.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'google-analytics';
const DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const ADMIN_API_BASE = 'https://analyticsadmin.googleapis.com/v1beta';

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
  const result = await apiRequest(SERVICE, '/accountSummaries', {
    baseUrl: ADMIN_API_BASE,
  });
  return result;
}

async function runReport(flags) {
  if (!flags['start-date']) throw new Error('--start-date is required');
  if (!flags['end-date']) throw new Error('--end-date is required');

  const creds = await getCredentials(SERVICE);
  const propertyId = creds.metadata.property_id;
  if (!propertyId) throw new Error('No property_id configured. Run: node auth/setup.js google-analytics');

  const body = {
    dateRanges: [{ startDate: flags['start-date'], endDate: flags['end-date'] }],
  };

  if (flags.dimensions) {
    body.dimensions = flags.dimensions.split(',').map((name) => ({ name: name.trim() }));
  }
  if (flags.metrics) {
    body.metrics = flags.metrics.split(',').map((name) => ({ name: name.trim() }));
  }
  if (flags.limit) {
    body.limit = parseInt(flags.limit, 10);
  }

  const result = await apiRequest(SERVICE, `/properties/${propertyId}:runReport`, {
    method: 'POST',
    baseUrl: DATA_API_BASE,
    body,
  });
  return result;
}

async function listProperties() {
  const result = await apiRequest(SERVICE, '/accountSummaries', {
    baseUrl: ADMIN_API_BASE,
  });

  // Extract property IDs from account summaries
  const properties = [];
  const summaries = result.accountSummaries || [];
  for (const account of summaries) {
    const propertySummaries = account.propertySummaries || [];
    for (const prop of propertySummaries) {
      properties.push({
        account: account.displayName,
        accountId: account.account,
        property: prop.displayName,
        propertyId: prop.property?.replace('properties/', ''),
        propertyResource: prop.property,
      });
    }
  }
  return { properties };
}

async function getMetadata(flags) {
  const creds = await getCredentials(SERVICE);
  const propertyId = flags['property-id'] || creds.metadata.property_id;
  if (!propertyId) throw new Error('No property_id configured. Pass --property-id or run: node auth/setup.js google-analytics');

  const result = await apiRequest(SERVICE, `/properties/${propertyId}/metadata`, {
    baseUrl: DATA_API_BASE,
  });
  return result;
}

// --- CLI Router ---

const COMMANDS = {
  'test-auth': {
    fn: testAuth,
    desc: 'Test authentication (GET accountSummaries)',
  },
  'run-report': {
    fn: runReport,
    desc: 'Run report (--start-date, --end-date) [--dimensions, --metrics, --limit]',
  },
  'list-properties': {
    fn: listProperties,
    desc: 'List all GA4 properties from account summaries',
  },
  'get-metadata': {
    fn: getMetadata,
    desc: 'Get property metadata [--property-id]',
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
