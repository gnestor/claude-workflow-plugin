#!/usr/bin/env node

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { graphqlRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMAS_DIR = join(__dirname, '..', 'references', 'schemas');

const SERVICE = 'shopify';

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

async function runQuery(queryStr, variables) {
  const vars = variables ? JSON.parse(variables) : {};
  return await graphqlRequest(SERVICE, queryStr, vars);
}

async function introspect() {
  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        types {
          kind name description
          fields(includeDeprecated: true) {
            name description isDeprecated deprecationReason
            args { name description type { ...TypeRef } defaultValue }
            type { ...TypeRef }
          }
          inputFields { name description type { ...TypeRef } defaultValue }
          interfaces { ...TypeRef }
          enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason }
          possibleTypes { ...TypeRef }
        }
      }
    }
    fragment TypeRef on __Type {
      kind name
      ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
    }
  `;

  const result = await graphqlRequest(SERVICE, introspectionQuery);
  await mkdir(SCHEMAS_DIR, { recursive: true });
  await writeFile(join(SCHEMAS_DIR, 'introspection.json'), JSON.stringify(result, null, 2));

  const typesCount = result.__schema?.types?.length || 0;
  return { typesCount, schemasDir: SCHEMAS_DIR };
}

// --- CLI Router ---

const COMMANDS = {
  'query': {
    desc: 'Execute a GraphQL query (<graphql-string>) [--variables <json>]',
  },
  'mutation': {
    desc: 'Execute a GraphQL mutation (<graphql-string>) [--variables <json>]',
  },
  'introspect': {
    desc: 'Fetch and cache GraphQL schema to references/schemas/',
  },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Shopify GraphQL CLI\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map(k => k.length));
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(maxLen + 2)}${desc}`);
  }
  console.log('\nExamples:');
  console.log('  client.js query \'{ shop { name url } }\'');
  console.log('  client.js query \'{ orders(first: 10) { nodes { id name createdAt } } }\'');
  console.log('  client.js mutation \'mutation { productCreate(input: {title: "Test"}) { product { id } userErrors { field message } } }\'');
  console.log('  client.js query \'query($first: Int!) { products(first: $first) { nodes { id title } } }\' --variables \'{"first": 5}\'');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'query':
      case 'mutation': {
        const queryStr = args[1];
        if (!queryStr) {
          console.error('Usage: client.js query|mutation <graphql-string> [--variables <json>]');
          process.exit(1);
        }
        const flags = parseFlags(args.slice(2));
        const result = await runQuery(queryStr, flags.variables);
        success(result);
        break;
      }
      case 'introspect': {
        const result = await introspect();
        success(result);
        break;
      }
      default:
        if (command) console.error(`Unknown command: ${command}\n`);
        printUsage();
        process.exit(command ? 1 : 0);
    }
  } catch (err) {
    error(err);
  }
}

main();
