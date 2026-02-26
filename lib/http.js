/**
 * Authenticated HTTP client for service API calls.
 *
 * Wraps fetch with automatic credential loading, URL construction,
 * query-param auth injection, and retry with exponential backoff on 429/5xx.
 */

import { getCredentials } from "./auth.js";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Make an authenticated API request.
 *
 * @param {string} service - Service name from services.json
 * @param {string} path - API path (appended to baseUrl)
 * @param {object} [options] - Fetch options
 * @param {string} [options.method] - HTTP method (default: GET)
 * @param {object} [options.body] - Request body (will be JSON.stringify'd)
 * @param {object} [options.headers] - Additional headers (merged with auth headers)
 * @param {object} [options.params] - Query parameters
 * @param {boolean} [options.raw] - Return raw Response instead of parsed JSON
 * @param {number} [options.maxRetries] - Override max retries
 * @param {string} [options.baseUrl] - Override the service base URL
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiRequest(service, path, options = {}) {
  const creds = await getCredentials(service);

  const method = options.method || "GET";
  const maxRetries = options.maxRetries ?? MAX_RETRIES;

  // Build URL
  const base = options.baseUrl || creds.baseUrl;
  let url = `${base}${path}`;

  // Merge query params (auth params + caller params)
  const allParams = { ...creds.queryParams, ...options.params };
  if (Object.keys(allParams).length > 0) {
    const separator = url.includes("?") ? "&" : "?";
    const params = new URLSearchParams(allParams);
    url = `${url}${separator}${params}`;
  }

  // Build headers
  const headers = {
    ...creds.headers,
    ...options.headers,
  };

  // Build body
  let body = undefined;
  if (options.body !== undefined) {
    body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  // Retry loop
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }

    try {
      const res = await fetch(url, { method, headers, body });

      if (options.raw) return res;

      // Retry on 429 and 5xx
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        lastError = new Error(`HTTP ${res.status}: ${await res.text()}`);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.message || errorJson.error?.message || errorJson.error || text;
        } catch {
          errorMessage = text;
        }
        throw new Error(`HTTP ${res.status}: ${errorMessage}`);
      }

      // Handle empty responses (204, etc.)
      const contentType = res.headers.get("content-type") || "";
      if (res.status === 204 || !contentType.includes("json")) {
        const text = await res.text();
        return text ? text : { success: true };
      }

      return await res.json();
    } catch (err) {
      if (err.message?.startsWith("HTTP ") && attempt >= maxRetries) throw err;
      lastError = err;
      if (attempt >= maxRetries) throw lastError;
    }
  }

  throw lastError;
}

/**
 * Make a GraphQL request.
 *
 * @param {string} service - Service name
 * @param {string} query - GraphQL query string
 * @param {object} [variables] - GraphQL variables
 * @param {object} [options] - Additional options (baseUrl override, etc.)
 * @returns {Promise<any>} GraphQL response data
 */
export async function graphqlRequest(service, query, variables = {}, options = {}) {
  const body = { query };
  if (Object.keys(variables).length > 0) {
    body.variables = variables;
  }

  const path = options.path || "/graphql.json";

  const result = await apiRequest(service, path, {
    method: "POST",
    body,
    ...options,
  });

  if (result.errors?.length) {
    const messages = result.errors.map((e) => e.message).join("; ");
    throw new Error(`GraphQL error: ${messages}`);
  }

  return result.data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
