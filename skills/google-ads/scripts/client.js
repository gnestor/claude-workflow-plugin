#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { getCredentials } from '../../../lib/auth.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'google-ads';

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

async function getCustomerId() {
  const creds = await getCredentials(SERVICE);
  const customerId = creds.metadata.customer_id;
  if (!customerId) throw new Error('No customer_id configured. Run: node auth/setup.js google-ads');
  return customerId;
}

// --- Commands ---

async function testAuth() {
  const customerId = await getCustomerId();
  const result = await apiRequest(SERVICE, `/customers/${customerId}`);
  return result;
}

async function listCampaigns() {
  const customerId = await getCustomerId();
  const body = {
    query: 'SELECT campaign.id, campaign.name, campaign.status FROM campaign ORDER BY campaign.id',
  };
  const result = await apiRequest(SERVICE, `/customers/${customerId}/googleAds:searchStream`, {
    method: 'POST',
    body,
  });
  return result;
}

async function getCampaign(flags) {
  if (!flags.id) throw new Error('--id is required');
  const customerId = await getCustomerId();
  const body = {
    query: `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.bidding_strategy_type, campaign.budget_amount_micros, campaign.start_date, campaign.end_date FROM campaign WHERE campaign.id = ${flags.id}`,
  };
  const result = await apiRequest(SERVICE, `/customers/${customerId}/googleAds:searchStream`, {
    method: 'POST',
    body,
  });
  return result;
}

async function listKeywords() {
  const customerId = await getCustomerId();
  const body = {
    query: 'SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group.name, campaign.name FROM ad_group_criterion WHERE ad_group_criterion.type = KEYWORD ORDER BY ad_group_criterion.keyword.text',
  };
  const result = await apiRequest(SERVICE, `/customers/${customerId}/googleAds:searchStream`, {
    method: 'POST',
    body,
  });
  return result;
}

async function getInsights(flags) {
  const customerId = await getCustomerId();
  const metrics = flags.metrics
    ? flags.metrics.split(',').map((m) => `metrics.${m.trim()}`).join(', ')
    : 'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions';
  let query = `SELECT campaign.name, ${metrics} FROM campaign`;
  const conditions = [];
  if (flags['start-date']) {
    conditions.push(`segments.date >= '${flags['start-date']}'`);
  }
  if (flags['end-date']) {
    conditions.push(`segments.date <= '${flags['end-date']}'`);
  }
  if (conditions.length > 0) {
    query = `SELECT campaign.name, segments.date, ${metrics} FROM campaign WHERE ${conditions.join(' AND ')}`;
  }
  const body = { query };
  const result = await apiRequest(SERVICE, `/customers/${customerId}/googleAds:searchStream`, {
    method: 'POST',
    body,
  });
  return result;
}

async function search(flags, args) {
  // Accept query from --query flag or first positional arg after 'search'
  const query = flags.query || args.find((a) => !a.startsWith('--') && a !== 'search');
  if (!query) throw new Error('--query is required (raw GAQL query)');
  const customerId = await getCustomerId();
  const body = { query };
  const result = await apiRequest(SERVICE, `/customers/${customerId}/googleAds:searchStream`, {
    method: 'POST',
    body,
  });
  return result;
}

async function listRecommendations() {
  const customerId = await getCustomerId();
  const result = await apiRequest(SERVICE, `/customers/${customerId}/recommendations`);
  return result;
}

// --- CLI Router ---

const COMMANDS = {
  'test-auth': {
    fn: testAuth,
    desc: 'Test authentication (GET /customers/{customerId})',
  },
  'list-campaigns': {
    fn: listCampaigns,
    desc: 'List all campaigns',
  },
  'get-campaign': {
    fn: getCampaign,
    desc: 'Get campaign details (--id)',
  },
  'list-keywords': {
    fn: listKeywords,
    desc: 'List all keywords',
  },
  'get-insights': {
    fn: getInsights,
    desc: 'Get campaign insights [--start-date, --end-date, --metrics]',
  },
  'search': {
    fn: search,
    desc: 'Run raw GAQL query (--query or positional arg)',
  },
  'list-recommendations': {
    fn: listRecommendations,
    desc: 'List recommendations for account',
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
    const result = await COMMANDS[command].fn(flags, args.slice(1));
    success(result);
  } catch (err) {
    error(err);
  }
}

main();
