#!/usr/bin/env node

import pg from 'pg';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getRawCredentials } from '../../../lib/auth.js';
import { success, error } from '../../../lib/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMAS_DIR = join(__dirname, '..', 'references', 'schemas');

const { Client } = pg;

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

function getConnectionString() {
  const creds = getRawCredentials('postgresql');
  if (!creds?.database_url) throw new Error('No PostgreSQL credentials. Run: node auth/setup.js postgresql');
  return creds.database_url;
}

async function executeQuery(sql, params = []) {
  const client = new Client({ connectionString: getConnectionString() });
  try {
    await client.connect();
    const result = await client.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })),
    };
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function query(flags, positionalArgs) {
  const sql = positionalArgs[0];
  if (!sql) throw new Error('SQL query is required as the first positional argument after "query"');
  const params = flags.params ? JSON.parse(flags.params) : [];
  return await executeQuery(sql, params);
}

async function listTables() {
  const sql = `
    SELECT table_schema, table_name, table_type
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
  `;
  return await executeQuery(sql);
}

async function getSchema(flags) {
  if (!flags.table) throw new Error('--table is required');
  const schema = flags.schema || 'public';
  const sql = `
    SELECT column_name, data_type, is_nullable, column_default, character_maximum_length,
           numeric_precision, numeric_scale, udt_name
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position
  `;
  return await executeQuery(sql, [schema, flags.table]);
}

async function scanAll() {
  await mkdir(SCHEMAS_DIR, { recursive: true });

  const tablesResult = await executeQuery(`
    SELECT table_schema, table_name, table_type
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
  `);

  const savedFiles = [];

  for (const table of tablesResult.rows) {
    const columnsResult = await executeQuery(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length,
             numeric_precision, numeric_scale, udt_name
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [table.table_schema, table.table_name]);

    const columns = columnsResult.rows;

    // Introspect JSONB/JSON columns inline
    for (const col of columns) {
      if (col.udt_name === 'jsonb' || col.udt_name === 'json') {
        try {
          const sampleResult = await executeQuery(`
            SELECT "${col.column_name}"
            FROM "${table.table_schema}"."${table.table_name}"
            WHERE "${col.column_name}" IS NOT NULL
            LIMIT 5
          `);
          const keys = new Map();
          for (const row of sampleResult.rows) {
            const value = row[col.column_name];
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              for (const [k, v] of Object.entries(value)) {
                const type = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
                if (!keys.has(k)) keys.set(k, { types: new Set(), samples: [] });
                keys.get(k).types.add(type);
                if (keys.get(k).samples.length < 3 && v !== null) {
                  keys.get(k).samples.push(v);
                }
              }
            }
          }
          const jsonSchema = {};
          for (const [k, info] of keys) {
            jsonSchema[k] = { types: [...info.types], samples: info.samples };
          }
          col.jsonSchema = jsonSchema;
        } catch {
          // Skip introspection if table is inaccessible
        }
      }
    }

    const schema = {
      table: table.table_name,
      schema: table.table_schema,
      type: table.table_type,
      columns,
    };

    const fileName = `${table.table_name}.json`;
    await writeFile(join(SCHEMAS_DIR, fileName), JSON.stringify(schema, null, 2));
    savedFiles.push(table.table_name);
  }

  return { totalTables: savedFiles.length, schemasDir: SCHEMAS_DIR, tables: savedFiles };
}

async function introspectJson(flags) {
  if (!flags.table) throw new Error('--table is required');
  if (!flags.column) throw new Error('--column is required');
  const limit = flags.limit ? parseInt(flags.limit, 10) : 10;
  const schema = flags.schema || 'public';

  // Sample rows to infer JSON structure
  const sql = `
    SELECT "${flags.column}"
    FROM "${schema}"."${flags.table}"
    WHERE "${flags.column}" IS NOT NULL
    LIMIT $1
  `;
  const result = await executeQuery(sql, [limit]);

  // Infer structure from sampled values
  const keys = new Map();

  for (const row of result.rows) {
    const value = row[flags.column];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of Object.entries(value)) {
        const type = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
        if (!keys.has(k)) {
          keys.set(k, { types: new Set(), sampleValues: [] });
        }
        keys.get(k).types.add(type);
        if (keys.get(k).sampleValues.length < 3 && v !== null) {
          keys.get(k).sampleValues.push(v);
        }
      }
    }
  }

  const structure = {};
  for (const [k, info] of keys) {
    structure[k] = {
      types: [...info.types],
      sampleValues: info.sampleValues,
    };
  }

  return {
    table: `${schema}.${flags.table}`,
    column: flags.column,
    sampledRows: result.rows.length,
    structure,
  };
}

// ---------------------------------------------------------------------------
// CLI Router
// ---------------------------------------------------------------------------

const COMMANDS = {
  'query': {
    fn: query,
    desc: 'Execute a SQL query (first positional arg is SQL) [--params JSON_ARRAY]',
    positional: true,
  },
  'list-tables': {
    fn: listTables,
    desc: 'List all user tables across schemas',
  },
  'get-schema': {
    fn: getSchema,
    desc: 'Get column details for a table (--table) [--schema, default: public]',
  },
  'scan-all': {
    fn: scanAll,
    desc: 'Scan all tables, save schemas to references/schemas/',
  },
  'introspect-json': {
    fn: introspectJson,
    desc: 'Infer JSON structure from a JSON/JSONB column (--table, --column) [--schema, --limit]',
  },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map(k => k.length));
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(maxLen + 2)}${desc}`);
  }
  console.log('\nExamples:');
  console.log('  client.js query "SELECT * FROM users LIMIT 10"');
  console.log('  client.js query "SELECT * FROM users WHERE id = $1" --params \'[42]\'');
  console.log('  client.js list-tables');
  console.log('  client.js get-schema --table users');
  console.log('  client.js get-schema --table users --schema myschema');
  console.log('  client.js scan-all');
  console.log('  client.js introspect-json --table events --column payload --limit 20');
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

  // Collect positional args (non-flag arguments that are not flag values)
  const positionalArgs = commandArgs.filter((arg, i) => {
    if (arg.startsWith('--')) return false;
    // Exclude values that are flag values
    for (let j = 0; j < commandArgs.length; j++) {
      if (commandArgs[j].startsWith('--') && commandArgs[j + 1] === arg) {
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
