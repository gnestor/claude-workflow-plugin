#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { getCredentials } from '../../../lib/auth.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'quickbooks';

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

// --- Helpers ---

async function qboQuery(queryStr) {
  const result = await apiRequest(SERVICE, '/query', {
    params: { query: queryStr },
    headers: { 'Accept': 'application/json' },
  });
  return result;
}

function buildDateFilter(flags, fieldName) {
  const conditions = [];
  if (flags['start-date']) conditions.push(`${fieldName} >= '${flags['start-date']}'`);
  if (flags['end-date']) conditions.push(`${fieldName} <= '${flags['end-date']}'`);
  return conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
}

// --- Commands ---

async function testAuth() {
  const creds = await getCredentials(SERVICE);
  const realmId = creds.metadata.realm_id;
  if (!realmId) throw new Error('No realm_id found in credentials metadata');
  const result = await apiRequest(SERVICE, `/companyinfo/${realmId}`, {
    headers: { 'Accept': 'application/json' },
  });
  return result;
}

async function query(flags, args) {
  // Accept query as first positional arg after 'query' or via --query flag
  const queryStr = args[1] || flags.query;
  if (!queryStr) throw new Error('Query string is required. Usage: client.js query "SELECT * FROM Invoice" or --query "SELECT * FROM Invoice"');
  const result = await qboQuery(queryStr);
  return result;
}

async function listInvoices(flags) {
  const limit = flags.limit || '100';
  const dateFilter = buildDateFilter(flags, 'TxnDate');
  const queryStr = `SELECT * FROM Invoice${dateFilter} ORDERBY TxnDate DESC MAXRESULTS ${limit}`;
  const result = await qboQuery(queryStr);
  return result;
}

async function getInvoice(flags) {
  if (!flags.id) throw new Error('--id is required');
  const result = await apiRequest(SERVICE, `/invoice/${flags.id}`, {
    headers: { 'Accept': 'application/json' },
  });
  return result;
}

async function listExpenses(flags) {
  const limit = flags.limit || '100';
  const dateFilter = buildDateFilter(flags, 'TxnDate');
  const queryStr = `SELECT * FROM Purchase${dateFilter} ORDERBY TxnDate DESC MAXRESULTS ${limit}`;
  const result = await qboQuery(queryStr);
  return result;
}

async function listAccounts(flags) {
  let queryStr = 'SELECT * FROM Account';
  if (flags.type) {
    queryStr += ` WHERE AccountType = '${flags.type}'`;
  }
  const result = await qboQuery(queryStr);
  return result;
}

async function getReport(flags) {
  if (!flags.report) throw new Error('--report is required (e.g. ProfitAndLoss, BalanceSheet, CashFlow)');
  const params = {};
  if (flags['start-date']) params.start_date = flags['start-date'];
  if (flags['end-date']) params.end_date = flags['end-date'];
  if (flags['accounting-method']) params.accounting_method = flags['accounting-method'];
  const result = await apiRequest(SERVICE, `/reports/${flags.report}`, {
    params,
    headers: { 'Accept': 'application/json' },
  });
  return result;
}

// --- CLI Router ---

const COMMANDS = {
  'test-auth': { fn: testAuth, desc: 'Test authentication (GET /companyinfo/{realmId})' },
  'query': { fn: query, desc: 'Execute a QBO query (<query-string> or --query) e.g. "SELECT * FROM Invoice"', positional: true },
  'list-invoices': { fn: listInvoices, desc: 'List invoices [--limit, --start-date, --end-date]' },
  'get-invoice': { fn: getInvoice, desc: 'Get invoice by id (--id)' },
  'list-expenses': { fn: listExpenses, desc: 'List expenses/purchases [--limit, --start-date, --end-date]' },
  'list-accounts': { fn: listAccounts, desc: 'List chart of accounts [--type]' },
  'get-report': { fn: getReport, desc: 'Get a report (--report) [--start-date, --end-date, --accounting-method] Reports: ProfitAndLoss, BalanceSheet, CashFlow, GeneralLedger, TrialBalance' },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('QuickBooks CLI\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map(k => k.length));
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(maxLen + 2)}${desc}`);
  }
  console.log('\nExamples:');
  console.log('  client.js query "SELECT * FROM Invoice STARTPOSITION 1 MAXRESULTS 10"');
  console.log('  client.js list-invoices --start-date 2025-01-01 --end-date 2025-12-31');
  console.log('  client.js get-report --report ProfitAndLoss --start-date 2025-01-01 --end-date 2025-12-31');
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
    let result;
    if (COMMANDS[command].positional) {
      result = await COMMANDS[command].fn(flags, args.slice(1));
    } else {
      result = await COMMANDS[command].fn(flags);
    }
    success(result);
  } catch (err) {
    error(err);
  }
}

main();
