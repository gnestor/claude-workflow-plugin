#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'gorgias';

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

async function testAuth() {
  const result = await apiRequest(SERVICE, '/account');
  return result;
}

async function getAccount() {
  const result = await apiRequest(SERVICE, '/account');
  return result;
}

async function listTickets(flags) {
  const params = {};
  if (flags.status) params.status = flags.status;
  if (flags.channel) params.channel = flags.channel;
  if (flags.customer_email) {
    const customers = await apiRequest(SERVICE, `/customers${buildQuery({ email: flags.customer_email })}`);
    if (customers.data && customers.data.length > 0) {
      params.customer_id = customers.data[0].id;
    }
  }
  if (flags.assignee_user_id) params.assignee_user_id = flags.assignee_user_id;
  if (flags.created_after) params.created_datetime__gte = flags.created_after;
  if (flags.created_before) params.created_datetime__lte = flags.created_before;
  if (flags.updated_after) params.updated_datetime__gte = flags.updated_after;
  if (flags.limit) params.limit = flags.limit;
  if (flags.cursor) params.cursor = flags.cursor;
  const result = await apiRequest(SERVICE, `/tickets${buildQuery(params)}`);
  return result;
}

async function getTicket(flags) {
  if (!flags.id) throw new Error('--id is required');
  const ticket = await apiRequest(SERVICE, `/tickets/${flags.id}`);
  const messages = await apiRequest(SERVICE, `/tickets/${flags.id}/messages`);
  return { ...ticket, messages: messages.data || messages };
}

async function searchTickets(flags) {
  if (!flags.query) throw new Error('--query is required');
  const limit = flags.limit || 50;
  const tickets = await apiRequest(SERVICE, `/tickets${buildQuery({ limit })}`);
  const query = flags.query.toLowerCase();
  const data = tickets.data || tickets;
  const filtered = data.filter((t) => {
    const subject = (t.subject || '').toLowerCase();
    const excerpt = (t.excerpt || '').toLowerCase();
    const customerEmail = (t.customer?.email || '').toLowerCase();
    const customerName = (t.customer?.name || '').toLowerCase();
    return (
      subject.includes(query) ||
      excerpt.includes(query) ||
      customerEmail.includes(query) ||
      customerName.includes(query)
    );
  });
  return filtered;
}

async function createTicket(flags) {
  const body = {};
  if (flags.subject) body.subject = flags.subject;
  if (flags.channel) body.channel = flags.channel;
  if (flags.status) body.status = flags.status;
  if (flags.customer_email) body.customer = { email: flags.customer_email };
  if (flags.message) {
    body.messages = [
      {
        channel: flags.channel || 'email',
        via: 'api',
        source: { type: 'api' },
        body_html: flags.message,
      },
    ];
  }
  if (flags.assignee_user_id) body.assignee_user = { id: parseInt(flags.assignee_user_id, 10) };
  if (flags.json) Object.assign(body, JSON.parse(flags.json));
  const result = await apiRequest(SERVICE, '/tickets', { method: 'POST', body });
  return result;
}

async function updateTicket(flags) {
  if (!flags.id) throw new Error('--id is required');
  const body = {};
  if (flags.status) body.status = flags.status;
  if (flags.assignee_user_id) body.assignee_user = { id: parseInt(flags.assignee_user_id, 10) };
  if (flags.subject) body.subject = flags.subject;
  if (flags.priority) body.priority = flags.priority;
  if (flags.json) Object.assign(body, JSON.parse(flags.json));
  const result = await apiRequest(SERVICE, `/tickets/${flags.id}`, { method: 'PUT', body });
  return result;
}

async function addMessage(flags) {
  if (!flags['ticket-id']) throw new Error('--ticket-id is required');
  if (!flags.body) throw new Error('--body is required');
  const payload = {
    channel: flags.channel || 'internal-note',
    via: 'api',
    source: { type: 'api' },
    body_html: flags.body,
  };
  if (flags['from-agent'] === true || flags['from-agent'] === 'true') {
    payload.from_agent = true;
  }
  if (flags.json) Object.assign(payload, JSON.parse(flags.json));
  const result = await apiRequest(SERVICE, `/tickets/${flags['ticket-id']}/messages`, {
    method: 'POST',
    body: payload,
  });
  return result;
}

async function listMessages(flags) {
  if (!flags['ticket-id']) throw new Error('--ticket-id is required');
  const result = await apiRequest(SERVICE, `/tickets/${flags['ticket-id']}/messages`);
  return result;
}

async function getMessage(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/messages/${flags.id}`);
  return result;
}

async function listCustomers(flags) {
  const params = {};
  if (flags.email) params.email = flags.email;
  if (flags.limit) params.limit = flags.limit;
  if (flags.cursor) params.cursor = flags.cursor;
  const result = await apiRequest(SERVICE, `/customers${buildQuery(params)}`);
  return result;
}

async function getCustomer(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/customers/${flags.id}`);
  return result;
}

async function searchCustomers(flags) {
  if (!flags.email) throw new Error('--email is required');
  const result = await apiRequest(SERVICE, `/customers${buildQuery({ email: flags.email })}`);
  return result;
}

async function getCustomerTickets(flags) {
  if (!flags.id) throw new Error('--id is required');
  const limit = flags.limit || 30;
  const result = await apiRequest(
    SERVICE,
    `/tickets${buildQuery({ customer_id: flags.id, limit })}`,
  );
  return result;
}

async function updateCustomer(flags) {
  if (!flags.id) throw new Error('--id is required');
  const body = {};
  if (flags.name) body.name = flags.name;
  if (flags.email) body.email = flags.email;
  if (flags.note) body.note = flags.note;
  if (flags.json) Object.assign(body, JSON.parse(flags.json));
  const result = await apiRequest(SERVICE, `/customers/${flags.id}`, { method: 'PUT', body });
  return result;
}

async function mergeCustomers(flags) {
  if (!flags['target-id']) throw new Error('--target-id is required');
  if (!flags['source-ids']) throw new Error('--source-ids is required (comma-separated)');
  const sourceIds = flags['source-ids'].split(',').map((id) => parseInt(id.trim(), 10));
  const body = {
    target_customer_id: parseInt(flags['target-id'], 10),
    source_customer_ids: sourceIds,
  };
  const result = await apiRequest(SERVICE, '/customers/merge', { method: 'POST', body });
  return result;
}

async function listSurveys(flags) {
  const params = {};
  if (flags.created_after) params.created_datetime__gte = flags.created_after;
  if (flags.limit) params.limit = flags.limit;
  if (flags.cursor) params.cursor = flags.cursor;
  const result = await apiRequest(SERVICE, `/satisfaction-surveys${buildQuery(params)}`);
  return result;
}

async function getSurvey(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/satisfaction-surveys/${flags.id}`);
  return result;
}

async function listTags() {
  const result = await apiRequest(SERVICE, '/tags');
  return result;
}

async function createTag(flags) {
  if (!flags.name) throw new Error('--name is required');
  const body = { name: flags.name };
  if (flags.decoration) {
    try {
      body.decoration = JSON.parse(flags.decoration);
    } catch {
      body.decoration = { emoji: flags.decoration };
    }
  }
  if (flags.json) Object.assign(body, JSON.parse(flags.json));
  const result = await apiRequest(SERVICE, '/tags', { method: 'POST', body });
  return result;
}

async function deleteTag(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/tags/${flags.id}`, { method: 'DELETE' });
  return result;
}

async function addTag(flags) {
  if (!flags['ticket-id']) throw new Error('--ticket-id is required');
  if (!flags.tag) throw new Error('--tag is required');
  const ticket = await apiRequest(SERVICE, `/tickets/${flags['ticket-id']}`);
  const tags = ticket.tags || [];
  const tagName = flags.tag;
  const alreadyExists = tags.some(
    (t) => (typeof t === 'string' ? t : t.name) === tagName,
  );
  if (alreadyExists) {
    return { message: `Tag "${tagName}" already exists on ticket ${flags['ticket-id']}`, ticket };
  }
  tags.push({ name: tagName });
  const result = await apiRequest(SERVICE, `/tickets/${flags['ticket-id']}`, {
    method: 'PUT',
    body: { tags },
  });
  return result;
}

async function removeTag(flags) {
  if (!flags['ticket-id']) throw new Error('--ticket-id is required');
  if (!flags.tag) throw new Error('--tag is required');
  const ticket = await apiRequest(SERVICE, `/tickets/${flags['ticket-id']}`);
  const tags = ticket.tags || [];
  const tagName = flags.tag;
  const filtered = tags.filter(
    (t) => (typeof t === 'string' ? t : t.name) !== tagName,
  );
  if (filtered.length === tags.length) {
    return { message: `Tag "${tagName}" not found on ticket ${flags['ticket-id']}`, ticket };
  }
  const result = await apiRequest(SERVICE, `/tickets/${flags['ticket-id']}`, {
    method: 'PUT',
    body: { tags: filtered },
  });
  return result;
}

async function listUsers() {
  const result = await apiRequest(SERVICE, '/users');
  return result;
}

async function getUser(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/users/${flags.id}`);
  return result;
}

async function listTeams() {
  const result = await apiRequest(SERVICE, '/teams');
  return result;
}

async function listViews() {
  const result = await apiRequest(SERVICE, '/views');
  return result;
}

async function listMacros() {
  const result = await apiRequest(SERVICE, '/macros');
  return result;
}

async function getMacro(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/macros/${flags.id}`);
  return result;
}

async function listIntegrations() {
  const result = await apiRequest(SERVICE, '/integrations');
  return result;
}

// --- CLI Router ---

const COMMANDS = {
  'test-auth': { fn: testAuth, desc: 'Test authentication (GET /account)' },
  'get-account': { fn: getAccount, desc: 'Get account info (GET /account)' },
  'list-tickets': {
    fn: listTickets,
    desc: 'List tickets [--status, --channel, --customer_email, --assignee_user_id, --created_after, --created_before, --updated_after, --limit, --cursor]',
  },
  'get-ticket': { fn: getTicket, desc: 'Get ticket with messages (--id)' },
  'search-tickets': { fn: searchTickets, desc: 'Search tickets client-side (--query, [--limit])' },
  'create-ticket': {
    fn: createTicket,
    desc: 'Create ticket [--subject, --channel, --status, --customer_email, --message, --assignee_user_id, --json]',
  },
  'update-ticket': {
    fn: updateTicket,
    desc: 'Update ticket (--id) [--status, --assignee_user_id, --subject, --priority, --json]',
  },
  'add-message': {
    fn: addMessage,
    desc: 'Add message to ticket (--ticket-id, --body) [--channel, --from-agent, --json]',
  },
  'list-messages': { fn: listMessages, desc: 'List messages for ticket (--ticket-id)' },
  'get-message': { fn: getMessage, desc: 'Get message by id (--id)' },
  'list-customers': { fn: listCustomers, desc: 'List customers [--email, --limit, --cursor]' },
  'get-customer': { fn: getCustomer, desc: 'Get customer by id (--id)' },
  'search-customers': { fn: searchCustomers, desc: 'Search customers by email (--email)' },
  'get-customer-tickets': {
    fn: getCustomerTickets,
    desc: 'Get tickets for customer (--id) [--limit]',
  },
  'update-customer': {
    fn: updateCustomer,
    desc: 'Update customer (--id) [--name, --email, --note, --json]',
  },
  'merge-customers': {
    fn: mergeCustomers,
    desc: 'Merge customers (--target-id, --source-ids comma-separated)',
  },
  'list-surveys': {
    fn: listSurveys,
    desc: 'List satisfaction surveys [--created_after, --limit, --cursor]',
  },
  'get-survey': { fn: getSurvey, desc: 'Get satisfaction survey by id (--id)' },
  'list-tags': { fn: listTags, desc: 'List all tags' },
  'create-tag': { fn: createTag, desc: 'Create tag (--name) [--decoration, --json]' },
  'delete-tag': { fn: deleteTag, desc: 'Delete tag (--id)' },
  'add-tag': { fn: addTag, desc: 'Add tag to ticket (--ticket-id, --tag)' },
  'remove-tag': { fn: removeTag, desc: 'Remove tag from ticket (--ticket-id, --tag)' },
  'list-users': { fn: listUsers, desc: 'List all users' },
  'get-user': { fn: getUser, desc: 'Get user by id (--id)' },
  'list-teams': { fn: listTeams, desc: 'List all teams' },
  'list-views': { fn: listViews, desc: 'List all views' },
  'list-macros': { fn: listMacros, desc: 'List all macros' },
  'get-macro': { fn: getMacro, desc: 'Get macro by id (--id)' },
  'list-integrations': { fn: listIntegrations, desc: 'List all integrations' },
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
