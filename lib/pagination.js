/**
 * Pagination helpers for REST and GraphQL APIs.
 *
 * Handles cursor-based, offset-based, and GraphQL relay pagination patterns.
 */

import { apiRequest, graphqlRequest } from "./http.js";

/**
 * Fetch all pages from a cursor-paginated REST API.
 *
 * @param {string} service - Service name
 * @param {string} path - API path
 * @param {object} [opts]
 * @param {string} [opts.cursorParam] - Query param for cursor (default: "cursor")
 * @param {string} [opts.dataKey] - Key in response containing items (default: "data")
 * @param {string} [opts.cursorKey] - Key in response containing next cursor (default: "meta.next_cursor")
 * @param {number} [opts.pageSize] - Items per page
 * @param {string} [opts.pageSizeParam] - Query param for page size (default: "limit")
 * @param {number} [opts.maxPages] - Max pages to fetch (default: Infinity)
 * @param {object} [opts.params] - Additional query parameters
 * @returns {Promise<any[]>} All items across all pages
 */
export async function fetchAllPages(service, path, opts = {}) {
  const {
    cursorParam = "cursor",
    dataKey = "data",
    cursorKey = "meta.next_cursor",
    pageSize,
    pageSizeParam = "limit",
    maxPages = Infinity,
    params = {},
  } = opts;

  const allItems = [];
  let cursor = null;
  let page = 0;

  while (page < maxPages) {
    const queryParams = { ...params };
    if (cursor) queryParams[cursorParam] = cursor;
    if (pageSize) queryParams[pageSizeParam] = String(pageSize);

    const result = await apiRequest(service, path, { params: queryParams });

    // Extract items using dot-notation key
    const items = getNestedValue(result, dataKey);
    if (!items || !Array.isArray(items) || items.length === 0) break;

    allItems.push(...items);

    // Extract next cursor
    const nextCursor = getNestedValue(result, cursorKey);
    if (!nextCursor) break;

    cursor = nextCursor;
    page++;
  }

  return allItems;
}

/**
 * Fetch all pages from an offset-paginated REST API.
 *
 * @param {string} service - Service name
 * @param {string} path - API path
 * @param {object} [opts]
 * @param {string} [opts.offsetParam] - Query param for offset (default: "offset")
 * @param {string} [opts.dataKey] - Key in response containing items (default: "data")
 * @param {number} [opts.pageSize] - Items per page (default: 100)
 * @param {string} [opts.pageSizeParam] - Query param for page size (default: "limit")
 * @param {number} [opts.maxPages] - Max pages to fetch (default: Infinity)
 * @param {object} [opts.params] - Additional query parameters
 * @returns {Promise<any[]>} All items across all pages
 */
export async function fetchAllOffsetPages(service, path, opts = {}) {
  const {
    offsetParam = "offset",
    dataKey = "data",
    pageSize = 100,
    pageSizeParam = "limit",
    maxPages = Infinity,
    params = {},
  } = opts;

  const allItems = [];
  let offset = 0;
  let page = 0;

  while (page < maxPages) {
    const queryParams = { ...params };
    queryParams[offsetParam] = String(offset);
    queryParams[pageSizeParam] = String(pageSize);

    const result = await apiRequest(service, path, { params: queryParams });

    const items = getNestedValue(result, dataKey);
    if (!items || !Array.isArray(items) || items.length === 0) break;

    allItems.push(...items);

    if (items.length < pageSize) break; // Last page

    offset += items.length;
    page++;
  }

  return allItems;
}

/**
 * Fetch all pages from a GraphQL relay-style connection.
 *
 * @param {string} service - Service name
 * @param {string} query - GraphQL query with $after variable and pageInfo { hasNextPage endCursor }
 * @param {object} [opts]
 * @param {string} [opts.dataPath] - Dot-notation path to connection in response (e.g. "orders")
 * @param {number} [opts.maxPages] - Max pages to fetch (default: Infinity)
 * @param {object} [opts.variables] - Additional GraphQL variables
 * @param {object} [opts.requestOpts] - Additional options for graphqlRequest
 * @returns {Promise<any[]>} All nodes across all pages
 */
export async function fetchGraphQLPages(service, query, opts = {}) {
  const {
    dataPath,
    maxPages = Infinity,
    variables = {},
    requestOpts = {},
  } = opts;

  const allNodes = [];
  let cursor = null;
  let page = 0;

  while (page < maxPages) {
    const vars = { ...variables };
    if (cursor) vars.after = cursor;

    const data = await graphqlRequest(service, query, vars, requestOpts);

    // Navigate to the connection
    const connection = dataPath ? getNestedValue(data, dataPath) : data;
    if (!connection) break;

    // Extract nodes (support both edges/node and nodes patterns)
    let nodes;
    if (connection.nodes) {
      nodes = connection.nodes;
    } else if (connection.edges) {
      nodes = connection.edges.map((e) => e.node);
    } else {
      break;
    }

    if (nodes.length === 0) break;
    allNodes.push(...nodes);

    // Check for next page
    if (!connection.pageInfo?.hasNextPage) break;
    cursor = connection.pageInfo.endCursor;
    page++;
  }

  return allNodes;
}

/**
 * Access a nested value using dot-notation path.
 * e.g. getNestedValue(obj, "meta.next_cursor")
 */
function getNestedValue(obj, path) {
  return path.split(".").reduce((o, key) => o?.[key], obj);
}
