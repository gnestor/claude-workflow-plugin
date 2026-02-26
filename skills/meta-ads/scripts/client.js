#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { getCredentials } from '../../../lib/auth.js';
import { success, error } from '../../../lib/output.js';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const SERVICE = 'meta-ads';

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

async function getAdAccountId() {
  const creds = await getCredentials(SERVICE);
  const adAccountId = creds.metadata?.ad_account_id;
  if (!adAccountId) {
    throw new Error('ad_account_id not found in credentials metadata. Set it during auth setup.');
  }
  return adAccountId;
}

// --- Commands ---

async function testAuth() {
  const result = await apiRequest(SERVICE, '/me');
  return result;
}

async function getAccountInfo() {
  const adAccountId = await getAdAccountId();
  const result = await apiRequest(SERVICE, `/${adAccountId}?fields=id,name,account_status,currency,timezone_name,business_name,amount_spent,balance`);
  return result;
}

async function listCampaigns(flags) {
  const adAccountId = await getAdAccountId();
  const limit = flags.limit || 25;
  const result = await apiRequest(SERVICE, `/${adAccountId}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time&limit=${limit}`);
  return result;
}

async function getCampaign(flags) {
  if (!flags['campaign-id']) throw new Error('--campaign-id is required');
  const result = await apiRequest(SERVICE, `/${flags['campaign-id']}?fields=id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time,start_time,stop_time`);
  return result;
}

async function createCampaign(flags) {
  const adAccountId = await getAdAccountId();
  if (!flags.name) throw new Error('--name is required');
  if (!flags.objective) throw new Error('--objective is required');
  const body = {
    name: flags.name,
    objective: flags.objective,
    status: flags.status || 'PAUSED',
    special_ad_categories: flags['special-ad-categories'] ? flags['special-ad-categories'].split(',') : [],
  };
  // Note: daily_budget is in cents
  if (flags['daily-budget']) body.daily_budget = flags['daily-budget'];
  const result = await apiRequest(SERVICE, `/${adAccountId}/campaigns`, {
    method: 'POST',
    body,
  });
  return result;
}

async function updateCampaign(flags) {
  if (!flags['campaign-id']) throw new Error('--campaign-id is required');
  const body = {};
  if (flags.name) body.name = flags.name;
  if (flags.objective) body.objective = flags.objective;
  if (flags['daily-budget']) body.daily_budget = flags['daily-budget'];
  if (flags['lifetime-budget']) body.lifetime_budget = flags['lifetime-budget'];
  const result = await apiRequest(SERVICE, `/${flags['campaign-id']}`, {
    method: 'POST',
    body,
  });
  return result;
}

async function updateCampaignStatus(flags) {
  if (!flags['campaign-id']) throw new Error('--campaign-id is required');
  if (!flags.status) throw new Error('--status is required (ACTIVE/PAUSED/ARCHIVED)');
  const result = await apiRequest(SERVICE, `/${flags['campaign-id']}`, {
    method: 'POST',
    body: { status: flags.status },
  });
  return result;
}

async function listAdsets(flags) {
  const adAccountId = await getAdAccountId();
  const limit = flags.limit || 25;
  let path = `/${adAccountId}/adsets?fields=id,name,campaign_id,status,daily_budget,lifetime_budget,targeting,billing_event,optimization_goal,start_time,end_time&limit=${limit}`;
  if (flags['campaign-id']) {
    path += `&filtering=[{"field":"campaign_id","operator":"EQUAL","value":"${flags['campaign-id']}"}]`;
  }
  const result = await apiRequest(SERVICE, path);
  return result;
}

async function getAdset(flags) {
  if (!flags['adset-id']) throw new Error('--adset-id is required');
  const result = await apiRequest(SERVICE, `/${flags['adset-id']}?fields=id,name,campaign_id,status,daily_budget,lifetime_budget,targeting,billing_event,optimization_goal`);
  return result;
}

async function createAdset(flags) {
  const adAccountId = await getAdAccountId();
  if (!flags.body) throw new Error('--body is required (JSON string)');
  const body = JSON.parse(flags.body);
  const result = await apiRequest(SERVICE, `/${adAccountId}/adsets`, {
    method: 'POST',
    body,
  });
  return result;
}

async function updateAdset(flags) {
  if (!flags['adset-id']) throw new Error('--adset-id is required');
  if (!flags.body) throw new Error('--body is required (JSON string)');
  const body = JSON.parse(flags.body);
  const result = await apiRequest(SERVICE, `/${flags['adset-id']}`, {
    method: 'POST',
    body,
  });
  return result;
}

async function updateAdsetBudget(flags) {
  if (!flags['adset-id']) throw new Error('--adset-id is required');
  // Note: budgets are in cents
  const body = {};
  if (flags['daily-budget']) body.daily_budget = flags['daily-budget'];
  if (flags['lifetime-budget']) body.lifetime_budget = flags['lifetime-budget'];
  if (!body.daily_budget && !body.lifetime_budget) {
    throw new Error('--daily-budget or --lifetime-budget is required (value in cents)');
  }
  const result = await apiRequest(SERVICE, `/${flags['adset-id']}`, {
    method: 'POST',
    body,
  });
  return result;
}

async function updateAdsetStatus(flags) {
  if (!flags['adset-id']) throw new Error('--adset-id is required');
  if (!flags.status) throw new Error('--status is required (ACTIVE/PAUSED/ARCHIVED)');
  const result = await apiRequest(SERVICE, `/${flags['adset-id']}`, {
    method: 'POST',
    body: { status: flags.status },
  });
  return result;
}

async function listAds(flags) {
  const adAccountId = await getAdAccountId();
  const limit = flags.limit || 25;
  let path = `/${adAccountId}/ads?fields=id,name,adset_id,campaign_id,status,created_time,creative{id,name,title,body,image_url,link_url}&limit=${limit}`;
  if (flags['adset-id']) {
    path += `&filtering=[{"field":"adset_id","operator":"EQUAL","value":"${flags['adset-id']}"}]`;
  } else if (flags['campaign-id']) {
    path += `&filtering=[{"field":"campaign_id","operator":"EQUAL","value":"${flags['campaign-id']}"}]`;
  }
  const result = await apiRequest(SERVICE, path);
  return result;
}

async function getAd(flags) {
  if (!flags['ad-id']) throw new Error('--ad-id is required');
  const result = await apiRequest(SERVICE, `/${flags['ad-id']}?fields=id,name,adset_id,campaign_id,status,creative{id,name,title,body,image_url,link_url,thumbnail_url}`);
  return result;
}

async function createAd(flags) {
  const adAccountId = await getAdAccountId();
  if (!flags.name) throw new Error('--name is required');
  if (!flags['adset-id']) throw new Error('--adset-id is required');
  if (!flags['creative-id']) throw new Error('--creative-id is required');
  const body = {
    name: flags.name,
    adset_id: flags['adset-id'],
    creative: { creative_id: flags['creative-id'] },
    status: flags.status || 'PAUSED',
  };
  const result = await apiRequest(SERVICE, `/${adAccountId}/ads`, {
    method: 'POST',
    body,
  });
  return result;
}

async function updateAdStatus(flags) {
  if (!flags['ad-id']) throw new Error('--ad-id is required');
  if (!flags.status) throw new Error('--status is required (ACTIVE/PAUSED/ARCHIVED)');
  const result = await apiRequest(SERVICE, `/${flags['ad-id']}`, {
    method: 'POST',
    body: { status: flags.status },
  });
  return result;
}

async function listCreatives(flags) {
  const adAccountId = await getAdAccountId();
  const limit = flags.limit || 25;
  const result = await apiRequest(SERVICE, `/${adAccountId}/adcreatives?fields=id,name,title,body,image_url,link_url,thumbnail_url&limit=${limit}`);
  return result;
}

async function getCreative(flags) {
  if (!flags['creative-id']) throw new Error('--creative-id is required');
  const result = await apiRequest(SERVICE, `/${flags['creative-id']}?fields=id,name,title,body,image_url,link_url,thumbnail_url,object_story_spec`);
  return result;
}

async function createCreative(flags) {
  const adAccountId = await getAdAccountId();
  if (!flags.body) throw new Error('--body is required (JSON string)');
  const body = JSON.parse(flags.body);
  const result = await apiRequest(SERVICE, `/${adAccountId}/adcreatives`, {
    method: 'POST',
    body,
  });
  return result;
}

async function listAudiences(flags) {
  const adAccountId = await getAdAccountId();
  const limit = flags.limit || 25;
  const result = await apiRequest(SERVICE, `/${adAccountId}/customaudiences?fields=id,name,description,approximate_count,subtype&limit=${limit}`);
  return result;
}

async function getAudience(flags) {
  if (!flags['audience-id']) throw new Error('--audience-id is required');
  const result = await apiRequest(SERVICE, `/${flags['audience-id']}?fields=id,name,description,approximate_count,subtype,rule`);
  return result;
}

async function getInsights(flags) {
  const objectId = flags['object-id'] || await getAdAccountId();
  const fields = flags.fields || 'impressions,clicks,spend,cpc,cpm,ctr,actions';
  const params = { fields };
  if (flags['start-date'] && flags['end-date']) {
    params.time_range = JSON.stringify({
      since: flags['start-date'],
      until: flags['end-date'],
    });
  }
  if (flags.level) params.level = flags.level;
  if (flags['time-increment']) params.time_increment = flags['time-increment'];
  const result = await apiRequest(SERVICE, `/${objectId}/insights${buildQuery(params)}`);
  return result;
}

async function adLibrarySearch(flags) {
  if (!flags['search-terms']) throw new Error('--search-terms is required');
  const countries = flags.countries || 'US';
  const limit = flags.limit || 25;
  const result = await apiRequest(SERVICE, `/ads_archive${buildQuery({
    search_terms: flags['search-terms'],
    ad_reached_countries: `["${countries.split(',').join('","')}"]`,
    ad_type: 'ALL',
    fields: 'id,page_id,page_name,ad_snapshot_url,ad_delivery_start_time,impressions',
    limit,
  })}`);
  return result;
}

async function uploadImage(flags) {
  if (!flags['file-path']) throw new Error('--file-path is required');
  const adAccountId = await getAdAccountId();
  const creds = await getCredentials(SERVICE);
  const fileContent = await readFile(flags['file-path']);
  const fileName = basename(flags['file-path']);

  const formData = new FormData();
  formData.append('filename', new Blob([fileContent]), fileName);

  // Build URL with auth query params
  const baseUrl = creds.baseUrl;
  let url = `${baseUrl}/${adAccountId}/adimages`;
  if (Object.keys(creds.queryParams).length > 0) {
    const params = new URLSearchParams(creds.queryParams);
    url = `${url}?${params}`;
  }

  const headers = { ...creds.headers };
  delete headers['Content-Type'];

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${text}`);
  }

  const result = await res.json();
  return result;
}

// --- CLI Router ---

const COMMANDS = {
  'test-auth': {
    fn: testAuth,
    desc: 'Test authentication (GET /me)',
  },
  'get-account-info': {
    fn: getAccountInfo,
    desc: 'Get ad account info',
  },
  'list-campaigns': {
    fn: listCampaigns,
    desc: 'List campaigns [--limit]',
  },
  'get-campaign': {
    fn: getCampaign,
    desc: 'Get campaign details (--campaign-id)',
  },
  'create-campaign': {
    fn: createCampaign,
    desc: 'Create campaign (--name, --objective) [--status, --daily-budget (cents), --special-ad-categories]',
  },
  'update-campaign': {
    fn: updateCampaign,
    desc: 'Update campaign (--campaign-id) [--name, --objective, --daily-budget, --lifetime-budget]',
  },
  'update-campaign-status': {
    fn: updateCampaignStatus,
    desc: 'Update campaign status (--campaign-id, --status ACTIVE/PAUSED/ARCHIVED)',
  },
  'list-adsets': {
    fn: listAdsets,
    desc: 'List ad sets [--limit, --campaign-id]',
  },
  'get-adset': {
    fn: getAdset,
    desc: 'Get ad set details (--adset-id)',
  },
  'create-adset': {
    fn: createAdset,
    desc: 'Create ad set (--body JSON string)',
  },
  'update-adset': {
    fn: updateAdset,
    desc: 'Update ad set (--adset-id, --body JSON string)',
  },
  'update-adset-budget': {
    fn: updateAdsetBudget,
    desc: 'Update ad set budget (--adset-id) --daily-budget or --lifetime-budget (cents)',
  },
  'update-adset-status': {
    fn: updateAdsetStatus,
    desc: 'Update ad set status (--adset-id, --status ACTIVE/PAUSED/ARCHIVED)',
  },
  'list-ads': {
    fn: listAds,
    desc: 'List ads [--limit, --adset-id, --campaign-id]',
  },
  'get-ad': {
    fn: getAd,
    desc: 'Get ad details (--ad-id)',
  },
  'create-ad': {
    fn: createAd,
    desc: 'Create ad (--name, --adset-id, --creative-id) [--status]',
  },
  'update-ad-status': {
    fn: updateAdStatus,
    desc: 'Update ad status (--ad-id, --status ACTIVE/PAUSED/ARCHIVED)',
  },
  'list-creatives': {
    fn: listCreatives,
    desc: 'List ad creatives [--limit]',
  },
  'get-creative': {
    fn: getCreative,
    desc: 'Get creative details (--creative-id)',
  },
  'create-creative': {
    fn: createCreative,
    desc: 'Create ad creative (--body JSON string)',
  },
  'list-audiences': {
    fn: listAudiences,
    desc: 'List custom audiences [--limit]',
  },
  'get-audience': {
    fn: getAudience,
    desc: 'Get audience details (--audience-id)',
  },
  'get-insights': {
    fn: getInsights,
    desc: 'Get insights [--object-id, --fields, --start-date, --end-date, --level, --time-increment]',
  },
  'ad-library-search': {
    fn: adLibrarySearch,
    desc: 'Search ad library (--search-terms) [--countries comma-sep, --limit]',
  },
  'upload-image': {
    fn: uploadImage,
    desc: 'Upload ad image (--file-path)',
  },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(maxLen + 2)}${desc}`);
  }
  console.log('\nNote: All budget values (daily_budget, lifetime_budget) are in cents.');
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
