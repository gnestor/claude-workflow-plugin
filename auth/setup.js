#!/usr/bin/env node

/**
 * Auth setup CLI — connect services to the cloud vault (default) or local store.
 *
 * Usage:
 *   node auth/setup.js --login             # Authenticate with the proxy (required first)
 *   node auth/setup.js air                 # Connect Air (prompts, pushes to vault)
 *   node auth/setup.js google              # Connect Google (OAuth, stores in vault)
 *   node auth/setup.js --migrate [path]    # Push .env credentials to vault
 *   node auth/setup.js --list              # Show all services and local status
 *   node auth/setup.js --test <svc>        # Test local connection
 *   node auth/setup.js --remove <svc>      # Remove from vault
 *
 * Add --local to any command to use local encrypted storage instead of vault:
 *   node auth/setup.js --local air         # Store locally in ~/.config/workflow-plugin/
 *   node auth/setup.js --local --migrate   # Import .env into local store
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

const PROXY_URL = "https://workflow-auth.hammies.workers.dev";

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

function getProxyToken() {
  const proxyCreds = getRawCredentials("_proxy");
  if (!proxyCreds?.proxyToken) {
    console.error("Not logged in to proxy. Run: node auth/setup.js --login");
    process.exit(1);
  }
  return proxyCreds;
}

/**
 * Prompt for credential values defined in a service's `credentials` array.
 * Skips auto-populated fields (e.g. access_token for OAuth).
 */
async function promptCredentials(service) {
  const config = servicesJson[service];
  console.log(`\nSetting up ${config.name}`);
  console.log("─".repeat(40));

  const creds = {};
  for (const cred of config.credentials) {
    if (cred.auto) continue;
    if (cred.help) console.log(`  ${cred.help}`);
    const value = await prompt(`  ${cred.label}: `);
    if (!value) {
      console.error(`  ${cred.label} is required`);
      process.exit(1);
    }
    creds[cred.key] = value;
  }
  return creds;
}

/**
 * Run an OAuth flow and poll for tokens. Returns the token data.
 * If userId is provided, the proxy also stores tokens in the user's vault.
 */
async function runOAuthFlow(service, { userId } = {}) {
  const config = servicesJson[service];
  if (!config?.oauthProxy) {
    console.error(`No OAuth proxy configured for ${service}`);
    process.exit(1);
  }

  const sessionId = randomBytes(16).toString("hex");
  let startUrl = `${config.oauthProxy}/oauth/start/${service}?session=${sessionId}`;
  if (userId) startUrl += `&user=${encodeURIComponent(userId)}`;

  console.log(`\nStarting OAuth flow for ${config.name}...`);
  console.log("Opening browser for authorization...\n");
  openBrowser(startUrl);
  console.log("Waiting for authorization...");

  const pollUrl = `${config.oauthProxy}/oauth/tokens/${sessionId}`;
  const maxAttempts = 60;
  const pollInterval = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));
    try {
      const res = await fetch(pollUrl);
      if (res.status === 200) {
        const tokens = await res.json();
        return {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: Date.now() + (tokens.expires_in || 3600) * 1000,
          ...(tokens.realm_id ? { realm_id: tokens.realm_id } : {}),
        };
      }
    } catch {
      // Network error, keep polling
    }
    process.stderr.write(".");
  }

  console.error("\n\nOAuth timed out. Please try again.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// .env parsing
// ---------------------------------------------------------------------------

/**
 * Parse a .env file and map env vars to service credentials.
 * Returns { [serviceKey]: { credKey: value, ... } } for services with matches.
 */
function parseEnvFile(envPath) {
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }

  const matched = {};

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
      matched[serviceKey] = creds;
    }
  }

  return matched;
}

// ---------------------------------------------------------------------------
// Proxy login
// ---------------------------------------------------------------------------

async function proxyLogin() {
  const sessionId = randomBytes(16).toString("hex");
  const loginUrl = `${PROXY_URL}/auth/login?session=${sessionId}`;

  console.log("\nLogging in to workflow-auth proxy...");
  console.log("Opening browser for Google sign-in...\n");
  openBrowser(loginUrl);
  console.log("Waiting for authentication...");

  const pollUrl = `${PROXY_URL}/auth/token/${sessionId}`;
  const maxAttempts = 60;
  const pollInterval = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));
    try {
      const res = await fetch(pollUrl);
      if (res.status === 200) {
        const data = await res.json();
        setCredentials("_proxy", {
          proxyToken: data.proxyToken,
          userId: data.userId,
          email: data.email,
          name: data.name,
        });
        console.log(`\nLogged in as ${data.name || data.email}`);
        return;
      }
    } catch {
      // Network error, keep polling
    }
    process.stderr.write(".");
  }

  console.error("\n\nLogin timed out. Please try again.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Vault operations (default)
// ---------------------------------------------------------------------------

async function setupServiceVault(service) {
  const config = servicesJson[service];
  if (!config) {
    console.error(`Unknown service: ${service}`);
    console.error(`Available: ${Object.keys(servicesJson).filter((k) => !servicesJson[k].aliases).join(", ")}`);
    process.exit(1);
  }

  if (config.authType === "oauth2" && config.oauthProxy) {
    const { userId } = getProxyToken();
    const creds = await runOAuthFlow(service, { userId });

    // Also store locally for Claude Code use
    const existing = getRawCredentials(service) || {};
    setCredentials(service, { ...existing, ...creds });

    console.log(`\nCredentials saved in vault and locally for ${config.name}`);
  } else {
    const { proxyToken } = getProxyToken();
    const creds = await promptCredentials(service);

    const res = await fetch(`${PROXY_URL}/vault/${service}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${proxyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(creds),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      console.error(`\nFailed to push to vault: ${err.error}`);
      process.exit(1);
    }

    // Also store locally
    setCredentials(service, creds);
    console.log(`\nCredentials saved in vault and locally for ${config.name}`);
  }
}

async function migrateVault(envPath) {
  const resolved = envPath || join(__dirname, "..", ".env");
  const matched = parseEnvFile(resolved);

  if (Object.keys(matched).length === 0) {
    console.log("No matching credentials found in .env");
    return;
  }

  const { proxyToken } = getProxyToken();

  console.log("\nCredentials found in .env:");
  console.log("─".repeat(50));
  for (const [service, creds] of Object.entries(matched)) {
    const config = servicesJson[service];
    const name = config?.name || service;
    console.log(`  ${name.padEnd(20)} ${Object.keys(creds).join(", ")}`);
  }
  console.log(`\nTotal: ${Object.keys(matched).length} services`);

  const answer = await prompt("\nPush all to vault? (y/N) ");
  if (answer.toLowerCase() !== "y") {
    console.log("Aborted.");
    return;
  }

  let pushed = 0;
  let failed = 0;

  for (const [service, creds] of Object.entries(matched)) {
    const config = servicesJson[service];

    if (config?.authType === "oauth2") {
      console.log(`  Skipping ${config.name} (OAuth — run: node auth/setup.js ${service})`);
      continue;
    }

    try {
      const res = await fetch(`${PROXY_URL}/vault/${service}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${proxyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(creds),
      });

      if (res.ok) {
        // Also store locally
        const existing = getRawCredentials(service) || {};
        setCredentials(service, { ...existing, ...creds });
        console.log(`  Pushed ${config?.name || service}`);
        pushed++;
      } else {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        console.error(`  Failed ${config?.name || service}: ${err.error}`);
        failed++;
      }
    } catch (err) {
      console.error(`  Failed ${config?.name || service}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${pushed} pushed, ${failed} failed`);
}

async function removeServiceVault(service) {
  const { proxyToken } = getProxyToken();

  const res = await fetch(`${PROXY_URL}/vault/${service}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${proxyToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    console.error(`Failed to remove from vault: ${err.error}`);
  } else {
    console.log(`Removed ${service} from vault`);
  }

  // Also remove locally
  deleteCredentials(service);
  console.log(`Removed ${service} from local store`);
}

// ---------------------------------------------------------------------------
// Local-only operations (--local flag)
// ---------------------------------------------------------------------------

async function setupServiceLocal(service) {
  const config = servicesJson[service];
  if (!config) {
    console.error(`Unknown service: ${service}`);
    console.error(`Available: ${Object.keys(servicesJson).filter((k) => !servicesJson[k].aliases).join(", ")}`);
    process.exit(1);
  }

  if (config.authType === "oauth2" && config.oauthProxy) {
    const creds = await runOAuthFlow(service);
    const existing = getRawCredentials(service) || {};
    setCredentials(service, { ...existing, ...creds });
    console.log(`\nCredentials saved locally for ${config.name}`);

    console.log("Testing connection...");
    const result = await testConnection(service);
    if (result.success) {
      console.log(`Connected to ${config.name}`);
    } else {
      console.error(`Connection test failed: ${result.error}`);
    }
  } else {
    const creds = await promptCredentials(service);
    setCredentials(service, creds);
    console.log(`\nCredentials saved locally for ${config.name}`);

    console.log("Testing connection...");
    const result = await testConnection(service);
    if (result.success) {
      console.log(`Connected to ${config.name}`);
    } else {
      console.error(`Connection failed: ${result.error}`);
    }
  }
}

async function migrateLocal() {
  const envPath = join(__dirname, "..", ".env");
  const matched = parseEnvFile(envPath);

  if (Object.keys(matched).length === 0) {
    console.log("No matching credentials found in .env");
    return;
  }

  for (const [serviceKey, creds] of Object.entries(matched)) {
    const existing = getRawCredentials(serviceKey) || {};
    setCredentials(serviceKey, { ...existing, ...creds });
  }

  console.log("\nImported credentials:");
  for (const [service, creds] of Object.entries(matched)) {
    console.log(`  ${service}: ${Object.keys(creds).join(", ")}`);
  }
  console.log(`\nTotal: ${Object.keys(matched).length} services imported`);
}

// ---------------------------------------------------------------------------
// Commands (shared)
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const rawArgs = process.argv.slice(2);
  const local = rawArgs.includes("--local");
  const args = rawArgs.filter((a) => a !== "--local");

  if (args.length === 0 || args[0] === "--help") {
    console.log(`
Usage:
  node auth/setup.js --login            Authenticate with the proxy (required first)
  node auth/setup.js <service>          Connect a service (vault + local)
  node auth/setup.js --migrate [path]   Push .env credentials to vault + local
  node auth/setup.js --list             Show all services and local status
  node auth/setup.js --test <svc>       Test local connection
  node auth/setup.js --remove <svc>     Remove from vault and local

  Add --local to use local storage only (no vault):
    node auth/setup.js --local <service>
    node auth/setup.js --local --migrate

Services: ${Object.keys(servicesJson).filter((k) => !servicesJson[k].aliases).join(", ")}
`);
    return;
  }

  if (args[0] === "--login") {
    await proxyLogin();
    return;
  }

  if (args[0] === "--migrate") {
    if (local) {
      await migrateLocal();
    } else {
      await migrateVault(args[1]);
    }
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
    if (local) {
      deleteCredentials(args[1]);
      console.log(`Removed ${args[1]} from local store`);
    } else {
      await removeServiceVault(args[1]);
    }
    return;
  }

  // Connect a service
  const service = args[0];
  if (!servicesJson[service]) {
    console.error(`Unknown service: ${service}`);
    console.error(`Available: ${Object.keys(servicesJson).filter((k) => !servicesJson[k].aliases).join(", ")}`);
    process.exit(1);
  }

  if (local) {
    await setupServiceLocal(service);
  } else {
    await setupServiceVault(service);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
