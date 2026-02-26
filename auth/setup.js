#!/usr/bin/env node

/**
 * Auth setup CLI — connect services, migrate from .env, test connections.
 *
 * Usage:
 *   node auth/setup.js google              # OAuth flow via proxy
 *   node auth/setup.js gorgias             # Prompt for API key credentials
 *   node auth/setup.js --migrate           # Import from .env
 *   node auth/setup.js --list              # Show all services and status
 *   node auth/setup.js --test gorgias      # Test connectivity
 *   node auth/setup.js --remove gorgias    # Delete stored credentials
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIB_DIR = join(__dirname, "..", "lib");

const {
  getServiceConfig,
  setCredentials,
  getRawCredentials,
  deleteCredentials,
  listServices,
  testConnection,
} = await import(join(LIB_DIR, "auth.js"));

const servicesJson = JSON.parse(readFileSync(join(LIB_DIR, "services.json"), "utf-8"));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function openBrowser(url) {
  try {
    if (process.platform === "darwin") {
      execFileSync("open", [url]);
    } else if (process.platform === "linux") {
      execFileSync("xdg-open", [url]);
    } else {
      execFileSync("cmd", ["/c", "start", url]);
    }
  } catch {
    console.error(`Please open this URL in your browser:\n${url}`);
  }
}

// ---------------------------------------------------------------------------
// .env migration
// ---------------------------------------------------------------------------

async function migrateFromEnv() {
  // Look for .env in the plugin root
  const envPath = join(__dirname, "..", ".env");
  if (!existsSync(envPath)) {
    console.error("No .env file found at", envPath);
    process.exit(1);
  }

  const envContent = readFileSync(envPath, "utf-8");
  const envVars = {};

  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }

  // Map env vars to service credentials
  const imported = {};

  for (const [serviceKey, config] of Object.entries(servicesJson)) {
    if (!config.envMap) continue;

    const creds = {};
    let found = false;

    for (const [envVar, credKey] of Object.entries(config.envMap)) {
      if (envVars[envVar]) {
        creds[credKey] = envVars[envVar];
        found = true;
      }
    }

    if (found) {
      // Merge with any existing credentials
      const existing = getRawCredentials(serviceKey) || {};
      setCredentials(serviceKey, { ...existing, ...creds });
      imported[serviceKey] = Object.keys(creds);
    }
  }

  if (Object.keys(imported).length === 0) {
    console.log("No matching credentials found in .env");
    return;
  }

  console.log("\nImported credentials:");
  for (const [service, keys] of Object.entries(imported)) {
    console.log(`  ${service}: ${keys.join(", ")}`);
  }
  console.log(`\nTotal: ${Object.keys(imported).length} services imported`);
}

// ---------------------------------------------------------------------------
// API key setup (interactive prompt)
// ---------------------------------------------------------------------------

async function setupApiKey(service) {
  const config = servicesJson[service];
  if (!config) {
    console.error(`Unknown service: ${service}`);
    process.exit(1);
  }

  console.log(`\nSetting up ${config.name}`);
  console.log("─".repeat(40));

  const creds = {};

  for (const cred of config.credentials) {
    if (cred.auto) continue; // Skip auto-populated fields (e.g. access_token for OAuth)

    if (cred.help) console.log(`  ${cred.help}`);
    const value = await prompt(`  ${cred.label}: `);

    if (!value) {
      console.error(`  ${cred.label} is required`);
      process.exit(1);
    }

    creds[cred.key] = value;
  }

  setCredentials(service, creds);
  console.log(`\nCredentials saved for ${config.name}`);

  // Test connection
  console.log("Testing connection...");
  const result = await testConnection(service);
  if (result.success) {
    console.log(`Connected to ${config.name}`);
  } else {
    console.error(`Connection failed: ${result.error}`);
    console.error("Credentials were saved. You can re-run setup to update them.");
  }
}

// ---------------------------------------------------------------------------
// OAuth setup (via proxy)
// ---------------------------------------------------------------------------

async function setupOAuth(service) {
  const config = servicesJson[service];
  if (!config?.oauthProxy) {
    console.error(`No OAuth proxy configured for ${service}`);
    process.exit(1);
  }

  const sessionId = randomBytes(16).toString("hex");
  const startUrl = `${config.oauthProxy}/oauth/start/${service}?session=${sessionId}`;

  console.log(`\nStarting OAuth flow for ${config.name}...`);
  console.log("Opening browser for authorization...\n");

  openBrowser(startUrl);

  console.log("Waiting for authorization...");

  // Poll for tokens
  const pollUrl = `${config.oauthProxy}/oauth/tokens/${sessionId}`;
  const maxAttempts = 60; // 5 minutes at 5-second intervals
  const pollInterval = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));

    try {
      const res = await fetch(pollUrl);
      if (res.status === 200) {
        const tokens = await res.json();

        const creds = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: Date.now() + (tokens.expires_in || 3600) * 1000,
        };

        // Merge with existing service-specific creds
        const existing = getRawCredentials(service) || {};
        setCredentials(service, { ...existing, ...creds });

        console.log(`\nOAuth complete. Credentials saved for ${config.name}`);

        // Test connection
        console.log("Testing connection...");
        const result = await testConnection(service);
        if (result.success) {
          console.log(`Connected to ${config.name}`);
        } else {
          console.error(`Connection test failed: ${result.error}`);
          console.error("Tokens were saved. They may still work for specific APIs.");
        }

        return;
      }
      // 404 = not ready yet, keep polling
    } catch {
      // Network error, keep polling
    }

    process.stderr.write(".");
  }

  console.error("\n\nOAuth timed out. Please try again.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function showList() {
  const services = listServices();
  console.log("\nServices:");
  console.log("─".repeat(50));

  for (const svc of services) {
    const status = svc.connected ? "connected" : "not configured";
    const icon = svc.connected ? "+" : "-";
    console.log(`  ${icon} ${svc.name.padEnd(20)} ${svc.category.padEnd(20)} ${status}`);
  }

  console.log("");
}

async function testService(service) {
  console.log(`Testing ${service}...`);
  const result = await testConnection(service);
  console.log(JSON.stringify(result, null, 2));
}

async function removeService(service) {
  deleteCredentials(service);
  console.log(`Credentials removed for ${service}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help") {
    console.log(`
Usage:
  node auth/setup.js <service>      Connect a service
  node auth/setup.js --migrate      Import credentials from .env
  node auth/setup.js --list         Show all services
  node auth/setup.js --test <svc>   Test a service connection
  node auth/setup.js --remove <svc> Remove stored credentials

Services: ${Object.keys(servicesJson).filter((k) => !servicesJson[k].aliases).join(", ")}
`);
    return;
  }

  if (args[0] === "--migrate") {
    await migrateFromEnv();
    return;
  }

  if (args[0] === "--list") {
    await showList();
    return;
  }

  if (args[0] === "--test") {
    if (!args[1]) {
      console.error("Usage: node auth/setup.js --test <service>");
      process.exit(1);
    }
    await testService(args[1]);
    return;
  }

  if (args[0] === "--remove") {
    if (!args[1]) {
      console.error("Usage: node auth/setup.js --remove <service>");
      process.exit(1);
    }
    await removeService(args[1]);
    return;
  }

  // Connect a service
  const service = args[0];
  const config = servicesJson[service];

  if (!config) {
    console.error(`Unknown service: ${service}`);
    console.error(`Available: ${Object.keys(servicesJson).filter((k) => !servicesJson[k].aliases).join(", ")}`);
    process.exit(1);
  }

  if (config.authType === "oauth2" && config.oauthProxy) {
    await setupOAuth(service);
  } else {
    await setupApiKey(service);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
