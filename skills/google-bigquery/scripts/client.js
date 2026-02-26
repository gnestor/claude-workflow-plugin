#!/usr/bin/env node

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { apiRequest } from '../../../lib/http.js';
import { getCredentials } from '../../../lib/auth.js';
import { success, error } from '../../../lib/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMAS_DIR = join(__dirname, '..', 'references', 'schemas');

const SERVICE = 'google-bigquery';
const BQ_BASE = 'https://bigquery.googleapis.com/bigquery/v2';

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

function parseRows(schema, rows) {
  return (rows || []).map(row => {
    const obj = {};
    schema.fields.forEach((field, i) => {
      obj[field.name] = row.f[i].v;
    });
    return obj;
  });
}

async function getProject() {
  const creds = await getCredentials(SERVICE);
  return creds.metadata.cloud_project;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Commands ---

async function listDatasets() {
  const project = await getProject();
  const result = await apiRequest(SERVICE, `/projects/${project}/datasets`, {
    baseUrl: BQ_BASE,
  });
  return result;
}

async function listTables(flags) {
  if (!flags.dataset) throw new Error('--dataset is required');
  const project = await getProject();
  const result = await apiRequest(
    SERVICE,
    `/projects/${project}/datasets/${flags.dataset}/tables`,
    { baseUrl: BQ_BASE },
  );
  return result;
}

async function getSchema(flags) {
  if (!flags.dataset) throw new Error('--dataset is required');
  if (!flags.table) throw new Error('--table is required');
  const project = await getProject();
  const result = await apiRequest(
    SERVICE,
    `/projects/${project}/datasets/${flags.dataset}/tables/${flags.table}`,
    { baseUrl: BQ_BASE },
  );
  return result;
}

async function query(flags, positionalArgs) {
  const sql = positionalArgs[0];
  if (!sql) throw new Error('SQL query is required as the first positional argument after "query"');
  const project = await getProject();
  const maxResults = flags.limit ? parseInt(flags.limit, 10) : 1000;

  const body = {
    query: sql,
    useLegacySql: false,
    maxResults,
  };

  const result = await apiRequest(SERVICE, `/projects/${project}/queries`, {
    baseUrl: BQ_BASE,
    method: 'POST',
    body,
  });

  // Poll for completion if job is not done
  let response = result;
  if (!response.jobComplete) {
    const jobId = response.jobReference.jobId;
    const maxWaitMs = 5 * 60 * 1000; // 5 minutes
    const pollIntervalMs = 2000;
    const startTime = Date.now();

    while (!response.jobComplete) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error(`Query timed out after 5 minutes. Job ID: ${jobId}`);
      }
      await sleep(pollIntervalMs);
      response = await apiRequest(
        SERVICE,
        `/projects/${project}/queries/${jobId}?maxResults=1000`,
        { baseUrl: BQ_BASE },
      );
    }
  }

  // Parse rows using schema
  if (response.schema && response.rows) {
    const parsed = parseRows(response.schema, response.rows);
    return {
      totalRows: response.totalRows,
      schema: response.schema,
      rows: parsed,
    };
  }

  return response;
}

async function scanAllSchemas() {
  await mkdir(SCHEMAS_DIR, { recursive: true });
  const project = await getProject();

  const datasetsResult = await apiRequest(SERVICE, `/projects/${project}/datasets`, {
    baseUrl: BQ_BASE,
  });
  const datasets = datasetsResult.datasets || [];
  const savedFiles = [];

  for (const ds of datasets) {
    const datasetId = ds.datasetReference.datasetId;

    const tablesResult = await apiRequest(
      SERVICE,
      `/projects/${project}/datasets/${datasetId}/tables`,
      { baseUrl: BQ_BASE },
    );
    const tables = tablesResult.tables || [];

    for (const tbl of tables) {
      const tableId = tbl.tableReference.tableId;

      const tableInfo = await apiRequest(
        SERVICE,
        `/projects/${project}/datasets/${datasetId}/tables/${tableId}`,
        { baseUrl: BQ_BASE },
      );

      const schema = {
        project,
        dataset: datasetId,
        table: tableId,
        type: tbl.type,
        schema: tableInfo.schema,
        numRows: tableInfo.numRows,
        numBytes: tableInfo.numBytes,
      };

      const fileName = `${datasetId}_${tableId}.json`;
      await writeFile(join(SCHEMAS_DIR, fileName), JSON.stringify(schema, null, 2));
      savedFiles.push({ dataset: datasetId, table: tableId });
    }
  }

  return { project, totalTables: savedFiles.length, schemasDir: SCHEMAS_DIR, tables: savedFiles };
}

// --- CLI Router ---

const COMMANDS = {
  'list-datasets': {
    fn: listDatasets,
    desc: 'List all datasets in the project',
  },
  'list-tables': {
    fn: listTables,
    desc: 'List tables in a dataset (--dataset)',
  },
  'get-schema': {
    fn: getSchema,
    desc: 'Get table schema (--dataset, --table)',
  },
  'query': {
    fn: query,
    desc: 'Run a SQL query (first positional arg is SQL) [--limit]',
    positional: true,
  },
  'scan-all-schemas': {
    fn: scanAllSchemas,
    desc: 'Scan all datasets/tables, save schemas to references/schemas/',
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

  const commandArgs = args.slice(1);
  const flags = parseFlags(commandArgs);

  // Collect positional args (non-flag arguments)
  const positionalArgs = commandArgs.filter(
    (arg, i) =>
      !arg.startsWith('--') &&
      (i === 0 || commandArgs[i - 1].startsWith('--') === false || commandArgs[i - 1].startsWith('--')),
  ).filter(arg => {
    // Exclude values that are flag values
    for (let i = 0; i < commandArgs.length; i++) {
      if (commandArgs[i].startsWith('--') && commandArgs[i + 1] === arg) {
        return false;
      }
    }
    return true;
  });

  try {
    const cmd = COMMANDS[command];
    const result = cmd.positional
      ? await cmd.fn(flags, positionalArgs)
      : await cmd.fn(flags);
    success(result);
  } catch (err) {
    error(err);
  }
}

main();
