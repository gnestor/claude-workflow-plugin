/**
 * Local credential management.
 *
 * Stores credentials in an encrypted JSON file at ~/.config/workflow-plugin/credentials.enc.
 * Encryption: AES-256-GCM with a key stored at ~/.config/workflow-plugin/auth.key.
 * For OAuth services, refreshes tokens inline when expired.
 *
 * No server process needed — this is a library imported by client scripts.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from "node:fs";
import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from "node:crypto";
import { join } from "node:path";
import { homedir } from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const CONFIG_DIR = join(homedir(), ".config", "workflow-plugin");
const KEY_PATH = join(CONFIG_DIR, "auth.key");
const CREDS_PATH = join(CONFIG_DIR, "credentials.enc");

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SERVICES_PATH = join(__dirname, "services.json");

// ---------------------------------------------------------------------------
// Service registry
// ---------------------------------------------------------------------------

let _services = null;

function getServiceRegistry() {
  if (!_services) {
    _services = JSON.parse(readFileSync(SERVICES_PATH, "utf-8"));
  }
  return _services;
}

export function getServiceConfig(service) {
  const registry = getServiceRegistry();

  // Check direct match
  if (registry[service]) return registry[service];

  // Check aliases (e.g. google-workspace → google)
  for (const [key, config] of Object.entries(registry)) {
    if (config.aliases?.includes(service)) {
      return { ...config, _resolvedFrom: key };
    }
  }

  // Check parentService (e.g. google-ads has parentService: google)
  if (registry[service]?.parentService) {
    return registry[service];
  }

  return null;
}

// ---------------------------------------------------------------------------
// Encryption key management
// ---------------------------------------------------------------------------

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

function getOrCreateKey() {
  ensureConfigDir();

  if (existsSync(KEY_PATH)) {
    return readFileSync(KEY_PATH);
  }

  // Generate a random 256-bit key
  const key = randomBytes(32);
  writeFileSync(KEY_PATH, key, { mode: 0o600 });
  chmodSync(KEY_PATH, 0o600);
  return key;
}

// ---------------------------------------------------------------------------
// Encrypted storage
// ---------------------------------------------------------------------------

function readStore() {
  if (!existsSync(CREDS_PATH)) return {};

  const key = getOrCreateKey();
  const raw = readFileSync(CREDS_PATH);

  if (raw.length < 28) return {}; // Too small to be valid (12 IV + 16 tag minimum)

  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted;
  try {
    decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  } catch {
    // Corrupted or wrong key — start fresh
    return {};
  }

  return JSON.parse(decrypted.toString("utf-8"));
}

function writeStore(data) {
  ensureConfigDir();

  const key = getOrCreateKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const json = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(json, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  writeFileSync(CREDS_PATH, Buffer.concat([iv, tag, encrypted]), { mode: 0o600 });
  chmodSync(CREDS_PATH, 0o600);
}

// ---------------------------------------------------------------------------
// Credential CRUD
// ---------------------------------------------------------------------------

export function setCredentials(service, credentials) {
  const store = readStore();
  store[service] = credentials;
  writeStore(store);
}

export function getRawCredentials(service) {
  const store = readStore();

  // Direct match
  if (store[service]) return store[service];

  // Check if this service uses a parent service's OAuth (e.g. google-workspace → google)
  const config = getServiceConfig(service);
  if (config?._resolvedFrom && store[config._resolvedFrom]) {
    return store[config._resolvedFrom];
  }
  if (config?.parentService && store[config.parentService]) {
    // Merge parent OAuth creds with service-specific creds
    return { ...store[config.parentService], ...store[service] };
  }

  return null;
}

export function deleteCredentials(service) {
  const store = readStore();
  delete store[service];
  writeStore(store);
}

export function listAllCredentials() {
  return readStore();
}

// ---------------------------------------------------------------------------
// OAuth token refresh
// ---------------------------------------------------------------------------

async function refreshOAuthToken(service, creds) {
  const config = getServiceConfig(service);
  if (!config) throw new Error(`Unknown service: ${service}`);

  let data;

  if (creds.client_id && creds.client_secret) {
    // User has their own OAuth app credentials — refresh directly
    const tokenUrl = config.tokenUrl;
    if (!tokenUrl) throw new Error(`No token URL for service: ${service}`);

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: creds.refresh_token,
    });

    const headers = { "Content-Type": "application/x-www-form-urlencoded" };

    if (service === "pinterest" || config.name === "Pinterest") {
      const basic = Buffer.from(`${creds.client_id}:${creds.client_secret}`).toString("base64");
      headers["Authorization"] = `Basic ${basic}`;
    } else {
      body.set("client_id", creds.client_id);
      body.set("client_secret", creds.client_secret);
    }

    const res = await fetch(tokenUrl, { method: "POST", headers, body });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token refresh failed for ${service}: ${text}`);
    }
    data = await res.json();
  } else if (config.oauthProxy) {
    // No local client credentials — refresh via OAuth proxy
    const proxyUrl = `${config.oauthProxy}/oauth/refresh/${service}`;
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: creds.refresh_token }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token refresh via proxy failed for ${service}: ${text}`);
    }
    data = await res.json();
  } else {
    throw new Error(`Cannot refresh token for ${service}: no client credentials and no OAuth proxy configured`);
  }

  // Update stored credentials
  const updated = {
    ...creds,
    access_token: data.access_token,
    token_expiry: Date.now() + (data.expires_in || 3600) * 1000,
  };

  // Some services return a new refresh token
  if (data.refresh_token) {
    updated.refresh_token = data.refresh_token;
  }

  // Store under the resolved service name
  const resolvedConfig = getServiceConfig(service);
  const storageKey = resolvedConfig?._resolvedFrom || resolvedConfig?.parentService || service;
  setCredentials(storageKey, updated);

  return updated;
}

// ---------------------------------------------------------------------------
// Get credentials ready for API calls
// ---------------------------------------------------------------------------

/**
 * Returns { baseUrl, headers, metadata } ready for making API requests.
 * For OAuth services, refreshes the token if expired (60-second buffer).
 */
export async function getCredentials(service) {
  let creds = getRawCredentials(service);
  if (!creds) {
    throw new Error(
      `No credentials found for ${service}. Run: node auth/setup.js ${service}`
    );
  }

  const config = getServiceConfig(service);
  if (!config) throw new Error(`Unknown service: ${service}`);

  // Handle OAuth token refresh
  const isOAuth = config.authType === "oauth2" || config.parentService;
  if (isOAuth && creds.refresh_token && creds.token_expiry) {
    const buffer = 60_000; // Refresh 60 seconds before expiry
    if (Date.now() > creds.token_expiry - buffer) {
      const resolvedService = config._resolvedFrom || config.parentService || service;
      creds = await refreshOAuthToken(resolvedService, creds);
    }
  }

  // Build baseUrl with credential substitution
  let baseUrl = config.baseUrl || "";
  for (const [key, val] of Object.entries(creds)) {
    baseUrl = baseUrl.replace(`{${key}}`, val);
  }

  // Build headers
  const headers = { ...(config.defaultHeaders || {}) };

  if (config.auth?.type === "header") {
    let value = config.auth.value;
    for (const [key, val] of Object.entries(creds)) {
      value = value.replace(`{${key}}`, val);
    }
    // Handle special base64 encoding
    if (value.includes("{base64:")) {
      const match = value.match(/\{base64:([^}]+)\}/);
      if (match) {
        let content = match[1];
        for (const [key, val] of Object.entries(creds)) {
          content = content.replace(`{${key}}`, val);
        }
        value = value.replace(match[0], Buffer.from(content).toString("base64"));
      }
    }
    headers[config.auth.header] = value;
  } else if (config.auth?.type === "headers") {
    for (const [header, template] of Object.entries(config.auth.headers)) {
      let value = template;
      for (const [key, val] of Object.entries(creds)) {
        value = value.replace(`{${key}}`, val);
      }
      headers[header] = value;
    }
  }

  // Build query params for token-param auth
  let queryParams = {};
  if (config.auth?.type === "query-param") {
    let value = config.auth.value;
    for (const [key, val] of Object.entries(creds)) {
      value = value.replace(`{${key}}`, val);
    }
    queryParams[config.auth.param] = value;
  }

  return {
    service,
    baseUrl,
    headers,
    queryParams,
    metadata: {
      ...Object.fromEntries(
        Object.entries(creds).filter(([k]) => !["access_token", "refresh_token", "token_expiry", "client_id", "client_secret", "api_key", "api_token"].includes(k))
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Service listing
// ---------------------------------------------------------------------------

export function listServices() {
  const registry = getServiceRegistry();
  const store = readStore();
  const result = [];

  for (const [key, config] of Object.entries(registry)) {
    if (config.aliases) continue; // Skip alias entries in listing — they show under the parent

    const hasCredentials = !!store[key];
    result.push({
      service: key,
      name: config.name,
      category: config.category,
      connected: hasCredentials,
      authType: config.authType,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Connection test
// ---------------------------------------------------------------------------

export async function testConnection(service) {
  try {
    const creds = await getCredentials(service);
    const config = getServiceConfig(service);
    if (!config?.testEndpoint) return { success: true, message: "No test endpoint configured" };

    let url;
    if (config.testEndpoint.url) {
      url = config.testEndpoint.url;
    } else {
      url = `${creds.baseUrl}${config.testEndpoint.path}`;
    }

    // Replace any remaining credential placeholders in the URL
    const raw = getRawCredentials(service);
    if (raw) {
      for (const [key, val] of Object.entries(raw)) {
        url = url.replace(`{${key}}`, val);
      }
    }

    // Append query params
    if (Object.keys(creds.queryParams).length > 0) {
      const separator = url.includes("?") ? "&" : "?";
      const params = new URLSearchParams(creds.queryParams);
      url = `${url}${separator}${params}`;
    }

    const res = await fetch(url, {
      method: config.testEndpoint.method || "GET",
      headers: creds.headers,
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    return { success: true, message: `Connected to ${config.name}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
