#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'klaviyo';

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
  const result = await apiRequest(SERVICE, '/accounts/');
  return result;
}

async function getAccount() {
  const result = await apiRequest(SERVICE, '/accounts/');
  return result;
}

async function listCampaigns(flags) {
  const params = {
    'filter': "equals(messages.channel,'email')",
    'sort': flags.sort || '-created_at',
  };
  if (flags.status) {
    params['filter'] += `,equals(status,'${flags.status}')`;
  }
  if (flags.limit) params['page[size]'] = flags.limit;
  const result = await apiRequest(SERVICE, '/campaigns/', { params });
  return result;
}

async function getCampaign(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/campaigns/${flags.id}/`);
  return result;
}

async function getCampaignReport(flags) {
  if (!flags['campaign-id']) throw new Error('--campaign-id is required');
  const attributes = {
    statistics: [
      'average_order_value', 'bounce_rate', 'bounced', 'click_rate', 'clicked',
      'conversion_rate', 'conversion_value', 'conversions', 'delivered',
      'delivery_rate', 'failed', 'failed_rate', 'open_rate', 'opened',
      'recipients', 'revenue_per_recipient', 'spam_complaint_rate',
      'spam_complaints', 'unsubscribe_rate', 'unsubscribed',
    ],
    filter: `equals(campaign_id,"${flags['campaign-id']}")`,
    timeframe: {},
  };
  if (flags['start-date']) attributes.timeframe.start = flags['start-date'];
  if (flags['end-date']) attributes.timeframe.end = flags['end-date'];
  if (!attributes.timeframe.start && !attributes.timeframe.end) {
    delete attributes.timeframe;
  }
  const body = {
    data: {
      type: 'campaign-values-report',
      attributes,
    },
  };
  const result = await apiRequest(SERVICE, '/campaign-values-reports/', { method: 'POST', body });
  return result;
}

async function listFlows() {
  const result = await apiRequest(SERVICE, '/flows/');
  return result;
}

async function getFlow(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/flows/${flags.id}/`, {
    params: { include: 'flow-actions' },
  });
  return result;
}

async function getFlowReport(flags) {
  if (!flags['flow-id']) throw new Error('--flow-id is required');
  const attributes = {
    statistics: [
      'average_order_value', 'bounce_rate', 'bounced', 'click_rate', 'clicked',
      'conversion_rate', 'conversion_value', 'conversions', 'delivered',
      'delivery_rate', 'open_rate', 'opened', 'recipients',
      'revenue_per_recipient', 'unsubscribe_rate', 'unsubscribed',
    ],
    filter: `equals(flow_id,"${flags['flow-id']}")`,
    timeframe: {},
  };
  if (flags['start-date']) attributes.timeframe.start = flags['start-date'];
  if (flags['end-date']) attributes.timeframe.end = flags['end-date'];
  if (!attributes.timeframe.start && !attributes.timeframe.end) {
    delete attributes.timeframe;
  }
  const body = {
    data: {
      type: 'flow-values-report',
      attributes,
    },
  };
  const result = await apiRequest(SERVICE, '/flow-values-reports/', { method: 'POST', body });
  return result;
}

async function listProfiles(flags) {
  const params = { sort: '-created' };
  if (flags.limit) params['page[size]'] = flags.limit;
  if (flags.cursor) params['page[cursor]'] = flags.cursor;
  const result = await apiRequest(SERVICE, '/profiles/', { params });
  return result;
}

async function getProfile(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/profiles/${flags.id}/`);
  return result;
}

async function createProfile(flags) {
  if (!flags.email) throw new Error('--email is required');
  const attributes = { email: flags.email };
  if (flags['first-name']) attributes.first_name = flags['first-name'];
  if (flags['last-name']) attributes.last_name = flags['last-name'];
  if (flags.phone) attributes.phone_number = flags.phone;
  if (flags.title) attributes.title = flags.title;
  if (flags.organization) attributes.organization = flags.organization;
  if (flags.json) Object.assign(attributes, JSON.parse(flags.json));
  const body = {
    data: {
      type: 'profile',
      attributes,
    },
  };
  const result = await apiRequest(SERVICE, '/profiles/', { method: 'POST', body });
  return result;
}

async function updateProfile(flags) {
  if (!flags.id) throw new Error('--id is required');
  const attributes = {};
  if (flags.email) attributes.email = flags.email;
  if (flags['first-name']) attributes.first_name = flags['first-name'];
  if (flags['last-name']) attributes.last_name = flags['last-name'];
  if (flags.phone) attributes.phone_number = flags.phone;
  if (flags.title) attributes.title = flags.title;
  if (flags.organization) attributes.organization = flags.organization;
  if (flags.json) Object.assign(attributes, JSON.parse(flags.json));
  const body = {
    data: {
      type: 'profile',
      id: flags.id,
      attributes,
    },
  };
  const result = await apiRequest(SERVICE, `/profiles/${flags.id}/`, { method: 'PATCH', body });
  return result;
}

async function subscribe(flags) {
  if (!flags['list-id']) throw new Error('--list-id is required');
  if (!flags.email) throw new Error('--email is required');
  const emails = flags.email.split(',').map(e => e.trim());
  const profiles = emails.map(email => ({ type: 'profile', attributes: { email } }));
  const body = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        profiles: { data: profiles },
      },
      relationships: {
        list: {
          data: { type: 'list', id: flags['list-id'] },
        },
      },
    },
  };
  const result = await apiRequest(SERVICE, '/profile-subscription-bulk-create-jobs/', { method: 'POST', body });
  return result;
}

async function unsubscribe(flags) {
  if (!flags['list-id']) throw new Error('--list-id is required');
  if (!flags.email) throw new Error('--email is required');
  const emails = flags.email.split(',').map(e => e.trim());
  const profiles = emails.map(email => ({ type: 'profile', attributes: { email } }));
  const body = {
    data: {
      type: 'profile-subscription-bulk-delete-job',
      attributes: {
        profiles: { data: profiles },
      },
      relationships: {
        list: {
          data: { type: 'list', id: flags['list-id'] },
        },
      },
    },
  };
  const result = await apiRequest(SERVICE, '/profile-subscription-bulk-delete-jobs/', { method: 'POST', body });
  return result;
}

async function listLists() {
  const result = await apiRequest(SERVICE, '/lists/');
  return result;
}

async function getList(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/lists/${flags.id}/`);
  return result;
}

async function listSegments() {
  const result = await apiRequest(SERVICE, '/segments/');
  return result;
}

async function getSegment(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/segments/${flags.id}/`);
  return result;
}

async function listMetrics() {
  const result = await apiRequest(SERVICE, '/metrics/');
  return result;
}

async function getMetric(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/metrics/${flags.id}/`);
  return result;
}

async function queryMetricAggregates(flags) {
  if (!flags['metric-id']) throw new Error('--metric-id is required');
  if (!flags.measurements) throw new Error('--measurements is required (comma-separated, e.g. count,sum_value)');
  const measurements = flags.measurements.split(',').map(m => m.trim());
  const attributes = {
    metric_id: flags['metric-id'],
    measurements,
  };
  if (flags['start-date'] || flags['end-date']) {
    attributes.filter = [];
    if (flags['start-date']) {
      attributes.filter.push(`greater-or-equal(datetime,${flags['start-date']})`);
    }
    if (flags['end-date']) {
      attributes.filter.push(`less-than(datetime,${flags['end-date']})`);
    }
  }
  if (flags.interval) attributes.interval = flags.interval;
  if (flags['group-by']) attributes.by = flags['group-by'].split(',').map(g => g.trim());
  if (flags.json) Object.assign(attributes, JSON.parse(flags.json));
  const body = {
    data: {
      type: 'metric-aggregate',
      attributes,
    },
  };
  const result = await apiRequest(SERVICE, '/metric-aggregates/', { method: 'POST', body });
  return result;
}

async function getEvents(flags) {
  const params = { sort: '-datetime' };
  if (flags.limit) params['page[size]'] = flags.limit;
  if (flags['metric-id']) {
    params['filter'] = `equals(metric_id,"${flags['metric-id']}")`;
  }
  const result = await apiRequest(SERVICE, '/events/', { params });
  return result;
}

async function listCatalogItems() {
  const result = await apiRequest(SERVICE, '/catalog-items/');
  return result;
}

async function getEmailTemplate(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/templates/${flags.id}/`);
  return result;
}

async function createEmailTemplate(flags) {
  if (!flags.name) throw new Error('--name is required');
  if (!flags.html) throw new Error('--html is required');
  const body = {
    data: {
      type: 'template',
      attributes: {
        name: flags.name,
        html: flags.html,
      },
    },
  };
  const result = await apiRequest(SERVICE, '/templates/', { method: 'POST', body });
  return result;
}

async function assignTemplate(flags) {
  if (!flags['message-id']) throw new Error('--message-id is required');
  if (!flags['template-id']) throw new Error('--template-id is required');
  const body = {
    data: {
      type: 'campaign-message',
      id: flags['message-id'],
      relationships: {
        template: {
          data: { type: 'template', id: flags['template-id'] },
        },
      },
    },
  };
  const result = await apiRequest(SERVICE, `/campaign-messages/${flags['message-id']}/`, { method: 'PATCH', body });
  return result;
}

async function uploadImage(flags) {
  if (!flags['image-url']) throw new Error('--image-url is required');
  const body = {
    data: {
      type: 'image',
      attributes: {
        import_from_url: flags['image-url'],
      },
    },
  };
  const result = await apiRequest(SERVICE, '/image-upload/', { method: 'POST', body });
  return result;
}

// --- CLI Router ---

const COMMANDS = {
  'test-auth': { fn: testAuth, desc: 'Test authentication (GET /accounts/)' },
  'get-account': { fn: getAccount, desc: 'Get account info' },
  'list-campaigns': { fn: listCampaigns, desc: 'List email campaigns [--status, --sort, --limit]' },
  'get-campaign': { fn: getCampaign, desc: 'Get campaign by id (--id)' },
  'get-campaign-report': { fn: getCampaignReport, desc: 'Get campaign performance report (--campaign-id) [--start-date, --end-date]' },
  'list-flows': { fn: listFlows, desc: 'List all flows' },
  'get-flow': { fn: getFlow, desc: 'Get flow with actions (--id)' },
  'get-flow-report': { fn: getFlowReport, desc: 'Get flow performance report (--flow-id) [--start-date, --end-date]' },
  'list-profiles': { fn: listProfiles, desc: 'List profiles [--limit, --cursor]' },
  'get-profile': { fn: getProfile, desc: 'Get profile by id (--id)' },
  'create-profile': { fn: createProfile, desc: 'Create profile (--email) [--first-name, --last-name, --phone, --title, --organization, --json]' },
  'update-profile': { fn: updateProfile, desc: 'Update profile (--id) [--email, --first-name, --last-name, --phone, --title, --organization, --json]' },
  'subscribe': { fn: subscribe, desc: 'Subscribe profiles to list (--list-id, --email comma-separated)' },
  'unsubscribe': { fn: unsubscribe, desc: 'Unsubscribe profiles from list (--list-id, --email comma-separated)' },
  'list-lists': { fn: listLists, desc: 'List all lists' },
  'get-list': { fn: getList, desc: 'Get list by id (--id)' },
  'list-segments': { fn: listSegments, desc: 'List all segments' },
  'get-segment': { fn: getSegment, desc: 'Get segment by id (--id)' },
  'list-metrics': { fn: listMetrics, desc: 'List all metrics' },
  'get-metric': { fn: getMetric, desc: 'Get metric by id (--id)' },
  'query-metric-aggregates': { fn: queryMetricAggregates, desc: 'Query metric aggregates (--metric-id, --measurements) [--start-date, --end-date, --interval, --group-by, --json]' },
  'get-events': { fn: getEvents, desc: 'Get events [--limit, --metric-id]' },
  'list-catalog-items': { fn: listCatalogItems, desc: 'List catalog items' },
  'get-email-template': { fn: getEmailTemplate, desc: 'Get email template (--id)' },
  'create-email-template': { fn: createEmailTemplate, desc: 'Create email template (--name, --html)' },
  'assign-template': { fn: assignTemplate, desc: 'Assign template to campaign message (--message-id, --template-id)' },
  'upload-image': { fn: uploadImage, desc: 'Upload image from URL (--image-url)' },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Klaviyo CLI\n');
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
